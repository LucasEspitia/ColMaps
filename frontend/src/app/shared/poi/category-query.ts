import { FEATURE_CATEGORY_IDS, FeatureCategory } from './feature-category';

const allowedCategories: ReadonlySet<string> = new Set(FEATURE_CATEGORY_IDS);

export function parseCategoryQuery(value: string | null): FeatureCategory[] {
  if (!value) return [];

  return [
    ...new Set(
      value
        .split(',')
        .map((category) => category.trim())
        .filter((category): category is FeatureCategory => allowedCategories.has(category)),
    ),
  ];
}
