import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router, RouterLinkActive } from '@angular/router';
import { provideTaiga } from '@taiga-ui/core';
import { vi } from 'vitest';

import { Navbar } from './navbar';

@Component({ template: '' })
class TestPage {}

describe('Navbar', () => {
  let fixture: ComponentFixture<Navbar>;
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
      imports: [Navbar],
      providers: [
        provideRouter([
          { path: '', component: TestPage },
          { path: 'search', component: TestPage },
          { path: 'map', component: TestPage },
          { path: 'about', component: TestPage },
        ]),
        provideTaiga(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Navbar);
    router = TestBed.inject(Router);
    element = fixture.nativeElement;
    await fixture.whenStable();
    await router.navigateByUrl('/');
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the navigation links with their destinations', () => {
    expect(element.querySelector('nav')?.getAttribute('aria-label')).toBe('Main navigation');
    const links = Array.from(element.querySelectorAll('a'));

    expect(links.map((link) => [link.textContent?.trim(), link.getAttribute('href')])).toEqual([
      ['ColMaps', '/'],
      ['Home', '/'],
      ['Try It', '/search'],
      ['General Map', '/map'],
      ['About', '/about'],
    ]);
  });

  it('should mark only Home as active on the home page', () => {
    const links = fixture.debugElement.queryAll(By.directive(RouterLinkActive));

    expect(links.map((link) => link.injector.get(RouterLinkActive).isActive)).toEqual([
      true,
      false,
      false,
      false,
    ]);
  });

  it.each([
    ['Try It', '/search'],
    ['General Map', '/map'],
    ['About', '/about'],
  ])('should navigate to %s and update the active link', async (label, url) => {
    const link = Array.from(element.querySelectorAll('a')).find(
      (candidate) => candidate.textContent?.trim() === label,
    );
    expect(link).toBeDefined();
    link!.click();
    await fixture.whenStable();

    expect(router.url).toBe(url);
    const activeLinks = fixture.debugElement
      .queryAll(By.directive(RouterLinkActive))
      .filter((candidate) => candidate.injector.get(RouterLinkActive).isActive);
    expect(activeLinks).toHaveLength(1);
    expect((activeLinks[0].nativeElement as HTMLAnchorElement).textContent?.trim()).toBe(label);
  });

  it('should render an accessible settings button that does not submit forms', () => {
    const button = element.querySelector<HTMLButtonElement>(
      'button[aria-label="Open accessibility settings"]',
    );

    expect(button).not.toBeNull();
    expect(button?.type).toBe('button');
    expect(button?.disabled).toBe(false);
    expect(button?.textContent?.trim()).toBe('Accessibility');
  });
});
