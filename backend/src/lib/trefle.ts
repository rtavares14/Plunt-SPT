import { logger } from './logger';

const TREFLE_BASE = 'https://trefle.io/api/v1';
const TREFLE_TOKEN = process.env.TREFLE_TOKEN;

export interface TrefleSpecies {
  id: number;
  commonName: string | null;
  scientificName: string;
  family: string | null;
  imageUrl: string | null;
  slug: string;
}

export interface TrefleSpeciesDetail extends TrefleSpecies {
  // Hints we can prefill into the wizard.
  minTemp: number | null;
  maxTemp: number | null;
  light: number | null; // 0..10 from Trefle, mapped to HIGH/MEDIUM/LOW client-side
  atmosphericHumidity: number | null;
  growthMonths: string[] | null;
  bloomMonths: string[] | null;
  edible: boolean | null;
}

function isConfigured(): boolean {
  return typeof TREFLE_TOKEN === 'string' && TREFLE_TOKEN.length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asNumber(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return value;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function asStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  return value.filter((v): v is string => typeof v === 'string');
}

async function trefleGet(path: string, params: Record<string, string>): Promise<unknown> {
  if (!isConfigured()) return null;
  const qs = new URLSearchParams({ ...params, token: TREFLE_TOKEN! }).toString();
  const url = `${TREFLE_BASE}${path}?${qs}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    logger.warn({ status: res.status, path }, 'Trefle request failed');
    return null;
  }
  return res.json();
}

function parseSpeciesRow(row: unknown): TrefleSpecies | null {
  if (!isRecord(row)) return null;
  const id = asNumber(row.id);
  const scientificName = asString(row.scientific_name);
  if (id === null || !scientificName) return null;
  return {
    id,
    commonName: asString(row.common_name),
    scientificName,
    family: asString(row.family_common_name),
    imageUrl: asString(row.image_url),
    slug: asString(row.slug) ?? '',
  };
}

export async function searchSpecies(query: string): Promise<TrefleSpecies[]> {
  if (!query.trim()) return [];
  const json = await trefleGet('/plants/search', { q: query });
  if (!isRecord(json)) return [];
  const data = json.data;
  if (!Array.isArray(data)) return [];
  return data
    .map(parseSpeciesRow)
    .filter((s): s is TrefleSpecies => s !== null);
}

export async function getSpeciesDetail(id: number): Promise<TrefleSpeciesDetail | null> {
  const json = await trefleGet(`/plants/${id}`, {});
  if (!isRecord(json) || !isRecord(json.data)) return null;
  const data = json.data;

  const base = parseSpeciesRow(data);
  if (!base) return null;

  const main = isRecord(data.main_species) ? data.main_species : {};
  const growth = isRecord(main.growth) ? main.growth : {};
  const specifications = isRecord(main.specifications) ? main.specifications : {};

  const minTempRow = isRecord(growth.minimum_temperature) ? growth.minimum_temperature : null;
  const maxTempRow = isRecord(growth.maximum_temperature) ? growth.maximum_temperature : null;

  return {
    ...base,
    minTemp: minTempRow ? asNumber(minTempRow.deg_c) : null,
    maxTemp: maxTempRow ? asNumber(maxTempRow.deg_c) : null,
    light: asNumber(growth.light),
    atmosphericHumidity: asNumber(growth.atmospheric_humidity),
    growthMonths: asStringArray(growth.growth_months),
    bloomMonths: asStringArray(growth.bloom_months),
    edible: typeof specifications.edible === 'boolean' ? specifications.edible : null,
  };
}

export const trefleConfigured = isConfigured;
