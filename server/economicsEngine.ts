import type { BusinessProperty } from '../src/types/commercial';
import type { EconomicsInputs, EconomicsResult } from '../src/types/economics';
import { calculateCommercialFinancials, percentagePoolPaise, chargePaise } from '../src/utils/commercialFinancialEngine';

export const economicsDefaults = (p: BusinessProperty): EconomicsInputs => ({
  period: p.bills.some(b => b.month === p.benefitPolicies?.find(policy => policy.version === p.policyVersion)?.period) ? p.benefitPolicies!.find(policy => policy.version === p.policyVersion)!.period : p.bills.at(-1)?.month ?? '2026-10', capacityKwp: 200, capexPerKwp: p.inputs.costPerKwp,
  annualMaintenance: 180000, tariff: p.inputs.tariff, tenantShare: p.inputs.sharingPercent,
  exportRate: 0, otherAnnualCosts: 0, discountRate: 10, budget: 12000000,
});
export function validateEconomics(raw: unknown, p: BusinessProperty): EconomicsInputs {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Scenario inputs are required.');
  const input = raw as EconomicsInputs;
  if (!p.bills.some(b => b.month === input.period)) throw new Error('Choose a recorded billing period.');
  const limits: Record<Exclude<keyof EconomicsInputs, 'period'>, [number, number]> = {
    capacityKwp: [0, 2000], capexPerKwp: [1, 200000], annualMaintenance: [0, 100000000],
    tariff: [0, 100], tenantShare: [0, 100], exportRate: [0, 100], otherAnnualCosts: [0, 100000000],
    discountRate: [0, 50], budget: [0, 1000000000],
  };
  for (const [key, [min, max]] of Object.entries(limits)) {
    const v = input[key as keyof EconomicsInputs];
    if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max) throw new Error(`${key} must be between ${min} and ${max}.`);
  }
  return Object.fromEntries(['period', ...Object.keys(limits)].map(k => [k, input[k as keyof EconomicsInputs]])) as unknown as EconomicsInputs;
}
const paise = (n: number) => chargePaise(n);
export function simulateEconomics(p: BusinessProperty, raw: unknown): EconomicsResult {
  const i = validateEconomics(raw, p), source = p.inputs;
  const load = p.bills.find(b => b.month === i.period)!.consumptionKwh;
  const r = calculateCommercialFinancials({ monthlyConsumptionKwh: load, tariffInrPerKwh: i.tariff,
    fixedChargesInr: source.fixedCharges, demandKw: source.demandKw, demandChargeInrPerKw: source.demandRate,
    installationCapacityKwp: i.capacityKwp, monthlyGenerationKwhPerKwp: source.yieldKwhPerKwp,
    selfConsumptionRatio: source.selfUseRatio, exportSettlementInrPerKwh: i.exportRate,
    installationCostPerKwpInr: i.capexPerKwp });
  const energyBefore = chargePaise(load, i.tariff), energyAfter = chargePaise(r.importedKwh, i.tariff);
  const fixed = paise(source.fixedCharges), demand = chargePaise(source.demandKw, source.demandRate);
  // Export value is capped at remaining bill charges; unused credit is not assumed paid out.
  const credit = Math.min(chargePaise(r.exportedKwh, i.exportRate), energyAfter + fixed + demand);
  const avoidedPaise = energyBefore - energyAfter;
  const gross = (avoidedPaise + credit) * 12;
  const net = gross - paise(i.annualMaintenance) - paise(i.otherAnnualCosts);
  const policy = p.benefitPolicies?.find(policy => policy.version === p.policyVersion);
  const tenants = p.shops.map(s => {
    const reading = p.readings?.find(r => r.meterId === s.meterId && r.period === i.period);
    // Missing submeter readings are not silently substituted with another period.
    const usage = reading?.consumptionKwh ?? 0;
    return { id: s.id, name: s.name, usage, benefit: 0, before: chargePaise(usage, i.tariff) / 100,
      after: chargePaise(usage, i.tariff) / 100, agreement: s.agreement, readingSource: reading?.sourceState ?? 'MISSING',
      eligible: s.status === 'active' && usage > 0 && !!policy?.eligibleShopIds.includes(s.id) };
  });
  const eligible = tenants.filter(t => t.eligible);
  const usage = eligible.reduce((s, t) => s + t.usage, 0);
  // Share only positive net benefit, capped to the eligible tenants' energy costs.
  const poolPaise = usage > 0 ? Math.min(percentagePoolPaise(Math.max(0, net / 1200), i.tenantShare), eligible.reduce((s, t) => s + paise(t.before), 0)) : 0;
  const portions = eligible.map(t => ({ t, exact: poolPaise * t.usage / usage, amount: Math.floor(poolPaise * t.usage / usage) }));
  let remainder = poolPaise - portions.reduce((s, x) => s + x.amount, 0);
  portions.sort((a, b) => (b.exact - b.amount) - (a.exact - a.amount) || a.t.id.localeCompare(b.t.id));
  for (const x of portions) { if (remainder > 0) { x.amount++; remainder--; } x.t.benefit = x.amount / 100; x.t.after = (paise(x.t.before) - x.amount) / 100; }
  const retained = net - poolPaise * 12, capex = paise(r.installationCostInr);
  const cashflow = Array.from({ length: 26 }, (_, year) => ({ year, plant: (-capex + net * year) / 100, investor: (-capex + retained * year) / 100 }));
  const npvAt = (rate: number) => -capex + Array.from({ length: 25 }, (_, y) => retained / (1 + rate) ** (y + 1)).reduce((a, b) => a + b, 0);
  let irr: number | null = null;
  if (capex > 0 && retained > 0 && npvAt(-0.99) > 0 && npvAt(100) < 0) {
    let low = -0.99, high = 100;
    for (let n = 0; n < 150; n++) { const mid = (low + high) / 2; if (npvAt(mid) > 0) low = mid; else high = mid; }
    irr = (low + high) / 2 * 100;
  }
  const bill = (energy: number, credits: number) => ({ energy: energy / 100, demand: demand / 100, fixed: fixed / 100, taxes: 0, credits: -credits / 100, total: (energy + demand + fixed - credits) / 100 });
  return { inputs: i, propertyId: p.id, calculationVersion: 'economics-1', tariffVersion: 'illustrative-flat-v1',
    generation: r.generationKwh, selfUse: r.selfConsumedKwh, exported: r.exportedKwh, imported: r.importedKwh, load,
    before: bill(energyBefore, 0), after: bill(energyAfter, credit), capex: capex / 100,
    avoided: avoidedPaise / 100, exportValue: credit / 100, annualGross: gross / 100, annualNet: net / 100,
    tenantAnnual: poolPaise * 12 / 100, retained: retained / 100,
    plantPayback: net > 0 && capex > 0 ? capex / net : null, investorPayback: retained > 0 && capex > 0 ? capex / retained : null,
    npv: Math.round(npvAt(i.discountRate / 100)) / 100, irr, cashflow, tenants, pool: poolPaise / 100,
    allocated: portions.reduce((s, x) => s + x.amount, 0) / 100, policyVersion: p.policyVersion,
    roofFits: i.capacityKwp * 10 <= source.roofAreaM2, budgetFits: capex / 100 <= i.budget,
    provenance: `Property: ${p.sourceState}; ${i.period} billing: ${p.bills.find(b => b.month === i.period)!.sourceState}; submeter sources shown per shop; generation: saved yield and monthly self-use assumption; costs/tariff/sharing: operator scenario inputs`,
    assumptions: [
      'Monthly load model: no interval load profile is stored. Self-use is generation × saved self-use ratio, capped by site consumption.',
      'Annual projection repeats this selected month 12 times; 25-year flat real cash flows, no escalation, degradation, replacement or financing.',
      'Fixed and demand charges remain unchanged. Taxes/surcharges are zero because no validated tax schedule is stored.',
      'Export rate defaults to zero. Any nonzero rate is an operator assumption, capped at remaining bill charges; eligibility is unverified.',
      'Tenant pool shares positive net operating benefit after costs, capped by participating tenants’ energy charges. Missing period readings receive no allocation.',
      `Policy v${p.policyVersion}, consumption weighted, largest-remainder paise. Scenario sharing overrides the saved percentage without editing the agreement.`,
      'Internal benefit projections only, not official VNM credits. NPV/IRR are illustrative unlevered investor estimates using the stated forecast.',
    ] };
}
