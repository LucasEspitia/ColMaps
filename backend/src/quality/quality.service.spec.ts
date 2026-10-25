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
});
