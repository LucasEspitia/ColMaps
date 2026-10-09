import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';

import { Footer } from './footer';

@Component({ template: '' })
class TestPage {}

describe('Footer', () => {
  let fixture: ComponentFixture<Footer>;
  let element: HTMLElement;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Footer],
      providers: [
        provideRouter([
          { path: '', component: TestPage },
          { path: 'search', component: TestPage },
          { path: 'map', component: TestPage },
          { path: 'about', component: TestPage },
        ]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Footer);
    element = fixture.nativeElement;
    router = TestBed.inject(Router);
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the footer sections and credits', () => {
    expect(element.querySelector('footer')?.getAttribute('aria-label')).toBe('Site footer');
    expect(
      Array.from(element.querySelectorAll('h2'), (heading) => heading.textContent?.trim()),
    ).toEqual(['Explore', 'Information']);
    expect(element.querySelector('nav')?.getAttribute('aria-label')).toBe('Footer navigation');
    expect(element.textContent).toContain('© 2026 ColMaps');
    expect(element.textContent).toContain('Slovak University of Technology in Bratislava (STU)');
  });

  it.each([
    ['Home', '/'],
    ['Try It', '/search'],
    ['General Map', '/map'],
    ['About ColMaps', '/about'],
  ])('should navigate using the %s link', async (label, destination) => {
    // Start elsewhere so the home links must perform a real navigation too.
    await router.navigateByUrl(destination === '/about' ? '/map' : '/about');
    await fixture.whenStable();
    const link = Array.from(element.querySelectorAll('a')).find(
      (candidate) => candidate.textContent?.trim() === label,
    );

    expect(link).toBeDefined();
    expect(link!.getAttribute('href')).toBe(destination);
    link!.click();
    await fixture.whenStable();

    expect(router.url).toBe(destination);
  });

  it('should render an accessible settings button without submitting forms', () => {
    const button = element.querySelector<HTMLButtonElement>(
      'button[aria-label="Open accessibility settings"]',
    );

    expect(button).not.toBeNull();
    expect(button?.type).toBe('button');
    expect(button?.disabled).toBe(false);
  });

  it('should scroll to the top when the back-to-top button is clicked', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    const button = element.querySelector<HTMLButtonElement>(
      'button[aria-label="Return to the top of the page"]',
    );

    expect(button).not.toBeNull();
    expect(button?.type).toBe('button');
    button!.click();

    expect(scrollTo).toHaveBeenCalledExactlyOnceWith({ top: 0, behavior: 'smooth' });
  });
});
