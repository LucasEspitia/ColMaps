import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HeroComponent } from './components/hero/hero';
import { DiscoverComponent } from './components/discover/discover';
import { ExploreComponent } from './components/explore/explore';
import { HighlightsComponent } from './components/highlights/highlights';

@Component({
  selector: 'app-home',
  imports: [HeroComponent, DiscoverComponent, ExploreComponent, HighlightsComponent],
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {}
