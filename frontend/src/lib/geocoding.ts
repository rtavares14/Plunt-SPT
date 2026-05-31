export interface CitySuggestion {
  label: string;
  city: string;
  country: string;
}

interface PhotonProperties {
  name?: string;
  city?: string;
  state?: string;
  country?: string;
  type?: string;
}

interface PhotonFeature {
  properties?: PhotonProperties;
}

interface PhotonResponse {
  features?: PhotonFeature[];
}

// Photon is Komoot's open-source geocoder built on OSM data, designed for
// prefix-style autocomplete and ranks results by importance / population, so
// "ams" surfaces Amsterdam first and "lis" surfaces Lisbon first. Nominatim's
// own `q=` and `city=` modes do substring matches that bury famous cities
// behind tiny villages with the same prefix.
const ENDPOINT = 'https://photon.komoot.io/api/';

export async function searchCities(query: string, signal?: AbortSignal): Promise<CitySuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const url = new URL(ENDPOINT);
  url.searchParams.set('q', q);
  url.searchParams.set('limit', '8');
  url.searchParams.set('lang', 'en');
  // Restrict to city-level features. Photon also has `locality` for smaller
  // settlements but it adds noise for short prefixes.
  url.searchParams.append('layer', 'city');

  const res = await fetch(url.toString(), { signal });
  if (!res.ok) return [];
  const data = (await res.json()) as PhotonResponse;

  const seen = new Set<string>();
  const out: CitySuggestion[] = [];
  for (const feature of data.features ?? []) {
    const p = feature.properties;
    if (!p?.country) continue;
    const city = p.name ?? p.city ?? p.state;
    if (!city) continue;
    const label = `${city}, ${p.country}`;
    if (seen.has(label)) continue;
    seen.add(label);
    out.push({ label, city, country: p.country });
    if (out.length >= 5) break;
  }
  return out;
}
