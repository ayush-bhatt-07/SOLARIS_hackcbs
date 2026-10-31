import React, { useEffect, useMemo, useState } from 'react';
import { api, post } from '../../utils/api';
import type { BusinessProperty } from '../../types/commercial';
import type { WeatherDay } from '../../types/weatherDetective';
import type {
  DoctorIncident, DoctorMode, DoctorOverview, DoctorRepairSimulation,
  DoctorState, DoctorTicket, DoctorVerification,
} from '../../types/solarDoctor';
import './solar-doctor.css';

const money = (value: number | null | undefined) => value === null || value === undefined
  ? 'Not valued'
  : `${value < 0 ? '−' : ''}₹${Math.abs(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const compactMoney = (value: number | null | undefined) => value === null || value === undefined
  ? 'Not valued'
  : value >= 10000000 ? `${value < 0 ? '−' : ''}₹${(Math.abs(value) / 10000000).toFixed(2)}Cr`
    : value >= 100000 ? `${value < 0 ? '−' : ''}₹${(Math.abs(value) / 100000).toFixed(2)}L`
      : money(value);
const number = (value: number | null | undefined, digits = 1) => value === null || value === undefined
  ? '—'
  : value.toLocaleString('en-IN', { maximumFractionDigits: digits });
const percent = (value: number | null | undefined, digits = 1) => value === null || value === undefined
  ? '—'
  : `${(value * 100).toFixed(digits)}%`;
const dayLabel = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
const fullDay = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const dateTime = (value: string) => new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const tone = (state: string) => {
  if (['Critical', 'Cancelled', 'Deteriorated'].includes(state)) return 'critical';
  if (['High', 'Reopened', 'Verification Pending', 'Awaiting Approval', 'Quote Submitted'].includes(state)) return 'high';
  if (['Medium', 'Monitor', 'Submitted', 'Assigned', 'Accepted', 'Inspection Scheduled', 'Inspection Completed', 'Approved', 'In Progress', 'Work Completed', 'No clear improvement'].includes(state)) return 'medium';
  if (['Low', 'Healthy', 'Verified', 'Closed', 'Improved'].includes(state)) return 'good';
  return 'neutral';
};

function IncidentChart({ days, selected, onSelect }: { days: WeatherDay[]; selected?: string; onSelect: (date: string) => void }) {
  const max = Math.max(1, ...days.flatMap(day => [day.expectedKwh ?? 0, day.actualKwh ?? 0]));
  return <div className="sd-chart">
    <div className="sd-chart-key"><span><i className="sd-key-expected"/>Weather-adjusted expectation</span><span><i className="sd-key-actual"/>Actual generation</span></div>
    <div className="sd-chart-bars" role="list" aria-label="Expected and actual daily generation">
      {days.map(day => <button type="button" role="listitem" key={day.date} onClick={() => onSelect(day.date)}
        className={`sd-chart-day ${selected === day.date ? 'active' : ''} ${day.status.toLowerCase()}`}
        aria-label={`${fullDay(day.date)}: expected ${number(day.expectedKwh)} kWh, actual ${number(day.actualKwh)} kWh, ${day.weather.toLowerCase()}`}>
        <span className="sd-chart-pair">
          <i className="sd-bar-expected" style={{ height: `${Math.max(2, (day.expectedKwh ?? 0) / max * 100)}%` }}/>
          <i className="sd-bar-actual" style={{ height: `${day.actualKwh === null ? 0 : Math.max(2, day.actualKwh / max * 100)}%` }}/>
        </span>
        <small>{dayLabel(day.date)}</small>
        <em>{day.actualKwh === null ? 'Missing' : day.expectedKwh ? `${Math.round((day.actualKwh / day.expectedKwh) * 100)}%` : '—'}</em>
      </button>)}
    </div>
  </div>;
}

function DayDetail({ day }: { day: WeatherDay }) {
  return <div className="sd-day-detail">
    <div><span>Day</span><strong>{fullDay(day.date)}</strong></div>
    <div><span>Weather</span><strong>{day.weather.toLowerCase()}</strong></div>
    <div><span>Expected</span><strong>{number(day.expectedKwh)} kWh</strong></div>
    <div><span>Actual</span><strong>{number(day.actualKwh)} kWh</strong></div>
    <div><span>Weather-adjusted ratio</span><strong>{percent(day.ratio)}</strong></div>
    <div><span>Irradiation</span><strong>{number(day.irradianceKwhM2, 2)} kWh/m²</strong></div>
    <div><span>Cloud / rain</span><strong>{number(day.cloudCover, 0)}% / {number(day.precipitationMm)} mm</strong></div>
    <div><span>Signed avoided-charge gap</span><strong>{money(day.gapInr)}</strong></div>
    <p>{day.status === 'WEATHER_CONSISTENT' ? 'Output is consistent with modelled weather. Low generation on a cloudy or rainy day is not treated as a fault.' : day.status === 'INVESTIGATE' ? 'Output is unusual after weather adjustment. This is evidence to investigate, not a confirmed fault.' : day.eligible ? 'No unusual weather-normalised deviation was found for this day. That is not a guarantee of system health.' : 'Missing or inconsistent evidence prevents reliable scoring. This is not zero generation and not a fault.'}</p>
  </div>;
}

function HealthCard({ overview }: { overview: DoctorOverview }) {
  const health = overview.health;
  return <section className="sd-panel sd-health">
    <div className="sd-panel-heading"><div><span className="sd-eyebrow">SOLAR HEALTH</span><h2>Experimental indicator</h2></div><span className={`sd-chip ${tone(health.status)}`}>{health.status}</span></div>
    <div className="sd-health-body">
      <div className="sd-score" style={{ background: health.score === null ? '#eef2ea' : `conic-gradient(#2f7a58 ${health.score * 3.6}deg, #e6ece2 0)` }}>
        <span>{health.score ?? '—'}<small>{health.score === null ? '' : '/100'}</small></span>
      </div>
      <p>{health.explanation}</p>
    </div>
    <div className="sd-health-components">{health.components.map(component => <div key={component.label} title={component.detail}><span>{component.label}</span><strong>{component.value}</strong></div>)}</div>
  </section>;
}

