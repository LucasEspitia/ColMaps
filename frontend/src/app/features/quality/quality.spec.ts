import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Quality } from './quality';
import { By } from '@angular/platform-browser';
import { NgControl } from '@angular/forms';
import { of } from 'rxjs';
import { TuiSelectDirective } from '@taiga-ui/kit';
import { QualityService } from './data-access/quality.service';

describe('Quality', () => {
  let component: Quality;
  let fixture: ComponentFixture<Quality>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Quality],
      providers: [
        {
          provide: QualityService,
          useValue: {
            getSummary: () => of({ totalRuns: 0, latestRun: null, metrics: [] }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Quality);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  for (const [label, options] of [
    ['Overview metric', ['Total executions', 'Measurements', 'Latest execution']],
    ['Lighthouse metric', ['Performance', 'Accessibility', 'SEO', 'Best Practices']],
    ['Core Web Vital', ['LCP', 'CLS', 'INP']],
  ] as const) {
    it(`switches each ${label} option and preserves desktop cards`, async () => {
      const input = fixture.debugElement.query(By.css(`input[aria-label="${label}"]`));
      const control = input.injector.get(NgControl).control!;
      const select = input.injector.get(TuiSelectDirective);
      const section: HTMLElement = input.nativeElement.closest('section');
      for (const option of options) {
        select.setValue(option);
        await fixture.whenStable();
        expect(control.value).toBe(option);
        const cards = Array.from(section.querySelectorAll('article'));
        expect(cards).toHaveLength(options.length);
        const visible = cards.filter(
          (card) => !card.parentElement!.classList.contains('max-sm:hidden'),
        );
        expect(visible).toHaveLength(1);
        expect(visible[0].querySelector('h3')!.textContent!.trim()).toBe(option);
      }
    });
  }
});
