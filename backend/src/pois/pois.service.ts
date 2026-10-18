import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PoisRepository } from './repositories/pois.repository';

import type { PoiDetail } from './contracts/poi-detail';
import type { Bbox } from './types/bbox.type';
import type { PoiFeatureCollection } from './types/poi.types';
import { FeatureCategory } from './contracts/feature-category';

@Injectable()
export class PoisService {
  constructor(private readonly poisRepository: PoisRepository) {}

  async findById(osmType: string, osmId: string): Promise<PoiDetail> {
    const validType = /^[NWR]$/.test(osmType);
    const validId =
      /^[1-9]\d{0,18}$/.test(osmId) && BigInt(osmId) <= 9223372036854775807n;

    if (!validType || !validId) {
      throw new BadRequestException('Invalid OSM identity');
    }

    const row = await this.poisRepository.findById(osmType, osmId);

    if (!row) {
      throw new NotFoundException('POI not found');
    }

    return {
      id: `${row.osm_type}/${row.osm_id}`,
      name: row.name,
      category: row.primary_category,
      categories: row.categories,
      subcategory: row.subcategory,
      coordinates: [row.longitude, row.latitude],
      description: row.description,
      address: row.address,
      website: row.website,
      phone: row.phone,
      openingHours: row.opening_hours,
      wheelchair: row.wheelchair,
    };
  }

  async findWithin(
    bbox: Bbox,
    categories: FeatureCategory[] = [],
  ): Promise<PoiFeatureCollection> {
    const rows = await this.poisRepository.findWithin(bbox, categories);

    return {
      type: 'FeatureCollection',
      features: rows.map((row) => ({
        type: 'Feature',
        id: `${row.osm_type}/${row.osm_id}`,
        geometry: row.geometry,
        properties: {
          name: row.name,
          category: row.primary_category,
          categories: row.categories,
          subcategory: row.subcategory,
        },
      })),
    };
  }
}
