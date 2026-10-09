import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideTaiga } from '@taiga-ui/core';
import { vi } from 'vitest';

import { HeroComponent } from './hero';

@Component({ template: '' })
class TestPage {}

describe('HeroComponent', () => {
  let fixture: ComponentFixture<HeroComponent>;
  let router: Router;
  let element: HTMLElement;

  beforeEach(async () => {
    vi.stubGlobal('matchMedia', (query: string): MediaQueryList => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(() => false),
    }));
    await TestBed.configureTestingModule({
      imports: [HeroComponent],
      providers: [
        provideRouter([
          { path: 'search', component: TestPage },
          { path: 'map', component: TestPage },
        ]),
        provideTaiga(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HeroComponent);
    router = TestBed.inject(Router);
    element = fixture.nativeElement;

    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the main heading with an accessible section', () => {
    const section = element.querySelector('section');
    const heading = element.querySelector('h1#hero-title');

    expect(section?.getAttribute('aria-labelledby')).toBe('hero-title');
    expect(heading?.textContent?.trim()).toBe('Colombia is yours to explore.');
  });

  it('should render an optimized decorative hero image', () => {
    const image = element.querySelector<HTMLImageElement>('picture img');
    const source = element.querySelector<HTMLSourceElement>('picture source');

    expect(image).not.toBeNull();
    expect(image?.getAttribute('alt')).toBe('');
    expect(image?.getAttribute('loading')).toBe('eager');
    expect(image?.getAttribute('fetchpriority')).toBe('high');

    expect(source?.getAttribute('srcset')).toContain('640w');
    expect(source?.getAttribute('srcset')).toContain('1280w');
    expect(source?.getAttribute('srcset')).toContain('1920w');
  });

  it('should render navigation links with their destinations', () => {
    const links = Array.from(element.querySelectorAll('a'));

    expect(links.map((link) => [link.textContent?.trim(), link.getAttribute('href')])).toEqual([
      ['Try It', '/search'],
      ['Explore Map', '/map'],
    ]);
  });

  it.each([
    ['Try It', '/search'],
    ['Explore Map', '/map'],
  ])('should navigate to %s', async (label, destination) => {
    const link = Array.from(element.querySelectorAll('a')).find(
      (candidate) => candidate.textContent?.trim() === label,
    );

    expect(link).toBeDefined();

    link!.click();
    await fixture.whenStable();

    expect(router.url).toBe(destination);
  });

  it('should hide decorative elements from assistive technologies', () => {
    const overlay = element.querySelector('div[aria-hidden="true"]');

    const decorativeImage = element.querySelector('picture img');

    expect(overlay).not.toBeNull();
    expect(decorativeImage?.getAttribute('alt')).toBe('');
  });
});
