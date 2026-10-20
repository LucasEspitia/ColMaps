import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../../../core/config/api.config';
import { PoiService } from './poi.service';
import type { Bbox, PoiFeatureCollection } from './poi.types';

describe('PoiService', () => {
  let service: PoiService;
  let http: HttpTestingController;
  const bbox: Bbox = [-74.2, 4.5, -73.9, 4.8];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
      ],
    });
    service = TestBed.inject(PoiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should request the bbox without a category filter and return the collection', () => {
    const collection: PoiFeatureCollection = { type: 'FeatureCollection', features: [] };
    const received = vi.fn();
    service.getWithin(bbox).subscribe(received);

    const request = http.expectOne((req) => req.url === '/api/poi');
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('bbox')).toBe('-74.2,4.5,-73.9,4.8');
    expect(request.request.params.has('categories')).toBe(false);
    request.flush(collection);
    expect(received).toHaveBeenCalledExactlyOnceWith(collection);
  });

  it('should serialize selected categories as a comma-separated query parameter', () => {
    service.getWithin(bbox, ['museums_culture', 'attractions']).subscribe();

    const request = http.expectOne((req) => req.url === '/api/poi');
    expect(request.request.params.get('categories')).toBe('museums_culture,attractions');
    request.flush({ type: 'FeatureCollection', features: [] });
  });

  it('should request the detail route for an OSM identity', () => {
    service.getById('N/334407033').subscribe();

    const request = http.expectOne(() => true);
    request.flush({ id: 'N/334407033' });
    expect(request.request.method).toBe('GET');
    expect(request.request.url).toBe('/api/poi/N/334407033');
  });

  it.each(['invalid-id', 'N/0', 'N/01'])(
    'should reject malformed identity %s without an HTTP request',
    (id) => {
      const error = vi.fn();
      service.getById(id).subscribe({ error });

      expect(error).toHaveBeenCalledExactlyOnceWith(new Error('Invalid POI ID'));
      http.expectNone(() => true);
    },
  );
});
