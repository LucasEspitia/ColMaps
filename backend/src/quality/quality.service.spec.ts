import { Collection } from '@mikro-orm/core';
import { NotFoundException } from '@nestjs/common';
import type { EntityRepository } from '@mikro-orm/postgresql';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { QualityService } from './quality.service';
import { QualityRun } from './entities/quality-run.entity';
import { QualityResult } from './entities/quality-result.entity';

// Only the persistence boundary is mocked; collections use real ORM entities.
describe('QualityService', () => {
  let service: QualityService;
  const repository = {
    count: vi.fn<EntityRepository<QualityRun>['count']>(),
    find: vi.fn<EntityRepository<QualityRun>['find']>(),
    findOne: vi.fn<EntityRepository<QualityRun>['findOne']>(),
    findAndCount: vi.fn<EntityRepository<QualityRun>['findAndCount']>(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    service = new QualityService(
      repository as unknown as EntityRepository<QualityRun>,
    );
  });

  it('returns the latest run with its metrics and the total number of runs', async () => {
    const run = new QualityRun();
    const metric = Object.assign(new QualityResult(), {
      run,
      metric: 'performance',
      value: 95,
      unit: 'score',
      device: 'desktop',
    });
    run.results = new Collection<QualityResult>(run, [metric]);
    repository.count.mockResolvedValue(3);
    repository.find.mockResolvedValue([run]);

    await expect(service.getSummary()).resolves.toEqual({
      totalRuns: 3,
      latestRun: run,
      metrics: [metric],
    });
    expect(repository.find).toHaveBeenCalledExactlyOnceWith(
      {},
      {
        orderBy: { startedAt: 'DESC' },
        populate: ['results'],
        limit: 1,
      },
    );
  });

  it('returns an empty summary when no runs exist', async () => {
    repository.count.mockResolvedValue(0);
    repository.find.mockResolvedValue([]);

    await expect(service.getSummary()).resolves.toEqual({
      totalRuns: 0,
      latestRun: null,
      metrics: [],
    });
  });

  it.each([
    [1, 0],
    [3, 40],
  ])(
    'returns page %i ordered newest first with offset %i',
    async (page, offset) => {
      const runs = [new QualityRun()];
      repository.findAndCount.mockResolvedValue([runs, 45]);

      await expect(service.getRuns({ page, limit: 20 })).resolves.toEqual({
        data: runs,
        total: 45,
        page,
        limit: 20,
      });
      expect(repository.findAndCount).toHaveBeenCalledExactlyOnceWith(
        {},
        {
          limit: 20,
          offset,
          orderBy: { startedAt: 'DESC' },
        },
      );
    },
  );

  it('returns a run with its results populated', async () => {
    const run = new QualityRun();
    repository.findOne.mockResolvedValue(run);

    await expect(service.getRun(run.id)).resolves.toBe(run);
    expect(repository.findOne).toHaveBeenCalledExactlyOnceWith(
      { id: run.id },
      {
        populate: ['results'],
      },
    );
  });

  it('throws 404 when the requested run does not exist', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(
      service.getRun('5e40bf86-788b-44d7-9c1c-5d92aad1c199'),
    ).rejects.toThrow(new NotFoundException('Quality run not found'));
  });

  describe('getHistory', () => {
    const query = { metric: 'performance', device: 'desktop', limit: 30 };

    it('returns an empty history when no matching runs exist', async () => {
      repository.find.mockResolvedValue([]);

      await expect(service.getHistory(query)).resolves.toEqual({
        metric: query.metric,
        device: query.device,
        pageUrl: null,
        points: [],
      });
      expect(repository.find).toHaveBeenCalledExactlyOnceWith(
        {
          status: 'passed',
          results: { metric: query.metric, device: query.device },
        },
        {
          populate: ['results'],
          orderBy: { startedAt: 'DESC', id: 'DESC' },
          limit: 30,
        },
      );
    });

    it('returns matching metrics oldest first and normalizes optional fields', async () => {
      const older = Object.assign(new QualityRun(), {
        startedAt: new Date('2026-01-01T00:00:00Z'),
      });
      const newer = Object.assign(new QualityRun(), {
        startedAt: new Date('2026-01-02T00:00:00Z'),
        commitSha: 'abc123',
      });
      older.results = new Collection<QualityResult>(older, [
        Object.assign(new QualityResult(), {
          run: older,
          metric: query.metric,
          device: query.device,
          value: 0,
          unit: 'score',
        }),
      ]);
      newer.results = new Collection<QualityResult>(newer, [
        Object.assign(new QualityResult(), {
          run: newer,
          metric: query.metric,
          device: query.device,
          value: 95,
          unit: 'score',
          target: '90',
          pageUrl: 'https://example.com',
        }),
        Object.assign(new QualityResult(), {
          run: newer,
          metric: 'accessibility',
          device: query.device,
          value: 100,
        }),
        Object.assign(new QualityResult(), {
          run: newer,
          metric: query.metric,
          device: 'mobile',
          value: 80,
        }),
      ]);
      repository.find.mockResolvedValue([newer, older]);

      await expect(service.getHistory(query)).resolves.toEqual({
        metric: query.metric,
        device: query.device,
        pageUrl: null,
        points: [
          {
            runId: older.id,
            value: 0,
            unit: 'score',
            target: null,
            pageUrl: null,
            startedAt: older.startedAt,
            commitSha: null,
          },
          {
            runId: newer.id,
            value: 95,
            unit: 'score',
            target: '90',
            pageUrl: 'https://example.com',
            startedAt: newer.startedAt,
            commitSha: 'abc123',
          },
        ],
      });
    });

    it('filters both the repository query and populated results by page URL', async () => {
      const pageUrl = 'https://example.com/map';
      const run = new QualityRun();
      run.results = new Collection<QualityResult>(
        run,
        [pageUrl, 'https://example.com/other', undefined].map((url) =>
          Object.assign(new QualityResult(), {
            run,
            metric: query.metric,
            device: query.device,
            value: 95,
            unit: 'score',
            pageUrl: url,
          }),
        ),
      );
      repository.find.mockResolvedValue([run]);

      const history = await service.getHistory({ ...query, pageUrl, limit: 5 });

      expect(history.pageUrl).toBe(pageUrl);
      expect(history.points).toEqual([
        {
          runId: run.id,
          value: 95,
          unit: 'score',
          target: null,
          pageUrl,
          startedAt: run.startedAt,
          commitSha: null,
        },
      ]);
      expect(repository.find).toHaveBeenCalledExactlyOnceWith(
        {
          status: 'passed',
          results: {
            metric: query.metric,
            device: query.device,
            pageUrl,
          },
        },
        {
          populate: ['results'],
          orderBy: { startedAt: 'DESC', id: 'DESC' },
          limit: 5,
        },
      );
    });
  });
});
