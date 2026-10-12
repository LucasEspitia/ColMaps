import { InteractivityChecker } from '@angular/cdk/a11y';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTaiga } from '@taiga-ui/core';
import { vi } from 'vitest';

import { App } from './app';
import { Accessibility } from './core/accessibility/accessibility.service';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => false),
  }),
});

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), provideTaiga()],
    }).compileComponents();
    // jsdom does not calculate element dimensions.
    vi.spyOn(TestBed.inject(InteractivityChecker), 'isVisible').mockReturnValue(true);
  });

  it('opens the shared accessibility panel from the footer', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    element
      .querySelector<HTMLButtonElement>(
        'app-footer button[aria-label="Open accessibility settings"]',
      )!
      .click();
    await fixture.whenStable();
    expect(TestBed.inject(Accessibility).panelOpen()).toBe(true);
    expect(element.querySelector('tui-drawer #accessibility-title')?.textContent?.trim()).toBe(
      'Accessibility',
    );
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);

    expect(fixture.componentInstance).toBeTruthy();
  });
});
