import { describe, it, expect, vi, afterEach } from 'vitest';
import { isKnownCity, GeocoderUnavailableError } from '../src/lib/geocoding';

interface PhotonFeature {
  properties: { name?: string; city?: string; state?: string; country?: string };
}

function mockPhoton(features: PhotonFeature[]) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify({ features }), { status: 200 })),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('isKnownCity', () => {
  it('accepts an exact "City, Country" match', async () => {
    mockPhoton([{ properties: { name: 'Lisbon', country: 'Portugal' } }]);
    expect(await isKnownCity('Lisbon, Portugal')).toBe(true);
  });

  it('matches case-insensitively', async () => {
    mockPhoton([{ properties: { name: 'Lisbon', country: 'Portugal' } }]);
    expect(await isKnownCity('lisbon, portugal')).toBe(true);
  });

  it('rejects a made-up place the geocoder does not return', async () => {
    mockPhoton([{ properties: { name: 'Lisbon', country: 'Portugal' } }]);
    expect(await isKnownCity('Narnia, Nowhere')).toBe(false);
  });

  it('rejects a bare city name when the stored label is "City, Country"', async () => {
    mockPhoton([{ properties: { name: 'Lisbon', country: 'Portugal' } }]);
    expect(await isKnownCity('Lisbon')).toBe(false);
  });

  it('returns false for too-short input without hitting the network', async () => {
    const f = vi.fn();
    vi.stubGlobal('fetch', f);
    expect(await isKnownCity('L')).toBe(false);
    expect(f).not.toHaveBeenCalled();
  });

  it('throws GeocoderUnavailableError on a network failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down');
      }),
    );
    await expect(isKnownCity('Lisbon, Portugal')).rejects.toBeInstanceOf(
      GeocoderUnavailableError,
    );
  });
});
