import { describe, expect, it, vi } from 'vitest';

import { PoisController } from './pois.controller';
import type { PoisService } from './pois.service';
import type { Bbox } from './types/bbox.type';
import type { PoiFeatureCollection } from './types/poi.types';

describe('PoisController', () => {
  it('should delegate the bbox to the service and return its result', async () => {
    const bbox: Bbox = [-74.2, 4.5, -73.9, 4.8];

    const expected: PoiFeatureCollection = {
      type: 'FeatureCollection',
      features: [],
    };

    const findWithin = vi.fn<(bbox: Bbox) => Promise<PoiFeatureCollection>>();
    findWithin.mockResolvedValue(expected);

    const service = {
      findWithin,
    } as unknown as PoisService;

    const controller = new PoisController(service);

    const result = await controller.findWithin(bbox);

    expect(findWithin).toHaveBeenCalledExactlyOnceWith(bbox);
    expect(result).toBe(expected);
  });
});
