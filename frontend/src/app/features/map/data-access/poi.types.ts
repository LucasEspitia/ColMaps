import type { Feature, FeatureCollection, Point } from 'geojson';
import type { FeatureCategory } from '../../../shared/poi/feature-category';
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
  email?: string | null;
  facebook?: string | null;

  openingHours?: string | null;
  wheelchair?: string | null;

  image?: string | null;

  brand?: string | null;
  operator?: string | null;

  stars?: number | null;
  rooms?: number | null;

  internetAccess?: string | null;
  internetAccessFee?: string | null;

  reservation?: string | null;
  smoking?: string | null;

  acceptsCreditCards?: boolean | null;
  acceptsDebitCards?: boolean | null;

  airConditioning?: boolean | null;
  bar?: boolean | null;
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
