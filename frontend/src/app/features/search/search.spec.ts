import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { Search } from './search';

@Component({ template: '' })
class MapPageStub {}

describe('Search', () => {
  let fixture: ComponentFixture<Search>;
  let element: HTMLElement;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Search],
      providers: [provideRouter([{ path: 'map', component: MapPageStub }])],
    }).compileComponents();

    fixture = TestBed.createComponent(Search);
    element = fixture.nativeElement;
    router = TestBed.inject(Router);
    await fixture.whenStable();
  });

  function category(label: string): HTMLButtonElement {
    return [...element.querySelectorAll<HTMLButtonElement>('button[aria-pressed]')].find(
      (button) => button.textContent?.trim() === label,
    )!;
  }

  function explore(): HTMLAnchorElement {
    return element.querySelector<HTMLAnchorElement>('a')!;
  }

  function summary(): string[] {
    return [...element.querySelectorAll('aside li')].map((item) => item.textContent!.trim());
  }

  it('should reflect independent category toggles in the summary and navigate with the remaining selection', async () => {
    const nature = category('Nature');
    const museums = category('Museums & Culture');
    expect(nature.getAttribute('aria-pressed')).toBe('false');
    expect(museums.getAttribute('aria-pressed')).toBe('false');

    nature.click();
    museums.click();
    await fixture.whenStable();

    expect(nature.getAttribute('aria-pressed')).toBe('true');
    expect(museums.getAttribute('aria-pressed')).toBe('true');
    expect(summary()).toEqual(expect.arrayContaining(['Nature', 'Museums & Culture']));
    expect(summary()).toHaveLength(2);
    expect(router.parseUrl(explore().getAttribute('href')!).queryParams).toEqual({
      categories: 'nature,museums_culture',
    });

    nature.click();
    await fixture.whenStable();

    expect(nature.getAttribute('aria-pressed')).toBe('false');
    expect(museums.getAttribute('aria-pressed')).toBe('true');
    expect(summary()).toEqual(['Museums & Culture']);

    explore().click();
    await fixture.whenStable();

    expect(router.parseUrl(router.url).queryParams).toEqual({ categories: 'museums_culture' });
    expect(router.url.split('?')[0]).toBe('/map');
  });

  it('should offer all categories initially and restore unfiltered navigation after clearing selections', async () => {
    expect(explore().getAttribute('href')).toBe('/map');
    expect(element.querySelector('aside')?.textContent).toContain('All 12 categories');
    expect(
      [...element.querySelectorAll('button')].some(
        (button) => button.textContent?.trim() === 'Clear all',
      ),
    ).toBe(false);

    category('Nature').click();
    category('Museums & Culture').click();
    await fixture.whenStable();
    const clear = [...element.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === 'Clear all',
    )!;
    clear.click();
    await fixture.whenStable();

    expect(element.querySelectorAll('button[aria-pressed="true"]')).toHaveLength(0);
    expect(summary()).toEqual([]);
    expect(element.querySelector('aside')?.textContent).toContain('All 12 categories');
    expect(clear.isConnected).toBe(false);
    expect(explore().getAttribute('href')).toBe('/map');

    explore().click();
    await fixture.whenStable();
    expect(router.url).toBe('/map');
  });
});
