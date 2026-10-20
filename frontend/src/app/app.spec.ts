import { InteractivityChecker } from '@angular/cdk/a11y';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideTaiga } from '@taiga-ui/core';
import { vi } from 'vitest';

import { App } from './app';
import { Accessibility } from './core/accessibility/accessibility.service';

@Component({ template: '' })
class TestPage {}

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
      providers: [
        provideRouter([
          { path: '', component: TestPage },
          {
            path: 'explore',
            children: [{ path: 'map', component: TestPage, data: { fullscreen: true } }],
          },
        ]),
        provideTaiga(),
      ],
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

  it('should apply fullscreen layout for the active child route and restore it on navigation', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    await router.navigateByUrl('/explore/map');
    await fixture.whenStable();

    expect(element.querySelector('app-footer')).toBeNull();
    expect(element.querySelector('main')?.classList.contains('overflow-hidden')).toBe(true);
    expect(element.querySelector('.h-dvh')).not.toBeNull();

    await router.navigateByUrl('/');
    await fixture.whenStable();

    expect(element.querySelector('app-footer')).not.toBeNull();
    expect(element.querySelector('main')?.classList.contains('overflow-hidden')).toBe(false);
    expect(element.querySelector('.h-dvh')).toBeNull();
  });
});
