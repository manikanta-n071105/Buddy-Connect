import { query } from '../config/db';
import { cache } from '../utils/cache';
import { UserPayload } from '../types';

export class UserService {
  /**
   * Fetch cached system setting with in-memory TTL caching
   */
  static async getSystemSetting(key: string, defaultValue: number): Promise<number> {
    const cachedVal = await cache.get<number>(`sys_setting:${key}`);
    if (cachedVal !== null) return cachedVal;

    const res = await query(`SELECT value FROM system_settings WHERE key = $1`, [key]);
    let val = defaultValue;
    if (res.rowCount! > 0) {
      val = parseInt(res.rows[0].value) || defaultValue;
    }
    await cache.set(`sys_setting:${key}`, val, 30000);
    return val;
  }

  /**
   * Get complete user authorization details with permissions and entity IDs
   */
  static async getUserAuthDetails(userId: string): Promise<UserPayload | null> {
    const cacheKey = `user_auth:${userId}`;
    const cachedUser = await cache.get<UserPayload>(cacheKey);
    if (cachedUser) return cachedUser;

    const userRes = await query(
      `SELECT id, name, email, username, role, is_active, COALESCE(is_cr, false) as is_cr, COALESCE(is_counselor, false) as is_counselor FROM users WHERE id = $1`,
      [userId]
    );

    if (userRes.rowCount === 0 || !userRes.rows[0].is_active) {
      return null;
    }

    const user = userRes.rows[0];
    let directorId: string | undefined;
    let seniorId: string | undefined;
    let juniorId: string | undefined;
    let facultyId: string | undefined;

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
         FROM juniors j LEFT JOIN seniors s ON j.senior_id = s.id WHERE j.user_id = $1`,
        [user.id]
      );
      if (junRes.rowCount! > 0) {
        juniorId = junRes.rows[0].id;
        seniorId = junRes.rows[0].senior_id;
        directorId = junRes.rows[0].director_id;
        facultyId = junRes.rows[0].faculty_id;
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
      permissions,
      directorId,
      seniorId,
      juniorId,
      facultyId
    };

    await cache.set(cacheKey, authUser, 60000);
    return authUser;
  }

  /**
   * Invalidate user authorization cache when permissions or role changes
   */
  static async invalidateUserCache(userId: string): Promise<void> {
    await cache.del(`user_auth:${userId}`);
  }
}
