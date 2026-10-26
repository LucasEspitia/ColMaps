import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { TuiCardLarge } from '@taiga-ui/layout';
import { TuiLoader, TuiIcon, TuiTextfield } from '@taiga-ui/core';
import { TuiChevron, TuiDataListWrapper, TuiSelect } from '@taiga-ui/kit';

import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { combineLatest, catchError, map, of, startWith, switchMap } from 'rxjs';

import { QualityService } from './data-access/quality.service';
import { QualityState } from './models/quality-summary-state';
import {
  QualitySummary,
  QUALITY_PAGES,
  QUALITY_DEVICES,
  type QualityPage,
  type QualityDevice,
} from './data-access/quality.types';

import { QualityHistoryChart } from './components/quality-history-chart/quality-history-chart';

@Component({
  selector: 'app-quality',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    TuiIcon,
    TuiLoader,
    TuiTextfield,
    TuiChevron,
    TuiSelect,
    TuiDataListWrapper,
    TuiCardLarge,
    QualityHistoryChart,
  ],
  templateUrl: './quality.html',
  styleUrl: './quality.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Quality {
  private readonly qualityService = inject(QualityService);

  protected readonly overviewOptions = ['Total executions', 'Measurements', 'Latest execution'];

  protected readonly lighthouseOptions = ['Performance', 'Accessibility', 'SEO', 'Best Practices'];

  protected readonly vitalOptions = ['LCP', 'CLS', 'INP'];

  protected readonly overviewControl = new FormControl('Total executions', { nonNullable: true });

  protected readonly lighthouseControl = new FormControl('Performance', { nonNullable: true });

  protected readonly vitalControl = new FormControl('LCP', { nonNullable: true });

  protected readonly page = signal<QualityPage>('map');

  protected readonly pageOptions = QUALITY_PAGES;

  protected readonly stringifyPage = (value: QualityPage): string => {
    const labels: Record<QualityPage, string> = {
      home: 'Home',
      map: 'Map',
      search: 'Search',
      quality: 'Quality',
      about: 'About',
    };

    return labels[value];
  };

  protected readonly device = signal<QualityDevice>('mobile');

  protected readonly deviceOptions = QUALITY_DEVICES;

  protected readonly stringifyDevice = (value: QualityDevice): string =>
    value === 'desktop' ? 'Desktop' : 'Mobile';

  // Signals notify the OnPush view for dropdown selection and programmatic form updates.
  protected readonly overviewSelection = toSignal(this.overviewControl.valueChanges, {
    initialValue: this.overviewControl.value,
  });

  protected readonly lighthouseSelection = toSignal(this.lighthouseControl.valueChanges, {
    initialValue: this.lighthouseControl.value,
  });

  protected readonly vitalSelection = toSignal(this.vitalControl.valueChanges, {
    initialValue: this.vitalControl.value,
  });

  protected readonly lighthouseMetrics = [
    { key: 'performance', label: 'Performance', icon: '@tui.gauge' },
    { key: 'accessibility', label: 'Accessibility', icon: '@tui.accessibility' },
    { key: 'seo', label: 'SEO', icon: '@tui.search' },
    { key: 'best-practices', label: 'Best Practices', icon: '@tui.shield-check' },
  ] as const;

  protected readonly webVitals = [
    { key: 'lcp', label: 'LCP', target: '≤ 2.5 s', icon: '@tui.clock' },
    { key: 'cls', label: 'CLS', target: '≤ 0.1', icon: '@tui.layers' },
    { key: 'inp', label: 'INP', target: '≤ 200 ms', icon: '@tui.mouse-pointer-2' },
  ] as const;

  protected readonly state = toSignal(
    combineLatest([toObservable(this.page), toObservable(this.device)]).pipe(
      switchMap(([page, device]) =>
        this.qualityService.getSummary(page, device).pipe(
          map((data): QualityState => ({
            status: 'success',
            data,
          })),
          startWith<QualityState>({ status: 'loading' }),
          catchError(() => of<QualityState>({ status: 'error' })),
        ),
      ),
    ),
    {
      initialValue: { status: 'loading' } as QualityState,
    },
  );

  protected getMetric(data: QualitySummary, key: string) {
    return data.metrics.find((metric) => metric.metric === key) ?? null;
  }
}
