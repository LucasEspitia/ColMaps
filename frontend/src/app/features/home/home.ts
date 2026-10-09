import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HeroComponent } from './components/hero/hero';
import { DiscoverComponent } from './components/discover/discover';
import { ExploreComponent } from './components/explore/explore';
import { FinalCtaComponent } from './components/final-cta/final-cta';

@Component({
  selector: 'app-home',
  imports: [HeroComponent, DiscoverComponent, ExploreComponent, FinalCtaComponent],
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {}
