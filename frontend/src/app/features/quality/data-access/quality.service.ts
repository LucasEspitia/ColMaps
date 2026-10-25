import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import type { QualitySummary, QualityRun, QualityRunsResponse } from './quality.types';
import { API_BASE_URL } from '../../../core/config/api.config';

@Injectable({
  providedIn: 'root',
})
export class QualityService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_BASE_URL);
  private readonly endpoint = `${this.apiUrl}/quality`;

  getSummary(): Observable<QualitySummary> {
    return this.http.get<QualitySummary>(`${this.endpoint}/summary`);
  }

  getRuns(): Observable<QualityRunsResponse> {
    return this.http.get<QualityRunsResponse>(`${this.endpoint}/runs`, {
      params: { page: 1, limit: 20 },
    });
  }

  getRun(id: string): Observable<QualityRun> {
    return this.http.get<QualityRun>(`${this.endpoint}/runs/${encodeURIComponent(id)}`);
  }
}
