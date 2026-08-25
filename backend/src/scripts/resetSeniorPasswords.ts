import { query } from '../config/db';
import bcrypt from 'bcryptjs';

async function resetSeniorPasswords() {
  const hash = await bcrypt.hash('Password123!', 10);
  const res = await query(`UPDATE users SET password_hash = $1 WHERE role = 'SENIOR'`, [hash]);
  console.log(`Updated ${res.rowCount} Senior user passwords to 'Password123!'`);
  process.exit(0);
}

resetSeniorPasswords();
