import { Controller, Get, Param, Query } from '@nestjs/common';

import { PoisService } from './pois.service';

import { ParseBboxPipe } from './pipes/parse-bbox-pipe';
import { ParseCategoriesPipe } from './pipes/parse-categories.pipe';

import { FeatureCategory } from './contracts/feature-category';
import type { Bbox } from './types/bbox.type';

@Controller('pois')
export class PoisController {
  constructor(private readonly poisService: PoisService) {}

  @Get()
  findWithin(
    @Query('bbox', ParseBboxPipe) bbox: Bbox,
    @Query('categories', ParseCategoriesPipe) categories: FeatureCategory[],
  ) {
    return this.poisService.findWithin(bbox, categories);
  }

  @Get('/:osmType/:osmId')
  findById(@Param('osmType') osmType: string, @Param('osmId') osmId: string) {
    return this.poisService.findById(osmType, osmId);
  }
}
