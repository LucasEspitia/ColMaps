import { FeatureCategory } from './feature-category';

export interface PoiSummary {
  id: string;
  name: string | null;

  category: FeatureCategory;
  categories: FeatureCategory[];

  subcategory: string;

  coordinates: [number, number];
}
