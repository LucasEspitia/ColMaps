import type { PoiDetail } from '../data-access/poi.types';

export type PoiDetailState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: PoiDetail }
  | { status: 'error' };
