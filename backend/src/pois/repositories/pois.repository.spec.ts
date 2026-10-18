import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EntityManager } from '@mikro-orm/postgresql';

import { PoisRepository } from './pois.repository';
import type { Bbox } from '../types/bbox.type';
import type { PoiDetailRow, PoiRow } from '../types/poi.types';
import type { FeatureCategory } from '../contracts/feature-category';

describe('PoisRepository', () => {
  let repository: PoisRepository;

  const executeMock =
    vi.fn<
      (
        sql: string,
        params: (number | string | FeatureCategory[])[],
      ) => Promise<PoiRow[]>
    >();

  const bbox: Bbox = [-74.2, 4.5, -73.9, 4.8];

  beforeEach(() => {
    executeMock.mockReset();

    const em = {
      execute: executeMock,
    } as unknown as EntityManager;

    repository = new PoisRepository(em);
  });

  it('should execute a parameterized spatial query with the correct bbox', async () => {
    executeMock.mockResolvedValue([]);

    await repository.findWithin(bbox);

    expect(executeMock).toHaveBeenCalledOnce();

    const [sql, params] = executeMock.mock.calls[0];

    expect(sql).toContain('ST_MakeEnvelope(?, ?, ?, ?, 4326)');
    expect(sql).toContain('ST_Intersects(');
    expect(sql).not.toContain('AND p.categories');
    expect(params).toEqual([...bbox]);
  });

  it('should parameterize the category overlap filter when categories are provided', async () => {
    executeMock.mockResolvedValue([]);
    const categories: FeatureCategory[] = ['museums_culture', 'attractions'];

    await repository.findWithin(bbox, categories);

    expect(executeMock).toHaveBeenCalledOnce();
    const [sql, params] = executeMock.mock.calls[0];
    expect(sql).toContain('AND p.categories && ARRAY[?]::text[]');
    expect(params).toEqual([...bbox, categories]);
  });

  it('should return POI rows from the database', async () => {
    const rows: PoiRow[] = [
      {
        osm_type: 'node',
        osm_id: '123',
        name: 'Museo del Oro',
        primary_category: 'museums_culture',
        categories: ['museums_culture', 'attractions'],
        subcategory: 'museum',
        geometry: {
          type: 'Point',
          coordinates: [-74.07, 4.6],
        },
      },
    ];

    executeMock.mockResolvedValue(rows);

    const result = await repository.findWithin(bbox);

    expect(result).toEqual(rows);
  });

  describe('findById', () => {
    it('should query by the parameterized OSM identity and return the first row', async () => {
      const row: PoiDetailRow = {
        osm_type: 'N',
        osm_id: '9223372036854775807',
        name: 'Museo del Oro',
        primary_category: 'museums_culture',
        categories: ['museums_culture'],
        subcategory: 'museum',
        geometry: { type: 'Point', coordinates: [-74.07, 4.6] },
        longitude: -74.07,
        latitude: 4.6,
        description: null,
        address: null,
        website: null,
        phone: null,
        opening_hours: null,
        wheelchair: null,
      };
      executeMock.mockResolvedValue([row]);

      const result = await repository.findById('N', row.osm_id);

      expect(result).toBe(row);
      expect(executeMock).toHaveBeenCalledOnce();
      const [sql, params] = executeMock.mock.calls[0];
      expect(sql).toContain('LEFT JOIN public.osm_features f');
      expect(sql).toContain('p.osm_type = ?');
      expect(sql).toContain('p.osm_id = ?::bigint');
      expect(params).toEqual(['N', row.osm_id]);
    });

    it('should return null when no POI matches', async () => {
      executeMock.mockResolvedValue([]);

      expect(await repository.findById('N', '1')).toBeNull();
    });
  });
});
