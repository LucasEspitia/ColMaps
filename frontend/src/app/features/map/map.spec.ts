import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, Subject } from 'rxjs';
import { GeoJSONSource, Map, setWorkerUrl } from 'maplibre-gl';

import { MapComponent } from './map';
import { PoiService } from './data-access/poi.service';
import type { PoiFeatureCollection } from './data-access/poi.types';

vi.mock('maplibre-gl', () => ({
  Map: vi.fn(),
  setWorkerUrl: vi.fn(),
  GeoJSONSource: class {
    setData = vi.fn().mockResolvedValue(undefined);
  },
}));

describe('MapComponent', () => {
  let fixture: ComponentFixture<MapComponent>;
  let events: Record<string, () => void>;
  let source: GeoJSONSource;
  const getWithin = vi.fn<PoiService['getWithin']>();
  const map = {
    on: vi.fn(),
    addSource: vi.fn(),
    addLayer: vi.fn(),
    getSource: vi.fn(),
    getBounds: vi.fn(() => ({
      getWest: () => -74.2,
      getSouth: () => 4.5,
      getEast: () => -73.9,
      getNorth: () => 4.8,
    })),
    remove: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    events = {};
    source = Object.create(GeoJSONSource.prototype) as GeoJSONSource;
    source.setData = vi.fn().mockResolvedValue(undefined);
    map.on.mockImplementation((event: string, callback: () => void) => {
      events[event] = callback;
    });
    map.getSource.mockReturnValue(undefined);
    map.addSource.mockImplementation(() => map.getSource.mockReturnValue(source));
    vi.mocked(Map).mockImplementation(function () {
      return map as unknown as Map;
    });
    getWithin.mockReturnValue(new Subject<PoiFeatureCollection>());
    TestBed.configureTestingModule({
      imports: [MapComponent],
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: PoiService, useValue: { getWithin } },
      ],
    });
  });

  function render(): void {
    fixture = TestBed.createComponent(MapComponent);
    fixture.detectChanges();
  }

  it('should initialize the POI source and layer on load and display fetched POIs', () => {
    const response = new Subject<PoiFeatureCollection>();
    getWithin.mockReturnValue(response);
    render();

    events['moveend']();
    expect(getWithin).not.toHaveBeenCalled();
    events['load']();

    expect(setWorkerUrl).toHaveBeenCalledWith('/maplibre/maplibre-gl-worker.mjs');
    expect(map.addSource).toHaveBeenCalledExactlyOnceWith('pois', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
    expect(map.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'poi-points',
        type: 'circle',
        source: 'pois',
      }),
    );
    expect(getWithin).toHaveBeenCalledExactlyOnceWith([-74.2, 4.5, -73.9, 4.8]);
    const collection: PoiFeatureCollection = { type: 'FeatureCollection', features: [] };
    response.next(collection);
    expect(source.setData).toHaveBeenCalledExactlyOnceWith(collection);
  });

  it('should cancel stale requests on movement and release resources on destruction', () => {
    const cancel = vi.fn();
    getWithin.mockReturnValue(new Observable(() => cancel));
    render();
    events['load']();
    events['moveend']();

    expect(cancel).toHaveBeenCalledTimes(1);
    expect(getWithin).toHaveBeenCalledTimes(2);
    fixture.destroy();
    expect(cancel).toHaveBeenCalledTimes(2);
    expect(map.remove).toHaveBeenCalledOnce();
  });

  it('should avoid initializing the map during server rendering', () => {
    TestBed.overrideProvider(PLATFORM_ID, { useValue: 'server' });
    render();

    expect(Map).not.toHaveBeenCalled();
    expect(setWorkerUrl).not.toHaveBeenCalled();
    expect(getWithin).not.toHaveBeenCalled();
  });
});
