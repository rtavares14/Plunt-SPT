// Server-side counterpart to the frontend CityAutocomplete: confirms a city
// string is a real place that the Photon / OpenStreetMap geocoder recognises,
// so the API can't be made to store arbitrary text by bypassing the UI.
//
// Photon is Komoot's OSM-backed geocoder; we build the same "City, Country"
// label the frontend stores and require an exact (case-insensitive) match.

const ENDPOINT = 'https://photon.komoot.io/api/';

interface PhotonProperties {
  name?: string;
  city?: string;
  state?: string;
  country?: string;
}

interface PhotonResponse {
  features?: { properties?: PhotonProperties }[];
}

export class GeocoderUnavailableError extends Error {
  constructor() {
    super('Geocoder unavailable');
    this.name = 'GeocoderUnavailableError';
  }
}

/**
 * Returns true when `input` exactly matches a city the geocoder returns.
 * Throws GeocoderUnavailableError on network / upstream failure so callers can
 * decide whether to fail open or surface a retryable error.
 */
export async function isKnownCity(input: string, signal?: AbortSignal): Promise<boolean> {
  const q = input.trim();
  if (q.length < 2) return false;

  const url = new URL(ENDPOINT);
  url.searchParams.set('q', q);
  url.searchParams.set('limit', '8');
  url.searchParams.set('lang', 'en');
  url.searchParams.append('layer', 'city');

  let res: Response;
  try {
    res = await fetch(url.toString(), { signal });
  } catch {
    throw new GeocoderUnavailableError();
  }
  if (!res.ok) throw new GeocoderUnavailableError();

  let data: PhotonResponse;
  try {
    data = (await res.json()) as PhotonResponse;
  } catch {
    throw new GeocoderUnavailableError();
  }

  const target = q.toLowerCase();
  for (const feature of data.features ?? []) {
    const p = feature.properties;
    if (!p?.country) continue;
    const city = p.name ?? p.city ?? p.state;
    if (!city) continue;
    if (`${city}, ${p.country}`.toLowerCase() === target) return true;
  }
  return false;
}
