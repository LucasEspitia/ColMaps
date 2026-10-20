import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import { PoiRepository } from './repositories/pois.repository';
import { toPoiDetail, toPoiFeatureCollection } from './mappers/poi.mapper';

import type { FeatureCategory } from './contracts/feature-category';
import type { PoiDetail } from './contracts/poi-detail';
import type { Bbox } from './types/bbox.type';
import type { PoiFeatureCollection } from './types/poi.types';

@Injectable()
export class PoiService {
  constructor(private readonly poiRepository: PoiRepository) {}

  async findById(osmType: string, osmId: string): Promise<PoiDetail> {
    const validType = /^[NWR]$/.test(osmType);

    const validId =
      /^[1-9]\d{0,18}$/.test(osmId) && BigInt(osmId) <= 9223372036854775807n;

    if (!validType || !validId) {
      throw new BadRequestException('Invalid OSM identity');
    }

    const row = await this.poiRepository.findById(osmType, osmId);

    if (!row) {
      throw new NotFoundException('POI not found');
    }

    return toPoiDetail(row);
  }

  async findWithin(
    bbox: Bbox,
    categories: FeatureCategory[] = [],
  ): Promise<PoiFeatureCollection> {
    const rows = await this.poiRepository.findWithin(bbox, categories);

    return toPoiFeatureCollection(rows);
  }
}
