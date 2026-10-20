import { Component, signal } from '@angular/core';
import { MapCanvas } from './components/map-canvas/map-canvas';

import { PoiSelection } from './models/poi-selection';

@Component({
  selector: 'app-map',
  imports: [MapCanvas],
  templateUrl: './map.html',
})
export class MapComponent {
  protected readonly selectedPoi = signal<PoiSelection | null>(null);

  protected onPoiSelected(poi: PoiSelection): void {
    this.selectedPoi.set(poi);
  }
}
