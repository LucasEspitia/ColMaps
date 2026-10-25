import 'reflect-metadata';
import type { Server } from 'node:http';
import {
  NotFoundException,
  ValidationPipe,
  type INestApplication,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { QualityController } from './quality.controller';
import { QualityService } from './quality.service';
import { QualityRun } from './entities/quality-run.entity';

// Exercise routing and validation, leaving persistence to the service specs.
describe('QualityController (HTTP)', () => {
  let app: INestApplication;
  let server: Server;
  const service = {
    getSummary: vi.fn<QualityService['getSummary']>(),
    getRuns: vi.fn<QualityService['getRuns']>(),
    getRun: vi.fn<QualityService['getRun']>(),
  };
  const id = '5e40bf86-788b-44d7-9c1c-5d92aad1c199';

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [QualityController],
      providers: [{ provide: QualityService, useValue: service }],
    }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
    server = app.getHttpServer() as Server;
  });

  beforeEach(() => vi.resetAllMocks());
  afterAll(async () => {
    await app?.close();
  });

  it('GET /summary returns the service summary', async () => {
    const summary = { totalRuns: 0, latestRun: null, metrics: [] };
    service.getSummary.mockResolvedValue(summary);

    const response = await request(server)
      .get('/api/quality/summary')
      .expect(200);

    expect(response.body).toEqual(summary);
    expect(service.getSummary).toHaveBeenCalledExactlyOnceWith();
  });

  it.each([
    ['', 1, 20],
    ['?page=2&limit=100', 2, 100],
  ])(
    'GET /runs%s applies defaults and transforms pagination to numbers',
    async (query, page, limit) => {
      const result = { data: [], total: 0, page, limit };
      service.getRuns.mockResolvedValue(result);

      const response = await request(server)
        .get(`/api/quality/runs${query}`)
        .expect(200);

      expect(service.getRuns).toHaveBeenCalledExactlyOnceWith({ page, limit });
      expect(response.body).toEqual(result);
    },
  );

  it.each(['page=0', 'limit=101', 'page=1.5', 'limit=abc', 'unexpected=true'])(
    'GET /runs rejects invalid pagination or unknown parameters: %s',
    async (query) => {
      await request(server).get(`/api/quality/runs?${query}`).expect(400);
      expect(service.getRuns).not.toHaveBeenCalled();
    },
  );

  it('GET /runs/:id returns the requested run', async () => {
    const startedAt = new Date('2026-01-01T00:00:00Z');
    service.getRun.mockResolvedValue(
      Object.assign(new QualityRun(), { id, startedAt }) as Awaited<
        ReturnType<QualityService['getRun']>
      >,
    );
    const response = await request(server)
      .get(`/api/quality/runs/${id}`)
      .expect(200);

    expect(response.body).toMatchObject({
      id,
      startedAt: startedAt.toISOString(),
    });
    expect(service.getRun).toHaveBeenCalledExactlyOnceWith(id);
  });

  it('rejects malformed UUIDs before calling the service', async () => {
    await request(server).get('/api/quality/runs/invalid').expect(400);
    expect(service.getRun).not.toHaveBeenCalled();
  });

  it('returns 404 for a valid UUID that does not exist', async () => {
    service.getRun.mockRejectedValue(
      new NotFoundException('Quality run not found'),
    );
    const response = await request(server)
      .get(`/api/quality/runs/${id}`)
      .expect(404);

    expect(response.body).toMatchObject({
      statusCode: 404,
      message: 'Quality run not found',
    });
    expect(service.getRun).toHaveBeenCalledExactlyOnceWith(id);
  });
});
