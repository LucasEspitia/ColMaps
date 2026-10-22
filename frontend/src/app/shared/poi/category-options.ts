import type { FeatureCategory } from './feature-category';

export interface CategoryOption {
  id: FeatureCategory;
  label: string;
  icon: string;
}

export const CATEGORY_OPTIONS = [
  {
    id: 'attractions',
    label: 'Attractions',
    icon: '@tui.camera',
  },
  {
    id: 'museums_culture',
    label: 'Museums & Culture',
    icon: '@tui.landmark',
  },
  {
    id: 'history_heritage',
    label: 'History & Heritage',
    icon: '@tui.columns-3',
  },
  {
    id: 'viewpoints',
    label: 'Viewpoints',
    icon: '@tui.binoculars',
  },
  {
    id: 'nature',
    label: 'Nature',
    icon: '@tui.trees',
  },
  {
    id: 'parks_recreation',
    label: 'Parks & Recreation',
    icon: '@tui.tree-pine',
  },
  {
    id: 'food_drink',
    label: 'Food & Drink',
    icon: '@tui.utensils',
  },
  {
    id: 'accommodation',
    label: 'Accommodation',
    icon: '@tui.bed-double',
  },
  {
    id: 'entertainment',
    label: 'Entertainment',
    icon: '@tui.ticket',
  },
  {
    id: 'markets_shopping',
    label: 'Markets & Shopping',
    icon: '@tui.shopping-bag',
  },
  {
    id: 'health_pharmacy',
    label: 'Health & Pharmacy',
    icon: '@tui.heart-pulse',
  },
  {
    id: 'transport_travel',
    label: 'Transport & Travel',
    icon: '@tui.bus-front',
  },
] as const satisfies readonly CategoryOption[];
