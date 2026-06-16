export type Sunlight = 'HIGH' | 'MEDIUM' | 'LOW';

export interface PlanterSummary {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  isIndoor: boolean;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { plants: number };
}

export interface PlantSummary {
  id: string;
  ownerId: string;
  planterId: string | null;
  name: string;
  species: string | null;
  notes: string | null;
  city: string | null;
  isDead: boolean;
  wateringIntervalDays: number;
  sunlight: Sunlight;
  minTemp: number | null;
  maxTemp: number | null;
  lastWateredAt: string | null;
  dateAcquired: string;
  createdAt: string;
  updatedAt: string;
  planter?: { id: string; name: string; isIndoor: boolean } | null;
  images?: { id: string; url: string }[];
}

export interface SpeciesSearchResult {
  id: number;
  commonName: string | null;
  scientificName: string;
  family: string | null;
  imageUrl: string | null;
  slug: string;
}

export interface SpeciesDetail extends SpeciesSearchResult {
  minTemp: number | null;
  maxTemp: number | null;
  light: number | null;
  atmosphericHumidity: number | null;
  growthMonths: string[] | null;
  bloomMonths: string[] | null;
  edible: boolean | null;
}

type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

async function parse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) msg = body.error;
    } catch {
      // ignore body parse errors
    }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export async function listPlanters(fetcher: Fetcher): Promise<PlanterSummary[]> {
  const res = await fetcher('/api/planters');
  const data = await parse<{ planters: PlanterSummary[] }>(res);
  return data.planters;
}

export async function createPlanter(
  fetcher: Fetcher,
  input: { name: string; description?: string | null; isIndoor: boolean; imageUrl?: string | null },
): Promise<PlanterSummary> {
  const res = await fetcher('/api/planters', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = await parse<{ planter: PlanterSummary }>(res);
  return data.planter;
}

export async function updatePlanter(
  fetcher: Fetcher,
  id: string,
  input: Partial<{ name: string; description: string | null; isIndoor: boolean; imageUrl: string | null }>,
): Promise<PlanterSummary> {
  const res = await fetcher(`/api/planters/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = await parse<{ planter: PlanterSummary }>(res);
  return data.planter;
}

export async function listPlants(fetcher: Fetcher): Promise<PlantSummary[]> {
  const res = await fetcher('/api/plants');
  const data = await parse<{ plants: PlantSummary[] }>(res);
  return data.plants;
}

export interface CreatePlantInput {
  name: string;
  species?: string | null;
  notes?: string | null;
  city?: string | null;
  planterId?: string | null;
  wateringIntervalDays?: number;
  sunlight?: Sunlight;
  minTemp?: number | null;
  maxTemp?: number | null;
  lastWateredAt?: string | null;
  dateAcquired?: string | null;
  imageUrl?: string | null;
}

export async function createPlant(
  fetcher: Fetcher,
  input: CreatePlantInput,
): Promise<PlantSummary> {
  const res = await fetcher('/api/plants', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = await parse<{ plant: PlantSummary }>(res);
  return data.plant;
}

export type UpdatePlantInput = Partial<CreatePlantInput>;

export async function updatePlant(
  fetcher: Fetcher,
  id: string,
  input: UpdatePlantInput,
): Promise<PlantSummary> {
  const res = await fetcher(`/api/plants/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = await parse<{ plant: PlantSummary }>(res);
  return data.plant;
}

export async function searchSpecies(
  fetcher: Fetcher,
  q: string,
): Promise<{ results: SpeciesSearchResult[]; configured: boolean }> {
  const res = await fetcher(`/api/species/search?q=${encodeURIComponent(q)}`);
  return parse<{ results: SpeciesSearchResult[]; configured: boolean }>(res);
}

export async function getSpeciesDetail(
  fetcher: Fetcher,
  id: number,
): Promise<SpeciesDetail | null> {
  const res = await fetcher(`/api/species/${id}`);
  if (res.status === 404) return null;
  const data = await parse<{ species: SpeciesDetail }>(res);
  return data.species;
}

export async function deletePlant(fetcher: Fetcher, id: string): Promise<void> {
  const res = await fetcher(`/api/plants/${id}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 404) {
    let msg = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) msg = body.error;
    } catch { /* ignore */ }
    throw new Error(msg);
  }
}

export async function deletePlanter(fetcher: Fetcher, id: string): Promise<void> {
  const res = await fetcher(`/api/planters/${id}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 404) {
    let msg = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) msg = body.error;
    } catch { /* ignore */ }
    throw new Error(msg);
  }
}

// Trefle's `light` is 0..10 — squash into our three-bucket enum.
export function trefleLightToSunlight(light: number | null): Sunlight | null {
  if (light == null) return null;
  if (light >= 7) return 'HIGH';
  if (light >= 4) return 'MEDIUM';
  return 'LOW';
}
