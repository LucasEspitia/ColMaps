import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';

import type { Bbox } from '../types/bbox.type';
import type { PoiRow } from '../types/poi.types';

@Injectable()
export class PoisRepository {
  constructor(private readonly em: EntityManager) {}

  async findWithin(bbox: Bbox): Promise<PoiRow[]> {
    const [west, south, east, north] = bbox;

    return this.em.execute<PoiRow[]>(
      `
      SELECT
        osm_type::text AS osm_type,
        osm_id::text AS osm_id,
        name,
        tags,
        ST_AsGeoJSON(
          ST_Transform(ST_PointOnSurface(geom), 4326),
          6
        )::jsonb AS geometry
      FROM public.osm_features
      WHERE geom IS NOT NULL
        AND NOT ST_IsEmpty(geom)
        AND ST_Intersects(
          geom,
          ST_Transform(
            ST_MakeEnvelope(?, ?, ?, ?, 4326),
            3857
          )
        )
      ORDER BY osm_type, osm_id
      LIMIT 200
      `,
      [west, south, east, north],
    );
  }
}
