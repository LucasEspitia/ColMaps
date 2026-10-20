import { Component, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, startWith, switchMap } from 'rxjs';

import { MapCanvas } from './components/map-canvas/map-canvas';
import { PoiPreview } from './components/poi-preview/poi-preview';

import type { PoiDetailState } from './models/poi-detail-state';
import { PoiSelection } from './models/poi-selection';

import { PoiService } from './data-access/poi.service';

@Component({
  selector: 'app-map',
  imports: [MapCanvas, PoiPreview],
  templateUrl: './map.html',
})
export class MapComponent {
  private readonly poiService = inject(PoiService);

  protected readonly selectedPoi = signal<PoiSelection | null>(null);

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

  protected onPoiSelected(poi: PoiSelection): void {
    this.selectedPoi.set(poi);
  }

  protected closePoiPreview(): void {
    this.selectedPoi.set(null);
  }
}
