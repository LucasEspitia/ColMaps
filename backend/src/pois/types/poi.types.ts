export interface PoiRow {
  osm_type: string;
  osm_id: string;
  name: string | null;
  tags: Record<string, string>;
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
    tags: PoiRow['tags'];
  };
}

export interface PoiFeatureCollection {
  type: 'FeatureCollection';
  features: PoiFeature[];
}
