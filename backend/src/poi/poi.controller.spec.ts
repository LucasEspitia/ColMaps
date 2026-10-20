import { describe, expect, it, vi } from 'vitest';

import { PoiController } from './poi.controller';
import type { PoiDetail } from './contracts/poi-detail';
import type { PoiService } from './poi.service';
import type { Bbox } from './types/bbox.type';
import type { PoiFeatureCollection } from './types/poi.types';
import { FeatureCategory } from './contracts/feature-category';

describe('PoiController', () => {
  it('should delegate the bbox to the service and return its result', async () => {
    const bbox: Bbox = [-74.2, 4.5, -73.9, 4.8];
    const categories: FeatureCategory[] = ['attractions', 'museums_culture'];

    const expected: PoiFeatureCollection = {
      type: 'FeatureCollection',
      features: [],
    };

    const findWithin =
      vi.fn<
        (
          bbox: Bbox,
          categories: FeatureCategory[],
        ) => Promise<PoiFeatureCollection>
      >();
    findWithin.mockResolvedValue(expected);

    const service = {
      findWithin,
    } as unknown as PoiService;

    const controller = new PoiController(service);

    const result = await controller.findWithin(bbox, categories);

    expect(findWithin).toHaveBeenCalledExactlyOnceWith(bbox, categories);
    expect(result).toBe(expected);
  });

  it('should delegate the osmType and osmId to the service and return its result', async () => {
    const osmType = 'N';
    const osmId = '123';

    const expected: PoiDetail = {
      id: `${osmType}/${osmId}`,
      name: 'Test POI',
      category: 'food_drink',
      categories: ['food_drink'],
      subcategory: 'fast_food',
      coordinates: [-74.0, 4.7],
      description: 'A test point of interest',
      address: '123 Test St, Test City',
      website: 'https://testpoi.com',
      phone: '+1234567890',
      openingHours: 'Mo-Fr 09:00-17:00',
      wheelchair: 'yes',
    };

    const findById = vi.fn<PoiService['findById']>();
    findById.mockResolvedValue(expected);

    const service = {
      findById,
    } as unknown as PoiService;

    const controller = new PoiController(service);

    const result = await controller.findById(osmType, osmId);

    expect(findById).toHaveBeenCalledExactlyOnceWith(osmType, osmId);
    expect(result).toBe(expected);
  });
});
