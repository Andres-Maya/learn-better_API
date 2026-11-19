import { execSync } from 'node:child_process';
import { Client } from 'pg';
import { loadTestEnv } from './utils/test-env';

// Recreates the test database from scratch and applies the real migrations,
// the same way they run in production.
export default async function globalSetup(): Promise<void> {
  loadTestEnv();
  const database = process.env.DB_NAME!;
  const connection = {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  };

  const admin = new Client({ ...connection, database: 'postgres' });
  await admin.connect();
  try {
    await admin.query(`DROP DATABASE IF EXISTS "${database}" WITH (FORCE)`);
    await admin.query(`CREATE DATABASE "${database}"`);
  } finally {
    await admin.end();
  }

  execSync('npm run migration:run', { stdio: 'ignore', env: process.env });
}
