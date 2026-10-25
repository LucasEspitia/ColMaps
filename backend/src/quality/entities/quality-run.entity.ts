import { randomUUID } from 'node:crypto';
import { Collection } from '@mikro-orm/core';

import {
  Entity,
  OneToMany,
  PrimaryKey,
  Property,
} from '@mikro-orm/decorators/legacy';

import { QualityResult } from './quality-result.entity';

import type {
  QualitySource,
  QualityStatus,
  QualityEnvironment,
} from '../types/quality.types';

@Entity({ tableName: 'quality_runs' })
export class QualityRun {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ type: 'string' })
  source!: QualitySource;

  @Property({ type: 'string' })
  status!: QualityStatus;

  @Property({ type: 'string' })
  environment!: QualityEnvironment;

  @Property({ nullable: true, type: 'string' })
  commitSha?: string;

  @Property({ nullable: true, type: 'string' })
  branch?: string;

  @Property({ nullable: true, type: 'string' })
  artifactUrl?: string;

  @Property({ type: 'datetime' })
  startedAt: Date = new Date();

  @Property({ type: 'datetime', nullable: true })
  finishedAt?: Date;

  @OneToMany(() => QualityResult, (result) => result.run)
  results = new Collection<QualityResult>(this);
}
