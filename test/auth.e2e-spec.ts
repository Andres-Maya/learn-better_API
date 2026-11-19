import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  createTestApp,
  createUserAndLogin,
  loginAsAdmin,
  resetDatabase,
} from './utils/test-app';
import { TEST_ADMIN } from './utils/test-env';

describe('Autenticación (e2e)', () => {
  let app: INestApplication<App>;
  let adminToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    await resetDatabase(app);
    adminToken = await loginAsAdmin(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('crea el administrador inicial al arrancar', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send(TEST_ADMIN)
      .expect(200);

    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.user).toMatchObject({
      email: TEST_ADMIN.email,
      role: 'ADMIN',
    });
    expect(response.body.user).not.toHaveProperty('passwordHash');
  });

  it('rechaza una contraseña incorrecta con 401', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: TEST_ADMIN.email, password: 'incorrecta' })
      .expect(401);
  });

  it('rechaza datos inválidos con 400', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'no-es-un-correo' })
      .expect(400);

    expect(response.body.message).toEqual(expect.any(Array));
  });

  it('pide token en las rutas protegidas', async () => {
    const response = await request(app.getHttpServer())
      .get('/students')
      .expect(401);

    expect(response.body).toMatchObject({
      statusCode: 401,
      path: '/students',
    });
  });

  it('rechaza un token inválido', () => {
    return request(app.getHttpServer())
      .get('/auth/me')
      .auth('token-falso', { type: 'bearer' })
      .expect(401);
  });

  it('GET /auth/me devuelve el usuario del token', async () => {
    const response = await request(app.getHttpServer())
      .get('/auth/me')
      .auth(adminToken, { type: 'bearer' })
      .expect(200);

    expect(response.body).toMatchObject({ email: TEST_ADMIN.email });
  });

  it('el admin crea un docente que luego puede iniciar sesión', async () => {
    const teacherToken = await createUserAndLogin(app, adminToken, {
      email: 'docente.auth@colegio.edu.co',
      role: 'TEACHER',
    });

    const response = await request(app.getHttpServer())
      .get('/auth/me')
      .auth(teacherToken, { type: 'bearer' })
      .expect(200);
    expect(response.body.role).toBe('TEACHER');
  });

  it('rechaza un correo de usuario repetido con 409', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .auth(adminToken, { type: 'bearer' })
      .send({
        email: TEST_ADMIN.email,
        password: 'Password123',
        role: 'TEACHER',
      })
      .expect(409);
  });

  it('un docente no puede crear usuarios', async () => {
    const teacherToken = await createUserAndLogin(app, adminToken, {
      email: 'docente.sin.permiso@colegio.edu.co',
      role: 'TEACHER',
    });

    await request(app.getHttpServer())
      .post('/auth/register')
      .auth(teacherToken, { type: 'bearer' })
      .send({
        email: 'otro@colegio.edu.co',
        password: 'Password123',
        role: 'ADMIN',
      })
      .expect(403);
  });
});
