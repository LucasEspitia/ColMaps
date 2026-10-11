import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router, RouterLinkActive } from '@angular/router';
import { provideTaiga, TuiRoot } from '@taiga-ui/core';
import { vi } from 'vitest';

import { Navbar } from './navbar';

@Component({ template: '' })
class TestPage {}

@Component({
  imports: [Navbar, TuiRoot],
  template: '<tui-root><app-navbar /></tui-root>',
})
class TestHost {}

describe('Navbar', () => {
  let fixture: ComponentFixture<TestHost>;
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
      imports: [TestHost],
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

    fixture = TestBed.createComponent(TestHost);
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
    expect(fixture.debugElement.query(By.directive(Navbar)).componentInstance).toBeTruthy();
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

  async function openMenu(): Promise<HTMLButtonElement> {
    const button = element.querySelector<HTMLButtonElement>(
      'button[aria-label="Open navigation menu"]',
    );

    expect(button).not.toBeNull();
    button!.click();
    await fixture.whenStable();

    return button!;
  }

  function expectMenuClosed(): void {
    expect(element.querySelector('#mobile-navigation')).toBeNull();
    expect(
      element.querySelector('[aria-label="Open navigation menu"]')?.getAttribute('aria-expanded'),
    ).toBe('false');
  }

  it('should open the mobile drawer and update the menu button accessibility state', async () => {
    expectMenuClosed();
    const button = await openMenu();
    const drawer = element.querySelector('#mobile-navigation');

    expect(button.type).toBe('button');
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(button.getAttribute('aria-controls')).toBe(drawer?.id);
    expect(drawer).not.toBeNull();
    expect(
      Array.from(drawer!.querySelectorAll('nav a'), (link) => [
        link.textContent?.trim(),
        link.getAttribute('href'),
      ]),
    ).toEqual([
      ['Home', '/'],
      ['Try It', '/search'],
      ['General Map', '/map'],
      ['About', '/about'],
    ]);
    expect(drawer?.querySelector('nav')?.getAttribute('aria-label')).toBe('Mobile navigation');
  });

  it.each([
    ['Home', '/'],
    ['Try It', '/search'],
    ['General Map', '/map'],
    ['About', '/about'],
  ])('should navigate through the mobile %s link and close the drawer', async (label, url) => {
    await router.navigateByUrl(url === '/about' ? '/map' : '/about');
    await fixture.whenStable();
    await openMenu();
    const link = Array.from(element.querySelectorAll('#mobile-navigation nav a')).find(
      (candidate) => candidate.textContent?.trim() === label,
    );

    expect(link).toBeDefined();
    (link as HTMLAnchorElement).click();
    await fixture.whenStable();

    expect(router.url).toBe(url);
    expectMenuClosed();
    const activeLinks = fixture.debugElement
      .queryAll(By.directive(RouterLinkActive))
      .filter((candidate) => candidate.injector.get(RouterLinkActive).isActive);

    expect(activeLinks).toHaveLength(1);
    expect(activeLinks[0].nativeElement.textContent.trim()).toBe(label);
  });

  it.each(['Close navigation menu', 'Open accessibility settings'])(
    'should close the mobile drawer using the %s button',
    async (label) => {
      await openMenu();
      const button = element.querySelector<HTMLButtonElement>(
        `#mobile-navigation button[aria-label="${label}"]`,
      );

      expect(button).not.toBeNull();
      expect(button?.type).toBe('button');
      button!.click();
      await fixture.whenStable();

      expectMenuClosed();
    },
  );

  it('should return home and close the drawer when the brand is clicked', async () => {
    await router.navigateByUrl('/about');
    await fixture.whenStable();
    await openMenu();
    element.querySelector<HTMLAnchorElement>('a[aria-label="ColMaps home"]')!.click();
    await fixture.whenStable();

    expect(router.url).toBe('/');
    expectMenuClosed();
  });

  it('should close the drawer when it emits tuiClose', async () => {
    await openMenu();
    element.querySelector('#mobile-navigation')!.dispatchEvent(new Event('tuiClose'));
    await fixture.whenStable();

    expectMenuClosed();
  });
});
