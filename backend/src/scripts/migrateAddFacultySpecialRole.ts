import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function migrateAddFacultySpecialRole() {
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

    console.log('Adding special_role, is_counselor, and is_disciplinary_committee columns to users and faculty tables...');

    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_counselor BOOLEAN DEFAULT false;`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_disciplinary_committee BOOLEAN DEFAULT false;`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS special_role VARCHAR(100);`);

    await client.query(`ALTER TABLE faculty ADD COLUMN IF NOT EXISTS is_counselor BOOLEAN DEFAULT false;`);
    await client.query(`ALTER TABLE faculty ADD COLUMN IF NOT EXISTS is_disciplinary_committee BOOLEAN DEFAULT false;`);
    await client.query(`ALTER TABLE faculty ADD COLUMN IF NOT EXISTS special_role VARCHAR(100);`);

    await client.query('COMMIT;');
    console.log('Faculty and users columns added successfully!');

  } catch (err: any) {
    await client.query('ROLLBACK;');
    console.error('Migration failed:', err.message || err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrateAddFacultySpecialRole();
