import assert from 'node:assert/strict';
import { once } from 'node:events';
import { randomUUID } from 'node:crypto';
import { existsSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

process.env.NODE_ENV = 'test';
const live = process.argv.includes('--live-helios');
if (!live) process.env.GEMINI_API_KEY = '';
const file = join(tmpdir(), `solar-doctor-${randomUUID()}.json`);
process.env.SOLARIS_DATA_FILE = file;
const { app } = await import('../server/index');
const { db, addMembership, createSession } = await import('../server/businessStore');
const { stopDetectiveWorker } = await import('../server/detectiveWorker');
const { computeVerification } = await import('../server/solarDoctorEngine');
const server = app.listen(0, '127.0.0.1');
await once(server, 'listening');
const address = server.address();
assert(address && typeof address !== 'string');

let count = 0;
const pass = (message: string) => { count++; console.log(`PASS ${message}`); };
const call = async (path: string, token?: string, method = 'GET', body?: unknown, status = 200) => {
  const response = await fetch(`http://127.0.0.1:${address.port}/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(120000),
  });
  const data = await response.json();
  assert.equal(response.status, status, `${method} ${path}: ${JSON.stringify(data)}`);
  return data;
};
const textCall = async (path: string, token?: string, status = 200) => {
  const response = await fetch(`http://127.0.0.1:${address.port}/api${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}, signal: AbortSignal.timeout(30000),
  });
  assert.equal(response.status, status, `GET ${path}`);
  return response.text();
};

