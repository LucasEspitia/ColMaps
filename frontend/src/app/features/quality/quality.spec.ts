import {
  ComponentFixture,
  DeferBlockBehavior,
  DeferBlockState,
  TestBed,
} from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NgControl } from '@angular/forms';
import { TuiSelectDirective } from '@taiga-ui/kit';
import { TuiDropdownOpen } from '@taiga-ui/core';
import { of, Subject } from 'rxjs';
import { vi } from 'vitest';

import { Quality } from './quality';
import { QualityService } from './data-access/quality.service';
import { QualityHistoryChart } from './components/quality-history-chart/quality-history-chart';

describe('Quality', () => {
  let fixture: ComponentFixture<Quality>;

  beforeEach(async () => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe = vi.fn();
        unobserve = vi.fn();
        disconnect = vi.fn();
      },
    );
    await TestBed.configureTestingModule({
      deferBlockBehavior: DeferBlockBehavior.Manual,
      imports: [Quality],
      providers: [
        {
          provide: QualityService,
          useValue: {
            getSummary: () =>
              of({
                totalRuns: 0,
                latestRun: null,
                metrics: [],
              }),
            getHistory: () =>
              of({
                metric: 'performance',
                device: 'mobile',
                page: null,
                points: [],
              }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Quality);
    await fixture.whenStable();
  });

  afterEach(() => vi.unstubAllGlobals());

  it('keeps the focused filter mounted while its new summary loads', async () => {
    const response = new Subject<{ totalRuns: number; latestRun: null; metrics: [] }>();
    vi.spyOn(TestBed.inject(QualityService), 'getSummary').mockReturnValue(response);
    const page = fixture.debugElement.query(By.css('#quality-page'));
    const element: HTMLInputElement = page.nativeElement;
    element.focus();
    page.injector.get(TuiSelectDirective).setValue('home');
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('#quality-page')).toBe(element);
    expect(document.activeElement).toBe(element);

    response.next({ totalRuns: 1, latestRun: null, metrics: [] });
    await fixture.whenStable();
    expect(document.activeElement).toBe(element);
  });

  it('opens a focused dropdown with Enter', async () => {
    const page = fixture.debugElement.query(By.css('#quality-page'));
    const open = vi
      .spyOn(page.injector.get(TuiDropdownOpen).open, 'set')
      .mockImplementation(() => undefined);
    page.nativeElement.focus();
    page.nativeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await fixture.whenStable();
    expect(open).toHaveBeenCalledWith(true);
  });

  it('applies global page and device filters to the summary and history', async () => {
    const service = TestBed.inject(QualityService);
    const getSummary = vi.spyOn(service, 'getSummary');
    const getHistory = vi.spyOn(service, 'getHistory');

    const page = fixture.debugElement.query(By.css('#quality-page'));
    page.injector.get(TuiSelectDirective).setValue('home');
    await fixture.whenStable();
    expect(getSummary).toHaveBeenLastCalledWith('home', 'mobile');

    const device = fixture.debugElement.query(By.css('#quality-device'));
    device.injector.get(TuiSelectDirective).setValue('desktop');
    await fixture.whenStable();
    expect(getSummary).toHaveBeenLastCalledWith('home', 'desktop');

    const [history] = await fixture.getDeferBlocks();
    await history.render(DeferBlockState.Complete);
    await fixture.whenStable();
    expect(getHistory).toHaveBeenLastCalledWith('performance', 'desktop', 'home');
  });

  it('loads the deferred history component with the real Taiga chart', async () => {
    vi.spyOn(TestBed.inject(QualityService), 'getHistory').mockReturnValue(
      of({
        metric: 'performance',
        device: 'mobile',
        page: null,
        points: [
          {
            runId: 'run-1',
            value: 75,
            unit: 'score',
            target: null,
            page: null,
            startedAt: '2026-10-25T12:00:00Z',
            commitSha: null,
          },
        ],
      }),
    );

    const [history] = await fixture.getDeferBlocks();
    await history.render(DeferBlockState.Complete);
    await fixture.whenStable();

    const child: HTMLElement = fixture.nativeElement.querySelector('app-quality-history-chart');
    expect(child.querySelector('tui-line-chart svg')).not.toBeNull();
    const chart = fixture.debugElement.query(By.directive(QualityHistoryChart));
    expect(chart.componentInstance.latest()?.value).toBe(75);
    expect(TestBed.inject(QualityService).getHistory).toHaveBeenCalledWith(
      'performance',
      'mobile',
      'map',
    );
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
