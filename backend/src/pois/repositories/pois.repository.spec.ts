import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EntityManager } from '@mikro-orm/postgresql';

import { PoisRepository } from './pois.repository';
import type { Bbox } from '../types/bbox.type';
import type { PoiRow } from '../types/poi.types';

describe('PoisRepository', () => {
  let repository: PoisRepository;

  const executeMock =
    vi.fn<(sql: string, params: number[]) => Promise<PoiRow[]>>();

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
    expect(params).toEqual([...bbox]);
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
});
