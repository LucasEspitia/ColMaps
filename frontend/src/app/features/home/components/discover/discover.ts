import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TuiCardLarge } from '@taiga-ui/layout';

@Component({
  selector: 'app-discover',
  imports: [TuiCardLarge],
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
    },
    {
      title: 'Nature & Adventure',
      description: 'Explore breathtaking natural landscapes.',
      image: 'nature',
      alt: 'Tropical coastline in Tayrona National Park',
    },
    {
      title: 'Cities & Urban Life',
      description: 'Experience vibrant Colombian cities.',
      image: 'cities',
      alt: 'Panoramic view of Medellín',
    },
    {
      title: 'Hidden Gems',
      description: 'Discover remarkable places beyond the usual destinations.',
      image: 'hidden',
      alt: 'Green mountain landscapes in Colombia',
    },
  ];
}
