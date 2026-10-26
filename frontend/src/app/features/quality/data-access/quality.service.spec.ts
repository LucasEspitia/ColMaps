import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { QualityService } from './quality.service';
import { API_BASE_URL } from '../../../core/config/api.config';

describe('QualityService', () => {
  let service: QualityService;
  let httpMock: HttpTestingController;

  const endpoint = 'http://localhost:3000/api/quality';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        QualityService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://localhost:3000/api' },
      ],
    });

    service = TestBed.inject(QualityService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('requests summary filtered by page and device', () => {
    service.getSummary('map', 'mobile').subscribe();

    const request = httpMock.expectOne(`${endpoint}/summary`);

    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('page')).toBe('map');
    expect(request.request.params.get('device')).toBe('mobile');

    request.flush({ totalRuns: 0, latestRun: null, metrics: [] });
  });

  it('requests paginated runs', () => {
    service.getRuns().subscribe();

    const request = httpMock.expectOne(`${endpoint}/runs`);

    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('page')).toBe('1');
    expect(request.request.params.get('limit')).toBe('20');

    request.flush({ data: [], total: 0, page: 1, limit: 20 });
  });

  it('requests a run by its ID', () => {
    const id = 'run/123';

    service.getRun(id).subscribe();

    const request = httpMock.expectOne(`${endpoint}/runs/run%2F123`);

    expect(request.request.method).toBe('GET');

    request.flush({});
  });

  it('requests history with filters and default limit', () => {
    service.getHistory('performance', 'desktop', 'about').subscribe();

    const request = httpMock.expectOne(`${endpoint}/history`);

    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('metric')).toBe('performance');
    expect(request.request.params.get('device')).toBe('desktop');
    expect(request.request.params.get('page')).toBe('about');
    expect(request.request.params.get('limit')).toBe('30');

    request.flush({
      metric: 'performance',
      device: 'desktop',
      page: 'about',
      points: [],
    });
  });
});