try {
  const owner = await call('/auth/demo', undefined, 'POST', { workspace: 'commercial' }, 201);
  const other = await call('/auth/demo', undefined, 'POST', { workspace: 'commercial' }, 201);
  const household = await call('/auth/demo', undefined, 'POST', { workspace: 'household' }, 201);
  const installer = await call('/auth/demo', undefined, 'POST', { workspace: 'installer' }, 201);
  const outsiderInstaller = await call('/auth/register', undefined, 'POST', { name: 'Other Installer', email: `other-${randomUUID()}@example.test`, password: 'password123', workspace: 'installer' }, 201);
  const property = db.properties.find(item => item.organisationId === owner.account.organisationId)!;
  const root = `/business/properties/${property.id}/doctor`;

  await call(`${root}/overview`, undefined, 'GET', undefined, 401);
  await call(`${root}/overview`, other.token, 'GET', undefined, 404);
  await call(`${root}/overview`, household.token, 'GET', undefined, 403);
  const ownerAccount = db.accounts.find(account => account.id === owner.account.id)!;
  const tenant = { ...ownerAccount, id: randomUUID(), commercialRole: 'shop_tenant' as const, shopId: 'shop-1' };
  db.accounts.push(tenant); addMembership(tenant, property.id);
  const tenantToken = createSession(tenant);
  await call(`${root}/overview`, tenantToken, 'GET', undefined, 403);
  await call(`${root}/tickets`, tenantToken, 'POST', { incidentId: 'anything' }, 403);
  const manager = { ...ownerAccount, id: randomUUID(), commercialRole: 'facility_manager' as const };
  db.accounts.push(manager); addMembership(manager, property.id);
  const managerToken = createSession(manager);
  await call(`${root}/overview`, managerToken);
  await call(`${root}/overview`, installer.token, 'GET', undefined, 403);
  await call('/installer/maintenance-tickets', household.token, 'GET', undefined, 403);
  pass('Authentication, organisation, tenant, household and installer route isolation enforced');

  const empty = await call(`${root}/overview`, owner.token);
  assert.equal(empty.report, null);
  const demo = await call(`${root}/demo`, owner.token, 'POST', {});
  assert.equal(demo.mode, 'demo');
  assert.equal(demo.report.source, 'SYNTHETIC');
  assert.match(demo.report.weatherProvenance, /not Open-Meteo/);
  assert.ok(demo.incidents.length > 0);
  const narrative = demo.disclosure.join(' ');
  assert.match(narrative, /not probabilities, fault diagnoses/);
  assert.match(narrative, /not an audited utility-bill loss/);
  assert.match(narrative, /Maintenance completion is not proof of recovery/);
  pass('Synthetic overview is generated from the existing Python weather model with explicit limitations');

  const rainy = demo.report.examples.rainy as string;
  const sunny = demo.report.examples.sunnyAlert as string;
  const underperformance = demo.incidents.filter((incident: any) => incident.kind === 'UNDERPERFORMANCE');
  const critical = underperformance.find((incident: any) => incident.days.some((day: any) => day.date === sunny));
  assert.ok(critical, 'the sunny alert should form an underperformance incident');
  assert.equal(critical.priority, 'Critical');
  assert.ok(critical.warnings.some((warning: any) => warning.source === 'SYNTHETIC_DEMO_INVERTER_LOG' && warning.severity === 'safety'));
  assert.ok(demo.incidents.every((incident: any) => !incident.days.some((day: any) => day.date === rainy)));
  assert.ok(demo.report.days.find((day: any) => day.date === rainy).status === 'WEATHER_CONSISTENT');
  const quality = demo.incidents.find((incident: any) => incident.kind === 'DATA_QUALITY');
  assert.ok(quality, 'ineligible or missing days should form a separate data-quality incident');
  assert.equal(quality.financial.impactInr, null);
  assert.equal(quality.priority, 'Insufficient data');
  assert.match(quality.possible.join(' '), /communication gap/);
  pass('Rainy low output is weather-consistent and never an incident; sunny alert is Critical; data-quality gaps are separated and unvalued');

  const incidentIds = demo.incidents.map((incident: any) => incident.id).sort();
  const synced = await call(`${root}/sync`, owner.token, 'POST', { mode: 'demo' });
  assert.deepEqual(synced.incidents.map((incident: any) => incident.id).sort(), incidentIds);
  assert.equal(db.solarDoctor!.incidents.filter(incident => incident.propertyId === property.id).length, demo.incidents.length);
  assert.equal(db.solarDoctor!.partners.filter(partner => partner.propertyId === property.id).length, 1);
  pass('Incident persistence is idempotent for an unchanged dataset signature; partner seeding is stable');

  const expectedImpact = Math.round(critical.days.reduce((sum: number, day: any) => sum + Math.max(0, Math.round((day.gapInr ?? 0) * 100)), 0)) / 100;
  assert.equal(critical.financial.impactInr, expectedImpact);
  assert.ok(critical.financial.impactInr > 0);
  assert.ok(critical.financial.energyShortfallKwh > 0);
  assert.equal(critical.financial.tariffVersion, 'property-tariff-input-v1');
  const financial = await call(`${root}/financial-impact/${critical.id}`, owner.token);
  assert.equal(financial.financial.impactInr, critical.financial.impactInr);
  assert.ok(financial.assumptions.some((line: string) => /not an audited utility-bill loss/.test(line)));
  await call(`${root}/financial-impact/${critical.id}`, other.token, 'GET', undefined, 404);
  pass('Financial impact is deterministic avoided-energy arithmetic from persisted daily gaps, labelled and organisation-scoped');

  const simulation = await call(`${root}/repair-scenarios`, owner.token, 'POST', {
    incidentId: critical.id, action: 'Inspect and repair string', costInr: 15000, durationDays: 30,
    lowPercent: 20, basePercent: 50, highPercent: 80,
  });
  assert.equal(simulation.scenarios.length, 3);
  const [low, base, high] = simulation.scenarios;
  assert.ok(low.estimatedBenefitInr <= base.estimatedBenefitInr && base.estimatedBenefitInr <= high.estimatedBenefitInr);
  assert.equal(base.netBenefitInr, Math.round((base.estimatedBenefitInr - 15000) * 100) / 100);
  assert.equal(base.paybackDays, Math.ceil(15000 / (base.estimatedBenefitInr / 30)));
  assert.match(simulation.basis, /does not predict repair success/);
  assert.match(simulation.warning, /may not recover the assumed share/);
  await call(`${root}/repair-scenarios`, owner.token, 'POST', {
    incidentId: critical.id, action: 'x', costInr: 15000, durationDays: 30, lowPercent: 90, basePercent: 50, highPercent: 10,
  }, 400);
  await call(`${root}/repair-scenarios`, owner.token, 'POST', { incidentId: quality.id }, 409);
  await call(`${root}/repair-scenarios`, tenantToken, 'POST', { incidentId: critical.id }, 403);
  pass('Repair ROI is a deterministic low/base/high scenario, rejects invalid ranges, refuses data-quality valuation and enforces RBAC');

  await call(`${root}/anomalies/${critical.id}/acknowledge`, managerToken, 'POST', {});
  const acknowledged = await call(`${root}/overview`, owner.token);
  assert.ok(acknowledged.incidents.find((incident: any) => incident.id === critical.id).acknowledgedAt);
  pass('Facility managers can action permitted Solar Doctor workflows on assigned properties');

  await call(`${root}/tickets`, owner.token, 'POST', { incidentId: 'missing' }, 404);
  const created = await call(`${root}/tickets`, owner.token, 'POST', { incidentId: critical.id, description: 'Investigate the synthetic sunny-alert underperformance.' }, 201);
  const ticketId = created.ticket.id;
  assert.equal(created.ticket.state, 'Draft');
  assert.equal(created.ticket.evidence.start, critical.start);
  assert.equal(created.ticket.evidence.end, critical.end);
  assert.equal(created.ticket.evidence.datasetSignature, critical.datasetSignature);
  const evidenceSnapshot = JSON.stringify(created.ticket.evidence);
  await call(`${root}/tickets/${ticketId}/verify`, owner.token, 'POST', {}, 409);
  await call(`${root}/tickets/${ticketId}/close`, owner.token, 'POST', {}, 409);
  await call(`${root}/tickets/${ticketId}/submit`, owner.token, 'POST', {}, 400);
  const partnerId = demo.partners[0].id;
  const submitted = await call(`${root}/tickets/${ticketId}/submit`, owner.token, 'POST', { partnerId });
  assert.equal(submitted.ticket.state, 'Submitted');
  const assigned = await call(`${root}/tickets/${ticketId}/assign`, owner.token, 'POST', { partnerId });
  assert.equal(assigned.ticket.state, 'Assigned');
  assert.equal(assigned.ticket.assignedInstallerOrganisationId, 'org-installer-sungrid');
  pass('Draft → Submitted → Assigned workflow, evidence snapshot and invalid-transition guards work');

  await call(`/installer/maintenance-tickets/${ticketId}`, owner.token, 'GET', undefined, 403);
  await call(`/installer/maintenance-tickets/${ticketId}`, outsiderInstaller.token, 'GET', undefined, 404);
  const outsiderList = await call('/installer/maintenance-tickets', outsiderInstaller.token);
  assert.ok(outsiderList.tickets.every((item: any) => item.id !== ticketId));
  const installerList = await call('/installer/maintenance-tickets', installer.token);
  assert.ok(installerList.tickets.some((item: any) => item.id === ticketId));
  const installerView = await call(`/installer/maintenance-tickets/${ticketId}`, installer.token);
  assert.equal(installerView.ticket.financial, undefined);
  assert.equal(installerView.ticket.evidence.financial, undefined);
  assert.equal(installerView.ticket.organisationId, undefined);
  await call(`/business/properties/${property.id}/doctor/tickets/${ticketId}/verify`, installer.token, 'POST', {}, 403);
  pass('Installer tickets are visible only to the assigned organisation and omit property financial data');

  const accepted = await call(`/installer/maintenance-tickets/${ticketId}/accept`, installer.token, 'POST', {});
  assert.equal(accepted.ticket.state, 'Accepted');
  const scheduled = await call(`/installer/maintenance-tickets/${ticketId}/schedule`, installer.token, 'POST', { scheduledAt: `${critical.end}T10:00:00.000Z` });
  assert.equal(scheduled.ticket.state, 'Inspection Scheduled');
  const inspected = await call(`/installer/maintenance-tickets/${ticketId}/inspection`, installer.token, 'POST', { findings: 'Observed no visible soiling; one DC connector reseated during inspection.', classification: 'Observed' });
  assert.equal(inspected.ticket.state, 'Inspection Completed');
  const quoted = await call(`/installer/maintenance-tickets/${ticketId}/quote`, installer.token, 'POST', { amountInr: 18000, scope: 'Inspect string, reseat connectors and verify inverter logs.' });
  assert.equal(quoted.ticket.state, 'Quote Submitted');
  assert.equal(quoted.ticket.quotes.length, 1);
  const approved = await call(`${root}/tickets/${ticketId}/approve-quote`, owner.token, 'POST', { quoteId: quoted.ticket.quotes[0].id });
  assert.equal(approved.ticket.state, 'Approved');
  assert.equal(approved.ticket.quotes[0].decision, 'approved');
  const started = await call(`/installer/maintenance-tickets/${ticketId}/start`, installer.token, 'POST', {});
  assert.equal(started.ticket.state, 'In Progress');
  const performedDate = (() => {
    const date = new Date(`${critical.end}T00:00:00Z`); date.setUTCDate(date.getUTCDate() + 7); return date.toISOString().slice(0, 10);
  })();
  const completed = await call(`/installer/maintenance-tickets/${ticketId}/complete`, installer.token, 'POST', {
    workPerformed: 'Reseated a DC connector and verified string voltage.', performedDate, evidence: 'Synthetic completion note and readings.',
  });
  assert.equal(completed.ticket.state, 'Work Completed');
  assert.equal(completed.ticket.verification, undefined);
  const pendingEvidence = await textCall(`${root}/tickets/${ticketId}/report`, owner.token);
  assert.match(pendingEvidence, /Ticket completion alone is not treated as proof of recovery/);
  const pending = await call(`/installer/maintenance-tickets/${ticketId}/submit-evidence`, installer.token, 'POST', {});
  assert.equal(pending.ticket.state, 'Verification Pending');
  assert.equal(pending.ticket.verification, undefined);
  await call(`${root}/tickets/${ticketId}/close`, owner.token, 'POST', {}, 409);
  pass('Complete installer lifecycle accepts, schedules, inspects, quotes, starts and submits completion evidence without self-verification');

  const verifiedResponse = await call(`${root}/tickets/${ticketId}/verify`, owner.token, 'POST', {});
  const verified = verifiedResponse.ticket;
  assert.ok(['Improved', 'No clear improvement', 'Deteriorated', 'Insufficient evidence'].includes(verified.verification.outcome));
  assert.notEqual(verified.verification.outcome, 'Insufficient evidence');
  assert.equal(verified.state, 'Verified');
  assert.ok(verified.verification.before.length >= 3);
  assert.ok(verified.verification.after.length >= 3);
  assert.ok(verified.verification.limitations.some((line: string) => /does not prove/.test(line)));
  assert.match(verified.verification.limitations.join(' '), /not an audited bill saving/);
  const report = await textCall(`${root}/tickets/${ticketId}/report`, owner.token);
  assert.match(report, /RECOVERY VERIFICATION/);
  assert.match(report, /LIMITATIONS/);
  assert.match(report, /not proof|does not prove|not prove/i);
  const closed = await call(`${root}/tickets/${ticketId}/close`, owner.token, 'POST', {});
  assert.equal(closed.ticket.state, 'Closed');
  await call(`${root}/tickets/${ticketId}/close`, owner.token, 'POST', {}, 409);
  const reopened = await call(`${root}/tickets/${ticketId}/reopen`, owner.token, 'POST', { reason: 'Re-check the recovery evidence.' });
  assert.equal(reopened.ticket.state, 'Reopened');
  pass('Recovery is independently verified from weather-adjusted pre/post days; report carries limitations; close and reopen are explicit');

  const second = await call(`${root}/tickets`, owner.token, 'POST', { incidentId: critical.id, description: 'Second workflow to test quotation rejection.' }, 201);
  const secondId = second.ticket.id;
  await call(`${root}/tickets/${secondId}/submit`, owner.token, 'POST', { partnerId });
  await call(`${root}/tickets/${secondId}/assign`, owner.token, 'POST', { partnerId });
  await call(`/installer/maintenance-tickets/${secondId}/accept`, installer.token, 'POST', {});
  await call(`/installer/maintenance-tickets/${secondId}/schedule`, installer.token, 'POST', { scheduledAt: `${critical.end}T11:00:00.000Z` });
  await call(`/installer/maintenance-tickets/${secondId}/inspection`, installer.token, 'POST', { findings: 'Possible shading observed.', classification: 'Possible' });
  const secondQuote = await call(`/installer/maintenance-tickets/${secondId}/quote`, installer.token, 'POST', { amountInr: 22000, scope: 'Install a partial shade guard.' });
  const rejected = await call(`${root}/tickets/${secondId}/reject-quote`, owner.token, 'POST', { quoteId: secondQuote.ticket.quotes[0].id, reason: 'Scope is not justified by the evidence.' });
  assert.equal(rejected.ticket.state, 'Reopened');
  assert.equal(rejected.ticket.quotes[0].decision, 'rejected');
  await call(`${root}/tickets/${secondId}/approve-quote`, owner.token, 'POST', { quoteId: secondQuote.ticket.quotes[0].id }, 409);
  pass('Quotation rejection is recorded and cannot later be approved; the operator can reopen the workflow');

  const lastEligible = demo.report.days.filter((day: any) => day.eligible).at(-1).date;
  const third = await call(`${root}/tickets`, owner.token, 'POST', { incidentId: critical.id, description: 'Third workflow to test insufficient recovery evidence.' }, 201);
  const thirdId = third.ticket.id;
  await call(`${root}/tickets/${thirdId}/submit`, owner.token, 'POST', { partnerId });
  await call(`${root}/tickets/${thirdId}/assign`, owner.token, 'POST', { partnerId });
  await call(`/installer/maintenance-tickets/${thirdId}/accept`, installer.token, 'POST', {});
  await call(`/installer/maintenance-tickets/${thirdId}/schedule`, installer.token, 'POST', { scheduledAt: `${critical.end}T12:00:00.000Z` });
  await call(`/installer/maintenance-tickets/${thirdId}/inspection`, installer.token, 'POST', { findings: 'Observed connector seated.', classification: 'Observed' });
  const thirdQuote = await call(`/installer/maintenance-tickets/${thirdId}/quote`, installer.token, 'POST', { amountInr: 12000, scope: 'Re-terminate the affected string.' });
  await call(`${root}/tickets/${thirdId}/approve-quote`, owner.token, 'POST', { quoteId: thirdQuote.ticket.quotes[0].id });
  await call(`/installer/maintenance-tickets/${thirdId}/start`, installer.token, 'POST', {});
  await call(`/installer/maintenance-tickets/${thirdId}/complete`, installer.token, 'POST', { workPerformed: 'Re-terminated string.', performedDate: lastEligible, evidence: 'Synthetic completion note.' });
  await call(`/installer/maintenance-tickets/${thirdId}/submit-evidence`, installer.token, 'POST', {});
  const insufficient = await call(`${root}/tickets/${thirdId}/verify`, owner.token, 'POST', {});
  assert.equal(insufficient.verification.outcome, 'Insufficient evidence');
  assert.equal(insufficient.ticket.state, 'Verification Pending');
  assert.ok(insufficient.verification.limitations.some((line: string) => /at least three/.test(line)));
  await call(`${root}/tickets/${thirdId}/close`, owner.token, 'POST', {}, 409);
  pass('Verification with too few post-service days stays Insufficient evidence and cannot be closed as recovered');

  const draftQuality = await call(`${root}/tickets`, owner.token, 'POST', { incidentId: quality.id, description: 'Restore missing data for the data-quality period.' }, 201);
  const cancelled = await call(`${root}/tickets/${draftQuality.ticket.id}/cancel`, owner.token, 'POST', { reason: 'Duplicate of a data-import fix.' });
  assert.equal(cancelled.ticket.state, 'Cancelled');
  await call(`${root}/tickets/${draftQuality.ticket.id}/cancel`, owner.token, 'POST', {}, 409);
  pass('Data-quality incidents can be tracked as maintenance work and drafts can be cancelled exactly once');

  const explained = await call(`${root}/explain`, owner.token, 'POST', {
    question: 'Why was this period flagged and what should I check first?', mode: 'demo', incidentId: critical.id,
    financial: { impactInr: 99999999 }, expectedKwh: -1,
  });
  assert.equal(explained.mode, live ? 'gemini' : 'calculation-fallback');
  assert.equal(explained.function, 'explain_solar_doctor');
  assert.equal(explained.evidence.incident.financial.impactInr, critical.financial.impactInr);
  assert.ok(!JSON.stringify(explained).includes('99999999'));
  if (!live) {
    assert.match(explained.answer, /8,654\.6/);
    assert.match(explained.answer, /not an audited bill loss/);
    assert.match(explained.answer, /none is confirmed|Possibly relevant/i);
  }
  const ticketExplanation = await call(`${root}/explain`, owner.token, 'POST', { question: 'Did the repair work?', mode: 'demo', ticketId });
  assert.equal(ticketExplanation.mode, live ? 'gemini' : 'calculation-fallback');
  if (!live) assert.match(ticketExplanation.answer, /not proof that maintenance caused it|not proof/);
  await call(`${root}/explain`, owner.token, 'POST', { question: '', mode: 'demo' }, 400);
  await call(`${root}/explain`, other.token, 'POST', { question: 'Explain this.' }, 404);
  pass('Helios is server-grounded, ignores client financial figures, explains recovery limitations and is read-only');

  const stored = db.solarDoctor!.incidents.find(incident => incident.id === critical.id)!;
  stored.observed.push('TEST MUTATION SHOULD NOT ENTER THE TICKET');
  await call(`${root}/sync`, owner.token, 'POST', { mode: 'demo' });
  const reloaded = await call(`${root}/tickets/${ticketId}`, owner.token);
  assert.equal(JSON.stringify(reloaded.ticket.evidence), evidenceSnapshot);
  assert.ok(!reloaded.ticket.evidence.observed.includes('TEST MUTATION SHOULD NOT ENTER THE TICKET'));
  pass('Persisted ticket evidence is a deep snapshot and is not rewritten by later incident or model changes');

  const day = (date: string, actual: number, expected: number) => ({
    date, actualKwh: actual, expectedKwh: expected, residualKwh: actual - expected, ratio: actual / expected,
    irradianceKwhM2: 5, cloudCover: 10, precipitationMm: 0, temperatureC: 30, weather: 'SUNNY',
    score: 0, originalScore: 0, originalFlag: false, thresholdFlag: false, status: 'WEATHER_CONSISTENT',
    eligible: true, warnings: [], gapInr: Math.max(0, expected - actual) * 10, expectedAvoidedInr: expected * 10,
    actualAvoidedInr: actual * 10, daylightHours: 8, matchedHours: 8,
  });
  const scenarioReport = {
    days: [...Array(5)].map((_, index) => day(`2025-01-0${index + 1}`, 50, 100))
      .concat([...Array(5)].map((_, index) => day(`2025-01-1${index + 1}`, 52, 100))),
    tariffInrPerKwh: 10,
  } as any;
  const scenarioTicket = { evidence: { end: '2025-01-05', days: scenarioReport.days.slice(0, 5), financial: { exportRateInr: 0 }, baselineVersion: 'test' }, mode: 'property' } as any;
  const improved = computeVerification(scenarioTicket, scenarioReport, '2025-01-10');
  assert.equal(improved.outcome, 'No clear improvement');
  scenarioReport.days = [...Array(5)].map((_, index) => day(`2025-01-0${index + 1}`, 50, 100))
    .concat([...Array(5)].map((_, index) => day(`2025-01-1${index + 1}`, 90, 100)));
  const strong = computeVerification(scenarioTicket, scenarioReport, '2025-01-10');
  assert.equal(strong.outcome, 'Improved');
  assert.ok(strong.changePercentagePoints !== null && strong.changePercentagePoints > 5);
  assert.ok(strong.benefitInr !== null && strong.benefitInr > 0);
  scenarioReport.days = [...Array(5)].map((_, index) => day(`2025-01-0${index + 1}`, 50, 100))
    .concat([...Array(5)].map((_, index) => day(`2025-01-1${index + 1}`, 30, 100)));
  assert.equal(computeVerification(scenarioTicket, scenarioReport, '2025-01-10').outcome, 'Deteriorated');
  scenarioReport.days = [...Array(5)].map((_, index) => day(`2025-01-0${index + 1}`, 50, 100))
    .concat([day('2025-01-11', 90, 100), day('2025-01-12', 90, 100)]);
  const thin = computeVerification(scenarioTicket, scenarioReport, '2025-01-10');
  assert.equal(thin.outcome, 'Insufficient evidence');
  assert.equal(thin.financial, null);
  assert.ok(thin.limitations.some(line => /at least three/.test(line)));
  pass('Deterministic verification covers Improved, No clear improvement, Deteriorated and Insufficient evidence');

  const seedDemo = await call('/installer/maintenance-tickets/demo-seed', outsiderInstaller.token, 'POST', {}, 201);
  assert.equal(seedDemo.tickets.length, 1);
  assert.equal(seedDemo.tickets[0].state, 'Assigned');
  assert.equal(seedDemo.tickets[0].property.name, 'Bawana Mall (solar demo)');
  assert.ok(seedDemo.tickets[0].evidence.observed.length > 0);
  const repeatSeed = await call('/installer/maintenance-tickets/demo-seed', outsiderInstaller.token, 'POST', {});
  assert.equal(repeatSeed.tickets.length, 1);
  assert.equal(repeatSeed.tickets[0].id, seedDemo.tickets[0].id);
  pass('Installer demo job is seeded from real detection evidence, labelled synthetic and created idempotently');

  db.memberships.find(membership => membership.accountId === owner.account.id)!.status = 'inactive';
  await call(`${root}/overview`, owner.token, 'GET', undefined, 403);
  await call(`${root}/tickets/${ticketId}`, owner.token, 'GET', undefined, 403);
  const residential = await call('/residential/state', household.token);
  assert.ok(residential.data === null || residential.data === undefined || typeof residential.data === 'object');
  pass('Membership revocation blocks Solar Doctor while existing residential workflows still respond');
} finally {
  stopDetectiveWorker();
  await new Promise<void>(resolve => server.close(() => resolve()));
  if (existsSync(file)) unlinkSync(file);
}
console.log(`${count} Solar Doctor API checks passed`);
