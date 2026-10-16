import { Component, DOCUMENT, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, ViewportScroller } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Accessibility } from '../../accessibility/accessibility.service';

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class Footer {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly accessibility = inject(Accessibility);

  openAccessibility(): void {
    this.accessibility.openPanel();
  }

  private viewportScroller = inject(ViewportScroller);

  scrollToTop(): void {
    this.viewportScroller.scrollToPosition([0, 0]);
    if (isPlatformBrowser(this.platformId)) {
      this.document.getElementById('header-home-link')?.focus({ preventScroll: true });
    }
  }
}
