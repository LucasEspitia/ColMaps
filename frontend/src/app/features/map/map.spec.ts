import { Component, output } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { MapCanvas } from './components/map-canvas/map-canvas';
import { MapComponent } from './map';
import type { PoiSelection } from './models/poi-selection';

@Component({ selector: 'app-map-canvas', template: '' })
class MapCanvasStub {
  readonly poiSelected = output<PoiSelection>();
}

describe('MapComponent', () => {
  it('should compose the page and store the POI selected by the canvas', () => {
    TestBed.configureTestingModule({ imports: [MapComponent] });
    TestBed.overrideComponent(MapComponent, {
      remove: { imports: [MapCanvas] },
      add: { imports: [MapCanvasStub] },
    });

    const fixture = TestBed.createComponent(MapComponent);
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('h1')?.textContent).toBe('Explore Colombia');
    const canvases = fixture.debugElement.queryAll(By.directive(MapCanvasStub));
    expect(canvases).toHaveLength(1);
    expect(fixture.componentInstance['selectedPoi']()).toBeNull();

    const selection: PoiSelection = { id: 'N/123', name: 'Museo', category: 'museums_culture' };
    const canvas = canvases[0].componentInstance as MapCanvasStub;
    canvas.poiSelected.emit(selection);

    expect(fixture.componentInstance['selectedPoi']()).toEqual(selection);
  });
});
