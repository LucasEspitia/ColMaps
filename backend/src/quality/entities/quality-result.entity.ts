import { randomUUID } from 'node:crypto';

import {
  Entity,
  ManyToOne,
  PrimaryKey,
  Property,
} from '@mikro-orm/decorators/legacy';

import { QualityRun } from './quality-run.entity';

@Entity({ tableName: 'quality_results' })
export class QualityResult {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @ManyToOne(() => QualityRun, {
    deleteRule: 'cascade',
  })
  run!: QualityRun;

  @Property({ type: 'string' })
  metric!: string;

  @Property({ type: 'double' })
  value!: number;

  @Property({ type: 'string' })
  unit!: string;

  @Property({ type: 'string', nullable: true })
  target?: string;

  @Property({ type: 'string' })
  device!: string;

  @Property({ type: 'string', nullable: true })
  pageUrl?: string;

  @Property({ type: 'json', nullable: true })
  details?: Record<string, unknown>;
}
