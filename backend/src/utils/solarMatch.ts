export type MatchWeights = {
  technicalCompatibility: number;
  costCompetitiveness: number;
  relevantExperience: number;
  warrantyMaintenance: number;
  verifiedReliability: number;
};

export interface RecommendationRequest {
  location: string;
  serviceArea: string;
  annualConsumptionKwh: number;
  roofAreaSqFt: number;
  desiredCapacityKw: number;
  budgetInr: number;
  financingPreference: 'cash' | 'loan' | 'lease';
  requiredTimelineWeeks: number;
  isCommercial?: boolean;
}

export interface InstallerProfile {
  id: string;
  name: string;
  serviceArea: string;
  supportedCapacityKw: number;
  technicalCompatibility: number;
  costCompetitiveness: number;
  relevantExperience: number;
  warrantyMaintenance: number;
  verifiedReliability: number;
  baseRatePerKwInr: number;
  quoteLeadTimeWeeks: number;
  notes: string;
}

export const SOLAR_MATCH_WEIGHTS: MatchWeights = {
  technicalCompatibility: 30,
  costCompetitiveness: 25,
  relevantExperience: 20,
  warrantyMaintenance: 15,
  verifiedReliability: 10
};

export const SOLAR_MATCH_PROVIDERS: InstallerProfile[] = [
  {
    id: 'sun-grid-delhi',
    name: 'SunGrid Delhi',
    serviceArea: 'Delhi',
    supportedCapacityKw: 350,
    technicalCompatibility: 92,
    costCompetitiveness: 81,
    relevantExperience: 87,
    warrantyMaintenance: 84,
    verifiedReliability: 80,
    baseRatePerKwInr: 46000,
    quoteLeadTimeWeeks: 4,
    notes: 'Demo provider profile only — not a real verified partner or rating.'
  },
  {
    id: 'solar-horizon',
    name: 'Solar Horizon Works',
    serviceArea: 'South Delhi',
    supportedCapacityKw: 220,
    technicalCompatibility: 86,
    costCompetitiveness: 90,
    relevantExperience: 78,
    warrantyMaintenance: 81,
    verifiedReliability: 77,
    baseRatePerKwInr: 43000,
    quoteLeadTimeWeeks: 5,
    notes: 'Demo provider profile only — not a real verified partner or rating.'
  },
  {
    id: 'green-crest',
    name: 'Green Crest EPC',
    serviceArea: 'NCR',
    supportedCapacityKw: 500,
    technicalCompatibility: 89,
    costCompetitiveness: 73,
    relevantExperience: 91,
    warrantyMaintenance: 88,
    verifiedReliability: 84,
    baseRatePerKwInr: 49500,
    quoteLeadTimeWeeks: 6,
    notes: 'Demo provider profile only — not a real verified partner or rating.'
  }
];

export const scoreProvider = (
  provider: InstallerProfile,
  request: RecommendationRequest,
  weights: MatchWeights = SOLAR_MATCH_WEIGHTS
): { score: number; reasons: string[]; eligible: boolean; estimatedQuoteInr: number } => {
  const normalise = (value: string) => value.trim().toLowerCase();
  const requestedArea = normalise(request.serviceArea);
  const providerArea = normalise(provider.serviceArea);
  const serviceMatch = requestedArea.length > 0 && (providerArea === requestedArea ||
    (providerArea === 'delhi' && ['south delhi', 'new delhi', 'north delhi', 'east delhi', 'west delhi'].includes(requestedArea)) ||
    (providerArea === 'ncr' && ['delhi', 'new delhi', 'south delhi', 'noida', 'gurugram', 'faridabad', 'ghaziabad', 'ncr'].includes(requestedArea)));
  const capacityFit = provider.supportedCapacityKw >= request.desiredCapacityKw;
  const roofFit = Number.isFinite(request.desiredCapacityKw) && request.desiredCapacityKw > 0 && request.roofAreaSqFt >= request.desiredCapacityKw * 107.64;
  const budgetFit = request.budgetInr >= provider.baseRatePerKwInr * request.desiredCapacityKw * 0.85;
  const timelineFit = provider.quoteLeadTimeWeeks <= request.requiredTimelineWeeks + 2;

  const eligibility = serviceMatch && capacityFit && roofFit && budgetFit && timelineFit;

  const technicalComponent = provider.technicalCompatibility * weights.technicalCompatibility;
  const costComponent = provider.costCompetitiveness * weights.costCompetitiveness;
  const experienceComponent = provider.relevantExperience * weights.relevantExperience;
  const warrantyComponent = provider.warrantyMaintenance * weights.warrantyMaintenance;
  const reliabilityComponent = provider.verifiedReliability * weights.verifiedReliability;

  const values = Object.values(weights);
  if (values.some(value => !Number.isFinite(value) || value < 0) || values.reduce((sum, value) => sum + value, 0) <= 0) throw new Error('SolarMatch weights must be finite, nonnegative, and have a positive total.');
  const score = (technicalComponent + costComponent + experienceComponent + warrantyComponent + reliabilityComponent) / values.reduce((sum, value) => sum + value, 0);

  const reasons = [
    `${serviceMatch ? 'Service area fits' : 'Area mismatch'} ${request.serviceArea}`,
    `${capacityFit ? 'Supports' : 'Below required'} ${request.desiredCapacityKw} kWp`,
    `${budgetFit ? 'Budget aligns' : 'Budget may need review'} for the requested scale`,
    `Timeline ${provider.quoteLeadTimeWeeks} weeks${timelineFit ? ' meets the target' : ' is slower than target'}`
  ];

  return {
    score: Number(score.toFixed(1)),
    reasons,
    eligible: eligibility,
    estimatedQuoteInr: Math.round(provider.baseRatePerKwInr * request.desiredCapacityKw)
  };
};

export const getInstallerRecommendations = (
  request: RecommendationRequest,
  weights: MatchWeights = SOLAR_MATCH_WEIGHTS
): Array<{ provider: InstallerProfile; score: number; reasons: string[]; eligible: boolean; estimatedQuoteInr: number }> => {
  return SOLAR_MATCH_PROVIDERS
    .map((provider) => ({
      provider,
      ...scoreProvider(provider, request, weights)
    }))
    .filter((entry) => entry.eligible)
    .sort((a, b) => b.score - a.score);
};
