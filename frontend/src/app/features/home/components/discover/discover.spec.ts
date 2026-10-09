import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DiscoverComponent } from './discover';

describe('DiscoverComponent', () => {
  let component: DiscoverComponent;
  let fixture: ComponentFixture<DiscoverComponent>;
  let nativeElement: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiscoverComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DiscoverComponent);
    component = fixture.componentInstance;
    nativeElement = fixture.nativeElement as HTMLElement;

    fixture.detectChanges();
    await fixture.whenStable();
  });

  describe('Initialization', () => {
    it('should create successfully', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize four categories', () => {
      expect(component.categories).toHaveLength(4);
    });
  });

  describe('Rendering', () => {
    it('should render one card per category', () => {
      const cards = nativeElement.querySelectorAll('article[tuiCardLarge]');

      expect(cards.length).toBe(component.categories.length);
    });

    it('should render category titles and descriptions', () => {
      const cards = nativeElement.querySelectorAll('article[tuiCardLarge]');

      cards.forEach((card, index) => {
        const title = card.querySelector('h3');
        const description = card.querySelector('p');

        expect(title?.textContent?.trim()).toBe(component.categories[index].title);

        expect(description?.textContent?.trim()).toBe(component.categories[index].description);
      });
    });

    it('should render the correct images', () => {
      const images = nativeElement.querySelectorAll('article img');

      expect(images.length).toBe(component.categories.length);

      images.forEach((image, index) => {
        const category = component.categories[index];

        expect(image.getAttribute('src')).toBe(`/images/discover/${category.image}-640.webp`);
      });
    });

    it('should generate responsive image sources', () => {
      const sources = nativeElement.querySelectorAll('article picture source');

      expect(sources.length).toBe(component.categories.length);

      sources.forEach((source, index) => {
        const image = component.categories[index].image;
        const srcset = source.getAttribute('srcset');

        expect(srcset).toContain(`${image}-320.webp 320w`);
        expect(srcset).toContain(`${image}-640.webp 640w`);
        expect(srcset).toContain(`${image}-960.webp 960w`);
      });
    });
  });

  describe('Accessibility', () => {
    it('should associate the section with its heading', () => {
      const section = nativeElement.querySelector('section');
      const heading = nativeElement.querySelector('#discover-title');

      expect(section?.getAttribute('aria-labelledby')).toBe('discover-title');

      expect(heading?.tagName).toBe('H2');
    });

    it('should provide alternative text for every image', () => {
      const images = nativeElement.querySelectorAll('article img');

      images.forEach((image, index) => {
        expect(image.getAttribute('alt')).toBe(component.categories[index].alt);

        expect(image.getAttribute('alt')?.trim()).toBeTruthy();
      });
    });

    it('should lazy load all category images', () => {
      const images = nativeElement.querySelectorAll('article img');

      images.forEach((image) => {
        expect(image.getAttribute('loading')).toBe('lazy');
      });
    });
  });
});
