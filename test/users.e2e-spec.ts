import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  createTestApp,
  createUserAndLogin,
  login,
  loginAsAdmin,
  resetDatabase,
} from './utils/test-app';
import { TEST_ADMIN } from './utils/test-env';

describe('Gestión de usuarios (e2e)', () => {
  let app: INestApplication<App>;
  let adminToken: string;
  let adminId: string;
  let teacherToken: string;
  let teacherId: string;

  beforeAll(async () => {
    app = await createTestApp();
    await resetDatabase(app);
    adminToken = await loginAsAdmin(app);
    teacherToken = await createUserAndLogin(app, adminToken, {
      email: 'docente.usuarios@colegio.edu.co',
      role: 'TEACHER',
    });

    const me = await request(app.getHttpServer())
      .get('/auth/me')
      .auth(adminToken, { type: 'bearer' });
    adminId = me.body.id;
    const teacher = await request(app.getHttpServer())
      .get('/auth/me')
      .auth(teacherToken, { type: 'bearer' });
    teacherId = teacher.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('el admin lista los usuarios sin contraseñas', async () => {
    const response = await request(app.getHttpServer())
      .get('/users')
      .auth(adminToken, { type: 'bearer' })
      .expect(200);

    expect(response.body).toHaveLength(2);
    expect(response.body[0]).not.toHaveProperty('passwordHash');
  });

  it('un docente no puede gestionar usuarios', () => {
    return request(app.getHttpServer())
      .get('/users')
      .auth(teacherToken, { type: 'bearer' })
      .expect(403);
  });

  it('el admin cambia la contraseña de un docente', async () => {
    await request(app.getHttpServer())
      .patch(`/users/${teacherId}`)
      .auth(adminToken, { type: 'bearer' })
      .send({ password: 'ClaveNueva123' })
      .expect(200);

    await login(app, 'docente.usuarios@colegio.edu.co', 'ClaveNueva123');
  });

  it('no deja quitarle el rol al único admin ni que se borre a sí mismo', async () => {
    const server = app.getHttpServer();
    await request(server)
      .patch(`/users/${adminId}`)
      .auth(adminToken, { type: 'bearer' })
      .send({ role: 'TEACHER' })
      .expect(409);

    await request(server)
      .delete(`/users/${adminId}`)
      .auth(adminToken, { type: 'bearer' })
      .expect(400);
  });

  it('el admin borra un usuario y su token deja de servir', async () => {
    await request(app.getHttpServer())
      .delete(`/users/${teacherId}`)
      .auth(adminToken, { type: 'bearer' })
      .expect(204);

    await request(app.getHttpServer())
      .get('/auth/me')
      .auth(teacherToken, { type: 'bearer' })
      .expect(401);
  });

  it('el admin sigue pudiendo iniciar sesión', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send(TEST_ADMIN)
      .expect(200);
  });
});
