import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { query, executeTransaction } from '../config/db';
import { AuthenticatedRequest } from '../types';
import { logAudit } from '../utils/audit';

// Get Capacity helper
const getSettingValue = async (key: string, defaultValue: number): Promise<number> => {
  const res = await query(`SELECT value FROM system_settings WHERE key = $1`, [key]);
  if (res.rowCount === 0) return defaultValue;
  return parseInt(res.rows[0].value) || defaultValue;
};

// Migrate all existing user codes to DIR-??, SRS-??, and JRS-?? sequence format
const migrateExistingUserCodes = async () => {
  try {
    // 1. Update existing Directors
    const dirs = await query(`SELECT id FROM directors ORDER BY id ASC`);
    for (let i = 0; i < dirs.rows.length; i++) {
      const code = `DIR-${(i + 1).toString().padStart(2, '0')}`;
      await query(`UPDATE directors SET director_code = $1 WHERE id = $2`, [code, dirs.rows[i].id]);
    }

    // 2. Update existing Seniors
    const sens = await query(`SELECT id FROM seniors ORDER BY id ASC`);
    for (let i = 0; i < sens.rows.length; i++) {
      const code = `SRS-${(i + 1).toString().padStart(2, '0')}`;
      await query(`UPDATE seniors SET senior_code = $1 WHERE id = $2`, [code, sens.rows[i].id]);
    }

    // 3. Update existing Juniors
    const juns = await query(`SELECT id FROM juniors ORDER BY id ASC`);
    for (let i = 0; i < juns.rows.length; i++) {
      const code = `JRS-${(i + 1).toString().padStart(2, '0')}`;
      await query(`UPDATE juniors SET register_number = $1 WHERE id = $2`, [code, juns.rows[i].id]);
    }
  } catch (err) {
    console.error('User code migration notice:', err);
  }
};

// Verify Super Admin Password Helper
const verifySuperAdminAuth = async (superAdminId: string, passwordVal?: string) => {
  if (!passwordVal || !passwordVal.trim()) {
    throw new Error('Super Administrator authorization password is required to assign or update permissions.');
  }
  const saRes = await query(`SELECT password_hash, role FROM users WHERE id = $1`, [superAdminId]);
  if (saRes.rowCount === 0 || saRes.rows[0].role !== 'SUPER_ADMIN') {
    throw new Error('Only Super Administrators can perform password-authorized permission operations.');
  }
  const isValid = await bcrypt.compare(passwordVal.trim(), saRes.rows[0].password_hash);
  if (!isValid) {
    throw new Error('Invalid Super Administrator authorization password.');
  }
};

// Create Admin (Super Admin only or Admin with MANAGE_USERS)
export const createAdmin = async (req: AuthenticatedRequest, res: Response) => {
  const { name, email, username, password, phone, permissions } = req.body;
  if (!name || !email || !username || !password) {
    return res.status(400).json({ success: false, message: 'Missing required fields', code: 'INVALID_INPUT' });
  }

  try {
    const cleanUsername = username.trim();
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();
    const passwordHash = await bcrypt.hash(cleanPassword, 10);

    const user = await executeTransaction(async (client) => {
      const uRes = await client.query(
        `INSERT INTO users (name, email, username, password_hash, phone, role, must_change_password)
         VALUES ($1, $2, $3, $4, $5, 'ADMIN', true) RETURNING id, name, email, username, role, is_active, created_at`,
        [name.trim(), cleanEmail, cleanUsername, passwordHash, phone ? phone.trim() : null]
      );
      const newUser = uRes.rows[0];

      if (Array.isArray(permissions) && permissions.length > 0) {
        for (const p of permissions) {
          await client.query(
            `INSERT INTO admin_permissions (user_id, permission) VALUES ($1, $2)`,
            [newUser.id, p]
          );
        }
      }
      return newUser;
    });

    await logAudit(req.user!.id, 'CREATE_ADMIN', 'USER', user.id, { username: cleanUsername, permissions }, req.ip);

    res.status(201).json({ success: true, data: user });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message, code: 'CREATE_FAILED' });
  }
};

const ensureFacultyTables = async () => {
  try {
    // 1. Safely update users_role_check constraint to include FACULTY
    await query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check'
        ) THEN
          ALTER TABLE users DROP CONSTRAINT users_role_check;
        END IF;
        ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'DIRECTOR', 'SENIOR', 'JUNIOR', 'FACULTY'));
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END $$;
    `);

    // 2. Ensure faculty table
    await query(`
      CREATE TABLE IF NOT EXISTS faculty (
          id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
          user_id VARCHAR(36) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          faculty_code VARCHAR(50) UNIQUE NOT NULL,
          department VARCHAR(100) NOT NULL,
          max_juniors INT NOT NULL DEFAULT 5,
          status VARCHAR(30) DEFAULT 'ACTIVE',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await query(`
      ALTER TABLE juniors ADD COLUMN IF NOT EXISTS faculty_id VARCHAR(36) REFERENCES faculty(id) ON DELETE SET NULL;
    `);

    // 3. Sync faculty table max_juniors default with system_settings
    const currentFacultyMaxSetting = await getSettingValue('MAX_JUNIORS_PER_FACULTY', 5);
    await query(`UPDATE faculty SET max_juniors = $1 WHERE max_juniors = 5 OR max_juniors IS NULL`, [currentFacultyMaxSetting]);
  } catch (err) {
    console.error('Faculty table migration notice:', err);
  }
};

