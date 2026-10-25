import { QualitySummary } from '../data-access/quality.types';
export type QualityState =
  { status: 'loading' } | { status: 'error' } | { status: 'success'; data: QualitySummary };
