import { Component, inject, signal, computed } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

import { MapCanvas } from './components/map-canvas/map-canvas';
import { PoiPreview } from './components/poi-preview/poi-preview';
import { MapToolbar } from './components/map-toolbar/map-toolbar';

import { parseCategoryQuery } from '../../shared/poi/category-query';
import type { FeatureCategory } from '../../shared/poi/feature-category';
import type { PoiDetailState } from './models/poi-detail-state';
import { PoiSelection } from './models/poi-selection';

import { PoiService } from './data-access/poi.service';

@Component({
  selector: 'app-map',
  imports: [MapCanvas, PoiPreview, MapToolbar],
  templateUrl: './map.html',
  host: {
    class: 'block h-full min-h-0 w-full',
  },
})
export class MapComponent {
  private readonly poiService = inject(PoiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly selectedPoi = signal<PoiSelection | null>(null);

  readonly selectedCategories = computed(() =>
    parseCategoryQuery(this.queryParamMap().get('categories')),
  );

  protected readonly poiDetailState = toSignal(
    toObservable(this.selectedPoi).pipe(
      switchMap((poi) => {
        if (!poi) {
          return of<PoiDetailState>({ status: 'idle' });
        }

        return this.poiService.getById(poi.id).pipe(
          map((data): PoiDetailState => ({
            status: 'success',
            data,
          })),
          startWith<PoiDetailState>({ status: 'loading' }),
          catchError(() => of<PoiDetailState>({ status: 'error' })),
        );
      }),
    ),
    { initialValue: { status: 'idle' } as PoiDetailState },
  );

  private readonly queryParamMap = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  protected onPoiSelected(poi: PoiSelection): void {
    this.selectedPoi.set(poi);
  }

  protected closePoiPreview(): void {
    this.selectedPoi.set(null);
  }

  protected onCategoriesChanged(categories: FeatureCategory[]): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        categories: categories.length ? categories.join(',') : null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
