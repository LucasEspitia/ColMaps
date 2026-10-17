import { Controller, Get, Query } from '@nestjs/common';
import { PoisService } from './pois.service';
import { ParseBboxPipe } from './pipes/parse-bbox-pipe';
import type { Bbox } from './types/bbox.type';

@Controller('pois')
export class PoisController {
  constructor(private readonly poisService: PoisService) {}

  @Get()
  findWithin(@Query('bbox', ParseBboxPipe) bbox: Bbox) {
    return this.poisService.findWithin(bbox);
  }
}
