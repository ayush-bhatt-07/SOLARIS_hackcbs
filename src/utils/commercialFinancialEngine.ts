export interface CommercialInterval {
  consumptionKwh: number;
  generationKwh: number;
  tariffInrPerKwh?: number;
}

export interface CommercialFinancialInput {
  monthlyConsumptionKwh: number;
  tariffInrPerKwh: number;
  fixedChargesInr: number;
  demandKw: number;
  demandChargeInrPerKw: number;
  installationCapacityKwp: number;
  monthlyGenerationKwhPerKwp: number;
  selfConsumptionRatio?: number;
  exportSettlementInrPerKwh: number;
  installationCostPerKwpInr: number;
  additionalInstallationCostInr?: number;
  analysisYears?: number;
  annualEscalationRate?: number;
  discountRate?: number;
  intervals?: CommercialInterval[];
}

export interface CommercialFinancialResult {
  assumptions: {
    method: 'monthly-assumption' | 'interval-accounting';
    selfConsumptionRatio: number;
    exportSettlementInrPerKwh: number;
    installationCapacityKwp: number;
  };
  generationKwh: number;
  selfConsumedKwh: number;
  importedKwh: number;
  exportedKwh: number;
  billBeforeSolarInr: number;
  billAfterSolarInr: number;
  monthlySavingsInr: number;
  annualSavingsInr: number;
  billReductionPercentage: number;
  installationCostInr: number;
  simplePaybackYears: number | null;
  npvInr: number | null;
  irrPercentage: number | null;
}

const positive = (value: number): number => Math.max(0, Number.isFinite(value) ? value : 0);
const money = (value: number): number => Math.round(value * 100) / 100;

// Convert decimal input text to a rational before multiplication, then round each
// charge half-up to integer paise. This avoids binary floating-point money sums.
const decimalFraction = (value: number): [bigint, bigint] => {
  const [mantissa, exponentText = '0'] = positive(value).toString().toLowerCase().split('e');
  const [whole, fraction = ''] = mantissa.split('.');
  const exponent = Number(exponentText) - fraction.length;
  const numerator = BigInt(whole + fraction);
  return exponent >= 0 ? [numerator * 10n ** BigInt(exponent), 1n] : [numerator, 10n ** BigInt(-exponent)];
};
export const chargePaise = (units: number, rate = 1): number => {
  const [u, ud] = decimalFraction(units);
  const [r, rd] = decimalFraction(rate);
  const divisor = ud * rd;
  return Number((u * r * 100n * 2n + divisor) / (divisor * 2n));
};
export const percentagePoolPaise = (amountInr: number, percentage: number): number => {
  const [numerator, denominator] = decimalFraction(percentage);
  return Number(BigInt(chargePaise(amountInr)) * numerator / (denominator * 100n));
};

const monthlyBillBefore = (input: CommercialFinancialInput, consumptionKwh = input.monthlyConsumptionKwh): number =>
  (chargePaise(consumptionKwh, input.tariffInrPerKwh) +
  chargePaise(input.fixedChargesInr) +
  chargePaise(input.demandKw, input.demandChargeInrPerKw)) / 100;

const calculateIrr = (cashFlows: number[]): number | null => {
  if (cashFlows.length < 2 || cashFlows[0] >= 0 || !cashFlows.slice(1).some((flow) => flow > 0)) return null;
  let rate = 0.01;
  for (let iteration = 0; iteration < 100; iteration += 1) {
    let npv = 0;
    let derivative = 0;
    cashFlows.forEach((flow, month) => {
      const factor = Math.pow(1 + rate, month);
      npv += flow / factor;
      if (month > 0) derivative -= (month * flow) / (factor * (1 + rate));
    });
    if (Math.abs(npv) < 0.01) return rate;
    if (!Number.isFinite(derivative) || derivative === 0) return null;
    rate -= npv / derivative;
    if (rate <= -0.9999 || rate > 10) return null;
  }
  return null;
};

