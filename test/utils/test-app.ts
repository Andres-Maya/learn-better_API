import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/app.setup';
import { TEST_ADMIN } from './test-env';

export async function createTestApp(): Promise<INestApplication<App>> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication<INestApplication<App>>();
  configureApp(app);
  await app.init();
  return app;
}

// Leaves only the admin created on startup, so each test file starts clean.
export async function resetDatabase(app: INestApplication): Promise<void> {
  const dataSource = app.get(DataSource);
  // DELETE instead of TRUNCATE ... CASCADE, which would also empty "users"
  // through its foreign key to "students" and remove the admin.
  await dataSource.query(`DELETE FROM "users" WHERE "role" <> 'ADMIN'`);
  await dataSource.query('DELETE FROM "grades"');
  await dataSource.query('DELETE FROM "students"');
  await dataSource.query('DELETE FROM "areas"');
}

export async function login(
  app: INestApplication<App>,
  email: string,
  password: string,
): Promise<string> {
  const response = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password })
    .expect(200);
  return (response.body as { accessToken: string }).accessToken;
}

export function loginAsAdmin(app: INestApplication<App>): Promise<string> {
  return login(app, TEST_ADMIN.email, TEST_ADMIN.password);
}

// Creates a user through the API as the admin and returns its token.
export async function createUserAndLogin(
  app: INestApplication<App>,
  adminToken: string,
  user: { email: string; role: string; studentId?: string },
): Promise<string> {
  const password = 'Password123';
  await request(app.getHttpServer())
    .post('/auth/register')
    .auth(adminToken, { type: 'bearer' })
    .send({ ...user, password })
    .expect(201);
  return login(app, user.email, password);
}
