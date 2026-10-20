import { TuiRoot } from '@taiga-ui/core';
import { Component, inject, computed } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';

import { Navbar } from './core/layout/navbar/navbar';
import { Footer } from './core/layout/footer/footer';
import { AccessibilityPanel } from './core/layout/accessibility-panel/accessibility-panel';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TuiRoot, Navbar, Footer, AccessibilityPanel],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly router = inject(Router);

  private readonly routeFullscreen = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      startWith(null),
      map(() => {
        let route = this.router.routerState.snapshot.root;

        while (route.firstChild) {
          route = route.firstChild;
        }

        return route.data['fullscreen'] === true;
      }),
    ),
    { initialValue: false },
  );

  readonly isFullscreen = computed(() => this.routeFullscreen() ?? false);
}
