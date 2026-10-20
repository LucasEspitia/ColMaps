import { Module } from '@nestjs/common';
import { PoiService } from './poi.service';
import { PoiController } from './poi.controller';
import { PoiRepository } from './repositories/pois.repository';

@Module({
  controllers: [PoiController],
  providers: [PoiService, PoiRepository],
})
export class PoiModule {}
