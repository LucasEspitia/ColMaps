import type { Feature, FeatureCollection, Point } from 'geojson';

export const FEATURE_CATEGORY_IDS = [
  'attractions',
  'museums_culture',
  'history_heritage',
  'viewpoints',
  'nature',
  'parks_recreation',
  'food_drink',
  'accommodation',
  'entertainment',
  'markets_shopping',
  'health_pharmacy',
  'transport_travel',
] as const;

export type FeatureCategory = (typeof FEATURE_CATEGORY_IDS)[number];

export interface PoiSummary {
  id: string;
  name: string | null;

  category: FeatureCategory;
  categories: FeatureCategory[];

  subcategory: string;

  coordinates: [number, number];
}

export interface PoiDetail extends PoiSummary {
  description?: string | null;
  address?: string | null;
  website?: string | null;
  phone?: string | null;
  openingHours?: string | null;
  wheelchair?: string | null;
}

export interface PoiProperties {
  name: string | null;
  category: FeatureCategory;
  categories: FeatureCategory[];
  subcategory: string;
}

export type PoiFeature = Feature<Point, PoiProperties> & {
  id: string;
};

export type PoiFeatureCollection = FeatureCollection<Point, PoiProperties> & {
  features: PoiFeature[];
};

export type Bbox = [west: number, south: number, east: number, north: number];
