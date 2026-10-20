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

  describe('findWithin', () => {
    it('should transform POI rows into a GeoJSON FeatureCollection', async () => {
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

      findWithinMock.mockResolvedValue(rows);

      const result = await service.findWithin(bbox);

      expect(findWithinMock).toHaveBeenCalledExactlyOnceWith(bbox, []);

      expect(result).toEqual({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: 'N/123',
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

  describe('findById', () => {
    const baseRow: PoiDetailRow = {
      osm_type: 'N',
      osm_id: '9223372036854775807',
      name: 'Museo del Oro',
      primary_category: 'museums_culture',
      categories: ['museums_culture', 'attractions'],
      subcategory: 'museum',
      longitude: -74.07,
      latitude: 4.6,
      tags: {
        description: 'Gold museum',
        website: 'https://example.com',
        opening_hours: 'Tu-Su 09:00-18:00',
        wheelchair: 'yes',
      },
    };

    it.each(['N', 'W', 'R'])(
      'should return the mapped detail for OSM type %s',
      async (osmType) => {
        const row: PoiDetailRow = {
          ...baseRow,
          osm_type: osmType,
        };

        findByIdMock.mockResolvedValue(row);

        const result = await service.findById(osmType, row.osm_id);

        expect(findByIdMock).toHaveBeenCalledExactlyOnceWith(
          osmType,
          row.osm_id,
        );

        expect(result).toEqual({
          id: `${osmType}/${row.osm_id}`,
          name: 'Museo del Oro',
          category: 'museums_culture',
          categories: ['museums_culture', 'attractions'],
          subcategory: 'museum',
          coordinates: [-74.07, 4.6],

          description: 'Gold museum',
          address: null,
          website: 'https://example.com',
          phone: null,
          email: null,
          facebook: null,

          openingHours: 'Tu-Su 09:00-18:00',
          wheelchair: 'yes',
          image: null,

          brand: null,
          operator: null,
          stars: null,
          rooms: null,

          internetAccess: null,
          internetAccessFee: null,
          reservation: null,
          smoking: null,

          airConditioning: null,
          bar: null,
          acceptsCreditCards: null,
          acceptsDebitCards: null,
        });
      },
    );

    it('should return null metadata fields when tags are missing', async () => {
      const row: PoiDetailRow = {
        ...baseRow,
        tags: null,
      };

      findByIdMock.mockResolvedValue(row);

      const result = await service.findById(row.osm_type, row.osm_id);

      expect(result.id).toBe('N/9223372036854775807');
      expect(result.name).toBe('Museo del Oro');
      expect(result.coordinates).toEqual([-74.07, 4.6]);

      expect(result.description).toBeNull();
      expect(result.address).toBeNull();
      expect(result.website).toBeNull();
      expect(result.phone).toBeNull();
      expect(result.image).toBeNull();
      expect(result.stars).toBeNull();
      expect(result.rooms).toBeNull();
      expect(result.airConditioning).toBeNull();

      expect(findByIdMock).toHaveBeenCalledExactlyOnceWith('N', row.osm_id);
    });

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

    it('should throw NotFoundException when the POI does not exist', async () => {
      findByIdMock.mockResolvedValue(null);

      await expect(service.findById('N', '1')).rejects.toThrow(
        NotFoundException,
      );

      expect(findByIdMock).toHaveBeenCalledExactlyOnceWith('N', '1');
    });
  });
});
