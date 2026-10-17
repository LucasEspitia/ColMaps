import { Module } from '@nestjs/common';
import { PoisService } from './pois.service';
import { PoisController } from './pois.controller';
import { PoisRepository } from './repositories/pois.repository';

@Module({
  controllers: [PoisController],
  providers: [PoisService, PoisRepository],
})
export class PoisModule {}
