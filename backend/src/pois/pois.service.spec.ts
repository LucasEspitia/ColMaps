import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PoisService } from './pois.service';
import type { PoisRepository } from './repositories/pois.repository';
import type { Bbox } from './types/bbox.type';
import type { PoiDetailRow, PoiRow } from './types/poi.types';

describe('PoisService', () => {
  let service: PoisService;

  const bbox: Bbox = [-74.2, 4.5, -73.9, 4.8];

  const findWithinMock = vi.fn<PoisRepository['findWithin']>();

  const findByIdMock = vi.fn<PoisRepository['findById']>();

  beforeEach(() => {
    findWithinMock.mockReset();
    findByIdMock.mockReset();

    const repository = {
      findWithin: findWithinMock,
      findById: findByIdMock,
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

  describe('findById', () => {
    it.each(['N', 'W', 'R'])(
      'should map the detail for OSM type %s',
      async (osmType) => {
        const row: PoiDetailRow = {
          osm_type: osmType,
          osm_id: '9223372036854775807',
          name: 'Museo del Oro',
          primary_category: 'museums_culture',
          categories: ['museums_culture', 'attractions'],
          subcategory: 'museum',
          geometry: { type: 'Point', coordinates: [-74.07, 4.6] },
          longitude: -74.07,
          latitude: 4.6,
          description: 'Gold museum',
          address: null,
          website: 'https://example.com',
          phone: null,
          opening_hours: 'Tu-Su 09:00-18:00',
          wheelchair: 'yes',
        };
        findByIdMock.mockResolvedValue(row);

        const result = await service.findById(osmType, row.osm_id);

        expect(findByIdMock).toHaveBeenCalledExactlyOnceWith(
          osmType,
          row.osm_id,
        );
        expect(result).toEqual({
          id: `${osmType}/${row.osm_id}`,
          name: row.name,
          category: row.primary_category,
          categories: row.categories,
          subcategory: row.subcategory,
          coordinates: [-74.07, 4.6],
          description: row.description,
          address: null,
          website: row.website,
          phone: null,
          openingHours: row.opening_hours,
          wheelchair: 'yes',
        });
      },
    );

    it.each([
      ['node', '123'],
      ['n', '123'],
      ['', '123'],
      ['N', ''],
      ['N', '0'],
      ['N', '-1'],
      ['N', '01'],
      ['N', '1.5'],
      ['N', 'abc'],
      ['N', '9223372036854775808'],
      ['N', '10000000000000000000'],
    ])(
      'should reject invalid identity %s/%s before querying',
      async (osmType, osmId) => {
        await expect(service.findById(osmType, osmId)).rejects.toThrow(
          BadRequestException,
        );
        expect(findByIdMock).not.toHaveBeenCalled();
      },
    );

    it('should throw when the POI does not exist', async () => {
      findByIdMock.mockResolvedValue(null);

      await expect(service.findById('N', '1')).rejects.toThrow(
        NotFoundException,
      );
      expect(findByIdMock).toHaveBeenCalledExactlyOnceWith('N', '1');
    });
  });
});
