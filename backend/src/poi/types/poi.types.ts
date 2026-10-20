import type { FeatureCategory } from '../contracts/feature-category';

interface PoiBaseRow {
  osm_type: string;
  osm_id: string;
  name: string | null;

  primary_category: FeatureCategory;
  categories: FeatureCategory[];
  subcategory: string;
}

export interface PoiRow extends PoiBaseRow {
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
}

export interface PoiDetailRow extends PoiBaseRow {
  longitude: number;
  latitude: number;

  tags: Record<string, unknown> | null;
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
