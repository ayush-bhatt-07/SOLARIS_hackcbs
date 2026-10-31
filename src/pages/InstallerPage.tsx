import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api, post } from '../utils/api';
import type { InstallerTicketView } from '../types/solarDoctor';
import './installer.css';

const money = (value: number | null | undefined) => value === null || value === undefined ? '—' : `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const number = (value: number | null | undefined, digits = 1) => value === null || value === undefined ? '—' : value.toLocaleString('en-IN', { maximumFractionDigits: digits });
const fullDay = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const dateTime = (value: string) => new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const today = () => new Date().toISOString().slice(0, 10);
const plusDays = (value: string, days: number) => {
  const target = new Date(`${value}T00:00:00Z`); target.setUTCDate(target.getUTCDate() + days);
  const iso = target.toISOString().slice(0, 10);
  return iso > today() ? today() : iso;
};
const steps = ['Assigned', 'Accepted', 'Inspection Scheduled', 'Inspection Completed', 'Quote Submitted', 'Approved', 'In Progress', 'Work Completed', 'Verification Pending', 'Verified'];
const tone = (state: string) => ['Critical', 'Cancelled', 'Deteriorated'].includes(state) ? 'critical'
  : ['High', 'Verification Pending', 'Quote Submitted', 'Awaiting Approval'].includes(state) ? 'high'
    : ['Medium', 'Assigned', 'Accepted', 'Inspection Scheduled', 'Inspection Completed', 'Approved', 'In Progress', 'Work Completed', 'Reopened'].includes(state) ? 'medium'
      : 'good';

function EvidenceChart({ days }: { days: InstallerTicketView['evidence']['days'] }) {
  const max = Math.max(1, ...days.flatMap(day => [day.expectedKwh ?? 0, day.actualKwh ?? 0]));
  return <div className="ip-chart">
    <div className="ip-chart-key"><span><i className="expected"/>Weather-adjusted expectation</span><span><i className="actual"/>Actual</span></div>
    <div className="ip-chart-bars">{days.map(day => <div key={day.date} title={`${fullDay(day.date)} · ${day.weather.toLowerCase()} · expected ${number(day.expectedKwh)} kWh · actual ${number(day.actualKwh)} kWh`}>
      <span><i className="expected" style={{ height: `${Math.max(2, (day.expectedKwh ?? 0) / max * 100)}%` }}/><i className="actual" style={{ height: `${day.actualKwh === null ? 0 : Math.max(2, day.actualKwh / max * 100)}%` }}/></span>
      <small>{day.date.slice(5)}</small>
    </div>)}</div>
    <p>Weather-adjusted expected vs actual generation. The installer does not receive the property's financial impact or tenant data.</p>
  </div>;
}

export const InstallerPage: React.FC = () => {
  const { logOut, currentUser } = useApp();
  const [profile, setProfile] = useState<{ name: string; email: string; organisationId: string; membership?: { role: string; organisationId: string } } | null>(null);
  const [tickets, setTickets] = useState<InstallerTicketView[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [declineReason, setDeclineReason] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [findings, setFindings] = useState('');
  const [classification, setClassification] = useState<'Observed' | 'Possible' | 'Confirmed'>('Observed');
  const [quoteAmount, setQuoteAmount] = useState(18000);
  const [quoteScope, setQuoteScope] = useState('Inspect and correct the flagged underperformance; replace or reseat affected DC connectors if required.');
  const [workPerformed, setWorkPerformed] = useState('Inspected array, DC connections and inverter logs. Reseated a loose MC4 connector on the affected string and cleaned accessible modules.');
  const [performedDate, setPerformedDate] = useState(today());
  const [completionEvidence, setCompletionEvidence] = useState('Synthetic service note: loose DC connector reseated; string voltage restored to operating range. Demonstration evidence only.');
  const [filter, setFilter] = useState<'open' | 'all'>('open');

  const load = async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError('');
    try {
      const result = await api<{ tickets: InstallerTicketView[] }>('/installer/maintenance-tickets');
      setTickets(result.tickets);
      setSelectedId(current => result.tickets.some(ticket => ticket.id === current) ? current : result.tickets[0]?.id ?? '');
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    let cancelled = false;
    api('/session').then(result => {
      if (cancelled) return;
      if (result.account.membership?.workspace !== 'installer') throw new Error('An installer workspace membership is required.');
      setProfile(result.account);
    }).catch(e => { if (!cancelled) setError(e.message); });
    void load();
    return () => { cancelled = true; };
  }, []);

  const ticket = tickets.find(item => item.id === selectedId) ?? tickets[0];
  useEffect(() => {
    if (!ticket) return;
    setScheduledAt(ticket.scheduledAt ? new Date(ticket.scheduledAt).toISOString().slice(0, 16) : `${plusDays(ticket.evidence.end, 2)}T10:00`);
    setPerformedDate(plusDays(ticket.evidence.end, 7));
    setDeclineReason(''); setFindings(''); setClassification('Observed'); setQuoteAmount(18000); setQuoteScope('Inspect and correct the flagged underperformance; replace or reseat affected DC connectors if required.');
    setWorkPerformed('Inspected array, DC connections and inverter logs. Reseated a loose MC4 connector on the affected string and cleaned accessible modules.');
    setCompletionEvidence('Synthetic service note: loose DC connector reseated; string voltage restored to operating range. Demonstration evidence only.');
  }, [ticket?.id]);

  const shown = useMemo(() => filter === 'open'
    ? tickets.filter(item => !['Verified'].includes(item.state))
    : tickets, [tickets, filter]);

  const act = async (path: string, body: unknown, message: string) => {
    setBusy(true); setError(''); setNotice('');
    try { await post(path, body); await load(true); setNotice(message); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };
  const seedDemo = async () => {
    setBusy(true); setError('');
    try {
      const result = await post<{ tickets: InstallerTicketView[] }>('/installer/maintenance-tickets/demo-seed', {});
      setTickets(result.tickets); setSelectedId(result.tickets[0]?.id ?? ''); setNotice('Synthetic demo job created from a real weather-adjusted Solar Doctor incident. It is not real customer work.');
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };
  const step = ticket ? steps.indexOf(ticket.state) : -1;

  if (error && !tickets.length) return <div className="ip-app"><main className="ip-error"><span className="material-symbols-outlined">engineering</span><h1>Installer workspace unavailable</h1><p role="alert">{error}</p><div><button className="ip-button primary" onClick={() => { setError(''); void load(); }}>Retry</button><button className="ip-button ghost" onClick={logOut}>Return to login</button></div></main></div>;

  return <div className="ip-app">
    <aside className="ip-sidebar">
      <a className="ip-brand" href="#/"><span className="ip-logo"><span className="material-symbols-outlined">solar_power</span></span>SOLARIS<span className="ip-version">2.0</span></a>
      <div className="ip-workspace"><span className="ip-dot"/>INSTALLER WORKSPACE</div>
      <p className="ip-nav-label">SERVICE DELIVERY</p>
      <nav aria-label="Installer navigation">
        <button className={filter === 'open' ? 'active' : ''} onClick={() => setFilter('open')}><span className="material-symbols-outlined">handyman</span><span>Assigned work</span>{tickets.filter(item => item.state !== 'Verified').length > 0 && <small>{tickets.filter(item => item.state !== 'Verified').length}</small>}</button>
        <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}><span className="material-symbols-outlined">history</span><span>All jobs</span></button>
      </nav>
      <div className="ip-sidebar-note"><span className="material-symbols-outlined">verified_user</span><strong>Scope-protected access</strong><p>Only work assigned to your installer organisation is visible. Customer financials and tenant data are withheld.</p></div>
      <div className="ip-sidebar-bottom">
        <button className="ip-account" onClick={logOut}><span className="ip-avatar">{(profile?.name ?? currentUser.name).slice(0, 1)}</span><span><strong>{profile?.name ?? currentUser.name}</strong><small>{profile?.membership?.role === 'installer_engineer' ? 'Installer engineer' : 'Installer admin'} · Log out</small></span><span className="material-symbols-outlined">logout</span></button>
      </div>
    </aside>

    <div className="ip-main">
      <header className="ip-topbar"><div><span className="ip-breadcrumb">Workspace <span>/</span> Installer</span><strong>Assigned maintenance</strong></div><div className="ip-topbar-right"><span className="ip-pill"><span className="ip-dot"/>Synthetic partner</span><button className="ip-button outline" onClick={logOut}>Log out<span className="material-symbols-outlined">logout</span></button></div></header>
      <main className="ip-content">
        <section className="ip-hero">
          <div><span className="ip-eyebrow">SOLAR DOCTOR · INSTALLER DELIVERY</span><h1>Repair the cause. Document the evidence.</h1><p>Accept assigned work, inspect, quote, complete and submit evidence. The property operator alone verifies recovery from weather-adjusted performance.</p></div>
          <span className="ip-hero-badge"><span className="material-symbols-outlined">engineering</span>{(profile?.membership?.organisationId ?? profile?.organisationId ?? 'Installer').toString().slice(0, 22)}</span>
        </section>

        {error && <div className="ip-alert" role="alert"><span className="material-symbols-outlined">error</span><span>{error}</span><button onClick={() => setError('')} aria-label="Dismiss error">×</button></div>}
        {notice && <div className="ip-alert good" role="status"><span className="material-symbols-outlined">check_circle</span><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Dismiss notice">×</button></div>}
        <div className="ip-disclosure"><span className="material-symbols-outlined">policy</span><p>This is an organisation-isolated installer workspace. Completion is not proof of recovery, and the installer cannot mark a ticket verified. All demo evidence is synthetic and explicitly labelled.</p></div>

        {loading ? <section className="ip-empty" role="status"><span className="material-symbols-outlined">hourglass_top</span><h2>Loading assigned maintenance…</h2></section> : shown.length === 0 ? <section className="ip-empty">
          <span className="material-symbols-outlined">assignment</span>
          <h2>{filter === 'open' ? 'No open assigned jobs.' : 'No jobs assigned to your organisation.'}</h2>
          <p>Work appears here only after a commercial property operator creates a Solar Doctor ticket and submits it to your installer organisation. You can create a clearly labelled synthetic demo job to explore the full workflow.</p>
          <div className="ip-empty-actions"><button className="ip-button primary" disabled={busy} onClick={seedDemo}>Load synthetic demo job</button><button className="ip-button outline" onClick={() => { setFilter('all'); void load(); }}>Refresh jobs</button></div>
        </section> : <div className="ip-grid">
          <section className="ip-panel ip-list-panel">
            <div className="ip-panel-heading"><div><span className="ip-eyebrow">ASSIGNED TO YOU</span><h2>{shown.length} job{shown.length === 1 ? '' : 's'}</h2></div><button className="ip-icon-button" onClick={() => void load()} aria-label="Refresh assigned jobs"><span className="material-symbols-outlined">refresh</span></button></div>
            <div className="ip-job-list">{shown.map(item => <button key={item.id} className={`ip-job ${ticket?.id === item.id ? 'active' : ''}`} onClick={() => setSelectedId(item.id)}>
              <div className="ip-job-top"><span className={`ip-chip ${tone(item.state)}`}>{item.state}</span><span className={`ip-chip ${tone(item.priority)}`}>{item.priority}</span></div>
              <strong>{item.property.name}</strong>
              <p>{item.description}</p>
              <small>{item.property.city} · {number(item.property.capacityKwp)} kWp · {item.evidence.kind === 'DATA_QUALITY' ? 'Data quality' : 'Underperformance'}</small>
              <em>{fullDay(item.evidence.start)}{item.evidence.start === item.evidence.end ? '' : ` → ${fullDay(item.evidence.end)}`}</em>
            </button>)}</div>
          </section>

          {ticket && <section className="ip-panel ip-detail">
            <div className="ip-detail-head"><div><div className="ip-chip-row"><span className={`ip-chip ${tone(ticket.state)}`}>{ticket.state}</span><span className={`ip-chip ${tone(ticket.priority)}`}>{ticket.priority} priority</span><span className="ip-chip neutral">{ticket.evidence.kind === 'DATA_QUALITY' ? 'Data-quality evidence' : 'Weather-adjusted evidence'}</span></div><h2>{ticket.property.name}</h2><p>{ticket.property.city} · {number(ticket.property.capacityKwp)} kWp · {fullDay(ticket.evidence.start)}{ticket.evidence.start === ticket.evidence.end ? '' : ` → ${fullDay(ticket.evidence.end)}`}</p></div><span className="ip-synthetic">Synthetic demo work</span></div>

            <div className="ip-progress" aria-label="Ticket progress">{steps.map((label, index) => <div key={label} className={index < step ? 'done' : index === step ? 'current' : ''}><i/><span>{label}</span></div>)}</div>

            <div className="ip-checklist-note"><span className="material-symbols-outlined">fact_check</span><div><strong>What the model observed — not a confirmed fault</strong><p>Isolation Forest flags unusual weather-adjusted performance. Use inspection findings to classify what you actually observe.</p></div></div>

            <div className="ip-evidence-grid">
              <div><h3>Observed evidence</h3><ul className="ip-list observed">{ticket.evidence.observed.map(line => <li key={line}>{line}</li>)}</ul></div>
              <div><h3>Possible explanations — unconfirmed</h3><ul className="ip-list possible">{ticket.evidence.possible.map(line => <li key={line}>{line}</li>)}</ul></div>
              <div><h3>Recommended checks</h3><ol className="ip-list checks">{ticket.evidence.checks.map(line => <li key={line}>{line}</li>)}</ol></div>
            </div>
            {ticket.evidence.warnings.map(warning => <div key={`${warning.source}-${warning.text}`} className={`ip-warning ${warning.severity}`}><span className="material-symbols-outlined">{warning.severity === 'safety' ? 'health_and_safety' : 'info'}</span><div><strong>{warning.severity === 'safety' ? 'Safety-related warning' : 'Data note'}</strong><p>{warning.text}</p><small>{warning.source.replaceAll('_', ' ').toLowerCase()}</small></div></div>)}
            <EvidenceChart days={ticket.evidence.days}/>

            {ticket.declineReason && <div className="ip-warning info"><span className="material-symbols-outlined">undo</span><div><strong>Previously declined</strong><p>{ticket.declineReason}</p></div></div>}

            {ticket.inspection && <div className="ip-record"><div className="ip-record-head"><h3>Inspection findings</h3><span className="ip-chip neutral">{ticket.inspection.classification}</span></div><p>{ticket.inspection.findings}</p><small>{dateTime(ticket.inspection.at)}</small></div>}
            {ticket.quotes.length > 0 && <div className="ip-record"><h3>Quotation</h3>{ticket.quotes.map(quote => <div key={quote.id} className="ip-quote"><div><strong>{money(quote.amountInr)}</strong><p>{quote.scope}</p></div><span className={`ip-chip ${quote.decision === 'approved' ? 'good' : quote.decision === 'rejected' ? 'critical' : 'medium'}`}>{quote.decision ?? 'awaiting operator decision'}</span></div>)}</div>}
            {ticket.completion && <div className="ip-record"><h3>Completion recorded</h3><p>{ticket.completion.workPerformed}</p><small>Service date {fullDay(ticket.completion.performedDate)} · {dateTime(ticket.completion.at)}</small><p className="ip-caption">Completion is not verification. The property operator must compare weather-adjusted performance before and after service.</p></div>}

            <div className="ip-action-panel">
              <div className="ip-action-head"><span className="ip-eyebrow">NEXT ACTION</span><h3>{ticket.state === 'Assigned' ? 'Accept or decline the assignment' : ticket.state === 'Accepted' ? 'Schedule the inspection' : ticket.state === 'Inspection Scheduled' ? 'Record inspection findings' : ticket.state === 'Inspection Completed' ? 'Submit a quotation' : ticket.state === 'Quote Submitted' ? 'Waiting for operator approval' : ticket.state === 'Approved' ? 'Start the approved work' : ticket.state === 'In Progress' ? 'Record completion' : ticket.state === 'Work Completed' ? 'Submit completion evidence' : ticket.state === 'Verification Pending' ? 'Waiting for operator recovery verification' : ticket.state === 'Verified' ? 'Job verified by the operator' : 'Await operator instructions'}</h3></div>

              {ticket.state === 'Assigned' && <>
                <div className="ip-action-row"><button className="ip-button primary" disabled={busy} onClick={() => act(`/installer/maintenance-tickets/${ticket.id}/accept`, {}, 'Assignment accepted. Schedule an inspection next.')}>Accept assignment</button></div>
                <label className="ip-field"><span>If declining, give a reason</span><textarea rows={2} maxLength={500} value={declineReason} onChange={event => setDeclineReason(event.target.value)} placeholder="Reason shown to the property operator"/></label>
                <button className="ip-button danger" disabled={busy || !declineReason.trim()} onClick={() => act(`/installer/maintenance-tickets/${ticket.id}/decline`, { reason: declineReason }, 'Assignment declined. The operator can reassign the work.')}>Decline assignment</button>
              </>}
              {ticket.state === 'Accepted' && <>
                <label className="ip-field"><span>Inspection date and time</span><input type="datetime-local" value={scheduledAt} onChange={event => setScheduledAt(event.target.value)}/></label>
                <button className="ip-button primary" disabled={busy || !scheduledAt} onClick={() => act(`/installer/maintenance-tickets/${ticket.id}/schedule`, { scheduledAt: new Date(scheduledAt).toISOString() }, 'Inspection scheduled. The property operator can see the appointment.')}>Schedule inspection</button>
              </>}
              {ticket.state === 'Inspection Scheduled' && <>
                <label className="ip-field"><span>Inspection findings</span><textarea rows={3} maxLength={4000} value={findings} onChange={event => setFindings(event.target.value)} placeholder="Record what you actually observed — not what the model suggested."/></label>
                <div className="ip-action-row"><label className="ip-field inline"><span>Classification</span><select value={classification} onChange={event => setClassification(event.target.value as typeof classification)}><option>Observed</option><option>Possible</option><option>Confirmed</option></select></label><button className="ip-button primary" disabled={busy || !findings.trim()} onClick={() => act(`/installer/maintenance-tickets/${ticket.id}/inspection`, { findings, classification }, 'Inspection recorded. Submit a quotation when ready.')}>Save inspection</button></div>
              </>}
              {ticket.state === 'Inspection Completed' && <>
                <div className="ip-action-row"><label className="ip-field"><span>Quotation amount (₹)</span><input type="number" min={1} max={100000000} value={quoteAmount} onChange={event => setQuoteAmount(Number(event.target.value))}/></label></div>
                <label className="ip-field"><span>Scope and basis</span><textarea rows={3} maxLength={1000} value={quoteScope} onChange={event => setQuoteScope(event.target.value)}/></label>
                <button className="ip-button primary" disabled={busy || !quoteScope.trim() || quoteAmount <= 0} onClick={() => act(`/installer/maintenance-tickets/${ticket.id}/quote`, { amountInr: quoteAmount, scope: quoteScope }, 'Quotation submitted. The property operator must approve it before work starts.')}>Submit quotation</button>
                <p className="ip-caption">No contract or payment is executed in this MVP.</p>
              </>}
              {ticket.state === 'Quote Submitted' && <p className="ip-caption">The quotation is with the property operator. You can start work only after approval. If declined, the operator may reopen or reassign the ticket.</p>}
              {ticket.state === 'Approved' && <button className="ip-button primary" disabled={busy} onClick={() => act(`/installer/maintenance-tickets/${ticket.id}/start`, {}, 'Work started. Record completion and evidence when finished.')}>Start work</button>}
              {ticket.state === 'In Progress' && <>
                <label className="ip-field"><span>Work performed</span><textarea rows={3} maxLength={4000} value={workPerformed} onChange={event => setWorkPerformed(event.target.value)}/></label>
                <div className="ip-action-row"><label className="ip-field"><span>Service date</span><input type="date" min={ticket.evidence.end} max={today()} value={performedDate} onChange={event => setPerformedDate(event.target.value)}/></label></div>
                <label className="ip-field"><span>Completion evidence</span><textarea rows={2} maxLength={4000} value={completionEvidence} onChange={event => setCompletionEvidence(event.target.value)} placeholder="Photos, readings, parts replaced, test results"/></label>
                <button className="ip-button primary" disabled={busy || !workPerformed.trim() || !completionEvidence.trim() || !performedDate} onClick={() => act(`/installer/maintenance-tickets/${ticket.id}/complete`, { workPerformed, performedDate, evidence: completionEvidence }, 'Completion recorded. Submit the evidence package for operator verification.')}>Record completion</button>
              </>}
              {ticket.state === 'Work Completed' && <><p className="ip-caption">Completion is recorded. Submit the evidence package to move the ticket to operator verification. This still does not prove recovery.</p><button className="ip-button primary" disabled={busy} onClick={() => act(`/installer/maintenance-tickets/${ticket.id}/submit-evidence`, {}, 'Completion evidence submitted. Recovery verification now belongs to the property operator.')}>Submit completion evidence</button></>}
              {ticket.state === 'Verification Pending' && <p className="ip-caption">The property operator is comparing weather-adjusted pre/post performance. You cannot mark this ticket verified. If the work is incomplete, the operator can reopen it.</p>}
              {ticket.state === 'Verified' && <><p className="ip-caption">The operator completed a separate recovery verification. This does not establish that your work caused the change.</p><span className="ip-verified"><span className="material-symbols-outlined">verified</span>Recovery evidence recorded by the property operator</span></>}
              {['Reopened', 'Awaiting Approval', 'Closed', 'Cancelled', 'Draft', 'Submitted'].includes(ticket.state) && <p className="ip-caption">No installer action is available while the ticket is {ticket.state.toLowerCase()}. Wait for the property operator to reassign or update the ticket.</p>}
            </div>

            {ticket.attachments.length > 0 && <div className="ip-record"><h3>Evidence attachments</h3>{ticket.attachments.map(attachment => <div key={attachment.id} className="ip-attachment"><span className="material-symbols-outlined">description</span><div><strong>{attachment.name}</strong><p>{attachment.content}</p><small>{attachment.source} · {dateTime(attachment.at)}</small></div></div>)}</div>}

            <div className="ip-timeline"><h3>Audit trail</h3>{ticket.audit.map(entry => <div key={entry.id}><i/><div><strong>{entry.action.replaceAll('_', ' ')}</strong><p>{entry.detail}</p><small>{dateTime(entry.at)}</small></div></div>)}</div>
          </section>}
        </div>}
      </main>
    </div>
  </div>;
};
