import { Injectable } from '@nestjs/common';
import { PoisRepository } from './repositories/pois.repository';
import type { Bbox } from './types/bbox.type';
import type { PoiFeatureCollection } from './types/poi.types';
import { FeatureCategory } from './contracts/feature-category';

@Injectable()
export class PoisService {
  constructor(private readonly poisRepository: PoisRepository) {}

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
