import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './utils/test-app';

describe('App (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET / es pública', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('GET /health informa que la base de datos responde', async () => {
    const response = await request(app.getHttpServer())
      .get('/health')
      .expect(200);

    expect(response.body).toMatchObject({
      status: 'ok',
      info: { database: { status: 'up' } },
    });
  });

  it('GET /docs-json publica la documentación de Swagger', async () => {
    const response = await request(app.getHttpServer())
      .get('/docs-json')
      .expect(200);

    expect(response.body).toHaveProperty('paths./grades');
  });

  it('responde con cabeceras de seguridad', async () => {
    const response = await request(app.getHttpServer()).get('/').expect(200);

    expect(response.headers).toHaveProperty('x-frame-options');
    expect(response.headers).not.toHaveProperty('x-powered-by');
  });
});
