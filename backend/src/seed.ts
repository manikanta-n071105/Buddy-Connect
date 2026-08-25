import bcrypt from 'bcryptjs';
import { query, executeTransaction } from './config/db';
import { logger } from './utils/logger';

async function seed() {
  logger.info('Starting JuniorConnect database seeding...');

  try {
    // 1. System Settings
    const settings = [
      { key: 'MAX_SENIORS_PER_DIRECTOR', value: '8', description: 'Maximum Seniors manageable per Director' },
      { key: 'MAX_JUNIORS_PER_SENIOR', value: '8', description: 'Maximum Juniors assigned per Senior mentor' },
      { key: 'MAX_JUNIORS_PER_FACULTY', value: '5', description: 'Maximum Juniors assigned per Faculty mentor' },
      { key: 'ISSUE_ESCALATION_HOURS', value: '24', description: 'Hours before unhandled issue escalates to Director' },
      { key: 'CRITICAL_ISSUE_ESCALATION_HOURS', value: '6', description: 'Hours before critical issue escalates to Director/SuperAdmin' },
      { key: 'VOTING_DURATION_HOURS', value: '48', description: 'Hours resolution voting remains open' },
      { key: 'MINIMUM_VOTES', value: '1', description: 'Minimum votes required to determine auto close' },
      { key: 'SATISFACTION_THRESHOLD', value: '60', description: 'Percentage of Satisfied votes needed to auto close issue' },
      { key: 'REOPEN_THRESHOLD', value: '40', description: 'Dissatisfaction percentage that triggers auto reopen' }
    ];

    for (const s of settings) {
      await query(
        `INSERT INTO system_settings (key, value, description)
         VALUES ($1, $2, $3)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description`,
        [s.key, s.value, s.description]
      );
    }
    logger.info('System settings seeded.');

    // 2. Issue Categories
    const categories = [
      'Academic', 'Hostel', 'Food', 'Transport', 'Faculty', 'Infrastructure',
      'Library', 'Fees', 'Examination', 'College Tour', 'Events', 'Technical',
      'ID Card', 'Accommodation', 'Safety', 'Other'
    ];

    for (const cat of categories) {
      await query(
        `INSERT INTO issue_categories (name, description)
         VALUES ($1, $2)
         ON CONFLICT (name) DO NOTHING`,
        [cat, `${cat} support and queries`]
      );
    }
    logger.info('Issue categories seeded.');

    // 3. Onboarding Checklist Items
    const onboardingItems = [
      { title: 'College ID received', category: 'General', seq: 1 },
      { title: 'Senior introduction completed', category: 'Mentorship', seq: 2 },
      { title: 'Director introduction completed', category: 'Mentorship', seq: 3 },
      { title: 'Campus & Facilities tour', category: 'Orientation', seq: 4 },
      { title: 'Library portal & physical orientation', category: 'Academic', seq: 5 },
      { title: 'Hostel rules & warden orientation', category: 'Residence', seq: 6 },
      { title: 'Academic portal login activated', category: 'Academic', seq: 7 },
      { title: 'Semester timetable received', category: 'Academic', seq: 8 },
      { title: 'Department lab orientation', category: 'Academic', seq: 9 },
      { title: 'Emergency contacts & safety protocols', category: 'Safety', seq: 10 },
      { title: 'College code of conduct rules reviewed', category: 'General', seq: 11 }
    ];

    for (const item of onboardingItems) {
      await query(
        `INSERT INTO onboarding_items (title, description, category, sequence_order, is_required)
         VALUES ($1, $2, $3, $4, true)
         ON CONFLICT DO NOTHING`,
        [item.title, `Complete ${item.title.toLowerCase()}`, item.category, item.seq]
      );
    }
    logger.info('Onboarding items seeded.');

    // 4. Common Questions
    const questions = [
      { text: 'Have you completed your official campus tour?', type: 'YES_NO' },
      { text: 'Have you met your assigned Senior mentor?', type: 'YES_NO' },
      { text: 'Have you received your official College ID Card?', type: 'YES_NO' },
      { text: 'Do you understand your semester timetable and classroom locations?', type: 'YES_NO' },
      { text: 'Rate your overall onboarding experience so far (1-5)', type: 'RATING' }
    ];

    for (const q of questions) {
      await query(
        `INSERT INTO questions (question_text, question_type, is_required)
         VALUES ($1, $2, true)
         ON CONFLICT DO NOTHING`,
        [q.text, q.type]
      );
    }

    // 5. Emergency Contacts
    const emergencyContacts = [
      { name: 'Campus Main Security Desk', type: 'Security', phone: '040-23456789', location: 'Main Gate Gate 1', avail: '24/7' },
      { name: 'Student Medical Health Center', type: 'Medical', phone: '040-23456790', location: 'Health Complex Block B', avail: '24/7' },
      { name: 'Hostel Chief Warden Office', type: 'Hostel', phone: '040-23456791', location: 'Hostel Office Admin', avail: '8 AM - 10 PM' },
      { name: 'Campus Safety & Anti-Ragging Helpline', type: 'Safety', phone: '040-23456792', location: 'Dean Office Block A', avail: '24/7' }
    ];

    for (const ec of emergencyContacts) {
      await query(
        `INSERT INTO emergency_contacts (name, contact_type, phone, location, availability)
         VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING`,
        [ec.name, ec.type, ec.phone, ec.location, ec.avail]
      );
    }

    // 6. Default Users Hierarchy Seeding
    const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

    await executeTransaction(async (client) => {
      // Super Admin
      const saRes = await client.query(
        `INSERT INTO users (name, email, username, password_hash, phone, role)
         VALUES ('Super Administrator', 'superadmin@juniorconnect.edu', 'superadmin', $1, '9998887770', 'SUPER_ADMIN')
         ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash RETURNING id`,
        [defaultPasswordHash]
      );

      // Admins
      const admin1Res = await client.query(
        `INSERT INTO users (name, email, username, password_hash, phone, role)
         VALUES ('Academic Admin', 'admin1@juniorconnect.edu', 'admin1', $1, '9998887771', 'ADMIN')
         ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash RETURNING id`,
        [defaultPasswordHash]
      );
      const admin1Id = admin1Res.rows[0].id;
      const perms = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'REPORTS', 'MANAGE_USERS', 'MANAGE_ISSUES', 'MANAGE_SURVEYS', 'VIEW_ANALYTICS', 'MANAGE_ANNOUNCEMENTS'];
      for (const p of perms) {
        await client.query(`INSERT INTO admin_permissions (user_id, permission) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [admin1Id, p]);
      }

      // Directors
      const dir1User = await client.query(
        `INSERT INTO users (name, email, username, password_hash, phone, role)
         VALUES ('Dr. Robert Vance', 'director.cs@juniorconnect.edu', 'director1', $1, '9876543210', 'DIRECTOR')
         ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash RETURNING id`,
        [defaultPasswordHash]
      );
      const dir1Res = await client.query(
        `INSERT INTO directors (user_id, director_code, department)
         VALUES ($1, 'DIR-CSE-01', 'Computer Science & Engineering')
         ON CONFLICT (director_code) DO UPDATE SET department = EXCLUDED.department RETURNING id`,
        [dir1User.rows[0].id]
      );
      const dir1Id = dir1Res.rows[0].id;

      const dir2User = await client.query(
        `INSERT INTO users (name, email, username, password_hash, phone, role)
         VALUES ('Dr. Sarah Jenkins', 'director.ece@juniorconnect.edu', 'director2', $1, '9876543211', 'DIRECTOR')
         ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash RETURNING id`,
        [defaultPasswordHash]
      );
      const dir2Res = await client.query(
        `INSERT INTO directors (user_id, director_code, department)
         VALUES ($1, 'DIR-ECE-02', 'Electronics & Communication')
         ON CONFLICT (director_code) DO UPDATE SET department = EXCLUDED.department RETURNING id`,
        [dir2User.rows[0].id]
      );
      const dir2Id = dir2Res.rows[0].id;

      // Seniors
      const seniorsData = [
        { name: 'Alex Harrison', email: 'alex.sen@juniorconnect.edu', username: 'senior1', code: 'SEN-CSE-01', dirId: dir1Id, dept: 'Computer Science & Engineering' },
        { name: 'Elena Rostova', email: 'elena.sen@juniorconnect.edu', username: 'senior2', code: 'SEN-CSE-02', dirId: dir1Id, dept: 'Computer Science & Engineering' },
        { name: 'Michael Chang', email: 'michael.sen@juniorconnect.edu', username: 'senior3', code: 'SEN-ECE-01', dirId: dir2Id, dept: 'Electronics & Communication' },
        { name: 'Sophia Martinez', email: 'sophia.sen@juniorconnect.edu', username: 'senior4', code: 'SEN-ECE-02', dirId: dir2Id, dept: 'Electronics & Communication' }
      ];

      const seniorIds: string[] = [];

      for (const sen of seniorsData) {
        const u = await client.query(
          `INSERT INTO users (name, email, username, password_hash, phone, role)
           VALUES ($1, $2, $3, $4, '9876500000', 'SENIOR')
           ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash RETURNING id`,
          [sen.name, sen.email, sen.username, defaultPasswordHash]
        );
        const s = await client.query(
          `INSERT INTO seniors (user_id, senior_code, director_id, department)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (senior_code) DO UPDATE SET director_id = EXCLUDED.director_id RETURNING id`,
          [u.rows[0].id, sen.code, sen.dirId, sen.dept]
        );
        seniorIds.push(s.rows[0].id);
      }

      // Juniors
      const juniorsData = [
        { name: 'Mani Kanta', email: 'mani.jun@juniorconnect.edu', username: 'junior1', reg: 'REG-2026-001', senId: seniorIds[0], dept: 'Computer Science & Engineering', batch: '2025-2029', year: '1st Year' },
        { name: 'Priya Sharma', email: 'priya.jun@juniorconnect.edu', username: 'junior2', reg: 'REG-2026-002', senId: seniorIds[0], dept: 'Computer Science & Engineering', batch: '2025-2029', year: '1st Year' },
        { name: 'David Miller', email: 'david.jun@juniorconnect.edu', username: 'junior3', reg: 'REG-2026-003', senId: seniorIds[1], dept: 'Computer Science & Engineering', batch: '2025-2029', year: '1st Year' },
        { name: 'Anita Patel', email: 'anita.jun@juniorconnect.edu', username: 'junior4', reg: 'REG-2026-004', senId: seniorIds[2], dept: 'Electronics & Communication', batch: '2025-2029', year: '1st Year' }
      ];

      for (const jun of juniorsData) {
        const u = await client.query(
          `INSERT INTO users (name, email, username, password_hash, phone, role)
           VALUES ($1, $2, $3, $4, '9876511111', 'JUNIOR')
           ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash RETURNING id`,
          [jun.name, jun.email, jun.username, defaultPasswordHash]
        );
        const j = await client.query(
          `INSERT INTO juniors (user_id, register_number, senior_id, department, batch, year, joining_date)
           VALUES ($1, $2, $3, $4, $5, $6, '2026-08-01')
           ON CONFLICT (register_number) DO UPDATE SET senior_id = EXCLUDED.senior_id RETURNING id`,
          [u.rows[0].id, jun.reg, jun.senId, jun.dept, jun.batch, jun.year]
        );

        // Attach default onboarding items
        const items = await client.query(`SELECT id FROM onboarding_items`);
        for (let i = 0; i < items.rows.length; i++) {
          const isComp = i < 7; // complete 7 items for realistic progress
          await client.query(
            `INSERT INTO onboarding_progress (junior_id, onboarding_item_id, is_completed, completed_at)
             VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
            [j.rows[0].id, items.rows[i].id, isComp, isComp ? new Date() : null]
          );
        }
      }
    });

    logger.info('Default hierarchy (SuperAdmin, Admins, Directors, Seniors, Juniors) seeded.');

    // 7. Seed Sample Issue & 3-Color Votes
    const catRes = await query(`SELECT id FROM issue_categories WHERE name = 'Hostel' LIMIT 1`);
    const junRes = await query(`SELECT j.id as junior_id, j.user_id as junior_user_id, j.senior_id, s.director_id, s.user_id as senior_user_id FROM juniors j JOIN seniors s ON j.senior_id = s.id LIMIT 1`);

    if (catRes.rowCount! > 0 && junRes.rowCount! > 0) {
      const jun = junRes.rows[0];
      const categoryId = catRes.rows[0].id;

      const issueRes = await query(
        `INSERT INTO issues (
          issue_number, reported_by_id, junior_id, senior_id, director_id,
          category_id, title, description, priority, status, assigned_to_id, resolution
        ) VALUES (
          'JC-1001', $1, $2, $3, $4,
          $5, 'Hostel Room Water Supply Pressure Issue', 'Water pressure in Block C room 304 is low during morning hours.',
          'HIGH', 'VOTING', $6, 'Plumbing maintenance team inspected and replaced main valve on Block C line.'
        ) ON CONFLICT (issue_number) DO UPDATE SET status = EXCLUDED.status RETURNING id`,
        [jun.junior_user_id, jun.junior_id, jun.senior_id, jun.director_id, categoryId, jun.senior_user_id]
      );

      const issueId = issueRes.rows[0].id;

      // Add vote
      await query(
        `INSERT INTO issue_votes (issue_id, voter_id, vote_type, comment)
         VALUES ($1, $2, 'SATISFIED', 'The plumbing issue was resolved promptly by senior. Thank you!')
         ON CONFLICT DO NOTHING`,
        [issueId, jun.junior_user_id]
      );
    }

    logger.info('Database seeding completed successfully.');
  } catch (err) {
    logger.error('Error seeding database:', err);
  }
}

seed();
