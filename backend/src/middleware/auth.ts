import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, UserRole, UserPayload } from '../types';
import { verifyAccessToken } from '../utils/jwt';
import { query } from '../config/db';
import { cache } from '../utils/cache';

export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required', code: 'UNAUTHORIZED' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyAccessToken(token);
    if (!payload || !payload.id) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token', code: 'UNAUTHORIZED' });
    }

    // 1. Check Distributed Redis / Memory Cache first (0ms DB Latency)
    const cacheKey = `user_auth:${payload.id}`;
    let cachedUser = await cache.get<UserPayload>(cacheKey);

    if (cachedUser) {
      req.user = cachedUser;
      return next();
    }

    // 2. If not cached, fetch fresh user details in single query & populate entity IDs
    const userRes = await query(
      `SELECT id, name, email, username, role, is_active, COALESCE(is_cr, false) as is_cr, COALESCE(is_counselor, false) as is_counselor, COALESCE(is_disciplinary_committee, false) as is_disciplinary_committee FROM users WHERE id = $1`,
      [payload.id]
    );

    if (userRes.rowCount === 0 || !userRes.rows[0].is_active) {
      return res.status(401).json({ success: false, message: 'Account disabled or user not found', code: 'UNAUTHORIZED' });
    }

    const user = userRes.rows[0];
    let mentorId = payload.mentorId;
    let seniorId = payload.seniorId;
    let juniorId = payload.juniorId;
    let facultyId = payload.facultyId;

    // Load custom permissions from admin_permissions table if needed
    const permRes = await query(`SELECT permission FROM admin_permissions WHERE user_id = $1`, [user.id]);
    const permissions: string[] = permRes.rows.map(r => r.permission);

    if (!mentorId && !seniorId && !juniorId && !facultyId) {
      if (user.role === 'MENTOR') {
        const mentorRes = await query(`SELECT id FROM mentors WHERE user_id = $1`, [user.id]);
        if (mentorRes.rowCount! > 0) mentorId = mentorRes.rows[0].id;
      } else if (user.role === 'FACULTY') {
        const facRes = await query(`SELECT id FROM faculty WHERE user_id = $1`, [user.id]);
        if (facRes.rowCount! > 0) facultyId = facRes.rows[0].id;
      } else if (user.role === 'SENIOR') {
        const senRes = await query(`SELECT id, mentor_id FROM seniors WHERE user_id = $1`, [user.id]);
        if (senRes.rowCount! > 0) {
          seniorId = senRes.rows[0].id;
          mentorId = senRes.rows[0].mentor_id;
        }
      } else if (user.role === 'JUNIOR') {
        const junRes = await query(
          `SELECT j.id, j.senior_id, j.faculty_id, s.mentor_id
           FROM juniors j
           LEFT JOIN seniors s ON j.senior_id = s.id
           WHERE j.user_id = $1`,
          [user.id]
        );
        if (junRes.rowCount! > 0) {
          juniorId = junRes.rows[0].id;
          seniorId = junRes.rows[0].senior_id;
          mentorId = junRes.rows[0].mentor_id;
          facultyId = junRes.rows[0].faculty_id;
        }
      }
    }

    const authUser: UserPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      is_cr: Boolean(user.is_cr),
      is_counselor: Boolean(user.is_counselor),
      is_disciplinary_committee: Boolean(user.is_disciplinary_committee),
      permissions,
      mentorId,
      seniorId,
      juniorId,
      facultyId
    };

    // Cache user context for 60 seconds to eliminate DB query amplification
    await cache.set(cacheKey, authUser, 60000);

    req.user = authUser;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token', code: 'UNAUTHORIZED' });
  }
};

export const authorizeRole = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || (!roles.includes(req.user.role) && req.user.role !== 'SUPER_ADMIN')) {
      return res.status(403).json({ success: false, message: 'Access denied for your role', code: 'FORBIDDEN' });
    }
    next();
  };
};

export const authorizePermission = (permission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    // Grant access if the user possesses the permission
    if (req.user.permissions?.includes(permission)) {
      return next();
    }

    return res.status(403).json({ success: false, message: `Permission '${permission}' required`, code: 'FORBIDDEN' });
  };
};
