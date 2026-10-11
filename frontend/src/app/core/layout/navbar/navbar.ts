import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TuiButton, TuiIcon, TuiPopup } from '@taiga-ui/core';
import { TuiDrawer } from '@taiga-ui/kit';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, TuiButton, TuiIcon, TuiPopup, TuiDrawer],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Navbar {
  readonly menuOpen = signal(false);

  readonly navigationItems = [
    { label: 'Home', route: '/', icon: '@tui.house' },
    { label: 'Try It', route: '/search', icon: '@tui.search' },
    { label: 'General Map', route: '/map', icon: '@tui.map' },
    { label: 'About', route: '/about', icon: '@tui.info' },
  ];

  closeMenu(): void {
    this.menuOpen.set(false);
  }
}
