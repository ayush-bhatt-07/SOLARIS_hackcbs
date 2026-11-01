import React, { useEffect, useRef, useState } from 'react';
import { api, post } from '../../utils/api';
import type { BusinessProperty } from '../../types/commercial';
import type { EconomicsInputs, EconomicsResult, EconomicsScenario } from '../../types/economics';
import './economics.css';

const money = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const number = (n: number) => n.toLocaleString('en-IN', { maximumFractionDigits: 1 });
const years = (n: number | null) => n === null ? 'Unavailable' : `${n.toFixed(2)} years`;
const palette = ['#17624c', '#e6b741', '#8ca99d', '#c8d3cc', '#8d77a6'];
type Simulation = { simulationId: string; result: EconomicsResult; comparisons: EconomicsResult[] };

function CashChart({ result }: { result: EconomicsResult }) {
  const points = result.cashflow;
  const min = Math.min(...points.map(p => Math.min(p.plant, p.investor)), 0), max = Math.max(...points.map(p => Math.max(p.plant, p.investor)), 1);
  const y = (n: number) => 180 - (n - min) / (max - min) * 150;
  const path = (key: 'plant' | 'investor') => points.map(p => `${30 + p.year / 25 * 460},${y(p[key])}`).join(' ');
  return <svg viewBox="0 0 530 220" role="img" aria-label="Cumulative plant and investor cash flows over 25 years"><line x1="30" x2="490" y1={y(0)} y2={y(0)} stroke="#c8d3cc" strokeDasharray="4 4"/><text x="2" y={y(0) - 5}>₹0</text><polyline points={path('plant')} fill="none" stroke={palette[2]} strokeWidth="3"/><polyline points={path('investor')} fill="none" stroke={palette[0]} strokeWidth="3"/>{points.filter(p => p.year % 5 === 0).map(p => <g key={p.year}><circle cx={30 + p.year / 25 * 460} cy={y(p.investor)} r="4" fill={palette[0]}><title>Year {p.year}: investor {money(p.investor)}, plant {money(p.plant)}</title></circle><text x={30 + p.year / 25 * 460} y="207" textAnchor="middle">{p.year}y</text></g>)}{result.investorPayback !== null && result.investorPayback <= 25 && <g><line x1={30 + result.investorPayback / 25 * 460} x2={30 + result.investorPayback / 25 * 460} y1="22" y2="185" stroke="#b68b24" strokeDasharray="3 3"/><text x={Math.min(410, 34 + result.investorPayback / 25 * 460)} y="17">Break-even {result.investorPayback.toFixed(2)}y</text></g>}</svg>;
}
function Waterfall({ r }: { r: EconomicsResult }) {
  const rows = [{ name: 'Avoided charges', value: r.avoided * 12 }, { name: 'Export value', value: r.exportValue * 12 }, { name: 'Maintenance', value: -r.inputs.annualMaintenance }, { name: 'Other costs', value: -r.inputs.otherAnnualCosts }, { name: 'Net benefit', value: r.annualNet }];
  let running = 0;
  const steps = rows.map((row, i) => { const start = i === 4 ? 0 : running; const end = i === 4 ? row.value : running + row.value; running = end; return { ...row, start, end }; });
  const low = Math.min(0, ...steps.flatMap(s => [s.start, s.end])), high = Math.max(1, ...steps.flatMap(s => [s.start, s.end]));
  const y = (v: number) => 180 - (v - low) / (high - low) * 150;
  return <svg viewBox="0 0 550 225" role="img" aria-label="Annual savings waterfall"><line x1="10" x2="540" y1={y(0)} y2={y(0)} stroke="#c8d3cc"/>{steps.map((s, j) => <g key={s.name}><rect x={j * 108 + 15} y={Math.min(y(s.start), y(s.end))} width="75" height={Math.max(2, Math.abs(y(s.start) - y(s.end)))} rx="3" fill={j === 4 ? '#17624c' : s.value < 0 ? '#bc7558' : '#b9cdbf'}><title>{s.name}: {money(s.value)} annually. {j === 4 ? 'Gross savings less maintenance and other operating costs, before tenant sharing.' : 'Included once in annual net operating benefit.'}</title></rect>{j < 4 && <line x1={j * 108 + 90} x2={(j + 1) * 108 + 15} y1={y(s.end)} y2={y(s.end)} stroke="#aabdb1" strokeDasharray="3 3"/>}<text x={j * 108 + 52} y={Math.max(14, Math.min(y(s.start), y(s.end)) - 7)} textAnchor="middle">{money(s.value)}</text><text x={j * 108 + 52} y="208" textAnchor="middle">{s.name}</text></g>)}</svg>;
}

