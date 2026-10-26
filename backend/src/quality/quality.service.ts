import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';

import { QualityResult } from './entities/quality-result.entity';
import { QualityRun } from './entities/quality-run.entity';

import { QualityQueryDto } from './dto/quality-query.dto';
import { QualityHistoryQueryDto } from './dto/quality-history-query.dto';
import { QualitySummaryQueryDto } from './dto/quality-summary-query.dto';
@Injectable()
export class QualityService {
  constructor(
    @InjectRepository(QualityRun)
    private readonly runRepository: EntityRepository<QualityRun>,
  ) {}

  async getSummary(query: QualitySummaryQueryDto) {
    const { page, device } = query;

    const [totalRuns, latestRuns, matchingRuns] = await Promise.all([
      this.runRepository.count(),

      this.runRepository.find(
        {},
        {
          orderBy: { startedAt: 'DESC', id: 'DESC' },
          limit: 1,
        },
      ),

      this.runRepository.find(
        {
          status: 'passed',
          results: { page, device },
        },
        {
          populate: ['results'],
          orderBy: { startedAt: 'DESC', id: 'DESC' },
        },
      ),
    ]);

    const latestRun = latestRuns[0] ?? null;

    const latestMetrics = new Map<string, QualityResult>();

    for (const run of matchingRuns) {
      for (const result of run.results.getItems()) {
        if (result.page !== page || result.device !== device) {
          continue;
        }

        if (!latestMetrics.has(result.metric)) {
          latestMetrics.set(result.metric, result);
        }
      }
    }

    return {
      totalRuns,
      latestRun,
      metrics: [...latestMetrics.values()],
    };
  }

  async getHistory(query: QualityHistoryQueryDto) {
    const { metric, device, page, limit } = query;

    const runs = await this.runRepository.find(
      {
        status: 'passed',
        results: {
          metric,
          device,
          ...(page ? { page } : {}),
        },
      },
      {
        populate: ['results'],
        orderBy: {
          startedAt: 'DESC',
          id: 'DESC',
        },
        limit,
      },
    );

    const points = runs.flatMap((run) =>
      run.results
        .getItems()
        .filter(
          (result) =>
            result.metric === metric &&
            result.device === device &&
            (!page || result.page === page),
        )
        .map((result) => ({
          runId: run.id,
          value: result.value,
          unit: result.unit,
          target: result.target ?? null,
          page: result.page ?? null,
          startedAt: run.startedAt,
          commitSha: run.commitSha ?? null,
        })),
    );

    return {
      metric,
      device,
      page: page ?? null,
      points: points.reverse(),
    };
  }

  async getRuns(query: QualityQueryDto) {
    const [runs, total] = await this.runRepository.findAndCount(
      {},
      {
        limit: query.limit,
        offset: (query.page - 1) * query.limit,
        orderBy: { startedAt: 'DESC' },
      },
    );

    return {
      data: runs,
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async getRun(id: string) {
    const run = await this.runRepository.findOne(
      { id },
      { populate: ['results'] },
    );

    if (!run) {
      throw new NotFoundException('Quality run not found');
    }

    return run;
  }
}
