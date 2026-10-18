import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PoisService } from './pois.service';
import type { PoisRepository } from './repositories/pois.repository';
import type { Bbox } from './types/bbox.type';
import type { PoiRow } from './types/poi.types';

describe('PoisService', () => {
  let service: PoisService;

  const bbox: Bbox = [-74.2, 4.5, -73.9, 4.8];

  const findWithinMock = vi.fn<PoisRepository['findWithin']>();

  beforeEach(() => {
    findWithinMock.mockReset();

    const repository = {
      findWithin: findWithinMock,
    } as unknown as PoisRepository;

    service = new PoisService(repository);
  });

  it('should transform POI rows into a GeoJSON FeatureCollection', async () => {
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

    findWithinMock.mockResolvedValue(rows);

    const result = await service.findWithin(bbox);

    expect(findWithinMock).toHaveBeenCalledExactlyOnceWith(bbox, []);

    expect(result).toEqual({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          id: 'node/123',
          geometry: {
            type: 'Point',
            coordinates: [-74.07, 4.6],
          },
          properties: {
            name: 'Museo del Oro',
            category: 'museums_culture',
            categories: ['museums_culture', 'attractions'],
            subcategory: 'museum',
          },
        },
      ],
    });
  });

  it('should return an empty FeatureCollection when no POIs are found', async () => {
    findWithinMock.mockResolvedValue([]);

    const result = await service.findWithin(bbox, ['museums_culture']);

    expect(findWithinMock).toHaveBeenCalledExactlyOnceWith(bbox, [
      'museums_culture',
    ]);

    expect(result).toEqual({
      type: 'FeatureCollection',
      features: [],
    });
  });
});
