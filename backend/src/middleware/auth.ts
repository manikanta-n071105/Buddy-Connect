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

    // 2. If not cached, fetch fresh user details with relations in parallel with permissions
    const userSql = `
      SELECT u.id, u.name, u.email, u.username, u.role, u.special_role, u.is_active,
             COALESCE(u.is_cr, false) as is_cr,
             COALESCE(u.is_counselor, false) as is_counselor,
             COALESCE(u.is_disciplinary_committee, false) as is_disciplinary_committee,
             m.id as entity_mentor_id,
             f.id as entity_faculty_id,
             s.id as entity_senior_id,
             s.mentor_id as senior_mentor_id,
             j.id as entity_junior_id,
             j.senior_id as junior_senior_id,
             j.faculty_id as junior_faculty_id,
             js.mentor_id as junior_mentor_id
      FROM users u
      LEFT JOIN mentors m ON u.id = m.user_id
      LEFT JOIN faculty f ON u.id = f.user_id
      LEFT JOIN seniors s ON u.id = s.user_id
      LEFT JOIN juniors j ON u.id = j.user_id
      LEFT JOIN seniors js ON j.senior_id = js.id
      WHERE u.id = $1
    `;

    const [userRes, permRes] = await Promise.all([
      query(userSql, [payload.id]),
      query(`SELECT permission FROM admin_permissions WHERE user_id = $1`, [payload.id])
    ]);

    if (userRes.rowCount === 0 || !userRes.rows[0].is_active) {
      return res.status(401).json({ success: false, message: 'Account disabled or user not found', code: 'UNAUTHORIZED' });
    }

    const user = userRes.rows[0];
    let mentorId = payload.mentorId;
    let seniorId = payload.seniorId;
    let juniorId = payload.juniorId;
    let facultyId = payload.facultyId;

    // Load custom permissions from admin_permissions table
    const permissions: string[] = permRes.rows.map(r => r.permission);

    if (!mentorId && !seniorId && !juniorId && !facultyId) {
      if (user.role === 'MENTOR') {
        mentorId = user.entity_mentor_id || undefined;
      } else if (user.role === 'FACULTY') {
        facultyId = user.entity_faculty_id || undefined;
      } else if (user.role === 'SENIOR') {
        seniorId = user.entity_senior_id || undefined;
        mentorId = user.senior_mentor_id || undefined;
      } else if (user.role === 'JUNIOR') {
        juniorId = user.entity_junior_id || undefined;
        seniorId = user.junior_senior_id || undefined;
        mentorId = user.junior_mentor_id || undefined;
        facultyId = user.junior_faculty_id || undefined;
      }
    }

    const authUser: UserPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      special_role: user.special_role || '',
      specialRole: user.special_role || '',
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
