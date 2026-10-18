import { Component } from '@angular/core';
import { MapCanvas } from './components/map-canvas/map-canvas';

@Component({
  selector: 'app-map',
  imports: [MapCanvas],
  templateUrl: './map.html',
})
export class MapComponent {}
