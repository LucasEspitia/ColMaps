import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { TuiLineChart, TuiAxes, TuiChartHint } from '@taiga-ui/addon-charts';
import { TuiTextfield } from '@taiga-ui/core';
import { TuiChevron, TuiDataListWrapper, TuiSelect } from '@taiga-ui/kit';
import { combineLatest, of } from 'rxjs';
import { catchError, map, startWith, switchMap } from 'rxjs/operators';

import { QualityService } from '../../data-access/quality.service';
import { QualitySelectKeyboard } from '../../quality-select-keyboard';
import type { QualityHistory, QualityPage, QualityDevice } from '../../data-access/quality.types';

type HistoryState =
  { status: 'loading' } | { status: 'error' } | { status: 'success'; data: QualityHistory };

@Component({
  selector: 'app-quality-history-chart',
  imports: [
    DatePipe,
    FormsModule,
    TuiLineChart,
    TuiChartHint,
    TuiAxes,
    TuiTextfield,
    TuiChevron,
    TuiDataListWrapper,
    TuiSelect,
    QualitySelectKeyboard,
  ],
  styleUrl: './quality-history-chart.css',
  templateUrl: './quality-history-chart.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QualityHistoryChart {
  private readonly qualityService = inject(QualityService);

  readonly page = input.required<QualityPage>();
  readonly device = input.required<QualityDevice>();
  readonly metric = signal('performance');

  readonly metrics = [
    { value: 'performance', label: 'Performance' },
    { value: 'accessibility', label: 'Accessibility' },
    { value: 'seo', label: 'SEO' },
    { value: 'best-practices', label: 'Best Practices' },
    { value: 'lcp', label: 'LCP' },
    { value: 'cls', label: 'CLS' },
    { value: 'inp', label: 'INP' },
  ];

  readonly metricOptions = this.metrics.map(({ value }) => value);
  readonly stringifyMetric = (value: string): string =>
    this.metrics.find((option) => option.value === value)?.label ?? value;

  readonly chartWidth = 600;
  readonly chartHeight = 450;

  readonly history = toSignal(
    combineLatest([
      toObservable(this.metric),
      toObservable(this.device),
      toObservable(this.page),
    ]).pipe(
      switchMap(([metric, device, page]) =>
        this.qualityService.getHistory(metric, device, page).pipe(
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

  readonly axisXLabels = computed(() => {
    const points = this.points();

    if (!points.length) {
      return [];
    }

    return Array.from({ length: 5 }, (_, index) => {
      const pointIndex = Math.round((index / 4) * (points.length - 1));

      return new Date(points[pointIndex].startedAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        timeZone: 'UTC',
      });
    });
  });

  readonly axisYLabels = computed(() => {
    const { min, max } = this.range();
    const metric = this.metric();

    return Array.from({ length: 5 }, (_, index) => {
      const value = min + (index / 4) * (max - min);

      if (metric === 'lcp' || metric === 'inp') {
        return `${(value / 1000).toFixed(2)} s`;
      }

      if (metric === 'cls') {
        return value.toFixed(3);
      }

      return value.toFixed(0);
    });
  });

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
    const width = this.chartWidth;
    const height = this.chartHeight;

    return points.map((point, index) => {
      const x = points.length === 1 ? width / 2 : (index / (points.length - 1)) * width;

      const y = ((point.value - min) / (max - min)) * height;

      return [x, y];
    });
  });
}
