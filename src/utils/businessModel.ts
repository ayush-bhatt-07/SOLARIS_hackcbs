import type { BusinessProperty, MallShop } from '../types/commercial';
import { compareCommercialSystemSizes, percentagePoolPaise } from './commercialFinancialEngine';

export const businessScenarios = (property: BusinessProperty) => {
  const p = property.inputs;
  return compareCommercialSystemSizes({
    monthlyConsumptionKwh: p.consumptionKwh, tariffInrPerKwh: p.tariff,
    fixedChargesInr: p.fixedCharges, demandKw: p.demandKw, demandChargeInrPerKw: p.demandRate,
    monthlyGenerationKwhPerKwp: p.yieldKwhPerKwp, selfConsumptionRatio: p.selfUseRatio,
    exportSettlementInrPerKwh: p.exportRate, installationCostPerKwpInr: p.costPerKwp,
    analysisYears: 20, discountRate: 0.1,
  }).map(row => ({ ...row, roofFits: row.capacityKwp * 10 <= p.roofAreaM2 }));
};

// Hypothetical internal benefits only. Integer paise with largest-remainder rounding.
export const businessLedger = (property: BusinessProperty) => {
  const scenario = businessScenarios(property).find(s => s.capacityKwp === property.selectedCapacity)!;
  const policy = property.benefitPolicies?.find(p => p.version === property.policyVersion);
  const period = policy?.period ?? '2026-10';
  const readingFor = (shop: MallShop) => property.readings?.find(r => r.meterId === shop.meterId && r.period === period);
  const consumptionFor = (shop: MallShop) => property.readings ? readingFor(shop)?.consumptionKwh ?? 0 : shop.consumptionKwh;
  const eligible = property.shops.filter(s => s.status === 'active' && (!policy || policy.eligibleShopIds.includes(s.id)) && consumptionFor(s) > 0);
  const usage = eligible.reduce((sum, s) => sum + consumptionFor(s), 0);
  const poolPaise = scenario.roofFits
    ? percentagePoolPaise(Math.max(0, scenario.result.monthlySavingsInr), policy?.sharingPercent ?? property.inputs.sharingPercent)
    : 0;
  const shares = eligible.map(shop => {
    const exact = usage > 0 ? poolPaise * consumptionFor(shop) / usage : 0;
    return { id: shop.id, paise: Math.floor(exact), remainder: exact % 1 };
  });
  let remaining = usage > 0 ? poolPaise - shares.reduce((sum, s) => sum + s.paise, 0) : 0;
  const ordered = [...shares].sort((a, b) => b.remainder - a.remainder || a.id.localeCompare(b.id));
  for (const share of ordered) { if (remaining-- > 0) share.paise += 1; }
  const statements = property.shops.map(shop => ({
    shopId: shop.id, consumptionKwh: consumptionFor(shop), period,
    benefitInr: (shares.find(s => s.id === shop.id)?.paise ?? 0) / 100,
    benefitType: 'PROJECTION' as const, policyVersion: property.policyVersion,
    sourceState: 'ESTIMATED' as const,
    readingSource: readingFor(shop)?.sourceState ?? 'SYNTHETIC',
    calculation: { poolPaise, eligibleConsumptionKwh: usage, shopConsumptionKwh: consumptionFor(shop),
      eligible: eligible.some(s => s.id === shop.id), method: 'CONSUMPTION_WEIGHTED', rounding: 'LARGEST_REMAINDER_PAISE' },
  }));
  return { poolInr: poolPaise / 100, allocatedInr: shares.reduce((sum, s) => sum + s.paise, 0) / 100, statements,
    period, eligibleConsumptionKwh: usage, policyVersion: property.policyVersion, calculationVersion: 'energytwin-1',
    assumptions: { sharingPercent: policy?.sharingPercent ?? property.inputs.sharingPercent,
      eligibleSavingsInr: scenario.result.monthlySavingsInr, sourceState: 'SYNTHETIC', benefitType: 'PROJECTION',
      officialVnmCredit: false, selfUseRatio: property.inputs.selfUseRatio } };
};

export const SHOP_LABELS: Record<MallShop['status'], string> = {
  active: 'Active arrangement', pending: 'Agreement pending', eligible: 'Proposed / eligible',
  unconfigured: 'Not participating', issue: 'Data issue',
};
