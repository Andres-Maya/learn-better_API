import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  createTestApp,
  createUserAndLogin,
  loginAsAdmin,
  resetDatabase,
} from './utils/test-app';

describe('Notas y recomendaciones (e2e)', () => {
  let app: INestApplication<App>;
  let adminToken: string;
  let teacherToken: string;
  let lauraToken: string;
  let lauraId: string;
  let pedroId: string;
  let mathId: string;
  let englishId: string;
  let pedroGradeId: string;

  async function createStudent(firstName: string): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/students')
      .auth(adminToken, { type: 'bearer' })
      .send({ firstName, lastName: 'Prueba', gradeLevel: '9A' })
      .expect(201);
    return response.body.id;
  }

  async function createArea(name: string): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/areas')
      .auth(adminToken, { type: 'bearer' })
      .send({ name })
      .expect(201);
    return response.body.id;
  }

  async function addGrade(
    studentId: string,
    areaId: string,
    score: number,
    period: number,
  ): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/grades')
      .auth(teacherToken, { type: 'bearer' })
      .send({ studentId, areaId, score, period })
      .expect(201);
    return response.body.id;
  }

  beforeAll(async () => {
    app = await createTestApp();
    await resetDatabase(app);
    adminToken = await loginAsAdmin(app);
    teacherToken = await createUserAndLogin(app, adminToken, {
      email: 'docente.notas@colegio.edu.co',
      role: 'TEACHER',
    });

    lauraId = await createStudent('Laura');
    pedroId = await createStudent('Pedro');
    mathId = await createArea('Matemáticas');
    englishId = await createArea('Inglés');
    lauraToken = await createUserAndLogin(app, adminToken, {
      email: 'laura.notas@colegio.edu.co',
      role: 'STUDENT',
      studentId: lauraId,
    });

    // Laura: low in math but improving, superior in English.
    await addGrade(lauraId, mathId, 2.0, 1);
    await addGrade(lauraId, mathId, 2.6, 2);
    await addGrade(lauraId, englishId, 4.7, 1);
    await addGrade(lauraId, englishId, 4.8, 2);
    pedroGradeId = await addGrade(pedroId, mathId, 4.0, 1);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('registro de notas', () => {
    it.each([
      ['un puntaje mayor a 5', { score: 5.5, period: 1 }],
      ['un puntaje negativo', { score: -1, period: 1 }],
      ['un periodo fuera de 1 a 4', { score: 3, period: 5 }],
      ['más de dos decimales', { score: 3.555, period: 1 }],
    ])('rechaza %s con 400', async (_case, values) => {
      await request(app.getHttpServer())
        .post('/grades')
        .auth(teacherToken, { type: 'bearer' })
        .send({ studentId: lauraId, areaId: mathId, ...values })
        .expect(400);
    });

    it('responde 404 si el estudiante no existe', () => {
      return request(app.getHttpServer())
        .post('/grades')
        .auth(teacherToken, { type: 'bearer' })
        .send({
          studentId: '00000000-0000-4000-8000-000000000000',
          areaId: mathId,
          score: 3,
          period: 1,
        })
        .expect(404);
    });

    it('filtra por estudiante, materia y periodo', async () => {
      const response = await request(app.getHttpServer())
        .get('/grades')
        .query({ studentId: lauraId, areaId: mathId, period: 2 })
        .auth(teacherToken, { type: 'bearer' })
        .expect(200);

      expect(response.body.total).toBe(1);
      expect(response.body.data[0]).toMatchObject({ score: 2.6, period: 2 });
    });

    it('el docente edita una nota', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/grades/${pedroGradeId}`)
        .auth(teacherToken, { type: 'bearer' })
        .send({ score: 4.2 })
        .expect(200);

      expect(response.body.score).toBe(4.2);
    });

    it('un estudiante no puede registrar notas', () => {
      return request(app.getHttpServer())
        .post('/grades')
        .auth(lauraToken, { type: 'bearer' })
        .send({ studentId: lauraId, areaId: mathId, score: 5, period: 3 })
        .expect(403);
    });
  });

  describe('lo que ve un estudiante', () => {
    it('solo recibe sus propias notas', async () => {
      const response = await request(app.getHttpServer())
        .get('/grades')
        .auth(lauraToken, { type: 'bearer' })
        .expect(200);

      expect(response.body.total).toBe(4);
      expect(
        response.body.data.every(
          (grade: { studentId: string }) => grade.studentId === lauraId,
        ),
      ).toBe(true);
    });

    it('no puede filtrar ni abrir notas de otro estudiante', async () => {
      const server = app.getHttpServer();
      await request(server)
        .get('/grades')
        .query({ studentId: pedroId })
        .auth(lauraToken, { type: 'bearer' })
        .expect(403);
      await request(server)
        .get(`/grades/${pedroGradeId}`)
        .auth(lauraToken, { type: 'bearer' })
        .expect(403);
    });

    it('no puede ver las recomendaciones de otro estudiante', () => {
      return request(app.getHttpServer())
        .get(`/recommendations/students/${pedroId}`)
        .auth(lauraToken, { type: 'bearer' })
        .expect(403);
    });
  });

  describe('recomendaciones', () => {
    it('analiza al estudiante con sus notas actuales', async () => {
      const response = await request(app.getHttpServer())
        .get(`/recommendations/students/${lauraId}`)
        .auth(lauraToken, { type: 'bearer' })
        .expect(200);

      expect(response.body).toMatchObject({
        studentId: lauraId,
        overallAverage: 3.53,
        level: 'BASICO',
        strongestArea: 'Inglés',
        weakestArea: 'Matemáticas',
      });
      expect(response.body.areas[0]).toMatchObject({
        areaName: 'Matemáticas',
        average: 2.3,
        level: 'BAJO',
        trend: 'MEJORANDO',
      });
      expect(response.body.generalRecommendations[0]).toMatch(
        /Prioriza las áreas que estás perdiendo/,
      );
    });

    it('se recalcula cuando cambian las notas', async () => {
      await addGrade(lauraId, mathId, 4.5, 3);

      const response = await request(app.getHttpServer())
        .get(`/recommendations/students/${lauraId}/areas/${mathId}`)
        .auth(teacherToken, { type: 'bearer' })
        .expect(200);

      expect(response.body).toMatchObject({ gradesCount: 3, average: 3.03 });
    });

    it('responde 404 si no hay notas en la materia', async () => {
      const scienceId = await createArea('Ciencias');

      await request(app.getHttpServer())
        .get(`/recommendations/students/${lauraId}/areas/${scienceId}`)
        .auth(teacherToken, { type: 'bearer' })
        .expect(404);
    });
  });

  it('al borrar una materia se borran sus notas', async () => {
    await request(app.getHttpServer())
      .delete(`/areas/${englishId}`)
      .auth(adminToken, { type: 'bearer' })
      .expect(204);

    const response = await request(app.getHttpServer())
      .get('/grades')
      .query({ studentId: lauraId })
      .auth(teacherToken, { type: 'bearer' })
      .expect(200);
    expect(
      response.body.data.some(
        (grade: { areaId: string }) => grade.areaId === englishId,
      ),
    ).toBe(false);
  });
});
