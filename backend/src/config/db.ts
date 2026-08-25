import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const isProduction = process.env.NODE_ENV === 'production';

export const pool = new Pool(
  connectionString
    ? {
        connectionString,
        ssl: isProduction || process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
        max: parseInt(process.env.PG_MAX_CONNECTIONS || '50'),
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
        statement_timeout: 15000,
      }
    : {
        user: process.env.PGUSER || 'postgres',
        password: process.env.PGPASSWORD || 'Manikanta@340',
        host: process.env.PGHOST || 'localhost',
        port: parseInt(process.env.PGPORT || '5432'),
        database: process.env.PGDATABASE || 'juniorconnect',
        ssl: isProduction || process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
        max: parseInt(process.env.PG_MAX_CONNECTIONS || '50'),
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
        statement_timeout: 15000,
      }
);

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

// Initialize High-Performance Indexes for 100+ Concurrency
export const initDatabasePerformance = async () => {
  try {
    await query(`
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(LOWER(email));
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(LOWER(username));

      CREATE INDEX IF NOT EXISTS idx_juniors_user_id ON juniors(user_id);
      CREATE INDEX IF NOT EXISTS idx_juniors_senior_id ON juniors(senior_id);
      CREATE INDEX IF NOT EXISTS idx_juniors_faculty_id ON juniors(faculty_id);

      CREATE INDEX IF NOT EXISTS idx_seniors_user_id ON seniors(user_id);
      CREATE INDEX IF NOT EXISTS idx_seniors_director_id ON seniors(director_id);

      CREATE INDEX IF NOT EXISTS idx_faculty_user_id ON faculty(user_id);
      CREATE INDEX IF NOT EXISTS idx_directors_user_id ON directors(user_id);

      CREATE INDEX IF NOT EXISTS idx_issues_created_by ON issues(created_by);
      CREATE INDEX IF NOT EXISTS idx_issues_assigned_to ON issues(assigned_to);
      CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
    `);
  } catch (err: any) {
    console.warn('Database performance index initialization notice:', err.message);
  }
};

export const getClient = (): Promise<PoolClient> => pool.connect();

export const executeTransaction = async <T>(callback: (client: PoolClient) => Promise<T>): Promise<T> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};
