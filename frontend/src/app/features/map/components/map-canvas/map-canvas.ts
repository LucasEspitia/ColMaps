import {
  afterNextRender,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  NgZone,
  viewChild,
} from '@angular/core';

import { GeoJSONSource, Map, setWorkerUrl } from 'maplibre-gl';
import { Subscription } from 'rxjs';

import { PoiService } from '../../data-access/poi.service';
import type { Bbox } from '../../data-access/poi.types';

@Component({
  selector: 'app-map-canvas',
  templateUrl: './map-canvas.html',
  host: {
    class: 'block h-full w-full',
  },
})
export class MapCanvas {
  private readonly destroyRef = inject(DestroyRef);
  private readonly zone = inject(NgZone);
  private readonly poiService = inject(PoiService);

  private readonly mapContainer = viewChild.required<ElementRef<HTMLElement>>('mapContainer');

  private map?: Map;
  private poiRequest?: Subscription;

  constructor() {
    afterNextRender({
      write: () => {
        setWorkerUrl('/maplibre/maplibre-gl-worker.mjs');

        this.zone.runOutsideAngular(() => {
          this.initializeMap();
        });
      },
    });

    this.destroyRef.onDestroy(() => {
      this.poiRequest?.unsubscribe();
      this.map?.remove();
    });
  }

  private initializeMap(): void {
    this.map = new Map({
      container: this.mapContainer().nativeElement,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [-74.0721, 4.711],
      zoom: 4,
    });

    this.map.on('load', () => {
      this.initializePoiLayer();
      this.loadPois();
    });

    this.map.on('moveend', () => {
      this.loadPois();
    });
  }

  private initializePoiLayer(): void {
    if (!this.map) return;

    this.map.addSource('pois', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
    });

    this.map.addLayer({
      id: 'poi-points',
      type: 'circle',
      source: 'pois',
      paint: {
        'circle-radius': 6,
        'circle-color': '#167c80',
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 1.5,
      },
    });
  }

  private loadPois(): void {
    if (!this.map?.getSource('pois')) return;

    const bounds = this.map.getBounds();

    const bbox: Bbox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];

    this.poiRequest?.unsubscribe();

    this.poiRequest = this.poiService.getWithin(bbox).subscribe({
      next: (collection) => {
        const source = this.map?.getSource('pois');

        if (source instanceof GeoJSONSource) {
          void source.setData(collection).catch((error: unknown) => {
            console.error('Failed to update POI layer:', error);
          });
        }
      },
      error: (error: unknown) => {
        console.error('Failed to fetch POIs:', error);
      },
    });
  }
}
