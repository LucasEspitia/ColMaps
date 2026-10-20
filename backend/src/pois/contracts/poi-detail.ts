import { PoiSummary } from './poi-summary';

export interface PoiDetail extends PoiSummary {
  description?: string | null;
  address?: string | null;

  website?: string | null;
  phone?: string | null;
  email?: string | null;
  facebook?: string | null;

  openingHours?: string | null;
  wheelchair?: string | null;

  image?: string | null;

  brand?: string | null;
  operator?: string | null;

  stars?: number | null;
  rooms?: number | null;

  internetAccess?: string | null;
  internetAccessFee?: string | null;

  reservation?: string | null;
  smoking?: string | null;

  acceptsCreditCards?: boolean | null;
  acceptsDebitCards?: boolean | null;

  airConditioning?: boolean | null;
  bar?: boolean | null;
}
