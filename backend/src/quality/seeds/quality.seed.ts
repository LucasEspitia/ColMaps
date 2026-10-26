import { MikroORM } from '@mikro-orm/postgresql';

import ormConfig from '../../../mikro-orm.config';
import { QualityRun } from '../entities/quality-run.entity';
import { QualityResult } from '../entities/quality-result.entity';
import {
  QUALITY_PAGES,
  QUALITY_DEVICES,
  type QualityPage,
  type QualityDevice,
} from '../types/quality.types';

const DEMO_BRANCH = 'demo/quality-seed';
const EXECUTIONS = 12;

const METRICS = [
  'performance',
  'accessibility',
  'seo',
  'best-practices',
  'lcp',
  'cls',
] as const;

type Metric = (typeof METRICS)[number];

const PAGE_OFFSETS: Record<QualityPage, number> = {
  home: 0,
  map: -16,
  search: -8,
  about: 7,
  quality: -5,
};

function measurement(
  metric: Metric | 'inp',
  page: QualityPage,
  device: QualityDevice,
  index: number,
): { value: number; unit: string; target: string } {
  const offset = PAGE_OFFSETS[page];
  const desktop = device === 'desktop';

  const score = (base: number): number =>
    Math.max(0, Math.min(100, base + offset + (desktop ? 9 : 0)));

  switch (metric) {
    case 'performance':
      return {
        value: score(65 + index * 3),
        unit: 'score',
        target: '90',
      };

    case 'accessibility':
      return {
        value: score(80 + index * 2),
        unit: 'score',
        target: '90',
      };

    case 'seo':
      return {
        value: score(84 + index * 2),
        unit: 'score',
        target: '90',
      };

    case 'best-practices':
      return {
        value: score(76 + index * 2),
        unit: 'score',
        target: '90',
      };

    case 'lcp':
      return {
        value: Math.max(
          700,
          3900 - index * 140 - offset * 35 - (desktop ? 800 : 0),
        ),
        unit: 'ms',
        target: '2500',
      };

    case 'cls':
      return {
        value: Number(
          Math.max(0.01, 0.24 - index * 0.017 - offset * 0.002).toFixed(3),
        ),
        unit: 'score',
        target: '0.1',
      };

    case 'inp':
      return {
        value: Math.max(60, 350 - index * 17 - offset * 2 - (desktop ? 60 : 0)),
        unit: 'ms',
        target: '200',
      };
  }
}

function createRun(
  source: 'lighthouse' | 'mobile',
  startedAt: Date,
  index: number,
): QualityRun {
  const run = new QualityRun();

  run.source = source;
  run.status = 'passed';
  run.environment = 'development';
  run.branch = DEMO_BRANCH;
  run.commitSha = `demo${String(index + 1).padStart(4, '0')}`;
  run.startedAt = startedAt;
  run.finishedAt = new Date(startedAt.getTime() + 90_000);

  return run;
}

function createResult(
  run: QualityRun,
  metric: Metric | 'inp',
  page: QualityPage,
  device: QualityDevice,
  index: number,
): QualityResult {
  const data = measurement(metric, page, device, index);
  const result = new QualityResult();

  result.run = run;
  result.metric = metric;
  result.value = data.value;
  result.unit = data.unit;
  result.target = data.target;
  result.device = device;
  result.page = page;

  return result;
}

async function main(): Promise<void> {
  if (
    process.env.QUALITY_SEED_DEMO !== 'YES' ||
    process.env.NODE_ENV === 'production'
  ) {
    throw new Error(
      'Quality demo seed is disabled. Set QUALITY_SEED_DEMO=YES in local development.',
    );
  }

  const orm = await MikroORM.init(ormConfig);

  try {
    await orm.em.transactional(async (em) => {
      // Only replace previously generated demo executions.
      // QualityResult records are deleted by the FK cascade.
      await em.nativeDelete(QualityRun, { branch: DEMO_BRANCH });

      const now = Date.now();
      let resultCount = 0;

      for (let index = 0; index < EXECUTIONS; index++) {
        const startedAt = new Date(now - (EXECUTIONS - index) * 86_400_000);

        const lighthouse = createRun('lighthouse', startedAt, index);

        // INP is represented by a separate mobile measurement run.
        const mobile = createRun(
          'mobile',
          new Date(startedAt.getTime() + 120_000),
          index,
        );

        em.persist([lighthouse, mobile]);

        for (const page of QUALITY_PAGES) {
          for (const device of QUALITY_DEVICES) {
            for (const metric of METRICS) {
              em.persist(createResult(lighthouse, metric, page, device, index));
              resultCount++;
            }

            em.persist(createResult(mobile, 'inp', page, device, index));
            resultCount++;
          }
        }
      }

      // Latest execution fails, but previous measurements remain available.
      const failed = new QualityRun();

      failed.source = 'lighthouse';
      failed.status = 'failed';
      failed.environment = 'development';
      failed.branch = DEMO_BRANCH;
      failed.commitSha = 'demo-failed';
      failed.startedAt = new Date(now);
      failed.finishedAt = new Date(now + 10_000);

      em.persist(failed);

      console.log(
        `Prepared ${EXECUTIONS * 2 + 1} demo runs and ${resultCount} measurements.`,
      );
    });

    console.log('Quality demo seed completed successfully.');
  } finally {
    await orm.close(true);
  }
}

main().catch((error: unknown) => {
  console.error('Quality demo seed failed:', error);
  process.exitCode = 1;
});
