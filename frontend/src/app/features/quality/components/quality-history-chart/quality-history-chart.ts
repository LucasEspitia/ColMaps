import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  computed,
  DestroyRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';

import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { TuiLineChart } from '@taiga-ui/addon-charts';
import { combineLatest, of } from 'rxjs';
import { catchError, map, startWith, switchMap } from 'rxjs/operators';

import { QualityService } from '../../data-access/quality.service';
import type { QualityHistory } from '../../data-access/quality.types';

type HistoryState =
  { status: 'loading' } | { status: 'error' } | { status: 'success'; data: QualityHistory };

@Component({
  selector: 'app-quality-history-chart',
  imports: [TuiLineChart],
  templateUrl: './quality-history-chart.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QualityHistoryChart {
  private readonly qualityService = inject(QualityService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly container = viewChild.required<ElementRef<HTMLElement>>('chartContainer');

  readonly metric = signal('performance');
  readonly device = signal('mobile');

  readonly metrics = [
    { value: 'performance', label: 'Performance' },
    { value: 'accessibility', label: 'Accessibility' },
    { value: 'seo', label: 'SEO' },
    { value: 'best-practices', label: 'Best Practices' },
    { value: 'lcp', label: 'LCP' },
    { value: 'cls', label: 'CLS' },
    { value: 'inp', label: 'INP' },
  ];

  readonly chartWidth = signal(600);
  readonly chartHeight = 200;

  readonly history = toSignal(
    combineLatest([toObservable(this.metric), toObservable(this.device)]).pipe(
      switchMap(([metric, device]) =>
        this.qualityService.getHistory(metric, device).pipe(
          map((data): HistoryState => ({
            status: 'success',
            data,
          })),
          startWith<HistoryState>({ status: 'loading' }),
          catchError(() => of<HistoryState>({ status: 'error' })),
        ),
      ),
    ),
    {
      initialValue: { status: 'loading' } as HistoryState,
    },
  );

  readonly points = computed(() => {
    const state = this.history();

    if (state.status !== 'success') {
      return [];
    }

    return [...state.data.points].sort(
      (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime(),
    );
  });

  readonly latest = computed(() => this.points().at(-1) ?? null);

  readonly range = computed(() => {
    const values = this.points().map((point) => point.value);

    if (!values.length) {
      return { min: 0, max: 1 };
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min || Math.abs(max) || 1) * 0.1;

    return {
      min: min - padding,
      max: max + padding,
    };
  });

  readonly chartPoints = computed<[number, number][]>(() => {
    const points = this.points();
    const { min, max } = this.range();
    const width = this.chartWidth();
    const height = this.chartHeight;

    return points.map((point, index) => {
      const x = points.length === 1 ? width / 2 : (index / (points.length - 1)) * width;

      const y = ((point.value - min) / (max - min)) * height;

      return [x, y];
    });
  });

  constructor() {
    afterNextRender(() => {
      const element = this.container().nativeElement;

      const observer = new ResizeObserver(([entry]) => {
        if (entry) {
          this.chartWidth.set(Math.max(1, Math.floor(entry.contentRect.width)));
        }
      });

      observer.observe(element);

      this.destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  setMetric(value: string): void {
    this.metric.set(value);
  }

  setDevice(value: string): void {
    this.device.set(value);
  }
}
