import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  createTestApp,
  createUserAndLogin,
  loginAsAdmin,
  resetDatabase,
} from './utils/test-app';

describe('Estudiantes y materias (e2e)', () => {
  let app: INestApplication<App>;
  let adminToken: string;
  let teacherToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    await resetDatabase(app);
    adminToken = await loginAsAdmin(app);
    teacherToken = await createUserAndLogin(app, adminToken, {
      email: 'docente.catalogo@colegio.edu.co',
      role: 'TEACHER',
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('estudiantes', () => {
    let studentId: string;

    it('el admin crea un estudiante', async () => {
      const response = await request(app.getHttpServer())
        .post('/students')
        .auth(adminToken, { type: 'bearer' })
        .send({
          firstName: 'Laura',
          lastName: 'Gómez',
          email: 'laura@colegio.edu.co',
          gradeLevel: '9A',
        })
        .expect(201);

      studentId = response.body.id;
      expect(response.body).toMatchObject({ firstName: 'Laura' });
    });

    it('rechaza campos que no existen en el DTO', () => {
      return request(app.getHttpServer())
        .post('/students')
        .auth(adminToken, { type: 'bearer' })
        .send({
          firstName: 'Pedro',
          lastName: 'Ruiz',
          gradeLevel: '9A',
          role: 'ADMIN',
        })
        .expect(400);
    });

    it('rechaza un correo de estudiante repetido con 409', () => {
      return request(app.getHttpServer())
        .post('/students')
        .auth(adminToken, { type: 'bearer' })
        .send({
          firstName: 'Otra',
          lastName: 'Laura',
          email: 'laura@colegio.edu.co',
          gradeLevel: '9B',
        })
        .expect(409);
    });

    it('el docente puede listar estudiantes', async () => {
      const response = await request(app.getHttpServer())
        .get('/students')
        .auth(teacherToken, { type: 'bearer' })
        .expect(200);

      expect(response.body).toMatchObject({ total: 1, page: 1 });
      expect(response.body.data).toHaveLength(1);
    });

    it('el docente no puede crear, editar ni borrar estudiantes', async () => {
      const server = app.getHttpServer();
      await request(server)
        .post('/students')
        .auth(teacherToken, { type: 'bearer' })
        .send({ firstName: 'X', lastName: 'Y', gradeLevel: '9A' })
        .expect(403);
      await request(server)
        .patch(`/students/${studentId}`)
        .auth(teacherToken, { type: 'bearer' })
        .send({ gradeLevel: '10A' })
        .expect(403);
      await request(server)
        .delete(`/students/${studentId}`)
        .auth(teacherToken, { type: 'bearer' })
        .expect(403);
    });

    it('responde 400 si el id no es un UUID y 404 si no existe', async () => {
      const server = app.getHttpServer();
      await request(server)
        .get('/students/123')
        .auth(adminToken, { type: 'bearer' })
        .expect(400);
      await request(server)
        .get('/students/00000000-0000-4000-8000-000000000000')
        .auth(adminToken, { type: 'bearer' })
        .expect(404);
    });

    it('el admin edita y borra un estudiante', async () => {
      const server = app.getHttpServer();
      await request(server)
        .patch(`/students/${studentId}`)
        .auth(adminToken, { type: 'bearer' })
        .send({ gradeLevel: '10A' })
        .expect(200)
        .expect((response) => expect(response.body.gradeLevel).toBe('10A'));
      await request(server)
        .delete(`/students/${studentId}`)
        .auth(adminToken, { type: 'bearer' })
        .expect(204);
    });
  });

  describe('paginación y búsqueda de estudiantes', () => {
    beforeAll(async () => {
      for (const [firstName, lastName, gradeLevel] of [
        ['Ana', 'Pérez', '10A'],
        ['Carlos', 'Gómez', '10A'],
        ['Diana', 'Gómez', '11B'],
      ]) {
        await request(app.getHttpServer())
          .post('/students')
          .auth(adminToken, { type: 'bearer' })
          .send({ firstName, lastName, gradeLevel })
          .expect(201);
      }
    });

    it('devuelve la página pedida con el total', async () => {
      const response = await request(app.getHttpServer())
        .get('/students')
        .query({ page: 2, limit: 2 })
        .auth(teacherToken, { type: 'bearer' })
        .expect(200);

      expect(response.body).toMatchObject({
        total: 3,
        page: 2,
        limit: 2,
        totalPages: 2,
      });
      expect(response.body.data).toHaveLength(1);
    });

    it('busca sin importar mayúsculas y filtra por grado', async () => {
      const server = app.getHttpServer();
      const search = await request(server)
        .get('/students')
        .query({ search: 'GÓMEZ' })
        .auth(teacherToken, { type: 'bearer' })
        .expect(200);
      expect(search.body.total).toBe(2);

      const filtered = await request(server)
        .get('/students')
        .query({ search: 'gómez', gradeLevel: '11B' })
        .auth(teacherToken, { type: 'bearer' })
        .expect(200);
      expect(
        filtered.body.data.map((s: { firstName: string }) => s.firstName),
      ).toEqual(['Diana']);
    });

    it('rechaza más de 100 registros por página', () => {
      return request(app.getHttpServer())
        .get('/students')
        .query({ limit: 101 })
        .auth(teacherToken, { type: 'bearer' })
        .expect(400);
    });
  });

  describe('materias', () => {
    it('el admin crea una materia', () => {
      return request(app.getHttpServer())
        .post('/areas')
        .auth(adminToken, { type: 'bearer' })
        .send({ name: 'Matemáticas' })
        .expect(201);
    });

    it('rechaza un nombre repetido aunque cambien mayúsculas', () => {
      return request(app.getHttpServer())
        .post('/areas')
        .auth(adminToken, { type: 'bearer' })
        .send({ name: '  MATEMÁTICAS ' })
        .expect(409);
    });

    it('el docente puede ver las materias pero no crearlas', async () => {
      const server = app.getHttpServer();
      await request(server)
        .get('/areas')
        .auth(teacherToken, { type: 'bearer' })
        .expect(200);
      await request(server)
        .post('/areas')
        .auth(teacherToken, { type: 'bearer' })
        .send({ name: 'Inglés' })
        .expect(403);
    });
  });
});
