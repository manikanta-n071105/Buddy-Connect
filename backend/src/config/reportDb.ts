import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const REPORT_DATABASE_URL = 
  process.env.REPORT_DATABASE_URL || 
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
  } catch (err: any) {
    console.error('❌ Error initializing dedicated reports database:', err.message);
  }
};