export const calculateCommercialFinancials = (input: CommercialFinancialInput): CommercialFinancialResult => {
  const capacity = positive(input.installationCapacityKwp);
  const assumedRatio = Math.min(1, Math.max(0, input.selfConsumptionRatio ?? 0.65));
  const generatedByMonth = capacity * positive(input.monthlyGenerationKwhPerKwp);
  let before = monthlyBillBefore(input);
  let generationKwh = generatedByMonth;
  let selfConsumedKwh = Math.min(positive(input.monthlyConsumptionKwh), generatedByMonth * assumedRatio);
  let importedKwh = positive(input.monthlyConsumptionKwh) - selfConsumedKwh;
  let exportedKwh = Math.max(0, generatedByMonth - selfConsumedKwh);
  const unchangedPaise = chargePaise(input.fixedChargesInr) + chargePaise(input.demandKw, input.demandChargeInrPerKw);
  let after = (chargePaise(importedKwh, input.tariffInrPerKwh) + unchangedPaise -
    chargePaise(exportedKwh, input.exportSettlementInrPerKwh)) / 100;
  let method: CommercialFinancialResult['assumptions']['method'] = 'monthly-assumption';

  if (input.intervals && input.intervals.length > 0) {
    method = 'interval-accounting';
    generationKwh = input.intervals.reduce((sum, interval) => sum + positive(interval.generationKwh), 0);
    selfConsumedKwh = input.intervals.reduce((sum, interval) => sum + Math.min(positive(interval.consumptionKwh), positive(interval.generationKwh)), 0);
    importedKwh = input.intervals.reduce((sum, interval) => sum + Math.max(0, positive(interval.consumptionKwh) - positive(interval.generationKwh)), 0);
    exportedKwh = input.intervals.reduce((sum, interval) => sum + Math.max(0, positive(interval.generationKwh) - positive(interval.consumptionKwh)), 0);
    const variableBeforePaise = input.intervals.reduce((sum, interval) => sum + chargePaise(interval.consumptionKwh, interval.tariffInrPerKwh ?? input.tariffInrPerKwh), 0);
    const variableAfterPaise = input.intervals.reduce((sum, interval) => sum + chargePaise(Math.max(0, positive(interval.consumptionKwh) - positive(interval.generationKwh)), interval.tariffInrPerKwh ?? input.tariffInrPerKwh), 0);
    after = (variableAfterPaise + unchangedPaise - chargePaise(exportedKwh, input.exportSettlementInrPerKwh)) / 100;
    // Keep fixed and demand charges in both cases; only interval energy is time-sensitive.
    before = (variableBeforePaise + unchangedPaise) / 100;
  }

  const monthlySavingsInr = Math.max(0, chargePaise(before) - chargePaise(Math.max(0, after))) / 100;
  const installationCostInr = (chargePaise(capacity, input.installationCostPerKwpInr) + chargePaise(input.additionalInstallationCostInr ?? 0)) / 100;
  const annualSavingsInr = chargePaise(monthlySavingsInr) * 12 / 100;
  const analysisYears = Math.max(1, Math.floor(input.analysisYears ?? 10));
  const escalation = Math.max(-0.99, input.annualEscalationRate ?? 0);
  const discount = Math.max(-0.99, input.discountRate ?? 0.1);
  const cashFlows = [-installationCostInr];
  for (let month = 1; month <= analysisYears * 12; month += 1) {
    cashFlows.push(monthlySavingsInr * Math.pow(1 + escalation, Math.floor((month - 1) / 12)));
  }
  const npvInr = installationCostInr > 0
    ? cashFlows.reduce((sum, flow, month) => sum + flow / Math.pow(1 + discount, month / 12), 0)
    : null;

  const monthlyIrr = calculateIrr(cashFlows);
  return {
    assumptions: {
      method,
      selfConsumptionRatio: method === 'monthly-assumption' ? assumedRatio : 0,
      exportSettlementInrPerKwh: positive(input.exportSettlementInrPerKwh),
      installationCapacityKwp: capacity
    },
    generationKwh: money(generationKwh),
    selfConsumedKwh: money(selfConsumedKwh),
    importedKwh: money(importedKwh),
    exportedKwh: money(exportedKwh),
    billBeforeSolarInr: money(before),
    billAfterSolarInr: money(Math.max(0, after)),
    monthlySavingsInr: money(monthlySavingsInr),
    annualSavingsInr: money(annualSavingsInr),
    billReductionPercentage: before > 0 ? money((monthlySavingsInr / before) * 100) : 0,
    installationCostInr: money(installationCostInr),
    simplePaybackYears: annualSavingsInr > 0 ? money(installationCostInr / annualSavingsInr) : null,
    npvInr: npvInr === null ? null : money(npvInr),
    irrPercentage: monthlyIrr === null ? null : money((Math.pow(1 + monthlyIrr, 12) - 1) * 100)
  };
};

export const compareCommercialSystemSizes = (
  input: Omit<CommercialFinancialInput, 'installationCapacityKwp'>,
  capacities: number[] = [100, 200, 300]
) => capacities.map((installationCapacityKwp) => ({
  capacityKwp: installationCapacityKwp,
  result: calculateCommercialFinancials({ ...input, installationCapacityKwp })
}));
