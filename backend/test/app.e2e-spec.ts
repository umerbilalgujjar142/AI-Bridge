import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';

describe('AI Bridge API (e2e)', () => {
  let app: NestExpressApplication;
  let server: App;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app);
    await app.init();
    server = app.getHttpServer() as App;
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health → 200', () =>
    request(server)
      .get('/health')
      .expect(200)
      .expect((res) => expect(res.body.status).toBe('ok')));

  it('POST /api/chat → 200 with mock answer', () =>
    request(server)
      .post('/api/chat')
      .send({ message: 'What is Key Vault?' })
      .expect(200)
      .expect((res) => expect(res.body.source).toBe('mock')));

  it('POST /api/chat with empty message → 400', () =>
    request(server).post('/api/chat').send({ message: '   ' }).expect(400));

  it('POST /api/chat with unknown field → 400', () =>
    request(server)
      .post('/api/chat')
      .send({ message: 'hi', admin: true })
      .expect(400));

  it('POST /api/chat with malformed JSON → 400', () =>
    request(server)
      .post('/api/chat')
      .set('Content-Type', 'application/json')
      .send('{bad json')
      .expect(400));
});
