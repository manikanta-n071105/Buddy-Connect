import { Client } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// Helper to generate JNTUA Roll Numbers (e.g., 25KF1A0501 to 25KF1A0599, 25KF1A05A1...)
function generateJntuaRollNumbers(prefix: string, count: number): string[] {
  const rolls: string[] = [];
  for (let i = 1; i <= count; i++) {
    let numStr = i < 10 ? `0${i}` : i.toString(16).toUpperCase();
    if (numStr.length === 1) numStr = `0${numStr}`;
    rolls.push(`${prefix}${numStr}`);
  }
  return rolls;
}

async function seedJntuaLoadData() {
  const dbUrl = process.env.DATABASE_URL;
  const isProduction = process.env.NODE_ENV === 'production' || process.env.DB_SSL === 'true';

  let client: Client;

  if (dbUrl) {
    console.log(`Connecting directly to database via DATABASE_URL...`);
    client = new Client({
      connectionString: dbUrl,
      ssl: isProduction ? { rejectUnauthorized: false } : false
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
    console.log('Generating JNTUA Load Testing Data (Directors, Faculty, Seniors, Juniors)...');

    const defaultPassHash = await bcrypt.hash('Password123!', 10);

    // 1. Departments & Directors
    const departments = [
      { name: 'Computer Science & Engineering', code: 'CSE', dirName: 'Dr. R. V. Sharma', dirEmail: 'director.cse@sseptp.org', dirCode: 'DIR-CSE-01' },
      { name: 'Electronics & Communication', code: 'ECE', dirName: 'Dr. K. S. Rao', dirEmail: 'director.ece@sseptp.org', dirCode: 'DIR-ECE-02' },
      { name: 'Electrical & Electronics', code: 'EEE', dirName: 'Dr. M. V. Reddy', dirEmail: 'director.eee@sseptp.org', dirCode: 'DIR-EEE-03' }
    ];

    const directorMap: { [code: string]: string } = {};

    for (const dept of departments) {
      const uRes = await client.query(
        `INSERT INTO users (name, email, username, password_hash, phone, role)
         VALUES ($1, $2, $3, $4, '9876500000', 'DIRECTOR')
         ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
        [dept.dirName, dept.dirEmail, dept.dirEmail.split('@')[0], defaultPassHash]
      );
      const dRes = await client.query(
        `INSERT INTO directors (user_id, director_code, department)
         VALUES ($1, $2, $3)
         ON CONFLICT (director_code) DO UPDATE SET department = EXCLUDED.department RETURNING id`,
        [uRes.rows[0].id, dept.dirCode, dept.name]
      );
      directorMap[dept.code] = dRes.rows[0].id;
    }

    // 2. Faculty Mentors (2 per department)
    const facultyMap: { [code: string]: string[] } = { CSE: [], ECE: [], EEE: [] };
    for (const dept of departments) {
      for (let f = 1; f <= 2; f++) {
        const fEmail = `faculty.${dept.code.toLowerCase()}${f}@sseptp.org`;
        const fPassHash = await bcrypt.hash(fEmail, 10);
        const uRes = await client.query(
          `INSERT INTO users (name, email, username, password_hash, phone, role)
           VALUES ($1, $2, $3, $4, '9876540000', 'FACULTY')
           ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
          [`Prof. ${dept.code} Faculty Mentor ${f}`, fEmail, fEmail, fPassHash]
        );
        const facRes = await client.query(
          `INSERT INTO faculty (user_id, faculty_code, department)
           VALUES ($1, $2, $3)
           ON CONFLICT (faculty_code) DO UPDATE SET department = EXCLUDED.department RETURNING id`,
          [uRes.rows[0].id, `FAC-${dept.code}-0${f}`, dept.name]
        );
        facultyMap[dept.code].push(facRes.rows[0].id);
      }
    }

    // 3. Senior Mentors (JNTUA 23 series, e.g. 23KF1A0501@sseptp.org to 23KF1A0515@sseptp.org)
    const seniorMap: { [code: string]: string[] } = { CSE: [], ECE: [], EEE: [] };
    const deptCodes: { [key: string]: string } = { CSE: '05', ECE: '04', EEE: '02' };

    for (const dept of departments) {
      const codeNum = deptCodes[dept.code];
      const seniorRolls = generateJntuaRollNumbers(`23KF1A${codeNum}`, 10); // 10 seniors per dept

      for (let i = 0; i < seniorRolls.length; i++) {
        const roll = seniorRolls[i];
        const email = `${roll.toLowerCase()}@sseptp.org`;
        const passHash = await bcrypt.hash(email, 10);

        const uRes = await client.query(
          `INSERT INTO users (name, email, username, password_hash, phone, role)
           VALUES ($1, $2, $3, $4, '9876522222', 'SENIOR')
           ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
          [`Senior ${roll}`, email, email, passHash]
        );
        const sRes = await client.query(
          `INSERT INTO seniors (user_id, senior_code, director_id, department)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (senior_code) DO UPDATE SET director_id = EXCLUDED.director_id RETURNING id`,
          [uRes.rows[0].id, `SEN-${roll}`, directorMap[dept.code], dept.name]
        );
        seniorMap[dept.code].push(sRes.rows[0].id);
      }
    }

    // 4. Junior Students (JNTUA 25 series, e.g. 25KF1A0501@sseptp.org to 25KF1A0560@sseptp.org)
    let totalJuniorsSeeded = 0;

    for (const dept of departments) {
      const codeNum = deptCodes[dept.code];
      const juniorRolls = generateJntuaRollNumbers(`25KF1A${codeNum}`, 30); // 30 juniors per dept = 90 total juniors

      const deptSeniors = seniorMap[dept.code];
      const deptFaculty = facultyMap[dept.code];

      for (let j = 0; j < juniorRolls.length; j++) {
        const roll = juniorRolls[j];
        const email = `${roll.toLowerCase()}@sseptp.org`;
        // Password set to same email (or Roll No) e.g., 25kf1a0567@sseptp.org
        const passHash = await bcrypt.hash(email, 10);

        const assignedSenior = deptSeniors[j % deptSeniors.length];
        const assignedFaculty = deptFaculty[j % deptFaculty.length];

        const uRes = await client.query(
          `INSERT INTO users (name, email, username, password_hash, phone, role)
           VALUES ($1, $2, $3, $4, '9876533333', 'JUNIOR')
           ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash RETURNING id`,
          [`Student ${roll}`, email, email, passHash]
        );

        await client.query(
          `INSERT INTO juniors (user_id, register_number, senior_id, faculty_id, department, batch, year, joining_date)
           VALUES ($1, $2, $3, $4, $5, '2025-2029', '1st Year', '2026-08-01')
           ON CONFLICT (register_number) DO UPDATE SET senior_id = EXCLUDED.senior_id, faculty_id = EXCLUDED.faculty_id`,
          [uRes.rows[0].id, roll, assignedSenior, assignedFaculty, dept.name]
        );

        totalJuniorsSeeded++;
      }
    }

    console.log(`✅ JNTUA Load Test Data Populated Successfully!`);
    console.log(`- Directors: ${departments.length}`);
    console.log(`- Faculty Mentors: 6`);
    console.log(`- Senior Mentors: 30`);
    console.log(`- Junior Students: ${totalJuniorsSeeded} (Username/Email = Roll No e.g. 25kf1a0567@sseptp.org)`);
  } catch (err: any) {
    console.error('❌ Error generating JNTUA load data:', err.message);
  } finally {
    await client.end();
  }
}

seedJntuaLoadData();
