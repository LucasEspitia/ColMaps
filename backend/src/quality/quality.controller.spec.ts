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
    getHistory: vi.fn<QualityService['getHistory']>(),
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
    service.getSummary.mockResolvedValue(
      summary as unknown as Awaited<ReturnType<QualityService['getSummary']>>,
    );

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

  it.each([
    ['', 30],
    ['&limit=1', 1],
    ['&limit=100', 100],
  ])('GET /history applies the limit for %s', async (suffix, limit) => {
    const history = {
      metric: 'performance',
      device: 'desktop',
      pageUrl: null,
      points: [],
    };
    service.getHistory.mockResolvedValue(history);

    const response = await request(server)
      .get(`/api/quality/history?metric=performance&device=desktop${suffix}`)
      .expect(200);

    expect(response.body).toEqual(history);
    expect(service.getHistory).toHaveBeenCalledExactlyOnceWith({
      metric: 'performance',
      device: 'desktop',
      limit,
    });
  });

  it('GET /history forwards the page URL and serializes history points', async () => {
    const pageUrl = 'http://localhost/map?zoom=5&layer=routes';
    const startedAt = new Date('2026-01-01T00:00:00Z');
    const point = {
      runId: id,
      value: 95,
      unit: 'score',
      target: null,
      pageUrl,
      startedAt,
      commitSha: null,
    };
    service.getHistory.mockResolvedValue({
      metric: 'performance',
      device: 'mobile',
      pageUrl,
      points: [point],
    });

    const response = await request(server)
      .get('/api/quality/history')
      .query({ metric: 'performance', device: 'mobile', pageUrl, limit: 5 })
      .expect(200);

    expect(service.getHistory).toHaveBeenCalledExactlyOnceWith({
      metric: 'performance',
      device: 'mobile',
      pageUrl,
      limit: 5,
    });
    expect(response.body).toEqual({
      metric: 'performance',
      device: 'mobile',
      pageUrl,
      points: [{ ...point, startedAt: startedAt.toISOString() }],
    });
  });

  it.each([
    '',
    'metric=performance',
    'device=desktop',
    'metric=performance&device=desktop&limit=0',
    'metric=performance&device=desktop&limit=101',
    'metric=performance&device=desktop&limit=1.5',
    'metric=performance&device=desktop&limit=abc',
    'metric=performance&device=desktop&pageUrl=http%3A%2F%2F',
    'metric=performance&device=desktop&unexpected=true',
  ])('GET /history rejects invalid query parameters: %s', async (query) => {
    await request(server).get(`/api/quality/history?${query}`).expect(400);
    expect(service.getHistory).not.toHaveBeenCalled();
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
