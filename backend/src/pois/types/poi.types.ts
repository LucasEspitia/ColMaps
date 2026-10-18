import type { FeatureCategory } from '../contracts/feature-category';

export interface PoiDetailRow extends PoiRow {
  longitude: number;
  latitude: number;
  description: string | null;
  address: string | null;
  website: string | null;
  phone: string | null;
  opening_hours: string | null;
  wheelchair: string | null;
}

export interface PoiRow {
  osm_type: string;
  osm_id: string;
  name: string | null;
  primary_category: FeatureCategory;
  categories: FeatureCategory[];
  subcategory: string;
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
}

export interface PoiFeature {
  type: 'Feature';
  id: string;
  geometry: PoiRow['geometry'];
  properties: {
    name: PoiRow['name'];
    category: PoiRow['primary_category'];
    categories: PoiRow['categories'];
    subcategory: PoiRow['subcategory'];
  };
}

export interface PoiFeatureCollection {
  type: 'FeatureCollection';
  features: PoiFeature[];
}
