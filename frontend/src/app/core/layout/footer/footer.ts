import { Component, inject } from '@angular/core';
import { ViewportScroller } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Accessibility } from '../../accessibility/accessibility.service';

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class Footer {
  private readonly accessibility = inject(Accessibility);

  openAccessibility(): void {
    this.accessibility.openPanel();
  }

  private viewportScroller = inject(ViewportScroller);

  scrollToTop(): void {
    this.viewportScroller.scrollToPosition([0, 0]);
  }
}
