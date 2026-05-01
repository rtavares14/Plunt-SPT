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

export async function searchSpecies(query: string): Promise<TrefleSpecies[]> {
  if (!query.trim()) return [];
  const json = (await trefleGet('/plants/search', { q: query })) as
    | { data?: Array<Record<string, unknown>> }
    | null;
  if (!json?.data) return [];
  return json.data.map((row) => ({
    id: Number(row.id),
    commonName: (row.common_name as string | null) ?? null,
    scientificName: String(row.scientific_name ?? ''),
    family: (row.family_common_name as string | null) ?? null,
    imageUrl: (row.image_url as string | null) ?? null,
    slug: String(row.slug ?? ''),
  }));
}

export async function getSpeciesDetail(id: number): Promise<TrefleSpeciesDetail | null> {
  const json = (await trefleGet(`/plants/${id}`, {})) as
    | { data?: Record<string, unknown> }
    | null;
  const data = json?.data;
  if (!data) return null;

  const main = (data.main_species as Record<string, unknown> | undefined) ?? {};
  const growth = (main.growth as Record<string, unknown> | undefined) ?? {};
  const specifications =
    (main.specifications as Record<string, unknown> | undefined) ?? {};

  const minTempRow = growth.minimum_temperature as Record<string, unknown> | undefined;
  const maxTempRow = growth.maximum_temperature as Record<string, unknown> | undefined;

  return {
    id: Number(data.id),
    commonName: (data.common_name as string | null) ?? null,
    scientificName: String(data.scientific_name ?? ''),
    family: (data.family_common_name as string | null) ?? null,
    imageUrl: (data.image_url as string | null) ?? null,
    slug: String(data.slug ?? ''),
    minTemp: typeof minTempRow?.deg_c === 'number' ? (minTempRow.deg_c as number) : null,
    maxTemp: typeof maxTempRow?.deg_c === 'number' ? (maxTempRow.deg_c as number) : null,
    light: typeof growth.light === 'number' ? (growth.light as number) : null,
    atmosphericHumidity:
      typeof growth.atmospheric_humidity === 'number'
        ? (growth.atmospheric_humidity as number)
        : null,
    growthMonths: Array.isArray(growth.growth_months)
      ? (growth.growth_months as string[])
      : null,
    bloomMonths: Array.isArray(growth.bloom_months)
      ? (growth.bloom_months as string[])
      : null,
    edible: typeof specifications.edible === 'boolean' ? (specifications.edible as boolean) : null,
  };
}

export const trefleConfigured = isConfigured;
