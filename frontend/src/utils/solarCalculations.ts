import { SolarCalculationResult } from '../types';

/**
 * Delhi DERC Tariff Order FY 2024-25 calculation helper.
 * Approximates monthly units (kWh) from electricity bill amount (INR) for LT-1 Domestic.
 */
export function estimateMonthlyKwhFromBill(billAmountInr: number): number {
  if (billAmountInr <= 0) return 0;
  // Effective blended rate for Delhi LT-1 domestic including fixed charges & surcharges (PPAC + Duty)
  // ~₹8.50 to ₹9.50 per unit effective for higher consumption, lower for minimal
  if (billAmountInr <= 1200) {
    return Math.round(billAmountInr / 5.5);
  } else if (billAmountInr <= 3500) {
    return Math.round(billAmountInr / 7.2);
  } else if (billAmountInr <= 8000) {
    return Math.round(billAmountInr / 8.8);
  } else {
    return Math.round(billAmountInr / 9.6);
  }
}

/**
 * Calculates national PM Surya Ghar: Muft Bijli Yojana subsidy.
 * Under official guidelines:
 * - 1 kW: ₹30,000
 * - 2 kW: ₹60,000
 * - 3 kW or higher: ₹78,000 (capped at ₹78,000)
 * Note: Subsidies only apply to residential category.
 */
export function calculatePmSuryaGharSubsidy(capacityKw: number, isResidential: boolean = true): number {
  if (!isResidential || capacityKw <= 0) return 0;
  if (capacityKw < 1.0) {
    return Math.round(capacityKw * 30000);
  } else if (capacityKw <= 2.0) {
    return Math.round(capacityKw * 30000);
  } else {
    return 78000;
  }
}

export interface SolarCalculatorInputs {
  monthlyBillInr: number;
  monthlyConsumptionKwh?: number;
  terraceAreaSqFt: number;
  sanctionedLoadKw: number;
  isResidential?: boolean;
  costPerKwInr?: number; // default ~₹50,000
  shadingLossPercentage?: number; // default 6% (94% shadow-free)
  annualYieldKwhPerKwp?: number; // Delhi standard 1420 kWh/kWp/yr
}

/**
 * Comprehensive deterministic solar feasibility assessment
 */
export function calculateSolarFeasibility(inputs: SolarCalculatorInputs): SolarCalculationResult {
  const {
    monthlyBillInr,
    terraceAreaSqFt,
    sanctionedLoadKw,
    isResidential = true,
    costPerKwInr = 50000,
    shadingLossPercentage = 6,
    annualYieldKwhPerKwp = 1420
  } = inputs;

  const monthlyConsumptionKwh = inputs.monthlyConsumptionKwh && inputs.monthlyConsumptionKwh > 0
    ? inputs.monthlyConsumptionKwh
    : estimateMonthlyKwhFromBill(monthlyBillInr);

  // Physical roof limit: 1 kWp needs ~90-100 sq.ft of RCC flat terrace
  const roofConstrainedKw = Math.max(0.5, Math.floor((terraceAreaSqFt / 95) * 10) / 10);

  // Electrical load limit: DERC allows max 100% of sanctioned load for residential net metering
  const loadConstrainedKw = sanctionedLoadKw > 0 ? sanctionedLoadKw : 5.0;

  // Energy offset target: capacity needed to produce ~90-100% of annual consumption
  const annualTargetKwh = monthlyConsumptionKwh * 12;
  const energyTargetKw = Math.max(0.5, Math.round((annualTargetKwh / annualYieldKwhPerKwp) * 10) / 10);

  // Recommended capacity is the safe minimum of all three constraints
  const recommendedCapacityKw = Math.min(roofConstrainedKw, loadConstrainedKw, energyTargetKw);

  // Generation modeling
  const effectiveYieldRate = annualYieldKwhPerKwp * (1 - shadingLossPercentage / 100);
  const estAnnualGenerationKwh = Math.round(recommendedCapacityKw * effectiveYieldRate);
  const estMonthlyGenerationKwh = Math.round(estAnnualGenerationKwh / 12);

  // Financial modeling
  const grossInstallationCostInr = Math.round(recommendedCapacityKw * costPerKwInr);
  const subsidyInr = calculatePmSuryaGharSubsidy(recommendedCapacityKw, isResidential);
  const netInstallationCostInr = Math.max(0, grossInstallationCostInr - subsidyInr);

  // Savings modeling (Delhi average LT-1 tariff slab credit is ~₹8.20/kWh)
  const tariffPerKwh = isResidential ? 8.20 : 10.50;
  const monthlySavingsInr = Math.min(
    monthlyBillInr,
    Math.round(estMonthlyGenerationKwh * tariffPerKwh)
  );

  // Annual O&M cost assumption: 1.2% of gross capex
  const annualOmCostInr = Math.round(grossInstallationCostInr * 0.012);
  const annualNetSavingsInr = (monthlySavingsInr * 12) - annualOmCostInr;

  const paybackYears = annualNetSavingsInr > 0
    ? Math.max(1.5, Math.round((netInstallationCostInr / annualNetSavingsInr) * 10) / 10)
    : 10;

  const annualRoiPercentage = netInstallationCostInr > 0
    ? Math.round((annualNetSavingsInr / netInstallationCostInr) * 1000) / 10
    : 0;

  // Roof space utilization
  const roofAreaRequiredSqFt = Math.round(recommendedCapacityKw * 95);
  const roofSpaceUtilisationPercentage = terraceAreaSqFt > 0
    ? Math.min(100, Math.round((roofAreaRequiredSqFt / terraceAreaSqFt) * 100))
    : 0;

  // Ecological impact (CEA standard grid emission factor for India is ~0.82 kg CO2 / kWh)
  const co2OffsetTonsPerYear = Math.round((estAnnualGenerationKwh * 0.82) / 1000 * 10) / 10;

  const gridOffsetPercentage = monthlyConsumptionKwh > 0
    ? Math.min(100, Math.round((estMonthlyGenerationKwh / monthlyConsumptionKwh) * 100))
    : 80;

  const exportSurplusInr = Math.max(0, Math.round((estMonthlyGenerationKwh - monthlyConsumptionKwh) * 3.50));

  return {
    monthlyConsumptionKwh,
    recommendedCapacityKw,
    estAnnualGenerationKwh,
    estMonthlyGenerationKwh,
    grossInstallationCostInr,
    subsidyInr,
    netInstallationCostInr,
    monthlySavingsInr,
    paybackYears,
    annualRoiPercentage,
    roofAreaRequiredSqFt,
    roofSpaceUtilisationPercentage,
    co2OffsetTonsPerYear,
    gridOffsetPercentage,
    exportSurplusInr
  };
}
