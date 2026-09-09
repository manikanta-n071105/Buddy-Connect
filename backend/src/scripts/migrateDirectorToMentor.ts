import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function checkRolesAndMigrate() {
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

    const rolesRes = await client.query('SELECT DISTINCT role FROM users;');
    console.log('Distinct roles in users table:', rolesRes.rows.map(r => r.role));

    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    const existingTables = tablesRes.rows.map(r => r.table_name);

    const runStep = async (name: string, sql: string, params: any[] = []) => {
      try {
        console.log(`Executing step: ${name}...`);
        const res = await client.query(sql, params);
        console.log(`  -> SUCCESS: ${name}`);
        return res;
      } catch (err: any) {
        console.error(`  -> ERROR in step [${name}]:`, err.message);
        throw err;
      }
    };

    await client.query('BEGIN;');

    if (existingTables.includes('directors') && !existingTables.includes('mentors')) {
      await runStep('Rename directors -> mentors', 'ALTER TABLE directors RENAME TO mentors;');
    }

    if (existingTables.includes('director_conversations') && !existingTables.includes('mentor_conversations')) {
      await runStep('Rename director_conversations -> mentor_conversations', 'ALTER TABLE director_conversations RENAME TO mentor_conversations;');
    }

    if (existingTables.includes('director_messages') && !existingTables.includes('mentor_messages')) {
      await runStep('Rename director_messages -> mentor_messages', 'ALTER TABLE director_messages RENAME TO mentor_messages;');
    }

    // Rename columns individually with logging
    await runStep('Rename mentors.director_code', `
      DO $$ 
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mentors' AND column_name = 'director_code') THEN
          ALTER TABLE mentors RENAME COLUMN director_code TO mentor_code;
        END IF;
      END $$;
    `);

    await runStep('Rename seniors.director_id', `
      DO $$ 
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seniors' AND column_name = 'director_id') THEN
          ALTER TABLE seniors RENAME COLUMN director_id TO mentor_id;
        END IF;
      END $$;
    `);

    await runStep('Rename issues.director_id', `
      DO $$ 
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'issues' AND column_name = 'director_id') THEN
          ALTER TABLE issues RENAME COLUMN director_id TO mentor_id;
        END IF;
      END $$;
    `);

    await runStep('Rename mentor_conversations.director_id', `
      DO $$ 
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mentor_conversations' AND column_name = 'director_id') THEN
          ALTER TABLE mentor_conversations RENAME COLUMN director_id TO mentor_id;
        END IF;
      END $$;
    `);

    await runStep('Rename director_conversations.director_id', `
      DO $$ 
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'director_conversations' AND column_name = 'director_id') THEN
          ALTER TABLE director_conversations RENAME COLUMN director_id TO mentor_id;
        END IF;
      END $$;
    `);

    await runStep('Rename mentor_messages.director_id', `
      DO $$ 
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mentor_messages' AND column_name = 'director_id') THEN
          ALTER TABLE mentor_messages RENAME COLUMN director_id TO mentor_id;
        END IF;
      END $$;
    `);

    // Drop users role check constraint safely
    await runStep('Find and drop users check constraint', `
      DO $$
      DECLARE
        r RECORD;
      BEGIN
        FOR r IN 
          SELECT constraint_name 
          FROM information_schema.constraint_column_usage 
          WHERE table_name = 'users' AND column_name = 'role'
        LOOP
          EXECUTE 'ALTER TABLE users DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
        END LOOP;
      END $$;
    `);

    await runStep('Update users role value (case insensitive)', `UPDATE users SET role = 'MENTOR' WHERE UPPER(role) = 'DIRECTOR';`);

    const updatedRoles = await client.query('SELECT DISTINCT role FROM users;');
    console.log('Roles in users table after update:', updatedRoles.rows.map(r => r.role));

    // Construct constraint dynamically with all distinct roles currently present in users table plus standard roles
    const allRolesSet = new Set(['SUPER_ADMIN', 'ADMIN', 'MENTOR', 'SENIOR', 'JUNIOR', 'FACULTY', ...updatedRoles.rows.map(r => r.role)]);
    const allowedRolesSql = Array.from(allRolesSet).map(r => `'${r}'`).join(', ');

    console.log(`Setting allowed roles in check constraint: ${allowedRolesSql}`);

    await runStep('Add new users role check constraint', `
      ALTER TABLE users ADD CONSTRAINT users_role_check 
      CHECK (role IN (${allowedRolesSql}));
    `);

    if (existingTables.includes('system_settings')) {
      await runStep('Update system_settings key', `UPDATE system_settings SET key = 'MAX_SENIORS_PER_MENTOR' WHERE key = 'MAX_SENIORS_PER_DIRECTOR';`);
      await runStep('Update system_settings descriptions', `
        UPDATE system_settings SET description = REPLACE(description, 'director', 'mentor') WHERE description ILIKE '%director%';
        UPDATE system_settings SET description = REPLACE(description, 'Director', 'Mentor') WHERE description ILIKE '%Director%';
      `);
    }

    await runStep('Rename indexes', `
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_seniors_director_id') THEN
          ALTER INDEX idx_seniors_director_id RENAME TO idx_seniors_mentor_id;
        END IF;
        IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_issues_director') THEN
          ALTER INDEX idx_issues_director RENAME TO idx_issues_mentor;
        END IF;
        IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_directors_user') THEN
          ALTER INDEX idx_directors_user RENAME TO idx_mentors_user;
        END IF;
      END $$;
    `);

    await client.query('COMMIT;');
    console.log('ALL MIGRATION STEPS SUCCEEDED!');

  } catch (err: any) {
    await client.query('ROLLBACK;');
    console.error('Migration aborted & rolled back:', err.message || err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

checkRolesAndMigrate();
