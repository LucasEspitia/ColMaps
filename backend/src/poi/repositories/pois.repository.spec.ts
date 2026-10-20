import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EntityManager } from '@mikro-orm/postgresql';

import { PoiRepository } from './pois.repository';

import type { Bbox } from '../types/bbox.type';
import type { PoiDetailRow, PoiRow } from '../types/poi.types';
import type { FeatureCategory } from '../contracts/feature-category';

describe('PoisRepository', () => {
  let repository: PoiRepository;

  type QueryParams = (number | string | FeatureCategory[])[];
  type QueryRows = PoiRow[] | PoiDetailRow[];

  const executeMock =
    vi.fn<(sql: string, params: QueryParams) => Promise<QueryRows>>();

  const bbox: Bbox = [-74.2, 4.5, -73.9, 4.8];

  beforeEach(() => {
    executeMock.mockReset();

    const em = {
      execute: executeMock,
    } as unknown as EntityManager;

    repository = new PoiRepository(em);
  });

  describe('findWithin', () => {
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
          osm_type: 'N',
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
  });

  describe('findById', () => {
    const detailRow: PoiDetailRow = {
      osm_type: 'W',
      osm_id: '128799666',
      name: 'Movich Pereira',
      primary_category: 'accommodation',
      categories: ['accommodation'],
      subcategory: 'hotel',
      longitude: -75.6919,
      latitude: 4.8087,
      tags: {
        name: 'Movich Pereira',
        tourism: 'hotel',
        description: 'Hotel in Pereira',
        stars: '4',
        rooms: '202',
        opening_hours: '24/7',
        wheelchair: 'yes',
        'addr:city': 'Pereira',
      },
    };

    it('should query by the parameterized OSM identity and return the first row', async () => {
      executeMock.mockResolvedValue([detailRow]);

      const result = await repository.findById(
        detailRow.osm_type,
        detailRow.osm_id,
      );

      expect(result).toBe(detailRow);
      expect(executeMock).toHaveBeenCalledOnce();

      const [sql, params] = executeMock.mock.calls[0];

      expect(sql).toContain('LEFT JOIN public.osm_features f');
      expect(sql).toContain('p.osm_type = ?');
      expect(sql).toContain('p.osm_id = ?::bigint');

      expect(params).toEqual(['W', '128799666']);
    });

    it('should select the original JSONB tags instead of individual metadata columns', async () => {
      executeMock.mockResolvedValue([detailRow]);

      await repository.findById('W', '128799666');

      const [sql] = executeMock.mock.calls[0];

      expect(sql).toMatch(/f\.tags\s+AS\s+tags/i);

      expect(sql).not.toContain("f.tags->>'description'");

      expect(sql).not.toContain("f.tags->>'opening_hours'");
    });

    it('should preserve null tags when OSM metadata is unavailable', async () => {
      const row: PoiDetailRow = {
        ...detailRow,
        tags: null,
      };

      executeMock.mockResolvedValue([row]);

      const result = await repository.findById('W', '128799666');

      expect(result).toEqual(row);
      expect(result?.tags).toBeNull();
    });

    it('should return null when no POI matches', async () => {
      executeMock.mockResolvedValue([]);

      const result = await repository.findById('N', '1');

      expect(result).toBeNull();
      expect(executeMock).toHaveBeenCalledExactlyOnceWith(expect.any(String), [
        'N',
        '1',
      ]);
    });
  });
});
