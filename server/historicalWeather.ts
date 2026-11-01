import { createHash } from 'node:crypto';
import type { WeatherSite, WeatherCache } from '../src/types/weatherDetective';
import { db, persist } from './businessStore';

export function validateWeatherSite(value: any): WeatherSite {
  if (!value || typeof value !== 'object') throw new Error('Site settings are required.');
  const bounds = { latitude: [-90, 90], longitude: [-180, 180], capacityKwp: [0.1, 2000], performanceRatio: [0.4, 1] };
  for (const [key, [min, max]] of Object.entries(bounds)) if (typeof value[key] !== 'number' || !Number.isFinite(value[key]) || value[key] < min || value[key] > max) throw new Error(`Invalid ${key}.`);
  if (typeof value.timezone !== 'string' || value.timezone.length > 80) throw new Error('An IANA timezone is required.');
  try { new Intl.DateTimeFormat('en', { timeZone: value.timezone }).format(); } catch { throw new Error('Invalid IANA timezone.'); }
  for (const [key, min, max] of [['tilt', 0, 90], ['azimuth', -180, 180], ['temperatureCoefficient', -0.01, 0], ['noctC', 20, 70]] as const) {
    if (value[key] !== null && (typeof value[key] !== 'number' || !Number.isFinite(value[key]) || value[key] < min || value[key] > max)) throw new Error(`Invalid ${key}; use null when unavailable.`);
  }
  if ((value.tilt === null) !== (value.azimuth === null) || (value.temperatureCoefficient === null) !== (value.noctC === null)) throw new Error('Supply tilt/azimuth and temperature coefficient/NOCT as complete pairs, or null.');
  return { latitude: value.latitude, longitude: value.longitude, timezone: value.timezone, capacityKwp: value.capacityKwp, performanceRatio: value.performanceRatio,
    tilt: value.tilt, azimuth: value.azimuth, temperatureCoefficient: value.temperatureCoefficient, noctC: value.noctC, source: 'USER_CONFIRMED', version: 1 };
}
export function weatherUrl(site: WeatherSite, start: string, end: string) {
  const url = new URL('https://archive-api.open-meteo.com/v1/archive');
  const variables = ['shortwave_radiation', 'cloud_cover', 'precipitation', 'temperature_2m', 'is_day'];
  if (site.tilt !== null && site.azimuth !== null) { variables.push('global_tilted_irradiance'); url.searchParams.set('tilt', String(site.tilt)); url.searchParams.set('azimuth', String(site.azimuth)); }
  for (const [key, value] of Object.entries({ latitude: site.latitude, longitude: site.longitude, start_date: start, end_date: end, hourly: variables.join(','), timezone: site.timezone, timeformat: 'unixtime', temperature_unit: 'celsius', precipitation_unit: 'mm', models: 'era5' })) url.searchParams.set(key, String(value));
  return url;
}
export function parseHistoricalWeather(body: any, site: WeatherSite): Pick<WeatherCache, 'records' | 'metadata'> {
  let sameZone = false;
  try { sameZone = typeof body?.timezone === 'string' && new Intl.DateTimeFormat('en', { timeZone: body.timezone }).resolvedOptions().timeZone === new Intl.DateTimeFormat('en', { timeZone: site.timezone }).resolvedOptions().timeZone; } catch { /* Invalid provider timezone is rejected below. */ }
  if (!body || body.error || !Array.isArray(body.hourly?.time) || body.hourly.time.length > 9000 || !sameZone) throw new Error('Weather provider returned invalid hourly data or a different timezone.');
  const units = body.hourly_units;
  if (!Number.isFinite(body.latitude) || !Number.isFinite(body.longitude)) throw new Error('Weather provider grid coordinates are missing.');
  const expected: Record<string, string> = { time: 'unixtime', shortwave_radiation: 'W/m²', cloud_cover: '%', precipitation: 'mm', temperature_2m: '°C', is_day: '' };
  if (site.tilt !== null) expected.global_tilted_irradiance = 'W/m²';
  for (const [key, unit] of Object.entries(expected)) {
    if (units?.[key] !== unit || !Array.isArray(body.hourly[key]) || body.hourly[key].length !== body.hourly.time.length) throw new Error(`Weather provider returned unexpected units or interval lengths for ${key}.`);
  }
  const numeric = (key: string, index: number, min: number, max: number) => { const v = body.hourly[key]?.[index]; return typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max ? v : null; };
  const times: number[] = body.hourly.time;
  if (!times.length || times.some((t, i) => !Number.isInteger(t) || (i > 0 && t - times[i - 1] !== 3600))) throw new Error('Weather timestamps must be unique consecutive UTC hourly interval ends.');
  return { records: times.map((timestamp, index) => ({ timestamp, shortwaveRadiation: numeric('shortwave_radiation', index, 0, 1600), gti: site.tilt === null ? null : numeric('global_tilted_irradiance', index, 0, 1800), cloudCover: numeric('cloud_cover', index, 0, 100), precipitation: numeric('precipitation', index, 0, 500), temperatureC: numeric('temperature_2m', index, -90, 65), isDay: numeric('is_day', index, 0, 1) })),
    metadata: { timezone: body.timezone, units, requestedLatitude: site.latitude, requestedLongitude: site.longitude, gridLatitude: body.latitude, gridLongitude: body.longitude, radiation: site.tilt === null ? 'GHI proxy: orientation unavailable' : 'GTI: provider isotropic-sky estimate; albedo 0.2' } };
}
export async function fetchHistoricalWeather(organisationId: string, propertyId: string, site: WeatherSite, start: string, end: string, fetcher: typeof fetch = fetch): Promise<WeatherCache> {
  validateWeatherSite(site);
  if (site.source !== 'USER_CONFIRMED') throw new Error('Confirm this property’s coordinates and system settings before fetching reanalysis weather.');
  const a = Date.parse(start), b = Date.parse(end);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end) || !Number.isFinite(a) || !Number.isFinite(b) || new Date(a).toISOString().slice(0, 10) !== start || new Date(b).toISOString().slice(0, 10) !== end || b < a || b - a > 367 * 86400000 || b > Date.now() - 5 * 86400000) throw new Error('Choose a historical range of up to 367 days ending at least five days ago.');
  const url = weatherUrl(site, start, end);
  const key = createHash('sha256').update(JSON.stringify({ organisationId, propertyId, url: url.toString() })).digest('hex');
  const cached = db.weatherCache?.find(c => c.key === key && c.organisationId === organisationId && c.propertyId === propertyId && Date.now() - Date.parse(c.retrievedAt) < 7 * 86400000);
  if (cached) return cached;
  let response: Response;
  try { response = await fetcher(url, { signal: AbortSignal.timeout(20000) }); } catch { throw new Error('Open-Meteo could not be reached. No synthetic weather was substituted. Retry later.'); }
  if (!response.ok) throw new Error(`Open-Meteo returned HTTP ${response.status}. No synthetic weather was substituted.`);
  const parsed = parseHistoricalWeather(await response.json(), site);
  const result: WeatherCache = { key, organisationId, propertyId, retrievedAt: new Date().toISOString(), ...parsed };
  db.weatherCache = [...(db.weatherCache ?? []).filter(c => c.key !== key && Date.now() - Date.parse(c.retrievedAt) < 30 * 86400000), result].slice(-30); persist();
  return result;
}
