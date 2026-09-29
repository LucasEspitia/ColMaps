import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
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

  private readonly platformId = inject(PLATFORM_ID);

  
  @ViewChild('mapContainer')
  private mapContainer!: ElementRef<HTMLElement>;

  private map?: Map;
  
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
