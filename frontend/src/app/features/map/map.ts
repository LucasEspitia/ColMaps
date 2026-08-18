import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  PLATFORM_ID,
  ViewChild,
} from '@angular/core';

import { Map, setWorkerUrl } from 'maplibre-gl';

@Component({
  selector: 'app-map',
  imports: [],
  templateUrl: './map.html',
})
export class MapComponent implements AfterViewInit {
  @ViewChild('mapContainer')
  private mapContainer!: ElementRef<HTMLElement>;

  private map?: Map;

  constructor(
    @Inject(PLATFORM_ID)
    private readonly platformId: object,
  ) {}

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    setWorkerUrl('/maplibre/maplibre-gl-worker.mjs');

    this.map = new Map({
      container: this.mapContainer.nativeElement,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [-74.0721, 4.711],
      zoom: 4,
    });
  }
}
