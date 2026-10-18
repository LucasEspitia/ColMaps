import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { Bbox } from '../types/bbox.type';
import type { PoiRow } from '../types/poi.types';
import { FeatureCategory } from '../contracts/feature-category';

@Injectable()
export class PoisRepository {
  constructor(private readonly em: EntityManager) {}

  async findWithin(
    bbox: Bbox,
    categories: FeatureCategory[] = [],
  ): Promise<PoiRow[]> {
    const [west, south, east, north] = bbox;

    const categoryFilter = categories.length
      ? 'AND p.categories && ARRAY[?]::text[]'
      : '';

    return this.em.execute<PoiRow[]>(
      `
        WITH bounds AS (
          SELECT ST_MakeEnvelope(?, ?, ?, ?, 4326) AS area
        )
        SELECT
          p.osm_type::text AS osm_type,
          p.osm_id::text AS osm_id,
          p.name,
          p.primary_category,
          p.categories,
          p.subcategory,
          ST_AsGeoJSON(p.marker_geom, 6)::jsonb AS geometry
        FROM public.pois p
        CROSS JOIN bounds b
        WHERE p.marker_geom && b.area
          AND ST_Intersects(p.marker_geom, b.area)
          ${categoryFilter}
        ORDER BY p.osm_type, p.osm_id
        LIMIT 200
        `,
      categories.length
        ? [west, south, east, north, categories]
        : [west, south, east, north],
    );
  }
}
