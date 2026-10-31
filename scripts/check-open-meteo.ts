import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { existsSync, unlinkSync } from 'node:fs';
process.env.SOLARIS_DATA_FILE = join(tmpdir(), `solaris-open-meteo-check-${randomUUID()}.json`);
const { fetchHistoricalWeather } = await import('../server/historicalWeather');
try {
  const result = await fetchHistoricalWeather('isolated-live-check', 'delhi-reference-coordinate-check', { latitude: 28.6139, longitude: 77.209, timezone: 'Asia/Kolkata', capacityKwp: 200, performanceRatio: .8, tilt: 20, azimuth: 0, temperatureCoefficient: -.004, noctC: 45, source: 'USER_CONFIRMED', version: 1 }, '2025-08-21', '2025-08-23');
  console.log(JSON.stringify({ verified: true, provider: 'Open-Meteo / ERA5 modelled reanalysis', hours: result.records.length, timezone: result.metadata.timezone, units: result.metadata.units, firstHour: result.records[0], cachedAt: result.retrievedAt }));
} finally { if (existsSync(process.env.SOLARIS_DATA_FILE)) unlinkSync(process.env.SOLARIS_DATA_FILE); }
