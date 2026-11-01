export interface DetectiveReading {
  date: string; expected_generation_kwh: number; actual_generation_kwh: number | null;
  mall_load_kwh: number; grid_import_kwh: number; injected_anomaly_label: number;
}
export interface DetectiveDataset {
  id: string; propertyId: string; organisationId: string; source: 'SYNTHETIC';
  sourceHash: string; createdAt: string; tariff: number; records: DetectiveReading[];
}
export interface DetectiveDay {
  date: string; expectedKwh: number; actualKwh: number | null; loadKwh: number;
  gridImportKwh: number; expectedImportKwh: number; generationRatio: number | null;
  importResidualKwh: number | null; score: number | null; status: 'NORMAL' | 'INVESTIGATE' | 'MISSING_DATA';
  expectedAvoidedInr: number | null; actualAvoidedInr: number | null; gapInr: number | null;
  direction: 'SHORTFALL' | 'ABOVE_BASELINE' | 'MISSING_DATA';
}
export interface DetectiveReport {
  datasetId: string; propertyId: string; source: 'SYNTHETIC'; sourceHash: string; createdAt: string;
  tariff: number; modelVersion: string; sklearnVersion: string; model: { features: string[]; trainDays: number; trees: number; contamination: number; seed: number; threshold: number };
  summary: { days: number; validDays: number; missingDays: number; flags: number; flaggedShortfallInr: number; flaggedSurplusInr: number; netGapInr: number; expectedKwh: number; actualKwh: number };
  evaluation: { precision: number; recall: number; f1: number; confusionMatrix: number[][]; injectedAnomalies: number };
  days: DetectiveDay[]; assumptions: string[];
}
