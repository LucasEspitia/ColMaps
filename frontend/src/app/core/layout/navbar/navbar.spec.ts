import { InteractivityChecker } from '@angular/cdk/a11y';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router, RouterLinkActive } from '@angular/router';
import { provideTaiga, TuiRoot } from '@taiga-ui/core';
import { vi } from 'vitest';

import { Navbar } from './navbar';
import { AccessibilityPanel } from '../accessibility-panel/accessibility-panel';
import { Accessibility } from '../../accessibility/accessibility.service';

@Component({ template: '' })
class TestPage {}

@Component({
  imports: [Navbar, AccessibilityPanel, TuiRoot],
  template: '<tui-root><app-navbar /><app-accessibility-panel /></tui-root>',
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
    // jsdom does not calculate element dimensions.
    vi.spyOn(TestBed.inject(InteractivityChecker), 'isVisible').mockReturnValue(true);

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

  it('opens the accessibility drawer from the desktop button and closes it', async () => {
    const navbar: Navbar = fixture.debugElement.query(By.directive(Navbar)).componentInstance;
    const closeMenu = vi.spyOn(navbar, 'closeMenu');
    element
      .querySelector<HTMLButtonElement>('button[aria-label="Open accessibility settings"]')!
      .click();
    await fixture.whenStable();
    expect(TestBed.inject(Accessibility).panelOpen()).toBe(true);
    expect(closeMenu).not.toHaveBeenCalled();
    expect(navbar.menuOpen()).toBe(false);
    const drawer = element.querySelector('tui-drawer');
    expect(drawer).not.toBeNull();
    expect(drawer!.querySelector('#accessibility-title')?.textContent?.trim()).toBe(
      'Accessibility',
    );
    Array.from(drawer!.querySelectorAll('button'))
      .find((button) => button.textContent?.trim() === 'Close')!
      .click();
    await fixture.whenStable();
    expect(TestBed.inject(Accessibility).panelOpen()).toBe(false);
    expect(element.querySelector('tui-drawer')).toBeNull();
  });

  it('opens accessibility from the mobile drawer', async () => {
    const navbar: Navbar = fixture.debugElement.query(By.directive(Navbar)).componentInstance;
    const closeMenu = vi.spyOn(navbar, 'closeMenu');
    await openMenu();
    element
      .querySelector<HTMLButtonElement>(
        '#mobile-navigation button[aria-label="Open accessibility settings"]',
      )!
      .click();
    await fixture.whenStable();
    expectMenuClosed();
    expect(closeMenu).toHaveBeenCalledTimes(1);
    expect(TestBed.inject(Accessibility).panelOpen()).toBe(true);
    expect(element.querySelector('tui-drawer #accessibility-title')?.textContent?.trim()).toBe(
      'Accessibility',
    );
  });

  it('keeps the desktop panel open after the complete mouse event sequence', async () => {
    const button = element.querySelector<HTMLButtonElement>(
      'header button[aria-label="Open accessibility settings"]',
    )!;
    button.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    button.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    button.click();
    await fixture.whenStable();
    expect(TestBed.inject(Accessibility).panelOpen()).toBe(true);
    expect(element.querySelector('tui-drawer #accessibility-title')?.textContent?.trim()).toBe(
      'Accessibility',
    );
  });

  it('closes the accessibility drawer on Escape', async () => {
    element
      .querySelector<HTMLButtonElement>('button[aria-label="Open accessibility settings"]')!
      .click();
    await fixture.whenStable();
    element
      .querySelector('tui-drawer button')!
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();
    expect(TestBed.inject(Accessibility).panelOpen()).toBe(false);
    expect(element.querySelector('tui-drawer')).toBeNull();
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
    element.querySelector<HTMLAnchorElement>('header a[routerLink="/"]')!.click();
    await fixture.whenStable();

    expect(router.url).toBe('/');
    expectMenuClosed();
  });

  it('should close the mobile drawer on Escape', async () => {
    await openMenu();
    element
      .querySelector('tui-drawer button')!
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();

    expectMenuClosed();
  });
});
