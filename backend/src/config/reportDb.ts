import { Pool } from 'pg';
import dotenv from 'dotenv';
import { SEPTEMBER_REPORT_DATA } from './septemberSeedData';

dotenv.config();

const REPORT_DATABASE_URL = 
  process.env.REPORT_DATABASE_URL || 
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_1Rt5VvrgSnGF@ep-silent-water-b4eqmcmr-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

export const reportPool = new Pool({
  connectionString: REPORT_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  min: 0,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 10000,
  keepAlive: true,
});

reportPool.on('error', (err) => {
  if (err.message && err.message.includes('terminated unexpectedly')) {
    return;
  }
  console.error('Reports Database Pool Notice:', err.message || err);
});

export const reportQuery = (text: string, params?: any[]) => reportPool.query(text, params);

/**
 * Auto-initialize the isolated database tables strictly for HOD report generation
 * and auto-seed September 2026 data on deployment startup if needed!
 */
export const initReportDatabase = async () => {
  try {
    await reportQuery(`
      CREATE TABLE IF NOT EXISTS departmental_monthly_reports (
          id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
          department VARCHAR(100) NOT NULL,
          period VARCHAR(50) NOT NULL,
          hod_name VARCHAR(150),
          submission_date VARCHAR(50),
          sections_data JSONB DEFAULT '{}'::jsonb,
          file_name VARCHAR(255),
          file_path TEXT,
          file_size_bytes BIGINT DEFAULT 0,
          items_count INT DEFAULT 0,
          status VARCHAR(30) DEFAULT 'DRAFT',
          uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(department, period)
      );

      ALTER TABLE departmental_monthly_reports ADD COLUMN IF NOT EXISTS submission_date VARCHAR(50);
      ALTER TABLE departmental_monthly_reports ADD COLUMN IF NOT EXISTS sections_data JSONB DEFAULT '{}'::jsonb;
      ALTER TABLE departmental_monthly_reports ALTER COLUMN file_name DROP NOT NULL;
      ALTER TABLE departmental_monthly_reports ALTER COLUMN file_path DROP NOT NULL;

      CREATE INDEX IF NOT EXISTS idx_rep_dept_period ON departmental_monthly_reports(period, department);

      CREATE TABLE IF NOT EXISTS consolidated_institutional_reports (
          id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
          period VARCHAR(50) NOT NULL UNIQUE,
          file_name VARCHAR(255),
          file_base64 TEXT,
          status VARCHAR(30) DEFAULT 'CONSOLIDATED',
          matrix_data JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Dedicated Reports Database initialized successfully on Neon PostgreSQL!');

    // Auto-seed September 2026 data if not present or incomplete
    const countRes = await reportQuery(
      "SELECT COUNT(*) FROM departmental_monthly_reports WHERE LOWER(TRIM(period)) = 'september 2026' AND items_count > 0"
    );
    const existingCount = parseInt(countRes.rows[0]?.count || '0', 10);

    if (existingCount < Object.keys(SEPTEMBER_REPORT_DATA).length) {
      console.log('🌱 Auto-seeding September 2026 departmental reports in deployment database...');
      for (const [dept, entry] of Object.entries(SEPTEMBER_REPORT_DATA)) {
        const totalItems = Object.values(entry.sections).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
        await reportQuery(`
          INSERT INTO departmental_monthly_reports 
          (department, period, hod_name, submission_date, sections_data, items_count, status, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, 'SUBMITTED', CURRENT_TIMESTAMP)
          ON CONFLICT (department, period) DO UPDATE 
          SET hod_name = EXCLUDED.hod_name,
              submission_date = EXCLUDED.submission_date,
              sections_data = EXCLUDED.sections_data,
              items_count = EXCLUDED.items_count,
              status = 'SUBMITTED',
              updated_at = CURRENT_TIMESTAMP
        `, [dept, 'September 2026', entry.hodName, entry.submissionDate, JSON.stringify(entry.sections), totalItems]);
      }
      // Clean any uppercase duplicates
      await reportQuery("DELETE FROM departmental_monthly_reports WHERE period = 'SEPTEMBER 2026'");
      console.log('🎉 September 2026 data successfully auto-seeded on deployment server!');
    }
  } catch (err: any) {
    console.error('❌ Error initializing dedicated reports database:', err.message);
  }
};
