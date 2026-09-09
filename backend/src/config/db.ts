import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const isProduction = process.env.NODE_ENV === 'production';

export const pool = new Pool(
  connectionString
    ? {
        connectionString,
        ssl: isProduction || process.env.DB_SSL === 'true' || connectionString.includes('neon.tech') ? { rejectUnauthorized: false } : false,
        max: parseInt(process.env.PG_MAX_CONNECTIONS || '20'),
        min: 0, // min: 0 prevents stale socket errors on Neon serverless pooler
        idleTimeoutMillis: 10000, // 10s idle timeout to close connections before Neon proxy
        connectionTimeoutMillis: 10000,
        keepAlive: true,
      }
    : {
        user: process.env.PGUSER || 'postgres',
        password: process.env.PGPASSWORD || 'Manikanta@340',
        host: process.env.PGHOST || 'localhost',
        port: parseInt(process.env.PGPORT || '5432'),
        database: process.env.PGDATABASE || 'juniorconnect',
        ssl: false,
        max: parseInt(process.env.PG_MAX_CONNECTIONS || '20'),
        min: 0,
        idleTimeoutMillis: 10000,
        connectionTimeoutMillis: 10000,
        keepAlive: true,
      }
);

pool.on('error', (err) => {
  // Gracefully log idle pool termination notices without throwing unhandled warnings
  if (err.message && err.message.includes('terminated unexpectedly')) {
    return;
  }
  console.error('PostgreSQL client pool notice:', err.message || err);
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

// Initialize High-Performance Indexes for High-Throughput & Low Latency
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

      CREATE INDEX IF NOT EXISTS idx_issues_reported_by ON issues(reported_by_id);
      CREATE INDEX IF NOT EXISTS idx_issues_assigned_to ON issues(assigned_to_id);
      CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);

      CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_date ON audit_logs(actor_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread ON notifications(recipient_id, is_read);
      CREATE INDEX IF NOT EXISTS idx_announcements_created ON announcements(created_at DESC);
    `);
  } catch (err: any) {
    console.warn('Database performance index initialization notice:', err.message);
  }
};

export const initHostelMessTables = async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS hostel_menus (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        date DATE NOT NULL,
        meal_type VARCHAR(20) NOT NULL,
        menu_items TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(date, meal_type)
      );

      CREATE TABLE IF NOT EXISTS hostel_meal_rsvps (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        meal_type VARCHAR(20) NOT NULL,
        will_eat BOOLEAN DEFAULT true NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, date, meal_type)
      );

      CREATE INDEX IF NOT EXISTS idx_hostel_menus_date ON hostel_menus(date);
      CREATE INDEX IF NOT EXISTS idx_hostel_rsvps_date_meal ON hostel_meal_rsvps(date, meal_type);
      CREATE INDEX IF NOT EXISTS idx_hostel_rsvps_user ON hostel_meal_rsvps(user_id);
    `);
  } catch (err: any) {
    console.warn('Hostel mess table initialization notice:', err.message);
  }
};

export const initCrFeedbackTables = async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS cr_class_feedbacks (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        cr_user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
        department VARCHAR(50) NOT NULL,
        year_batch VARCHAR(50),
        subject_name VARCHAR(100) NOT NULL,
        faculty_name VARCHAR(100) NOT NULL,
        feedback_category VARCHAR(50) NOT NULL,
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        feedback_text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_cr_feedbacks_user ON cr_class_feedbacks(cr_user_id);
      CREATE INDEX IF NOT EXISTS idx_cr_feedbacks_dept ON cr_class_feedbacks(department);
      CREATE INDEX IF NOT EXISTS idx_cr_feedbacks_date ON cr_class_feedbacks(created_at);
    `);
  } catch (err: any) {
    console.warn('CR Feedback table initialization notice:', err.message);
  }
};

export const initCounselingTables = async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS counseling_appointments (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        student_user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
        counselor_user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
        appointment_date DATE NOT NULL,
        appointment_time VARCHAR(20) NOT NULL,
        mode VARCHAR(20) DEFAULT 'IN_PERSON' NOT NULL,
        reason TEXT,
        status VARCHAR(20) DEFAULT 'PENDING' NOT NULL,
        counselor_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_counseling_student ON counseling_appointments(student_user_id);
      CREATE INDEX IF NOT EXISTS idx_counseling_counselor ON counseling_appointments(counselor_user_id);
    `);
  } catch (err: any) {
    console.warn('Mental Health Counseling table initialization notice:', err.message);
  }
};

