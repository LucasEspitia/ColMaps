import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TuiSelectDirective } from '@taiga-ui/kit';
import { TuiLineChart } from '@taiga-ui/addon-charts/components/line-chart';
import { Subject } from 'rxjs';
import { vi } from 'vitest';

import { QualityService } from '../../data-access/quality.service';
import type { QualityHistory } from '../../data-access/quality.types';
import { QualityHistoryChart } from './quality-history-chart';

describe('QualityHistoryChart', () => {
  let fixture: ComponentFixture<QualityHistoryChart>;
  let response: Subject<QualityHistory>;
  let getHistory: ReturnType<typeof vi.fn>;

  const history = (values: number[]): QualityHistory => ({
    metric: 'performance',
    device: 'mobile',
    page: null,
    points: values.map((value, index) => ({
      runId: String(index),
      value,
      unit: 'score',
      target: null,
      page: null,
      startedAt: `2026-10-${String(index + 1).padStart(2, '0')}T00:00:00Z`,
      commitSha: null,
    })),
  });

  beforeEach(async () => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe = vi.fn();
        unobserve = vi.fn();
        disconnect = vi.fn();
      },
    );

    response = new Subject<QualityHistory>();
    getHistory = vi.fn(() => response.asObservable());

    await TestBed.configureTestingModule({
      imports: [QualityHistoryChart],
      providers: [
        {
          provide: QualityService,
          useValue: { getHistory },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(QualityHistoryChart);
    fixture.componentRef.setInput('page', 'map');
    fixture.componentRef.setInput('device', 'mobile');
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows loading followed by an empty state', async () => {
    expect(getHistory).toHaveBeenCalledWith('performance', 'mobile', 'map');
    expect(fixture.nativeElement.querySelector('#history-metric').value).toBe('Performance');

    expect(fixture.nativeElement.querySelector('[role="status"]')).not.toBeNull();

    response.next(history([]));
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('No measurements available yet');

    expect(fixture.debugElement.query(By.directive(TuiLineChart))).toBeNull();
  });

  it('renders points in chronological order', async () => {
    const data = history([20, 80]);
    data.points.reverse();

    response.next(data);
    await fixture.whenStable();

    const points = fixture.componentInstance.chartPoints();

    expect(points).toHaveLength(2);

    // The component must sort the input chronologically.
    expect(points[0][0]).toBe(0);
    expect(points[1][0]).toBe(600);

    // Higher values must have higher chart coordinates.
    expect(points[1][1]).toBeGreaterThan(points[0][1]);

    // Check our Angular binding, not Taiga UI's SVG internals.
    const chart = fixture.debugElement.query(By.directive(TuiLineChart));

    expect(chart).not.toBeNull();

    const chartInstance: TuiLineChart = chart.componentInstance;

    expect(chartInstance.value()).toEqual(points);
    expect(chartInstance.dots()).toBe(true);

    expect(fixture.nativeElement.textContent).toContain('Latest: 80 score');

    // Input data should not be mutated by the component.
    expect(data.points[0].value).toBe(80);
  });

  it('reloads history when the parent changes the page', async () => {
    const previous = response;
    response = new Subject<QualityHistory>();
    fixture.componentRef.setInput('page', 'home');
    await fixture.whenStable();

    expect(getHistory).toHaveBeenLastCalledWith('performance', 'mobile', 'home');
    previous.next(history([99]));
    expect(fixture.componentInstance.history().status).toBe('loading');

    response.next(history([25]));
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Latest: 25 score');
  });

  it.each([[0], [50, 50]])(
    'renders finite coordinates for constant values %j',
    async (...values) => {
      response.next(history(values));
      await fixture.whenStable();

      const points = fixture.componentInstance.chartPoints();

      expect(points.flat().every(Number.isFinite)).toBe(true);

      if (values.length === 1) {
        expect(points[0][0]).toBe(300);
      }
    },
  );

  it('recovers from an error when filters change', async () => {
    response.error(new Error('Network failure'));
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();

    response = new Subject<QualityHistory>();

    const metric = fixture.debugElement.query(By.css('#history-metric'));
    metric.injector.get(TuiSelectDirective).setValue('best-practices');

    await fixture.whenStable();

    expect(getHistory).toHaveBeenLastCalledWith('best-practices', 'mobile', 'map');
    expect(metric.nativeElement.value).toBe('Best Practices');

    expect(fixture.nativeElement.querySelector('[role="status"]')).not.toBeNull();

    const previous = response;
    response = new Subject<QualityHistory>();

    fixture.componentRef.setInput('device', 'desktop');

    await fixture.whenStable();

    expect(getHistory).toHaveBeenLastCalledWith('best-practices', 'desktop', 'map');

    // A superseded request must not overwrite current state.
    previous.next(history([99]));

    expect(fixture.componentInstance.history().status).toBe('loading');

    response.next(history([10]));
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('[role="img"]').getAttribute('aria-label')).toBe(
      'Evolution of best-practices on desktop',
    );
  });
});
