import { Component, input, output } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { MapCanvas } from './components/map-canvas/map-canvas';
import { PoiPreview } from './components/poi-preview/poi-preview';
import { MapComponent } from './map';
import type { PoiSelection } from './models/poi-selection';

@Component({ selector: 'app-map-canvas', template: '' })
class MapCanvasStub {
  readonly poiSelected = output<PoiSelection>();
}

@Component({ selector: 'app-poi-preview', template: '' })
class PoiPreviewStub {
  readonly poi = input.required<PoiSelection>();
  readonly closed = output<void>();
}

describe('MapComponent', () => {
  it('should show the selected POI preview and hide it when closed', () => {
    TestBed.configureTestingModule({ imports: [MapComponent] });
    TestBed.overrideComponent(MapComponent, {
      remove: { imports: [MapCanvas, PoiPreview] },
      add: { imports: [MapCanvasStub, PoiPreviewStub] },
    });

    const fixture = TestBed.createComponent(MapComponent);
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('h1')?.textContent).toBe('Explore Colombia');
    const canvases = fixture.debugElement.queryAll(By.directive(MapCanvasStub));
    expect(canvases).toHaveLength(1);
    expect(fixture.debugElement.query(By.directive(PoiPreviewStub))).toBeNull();

    const selection: PoiSelection = { id: 'N/123', name: 'Museo', category: 'museums_culture' };
    const canvas = canvases[0].componentInstance as MapCanvasStub;
    canvas.poiSelected.emit(selection);

    fixture.detectChanges();
    const preview = fixture.debugElement.query(By.directive(PoiPreviewStub))
      .componentInstance as PoiPreviewStub;
    expect(preview.poi()).toEqual(selection);

    preview.closed.emit();
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.directive(PoiPreviewStub))).toBeNull();
  });
});