export default function EconomicsStudio({ property, canSave = true }: { property: BusinessProperty; canSave?: boolean }) {
  const root = `/business/properties/${property.id}/economics`;
  const [inputs, setInputs] = useState<EconomicsInputs>();
  const [periods, setPeriods] = useState<string[]>([]);
  const [simulation, setSimulation] = useState<Simulation>();
  const [saved, setSaved] = useState<EconomicsScenario[]>([]);
  const [selected, setSelected] = useState('');
  const [name, setName] = useState('My solar scenario');
  const [shopId, setShopId] = useState('shop-1');
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [retry, setRetry] = useState(0);
  const [explanation, setExplanation] = useState<{ title: string; text: string; mode: string }>();
  const explanationRequest = useRef(0);
  useEffect(() => () => { explanationRequest.current++; }, []);
  useEffect(() => {
    const abort = new AbortController(); setInputs(undefined); setSimulation(undefined); setSaved([]); setSelected(''); setError(''); setBusy(true); setExplanation(undefined);
    Promise.all([api(`${root}/defaults`, { signal: abort.signal }), api(`${root}/scenarios`, { signal: abort.signal })])
      .then(([defaults, scenarios]) => { if (!abort.signal.aborted) { setInputs(defaults.inputs); setPeriods(defaults.periods); setSaved(scenarios.scenarios); } })
      .catch(e => { if (!abort.signal.aborted) { setError(e.message); setBusy(false); } });
    return () => abort.abort();
  }, [root, retry]);
  useEffect(() => {
    if (!inputs) return;
    const abort = new AbortController(); setBusy(true); setError(''); setExplanation(undefined); explanationRequest.current++;
    const timer = window.setTimeout(() => {
      api<Simulation>(`${root}/simulate`, { method: 'POST', body: JSON.stringify({ inputs }), signal: abort.signal })
        .then(s => { if (!abort.signal.aborted) { setSimulation(s); setBusy(false); } })
        .catch(e => { if (!abort.signal.aborted) { setError(e.message); setBusy(false); } });
    }, 280);
    return () => { clearTimeout(timer); abort.abort(); };
  }, [inputs, root]);
  const update = (key: keyof EconomicsInputs, value: string | number) => { setSelected(''); setNotice(''); setInputs(p => ({ ...p!, [key]: value })); };
  const save = async () => {
    setSaving(true); setError('');
    try { const { scenario } = await post(`${root}/scenarios/save`, { name, inputs }); setSaved(p => [...p, scenario]); setSelected(scenario.id); setNotice(`Saved ${scenario.name} · version ${scenario.version}`); }
    catch (e) { setError((e as Error).message); } finally { setSaving(false); }
  };
  const ask = async (chart: string, title: string) => {
    if (!simulation) return;
    const request = ++explanationRequest.current;
    setExplanation({ title, text: 'Helios is reading this authorised calculation…', mode: 'loading' });
    try { const answer = await post(`${root}/chart-explanation`, { simulationId: simulation.simulationId, chart, shopId: chart === 'tenants' ? shopId : undefined }); if (request === explanationRequest.current) setExplanation({ title, text: answer.answer, mode: answer.mode }); }
    catch (e) { if (request === explanationRequest.current) setExplanation({ title, text: (e as Error).message, mode: 'error' }); }
  };
  const card = (id: string, title: string, sub: string, children: React.ReactNode) => <section className="eco-card"><header><div><h3>{title}</h3><p>{sub}</p></div><button disabled={busy || !!error} onClick={() => ask(id, title)}>✦ Ask Helios</button></header>{children}</section>;
  const r = simulation?.result;
  const tenant = r?.tenants.find(t => t.id === shopId);
  const field = (key: Exclude<keyof EconomicsInputs, 'period'>, label: string, min = 0, max = 100000000, step = 1) => <label>{label}<input type="number" min={min} max={max} step={step} value={Number.isFinite(inputs?.[key]) ? inputs![key] : ''} onChange={e => update(key, e.target.value === '' ? NaN : Number(e.target.value))}/></label>;
  return <div className="eco-studio">
    <div className="eco-intro"><span>FINANCIAL INTELLIGENCE / {property.sourceState === 'SYNTHETIC' ? 'SYNTHETIC REFERENCE SITE' : 'PROPERTY SCENARIO ESTIMATE'}</span><h2>Economics Studio<span>Every ray. A clearer return.</span></h2><p>Explore energy, operating savings and the return retained after sharing benefits.</p></div>
    {error && <div className="b-alert b-error" role="alert">{error}<button onClick={() => setRetry(n => n + 1)}>Retry</button></div>}
    {notice && <p role="status" className="eco-notice">{notice}</p>}
    {inputs && <section className="eco-controls" aria-label="Simulation controls"><div className="eco-slider"><label htmlFor="eco-capacity">Solar capacity <strong>{inputs.capacityKwp} kWp</strong></label><input id="eco-capacity" type="range" min="0" max="500" step="5" value={inputs.capacityKwp} onChange={e => update('capacityKwp', Number(e.target.value))}/><small>0 kWp<span>500 kWp</span></small></div><div className="eco-fields">
      {field('capexPerKwp', 'CAPEX / kWp (₹)', 1, 200000, 100)}{field('annualMaintenance', 'Annual maintenance (₹)')}{field('tariff', 'Energy tariff (₹/kWh)', 0, 100, 0.1)}{field('tenantShare', 'Tenant benefit share (%)', 0, 100)}
      <label>Billing period<select value={inputs.period} onChange={e => update('period', e.target.value)}>{periods.map(period => <option key={period}>{period}</option>)}</select></label>
      <label>Saved scenario<select value={selected} onChange={e => { const s = saved.find(s => s.id === e.target.value); setSelected(e.target.value); if (s) { setInputs(s.result.inputs); setName(s.name); } }}><option value="">Unsaved exploration</option>{saved.map(s => <option key={s.id} value={s.id}>{s.name} · v{s.version}</option>)}</select></label></div>
      <details><summary>Settlement, costs & investment assumptions</summary><div className="eco-fields">{field('exportRate', 'Assumed export rate (₹/kWh)', 0, 100, 0.1)}{field('otherAnnualCosts', 'Other annual operating costs (₹)')}{field('discountRate', 'Discount rate (%)', 0, 50, 0.1)}{field('budget', 'Installation budget (₹)', 0, 1000000000, 10000)}</div></details>
      <div className="eco-save"><label>Scenario name<input maxLength={80} value={name} onChange={e => setName(e.target.value)}/></label><button className="b-button b-primary" disabled={!canSave || busy || saving || !!error || !name.trim()} onClick={save}>{!canSave ? 'Owner-only save' : saving ? 'Saving…' : 'Save version'}</button><span>Saving preserves inputs, outputs and calculation versions.</span></div>
    </section>}
    {busy && <div role="status" className="eco-skeleton">Recalculating one consistent financial model…<div/><div/><div/></div>}
    {r && !busy && !error && <>
      <div className="eco-kpis">{[['Installation CAPEX', money(r.capex), `${r.inputs.capacityKwp} kWp · upfront investment`], ['Annual plant benefit', money(r.annualNet), 'After maintenance · before sharing'], ['Investor retained / year', money(r.retained), `${r.inputs.tenantShare}% sharing assumption`], ['Investor payback', years(r.investorPayback), `Plant payback ${years(r.plantPayback)}`]].map(([label, value, detail]) => <article key={label}><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>)}</div>
      {(!r.roofFits || !r.budgetFits) && <p className="eco-warning" role="status">Scenario exceeds {r.roofFits ? '' : 'roof area'}{!r.roofFits && !r.budgetFits ? ' and ' : ''}{r.budgetFits ? '' : 'budget'} constraints. This is an exploration, not a feasible installation recommendation.</p>}
      <div className="eco-charts">
        {card('energy', '01 / Where the solar goes', `${r.inputs.period} · ${number(r.generation)} kWh generated`, <div className="eco-energy"><div className="eco-donut" role="img" aria-label={`${number(r.selfUse)} kWh on-site; ${number(r.exported)} kWh exported`} style={{ background: r.generation > 0 ? `conic-gradient(${palette[0]} 0 ${r.selfUse / r.generation * 100}%, ${palette[1]} 0 100%)` : '#e5e7eb' }}><div><strong>{number(r.generation)}</strong><span>kWh / month</span></div></div><dl><dt>On-site consumption</dt><dd>{number(r.selfUse)} kWh</dd><dt>Export / surplus</dt><dd>{number(r.exported)} kWh</dd><dt>Grid imports</dt><dd>{number(r.imported)} kWh</dd></dl></div>)}
        {card('bill', '02 / Your electricity bill', 'Monthly components · unchanged demand and fixed charges', <><div className="eco-bills">{(['before', 'after'] as const).map(k => <div key={k}><div className="eco-billbar" aria-label={`${k} solar bill ${money(r[k].total)}`}>{(['energy', 'demand', 'fixed', 'taxes'] as const).map((part, j) => <div key={part} style={{ height: `${r[k][part] / Math.max(1, r.before.total) * 160}px`, background: palette[j] }}><title>{part}: {money(r[k][part])}</title></div>)}</div><strong>{money(r[k].total)}</strong><span>{k === 'before' ? 'Before solar' : 'After solar'}</span><small>Credits: {money(r[k].credits)}</small></div>)}</div><div className="eco-legend">{['Energy', 'Demand', 'Fixed', 'Taxes (assumed 0)'].map((v, j) => <span key={v}><i style={{ background: palette[j] }}/>{v}</span>)}</div></>)}
        {card('waterfall', '03 / From savings to benefit', 'Annual waterfall · hover a bar for its contribution', <Waterfall r={r}/>)}
        {card('payback', '04 / The investment journey', 'Cumulative cash flow · starts with negative CAPEX', <><CashChart result={r}/><div className="eco-legend"><span><i style={{ background: palette[2] }}/>Plant benefit</span><span><i style={{ background: palette[0] }}/>Investor after sharing</span></div>{(r.investorPayback === null || r.investorPayback > 25) && <p className="eco-warning">Investor payback is not reached within this 25-year forecast.</p>}<p>Illustrative NPV: <b>{money(r.npv)}</b> · IRR: <b>{r.irr === null ? 'Unavailable' : `${r.irr.toFixed(2)}%`}</b> · Discount: {r.inputs.discountRate}%</p></>)}
        {card('capacity', '05 / Find the right capacity', 'Select a candidate to update every chart · no automatic recommendation', <div className="eco-capacity"><div className="eco-candidates">{simulation.comparisons.map(c => <button key={c.inputs.capacityKwp} className={r.inputs.capacityKwp === c.inputs.capacityKwp ? 'selected' : ''} onClick={() => update('capacityKwp', c.inputs.capacityKwp)}><strong>{c.inputs.capacityKwp} <small>kWp</small></strong><span className="eco-mini-bar" style={{ width: `${c.generation / Math.max(1, ...simulation.comparisons.map(c => c.generation)) * 100}%` }}/><span>{number(c.generation)} kWh/month</span><b>{money(c.retained)} / year retained</b><span>{years(c.investorPayback)} payback</span><small>{c.roofFits ? '✓ Roof' : '✕ Roof'} · {c.budgetFits ? '✓ Budget' : '✕ Budget'}</small></button>)}</div><div className="b-table-scroll"><table className="b-table"><thead><tr><th>kWp</th><th>CAPEX</th><th>Self-use kWh</th><th>Bill reduction/month</th><th>Net/year</th></tr></thead><tbody>{simulation.comparisons.map(c => <tr key={c.inputs.capacityKwp}><td>{c.inputs.capacityKwp}</td><td>{money(c.capex)}</td><td>{number(c.selfUse)}</td><td>{money(c.before.total - c.after.total)}</td><td>{money(c.annualNet)}</td></tr>)}</tbody></table></div></div>)}
        {card('tenants', '06 / Share the benefit', `Monthly internal pool ${money(r.pool)} · policy v${r.policyVersion}`, <><div className="eco-tenant-bars" aria-label="Tenant benefit distribution">{r.tenants.map(t => <button key={t.id} className={t.id === shopId ? 'selected' : ''} onClick={() => { explanationRequest.current++; setExplanation(undefined); setShopId(t.id); }}><span>{t.name}</span><span className="eco-track"><i style={{ width: `${t.benefit / Math.max(1, ...r.tenants.map(t => t.benefit)) * 100}%` }}/></span><b>{money(t.benefit)}</b></button>)}</div>{tenant && <div className="eco-tenant-detail"><h4>{tenant.name}</h4><dl><dt>Recorded usage</dt><dd>{number(tenant.usage)} kWh · {tenant.readingSource.toLowerCase()}</dd><dt>Agreement</dt><dd>{tenant.agreement}</dd><dt>Energy cost before / adjusted</dt><dd>{money(tenant.before)} / {money(tenant.after)}</dd><dt>Projected benefit</dt><dd>{money(tenant.benefit)}</dd></dl><details><summary>View shop calculation</summary><p>{tenant.eligible ? `Pool ${money(r.pool)} × ${number(tenant.usage)} kWh ÷ ${number(r.tenants.filter(t => t.eligible).reduce((sum, t) => sum + t.usage, 0))} eligible kWh; rounded by largest remainder in integer paise.` : 'No allocation: no eligible agreement, no period reading, or no positive pool.'}</p><p>Adjusted energy cost excludes any tenant-level fixed charges, taxes or contractual fees, which are unavailable.</p></details></div>}<p className="eco-footnote">Internal benefit projections, not official VNM credits. Missing period readings receive zero allocation.</p></>)}
      </div>
      {saved.length > 0 && <section className="eco-card"><h3>Saved version comparison</h3><div className="b-table-scroll"><table className="b-table"><thead><tr><th>Scenario</th><th>Capacity</th><th>Sharing</th><th>Retained/year</th><th>Payback</th><th>Saved</th></tr></thead><tbody>{saved.map(s => <tr key={s.id}><td>{s.name} · v{s.version}</td><td>{s.result.inputs.capacityKwp} kWp</td><td>{s.result.inputs.tenantShare}%</td><td>{money(s.result.retained)}</td><td>{years(s.result.investorPayback)}</td><td>{new Date(s.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table></div></section>}
      <details className="eco-card eco-assumptions"><summary>Calculation, assumptions & input provenance</summary><p>{r.provenance} · {r.calculationVersion} · {r.tariffVersion}</p><ul>{r.assumptions.map(a => <li key={a}>{a}</li>)}</ul><p>Reproduce: {JSON.stringify(r.inputs)}</p></details>
    </>}
    {explanation && <aside className="eco-explanation" aria-label="Helios explanation" aria-live="polite"><header><h3>✦ Helios / {explanation.title}</h3><button onClick={() => { explanationRequest.current++; setExplanation(undefined); }} aria-label="Close explanation">×</button></header><p>{explanation.text}</p><small>{explanation.mode === 'gemini' ? 'Gemini · authorised server calculation' : explanation.mode === 'calculation-fallback' ? 'Calculation explanation · Gemini unavailable' : explanation.mode}</small><details><summary>View calculation assumptions</summary>{r?.assumptions.map(a => <p key={a}>{a}</p>)}</details></aside>}
  </div>;
}
