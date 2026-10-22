import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, Subject } from 'rxjs';
import { GeoJSONSource, Map, setWorkerUrl } from 'maplibre-gl';

import { MapCanvas } from './map-canvas';
import { PoiService } from '../../data-access/poi.service';
import type { FeatureCategory } from '../../../../shared/poi/feature-category';
import type { PoiFeatureCollection } from '../../data-access/poi.types';

vi.mock('maplibre-gl', () => ({
  Map: vi.fn(),
  setWorkerUrl: vi.fn(),
  GeoJSONSource: class {
    setData = vi.fn().mockResolvedValue(undefined);
  },
}));

describe('MapCanvas', () => {
  let fixture: ComponentFixture<MapCanvas>;
  interface ClickEvent {
    features?: { properties?: Record<string, unknown> }[];
  }
  let events: Record<string, (event?: ClickEvent) => void>;
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
    map.on.mockImplementation(
      (
        event: string,
        layerOrCallback: string | ((event?: ClickEvent) => void),
        callback?: (event?: ClickEvent) => void,
      ) => {
        events[event] = typeof layerOrCallback === 'function' ? layerOrCallback : callback!;
      },
    );
    map.getSource.mockReturnValue(undefined);
    map.addSource.mockImplementation(() => map.getSource.mockReturnValue(source));
    vi.mocked(Map).mockImplementation(function () {
      return map as unknown as Map;
    });
    getWithin.mockReturnValue(new Subject<PoiFeatureCollection>());
    TestBed.configureTestingModule({
      imports: [MapCanvas],
      providers: [{ provide: PoiService, useValue: { getWithin } }],
    });
  });

  function render(): void {
    fixture = TestBed.createComponent(MapCanvas);
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
    expect(getWithin).toHaveBeenCalledExactlyOnceWith([-74.2, 4.5, -73.9, 4.8], []);
    const collection: PoiFeatureCollection = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          id: 'N/123',
          geometry: { type: 'Point', coordinates: [-74.07, 4.6] },
          properties: {
            name: 'Museo',
            category: 'museums_culture',
            categories: ['museums_culture'],
            subcategory: 'museum',
          },
        },
      ],
    };
    response.next(collection);
    expect(source.setData).toHaveBeenCalledExactlyOnceWith({
      ...collection,
      features: [
        {
          ...collection.features[0],
          properties: { ...collection.features[0].properties, poiId: 'N/123' },
        },
      ],
    });
    expect(collection.features[0].properties).not.toHaveProperty('poiId');
  });

  it('should use the latest categories on load without requesting POIs before the source exists', () => {
    fixture = TestBed.createComponent(MapCanvas);
    fixture.componentRef.setInput('categories', ['museums_culture']);
    fixture.detectChanges();
    const categories: FeatureCategory[] = ['nature', 'viewpoints'];
    fixture.componentRef.setInput('categories', categories);
    fixture.detectChanges();

    expect(getWithin).not.toHaveBeenCalled();

    events['load']();

    expect(getWithin).toHaveBeenCalledExactlyOnceWith([-74.2, 4.5, -73.9, 4.8], categories);
  });

  it('should reload on category changes, cancel stale requests and preserve filters on movement', () => {
    const unfiltered = new Subject<PoiFeatureCollection>();
    const filtered = new Subject<PoiFeatureCollection>();
    const moved = new Subject<PoiFeatureCollection>();
    const cleared = new Subject<PoiFeatureCollection>();
    getWithin
      .mockReturnValueOnce(unfiltered)
      .mockReturnValueOnce(filtered)
      .mockReturnValueOnce(moved)
      .mockReturnValueOnce(cleared);
    render();
    events['load']();
    expect(unfiltered.observed).toBe(true);

    const categories: FeatureCategory[] = ['museums_culture', 'nature'];
    fixture.componentRef.setInput('categories', categories);
    fixture.detectChanges();

    expect(unfiltered.observed).toBe(false);
    expect(filtered.observed).toBe(true);
    expect(getWithin).toHaveBeenCalledTimes(2);
    expect(getWithin).toHaveBeenLastCalledWith([-74.2, 4.5, -73.9, 4.8], categories);

    events['moveend']();

    expect(filtered.observed).toBe(false);
    expect(moved.observed).toBe(true);
    expect(getWithin).toHaveBeenCalledTimes(3);
    expect(getWithin).toHaveBeenLastCalledWith([-74.2, 4.5, -73.9, 4.8], categories);

    fixture.componentRef.setInput('categories', []);
    fixture.detectChanges();

    expect(moved.observed).toBe(false);
    expect(cleared.observed).toBe(true);
    expect(getWithin).toHaveBeenCalledTimes(4);
    expect(getWithin).toHaveBeenLastCalledWith([-74.2, 4.5, -73.9, 4.8], []);

    unfiltered.next({ type: 'FeatureCollection', features: [] });
    filtered.next({ type: 'FeatureCollection', features: [] });
    moved.next({ type: 'FeatureCollection', features: [] });
    expect(source.setData).not.toHaveBeenCalled();
    cleared.next({ type: 'FeatureCollection', features: [] });
    expect(source.setData).toHaveBeenCalledExactlyOnceWith({
      type: 'FeatureCollection',
      features: [],
    });
  });

  it('should emit the clicked POI identity and summary', () => {
    render();
    const selected = vi.fn();
    fixture.componentInstance.poiSelected.subscribe(selected);
    events['load']();

    expect(map.on).toHaveBeenCalledWith('click', 'poi-points', expect.any(Function));
    events['click']({
      features: [{ properties: { poiId: 'N/123', name: 'Museo', category: 'museums_culture' } }],
    });

    expect(selected).toHaveBeenCalledExactlyOnceWith({
      id: 'N/123',
      name: 'Museo',
      category: 'museums_culture',
    });
  });

  it('should ignore clicks without a valid POI identity', () => {
    render();
    const selected = vi.fn();
    fixture.componentInstance.poiSelected.subscribe(selected);
    events['load']();

    for (const event of [
      {},
      { features: [] },
      { features: [{}] },
      { features: [{ properties: {} }] },
      { features: [{ properties: { poiId: 123 } }] },
    ]) {
      events['click'](event);
    }

    expect(selected).not.toHaveBeenCalled();
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

  it('should defer map initialization until after rendering', () => {
    fixture = TestBed.createComponent(MapCanvas);

    expect(Map).not.toHaveBeenCalled();
    expect(setWorkerUrl).not.toHaveBeenCalled();
    expect(getWithin).not.toHaveBeenCalled();

    fixture.detectChanges();

    expect(Map).toHaveBeenCalledOnce();
    expect(setWorkerUrl).toHaveBeenCalledWith('/maplibre/maplibre-gl-worker.mjs');
  });
});
