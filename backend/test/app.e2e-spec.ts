import 'reflect-metadata';

import { Test, type TestingModule } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { AppController } from '../src/app.controller';

describe('AppController (HTTP)', () => {
  let app: INestApplication;

  const execute = vi.fn().mockResolvedValue([{ postgis_version: '3.6.0' }]);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: EntityManager,
          useValue: {
            getConnection: () => ({ execute }),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('GET /health returns the database status', async () => {
    const response = await request(
      app.getHttpServer() as import('node:http').Server,
    )
      .get('/health')
      .expect(200);

    expect(response.body).toEqual({
      status: 'ok',
      database: 'connected',
      postgis: '3.6.0',
    });

    expect(execute).toHaveBeenCalledWith(
      'SELECT PostGIS_Version() AS postgis_version',
    );
  });
});
