import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../core/config/api.config';
import type { Bbox, FeatureCategory, PoiFeatureCollection } from './poi.types';

@Injectable({
  providedIn: 'root',
})
export class PoiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_BASE_URL);

  private readonly endpoint = `${this.apiUrl}/pois`;

  getWithin(bbox: Bbox, categories: FeatureCategory[] = []): Observable<PoiFeatureCollection> {
    let params = new HttpParams().set('bbox', bbox.join(','));

    if (categories.length > 0) {
      params = params.set('categories', categories.join(','));
    }

    return this.http.get<PoiFeatureCollection>(this.endpoint, { params });
  }
}
