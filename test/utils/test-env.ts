import { existsSync } from 'node:fs';

export const TEST_ADMIN = {
  email: 'admin.e2e@colegio.edu.co',
  password: 'AdminE2e123',
};

// Uses the database server from .env, but always a separate "<DB_NAME>_test"
// database so the e2e tests never touch the development data.
export function loadTestEnv(): void {
  // Global setup and the test files may share one process: load only once.
  if (process.env.E2E_ENV_LOADED === 'true') {
    return;
  }
  process.env.E2E_ENV_LOADED = 'true';
  if (existsSync('.env')) {
    process.loadEnvFile('.env');
  }
  process.env.NODE_ENV = 'test';
  process.env.DB_NAME =
    process.env.DB_TEST_NAME ?? `${process.env.DB_NAME ?? 'learn_better'}_test`;
  process.env.JWT_SECRET ??= 'e2e-secret-that-is-at-least-32-characters-long';
  process.env.ADMIN_EMAIL = TEST_ADMIN.email;
  process.env.ADMIN_PASSWORD = TEST_ADMIN.password;
}