function RecoveryChart({ verification, ticket }: { verification: DoctorVerification; ticket: DoctorTicket }) {
  const before = Math.max(0, Math.min(1, verification.beforeRatio ?? 0));
  const after = Math.max(0, Math.min(1, verification.afterRatio ?? 0));
  return <div className="sd-recovery">
    <div className="sd-recovery-head"><div><span className="sd-eyebrow">RECOVERY VERIFICATION</span><h3>{verification.outcome}</h3></div><span className={`sd-chip ${tone(verification.outcome)}`}>{verification.changePercentagePoints === null ? 'Insufficient evidence' : `${verification.changePercentagePoints >= 0 ? '+' : ''}${verification.changePercentagePoints.toFixed(1)} pp`}</span></div>
    <div className="sd-recovery-bars">
      <div><span>Before service</span><i><b style={{ width: `${before * 100}%` }}/></i><strong>{percent(verification.beforeRatio)}</strong><small>{verification.before.length} scored days ending {fullDay(ticket.evidence.end)}</small></div>
      <div><span>After service</span><i><b className="after" style={{ width: `${after * 100}%` }}/></i><strong>{percent(verification.afterRatio)}</strong><small>{verification.after.length} scored days after {fullDay(verification.performedDate)}</small></div>
    </div>
    <div className="sd-recovery-meta">
      <div><span>Estimated incremental avoided-energy value</span><strong>{money(verification.benefitInr)}</strong></div>
      <div><span>Baseline version</span><strong>{verification.baselineVersion}</strong></div>
      <div><span>Verification run</span><strong>{dateTime(verification.at)}</strong></div>
    </div>
    {verification.financial && <details className="sd-assumptions"><summary>How is the recovery value calculated?</summary>{verification.financial.assumptions.map(line => <p key={line}>{line}</p>)}</details>}
    <div className="sd-limitations"><strong>Limitations</strong><ul>{verification.limitations.map(line => <li key={line}>{line}</li>)}</ul></div>
    <p className="sd-caption">Improvement after service is evidence of change, not proof that the maintenance caused it. Completion alone is never shown as recovery.</p>
  </div>;
}

