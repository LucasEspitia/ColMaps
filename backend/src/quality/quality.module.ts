import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';

import { QualityService } from './quality.service';
import { QualityController } from './quality.controller';
import { QualityRun } from './entities/quality-run.entity';
import { QualityResult } from './entities/quality-result.entity';

@Module({
  imports: [MikroOrmModule.forFeature([QualityRun, QualityResult])],
  controllers: [QualityController],
  providers: [QualityService],
})
export class QualityModule {}
