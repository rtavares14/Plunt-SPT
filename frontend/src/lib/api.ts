/**
 * Resolves an API path against the configured backend origin.
 *
 * - In dev `VITE_API_URL` is empty, so calls stay as relative `/api/...`
 *   and the Vite proxy forwards them to the local backend.
 * - In prod set `VITE_API_URL=https://api.plunt.com` and every call becomes
 *   absolute, allowing the frontend (app.plunt.com) and backend
 *   (api.plunt.com) to live on separate origins.
 */
export const API_BASE = import.meta.env.VITE_API_URL ?? '';

export function apiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${normalized}`;
}
