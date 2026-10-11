import { ComponentFixture, TestBed } from '@angular/core/testing';

import { About } from './about';

describe('About', () => {
  let fixture: ComponentFixture<About>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [About],
    }).compileComponents();

    fixture = TestBed.createComponent(About);
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the project introduction and academic context', () => {
    expect(element.querySelectorAll('h1')).toHaveLength(1);
    expect(element.querySelector('h1')?.textContent?.trim()).toBe(
      'Exploring Colombia, through technology.',
    );
    const information = element.querySelector(
      'section[aria-label="Project and academic information"]',
    );

    expect(information?.textContent).toContain('About ColMaps');
    expect(information?.textContent).toContain('open geographic data');
    expect(information?.textContent).toContain('Academic context');
    expect(information?.textContent).toContain(
      'Slovak University of Technology in Bratislava (STU)',
    );
  });

  it('should render the author and academic supervisor', () => {
    const people = element.querySelector('section[aria-labelledby="people-title"]');

    expect(people?.textContent).toContain('Project author');
    expect(people?.textContent).toContain('Academic supervisor');
    expect(
      Array.from(people!.querySelectorAll('h3'), (heading) => heading.textContent?.trim()),
    ).toEqual(['Lucas Espitia', 'Mgr. Pavle Dakić, PhD.']);
  });

  it('should label each section with accessible text', () => {
    const sections = element.querySelectorAll('section');

    expect(sections).toHaveLength(4);
    for (const section of sections) {
      const labelledBy = section.getAttribute('aria-labelledby');

      if (labelledBy) {
        expect(section.querySelector(`[id="${labelledBy}"]`)?.textContent?.trim()).toBeTruthy();
      } else {
        expect(section.getAttribute('aria-label')?.trim()).toBeTruthy();
      }
    }
  });

  it('should open the faculty website safely in a new tab', () => {
    const link = element.querySelector<HTMLAnchorElement>('a[target="_blank"]');

    expect(link?.textContent?.trim()).toBe('Visit FIIT STU');
    expect(link?.getAttribute('href')).toBe('https://www.fiit.stuba.sk/en/');
    expect(link?.rel.split(/\s+/)).toEqual(expect.arrayContaining(['noopener', 'noreferrer']));
  });

  it('should provide an email link to contact the author', () => {
    const link = element.querySelector<HTMLAnchorElement>(
      'section[aria-labelledby="contact-title"] a',
    );

    expect(link?.textContent?.trim()).toBe('Contact the author');
    expect(link?.getAttribute('href')).toBe('mailto:xespitiacorredo@stuba.sk');
  });
});
