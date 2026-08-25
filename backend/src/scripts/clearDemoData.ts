import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function clearDemoData() {
  const host = process.env.PGHOST || 'localhost';
  const port = parseInt(process.env.PGPORT || '5432');
  const user = process.env.PGUSER || 'postgres';
  const password = process.env.PGPASSWORD || 'Manikanta@340';
  const database = process.env.PGDATABASE || 'juniorconnect';

  console.log(`Connecting to PostgreSQL database '${database}' (${host}:${port})...`);

  const client = new Client({
    user,
    password,
    host,
    port,
    database
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL server.');

    console.log('Clearing demo data across all tables...');

    await client.query('BEGIN');

    // 1. Delete Messages & Conversations
    await client.query('DELETE FROM mentor_messages');
    await client.query('DELETE FROM mentor_conversations');

    // 2. Delete Issue Related Data
    await client.query('DELETE FROM issue_votes');
    await client.query('DELETE FROM issue_comments');
    await client.query('DELETE FROM issue_attachments');
    await client.query('DELETE FROM issues');

    // 3. Delete Onboarding Progress & Responses
    await client.query('DELETE FROM onboarding_progress');
    await client.query('DELETE FROM question_responses');

    // 4. Delete Survey Data
    await client.query('DELETE FROM survey_responses');

    // 5. Delete Suggestions & Votes
    await client.query('DELETE FROM suggestion_votes');
    await client.query('DELETE FROM suggestions');

    // 6. Delete Announcements & Emergency Contacts
    await client.query('DELETE FROM announcements');
    await client.query('DELETE FROM emergency_contacts');

    // 7. Delete Notifications & Audit Logs
    await client.query('DELETE FROM notifications');
    await client.query('DELETE FROM audit_logs');

    // 8. Delete Hierarchy Accounts (Juniors, Seniors, Directors, Temporary Mentors)
    await client.query('DELETE FROM temporary_mentors');
    await client.query('DELETE FROM juniors');
    await client.query('DELETE FROM seniors');
    await client.query('DELETE FROM directors');

    // 9. Delete Admin Permissions for non-superadmins
    await client.query(`
      DELETE FROM admin_permissions 
      WHERE user_id IN (SELECT id FROM users WHERE role != 'SUPER_ADMIN')
    `);

    // 10. Delete All Users except Super Admin
    const delUsersRes = await client.query("DELETE FROM users WHERE role != 'SUPER_ADMIN'");
    console.log(`Deleted ${delUsersRes.rowCount} demo user accounts (Admins, Directors, Seniors, Juniors).`);

    await client.query('COMMIT');
    console.log('✅ Demo data cleared successfully! Super Admin account preserved.');
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('❌ Error clearing demo data:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

clearDemoData();
