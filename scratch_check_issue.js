const { Pool } = require('./backend/node_modules/pg');
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_1Rt5VvrgSnGF@ep-silent-water-b4eqmcmr-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const res = await pool.query(
      "SELECT department, period, sections_data FROM departmental_monthly_reports WHERE department = $1 AND period = $2",
      ['Humanities & Sciences', 'October 2026']
    );
    if (!res.rows.length) {
      console.log('No rows found');
      return;
    }
    const r = res.rows[0];
    const s = typeof r.sections_data === 'string' ? JSON.parse(r.sections_data) : r.sections_data;
    for (const [k, v] of Object.entries(s)) {
      const jsonStr = JSON.stringify(v);
      if (jsonStr.includes('Venu')) {
        console.log('=== SECTION KEY:', k, '===');
        console.log(JSON.stringify(v, null, 2));
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
main();

