import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function syncSpecialRolesWithCommittees() {
  const dbUrl = process.env.DATABASE_URL;
  const isProduction = process.env.NODE_ENV === 'production' || process.env.DB_SSL === 'true';

  let client: Client;

  if (dbUrl) {
    console.log(`Connecting to database via DATABASE_URL...`);
    client = new Client({
      connectionString: dbUrl,
      ssl: isProduction || dbUrl.includes('neon.tech') ? { rejectUnauthorized: false } : false
    });
  } else {
    const host = process.env.PGHOST || 'localhost';
    const port = parseInt(process.env.PGPORT || '5432');
    const user = process.env.PGUSER || 'postgres';
    const password = process.env.PGPASSWORD || 'Manikanta@340';
    const database = process.env.PGDATABASE || 'juniorconnect';

    console.log(`Connecting to PostgreSQL (${host}:${port}/${database})...`);
    client = new Client({ user, password, host, port, database, ssl: false });
  }

  try {
    await client.connect();
    console.log('Connected to PostgreSQL database.');

    await client.query('BEGIN;');

    console.log('Syncing special_role values with is_disciplinary_committee & is_counselor flags...');

    // 1. Sync Disciplinary Committee members
    const committeeUsers = await client.query(`
      SELECT u.id, u.name, f.id as faculty_id, u.special_role
      FROM users u
      LEFT JOIN faculty f ON u.id = f.user_id
      WHERE UPPER(COALESCE(u.special_role, '')) LIKE '%DISCIPLINARY%'
         OR u.is_disciplinary_committee = true;
    `);

    for (const r of committeeUsers.rows) {
      console.log(`Setting is_disciplinary_committee = true for user: ${r.name} (${r.id})`);
      await client.query(`UPDATE users SET is_disciplinary_committee = true WHERE id = $1`, [r.id]);
      await client.query(
        `INSERT INTO disciplinary_committee_members (user_id, faculty_id, designation, appointed_by)
         VALUES ($1, $2, 'Committee Member', $1)
         ON CONFLICT (user_id) DO UPDATE SET designation = EXCLUDED.designation`,
        [r.id, r.faculty_id || null]
      );
    }

    // 2. Sync Mental Health Counselors
    const counselorUsers = await client.query(`
      SELECT u.id, u.name, u.special_role
      FROM users u
      WHERE UPPER(COALESCE(u.special_role, '')) LIKE '%COUNSELOR%'
         OR UPPER(COALESCE(u.special_role, '')) LIKE '%COUNSELLOR%'
         OR u.is_counselor = true;
    `);

    for (const r of counselorUsers.rows) {
      console.log(`Setting is_counselor = true for user: ${r.name} (${r.id})`);
      await client.query(`UPDATE users SET is_counselor = true WHERE id = $1`, [r.id]);
    }

    await client.query('COMMIT;');
    console.log('Special role synchronization completed successfully!');

  } catch (err: any) {
    await client.query('ROLLBACK;');
    console.error('Sync failed:', err.message || err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

syncSpecialRolesWithCommittees();
