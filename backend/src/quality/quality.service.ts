import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';

import { QualityRun } from './entities/quality-run.entity';
import { QualityQueryDto } from './dto/quality-query.dto';
import { QualityHistoryQueryDto } from './dto/quality-history-query.dto';

@Injectable()
export class QualityService {
  constructor(
    @InjectRepository(QualityRun)
    private readonly runRepository: EntityRepository<QualityRun>,
  ) {}

  async getSummary() {
    const totalRuns = await this.runRepository.count();

    const [latestRun] = await this.runRepository.find(
      {},
      {
        orderBy: { startedAt: 'DESC' },
        populate: ['results'],
        limit: 1,
      },
    );

    return {
      totalRuns,
      latestRun: latestRun ?? null,
      metrics: latestRun ? latestRun.results.getItems() : [],
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
}
