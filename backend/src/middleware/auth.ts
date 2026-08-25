import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, UserRole } from '../types';
import { verifyAccessToken } from '../utils/jwt';
import { query } from '../config/db';

export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required', code: 'UNAUTHORIZED' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyAccessToken(token);
    
    // Fetch fresh details including entity IDs (Director, Senior, Junior) and custom permissions
    const userRes = await query(`SELECT id, name, email, username, role, is_active FROM users WHERE id = $1`, [payload.id]);
    if (userRes.rowCount === 0 || !userRes.rows[0].is_active) {
      return res.status(401).json({ success: false, message: 'Account disabled or user not found', code: 'UNAUTHORIZED' });
    }

    const user = userRes.rows[0];
    let directorId: string | undefined;
    let seniorId: string | undefined;
    let juniorId: string | undefined;
    let facultyId: string | undefined;

    // Load custom permissions from admin_permissions table for Admins, Directors, Seniors, and Faculty
    const permRes = await query(`SELECT permission FROM admin_permissions WHERE user_id = $1`, [user.id]);
    const permissions: string[] = permRes.rows.map(r => r.permission);

    if (user.role === 'DIRECTOR') {
      const dirRes = await query(`SELECT id FROM directors WHERE user_id = $1`, [user.id]);
      if (dirRes.rowCount! > 0) directorId = dirRes.rows[0].id;
    } else if (user.role === 'FACULTY') {
      const facRes = await query(`SELECT id FROM faculty WHERE user_id = $1`, [user.id]);
      if (facRes.rowCount! > 0) facultyId = facRes.rows[0].id;
    } else if (user.role === 'SENIOR') {
      const senRes = await query(`SELECT id, director_id FROM seniors WHERE user_id = $1`, [user.id]);
      if (senRes.rowCount! > 0) {
        seniorId = senRes.rows[0].id;
        directorId = senRes.rows[0].director_id;
      }
    } else if (user.role === 'JUNIOR') {
      const junRes = await query(
        `SELECT j.id, j.senior_id, j.faculty_id, s.director_id
         FROM juniors j
         LEFT JOIN seniors s ON j.senior_id = s.id
         WHERE j.user_id = $1`,
        [user.id]
      );
      if (junRes.rowCount! > 0) {
        juniorId = junRes.rows[0].id;
        seniorId = junRes.rows[0].senior_id;
        directorId = junRes.rows[0].director_id;
        facultyId = junRes.rows[0].faculty_id;
      }
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      permissions,
      directorId,
      seniorId,
      juniorId,
      facultyId
    };

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

    // Grant access if the user (Admin, Director, or Senior) possesses the permission
    if (req.user.permissions?.includes(permission)) {
      return next();
    }

    return res.status(403).json({ success: false, message: `Permission '${permission}' required`, code: 'FORBIDDEN' });
  };
};
