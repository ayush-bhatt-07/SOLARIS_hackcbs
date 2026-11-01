export interface EconomicsInputs {
  period: string; capacityKwp: number; capexPerKwp: number; annualMaintenance: number;
  tariff: number; tenantShare: number; exportRate: number; otherAnnualCosts: number;
  discountRate: number; budget: number;
}
export interface EconomicsResult {
  inputs: EconomicsInputs; propertyId: string; calculationVersion: string; tariffVersion: string;
  generation: number; selfUse: number; exported: number; imported: number; load: number;
  before: { energy: number; demand: number; fixed: number; taxes: number; credits: number; total: number };
  after: EconomicsResult['before']; capex: number; avoided: number; exportValue: number;
  annualGross: number; annualNet: number; tenantAnnual: number; retained: number;
  plantPayback: number | null; investorPayback: number | null; npv: number; irr: number | null;
  cashflow: { year: number; plant: number; investor: number }[];
  tenants: { id: string; name: string; usage: number; benefit: number; before: number; after: number; agreement: string; eligible: boolean; readingSource: string }[];
  pool: number; allocated: number; policyVersion: number; assumptions: string[];
  provenance: string; roofFits: boolean; budgetFits: boolean;
}
export interface EconomicsScenario {
  id: string; propertyId: string; organisationId: string; name: string; version: number;
  createdAt: string; result: EconomicsResult;
}
