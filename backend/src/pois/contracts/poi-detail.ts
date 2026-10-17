import { PoiSummary } from './poi-summary';

export interface PoiDetail extends PoiSummary {
  description?: string | null;
  address?: string | null;
  website?: string | null;
  phone?: string | null;
  openingHours?: string | null;
  wheelchair?: string | null;
}
