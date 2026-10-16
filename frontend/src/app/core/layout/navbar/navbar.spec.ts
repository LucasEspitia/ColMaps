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
import { AccessibilityStorage } from '../../accessibility/accessibility-storage';

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
        { provide: AccessibilityStorage, useValue: { load: () => null, save: vi.fn() } },
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

  it('restores focus to the mobile menu trigger when the opener is removed', async () => {
    const service = TestBed.inject(Accessibility);

    const menuTrigger = await openMenu();
    // The focus restoration service checks geometry, which jsdom does not calculate.
    vi.spyOn(menuTrigger, 'getClientRects').mockReturnValue({ length: 1 } as DOMRectList);

    const opener = element.querySelector<HTMLButtonElement>(
      '#mobile-navigation button[aria-label="Open accessibility settings"]',
    )!;

    opener.focus();
    expect(document.activeElement).toBe(opener);

    opener.click();
    await fixture.whenStable();

    expectMenuClosed();
    expect(opener.isConnected).toBe(false);
    expect(service.panelOpen()).toBe(true);

    const close = element.querySelector<HTMLButtonElement>('#accessibility-close')!;

    expect(document.activeElement).toBe(close);

    close.click();

    fixture.detectChanges();
    await fixture.whenStable();

    expect(service.panelOpen()).toBe(false);
    expect(document.activeElement).toBe(menuTrigger);
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

  it('should close the mobile drawer using the Close button', async () => {
    await openMenu();
    const button = element.querySelector<HTMLButtonElement>(
      '#mobile-navigation button[aria-label="Close navigation menu"]',
    );

    expect(button).not.toBeNull();
    expect(button?.type).toBe('button');
    button!.click();
    await fixture.whenStable();

    expectMenuClosed();
  });

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