// Create Director (Super Admin can assign permissions with password verification)
export const createDirector = async (req: AuthenticatedRequest, res: Response) => {
  const { name, email, username, password, phone, department, permissions, superAdminPassword } = req.body;
  if (!name || !email || !username || !password || !department) {
    return res.status(400).json({ success: false, message: 'Missing required fields', code: 'INVALID_INPUT' });
  }

  try {
    await migrateExistingUserCodes();

    let hasPermissionsToAssign = false;
    if (req.user!.role === 'SUPER_ADMIN' && Array.isArray(permissions) && permissions.length > 0) {
      await verifySuperAdminAuth(req.user!.id, superAdminPassword);
      hasPermissionsToAssign = true;
    }

    const cleanUsername = username.trim();
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();
    const passwordHash = await bcrypt.hash(cleanPassword, 10);

    const countRes = await query(`SELECT COUNT(*) FROM directors`);
    const nextSeq = (parseInt(countRes.rows[0].count) + 1).toString().padStart(2, '0');
    const finalDirectorCode = `DIR-${nextSeq}`;

    const result = await executeTransaction(async (client) => {
      const uRes = await client.query(
        `INSERT INTO users (name, email, username, password_hash, phone, role, must_change_password)
         VALUES ($1, $2, $3, $4, $5, 'DIRECTOR', true) RETURNING id, name, email, username`,
        [name.trim(), cleanEmail, cleanUsername, passwordHash, phone ? phone.trim() : null]
      );
      const user = uRes.rows[0];

      const dRes = await client.query(
        `INSERT INTO directors (user_id, director_code, department)
         VALUES ($1, $2, $3) RETURNING id, director_code, department, status`,
        [user.id, finalDirectorCode, department.trim()]
      );

      if (hasPermissionsToAssign && Array.isArray(permissions)) {
        for (const p of permissions) {
          await client.query(`INSERT INTO admin_permissions (user_id, permission) VALUES ($1, $2)`, [user.id, p]);
        }
      }

      return { user, director: dRes.rows[0] };
    });

    await logAudit(req.user!.id, 'CREATE_DIRECTOR', 'DIRECTOR', result.director.id, { name: name.trim(), department: department.trim(), directorCode: finalDirectorCode, permissions: hasPermissionsToAssign ? permissions : [] }, req.ip);

    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message, code: 'CREATE_FAILED' });
  }
};

// Create Faculty (Super Admin / Admin only, Super Admin sets faculty code and maxJuniors)
export const createFaculty = async (req: AuthenticatedRequest, res: Response) => {
  const { name, email, username, password, phone, department, facultyCode, maxJuniors, permissions, superAdminPassword } = req.body;
  if (!name || !email || !username || !password || !department) {
    return res.status(400).json({ success: false, message: 'Missing required fields', code: 'INVALID_INPUT' });
  }

  try {
    await ensureFacultyTables();
    await migrateExistingUserCodes();

    let hasPermissionsToAssign = false;
    if (req.user!.role === 'SUPER_ADMIN' && Array.isArray(permissions) && permissions.length > 0) {
      await verifySuperAdminAuth(req.user!.id, superAdminPassword);
      hasPermissionsToAssign = true;
    }

    const cleanUsername = username.trim();
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();
    const passwordHash = await bcrypt.hash(cleanPassword, 10);

    // Read default capacity from Admin System Settings if maxJuniors not passed
    const defaultFacultyMax = await getSettingValue('MAX_JUNIORS_PER_FACULTY', 5);
    const capacityLimit = (maxJuniors !== undefined && !isNaN(parseInt(maxJuniors)))
      ? parseInt(maxJuniors)
      : defaultFacultyMax;

    let finalFacultyCode = facultyCode ? facultyCode.trim() : '';
    if (!finalFacultyCode) {
      const countRes = await query(`SELECT COUNT(*) FROM faculty`);
      const nextSeq = (parseInt(countRes.rows[0].count) + 1).toString().padStart(2, '0');
      finalFacultyCode = `FAC-${nextSeq}`;
    }

    const result = await executeTransaction(async (client) => {
      const uRes = await client.query(
        `INSERT INTO users (name, email, username, password_hash, phone, role, must_change_password)
         VALUES ($1, $2, $3, $4, $5, 'FACULTY', true) RETURNING id, name, email, username`,
        [name.trim(), cleanEmail, cleanUsername, passwordHash, phone ? phone.trim() : null]
      );
      const user = uRes.rows[0];

      const fRes = await client.query(
        `INSERT INTO faculty (user_id, faculty_code, department, max_juniors)
         VALUES ($1, $2, $3, $4) RETURNING id, faculty_code, department, max_juniors, status`,
        [user.id, finalFacultyCode, department.trim(), capacityLimit]
      );

      if (hasPermissionsToAssign && Array.isArray(permissions)) {
        for (const p of permissions) {
          await client.query(`INSERT INTO admin_permissions (user_id, permission) VALUES ($1, $2)`, [user.id, p]);
        }
      }

      return { user, faculty: fRes.rows[0] };
    });

    await logAudit(req.user!.id, 'CREATE_FACULTY', 'FACULTY', result.faculty.id, { name: name.trim(), department: department.trim(), facultyCode: finalFacultyCode, maxJuniors: capacityLimit }, req.ip);

    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message, code: 'CREATE_FAILED' });
  }
};

