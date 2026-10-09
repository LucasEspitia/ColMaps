import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { HighlightsComponent } from './highlights';

describe('HighlightsComponent', () => {
  let component: HighlightsComponent;
  let fixture: ComponentFixture<HighlightsComponent>;
  let nativeElement: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HighlightsComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(HighlightsComponent);
    component = fixture.componentInstance;
    nativeElement = fixture.nativeElement as HTMLElement;

    fixture.detectChanges();
    await fixture.whenStable();
  });

  describe('Initialization', () => {
    it('should create successfully', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize three highlights', () => {
      expect(component.highlights).toHaveLength(3);
    });
  });

  describe('Rendering', () => {
    it('should render one card per highlight', () => {
      const cards = nativeElement.querySelectorAll('article');

      expect(cards.length).toBe(component.highlights.length);
    });

    it('should render highlight titles and descriptions', () => {
      const cards = nativeElement.querySelectorAll('article');

      cards.forEach((card, index) => {
        const title = card.querySelector('h3');
        const description = card.querySelector('p');

        expect(title?.textContent?.trim()).toBe(component.highlights[index].title);

        expect(description?.textContent?.trim()).toBe(component.highlights[index].description);
      });
    });

    it('should render an icon for each highlight', () => {
      const cards = nativeElement.querySelectorAll('article');

      cards.forEach((card) => {
        const icon = card.querySelector('tui-icon');

        expect(icon).not.toBeNull();
      });
    });

    it('should contain valid highlight data', () => {
      component.highlights.forEach((highlight) => {
        expect(highlight.title.trim()).not.toBe('');
        expect(highlight.description.trim()).not.toBe('');
        expect(highlight.icon.trim()).not.toBe('');
      });
    });

    it('should render the final call to action', () => {
      const headings = Array.from(nativeElement.querySelectorAll('h2'));

      const ctaHeading = headings.find(
        (heading) => heading.textContent?.trim() === 'Your journey starts here.',
      );

      expect(ctaHeading).toBeDefined();
    });
  });

  describe('Navigation', () => {
    it('should provide a link to the search page', () => {
      const searchLink = nativeElement.querySelector('a[href="/search"]');

      expect(searchLink).not.toBeNull();
      expect(searchLink?.textContent?.trim()).toBe('Start Exploring');
    });
  });

  describe('Accessibility', () => {
    it('should associate the section with its heading', () => {
      const section = nativeElement.querySelector('section');
      const heading = nativeElement.querySelector('#highlights-title');

      expect(section?.getAttribute('aria-labelledby')).toBe('highlights-title');

      expect(heading?.tagName).toBe('H2');
      expect(heading?.textContent?.trim()).toBeTruthy();
    });

    it('should hide decorative icons from assistive technologies', () => {
      const cards = nativeElement.querySelectorAll('article');

      cards.forEach((card) => {
        const iconContainer = card.querySelector('[aria-hidden="true"]');

        expect(iconContainer).not.toBeNull();
        expect(iconContainer?.querySelector('tui-icon')).not.toBeNull();
      });
    });
  });
});
