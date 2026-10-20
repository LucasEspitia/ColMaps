import { Controller, Get, Param, Query } from '@nestjs/common';

import { PoiService } from './poi.service';

import { ParseBboxPipe } from './pipes/parse-bbox-pipe';
import { ParseCategoriesPipe } from './pipes/parse-categories.pipe';

import { FeatureCategory } from './contracts/feature-category';
import type { Bbox } from './types/bbox.type';

@Controller('poi')
export class PoiController {
  constructor(private readonly poiService: PoiService) {}

  @Get()
  findWithin(
    @Query('bbox', ParseBboxPipe) bbox: Bbox,
    @Query('categories', ParseCategoriesPipe) categories: FeatureCategory[],
  ) {
    return this.poiService.findWithin(bbox, categories);
  }

  @Get('/:osmType/:osmId')
  findById(@Param('osmType') osmType: string, @Param('osmId') osmId: string) {
    return this.poiService.findById(osmType, osmId);
  }
}