export const initQuizTables = async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS quizzes (
          id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
          faculty_id VARCHAR(36) NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          department VARCHAR(100) NOT NULL,
          year VARCHAR(50),
          duration_minutes INT DEFAULT 15,
          status VARCHAR(30) DEFAULT 'ACTIVE',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS quiz_questions (
          id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
          quiz_id VARCHAR(36) NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
          question_text TEXT NOT NULL,
          option_a TEXT NOT NULL,
          option_b TEXT NOT NULL,
          option_c TEXT NOT NULL,
          option_d TEXT NOT NULL,
          correct_option VARCHAR(10) NOT NULL,
          points INT DEFAULT 1,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS quiz_submissions (
          id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
          quiz_id VARCHAR(36) NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
          junior_id VARCHAR(36) NOT NULL REFERENCES juniors(id) ON DELETE CASCADE,
          score INT NOT NULL DEFAULT 0,
          total_points INT NOT NULL DEFAULT 0,
          percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
          answers_json JSONB,
          is_invalidated BOOLEAN DEFAULT false,
          tab_switches INT DEFAULT 0,
          violation_reason TEXT,
          submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(quiz_id, junior_id)
      );

      ALTER TABLE quiz_submissions ADD COLUMN IF NOT EXISTS is_invalidated BOOLEAN DEFAULT false;
      ALTER TABLE quiz_submissions ADD COLUMN IF NOT EXISTS tab_switches INT DEFAULT 0;
      ALTER TABLE quiz_submissions ADD COLUMN IF NOT EXISTS violation_reason TEXT;
    `);
  } catch (err: any) {
    console.warn('Quiz table initialization notice:', err.message);
  }
};

export const initSystemSettingsTables = async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (err: any) {
    console.warn('System settings table initialization notice:', err.message);
  }
};

export const initDisciplinaryCommitteeTables = async () => {
  try {
    await query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_disciplinary_committee BOOLEAN DEFAULT false;
      ALTER TABLE faculty ADD COLUMN IF NOT EXISTS is_disciplinary_committee BOOLEAN DEFAULT false;

      CREATE TABLE IF NOT EXISTS disciplinary_committee_members (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
        faculty_id VARCHAR(36) REFERENCES faculty(id) ON DELETE CASCADE,
        designation VARCHAR(100) DEFAULT 'Committee Member',
        appointed_by VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id)
      );

      CREATE TABLE IF NOT EXISTS student_disciplinary_complaints (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        student_user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        complainant_user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        complaint_type VARCHAR(50) NOT NULL,
        description TEXT,
        severity VARCHAR(20) DEFAULT 'MEDIUM' NOT NULL,
        action_taken TEXT,
        status VARCHAR(30) DEFAULT 'REPORTED' NOT NULL,
        offense_number INT DEFAULT 1,
        incident_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE student_disciplinary_complaints ADD COLUMN IF NOT EXISTS offense_number INT DEFAULT 1;

      CREATE INDEX IF NOT EXISTS idx_disc_complaints_student ON student_disciplinary_complaints(student_user_id);
      CREATE INDEX IF NOT EXISTS idx_disc_complaints_complainant ON student_disciplinary_complaints(complainant_user_id);
      CREATE INDEX IF NOT EXISTS idx_disc_complaints_status ON student_disciplinary_complaints(status);
    `);
  } catch (err: any) {
    console.warn('Disciplinary Committee table initialization notice:', err.message);
  }
};

export const initBloodDonationTables = async () => {
  try {
    await query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS blood_group VARCHAR(5);

      CREATE TABLE IF NOT EXISTS blood_requests (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        requester_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        patient_name VARCHAR(150) NOT NULL,
        contact_number VARCHAR(30) NOT NULL,
        blood_group VARCHAR(5) NOT NULL,
        units_needed INT NOT NULL DEFAULT 1,
        urgency VARCHAR(20) NOT NULL DEFAULT 'NORMAL' CHECK (urgency IN ('NORMAL', 'URGENT', 'CRITICAL')),
        hospital_name VARCHAR(200),
        additional_notes TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'FULFILLED', 'CANCELLED', 'EXPIRED')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_blood_requests_bg ON blood_requests(blood_group);
      CREATE INDEX IF NOT EXISTS idx_blood_requests_status ON blood_requests(status);
      CREATE INDEX IF NOT EXISTS idx_blood_requests_requester ON blood_requests(requester_id);

      CREATE TABLE IF NOT EXISTS blood_donors (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        request_id VARCHAR(36) NOT NULL REFERENCES blood_requests(id) ON DELETE CASCADE,
        donor_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL DEFAULT 'PLEDGED' CHECK (status IN ('PLEDGED', 'CONFIRMED', 'CANCELLED')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(request_id, donor_id)
      );

      CREATE INDEX IF NOT EXISTS idx_blood_donors_req ON blood_donors(request_id);
      CREATE INDEX IF NOT EXISTS idx_blood_donors_donor ON blood_donors(donor_id);
    `);
  } catch (err: any) {
    console.warn('Blood donation table initialization notice:', err.message);
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
