import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';

import { Throttle } from '@nestjs/throttler';

import { QualityService } from './quality.service';
import { QualityQueryDto } from './dto/quality-query.dto';

@Controller('quality')
@Throttle({
  default: {
    limit: 30,
    ttl: 60_000,
  },
})
export class QualityController {
  constructor(private readonly qualityService: QualityService) {}

  @Get('summary')
  getSummary() {
    return this.qualityService.getSummary();
  }

  @Get('runs')
  getRuns(@Query() query: QualityQueryDto) {
    return this.qualityService.getRuns(query);
  }

  @Get('runs/:id')
  getRun(@Param('id', ParseUUIDPipe) id: string) {
    return this.qualityService.getRun(id);
  }
}