function TicketActions({ ticket, overview, busy, act, downloadReport }: {
  ticket: DoctorTicket;
  overview: DoctorOverview;
  busy: boolean;
  act: (path: string, body: unknown, message: string) => Promise<void>;
  downloadReport: (ticket: DoctorTicket) => void;
}) {
  const [partnerId, setPartnerId] = useState(overview.partners[0]?.id ?? '');
  useEffect(() => { if (!overview.partners.some(partner => partner.id === partnerId)) setPartnerId(overview.partners[0]?.id ?? ''); }, [overview.partners, partnerId]);
  const base = `/business/properties/${ticket.propertyId}/doctor/tickets/${ticket.id}`;
  const state = ticket.state;
  const canReopen = ['Closed', 'Verified', 'Awaiting Approval', 'Quote Submitted', 'Verification Pending'].includes(state);
  const canCancel = ['Draft', 'Submitted', 'Assigned', 'Accepted', 'Inspection Scheduled', 'Inspection Completed', 'Quote Submitted', 'Awaiting Approval'].includes(state);
  return <div className="sd-ticket-actions">
    {state === 'Draft' && <>
      <label className="sd-field"><span>Authorised installer</span><select value={partnerId} onChange={event => setPartnerId(event.target.value)}>{overview.partners.map(partner => <option key={partner.id} value={partner.id}>{partner.name}</option>)}</select></label>
      <button className="sd-button primary" disabled={busy || !partnerId} onClick={() => act(`${base}/submit`, { partnerId }, 'Ticket submitted to the selected installer.')}>Submit to installer</button>
      <button className="sd-button danger" disabled={busy} onClick={() => act(`${base}/cancel`, { reason: 'Cancelled before submission.' }, 'Draft ticket cancelled.')}>Cancel</button>
    </>}
    {(state === 'Submitted' || state === 'Reopened') && <>
      <label className="sd-field"><span>Assign installer</span><select value={partnerId} onChange={event => setPartnerId(event.target.value)}>{overview.partners.map(partner => <option key={partner.id} value={partner.id}>{partner.name}</option>)}</select></label>
      <button className="sd-button primary" disabled={busy || !partnerId} onClick={() => act(`${base}/assign`, { partnerId }, 'Ticket assigned. The installer can now accept the work.')}>Assign installer</button>
      {canCancel && <button className="sd-button danger" disabled={busy} onClick={() => act(`${base}/cancel`, { reason: 'Cancelled by the operator.' }, 'Ticket cancelled.')}>Cancel</button>}
    </>}
    {['Quote Submitted', 'Awaiting Approval'].includes(state) && <>
      {ticket.quotes.filter(quote => !quote.decision).map(quote => <div className="sd-quote-actions" key={quote.id}>
        <div><strong>{money(quote.amountInr)}</strong><span>{quote.scope}</span></div>
        <button className="sd-button primary" disabled={busy} onClick={() => act(`${base}/approve-quote`, { quoteId: quote.id }, 'Quotation approved. No payment was executed.')}>Approve quote</button>
        <button className="sd-button outline" disabled={busy} onClick={() => act(`${base}/reject-quote`, { quoteId: quote.id, reason: 'Operator declined this quotation.' }, 'Quotation rejected and the ticket reopened.')}>Reject</button>
      </div>)}
      {ticket.quotes.every(quote => quote.decision) && <p className="sd-caption">Every quotation has a recorded decision. No payment is executed in this MVP.</p>}
    </>}
    {state === 'Verification Pending' && <>
      <p className="sd-caption">The installer recorded completion on {ticket.completion ? fullDay(ticket.completion.performedDate) : 'an unknown date'}. Run the separate weather-adjusted before/after verification. Completion is not recovery.</p>
      <button className="sd-button primary" disabled={busy} onClick={() => act(`${base}/verify`, {}, 'Recovery verification completed. Review the evidence and limitations.')}>Verify recovery</button>
      <button className="sd-button danger" disabled={busy} onClick={() => act(`${base}/reopen`, { reason: 'Completion evidence requires further work.' }, 'Ticket reopened for further work.')}>Reopen</button>
    </>}
    {state === 'Verified' && <>
      <button className="sd-button primary" disabled={busy} onClick={() => act(`${base}/close`, {}, 'Ticket closed after separate recovery verification.')}>Close verified ticket</button>
      <button className="sd-button outline" disabled={busy} onClick={() => act(`${base}/reopen`, { reason: 'Recovery requires re-checking.' }, 'Verified ticket reopened for re-checking.')}>Reopen</button>
    </>}
    {(state === 'Verified' || state === 'Closed' || ticket.verification) && <button className="sd-button outline" disabled={busy} onClick={() => downloadReport(ticket)}>Download recovery report</button>}
    {state === 'Closed' && <button className="sd-button outline" disabled={busy} onClick={() => act(`${base}/reopen`, { reason: 'Operator reopened the closed ticket.' }, 'Closed ticket reopened.')}>Reopen ticket</button>}
    {state === 'Work Completed' && <p className="sd-caption">The installer has recorded completion but has not submitted the evidence package. Verification becomes available after submission.</p>}
    {state === 'In Progress' && <p className="sd-caption">Work is in progress. The operator verifies recovery only after completion evidence is submitted.</p>}
    {state === 'Approved' && <p className="sd-caption">Quotation approved. Waiting for the installer to start work. No payment is executed here.</p>}
    {canReopen && state !== 'Verified' && state !== 'Closed' && <button className="sd-button outline" disabled={busy} onClick={() => act(`${base}/reopen`, { reason: 'Operator reopened the ticket.' }, 'Ticket reopened.')}>Reopen</button>}
  </div>;
}

