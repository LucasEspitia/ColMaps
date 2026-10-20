import { describe, expect, it } from 'vitest';
import { toPoiDetail } from './poi.mapper';

import type { PoiDetailRow } from '../types/poi.types';

const baseRow: PoiDetailRow = {
  osm_type: 'W',
  osm_id: '128799666',
  name: 'Movich Pereira',
  primary_category: 'accommodation',
  categories: ['accommodation'],
  subcategory: 'hotel',
  longitude: -75.6919,
  latitude: 4.8087,
  tags: null,
};

describe('toPoiDetail', () => {
  it('maps the POI identity and coordinates', () => {
    const result = toPoiDetail(baseRow);

    expect(result.id).toBe('W/128799666');
    expect(result.coordinates).toEqual([-75.6919, 4.8087]);
    expect(result.category).toBe('accommodation');
  });

  it('handles missing OSM metadata', () => {
    const result = toPoiDetail(baseRow);

    expect(result.description).toBeNull();
    expect(result.address).toBeNull();
    expect(result.stars).toBeNull();
  });

  it('maps rich hotel metadata', () => {
    const result = toPoiDetail({
      ...baseRow,
      tags: {
        'addr:street': 'Carrera 13',
        'addr:housenumber': '15-71',
        'addr:city': 'Pereira',
        stars: '4',
        rooms: '202',
        air_conditioning: 'yes',
        'payment:credit_cards': 'no',
      },
    });

    expect(result.address).toBe('Carrera 13 #15-71, Pereira');
    expect(result.stars).toBe(4);
    expect(result.rooms).toBe(202);
    expect(result.airConditioning).toBe(true);
    expect(result.acceptsCreditCards).toBe(false);
  });

  it('preserves unknown and invalid OSM values as null', () => {
    const result = toPoiDetail({
      ...baseRow,
      tags: {
        stars: 'unknown',
        rooms: '',
        air_conditioning: 'limited',
      },
    });

    expect(result.stars).toBeNull();
    expect(result.rooms).toBeNull();
    expect(result.airConditioning).toBeNull();
  });
});
