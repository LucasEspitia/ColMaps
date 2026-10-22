import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TuiCardLarge } from '@taiga-ui/layout';
import { RouterLink } from '@angular/router';
import { FeatureCategory } from '../../../../shared/poi/feature-category';

interface DiscoverCard {
  title: string;
  description: string;
  image: string;
  alt: string;
  filters: readonly FeatureCategory[];
}

@Component({
  selector: 'app-discover',
  imports: [TuiCardLarge, RouterLink],
  templateUrl: './discover.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiscoverComponent {
  readonly categories = [
    {
      title: 'Culture & Heritage',
      description: 'Discover the traditions and history of Colombia.',
      image: 'culture',
      alt: 'Colorful colonial architecture in Cartagena',
      filters: ['museums_culture', 'history_heritage'],
    },
    {
      title: 'Nature & Adventure',
      description: 'Explore breathtaking natural landscapes.',
      image: 'nature',
      alt: 'Tropical coastline in Tayrona National Park',
      filters: ['nature', 'parks_recreation', 'viewpoints'],
    },
    {
      title: 'Cities & Urban Life',
      description: 'Experience vibrant Colombian cities.',
      image: 'cities',
      alt: 'Panoramic view of Medellín',
      filters: ['food_drink', 'entertainment', 'markets_shopping'],
    },
    {
      title: 'Hidden Gems',
      description: 'Explore places without limiting categories.',
      image: 'hidden',
      alt: 'Green mountain landscapes in Colombia',
      filters: [],
    },
  ] as const satisfies readonly DiscoverCard[];

  mapCategory(filters: readonly FeatureCategory[]) {
    return filters.length > 0 ? { categories: filters.join(',') } : {};
  }
}
