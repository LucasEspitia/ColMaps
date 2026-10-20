// *
// * All category points were obtained through data analysis and filtering within the data-pipeline section.
// *

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
