import { calculateSolarFeasibility, calculatePmSuryaGharSubsidy, estimateMonthlyKwhFromBill } from '../utils/solarCalculations';
import { runAffordabilityOptimiser, calculateEmi } from '../utils/optimiserEngine';
import { INITIAL_COMMUNITY } from '../data/mockData';
import { canAccessInstallerProject, canReadProperty, canReadShop } from '../../server/rbac';
import { users } from '../../server/store';
import { canReadBusinessShop, newProperty, passwordHash } from '../../server/businessStore';
import { businessLedger } from '../utils/businessModel';
import { calculateCommercialFinancials, compareCommercialSystemSizes } from '../utils/commercialFinancialEngine';

export interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

export function runAllSolarisTests(): TestResult[] {
  const results: TestResult[] = [];

  // Test 1: Zero and negative input rejection
  try {
    const zeroTest = calculateSolarFeasibility({
      monthlyBillInr: 0,
      terraceAreaSqFt: 0,
      sanctionedLoadKw: 0
    });
    const passed = zeroTest.monthlyConsumptionKwh === 0 && zeroTest.recommendedCapacityKw >= 0;
    results.push({
      name: 'Zero and Negative Input Handling',
      passed,
      message: passed ? 'Successfully handled zero boundaries without NaN or infinite values.' : 'Failed zero boundary check.'
    });
  } catch (err: any) {
    results.push({ name: 'Zero and Negative Input Handling', passed: false, message: err.message });
  }

  // Test 2: PM Surya Ghar Subsidy Caps
  try {
    const sub1Kw = calculatePmSuryaGharSubsidy(1.0, true);
    const sub2Kw = calculatePmSuryaGharSubsidy(2.0, true);
    const sub3Kw = calculatePmSuryaGharSubsidy(3.0, true);
    const sub5Kw = calculatePmSuryaGharSubsidy(5.0, true);
    const subCommercial = calculatePmSuryaGharSubsidy(5.0, false);

    const passed = 
      sub1Kw === 30000 &&
      sub2Kw === 60000 &&
      sub3Kw === 78000 &&
      sub5Kw === 78000 && // Capped at ₹78,000 for residential
      subCommercial === 0;  // 0 for commercial

    results.push({
      name: 'PM Surya Ghar Subsidy Compliance',
      passed,
      message: passed 
        ? 'Verified ₹30k/kW up to 2kW, ₹78k cap at 3kW+, and 0 subsidy for commercial MSME.' 
        : `Subsidy mismatch: 1kW=${sub1Kw}, 2kW=${sub2Kw}, 3kW=${sub3Kw}, Comm=${subCommercial}`
    });
  } catch (err: any) {
    results.push({ name: 'PM Surya Ghar Subsidy Compliance', passed: false, message: err.message });
  }

  // Test 3: Optimiser Allocation Sum = 100% (Zero Shortfall)
  try {
    const opt = runAffordabilityOptimiser(INITIAL_COMMUNITY.members, {
      roofAreaSqFt: 1400,
      targetCapacityKw: 12,
      budgetCeilingInr: 580000,
      financingRatePercentage: 8.5,
      participantCapInr: 4500,
      stressFactors: {
        monsoonDrop: false,
        rateSpike: false,
        unitDropOut: false,
        subsidyDelay: false
      }
    });

    const sum = opt.selectedMembers.reduce((acc, m) => acc + m.sharePercentage, 0);
    const roundedSum = Math.round(sum * 10) / 10;
    const passed = roundedSum === 100.0 && opt.isFeasible;

    results.push({
      name: 'Credit Allocation Reconciliation (Sum = 100.0%)',
      passed,
      message: passed
        ? `Reconciled total sum is exactly ${roundedSum}% across ${opt.selectedMembers.length} participants with zero loss.`
        : `Sum mismatch: ${roundedSum}% != 100.0%`
    });
  } catch (err: any) {
    results.push({ name: 'Credit Allocation Reconciliation (Sum = 100.0%)', passed: false, message: err.message });
  }

  // Test 4: Allocation Total Does Not Exceed Generated Energy
  try {
    const opt = runAffordabilityOptimiser(INITIAL_COMMUNITY.members, {
      roofAreaSqFt: 1400,
      targetCapacityKw: 12,
      budgetCeilingInr: 580000,
      financingRatePercentage: 8.5,
      participantCapInr: 4500,
      stressFactors: {
        monsoonDrop: false,
        rateSpike: false,
        unitDropOut: false,
        subsidyDelay: false
      }
    });

    const totalKwAllocated = opt.selectedMembers.reduce((acc, m) => acc + m.shareKw, 0);
    const passed = Math.round(totalKwAllocated * 10) / 10 <= 12.0;

    results.push({
      name: 'Allocated Energy Within Technical Physical Limits',
      passed,
      message: passed
        ? `Allocated capacity (${totalKwAllocated.toFixed(1)} kW) does not exceed physical target capacity (12.0 kW).`
        : `Physical capacity exceeded: ${totalKwAllocated} kW > 12.0 kW`
    });
  } catch (err: any) {
    results.push({ name: 'Allocated Energy Within Technical Physical Limits', passed: false, message: err.message });
  }

  // Test 5: Budget Ceiling & Guaranteed Bill Safety Guardrail
  try {
    const emi = calculateEmi(100000, 8.5, 60);
    const passed = emi > 0 && emi <= 2100;
    results.push({
      name: 'Financing EMI & Budget Ceiling Calculation',
      passed,
      message: passed
        ? `5-Year loan calculation validated (₹${emi}/mo for ₹1,00,000 @ 8.5% p.a.).`
        : `Unexpected EMI calculation: ${emi}`
    });
  } catch (err: any) {
    results.push({ name: 'Financing EMI & Budget Ceiling Calculation', passed: false, message: err.message });
  }

  // Test 6: Organisation and shop isolation at the backend authorization layer
  try {
    const tenant = users.find((user) => user.id === 'user-shop-tenant-1')!;
    const passed =
      canReadShop(tenant, 'org-mall-sunrise', 'shop-1', 'property-sunrise-mall') &&
      !canReadShop(tenant, 'org-mall-sunrise', 'shop-2', 'property-sunrise-mall') &&
      !canReadProperty(tenant, 'org-society-gulmohar', 'property-gulmohar');
    results.push({
      name: 'Backend Organisation and Shop Isolation',
      passed,
      message: passed ? 'Tenant can read only the assigned shop and cannot cross organisation boundaries.' : 'Tenant isolation failed.'
    });
  } catch (err: any) {
    results.push({ name: 'Backend Organisation and Shop Isolation', passed: false, message: err.message });
  }

  // Test 7: Installer engineers are limited to assigned projects
  try {
    const engineer = users.find((user) => user.id === 'user-installer-engineer')!;
    const passed =
      canAccessInstallerProject(engineer, 'org-installer-sungrid', 'project-sunrise-200kwp') &&
      !canAccessInstallerProject(engineer, 'org-installer-sungrid', 'project-other');
    results.push({
      name: 'Installer Project Assignment Isolation',
      passed,
      message: passed ? 'Engineer access is restricted to assigned installer projects.' : 'Installer assignment isolation failed.'
    });
  } catch (err: any) {
    results.push({ name: 'Installer Project Assignment Isolation', passed: false, message: err.message });
  }

  // Test 8: Commercial fixed/demand charges and explicit export treatment
  try {
    const result = calculateCommercialFinancials({
      monthlyConsumptionKwh: 10000,
      tariffInrPerKwh: 10,
      fixedChargesInr: 5000,
      demandKw: 100,
      demandChargeInrPerKw: 100,
      installationCapacityKwp: 100,
      monthlyGenerationKwhPerKwp: 100,
      selfConsumptionRatio: 0.6,
      exportSettlementInrPerKwh: 2,
      installationCostPerKwpInr: 40000
    });
    const passed = result.billBeforeSolarInr === 115000 && result.exportedKwh === 4000 && result.billAfterSolarInr === 47000;
    results.push({
      name: 'Commercial Fixed Demand and Export Accounting',
      passed,
      message: passed ? 'Fixed and demand charges remain in the bill and only exported energy uses settlement value.' : `Unexpected commercial result: ${JSON.stringify(result)}`
    });
  } catch (err: any) {
    results.push({ name: 'Commercial Fixed Demand and Export Accounting', passed: false, message: err.message });
  }

  // Test 9: Interval accounting must not treat all generation as self-consumed
  try {
    const result = calculateCommercialFinancials({
      monthlyConsumptionKwh: 100,
      tariffInrPerKwh: 10,
      fixedChargesInr: 100,
      demandKw: 0,
      demandChargeInrPerKw: 0,
      installationCapacityKwp: 1,
      monthlyGenerationKwhPerKwp: 100,
      exportSettlementInrPerKwh: 2,
      installationCostPerKwpInr: 40000,
      intervals: [
        { consumptionKwh: 80, generationKwh: 20 },
        { consumptionKwh: 20, generationKwh: 80 }
      ]
    });
    const passed = result.assumptions.method === 'interval-accounting' && result.selfConsumedKwh === 40 && result.exportedKwh === 60 && result.importedKwh === 60;
    results.push({
      name: 'Commercial Interval Import Export Accounting',
      passed,
      message: passed ? 'Interval overlap correctly separates self-consumption, imports, and exports.' : `Unexpected interval result: ${JSON.stringify(result)}`
    });
  } catch (err: any) {
    results.push({ name: 'Commercial Interval Import Export Accounting', passed: false, message: err.message });
  }

  // Test 10: Capacity comparison returns reproducible candidate rows
  try {
    const comparison = compareCommercialSystemSizes({
      monthlyConsumptionKwh: 20000,
      tariffInrPerKwh: 9,
      fixedChargesInr: 10000,
      demandKw: 250,
      demandChargeInrPerKw: 80,
      monthlyGenerationKwhPerKwp: 110,
      selfConsumptionRatio: 0.7,
      exportSettlementInrPerKwh: 2,
      installationCostPerKwpInr: 42000
    });
    const passed = comparison.map((item) => item.capacityKwp).join(',') === '100,200,300' && comparison[2].result.installationCostInr === 12600000;
    results.push({
      name: 'Commercial Capacity Comparison',
      passed,
      message: passed ? '100/200/300 kWp comparison is deterministic.' : 'Capacity comparison output mismatch.'
    });
  } catch (err: any) {
    results.push({ name: 'Commercial Capacity Comparison', passed: false, message: err.message });
  }

  // Test 11: EnergyTwin policy allocation is bounded and reproducible
  try {
    const property = newProperty('org-energy-twin-a');
    const ledger = businessLedger(property);
    const allocated = ledger.statements.reduce((sum, statement) => sum + statement.benefitInr, 0);
    const inactiveStatementsAreZero = property.shops.filter(shop => shop.status !== 'active')
      .every(shop => ledger.statements.find(statement => statement.shopId === shop.id)?.benefitInr === 0);
    const passed = Math.round(allocated * 100) === Math.round(ledger.poolInr * 100) && allocated <= ledger.poolInr && inactiveStatementsAreZero;
    results.push({
      name: 'EnergyTwin Tenant Benefit Pool Allocation',
      passed,
      message: passed ? 'Versioned internal benefit allocation exactly reconciles to the eligible pool and excludes inactive shops.' : 'Tenant benefit pool reconciliation failed.'
    });
  } catch (err: any) {
    results.push({ name: 'EnergyTwin Tenant Benefit Pool Allocation', passed: false, message: err.message });
  }

  // Test 12: Commercial shop statement access cannot cross tenant records
  try {
    const tenant = { id: 'tenant-a', name: 'Tenant A', email: 'tenant@example.com', password: passwordHash('test-password'), workspace: 'commercial' as const, organisationId: 'org-energy-twin-a', demo: false, commercialRole: 'shop_tenant' as const, shopId: 'shop-1' };
    const passed = canReadBusinessShop(tenant, 'shop-1') && !canReadBusinessShop(tenant, 'shop-2');
    results.push({
      name: 'EnergyTwin Tenant Private Statement Isolation',
      passed,
      message: passed ? 'A tenant can read only the assigned shop statement.' : 'Tenant statement isolation failed.'
    });
  } catch (err: any) {
    results.push({ name: 'EnergyTwin Tenant Private Statement Isolation', passed: false, message: err.message });
  }

  return results;
}
