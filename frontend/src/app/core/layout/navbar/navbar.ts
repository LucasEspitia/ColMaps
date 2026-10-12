import { CdkTrapFocus } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TuiButton, TuiIcon, TuiPopup, TuiClose } from '@taiga-ui/core';
import { TuiDrawer } from '@taiga-ui/kit';
import { Accessibility } from '../../accessibility/accessibility.service';

@Component({
  selector: 'app-navbar',
  imports: [
    CdkTrapFocus,
    RouterLink,
    RouterLinkActive,
    TuiButton,
    TuiIcon,
    TuiPopup,
    TuiClose,
    TuiDrawer,
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Navbar {
  private readonly accessibility = inject(Accessibility);

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

  openAccessibility(): void {
    this.accessibility.openPanel();
  }

  openAccessibilityFromMenu(): void {
    this.closeMenu();
    this.openAccessibility();
  }
}
