import { Client } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function clearDemoData() {
  const dbUrl = process.env.DATABASE_URL;
  const isProduction = process.env.NODE_ENV === 'production' || process.env.DB_SSL === 'true';

  let client: Client;

  if (dbUrl) {
    console.log(`Connecting directly to database via DATABASE_URL...`);
    client = new Client({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false }
    });
  } else {
    const host = process.env.PGHOST || 'localhost';
    const port = parseInt(process.env.PGPORT || '5432');
    const user = process.env.PGUSER || 'postgres';
    const password = process.env.PGPASSWORD || 'Manikanta@340';
    const database = process.env.PGDATABASE || 'juniorconnect';

    console.log(`Connecting to PostgreSQL database '${database}' (${host}:${port})...`);
    client = new Client({
      user,
      password,
      host,
      port,
      database
    });
  }

  try {
    await client.connect();
    console.log('Connected to PostgreSQL server.');
    console.log('Clearing demo data across all tables...');

    // Helper to safely clear tables if they exist
    const safeDelete = async (table: string) => {
      try {
        await client.query(`DELETE FROM ${table}`);
      } catch (err) {
        // Table might not exist yet, ignore
      }
    };

    // 1. Delete Messages & Conversations
    await safeDelete('mentor_messages');
    await safeDelete('mentor_conversations');
    await safeDelete('director_messages');
    await safeDelete('director_conversations');
    await safeDelete('faculty_messages');
    await safeDelete('faculty_conversations');

    // 2. Delete Meetings & Events
    await safeDelete('mentorship_meetings');
    await safeDelete('events');
    await safeDelete('announcement_reads');
    await safeDelete('announcements');
    await safeDelete('poll_votes');
    await safeDelete('poll_options');
    await safeDelete('polls');

    // 3. Delete Issue Related Data
    await safeDelete('issue_votes');
    await safeDelete('issue_comments');
    await safeDelete('issue_attachments');
    await safeDelete('issues');

    // 4. Delete Onboarding Progress & Responses
    await safeDelete('onboarding_progress');
    await safeDelete('question_responses');
    await safeDelete('survey_responses');
    await safeDelete('suggestion_votes');
    await safeDelete('suggestions');
    await safeDelete('notifications');
    await safeDelete('audit_logs');

    // 5. Delete Hierarchy Accounts
    await safeDelete('temporary_mentors');
    await safeDelete('juniors');
    await safeDelete('seniors');
    await safeDelete('faculty');
    await safeDelete('directors');

    // 6. Delete Admin Permissions for non-superadmins
    await client.query(`
      DELETE FROM admin_permissions 
      WHERE user_id IN (SELECT id FROM users WHERE role != 'SUPER_ADMIN')
    `);

    // 7. Delete All Users except Super Admin
    const delUsersRes = await client.query("DELETE FROM users WHERE role != 'SUPER_ADMIN'");
    console.log(`Deleted ${delUsersRes.rowCount} demo user accounts (Admins, Directors, Seniors, Juniors, Faculty).`);

    // 8. Ensure mani07 SuperAdmin Account
    const maniPasswordHash = await bcrypt.hash('Manikanta@340', 10);
    await client.query(
      `INSERT INTO users (name, email, username, password_hash, phone, role)
       VALUES ('Mani Kanta (Super Admin)', 'mani07@juniorconnect.edu', 'mani07', $1, '9999999999', 'SUPER_ADMIN')
       ON CONFLICT (email) DO UPDATE SET username = 'mani07', password_hash = EXCLUDED.password_hash, role = 'SUPER_ADMIN'`,
      [maniPasswordHash]
    );

    // Also update by username if exists
    await client.query(
      `UPDATE users SET password_hash = $1, role = 'SUPER_ADMIN' WHERE username = 'mani07'`,
      [maniPasswordHash]
    );

    console.log('✅ SuperAdmin account username: mani07 created/updated successfully.');
    console.log('✅ Demo data cleared successfully! Super Admin accounts (superadmin & mani07) preserved.');
  } catch (err: any) {
    console.error('❌ Error clearing demo data:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

clearDemoData();