// Update Faculty Capacity (SuperAdmin setting maxJuniors)
export const updateFacultyCapacity = async (req: AuthenticatedRequest, res: Response) => {
  const { facultyId } = req.params;
  const { maxJuniors } = req.body;

  if (maxJuniors === undefined || isNaN(parseInt(maxJuniors)) || parseInt(maxJuniors) < 0) {
    return res.status(400).json({ success: false, message: 'Valid maxJuniors integer is required', code: 'INVALID_INPUT' });
  }

  try {
    await ensureFacultyTables();
    const capacity = parseInt(maxJuniors);

    const fRes = await query(`SELECT f.id, u.name FROM faculty f JOIN users u ON f.user_id = u.id WHERE f.id = $1`, [facultyId]);
    if (fRes.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Faculty record not found', code: 'NOT_FOUND' });
    }

    await query(`UPDATE faculty SET max_juniors = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [capacity, facultyId]);

    await logAudit(req.user!.id, 'UPDATE_FACULTY_CAPACITY', 'FACULTY', facultyId as string, { maxJuniors: capacity }, req.ip);

    res.json({ success: true, message: `Faculty capacity for ${fRes.rows[0].name} updated to ${capacity} juniors.` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// Get Faculty Members List
export const getFacultyList = async (req: AuthenticatedRequest, res: Response) => {
  try {
    await ensureFacultyTables();
    const result = await query(`
      SELECT f.id as faculty_id, f.faculty_code, f.department, f.max_juniors, f.status,
             u.id as user_id, u.name as faculty_name, u.email, u.phone,
             (SELECT COUNT(*) FROM juniors j WHERE j.faculty_id = f.id) as assigned_juniors_count
      FROM faculty f
      JOIN users u ON f.user_id = u.id
      ORDER BY u.name ASC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// Get Faculty Assigned Juniors
export const getFacultyAssignedJuniors = async (req: AuthenticatedRequest, res: Response) => {
  try {
    await ensureFacultyTables();
    let facultyId = req.query.facultyId as string;
    if (req.user!.role === 'FACULTY') {
      facultyId = req.user!.facultyId!;
    }

    if (!facultyId) {
      return res.status(400).json({ success: false, message: 'Faculty ID required', code: 'INVALID_INPUT' });
    }

    const result = await query(`
      SELECT j.id as junior_id, j.register_number, j.department, j.batch, j.year, j.joining_date, j.status,
             u.id as user_id, u.name, u.email, u.phone,
             s.id as senior_id, us.name as senior_name
      FROM juniors j
      JOIN users u ON j.user_id = u.id
      LEFT JOIN seniors s ON j.senior_id = s.id
      LEFT JOIN users us ON s.user_id = us.id
      WHERE j.faculty_id = $1
      ORDER BY u.name ASC
    `, [facultyId]);

    res.json({ success: true, data: result.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// Assign Existing Junior to Faculty (Validates Max Juniors Capacity)
export const assignJuniorToFaculty = async (req: AuthenticatedRequest, res: Response) => {
  const { facultyId: reqFacultyId, juniorId } = req.body;
  const targetFacultyId = reqFacultyId;

  if (!targetFacultyId || !juniorId) {
    return res.status(400).json({ success: false, message: 'Faculty ID and Junior ID required', code: 'INVALID_INPUT' });
  }

  try {
    await ensureFacultyTables();

    // Check Faculty Capacity
    const fRes = await query(`SELECT max_juniors FROM faculty WHERE id = $1`, [targetFacultyId]);
    if (fRes.rowCount === 0) return res.status(404).json({ success: false, message: 'Faculty record not found', code: 'NOT_FOUND' });
    const maxJuniors = fRes.rows[0].max_juniors;

    const countRes = await query(`SELECT COUNT(*) FROM juniors WHERE faculty_id = $1`, [targetFacultyId]);
    const currentCount = parseInt(countRes.rows[0].count);

    if (currentCount >= maxJuniors) {
      return res.status(400).json({
        success: false,
        message: `Faculty member has reached maximum assigned capacity of ${maxJuniors} juniors. Cannot assign more.`,
        code: 'CAPACITY_EXCEEDED'
      });
    }

    await query(`UPDATE juniors SET faculty_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [targetFacultyId, juniorId]);

    await logAudit(req.user!.id, 'ASSIGN_JUNIOR_TO_FACULTY', 'FACULTY', targetFacultyId, { juniorId }, req.ip);

    res.json({ success: true, message: 'Junior successfully assigned to Faculty' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// Unassign Junior from Faculty
export const unassignJuniorFromFaculty = async (req: AuthenticatedRequest, res: Response) => {
  const { juniorId } = req.body;
  if (!juniorId) return res.status(400).json({ success: false, message: 'Junior ID required', code: 'INVALID_INPUT' });

  try {
    await ensureFacultyTables();
    await query(`UPDATE juniors SET faculty_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [juniorId]);
    res.json({ success: true, message: 'Junior unassigned from Faculty successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// Create Senior (Super Admin can assign permissions with password verification)
export const createSenior = async (req: AuthenticatedRequest, res: Response) => {
  const { name, email, username, password, phone, department, directorId: reqDirectorId, permissions, superAdminPassword } = req.body;

  const targetDirectorId = req.user!.role === 'DIRECTOR' ? req.user!.directorId : reqDirectorId;

  if (!name || !email || !username || !password || !department || !targetDirectorId) {
    return res.status(400).json({ success: false, message: 'Missing required fields', code: 'INVALID_INPUT' });
  }

  try {
    await migrateExistingUserCodes();

    let hasPermissionsToAssign = false;
    if (req.user!.role === 'SUPER_ADMIN' && Array.isArray(permissions) && permissions.length > 0) {
      await verifySuperAdminAuth(req.user!.id, superAdminPassword);
      hasPermissionsToAssign = true;
    }

    // Check Director Senior Capacity
    const maxSeniors = await getSettingValue('MAX_SENIORS_PER_DIRECTOR', 8);
    const countRes = await query(`SELECT COUNT(*) FROM seniors WHERE director_id = $1`, [targetDirectorId]);
    const currentCount = parseInt(countRes.rows[0].count);

    if (currentCount >= maxSeniors) {
      return res.status(400).json({
        success: false,
        message: `Director has reached maximum capacity of ${maxSeniors} seniors. Cannot assign more.`,
        code: 'CAPACITY_EXCEEDED'
      });
    }

    const cleanUsername = username.trim();
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();
    const passwordHash = await bcrypt.hash(cleanPassword, 10);

    const totalSeniorsRes = await query(`SELECT COUNT(*) FROM seniors`);
    const nextSeq = (parseInt(totalSeniorsRes.rows[0].count) + 1).toString().padStart(2, '0');
    const finalSeniorCode = `SRS-${nextSeq}`;

    const result = await executeTransaction(async (client) => {
      const uRes = await client.query(
        `INSERT INTO users (name, email, username, password_hash, phone, role, must_change_password)
         VALUES ($1, $2, $3, $4, $5, 'SENIOR', true) RETURNING id, name, email, username`,
        [name.trim(), cleanEmail, cleanUsername, passwordHash, phone ? phone.trim() : null]
      );
      const user = uRes.rows[0];

      const sRes = await client.query(
        `INSERT INTO seniors (user_id, senior_code, director_id, department)
         VALUES ($1, $2, $3, $4) RETURNING id, senior_code, director_id, department`,
        [user.id, finalSeniorCode, targetDirectorId, department.trim()]
      );

      if (hasPermissionsToAssign && Array.isArray(permissions)) {
        for (const p of permissions) {
          await client.query(`INSERT INTO admin_permissions (user_id, permission) VALUES ($1, $2)`, [user.id, p]);
        }
      }

      return { user, senior: sRes.rows[0] };
    });

    await logAudit(req.user!.id, 'CREATE_SENIOR', 'SENIOR', result.senior.id, { name: name.trim(), targetDirectorId, seniorCode: finalSeniorCode, permissions: hasPermissionsToAssign ? permissions : [] }, req.ip);

    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message, code: 'CREATE_FAILED' });
  }
};

// Create Junior (NO permissions allowed, optional faculty assignment supported)
export const createJunior = async (req: AuthenticatedRequest, res: Response) => {
  const { name, email, username, password, phone, department, batch, year, joiningDate, seniorId: reqSeniorId, facultyId: reqFacultyId } = req.body;

  const targetSeniorId = req.user!.role === 'SENIOR' ? req.user!.seniorId : reqSeniorId;
  const targetFacultyId = req.user!.role === 'FACULTY' ? req.user!.facultyId : reqFacultyId;

  if (!name || !email || !username || !password || !department || !batch || !year || !targetSeniorId) {
    return res.status(400).json({ success: false, message: 'Missing required fields', code: 'INVALID_INPUT' });
  }

  try {
    await ensureFacultyTables();
    await migrateExistingUserCodes();

    // Check Senior Junior Capacity
    const maxJuniors = await getSettingValue('MAX_JUNIORS_PER_SENIOR', 8);
    const countRes = await query(`SELECT COUNT(*) FROM juniors WHERE senior_id = $1`, [targetSeniorId]);
    const currentCount = parseInt(countRes.rows[0].count);

    if (currentCount >= maxJuniors) {
      return res.status(400).json({
        success: false,
        message: `Senior has reached maximum capacity of ${maxJuniors} juniors. Cannot assign more.`,
        code: 'CAPACITY_EXCEEDED'
      });
    }

    // Check Faculty Capacity if faculty assignment requested
    if (targetFacultyId) {
      const fRes = await query(`SELECT max_juniors FROM faculty WHERE id = $1`, [targetFacultyId]);
      if (fRes.rowCount! > 0) {
        const facMax = fRes.rows[0].max_juniors;
        const facCountRes = await query(`SELECT COUNT(*) FROM juniors WHERE faculty_id = $1`, [targetFacultyId]);
        const facCurrentCount = parseInt(facCountRes.rows[0].count);
        if (facCurrentCount >= facMax) {
          return res.status(400).json({
            success: false,
            message: `Faculty member has reached maximum capacity of ${facMax} juniors. Cannot assign more.`,
            code: 'CAPACITY_EXCEEDED'
          });
        }
      }
    }

    const cleanUsername = username.trim();
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();
    const passwordHash = await bcrypt.hash(cleanPassword, 10);

    const totalJuniorsRes = await query(`SELECT COUNT(*) FROM juniors`);
    const nextSeq = (parseInt(totalJuniorsRes.rows[0].count) + 1).toString().padStart(2, '0');
    const finalRegisterNumber = `JRS-${nextSeq}`;

    const result = await executeTransaction(async (client) => {
      const uRes = await client.query(
        `INSERT INTO users (name, email, username, password_hash, phone, role, must_change_password)
         VALUES ($1, $2, $3, $4, $5, 'JUNIOR', true) RETURNING id, name, email, username`,
        [name.trim(), cleanEmail, cleanUsername, passwordHash, phone ? phone.trim() : null]
      );
      const user = uRes.rows[0];

      const jRes = await client.query(
        `INSERT INTO juniors (user_id, register_number, senior_id, faculty_id, department, batch, year, joining_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, register_number, senior_id, faculty_id, department, batch, year`,
        [user.id, finalRegisterNumber, targetSeniorId, targetFacultyId || null, department.trim(), batch.trim(), year.trim(), joiningDate || new Date().toISOString().split('T')[0]]
      );
      const junior = jRes.rows[0];

      const itemsRes = await client.query(`SELECT id FROM onboarding_items WHERE is_required = true`);
      for (const item of itemsRes.rows) {
        await client.query(
          `INSERT INTO onboarding_progress (junior_id, onboarding_item_id, is_completed)
           VALUES ($1, $2, false) ON CONFLICT DO NOTHING`,
          [junior.id, item.id]
        );
      }

      return { user, junior };
    });

    await logAudit(req.user!.id, 'CREATE_JUNIOR', 'JUNIOR', result.junior.id, { name: name.trim(), targetSeniorId, targetFacultyId, registerNumber: finalRegisterNumber }, req.ip);

    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message, code: 'CREATE_FAILED' });
  }
};

// List Users with filtering & hierarchy scope
export const getUsers = async (req: AuthenticatedRequest, res: Response) => {
  const { role, search } = req.query;

  try {
    await ensureFacultyTables();
    await migrateExistingUserCodes();

    let sql = `
      SELECT u.id, u.name, u.email, u.username, u.phone, u.role, u.is_active, u.created_at, u.last_login_at,
             COALESCE(d.department, f.department, s.department, j.department) as department,
             d.id as director_id, d.director_code,
             f.id as faculty_id, f.faculty_code, f.max_juniors,
             (SELECT COUNT(*) FROM juniors fj WHERE fj.faculty_id = f.id) as assigned_juniors_count,
             s.id as senior_id, s.senior_code, s.director_id as senior_director_id,
             j.id as junior_id, j.register_number, j.senior_id as junior_senior_id, j.faculty_id as junior_faculty_id, j.batch, j.year,
             uf.name as faculty_name
      FROM users u
      LEFT JOIN directors d ON u.id = d.user_id
      LEFT JOIN faculty f ON u.id = f.user_id
      LEFT JOIN seniors s ON u.id = s.user_id
      LEFT JOIN juniors j ON u.id = j.user_id
      LEFT JOIN faculty jf ON j.faculty_id = jf.id
      LEFT JOIN users uf ON jf.user_id = uf.id
      WHERE 1=1
    `;
    const params: any[] = [];

    // Hierarchy & Role Scoping
    if (req.user!.role === 'DIRECTOR') {
      sql += ` AND (u.id = $${params.length + 1} OR s.director_id = $${params.length + 2} OR j.senior_id IN (SELECT id FROM seniors WHERE director_id = $${params.length + 2}))`;
      params.push(req.user!.id, req.user!.directorId);
    } else if (req.user!.role === 'FACULTY') {
      sql += ` AND (u.id = $${params.length + 1} OR j.faculty_id = $${params.length + 2})`;
      params.push(req.user!.id, req.user!.facultyId);
    } else if (req.user!.role === 'SENIOR') {
      sql += ` AND j.senior_id = $${params.length + 1} AND u.role = 'JUNIOR'`;
      params.push(req.user!.seniorId);
    } else if (req.user!.role === 'JUNIOR') {
      sql += ` AND u.id = $${params.length + 1}`;
      params.push(req.user!.id);
    }

    if (role) {
      sql += ` AND u.role = $${params.length + 1}`;
      params.push(role);
    }

    if (search) {
      sql += ` AND (u.name ILIKE $${params.length + 1} OR u.email ILIKE $${params.length + 1} OR u.username ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    sql += ` ORDER BY u.created_at DESC`;

    const result = await query(sql, params);
    res.json({ success: true, data: result.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// Get Single User Profile Card
export const getUserProfile = async (req: AuthenticatedRequest, res: Response) => {
  const { userId } = req.params;

  try {
    await migrateExistingUserCodes();

    const uRes = await query(
      `SELECT u.id, u.name, u.email, u.username, u.phone, u.role, u.is_active, u.created_at, u.last_login_at,
              COALESCE(d.department, f.department, s.department, j.department) as department,
              d.id as director_id, d.director_code,
              f.id as faculty_id, f.faculty_code,
              s.id as senior_id, s.senior_code, s.director_id as senior_director_id,
              j.id as junior_id, j.register_number, j.senior_id as junior_senior_id, j.faculty_id as junior_faculty_id, j.batch, j.year, j.joining_date
       FROM users u
       LEFT JOIN directors d ON u.id = d.user_id
       LEFT JOIN faculty f ON u.id = f.user_id
       LEFT JOIN seniors s ON u.id = s.user_id
       LEFT JOIN juniors j ON u.id = j.user_id
       WHERE u.id = $1`,
      [userId]
    );

    if (uRes.rowCount === 0) return res.status(404).json({ success: false, message: 'User not found', code: 'NOT_FOUND' });

    const userProfile = uRes.rows[0];

    // Fetch custom granted permissions for user
    const permRes = await query(`SELECT permission FROM admin_permissions WHERE user_id = $1`, [userId]);
    userProfile.permissions = permRes.rows.map(r => r.permission);

    // Fetch related Senior, Director & Faculty names for Juniors
    if (userProfile.role === 'JUNIOR') {
      if (userProfile.junior_senior_id) {
        const sInfo = await query(
          `SELECT s.id as senior_id, us.name as senior_name, d.id as director_id, ud.name as director_name
           FROM seniors s
           JOIN users us ON s.user_id = us.id
           JOIN directors d ON s.director_id = d.id
           JOIN users ud ON d.user_id = ud.id
           WHERE s.id = $1`,
          [userProfile.junior_senior_id]
        );
        if (sInfo.rowCount! > 0) {
          userProfile.senior_name = sInfo.rows[0].senior_name;
          userProfile.director_name = sInfo.rows[0].director_name;
        }
      }
      if (userProfile.junior_faculty_id) {
        const fInfo = await query(
          `SELECT f.id as faculty_id, uf.name as faculty_name, f.faculty_code
           FROM faculty f
           JOIN users uf ON f.user_id = uf.id
           WHERE f.id = $1`,
          [userProfile.junior_faculty_id]
        );
        if (fInfo.rowCount! > 0) {
          userProfile.faculty_name = fInfo.rows[0].faculty_name;
          userProfile.faculty_code = fInfo.rows[0].faculty_code;
        }
      }
    } else if (userProfile.role === 'SENIOR' && userProfile.senior_director_id) {
      const dInfo = await query(
        `SELECT d.id as director_id, ud.name as director_name
         FROM directors d
         JOIN users ud ON d.user_id = ud.id
         WHERE d.id = $1`,
        [userProfile.senior_director_id]
      );
      if (dInfo.rowCount! > 0) {
        userProfile.director_name = dInfo.rows[0].director_name;
      }
    }

    res.json({ success: true, data: userProfile });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// Update User Profile
export const updateUserProfile = async (req: AuthenticatedRequest, res: Response) => {
  const { userId } = req.params;
  const { name, email, phone, department, batch, year } = req.body;

  try {
    const uRes = await query(`SELECT id, role FROM users WHERE id = $1`, [userId]);
    if (uRes.rowCount === 0) return res.status(404).json({ success: false, message: 'User not found', code: 'NOT_FOUND' });

    const targetUser = uRes.rows[0];

    await executeTransaction(async (client) => {
      let uUpdates: string[] = ['updated_at = CURRENT_TIMESTAMP'];
      let uParams: any[] = [];

      if (name) { uUpdates.push(`name = $${uParams.length + 1}`); uParams.push(name.trim()); }
      if (email) { uUpdates.push(`email = $${uParams.length + 1}`); uParams.push(email.trim()); }
      if (phone !== undefined) { uUpdates.push(`phone = $${uParams.length + 1}`); uParams.push(phone ? phone.trim() : null); }

      if (uUpdates.length > 1) {
        uParams.push(userId);
        await client.query(`UPDATE users SET ${uUpdates.join(', ')} WHERE id = $${uParams.length}`, uParams);
      }

      if (targetUser.role === 'DIRECTOR' && department) {
        await client.query(`UPDATE directors SET department = $1 WHERE user_id = $2`, [department.trim(), userId]);
      } else if (targetUser.role === 'SENIOR' && department) {
        await client.query(`UPDATE seniors SET department = $1 WHERE user_id = $2`, [department.trim(), userId]);
      } else if (targetUser.role === 'JUNIOR') {
        let jUpdates: string[] = [];
        let jParams: any[] = [];
        if (department) { jUpdates.push(`department = $${jParams.length + 1}`); jParams.push(department.trim()); }
        if (batch) { jUpdates.push(`batch = $${jParams.length + 1}`); jParams.push(batch.trim()); }
        if (year) { jUpdates.push(`year = $${jParams.length + 1}`); jParams.push(year.trim()); }
        if (jUpdates.length > 0) {
          jParams.push(userId);
          await client.query(`UPDATE juniors SET ${jUpdates.join(', ')} WHERE user_id = $${jParams.length}`, jParams);
        }
      }
    });

    await logAudit(req.user!.id, 'UPDATE_USER_PROFILE', 'USER', userId as string, { name, email, department }, req.ip);

    res.json({ success: true, message: 'User profile updated successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// Update User Permissions (Strictly Super Admin with Password Verification)
export const updateUserPermissions = async (req: AuthenticatedRequest, res: Response) => {
  const { userId } = req.params;
  const { permissions, superAdminPassword } = req.body;

  if (req.user!.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, message: 'Only Super Administrators can update user permissions.', code: 'FORBIDDEN' });
  }

  try {
    await verifySuperAdminAuth(req.user!.id, superAdminPassword);

    const uRes = await query(`SELECT id, role, name FROM users WHERE id = $1`, [userId]);
    if (uRes.rowCount === 0) return res.status(404).json({ success: false, message: 'User not found', code: 'NOT_FOUND' });

    const targetUser = uRes.rows[0];
    if (targetUser.role === 'JUNIOR') {
      return res.status(400).json({ success: false, message: 'Custom permissions cannot be assigned to Junior Student accounts.', code: 'INVALID_ROLE' });
    }

    await executeTransaction(async (client) => {
      await client.query(`DELETE FROM admin_permissions WHERE user_id = $1`, [userId]);
      if (Array.isArray(permissions) && permissions.length > 0) {
        for (const p of permissions) {
          await client.query(`INSERT INTO admin_permissions (user_id, permission) VALUES ($1, $2)`, [userId, p]);
        }
      }
    });

    await logAudit(req.user!.id, 'UPDATE_USER_PERMISSIONS', 'USER', userId as string, { permissions }, req.ip);

    res.json({ success: true, message: `Permissions for ${targetUser.name} updated successfully.` });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message, code: 'UPDATE_FAILED' });
  }
};

// Delete User with cascading deletes
export const deleteUser = async (req: AuthenticatedRequest, res: Response) => {
  const { userId } = req.params;

  try {
    const uRes = await query(`SELECT id, name, role FROM users WHERE id = $1`, [userId]);
    if (uRes.rowCount === 0) return res.status(404).json({ success: false, message: 'User not found', code: 'NOT_FOUND' });

    const targetUser = uRes.rows[0];

    if (targetUser.role === 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Super Administrator accounts cannot be deleted.', code: 'FORBIDDEN' });
    }

    await executeTransaction(async (client) => {
      await client.query(`DELETE FROM audit_logs WHERE user_id = $1`, [userId]);
      await client.query(`DELETE FROM notifications WHERE recipient_id = $1`, [userId]);
      await client.query(`DELETE FROM admin_permissions WHERE user_id = $1`, [userId]);
      await client.query(`DELETE FROM direct_messages WHERE sender_id = $1 OR receiver_id = $1`, [userId]);
      await client.query(`DELETE FROM issue_comments WHERE author_id = $1`, [userId]);
      await client.query(`DELETE FROM issue_votes WHERE voter_id = $1`, [userId]);

      if (targetUser.role === 'JUNIOR') {
        const jRes = await client.query(`SELECT id FROM juniors WHERE user_id = $1`, [userId]);
        if (jRes.rowCount! > 0) {
          const jId = jRes.rows[0].id;
          await client.query(`DELETE FROM onboarding_progress WHERE junior_id = $1`, [jId]);
          await client.query(`DELETE FROM survey_responses WHERE junior_id = $1`, [jId]);
          await client.query(`DELETE FROM poll_votes WHERE junior_id = $1`, [jId]);
          await client.query(`DELETE FROM issues WHERE junior_id = $1`, [jId]);
          await client.query(`DELETE FROM juniors WHERE id = $1`, [jId]);
        }
      } else if (targetUser.role === 'SENIOR') {
        const sRes = await client.query(`SELECT id FROM seniors WHERE user_id = $1`, [userId]);
        if (sRes.rowCount! > 0) {
          const sId = sRes.rows[0].id;
          await client.query(`UPDATE juniors SET senior_id = NULL WHERE senior_id = $1`, [sId]);
          await client.query(`DELETE FROM seniors WHERE id = $1`, [sId]);
        }
      } else if (targetUser.role === 'DIRECTOR') {
        const dRes = await client.query(`SELECT id FROM directors WHERE user_id = $1`, [userId]);
        if (dRes.rowCount! > 0) {
          const dId = dRes.rows[0].id;
          await client.query(`UPDATE seniors SET director_id = NULL WHERE director_id = $1`, [dId]);
          await client.query(`DELETE FROM directors WHERE id = $1`, [dId]);
        }
      }

      await client.query(`DELETE FROM users WHERE id = $1`, [userId]);
    });

    await logAudit(req.user!.id, 'DELETE_USER', 'USER', userId as string, { name: targetUser.name, role: targetUser.role }, req.ip);

    res.json({ success: true, message: `User ${targetUser.name} deleted successfully.` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// Toggle User Active Status
export const toggleUserStatus = async (req: AuthenticatedRequest, res: Response) => {
  const { userId } = req.params;

  try {
    const uRes = await query(`SELECT id, is_active, role FROM users WHERE id = $1`, [userId]);
    if (uRes.rowCount === 0) return res.status(404).json({ success: false, message: 'User not found', code: 'NOT_FOUND' });

    if (uRes.rows[0].role === 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Cannot modify Super Administrator status.', code: 'FORBIDDEN' });
    }

    const newStatus = !uRes.rows[0].is_active;
    await query(`UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [newStatus, userId]);

    res.json({ success: true, message: `User account ${newStatus ? 'activated' : 'disabled'}` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// Reset User Password (Requires Admin authorization password)
export const resetUserPassword = async (req: AuthenticatedRequest, res: Response) => {
  const { userId } = req.params;
  const { newPassword, adminPassword } = req.body;

  if (!newPassword || !adminPassword) {
    return res.status(400).json({ success: false, message: 'New password and your administrator authorization password are required.', code: 'INVALID_INPUT' });
  }

  try {
    const adminUserRes = await query(`SELECT password_hash FROM users WHERE id = $1`, [req.user!.id]);
    const isPassValid = await bcrypt.compare(adminPassword, adminUserRes.rows[0].password_hash);
    if (!isPassValid) {
      return res.status(401).json({ success: false, message: 'Invalid administrator authorization password. Password reset rejected.', code: 'UNAUTHORIZED' });
    }

    const passwordHash = await bcrypt.hash(newPassword.trim(), 10);
    await query(`UPDATE users SET password_hash = $1, must_change_password = true, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [passwordHash, userId]);

    await logAudit(req.user!.id, 'RESET_USER_PASSWORD', 'USER', userId as string, {}, req.ip);

    res.json({ success: true, message: 'User password reset successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// Get Directors List for dropdowns
export const getDirectorsList = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await query(`
      SELECT d.id as director_id, d.director_code, d.department, u.name as director_name, u.email, u.id as user_id
      FROM directors d
      JOIN users u ON d.user_id = u.id
      ORDER BY u.name ASC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// Get Seniors List for dropdowns
export const getSeniorsList = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await query(`
      SELECT s.id as senior_id, s.senior_code, s.department, u.name as senior_name, u.email, u.id as user_id,
             d.id as director_id, ud.name as director_name
      FROM seniors s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN directors d ON s.director_id = d.id
      LEFT JOIN users ud ON d.user_id = ud.id
      ORDER BY u.name ASC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};
