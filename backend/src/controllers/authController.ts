import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/db';
import { generateTokens, verifyRefreshToken } from '../utils/jwt';
import { AuthenticatedRequest } from '../types';
import { logAudit } from '../utils/audit';

export const login = async (req: Request, res: Response) => {
  const { usernameOrEmail, password } = req.body;

  if (!usernameOrEmail || !password) {
    return res.status(400).json({ success: false, message: 'Username/Email and password required', code: 'INVALID_INPUT' });
  }

  const cleanInput = usernameOrEmail.trim();

  try {
    const userRes = await query(
      `SELECT * FROM users WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1)`,
      [cleanInput]
    );

    if (userRes.rowCount === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
    }

    const user = userRes.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account is disabled. Please contact administrator.', code: 'ACCOUNT_DISABLED' });
    }

    const isValidPassword = await bcrypt.compare(password.trim(), user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
    }

    // Fetch entity specific IDs (mentorId, seniorId, juniorId, facultyId)
    let mentorId: string | undefined;
    let seniorId: string | undefined;
    let juniorId: string | undefined;
    let facultyId: string | undefined;
    let assignedJuniorsCount = 0;
    let residenceStatus: 'DAY_SCHOLAR' | 'HOSTELLER' | undefined;
    let studentYear: string | undefined;

    // Concurrently fetch role data, custom permissions, faculty record, and update last login in parallel
    const permPromise = query(`SELECT permission FROM admin_permissions WHERE user_id = $1`, [user.id]);
    const facPromise = query(`SELECT id FROM faculty WHERE user_id = $1`, [user.id]);
    const updateLoginPromise = query(`UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1`, [user.id]);

    let roleDataPromise: Promise<any> = Promise.resolve({ rowCount: 0, rows: [] });
    if (user.role === 'MENTOR') {
      roleDataPromise = query(`SELECT id FROM mentors WHERE user_id = $1`, [user.id]);
    } else if (user.role === 'SENIOR') {
      roleDataPromise = query(
        `SELECT s.id, s.mentor_id, s.residence_status, COUNT(j.id)::int as assigned_juniors_count
         FROM seniors s
         LEFT JOIN juniors j ON s.id = j.senior_id
         WHERE s.user_id = $1
         GROUP BY s.id, s.mentor_id, s.residence_status`,
        [user.id]
      );
    } else if (user.role === 'JUNIOR') {
      roleDataPromise = query(
        `SELECT j.id, j.senior_id, j.residence_status, j.year, s.mentor_id 
         FROM juniors j LEFT JOIN seniors s ON j.senior_id = s.id WHERE j.user_id = $1`,
        [user.id]
      );
    }

    const [permRes, facRes, roleRes] = await Promise.all([
      permPromise,
      facPromise,
      roleDataPromise,
      updateLoginPromise
    ]);

    const permissions: string[] = permRes.rows.map(r => r.permission);
    if (facRes.rowCount! > 0) {
      facultyId = facRes.rows[0].id;
    }

    if (user.role === 'MENTOR' && roleRes.rowCount! > 0) {
      mentorId = roleRes.rows[0].id;
    } else if (user.role === 'SENIOR' && roleRes.rowCount! > 0) {
      seniorId = roleRes.rows[0].id;
      mentorId = roleRes.rows[0].mentor_id;
      residenceStatus = roleRes.rows[0].residence_status;
      assignedJuniorsCount = roleRes.rows[0].assigned_juniors_count || 0;
    } else if (user.role === 'JUNIOR' && roleRes.rowCount! > 0) {
      juniorId = roleRes.rows[0].id;
      seniorId = roleRes.rows[0].senior_id;
      mentorId = roleRes.rows[0].mentor_id;
      residenceStatus = roleRes.rows[0].residence_status;
      studentYear = roleRes.rows[0].year;
    }

    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      permissions,
      mentorId,
      seniorId,
      juniorId,
      facultyId,
      assigned_juniors_count: assignedJuniorsCount,
      residence_status: residenceStatus,
      gender: user.gender,
      year: studentYear,
      is_faculty: Boolean(user.is_faculty || facultyId),
      is_cr: user.is_cr || false,
      is_counselor: user.is_counselor || false,
      blood_group: user.blood_group
    };

    const tokens = generateTokens(payload);

    await logAudit(user.id, 'USER_LOGIN', 'USER', user.id, { username: user.username }, req.ip);

    res.json({
      success: true,
      data: {
        user: {
          ...payload,
          mustChangePassword: user.must_change_password
        },
        tokens
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated', code: 'UNAUTHORIZED' });
  }

  try {
    const uRes = await query(`SELECT gender, must_change_password, blood_group, COALESCE(is_cr, false) as is_cr, COALESCE(is_counselor, false) as is_counselor FROM users WHERE id = $1`, [req.user.id]);
    const mustChangePassword = uRes.rows[0]?.must_change_password || false;
    const gender = uRes.rows[0]?.gender || req.user.gender;
    const isCr = uRes.rows[0]?.is_cr || false;
    const isCounselor = uRes.rows[0]?.is_counselor || false;
    const bloodGroup = uRes.rows[0]?.blood_group || req.user.blood_group;

    // Load fresh permissions for the user
    const permRes = await query(`SELECT permission FROM admin_permissions WHERE user_id = $1`, [req.user.id]);
    const freshPermissions = permRes.rows.map(r => r.permission);

    let assignedJuniorsCount = req.user.assigned_juniors_count || 0;
    let residenceStatus = req.user.residence_status;

    let studentYear = req.user.year;
    if (req.user.role === 'SENIOR' && req.user.seniorId) {
      const cntRes = await query(`SELECT COUNT(*) FROM juniors WHERE senior_id = $1`, [req.user.seniorId]);
      assignedJuniorsCount = parseInt(cntRes.rows[0].count);
      const senRes = await query(`SELECT residence_status FROM seniors WHERE user_id = $1`, [req.user.id]);
      if (senRes.rowCount! > 0) residenceStatus = senRes.rows[0].residence_status;
    } else if (req.user.role === 'JUNIOR') {
      const junRes = await query(`SELECT residence_status, year FROM juniors WHERE user_id = $1`, [req.user.id]);
      if (junRes.rowCount! > 0) {
        residenceStatus = junRes.rows[0].residence_status;
        studentYear = junRes.rows[0].year;
      }
    }

    res.json({
      success: true,
      data: {
        user: {
          ...req.user,
          permissions: freshPermissions,
          assigned_juniors_count: assignedJuniorsCount,
          residence_status: residenceStatus,
          year: studentYear,
          gender,
          blood_group: bloodGroup,
          is_faculty: Boolean(uRes.rows[0]?.is_faculty || req.user.facultyId),
          is_cr: isCr,
          is_counselor: isCounselor,
          mustChangePassword
        }
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

export const changePassword = async (req: AuthenticatedRequest, res: Response) => {
  const { currentPassword, newPassword, blood_group } = req.body;
  if (!newPassword) {
    return res.status(400).json({ success: false, message: 'New password is required', code: 'INVALID_INPUT' });
  }

  try {
    const userRes = await query(`SELECT password_hash, must_change_password FROM users WHERE id = $1`, [req.user!.id]);
    if (userRes.rowCount === 0) return res.status(404).json({ success: false, message: 'User not found', code: 'NOT_FOUND' });

    const user = userRes.rows[0];

    if (currentPassword) {
      const isValid = await bcrypt.compare(currentPassword.trim(), user.password_hash);
      if (!isValid) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect', code: 'INVALID_PASSWORD' });
      }
    }

    const hashed = await bcrypt.hash(newPassword.trim(), 10);
    if (blood_group && typeof blood_group === 'string') {
      await query(`UPDATE users SET password_hash = $1, blood_group = $2, must_change_password = false, updated_at = CURRENT_TIMESTAMP WHERE id = $3`, [hashed, blood_group.trim().toUpperCase(), req.user!.id]);
    } else {
      await query(`UPDATE users SET password_hash = $1, must_change_password = false, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [hashed, req.user!.id]);
    }

    await logAudit(req.user!.id, 'CHANGE_PASSWORD', 'USER', req.user!.id, { firstTimeSetup: user.must_change_password, blood_group: blood_group || null }, req.ip);

    res.json({ success: true, message: 'Personal password saved successfully! You can now use this password every time you log in.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken: token } = req.body;
  if (!token) return res.status(400).json({ success: false, message: 'Refresh token required', code: 'INVALID_INPUT' });

  try {
    const decoded = verifyRefreshToken(token);
    const userRes = await query(`SELECT id, name, email, username, role, is_active FROM users WHERE id = $1`, [decoded.id]);
    if (userRes.rowCount === 0 || !userRes.rows[0].is_active) {
      return res.status(401).json({ success: false, message: 'User not active or invalid', code: 'UNAUTHORIZED' });
    }

    const user = userRes.rows[0];
    let mentorId: string | undefined;
    let seniorId: string | undefined;
    let juniorId: string | undefined;

    // Load custom permissions for ALL roles from admin_permissions
    const permRes = await query(`SELECT permission FROM admin_permissions WHERE user_id = $1`, [user.id]);
    const permissions: string[] = permRes.rows.map(r => r.permission);

    if (user.role === 'MENTOR') {
      const mentorRes = await query(`SELECT id FROM mentors WHERE user_id = $1`, [user.id]);
      if (mentorRes.rowCount! > 0) mentorId = mentorRes.rows[0].id;
    } else if (user.role === 'SENIOR') {
      const senRes = await query(`SELECT id, mentor_id FROM seniors WHERE user_id = $1`, [user.id]);
      if (senRes.rowCount! > 0) {
        seniorId = senRes.rows[0].id;
        mentorId = senRes.rows[0].mentor_id;
      }
    } else if (user.role === 'JUNIOR') {
      const junRes = await query(`SELECT j.id, j.senior_id, s.mentor_id FROM juniors j JOIN seniors s ON j.senior_id = s.id WHERE j.user_id = $1`, [user.id]);
      if (junRes.rowCount! > 0) {
        juniorId = junRes.rows[0].id;
        seniorId = junRes.rows[0].senior_id;
        mentorId = junRes.rows[0].mentor_id;
      }
    }

    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      permissions,
      mentorId,
      seniorId,
      juniorId
    };

    const tokens = generateTokens(payload);
    res.json({ success: true, data: { tokens } });
  } catch (err: any) {
    res.status(401).json({ success: false, message: 'Invalid refresh token', code: 'UNAUTHORIZED' });
  }
};
