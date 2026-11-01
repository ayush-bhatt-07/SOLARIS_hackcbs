import { getAuthSession } from './authStorage';

const base = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
export const api = async <T = any>(path: string, options: RequestInit = {}): Promise<T> => {
  const token = getAuthSession()?.token;
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      ...options,
      signal: options.signal ?? AbortSignal.timeout(20000),
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
    });
  } catch { throw new Error('Cannot reach the Solaris API. Start the backend with npm run server and try again.'); }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error || `Request failed (${response.status}). Check the API is running.`);
  }
  if (response.headers.get('content-type')?.includes('text/')) return await response.text() as T;
  try { return await response.json(); }
  catch { throw new Error('The API returned an invalid response. Check the backend/proxy configuration.'); }
};
export const post = <T = any>(path: string, body: unknown) => api<T>(path, { method: 'POST', body: JSON.stringify(body) });