export default function SolarDoctor({ property, canWrite, focusIncidentId, onOpenDetective }: {
  property: BusinessProperty;
  canWrite: boolean;
  focusIncidentId?: string;
  onOpenDetective?: () => void;
}) {
  const base = `/business/properties/${property.id}`;
  const [mode, setMode] = useState<DoctorMode>('demo');
  const [overview, setOverview] = useState<DoctorOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [selectedIncidentId, setSelectedIncidentId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState('');
  const [description, setDescription] = useState('');
  const [showSuppress, setShowSuppress] = useState(false);
  const [suppressReason, setSuppressReason] = useState('Planned maintenance or planned outage.');
  const [suppressDays, setSuppressDays] = useState(7);
  const [roiAction, setRoiAction] = useState('Professional inspection and corrective maintenance');
  const [roiCost, setRoiCost] = useState(15000);
  const [roiDuration, setRoiDuration] = useState(30);
  const [roiLow, setRoiLow] = useState(20);
  const [roiBase, setRoiBase] = useState(50);
  const [roiHigh, setRoiHigh] = useState(80);
  const [simulation, setSimulation] = useState<DoctorRepairSimulation | null>(null);
  const [question, setQuestion] = useState('Why was this period flagged, and what should I check first?');
  const [answer, setAnswer] = useState('');
  const [answerMode, setAnswerMode] = useState('');

  const load = async (nextMode: DoctorMode = mode, quiet = false) => {
    if (!quiet) setLoading(true);
    setError('');
    try {
      const result = await api<DoctorOverview>(`${base}/doctor/overview?mode=${nextMode}`);
      setOverview(result);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  };

  useEffect(() => { setSelectedIncidentId(''); setSelectedTicketId(''); setSimulation(null); void load(mode); }, [property.id]);
  useEffect(() => { if (focusIncidentId) { setSelectedIncidentId(focusIncidentId); setSelectedDate(''); } }, [focusIncidentId]);

  const incidents = overview?.incidents ?? [];
  const incident = incidents.find(item => item.id === selectedIncidentId) ?? incidents[0];
  useEffect(() => {
    if (!overview?.incidents.length) return;
    if (!overview.incidents.some(item => item.id === selectedIncidentId)) {
      setSelectedIncidentId(overview.incidents[0].id);
      setSelectedDate('');
    }
  }, [overview?.incidents, selectedIncidentId]);
  useEffect(() => {
    if (!incident) return;
    if (!incident.days.some(day => day.date === selectedDate)) setSelectedDate(incident.days[0]?.date ?? '');
    setSimulation(null);
    setDescription('');
  }, [incident?.id]);

  const tickets = useMemo(() => overview?.tickets ?? [], [overview]);
  const incidentTicket = incident ? [...tickets].filter(ticket => ticket.incidentId === incident.id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] : undefined;
  const ticket = tickets.find(item => item.id === selectedTicketId) ?? incidentTicket ?? tickets[0];
  useEffect(() => {
    if (!ticket) return;
    if (!tickets.some(item => item.id === selectedTicketId)) setSelectedTicketId(ticket.id);
  }, [tickets, selectedTicketId, ticket?.id]);
  const selectedDay = incident?.days.find(day => day.date === selectedDate) ?? incident?.days[0];

  const act = async (path: string, body: unknown, message: string) => {
    setBusy(true); setError(''); setNotice('');
    try { await post(path, body); await load(mode, true); setNotice(message); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };
  const switchMode = async (next: DoctorMode) => {
    setMode(next); setNotice(''); setAnswer(''); setSimulation(null);
    await load(next);
  };
  const seedDemo = async () => {
    setBusy(true); setError('');
    try { await post(`${base}/doctor/demo`, {}); await load('demo', true); setMode('demo'); setNotice('Synthetic Solar Doctor analysis generated from the seeded weather experiment.'); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };
  const refresh = async () => {
    setBusy(true); setError('');
    try { await post(`${base}/doctor/sync`, { mode }); await load(mode, true); setNotice('Weather-adjusted analysis refreshed. Existing incident evidence snapshots were retained.'); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };
  const simulate = async () => {
    if (!incident) return;
    setBusy(true); setError('');
    try {
      const result = await post<DoctorRepairSimulation>(`${base}/doctor/repair-scenarios`, {
        incidentId: incident.id, action: roiAction, costInr: roiCost, durationDays: roiDuration,
        lowPercent: roiLow, basePercent: roiBase, highPercent: roiHigh,
      });
      setSimulation(result);
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };
  const ask = async () => {
    if (!question.trim()) return;
    setBusy(true); setError('');
    try {
      const result = await post<{ answer: string; mode: string }>(`${base}/doctor/explain`, {
        question, mode, incidentId: incident?.id, ticketId: ticket?.id,
      });
      setAnswer(result.answer); setAnswerMode(result.mode);
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };
  const downloadReport = async () => {
    if (!ticket) return;
    setBusy(true); setError('');
    try {
      const text = await api<string>(`${base}/doctor/tickets/${ticket.id}/report`);
      const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
      const link = document.createElement('a'); link.href = url; link.download = `solar-doctor-recovery-${ticket.id.slice(0, 8)}.txt`; link.click(); URL.revokeObjectURL(url);
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };

  if (loading && !overview) return <div className="sd-doctor"><section className="sd-panel sd-loading" role="status"><span className="material-symbols-outlined">monitor_heart</span><h2>Running the weather-adjusted check…</h2><p>Separating weather variation, unusual underperformance and data-quality gaps.</p></section></div>;

  const report = overview?.report ?? null;
  const activeImpact = overview?.summary.activeImpactInr ?? 0;

  if (!report) return <div className="sd-doctor">
    <section className="sd-hero">
      <div><span className="sd-eyebrow">SOLAR DOCTOR</span><h1>From an unusual day to verified recovery.</h1><p>Weather-aware investigation, deterministic financial impact, authorised maintenance and proof-of-recovery evidence — in one audit trail.</p></div>
      <span className="sd-mode-pill">NO AUTHORISED ANALYSIS</span>
    </section>
    {error && <div className="sd-alert" role="alert"><span>{error}</span><button onClick={() => setError('')} aria-label="Dismiss error">×</button></div>}
    <section className="sd-panel sd-empty">
      <span className="material-symbols-outlined">stethoscope</span>
      <h2>{mode === 'demo' ? 'Start with the synthetic Solar Doctor demonstration.' : 'Property weather analysis is not available yet.'}</h2>
      <p>{mode === 'demo'
        ? 'The demo runs the existing Isolation Forest worker on the seeded synthetic solar and weather experiment. It is clearly labelled and is not property telemetry.'
        : 'Import authorised hourly readings and confirm the property site settings in the weather-aware Savings Detective first. Solar Doctor does not substitute synthetic data for property readings.'}</p>
      <div className="sd-empty-actions">
        <button className="sd-button primary" disabled={busy} onClick={seedDemo}>Run synthetic demo analysis</button>
        {onOpenDetective && <button className="sd-button outline" onClick={onOpenDetective}>Open weather-aware analysis</button>}
        <button className="sd-button ghost" disabled={busy} onClick={() => { setMode('property'); void load('property'); }}>Check property readings</button>
      </div>
    </section>
  </div>;

  return <div className="sd-doctor">
    <section className="sd-hero">
      <div><span className="sd-eyebrow">SOLAR DOCTOR</span><h1>From an unusual day to verified recovery.</h1><p>{property.inputs.name} · {property.inputs.city} · {number(report.site.capacityKwp)} kWp. Weather-adjusted detection, financial impact, maintenance and recovery evidence.</p></div>
      <div className="sd-hero-actions">
        <div className="sd-segmented" role="group" aria-label="Analysis source">
          <button className={mode === 'demo' ? 'active' : ''} onClick={() => void switchMode('demo')}>Synthetic demo</button>
          <button className={mode === 'property' ? 'active' : ''} onClick={() => void switchMode('property')}>Property readings</button>
        </div>
        <button className="sd-button outline" disabled={busy} onClick={refresh}>Refresh analysis</button>
      </div>
    </section>

    {error && <div className="sd-alert" role="alert"><span>{error}</span><button onClick={() => setError('')} aria-label="Dismiss error">×</button></div>}
    {notice && <div className="sd-alert good" role="status"><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Dismiss notice">×</button></div>}
    {overview?.analysisError && <div className="sd-alert" role="alert"><span>{overview.analysisError}</span></div>}

    <div className="sd-disclosure"><span className="material-symbols-outlined">verified_user</span><div><strong>What this analysis can and cannot say</strong>{overview?.disclosure.map(line => <p key={line}>{line}</p>)}</div></div>

    <div className="sd-kpis">
      <div><span>Active estimated shortfall</span><strong>{compactMoney(activeImpact)}</strong><small>Deterministic avoided-energy-charge estimate · not an audited bill loss</small></div>
      <div><span>Energy shortfall</span><strong>{number(overview?.summary.activeEnergyShortfallKwh)} <i>kWh</i></strong><small>Across active weather-adjusted underperformance periods</small></div>
      <div><span>Active anomaly periods</span><strong>{overview?.summary.activeIncidents ?? 0}</strong><small>{overview?.summary.dataQualityIncidents ?? 0} data-quality period(s) separated</small></div>
      <div><span>Open maintenance</span><strong>{overview?.summary.openTickets ?? 0}</strong><small>{overview?.summary.verifiedTickets ?? 0} ticket(s) with recovery evidence</small></div>
      <div><span>Scored days</span><strong>{overview?.summary.scoreableDays ?? 0}<i> / {overview?.summary.totalDays ?? 0}</i></strong><small>Missing readings are excluded, never zero-filled</small></div>
    </div>

    <div className="sd-grid">
      <section className="sd-panel sd-explorer">
        <div className="sd-panel-heading"><div><span className="sd-eyebrow">DETECT · INVESTIGATE</span><h2>Anomaly periods</h2></div><span className="sd-chip neutral">{incidents.length} period{incidents.length === 1 ? '' : 's'}</span></div>
        <div className="sd-incident-list">{incidents.length === 0 && <div className="sd-inline-empty"><span className="material-symbols-outlined">check_circle</span><div><strong>No anomaly periods in this analysis.</strong><p>That does not guarantee equipment health. Weather, load and data coverage still matter.</p></div></div>}
          {incidents.map(item => <button key={item.id} className={`sd-incident ${item.id === incident?.id ? 'active' : ''} ${item.kind === 'DATA_QUALITY' ? 'quality' : ''}`} onClick={() => { setSelectedIncidentId(item.id); setSelectedDate(''); }}>
            <span className="sd-incident-icon"><span className="material-symbols-outlined">{item.kind === 'DATA_QUALITY' ? 'data_alert' : item.warnings.some(warning => warning.severity === 'safety') ? 'warning' : 'bolt'}</span></span>
            <span className="sd-incident-main"><strong>{item.kind === 'DATA_QUALITY' ? 'Data quality gap' : 'Weather-adjusted underperformance'}</strong><small>{fullDay(item.start)}{item.start === item.end ? '' : ` → ${fullDay(item.end)}`} · {item.days.length} day{item.days.length === 1 ? '' : 's'}</small></span>
            <span className={`sd-chip ${tone(item.priority)}`}>{item.priority}</span>
            <span className="sd-incident-value">{item.financial.impactInr === null ? 'Not valued' : compactMoney(item.financial.impactInr)}</span>
            {item.suppressedUntil && <span className="sd-suppressed">Suppressed</span>}
          </button>)}
        </div>
      </section>

      <section className="sd-panel sd-detail">
        {!incident ? <div className="sd-inline-empty"><div><strong>Select an anomaly period.</strong><p>Incidents appear here with observed evidence, possible causes and recommended checks.</p></div></div> : <>
          <div className="sd-panel-heading"><div><span className="sd-eyebrow">{incident.kind === 'DATA_QUALITY' ? 'DATA QUALITY' : 'WEATHER-ADJUSTED EVIDENCE'}</span><h2>{fullDay(incident.start)}{incident.start === incident.end ? '' : ` → ${fullDay(incident.end)}`}</h2></div><span className={`sd-chip ${tone(incident.priority)}`}>{incident.priority}</span></div>
          <div className="sd-detail-meta">
            <span><b>Source</b>{mode === 'demo' ? 'Synthetic demo experiment' : 'Property readings + ERA5 weather'}</span>
            <span><b>Model</b>{incident.modelVersion}</span>
            <span><b>Baseline</b>{incident.baselineVersion}</span>
            <span><b>Evidence snapshot</b>{dateTime(incident.createdAt)}</span>
          </div>
          {incident.warnings.filter(warning => warning.severity === 'safety').map(warning => <div key={warning.source} className="sd-warning safety"><span className="material-symbols-outlined">health_and_safety</span><div><strong>Safety-related warning</strong><p>{warning.text}</p><small>Source: {warning.source.replaceAll('_', ' ').toLowerCase()}</small></div></div>)}
          {incident.warnings.filter(warning => warning.severity !== 'safety').map(warning => <div key={warning.source} className="sd-warning info"><span className="material-symbols-outlined">info</span><div><strong>Data note</strong><p>{warning.text}</p></div></div>)}

          <div className="sd-detail-columns">
            <div><h3>Observed</h3><ul className="sd-list observed">{incident.observed.map(line => <li key={line}>{line}</li>)}</ul></div>
            <div><h3>Possible explanations — unconfirmed</h3><ul className="sd-list possible">{incident.possible.map(line => <li key={line}>{line}</li>)}</ul></div>
            <div><h3>Recommended checks</h3><ol className="sd-list checks">{incident.checks.map(line => <li key={line}>{line}</li>)}</ol></div>
          </div>

          <IncidentChart days={incident.days} selected={selectedDate} onSelect={setSelectedDate}/>
          {selectedDay && <DayDetail day={selectedDay}/>}

          <div className="sd-finance">
            <div className="sd-finance-head"><div><span className="sd-eyebrow">QUANTIFY</span><h3>{incident.kind === 'DATA_QUALITY' ? 'No financial loss inferred' : 'Estimated financial impact'}</h3></div><span className="sd-chip neutral">Deterministic arithmetic</span></div>
            {incident.kind === 'DATA_QUALITY' ? <p>Missing or inconsistent evidence is not converted into zero generation or a financial loss. Restore trustworthy data before valuing this period.</p> : <>
              <div className="sd-finance-grid">
                <div><span>Estimated avoided-energy-charge shortfall</span><strong>{money(incident.financial.impactInr)}</strong></div>
                <div><span>Energy shortfall</span><strong>{number(incident.financial.energyShortfallKwh)} kWh</strong></div>
                <div><span>Expected generation</span><strong>{number(incident.financial.expectedKwh)} kWh</strong></div>
                <div><span>Actual generation</span><strong>{number(incident.financial.actualKwh)} kWh</strong></div>
                <div><span>Import tariff</span><strong>₹{number(incident.financial.tariffInr, 2)}/kWh</strong></div>
                <div><span>Scored days</span><strong>{incident.days.filter(day => day.eligible).length}</strong></div>
              </div>
              <p className="sd-caption">This estimate sums hourly avoided import charges using the saved tariff. It excludes fixed charges, demand charges, export settlement, taxes, tenant sharing and financing. It is not an audited utility-bill loss.</p>
              <details className="sd-assumptions"><summary>Assumptions and calculation basis</summary>{incident.financial.assumptions.map(line => <p key={line}>{line}</p>)}</details>
            </>}
            <div className="sd-priority"><strong>Why this priority?</strong><ul>{incident.priorityReasons.map(line => <li key={line}>{line}</li>)}</ul></div>
          </div>

          {canWrite && <div className="sd-incident-actions">
            <div className="sd-action-row">
              <button className="sd-button outline" disabled={busy || Boolean(incident.acknowledgedAt)} onClick={() => act(`${base}/doctor/anomalies/${incident.id}/acknowledge`, {}, 'Anomaly acknowledged. It remains active until resolved or suppressed.')}>{incident.acknowledgedAt ? 'Acknowledged ✓' : 'Acknowledge anomaly'}</button>
              <button className="sd-button ghost" disabled={busy} onClick={() => setShowSuppress(open => !open)}>Suppress temporarily</button>
            </div>
            {showSuppress && <div className="sd-suppress">
              <label className="sd-field"><span>Reason</span><input value={suppressReason} maxLength={500} onChange={event => setSuppressReason(event.target.value)}/></label>
              <label className="sd-field"><span>Days (1–30)</span><input type="number" min={1} max={30} value={suppressDays} onChange={event => setSuppressDays(Number(event.target.value))}/></label>
              <button className="sd-button danger" disabled={busy || !suppressReason.trim()} onClick={() => act(`${base}/doctor/anomalies/${incident.id}/suppress`, { reason: suppressReason, days: suppressDays }, 'Anomaly suppressed for the selected period. The evidence remains recorded.')}>Confirm suppression</button>
            </div>}
            {incident.suppressedUntil && <p className="sd-caption">Suppressed until {dateTime(incident.suppressedUntil)} · {incident.suppressionReason}. Detection evidence is retained.</p>}
            {!incidentTicket ? <div className="sd-create-ticket">
              <label className="sd-field"><span>Maintenance request</span><textarea rows={3} maxLength={1200} value={description} placeholder={`Investigate the ${incident.kind === 'DATA_QUALITY' ? 'data-quality gap' : 'weather-adjusted underperformance'} from ${incident.start}${incident.start === incident.end ? '' : ` to ${incident.end}`}.`} onChange={event => setDescription(event.target.value)}/></label>
              <button className="sd-button primary" disabled={busy} onClick={() => act(`${base}/doctor/tickets`, { incidentId: incident.id, description: description.trim() || undefined }, 'Draft maintenance ticket created from the persisted incident evidence.')}>Create maintenance ticket</button>
            </div> : <p className="sd-caption">This incident already has a maintenance ticket. Manage the workflow in the Maintenance tickets section below.</p>}
          </div>}
        </>}
      </section>

      <aside className="sd-side">
        <HealthCard overview={overview!}/>

        <section className="sd-panel sd-roi">
          <div className="sd-panel-heading"><div><span className="sd-eyebrow">PRIORITISE</span><h2>Repair ROI simulator</h2></div><span className="material-symbols-outlined">calculate</span></div>
          {!incident || incident.financial.impactInr === null ? <p className="sd-caption">A repair scenario cannot be valued for a data-quality period. Restore trustworthy readings first.</p> : <>
            <p className="sd-caption">Editable scenario arithmetic from this incident's persisted shortfall. It does not predict repair success or represent a real quotation.</p>
            <div className="sd-roi-form">
              <label className="sd-field"><span>Action</span><input value={roiAction} maxLength={200} onChange={event => setRoiAction(event.target.value)}/></label>
              <div className="sd-roi-grid">
                <label className="sd-field"><span>Cost (₹)</span><input type="number" min={0} max={10000000} value={roiCost} onChange={event => setRoiCost(Number(event.target.value))}/></label>
                <label className="sd-field"><span>Recovery days</span><input type="number" min={1} max={365} value={roiDuration} onChange={event => setRoiDuration(Number(event.target.value))}/></label>
              </div>
              <div className="sd-roi-grid three">
                <label className="sd-field"><span>Low %</span><input type="number" min={0} max={100} value={roiLow} onChange={event => setRoiLow(Number(event.target.value))}/></label>
                <label className="sd-field"><span>Base %</span><input type="number" min={0} max={100} value={roiBase} onChange={event => setRoiBase(Number(event.target.value))}/></label>
                <label className="sd-field"><span>High %</span><input type="number" min={0} max={100} value={roiHigh} onChange={event => setRoiHigh(Number(event.target.value))}/></label>
              </div>
              <button className="sd-button primary" disabled={busy || !canWrite} onClick={simulate}>Simulate scenarios</button>
              {!canWrite && <p className="sd-caption">A property owner or facility manager can run this simulation.</p>}
            </div>
            {simulation && <div className="sd-roi-results">
              <div className="sd-roi-table"><div className="head"><span>Scenario</span><span>Recovery</span><span>Benefit</span><span>Net</span><span>Payback</span></div>{simulation.scenarios.map(row => <div key={row.name}><span>{row.name}</span><span>{row.recoveryPercent}%</span><span>{compactMoney(row.estimatedBenefitInr)}</span><span className={row.netBenefitInr < 0 ? 'negative' : 'positive'}>{compactMoney(row.netBenefitInr)}</span><span>{row.paybackDays === null ? '—' : `${row.paybackDays} days`}</span></div>)}</div>
              <div className="sd-warning info"><span className="material-symbols-outlined">info</span><div><p>{simulation.warning}</p></div></div>
              <details className="sd-assumptions"><summary>Scenario assumptions</summary>{simulation.assumptions.map(line => <p key={line}>{line}</p>)}</details>
            </div>}
          </>}
        </section>

        <section className="sd-panel sd-helios">
          <div className="sd-panel-heading"><div><span className="sd-eyebrow">HELIOS Explains</span><h2>Evidence-grounded answers</h2></div><span className="material-symbols-outlined">auto_awesome</span></div>
          <p className="sd-caption">Helios receives only the server-side evidence and deterministic figures. It cannot calculate money, diagnose a fault or change the workflow.</p>
          <label className="sd-field"><span>Ask about this evidence</span><textarea rows={3} maxLength={1500} value={question} onChange={event => setQuestion(event.target.value)}/></label>
          <button className="sd-button primary" disabled={busy || !question.trim() || !canWrite} onClick={ask}>Ask Helios</button>
          {answer && <div className="sd-answer"><div className="sd-answer-head"><span className="material-symbols-outlined">auto_awesome</span><strong>{answerMode === 'gemini' ? 'Helios · grounded AI answer' : 'Deterministic evidence answer'}</strong></div><p>{answer}</p></div>}
        </section>
      </aside>
    </div>

    <section className="sd-panel sd-tickets-section">
      <div className="sd-panel-heading"><div><span className="sd-eyebrow">REPAIR · VERIFY RECOVERY</span><h2>Maintenance tickets</h2><p>Draft → quote → approved work → completion evidence → separate recovery verification. Completion is not proof of recovery.</p></div><span className="sd-chip neutral">{tickets.length} ticket{tickets.length === 1 ? '' : 's'}</span></div>
      {tickets.length === 0 ? <div className="sd-inline-empty"><span className="material-symbols-outlined">handyman</span><div><strong>No maintenance tickets yet.</strong><p>Create a ticket from an anomaly period above. The original evidence is snapshotted so a later model version cannot rewrite it.</p></div></div> : <div className="sd-ticket-layout">
        <div className="sd-ticket-list">{tickets.map(item => <button key={item.id} className={`sd-ticket-row ${ticket?.id === item.id ? 'active' : ''}`} onClick={() => setSelectedTicketId(item.id)}>
          <span className={`sd-chip ${tone(item.state)}`}>{item.state}</span>
          <strong>{item.description}</strong>
          <small>{item.assignedInstallerName ?? 'Unassigned'} · {fullDay(item.evidence.start)}{item.evidence.start === item.evidence.end ? '' : ` → ${fullDay(item.evidence.end)}`}</small>
          <span className="sd-ticket-row-meta">{item.priority} · v{item.version} · {dateTime(item.updatedAt)}</span>
        </button>)}</div>
        {ticket && <div className="sd-ticket-detail">
          <div className="sd-ticket-head"><div><span className={`sd-chip ${tone(ticket.state)}`}>{ticket.state}</span><h3>{ticket.description}</h3><p>{ticket.propertySnapshot.name} · {ticket.propertySnapshot.city} · {number(ticket.propertySnapshot.capacityKwp)} kWp · {ticket.priority} priority</p></div><span className="sd-source-chip">{ticket.source === 'SYNTHETIC' ? 'Synthetic demo evidence' : 'Property evidence'}</span></div>
          <div className="sd-ticket-meta">
            <div><span>Assigned installer</span><strong>{ticket.assignedInstallerName ?? 'Not assigned'}</strong></div>
            <div><span>Inspection</span><strong>{ticket.inspection ? `${ticket.inspection.classification} · ${dateTime(ticket.inspection.at)}` : 'Not recorded'}</strong></div>
            <div><span>Scheduled</span><strong>{ticket.scheduledAt ? dateTime(ticket.scheduledAt) : 'Not scheduled'}</strong></div>
            <div><span>Completion</span><strong>{ticket.completion ? `${fullDay(ticket.completion.performedDate)} · recorded` : 'Not recorded'}</strong></div>
          </div>
          {ticket.inspection && <div className="sd-ticket-block"><h4>Installer inspection findings</h4><p><span className="sd-chip neutral">{ticket.inspection.classification}</span>{ticket.inspection.findings}</p></div>}
          {ticket.quotes.length > 0 && <div className="sd-ticket-block"><h4>Quotations</h4>{ticket.quotes.map(quote => <div key={quote.id} className="sd-quote-row"><div><strong>{money(quote.amountInr)}</strong><p>{quote.scope}</p></div><span className={`sd-chip ${quote.decision === 'approved' ? 'good' : quote.decision === 'rejected' ? 'critical' : 'medium'}`}>{quote.decision ?? 'pending'}</span></div>)}</div>}
          {ticket.completion && <div className="sd-ticket-block"><h4>Work recorded — not yet proof of recovery</h4><p>{ticket.completion.workPerformed}</p><small>Service date {fullDay(ticket.completion.performedDate)} · {ticket.attachments.find(attachment => attachment.id === ticket.completion!.attachmentId)?.content ?? 'Evidence attachment retained.'}</small></div>}
          {ticket.verification && <div className="sd-ticket-block"><RecoveryChart verification={ticket.verification} ticket={ticket}/></div>}
          {canWrite ? <TicketActions ticket={ticket} overview={overview!} busy={busy} act={act} downloadReport={downloadReport}/> : <p className="sd-caption">Read-only view. A property owner or facility manager can action this ticket.</p>}
          <div className="sd-timeline"><h4>Audit timeline</h4>{ticket.audit.map(entry => <div key={entry.id}><i/><div><strong>{entry.action.replaceAll('_', ' ')}</strong><p>{entry.detail}</p><small>{dateTime(entry.at)}</small></div></div>)}</div>
        </div>}
      </div>}
    </section>
  </div>;
}
