import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ExploreComponent } from './explore';

describe('ExploreComponent', () => {
  let component: ExploreComponent;
  let fixture: ComponentFixture<ExploreComponent>;
  let nativeElement: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExploreComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ExploreComponent);
    component = fixture.componentInstance;
    nativeElement = fixture.nativeElement as HTMLElement;

    fixture.detectChanges();
    await fixture.whenStable();
  });

  describe('Initialization', () => {
    it('should create successfully', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('Rendering', () => {
    it('should render two exploration cards', () => {
      const cards = nativeElement.querySelectorAll('article');

      expect(cards.length).toBe(2);
    });

    it('should display the correct exploration options', () => {
      const headings = Array.from(nativeElement.querySelectorAll('article h3')).map((heading) =>
        heading.textContent?.trim(),
      );

      expect(headings).toEqual(['Find your next destination', 'See the bigger picture']);
    });

    it('should render a navigation link for each card', () => {
      const cards = nativeElement.querySelectorAll('article');

      cards.forEach((card) => {
        const link = card.querySelector('a');

        expect(link).not.toBeNull();
        expect(link?.textContent?.trim()).toBeTruthy();
      });
    });
  });

  describe('Navigation', () => {
    it('should provide a link to the search page', () => {
      const searchLink = nativeElement.querySelector('a[href="/search"]');

      expect(searchLink).not.toBeNull();
      expect(searchLink?.textContent?.trim()).toBe('Try It');
    });

    it('should provide a link to the general map', () => {
      const mapLink = nativeElement.querySelector('a[href="/map"]');

      expect(mapLink).not.toBeNull();
      expect(mapLink?.textContent?.trim()).toBe('General Map');
    });
  });

  describe('Accessibility', () => {
    it('should associate the section with its heading', () => {
      const section = nativeElement.querySelector('section');
      const heading = nativeElement.querySelector('#explore-title');

      expect(section?.getAttribute('aria-labelledby')).toBe('explore-title');

      expect(heading?.tagName).toBe('H2');
      expect(heading?.textContent?.trim()).toBeTruthy();
    });

    it('should provide accessible names for navigation links', () => {
      const links = nativeElement.querySelectorAll('article a');

      links.forEach((link) => {
        expect(link.textContent?.trim()).toBeTruthy();
        expect(link.getAttribute('href')).toBeTruthy();
      });
    });

    it('should hide decorative icons from assistive technologies', () => {
      const icons = nativeElement.querySelectorAll('article div[aria-hidden="true"]');

      expect(icons.length).toBe(2);

      icons.forEach((icon) => {
        expect(icon.querySelector('svg')).not.toBeNull();
      });
    });
  });
});
