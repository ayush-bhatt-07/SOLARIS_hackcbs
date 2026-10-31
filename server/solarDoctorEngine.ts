import { randomUUID } from 'node:crypto';
import type { BusinessProperty } from '../src/types/commercial';
import type { WeatherDay, WeatherReport } from '../src/types/weatherDetective';
import type {
  DoctorHealth, DoctorIncident, DoctorMoney, DoctorPartner, DoctorPriority,
  DoctorRepairSimulation, DoctorRepairScenario, DoctorStore, DoctorTicket,
  DoctorVerification, DoctorWarning,
} from '../src/types/solarDoctor';

export const SYNTHETIC_INSTALLER_ORGANISATION = 'org-installer-sungrid';
const DAY_MS = 86_400_000;
const round2 = (value: number) => Math.round(value * 100) / 100;
const isoDay = (date: Date) => date.toISOString().slice(0, 10);
const shiftDay = (date: string, days: number) => isoDay(new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS));
const gapDays = (a: string, b: string) => Math.abs(Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / DAY_MS;
const isSuppressed = (incident: DoctorIncident) => Boolean(incident.suppressedUntil && Date.parse(incident.suppressedUntil) > Date.now());

export const emptyDoctorStore = (): DoctorStore => ({ version: 1, incidents: [], tickets: [], partners: [], audit: [] });

export function moneyForDays(days: WeatherDay[], tariffInr: number, exportRateInr: number, dataQuality = false): DoctorMoney {
  const valid = days.filter(day => day.eligible && day.actualKwh !== null && day.expectedKwh !== null);
  const expected = valid.reduce((sum, day) => sum + (day.expectedKwh ?? 0), 0);
  const actual = valid.reduce((sum, day) => sum + (day.actualKwh ?? 0), 0);
  const shortfall = valid.reduce((sum, day) => sum + Math.max(0, (day.expectedKwh ?? 0) - (day.actualKwh ?? 0)), 0);
  const impactPaise = valid.reduce((sum, day) => sum + Math.max(0, Math.round((day.gapInr ?? 0) * 100)), 0);
  return {
    version: 'doctor-finance-1',
    impactInr: dataQuality || !valid.length ? null : impactPaise / 100,
    energyShortfallKwh: dataQuality || !valid.length ? null : round2(shortfall),
    expectedKwh: dataQuality || !valid.length ? null : round2(expected),
    actualKwh: dataQuality || !valid.length ? null : round2(actual),
    expectedImportKwh: null,
    actualImportKwh: null,
    exportDifferenceKwh: null,
    tariffInr,
    exportRateInr,
    tariffVersion: 'property-tariff-input-v1',
    assumptions: [
      `Energy is valued only at the property's saved import tariff of ₹${tariffInr}/kWh.`,
      'The engine sums hourly min(site load, expected generation) minus min(site load, actual generation), rounded to paise, from the authorised backend analysis.',
      'This is an avoided-energy-charge estimate, not an audited utility-bill loss. Fixed charges, demand charges, taxes, export settlement, tenant benefits and financing are excluded.',
      dataQuality
        ? 'Missing or inconsistent readings are not treated as zero generation; no financial loss is estimated for this data-quality period.'
        : 'Only scored, complete daylight intervals contribute. Above-baseline days contribute zero shortfall rather than a negative loss.',
    ],
  };
}

function weatherSummary(days: WeatherDay[]): string {
  const counts = days.reduce<Record<string, number>>((result, day) => {
    result[day.weather] = (result[day.weather] ?? 0) + 1;
    return result;
  }, {});
  return Object.entries(counts).map(([weather, count]) => `${count} ${weather.toLowerCase()}`).join(', ');
}

function incidentWarnings(report: WeatherReport, mode: string, days: WeatherDay[], kind: DoctorIncident['kind']): DoctorWarning[] {
  const warnings: DoctorWarning[] = [];
  for (const warning of [...new Set(days.flatMap(day => day.warnings))]) {
    warnings.push({ text: warning.replaceAll('_', ' ').toLowerCase(), severity: 'info', source: 'DATA_QUALITY_CHECK' });
  }
  if (kind === 'DATA_QUALITY') return warnings;
  if (mode === 'demo' && report.examples.sunnyAlert && days.some(day => day.date === report.examples.sunnyAlert)) {
    warnings.push({
      text: 'Synthetic demo inverter log: one MPPT input reported DC voltage below its configured operating window during this period. Demonstration evidence only — not a real device reading, and not a confirmed fault.',
      severity: 'safety',
      source: 'SYNTHETIC_DEMO_INVERTER_LOG',
    });
  }
  if (mode === 'property') {
    warnings.push({
      text: 'No inverter telemetry or service history is connected in this MVP. Safety-related equipment status cannot be inferred from generation alone.',
      severity: 'info',
      source: 'NO_INVERTER_TELEMETRY',
    });
  }
  return warnings;
}

function priorityFor(kind: DoctorIncident['kind'], days: WeatherDay[], impactInr: number | null, warnings: DoctorWarning[]): { priority: DoctorPriority; reasons: string[] } {
  if (kind === 'DATA_QUALITY') {
    return { priority: 'Insufficient data', reasons: ['Complete, trustworthy readings are unavailable. The system does not convert missing data into an equipment fault or a financial loss.'] };
  }
  const scored = days.filter(day => day.eligible && day.expectedKwh && day.actualKwh !== null);
  const expected = scored.reduce((sum, day) => sum + (day.expectedKwh ?? 0), 0);
  const actual = scored.reduce((sum, day) => sum + (day.actualKwh ?? 0), 0);
  const ratio = expected > 0 ? actual / expected : null;
  const reasons: string[] = [];
  if (warnings.some(warning => warning.severity === 'safety')) {
    reasons.push('A safety-related inverter warning is present, so safety escalation takes precedence over financial thresholds.');
    return { priority: 'Critical', reasons };
  }
  if (impactInr !== null && impactInr >= 25_000) {
    reasons.push('Estimated financial impact for this period is at least ₹25,000.');
    return { priority: 'Critical', reasons };
  }
  if ((impactInr !== null && impactInr >= 5_000) || (ratio !== null && ratio < 0.6)) {
    if (impactInr !== null && impactInr >= 5_000) reasons.push('Estimated financial impact for this period is at least ₹5,000.');
    if (ratio !== null && ratio < 0.6) reasons.push(`Generation is ${(ratio * 100).toFixed(0)}% of the weather-adjusted expectation.`);
    return { priority: 'High', reasons };
  }
  if (days.length >= 5) {
    reasons.push(`The deviation persists across ${days.length} scored days.`);
    return { priority: 'High', reasons };
  }
  if (impactInr !== null && impactInr >= 1_000) {
    reasons.push('Estimated financial impact for this period is at least ₹1,000.');
    return { priority: 'Medium', reasons };
  }
  reasons.push('A statistically unusual period was detected, but its measured financial impact is limited so far.');
  return { priority: 'Low', reasons };
}

export function deriveIncidentGroups(report: WeatherReport): { kind: DoctorIncident['kind']; days: WeatherDay[] }[] {
  const groups: { kind: DoctorIncident['kind']; days: WeatherDay[] }[] = [];
  const source = [...report.days].sort((a, b) => a.date.localeCompare(b.date));
  const add = (kind: DoctorIncident['kind'], day: WeatherDay) => {
    const last = groups.at(-1);
    if (last && last.kind === kind && gapDays(last.days.at(-1)!.date, day.date) <= 3) last.days.push(day);
    else groups.push({ kind, days: [day] });
  };
  for (const day of source) {
    if (day.status === 'INVESTIGATE' && day.eligible && day.gapInr !== null && day.gapInr > 0 && day.actualKwh !== null) add('UNDERPERFORMANCE', day);
    else if (!day.eligible || day.status === 'DATA_QUALITY' || day.status === 'MISSING_DATA') add('DATA_QUALITY', day);
  }
  return groups;
}

export function buildIncident(property: BusinessProperty, report: WeatherReport, mode: DoctorIncident['mode'], kind: DoctorIncident['kind'], days: WeatherDay[]): DoctorIncident {
  const start = days[0].date;
  const end = days.at(-1)!.date;
  const financial = moneyForDays(days, report.tariffInrPerKwh, property.inputs.exportRate, kind === 'DATA_QUALITY');
  const warnings = incidentWarnings(report, mode, days, kind);
  const priority = priorityFor(kind, days, financial.impactInr, warnings);
  const scored = days.filter(day => day.eligible && day.expectedKwh !== null && day.actualKwh !== null);
  const expected = scored.reduce((sum, day) => sum + (day.expectedKwh ?? 0), 0);
  const actual = scored.reduce((sum, day) => sum + (day.actualKwh ?? 0), 0);
  const ratio = expected > 0 && kind !== 'DATA_QUALITY' ? actual / expected : null;
  const at = new Date().toISOString();
  const observed = kind === 'DATA_QUALITY'
    ? [
        `The period ${start}${start === end ? '' : ` to ${end}`} could not be scored reliably.`,
        `Data-quality signals: ${[...new Set(days.flatMap(day => day.warnings))].map(value => value.replaceAll('_', ' ').toLowerCase()).join('; ') || 'incomplete or inconsistent measurements'}.`,
        'Missing readings are unknown values, not zero generation. No equipment diagnosis or financial loss is inferred.',
      ]
    : [
        `Generation was ${(ratio! * 100).toFixed(1)}% of the weather-adjusted expectation over ${scored.length} scored day${scored.length === 1 ? '' : 's'} (${round2(expected).toLocaleString('en-IN')} kWh expected vs ${round2(actual).toLocaleString('en-IN')} kWh actual).`,
        `Weather context across the period: ${weatherSummary(days)}. The baseline already adjusts for modelled irradiation, cloud, rain and temperature.`,
        `The estimated avoided-energy-charge shortfall is ₹${(financial.impactInr ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })} at ₹${report.tariffInrPerKwh}/kWh, before demand charges, fixed charges and export settlement.`,
      ];
  const possible = kind === 'DATA_QUALITY'
    ? [
        'A communication gap, timestamp misalignment, duplicate import or partial file may explain the missing readings.',
        'Meter or inverter data-feed availability should be checked before any production conclusion is drawn.',
      ]
    : [
        'Panel soiling, new shading or a partial string disconnection may reduce production; none is confirmed by this model.',
        'Inverter availability, clipping, grid outage, curtailment or meter alignment may also explain part of the shortfall.',
        scored.length >= 3 ? 'A gradual equipment or metering degradation could produce a persistent weather-adjusted deviation.' : 'A short isolated deviation may be measurement noise or an operational change rather than an equipment fault.',
        'These are possible explanations only. Isolation Forest scores are not probabilities or fault diagnoses.',
      ];
  const checks = kind === 'DATA_QUALITY'
    ? ['Check meter and inverter communication status.', 'Confirm interval-end timestamps, timezone and duplicate records.', 'Re-import the affected period and rerun the weather-adjusted analysis.']
    : ['Review inverter event logs and MPPT/string status.', 'Compare main-meter and independent generation readings for the same intervals.', 'Check cleaning, shading and maintenance records around the period.', 'Confirm grid outage or curtailment history.', 'Request a qualified inspection only if the deviation persists after data-quality checks.'];
  const incident: DoctorIncident = {
    id: randomUUID(), organisationId: property.organisationId, propertyId: property.id,
    installationId: `${property.id}-solar-plant`, datasetId: report.datasetId, datasetSignature: report.solarHash,
    mode, start, end, kind, days: structuredClone(days), financial,
    modelVersion: report.modelVersion, baselineVersion: report.baselineVersion,
    featureSchema: ['generation_ratio_residual', 'capacity_normalised_residual', 'expected_normalised_import_residual'],
    site: structuredClone(report.site), priority: priority.priority, priorityReasons: priority.reasons,
    observed, possible, checks, warnings, createdAt: at,
    audit: [{ id: randomUUID(), at, actorId: 'system', actorOrganisationId: property.organisationId, action: 'incident_created', detail: `${kind} incident generated by ${report.modelVersion}.` }],
  };
  return incident;
}

export function ensureIncidents(store: DoctorStore, property: BusinessProperty, report: WeatherReport, mode: DoctorIncident['mode']): DoctorIncident[] {
  const current = store.incidents.filter(incident => incident.propertyId === property.id && incident.mode === mode && incident.datasetSignature === report.solarHash);
  for (const group of deriveIncidentGroups(report)) {
    const start = group.days[0].date, end = group.days.at(-1)!.date;
    if (current.some(incident => incident.kind === group.kind && incident.start === start && incident.end === end)) continue;
    const incident = buildIncident(property, report, mode, group.kind, group.days);
    store.incidents.push(incident); current.push(incident);
  }
  return current.sort((a, b) => b.start.localeCompare(a.start));
}

export function computeHealth(report: WeatherReport | null, incidents: DoctorIncident[], tickets: DoctorTicket[]): DoctorHealth {
  if (!report) {
    return { status: 'Insufficient data', score: null, experimental: true, components: [], explanation: 'No authorised weather-adjusted analysis is available yet. Solar Doctor does not invent system health from an empty dataset.' };
  }
  const eligible = report.days.filter(day => day.eligible && day.expectedKwh && day.actualKwh !== null);
  const recent = eligible.slice(-14);
  const expected = recent.reduce((sum, day) => sum + (day.expectedKwh ?? 0), 0);
  const actual = recent.reduce((sum, day) => sum + (day.actualKwh ?? 0), 0);
  const ratio = expected > 0 ? actual / expected : null;
  const active = incidents.filter(incident => !isSuppressed(incident));
  const under = active.filter(incident => incident.kind === 'UNDERPERFORMANCE');
  const quality = active.filter(incident => incident.kind === 'DATA_QUALITY');
  const safety = under.flatMap(incident => incident.warnings).filter(warning => warning.severity === 'safety');
  const openTickets = tickets.filter(ticket => !['Closed', 'Cancelled', 'Verified'].includes(ticket.state)).length;
  const components = [
    { label: 'Weather-adjusted recent output', value: ratio === null ? 'Unavailable' : `${(ratio * 100).toFixed(1)}%`, detail: `Last ${recent.length} scored day${recent.length === 1 ? '' : 's'} weighted by expected kWh.` },
    { label: 'Open anomaly periods', value: String(under.length), detail: 'Weather-adjusted underperformance periods that are not suppressed.' },
    { label: 'Data completeness', value: `${eligible.length} / ${report.days.length}`, detail: 'Scored days out of all evaluated days. Missing data is not scored as zero.' },
    { label: 'Open maintenance tickets', value: String(openTickets), detail: 'Tickets not yet closed or cancelled.' },
    { label: 'Safety signals', value: String(safety.length), detail: 'Available warning evidence only. No inverter telemetry is invented.' },
  ];
  if (eligible.length < 7) {
    return { status: 'Insufficient data', score: null, experimental: true, components, explanation: 'Fewer than seven complete scored days are available. A precise health score would be misleading.' };
  }
  let status: DoctorHealth['status'] = 'Healthy';
  if (safety.length) status = 'Critical';
  else if (under.some(incident => incident.priority === 'Critical')) status = 'Critical';
  else if (under.length && (ratio === null || ratio < 0.92)) status = 'Investigation recommended';
  else if (under.length || quality.length || openTickets) status = 'Monitor';
  const score = Math.max(5, Math.min(100, Math.round(100
    - 55 * Math.max(0, 1 - (ratio ?? 1))
    - 18 * Math.min(1, under.length / 3)
    - 8 * Math.min(1, quality.length / 3)
    - 5 * Math.min(1, openTickets / 3))));
  return {
    status, score, experimental: true, components,
    explanation: 'Experimental indicator combining recent weather-adjusted output, unresolved anomaly periods, data completeness, open maintenance and available safety evidence. It is not a scientifically validated asset-health rating. Weather, load and data quality can move the score without any equipment fault.',
  };
}

export function repairSimulation(incident: DoctorIncident, input: { action: string; costInr: number; durationDays: number; lowPercent: number; basePercent: number; highPercent: number }): DoctorRepairSimulation {
  const scored = incident.days.filter(day => day.eligible).length || 1;
  const impact = incident.financial.impactInr ?? 0;
  const shortfall = incident.financial.energyShortfallKwh ?? 0;
  const dailyImpact = impact / scored;
  const scenario = (name: DoctorRepairScenario['name'], recoveryPercent: number): DoctorRepairScenario => {
    const gross = round2(dailyImpact * (recoveryPercent / 100) * input.durationDays);
    const recoveredKwh = round2(shortfall * (recoveryPercent / 100) * input.durationDays / scored);
    const dailyBenefit = gross / Math.max(1, input.durationDays);
    return {
      name, recoveryPercent, durationDays: input.durationDays,
      estimatedRecoveredKwh: recoveredKwh,
      estimatedBenefitInr: gross,
      actionCostInr: input.costInr,
      netBenefitInr: round2(gross - input.costInr),
      paybackDays: dailyBenefit > 0 ? Math.ceil(input.costInr / dailyBenefit) : null,
    };
  };
  return {
    incidentId: incident.id, action: input.action, basis: 'Deterministic scenario arithmetic from the persisted incident shortfall. It does not predict repair success.', costInr: input.costInr,
    scenarios: [scenario('Low recovery', input.lowPercent), scenario('Base recovery', input.basePercent), scenario('High recovery', input.highPercent)],
    assumptions: [
      `The incident's estimated shortfall (₹${impact.toLocaleString('en-IN', { maximumFractionDigits: 2 })} over ${scored} scored day${scored === 1 ? '' : 's'}) is spread evenly across scored days.`,
      `Recovery applies for ${input.durationDays} day${input.durationDays === 1 ? '' : 's'} at the same tariff of ₹${incident.financial.tariffInr}/kWh.`,
      'Recovery percentages and costs are editable demonstration assumptions, not measured outcomes or real quotations.',
      'No demand-charge, fixed-charge, export, tax, tenant-sharing or financing effects are included.',
    ],
    warning: 'Do not approve maintenance expecting these returns before the cause is investigated. If isolation, soiling, shading or metering explains the gap, the same action may not recover the assumed share. Recovery is verified separately after service.',
  };
}

function ratioFor(days: WeatherDay[]): number | null {
  const expected = days.reduce((sum, day) => sum + (day.expectedKwh ?? 0), 0);
  const actual = days.reduce((sum, day) => sum + (day.actualKwh ?? 0), 0);
  return expected > 0 ? actual / expected : null;
}

export function computeVerification(ticket: DoctorTicket, report: WeatherReport | null, performedDate: string): DoctorVerification {
  const at = new Date().toISOString();
  const limitations: string[] = [
    'Before/after comparison uses complete, weather-adjusted scored days only; missing or inconsistent days are excluded rather than zero-filled.',
    'An improvement after service does not prove that maintenance caused it. Weather, load, seasonality, soiling, meter changes, curtailment or other work may contribute.',
    'Financial benefit is an incremental avoided-energy-charge estimate at the saved tariff, not an audited bill saving.',
  ];
  if (ticket.mode === 'demo') limitations.push('This verification uses the synthetic Solar Doctor demonstration dataset. No real maintenance outcome is implied.');
  limitations.push('Fixed charges, demand charges, export settlement, taxes, tenant benefits and financing are excluded.');
  if (!report) {
    return { id: randomUUID(), at, outcome: 'Insufficient evidence', before: [], after: [], beforeRatio: null, afterRatio: null, changePercentagePoints: null, benefitInr: null, financial: null, baselineVersion: ticket.evidence.baselineVersion, performedDate, limitations: ['No current authorised weather-adjusted report is available for comparison.', ...limitations] };
  }
  const eligible = report.days.filter(day => day.eligible && day.expectedKwh !== null && day.actualKwh !== null).sort((a, b) => a.date.localeCompare(b.date));
  const incidentScored = ticket.evidence.days.filter(day => day.eligible).length;
  const before = eligible.filter(day => day.date <= ticket.evidence.end).slice(-Math.max(3, Math.min(14, incidentScored || 3)));
  const after = eligible.filter(day => day.date > performedDate).slice(0, 14);
  const beforeRatio = before.length >= 3 ? ratioFor(before) : null;
  const afterRatio = after.length >= 3 ? ratioFor(after) : null;
  if (beforeRatio === null || afterRatio === null) {
    const missing: string[] = [];
    if (before.length < 3) missing.push(`Only ${before.length} scored pre-service day${before.length === 1 ? '' : 's'} are available; at least three are required.`);
    if (after.length < 3) missing.push(`Only ${after.length} scored post-service day${after.length === 1 ? '' : 's'} are available; at least three are required.`);
    return { id: randomUUID(), at, outcome: 'Insufficient evidence', before, after, beforeRatio, afterRatio, changePercentagePoints: null, benefitInr: null, financial: null, baselineVersion: report.baselineVersion, performedDate, limitations: [...missing, ...limitations] };
  }
  const change = (afterRatio - beforeRatio) * 100;
  const outcome: DoctorVerification['outcome'] = change >= 5 ? 'Improved' : change <= -5 ? 'Deteriorated' : 'No clear improvement';
  const delta = Math.max(0, afterRatio - beforeRatio);
  const recoveredKwh = round2(after.reduce((sum, day) => sum + Math.max(0, (day.expectedKwh ?? 0) * delta), 0));
  const benefit = round2(recoveredKwh * report.tariffInrPerKwh);
  const financial: DoctorMoney = {
    version: 'doctor-recovery-finance-1', impactInr: benefit, energyShortfallKwh: recoveredKwh,
    expectedKwh: round2(after.reduce((sum, day) => sum + (day.expectedKwh ?? 0), 0)),
    actualKwh: round2(after.reduce((sum, day) => sum + (day.actualKwh ?? 0), 0)),
    expectedImportKwh: null, actualImportKwh: null, exportDifferenceKwh: null,
    tariffInr: report.tariffInrPerKwh, exportRateInr: ticket.evidence.financial.exportRateInr, tariffVersion: 'property-tariff-input-v1',
    assumptions: [
      `Incremental avoided energy = Σ max(0, expected kWh × (after ratio − before ratio)) across ${after.length} post-service scored days.`,
      `The recovered energy is valued at ₹${report.tariffInrPerKwh}/kWh. Demand/fixed charges, export settlement, taxes and tenant sharing are excluded.`,
      'This is a scenario estimate of the observed change, not a causal or audited saving.',
    ],
  };
  limitations.unshift(`Pre-service window: ${before.length} scored day${before.length === 1 ? '' : 's'} ending ${ticket.evidence.end}. Post-service window: ${after.length} scored day${after.length === 1 ? '' : 's'} after ${performedDate}.`);
  return { id: randomUUID(), at, outcome, before, after, beforeRatio, afterRatio, changePercentagePoints: round2(change), benefitInr: benefit, financial, baselineVersion: report.baselineVersion, performedDate, limitations };
}

export function createTicket(property: BusinessProperty, incident: DoctorIncident, description: string, actor: { id: string; organisationId: string }): DoctorTicket {
  const at = new Date().toISOString();
  return {
    id: randomUUID(), organisationId: property.organisationId, propertyId: property.id, installationId: incident.installationId,
    incidentId: incident.id, mode: incident.mode, description, state: 'Draft', priority: incident.priority,
    evidence: structuredClone(incident),
    propertySnapshot: { name: property.inputs.name, city: property.inputs.city, capacityKwp: incident.site.capacityKwp },
    createdAt: at, updatedAt: at, source: incident.mode === 'demo' ? 'SYNTHETIC' : 'USER_PROVIDED', version: 1,
    quotes: [], actions: [], attachments: [], verifications: [],
    audit: [{ id: randomUUID(), at, actorId: actor.id, actorOrganisationId: actor.organisationId, action: 'ticket_created', detail: 'Draft maintenance request created from a persisted Solar Doctor incident.' }],
  };
}

export function ensureSyntheticPartner(store: DoctorStore, property: BusinessProperty): DoctorPartner {
  const existing = store.partners.find(partner => partner.propertyId === property.id && partner.installerOrganisationId === SYNTHETIC_INSTALLER_ORGANISATION);
  if (existing) return existing;
  const partner: DoctorPartner = {
    id: randomUUID(), organisationId: property.organisationId, propertyId: property.id,
    installerOrganisationId: SYNTHETIC_INSTALLER_ORGANISATION, name: 'SunGrid Delhi (synthetic demo installer)',
    providerId: 'provider-sungrid', source: 'SYNTHETIC', active: true,
  };
  store.partners.push(partner);
  return partner;
}

export function installerTicketView(ticket: DoctorTicket) {
  return {
    id: ticket.id, state: ticket.state, priority: ticket.priority, description: ticket.description,
    property: { name: ticket.propertySnapshot.name, city: ticket.propertySnapshot.city, capacityKwp: ticket.propertySnapshot.capacityKwp },
    evidence: {
      start: ticket.evidence.start, end: ticket.evidence.end, kind: ticket.evidence.kind,
      observed: ticket.evidence.observed, possible: ticket.evidence.possible, checks: ticket.evidence.checks,
      warnings: ticket.evidence.warnings, days: ticket.evidence.days,
      modelVersion: ticket.evidence.modelVersion, baselineVersion: ticket.evidence.baselineVersion,
    },
    assignedInstallerName: ticket.assignedInstallerName, createdAt: ticket.createdAt, updatedAt: ticket.updatedAt,
    scheduledAt: ticket.scheduledAt, inspection: ticket.inspection, quotes: ticket.quotes,
    attachments: ticket.attachments, completion: ticket.completion, declineReason: ticket.declineReason,
    audit: ticket.audit,
  };
}

export function nextSyntheticServiceDate(ticket: DoctorTicket, report: WeatherReport | null): string {
  const end = ticket.evidence.end;
  if (ticket.mode !== 'demo' || !report) return shiftDay(end, 1);
  const eligible = report.days.filter(day => day.eligible).map(day => day.date).sort();
  const candidate = eligible.find(date => date > end);
  return candidate ?? shiftDay(end, 1);
}
