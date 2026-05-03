// Tri-state values for PATCH-style updates:
//   undefined → key absent in body (don't change)
//   null      → explicit clear
//   T         → new value
// `'invalid'` is returned to the caller as a sentinel for malformed input.

export const INVALID = Symbol('invalid');
export type Validated<T> = T | null | undefined | typeof INVALID;

export function trimmedString(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const t = value.trim();
  if (!t || t.length > max) return null;
  return t;
}

export function optionalString(value: unknown, max: number): Validated<string> {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (typeof value !== 'string') return INVALID;
  const t = value.trim();
  if (!t) return null;
  if (t.length > max) return INVALID;
  return t;
}

export function optionalUrl(value: unknown): Validated<string> {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (typeof value !== 'string') return INVALID;
  const t = value.trim();
  if (!t) return null;
  try {
    const url = new URL(t);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return INVALID;
    return t;
  } catch {
    return INVALID;
  }
}

export function optionalNumber(value: unknown, min: number, max: number): Validated<number> {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n < min || n > max) return INVALID;
  return n;
}

export function optionalDate(value: unknown): Validated<Date> {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (typeof value !== 'string') return INVALID;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return INVALID;
  return d;
}
