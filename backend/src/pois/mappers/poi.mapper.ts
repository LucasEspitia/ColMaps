import type { PoiDetail } from '../contracts/poi-detail';
import type {
  PoiDetailRow,
  PoiFeatureCollection,
  PoiRow,
} from '../types/poi.types';

type OsmTags = Record<string, unknown> | null;

function getTag(tags: OsmTags, key: string): string | null {
  const value = tags?.[key];

  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
}

function getBooleanTag(tags: OsmTags, key: string): boolean | null {
  const value = getTag(tags, key)?.toLowerCase();

  if (value === 'yes') return true;
  if (value === 'no') return false;

  return null;
}

function getNumberTag(tags: OsmTags, key: string): number | null {
  const value = getTag(tags, key);
  if (value === null) return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildAddress(tags: OsmTags): string | null {
  const full = getTag(tags, 'addr:full');
  if (full) return full;

  const street = getTag(tags, 'addr:street');
  const houseNumber = getTag(tags, 'addr:housenumber');
  const place = getTag(tags, 'addr:place');
  const city = getTag(tags, 'addr:city');

  const streetLine = [street ?? place, houseNumber ? `#${houseNumber}` : null]
    .filter(Boolean)
    .join(' ');

  return [streetLine, city].filter(Boolean).join(', ') || null;
}

export function toPoiDetail(row: PoiDetailRow): PoiDetail {
  const tags = row.tags;

  return {
    id: `${row.osm_type}/${row.osm_id}`,
    name: row.name,
    category: row.primary_category,
    categories: row.categories,
    subcategory: row.subcategory,
    coordinates: [row.longitude, row.latitude],

    description: getTag(tags, 'description'),
    address: buildAddress(tags),

    website: getTag(tags, 'website') ?? getTag(tags, 'contact:website'),

    phone: getTag(tags, 'phone') ?? getTag(tags, 'contact:phone'),

    email: getTag(tags, 'email') ?? getTag(tags, 'contact:email'),

    facebook: getTag(tags, 'contact:facebook'),

    openingHours: getTag(tags, 'opening_hours'),
    wheelchair: getTag(tags, 'wheelchair'),
    image: getTag(tags, 'image'),

    brand: getTag(tags, 'brand'),
    operator: getTag(tags, 'operator'),
    stars: getNumberTag(tags, 'stars'),
    rooms: getNumberTag(tags, 'rooms'),

    internetAccess: getTag(tags, 'internet_access'),
    internetAccessFee: getTag(tags, 'internet_access:fee'),
    reservation: getTag(tags, 'reservation'),
    smoking: getTag(tags, 'smoking'),
    airConditioning: getBooleanTag(tags, 'air_conditioning'),
    bar: getBooleanTag(tags, 'bar'),

    acceptsCreditCards: getBooleanTag(tags, 'payment:credit_cards'),
    acceptsDebitCards: getBooleanTag(tags, 'payment:debit_cards'),
  };
}

export function toPoiFeatureCollection(rows: PoiRow[]): PoiFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: rows.map((row) => ({
      type: 'Feature',
      id: `${row.osm_type}/${row.osm_id}`,
      geometry: row.geometry,
      properties: {
        name: row.name,
        category: row.primary_category,
        categories: row.categories,
        subcategory: row.subcategory,
      },
    })),
  };
}
