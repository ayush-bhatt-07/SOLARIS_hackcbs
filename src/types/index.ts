export type UserRole = 
  | 'household'
  | 'msme'
  | 'rwa_coordinator'
  | 'installer_partner'
  | 'admin_auditor'
  | 'platform_admin'
  | 'society_admin'
  | 'household_member'
  | 'commercial_property_owner'
  | 'facility_manager'
  | 'shop_tenant'
  | 'installer_admin'
  | 'installer_engineer';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  avatarUrl: string;
  city: string;
  discom: 'BRPL' | 'BYPL' | 'TPDDL';
  consumerNumber: string; // CA Number
  sanctionedLoadKw: number;
  tariffCategory: 'Domestic' | 'Non-Domestic' | 'Industrial';
  housingType: 'Apartment' | 'Independent' | 'MSME';
  terraceAccess: 'Shared' | 'Private';
  terraceAreaSqFt: number;
  monthlyBillInr: number;
  monthlyConsumptionKwh: number;
  upfrontBudgetInr: number;
  maxMonthlyContributionInr: number;
  primaryGoal: 'vnm' | 'capex' | 'resco';
  communityId?: string;
  consentSigned?: boolean;
  consentDate?: string;
  onboardingCompleted?: boolean;
  needsOnboarding?: boolean;
}

export interface CommunityMember {
  id: string;
  flatNumber: string;
  tower: string;
  ownerName: string;
  caNumber: string;
  sanctionedLoadKw: number;
  monthlyConsumptionKwh: number;
  monthlyBillInr: number;
  maxUpfrontBudgetInr: number;
  allocatedKw: number;
  allocationPercentage: number;
  allocatedKwhPerMonth: number;
  depositPaidInr: number;
  status: 'signed_deposited' | 'kyc_verified' | 'pending_invite' | 'withdrawn';
  consentSigned: boolean;
  tier: 'Tier A' | 'Tier B' | 'Tier C';
}

export interface CommunityProject {
  id: string;
  name: string;
  location: string;
  discom: 'BRPL' | 'BYPL' | 'TPDDL';
  clusterCircle: string;
  coordinatorName: string;
  coordinatorRole: string;
  status: 'planning' | 'member_consent' | 'discom_submitted' | 'discom_approved' | 'commissioned';
  currentStep: number;
  totalSteps: number;
  proposedCapacityKw: number;
  totalRoofAreaSqFt: number;
  shadowFreePercentage: number;
  grossOutlayInr: number;
  netTargetInr: number;
  subsidyEligibleInr: number;
  totalCommittedInr: number;
  committedMembersCount: number;
  totalEligibleFlats: number;
  members: CommunityMember[];
}

export interface SolarCalculationResult {
  monthlyConsumptionKwh: number;
  recommendedCapacityKw: number;
  estAnnualGenerationKwh: number;
  estMonthlyGenerationKwh: number;
  grossInstallationCostInr: number;
  subsidyInr: number;
  netInstallationCostInr: number;
  monthlySavingsInr: number;
  paybackYears: number;
  annualRoiPercentage: number;
  roofAreaRequiredSqFt: number;
  roofSpaceUtilisationPercentage: number;
  co2OffsetTonsPerYear: number;
  gridOffsetPercentage: number;
  exportSurplusInr: number;
}

export interface RegulatoryRule {
  id: string;
  pathway: 'vnm' | 'capex' | 'gnm' | 'p2p' | 'resco';
  name: string;
  status: 'eligible' | 'potentially_eligible' | 'needs_verification' | 'restricted';
  category: 'residential' | 'commercial' | 'both';
  badge: string;
  summary: string;
  targetAudience: string;
  requiredDocuments: string[];
  discomApprovalPathway: string;
  policyCitation: string;
  docketNumber: string;
  lastReviewedDate: string;
  statutoryChecklist: {
    title: string;
    description: string;
    satisfied: boolean;
  }[];
}

export interface OptimisationParams {
  roofAreaSqFt: number;
  targetCapacityKw: 10 | 12 | 15;
  budgetCeilingInr: number;
  financingRatePercentage: number;
  participantCapInr: number;
  stressFactors: {
    monsoonDrop: boolean;     // -20% yield
    rateSpike: boolean;       // +1.5% interest
    unitDropOut: boolean;     // 1 unit drops out
    subsidyDelay: boolean;    // 6 months subsidy delay
  };
}

export interface OptimisationResult {
  isFeasible: boolean;
  solverStatus: 'optimal' | 'suboptimal' | 'infeasible';
  solverVersion: string;
  includedCount: number;
  totalCount: number;
  avgNetMonthlySavingsInr: number;
  avgGridOffsetInr: number;
  avgEmiInr: number;
  selectedMembers: {
    memberId: string;
    flatNumber: string;
    sharePercentage: number;
    shareKw: number;
    monthlySavingsInr: number;
    monthlyContributionInr: number;
    netBenefitInr: number;
  }[];
  worstCaseMonthlySavingsInr: number;
  resilienceRating: 'Robust Surplus Buffer' | 'Moderate Reserve Margin' | 'High Risk';
  comparison: {
    baselineType: 'optimal' | 'equal_split' | 'individual';
    participationCount: number;
    totalSavingsPerMonth: number;
    fairnessIndex: number; // 0 - 100
  };
}

export interface CreditAllocationRecord {
  cycleMonth: string;
  totalAllocableKwh: number;
  discomSettlementStatus: 'draft' | 'member_approved' | 'discom_submitted' | 'discom_approved' | 'settled';
  auditPassed: boolean;
  shares: {
    memberId: string;
    flatNumber: string;
    ownerName: string;
    tier: string;
    sanctionedLoadKw: number;
    monthlyConsumptionKwh: number;
    allocationPercentage: number;
    allocatedKwh: number;
    estTariffBenefitInr: number;
    verified: boolean;
  }[];
}

export interface PartnerQuote {
  id: string;
  companyName: string;
  rating: number;
  reviewCount: number;
  tier: 'Diamond Tier' | 'Gold Tier' | 'Verified Specialist';
  baseRatePerKwInr: number;
  totalQuotationInr: number;
  warrantyPanelsYears: number;
  warrantyInverterYears: number;
  omIncludedYears: number;
  discomLiaisonIncluded: boolean;
  estimatedCommissioningWeeks: number;
  dcrModules: boolean; // Domestic Content Requirement
  badges: string[];
}

export interface MaintenanceTicket {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'scheduled' | 'resolved';
  component: string;
  reportedDate: string;
  assignedEngineer: string;
  estimatedResolutionDate: string;
  description: string;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  details: string;
  category: 'regulatory' | 'financial' | 'consent' | 'system';
}

