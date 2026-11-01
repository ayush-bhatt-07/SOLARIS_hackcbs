export interface WeatherSite {
  latitude: number; longitude: number; timezone: string; capacityKwp: number; performanceRatio: number;
  tilt: number | null; azimuth: number | null; temperatureCoefficient: number | null; noctC: number | null;
  source: 'SYNTHETIC' | 'USER_CONFIRMED'; version: number;
}
export interface SolarHour {
  timestamp: number; actualKwh: number | null; loadKwh: number | null; gridImportKwh: number | null;
  label?: number; scenario?: string;
}
export interface WeatherHour {
  timestamp: number; shortwaveRadiation: number | null; gti: number | null; cloudCover: number | null;
  precipitation: number | null; temperatureC: number | null; isDay: number | null;
}
export interface WeatherDataset {
  id: string; propertyId: string; organisationId: string; source: 'SYNTHETIC' | 'USER_PROVIDED';
  site: WeatherSite; solar: SolarHour[]; weather?: WeatherHour[]; createdAt: string; version: number;
}
export interface WeatherCache {
  key: string; propertyId: string; organisationId: string; retrievedAt: string;
  records: WeatherHour[]; metadata: { timezone: string; units: Record<string, string>; requestedLatitude: number; requestedLongitude: number; gridLatitude: number; gridLongitude: number; radiation: string };
}
export interface WeatherDay {
  date: string; actualKwh: number | null; expectedKwh: number | null; residualKwh: number | null; ratio: number | null;
  irradianceKwhM2: number | null; cloudCover: number | null; precipitationMm: number | null; temperatureC: number | null;
  weather: string; score: number | null; originalScore: number | null; originalFlag: boolean | null; thresholdFlag: boolean | null;
  status: string; eligible: boolean; warnings: string[]; gapInr: number | null; expectedAvoidedInr: number | null; actualAvoidedInr: number | null;
  scenario?: string; daylightHours: number; matchedHours: number;
}
export interface WeatherReport {
  reportId: string; datasetVersion: number; solarHash: string; tariffInrPerKwh: number;
  datasetId: string; propertyId: string; source: string; site: WeatherSite; modelVersion: string; baselineVersion: string;
  weatherProvenance: string; retrievedAt?: string; weatherMetadata?: WeatherCache['metadata'];
  days: WeatherDay[]; examples: { rainy?: string; sunnyAlert?: string; cloudy?: string; degradation?: string };
  summary: { flags: number; weatherConsistent: number; excluded: number; flaggedShortfallInr: number; trainDays: number };
  comparisons: { model: string; precision: number | null; recall: number | null; f1: number | null; falsePositives: number | null; rainyCloudyFalseAlerts: number | null; confusionMatrix: number[][] | null }[];
  assumptions: string[];
}
