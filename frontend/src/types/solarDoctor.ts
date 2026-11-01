import type { WeatherDay, WeatherReport } from './weatherDetective';

export type DoctorMode = 'demo' | 'property';
export type DoctorPriority = 'Critical' | 'High' | 'Medium' | 'Low' | 'Insufficient data';
export type DoctorState =
  | 'Draft' | 'Submitted' | 'Assigned' | 'Accepted' | 'Inspection Scheduled'
  | 'Inspection Completed' | 'Quote Submitted' | 'Awaiting Approval' | 'Approved'
  | 'In Progress' | 'Work Completed' | 'Verification Pending' | 'Verified'
  | 'Closed' | 'Reopened' | 'Cancelled';

export interface DoctorMoney {
  version: string;
  impactInr: number | null;
  energyShortfallKwh: number | null;
  expectedKwh: number | null;
  actualKwh: number | null;
  expectedImportKwh: number | null;
  actualImportKwh: number | null;
  exportDifferenceKwh: number | null;
  tariffInr: number;
  exportRateInr: number;
  tariffVersion: string;
  assumptions: string[];
}

export interface DoctorEvent {
  id: string;
  at: string;
  actorId: string;
  actorOrganisationId: string;
  action: string;
  detail: string;
}

export interface DoctorWarning {
  text: string;
  severity: 'info' | 'safety';
  source: string;
}

export interface DoctorIncident {
  id: string;
  organisationId: string;
  propertyId: string;
  installationId: string;
  datasetId: string;
  datasetSignature: string;
  mode: DoctorMode;
  start: string;
  end: string;
  kind: 'UNDERPERFORMANCE' | 'DATA_QUALITY';
  days: WeatherDay[];
  financial: DoctorMoney;
  modelVersion: string;
  baselineVersion: string;
  featureSchema: string[];
  site: WeatherReport['site'];
  priority: DoctorPriority;
  priorityReasons: string[];
  observed: string[];
  possible: string[];
  checks: string[];
  warnings: DoctorWarning[];
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  suppressedUntil?: string;
  suppressionReason?: string;
  createdAt: string;
  audit: DoctorEvent[];
}

export interface DoctorPartner {
  id: string;
  organisationId: string;
  propertyId: string;
  installerOrganisationId: string;
  name: string;
  providerId?: string;
  source: 'SYNTHETIC' | 'USER_AUTHORISED';
  active: boolean;
}

export interface DoctorAttachment {
  id: string;
  name: string;
  kind: 'inspection' | 'quote' | 'completion' | 'support';
  content: string;
  actorId: string;
  at: string;
  source: 'SYNTHETIC' | 'USER_PROVIDED';
}

export interface DoctorVerification {
  id: string;
  at: string;
  outcome: 'Improved' | 'No clear improvement' | 'Deteriorated' | 'Insufficient evidence';
  before: WeatherDay[];
  after: WeatherDay[];
  beforeRatio: number | null;
  afterRatio: number | null;
  changePercentagePoints: number | null;
  benefitInr: number | null;
  financial: DoctorMoney | null;
  baselineVersion: string;
  performedDate: string;
  limitations: string[];
}

export interface DoctorTicket {
  id: string;
  organisationId: string;
  propertyId: string;
  installationId: string;
  incidentId: string;
  mode: DoctorMode;
  description: string;
  state: DoctorState;
  priority: DoctorPriority;
  evidence: DoctorIncident;
  propertySnapshot: { name: string; city: string; capacityKwp: number };
  assignedInstallerOrganisationId?: string;
  assignedPartnerId?: string;
  assignedInstallerName?: string;
  createdAt: string;
  updatedAt: string;
  source: 'SYNTHETIC' | 'USER_PROVIDED';
  version: number;
  inspection?: {
    findings: string;
    classification: 'Observed' | 'Possible' | 'Confirmed';
    evidenceId: string;
    at: string;
    actorId: string;
  };
  quotes: {
    id: string;
    amountInr: number;
    scope: string;
    attachmentId: string;
    at: string;
    decision?: 'approved' | 'rejected';
    decidedAt?: string;
    decidedBy?: string;
  }[];
  actions: { text: string; at: string; actorId: string }[];
  attachments: DoctorAttachment[];
  audit: DoctorEvent[];
  scheduledAt?: string;
  completion?: { workPerformed: string; performedDate: string; attachmentId: string; at: string };
  verifications: DoctorVerification[];
  verification?: DoctorVerification;
  declineReason?: string;
}

export interface DoctorStore {
  version: 1;
  incidents: DoctorIncident[];
  tickets: DoctorTicket[];
  partners: DoctorPartner[];
  audit: DoctorEvent[];
}

export interface DoctorHealth {
  status: 'Healthy' | 'Monitor' | 'Investigation recommended' | 'Critical' | 'Insufficient data';
  score: number | null;
  experimental: true;
  components: { label: string; value: string; detail: string }[];
  explanation: string;
}

export interface DoctorOverview {
  mode: DoctorMode;
  report: WeatherReport | null;
  incidents: DoctorIncident[];
  tickets: DoctorTicket[];
  partners: DoctorPartner[];
  health: DoctorHealth;
  summary: {
    activeIncidents: number;
    dataQualityIncidents: number;
    openTickets: number;
    verifiedTickets: number;
    activeImpactInr: number;
    activeEnergyShortfallKwh: number;
    flaggedShortfallInr: number;
    actualKwh: number;
    expectedKwh: number;
    scoreableDays: number;
    totalDays: number;
  };
  disclosure: string[];
  analysisError?: string;
}

export interface DoctorRepairScenario {
  name: 'Low recovery' | 'Base recovery' | 'High recovery';
  recoveryPercent: number;
  durationDays: number;
  estimatedRecoveredKwh: number;
  estimatedBenefitInr: number;
  actionCostInr: number;
  netBenefitInr: number;
  paybackDays: number | null;
}

export interface DoctorRepairSimulation {
  incidentId: string;
  action: string;
  basis: string;
  costInr: number;
  scenarios: DoctorRepairScenario[];
  assumptions: string[];
  warning: string;
}

export interface InstallerTicketView {
  id: string;
  state: DoctorState;
  priority: DoctorPriority;
  description: string;
  property: { name: string; city: string; capacityKwp: number };
  evidence: {
    start: string;
    end: string;
    kind: DoctorIncident['kind'];
    observed: string[];
    possible: string[];
    checks: string[];
    warnings: DoctorWarning[];
    days: WeatherDay[];
    modelVersion: string;
    baselineVersion: string;
  };
  assignedInstallerName?: string;
  createdAt: string;
  updatedAt: string;
  scheduledAt?: string;
  inspection?: DoctorTicket['inspection'];
  quotes: DoctorTicket['quotes'];
  attachments: DoctorAttachment[];
  completion?: DoctorTicket['completion'];
  declineReason?: string;
  audit: DoctorEvent[];
}
