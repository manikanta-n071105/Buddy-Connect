const { Pool } = require('./backend/node_modules/pg');
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_1Rt5VvrgSnGF@ep-silent-water-b4eqmcmr-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const res = await pool.query(
    "SELECT department, period, sections_data FROM departmental_monthly_reports WHERE department = $1 AND period = $2",
    ['Humanities & Sciences', 'October 2026']
  );
  const s = typeof res.rows[0].sections_data === 'string' ? JSON.parse(res.rows[0].sections_data) : res.rows[0].sections_data;
  const sdp = s.sdp.find(it => it.resourcePerson && it.resourcePerson.includes('Venu'));
  console.log('Title:', sdp.title);
  console.log('Char codes:');
  for (let i = 0; i < sdp.title.length; i++) {
    const c = sdp.title[i];
    if (c.charCodeAt(0) > 127 || c === '$' || c === '-' || c === '{' || c === '}') {
      console.log('  idx', i, 'char:', c, 'code: 0x' + c.charCodeAt(0).toString(16));
    }
  }
  await pool.end();
}
main();
