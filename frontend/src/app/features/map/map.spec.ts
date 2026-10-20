import { Component, input, output } from '@angular/core';
import { Subject } from 'rxjs';
import { PoiService } from './data-access/poi.service';
import type { PoiDetail } from './data-access/poi.types';
import type { PoiDetailState } from './models/poi-detail-state';
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
  readonly detailState = input.required<PoiDetailState>();
  readonly closed = output<void>();
}

describe('MapComponent', () => {
  const getById = vi.fn<PoiService['getById']>();

  beforeEach(() => {
    getById.mockReset();
    getById.mockReturnValue(new Subject<PoiDetail>());
    TestBed.configureTestingModule({
      imports: [MapComponent],
      providers: [{ provide: PoiService, useValue: { getById } }],
    });
    TestBed.overrideComponent(MapComponent, {
      remove: { imports: [MapCanvas, PoiPreview] },
      add: { imports: [MapCanvasStub, PoiPreviewStub] },
    });
  });

  it('should show the selected POI preview and reset selection and state when closed', () => {
    const response = new Subject<PoiDetail>();
    getById.mockReturnValue(response);
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
    expect(preview.detailState()).toEqual({ status: 'loading' });

    preview.closed.emit();
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.directive(PoiPreviewStub))).toBeNull();
    expect(fixture.componentInstance['selectedPoi']()).toBeNull();
    expect(fixture.componentInstance['poiDetailState']()).toEqual({ status: 'idle' });
    expect(response.observed).toBe(false);
  });

  it('should ignore the previous response after selecting a different POI', () => {
    const first = new Subject<PoiDetail>();
    const second = new Subject<PoiDetail>();
    getById.mockReturnValueOnce(first).mockReturnValueOnce(second);
    const fixture = TestBed.createComponent(MapComponent);
    fixture.detectChanges();
    const canvas = fixture.debugElement.query(By.directive(MapCanvasStub))
      .componentInstance as MapCanvasStub;
    const selection: PoiSelection = { id: 'N/1', name: 'First', category: 'museums_culture' };
    canvas.poiSelected.emit(selection);
    fixture.detectChanges();
    canvas.poiSelected.emit({ ...selection, id: 'N/2', name: 'Second' });
    fixture.detectChanges();

    expect(getById.mock.calls).toEqual([['N/1'], ['N/2']]);
    expect(first.observed).toBe(false);
    const detail: PoiDetail = {
      id: 'N/1',
      name: 'First',
      category: 'museums_culture',
      categories: ['museums_culture'],
      subcategory: 'museum',
      coordinates: [-74, 4],
    };
    first.next(detail);
    fixture.detectChanges();
    const preview = fixture.debugElement.query(By.directive(PoiPreviewStub))
      .componentInstance as PoiPreviewStub;
    expect(preview.poi().id).toBe('N/2');
    expect(preview.detailState()).toEqual({ status: 'loading' });

    const latest = { ...detail, id: 'N/2', name: 'Second' };
    second.next(latest);
    fixture.detectChanges();
    expect(preview.detailState()).toEqual({ status: 'success', data: latest });
  });
});
