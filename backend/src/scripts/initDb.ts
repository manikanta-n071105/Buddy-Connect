import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function initDb() {
  const dbUrl = process.env.DATABASE_URL;
  const isProduction = process.env.NODE_ENV === 'production' || process.env.DB_SSL === 'true';

  let targetClient: Client;

  if (dbUrl) {
    console.log(`Connecting directly to database via DATABASE_URL...`);
    targetClient = new Client({
      connectionString: dbUrl,
      ssl: isProduction ? { rejectUnauthorized: false } : false
    });
  } else {
    const host = process.env.PGHOST || 'localhost';
    const port = parseInt(process.env.PGPORT || '5432');
    const user = process.env.PGUSER || 'postgres';
    const password = process.env.PGPASSWORD || 'Manikanta@340';
    const targetDbName = process.env.PGDATABASE || 'juniorconnect';

    console.log(`Connecting to PostgreSQL server (${host}:${port}) as user '${user}'...`);

    const rootClient = new Client({
      user,
      password,
      host,
      port,
      database: 'postgres'
    });

    try {
      await rootClient.connect();
      console.log('Connected to PostgreSQL root server.');
      const checkDbRes = await rootClient.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [targetDbName]);
      if (checkDbRes.rowCount === 0) {
        console.log(`Database '${targetDbName}' does not exist. Creating database...`);
        await rootClient.query(`CREATE DATABASE "${targetDbName}"`);
        console.log(`Database '${targetDbName}' created successfully.`);
      } else {
        console.log(`Database '${targetDbName}' already exists.`);
      }
    } catch (err: any) {
      console.error('Error connecting/creating database:', err.message);
    } finally {
      await rootClient.end();
    }

    targetClient = new Client({
      user,
      password,
      host,
      port,
      database: targetDbName
    });
  }

  try {
    await targetClient.connect();
    console.log(`Executing migration schema DDL...`);
    const schemaPath = path.join(__dirname, '../../migrations/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await targetClient.query(schemaSql);
    console.log('Migration schema DDL applied successfully.');
  } catch (err: any) {
    console.error('Error executing migration schema:', err.message);
  } finally {
    await targetClient.end();
  }
}

initDb();
