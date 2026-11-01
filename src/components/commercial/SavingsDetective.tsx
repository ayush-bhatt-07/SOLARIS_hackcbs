import React, { useEffect, useRef, useState } from 'react';
import { api } from '../../utils/api';
import type { BusinessProperty } from '../../types/commercial';
import type { DetectiveDay, DetectiveReport } from '../../types/detective';
import './savings-detective.css';
import WeatherDetective from './WeatherDetective';

const rupees = (value: number | null) => value === null ? 'Unknown' : `${value < 0 ? '−' : ''}₹${Math.abs(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const number = (value: number | null) => value === null ? 'Missing' : value.toLocaleString('en-IN', { maximumFractionDigits: 1 });
const displayDate = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const kind = (day: DetectiveDay) => day.status === 'MISSING_DATA' ? 'Missing reading' : day.direction === 'SHORTFALL' ? 'Below expected' : 'Above expected';
const GREEN = '#24765b', AMBER = '#d7a537', RED = '#bd6650';

function GenerationChart({ days, selected, select }: { days: DetectiveDay[]; selected: string; select: (day: string) => void }) {
  const max = Math.max(1, ...days.flatMap(d => [d.expectedKwh, d.actualKwh ?? 0]));
  const x = (i: number) => 56 + i / Math.max(1, days.length - 1) * 920;
  const y = (value: number) => 260 - value / max * 220;
  const path = (key: 'expectedKwh' | 'actualKwh') => {
    let pen = false;
    return days.map((day, i) => {
      if (day[key] === null) { pen = false; return ''; }
      const point = `${pen ? 'L' : 'M'}${x(i)},${y(day[key]!)}`; pen = true; return point;
    }).join(' ');
  };
  return <svg className="sd-generation-chart" viewBox="0 0 1000 310" role="group" aria-label="Expected versus actual synthetic daily generation; highlighted days are selectable">
    {[0, 1, 2, 3, 4].map(n => <g key={n}><line x1="56" x2="976" y1={y(max * n / 4)} y2={y(max * n / 4)} stroke="#e4e9e1" strokeDasharray="3 5"/><text x="46" y={y(max * n / 4) + 4} textAnchor="end">{Math.round(max * n / 4)}</text></g>)}
    <text x="56" y="18">kWh / day</text><path d={path('expectedKwh')} fill="none" stroke={AMBER} strokeWidth="2.4" strokeDasharray="6 4"/><path d={path('actualKwh')} fill="none" stroke={GREEN} strokeWidth="2.5"/>
    {days.map((day, i) => day.status !== 'NORMAL' && <g key={day.date} role="button" tabIndex={0} aria-label={`${displayDate(day.date)}: ${kind(day)}, ${day.score === null ? 'no score' : `score ${day.score.toFixed(4)}`}`} aria-pressed={selected === day.date} onClick={() => select(day.date)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(day.date); } }} className="sd-chart-point"><circle cx={x(i)} cy={y(day.actualKwh ?? day.expectedKwh)} r={selected === day.date ? 10 : 7} fill={day.status === 'MISSING_DATA' ? '#78867e' : day.direction === 'SHORTFALL' ? RED : '#a78636'} stroke="#fffefa" strokeWidth="2.5"/><circle cx={x(i)} cy={y(day.actualKwh ?? day.expectedKwh)} r="15" fill="transparent"/><title>{displayDate(day.date)}: expected {number(day.expectedKwh)} kWh, actual {number(day.actualKwh)}; financial gap {rupees(day.gapInr)}</title></g>)}
    {days.filter((_, i) => i % 30 === 0 || i === days.length - 1).map(day => <text key={day.date} x={x(days.indexOf(day))} y="292" textAnchor="middle">{day.date.slice(5)}</text>)}
  </svg>;
}
function ScoreChart({ days, selected, select }: { days: DetectiveDay[]; selected: string; select: (date: string) => void }) {
  const max = Math.max(0.01, ...days.map(d => Math.abs(d.score ?? 0)));
  return <svg viewBox="0 0 1000 160" role="group" aria-label="Isolation Forest decision scores; negative scores cross the unusual threshold"><line x1="56" x2="976" y1="75" y2="75" stroke="#a6b6ab" strokeDasharray="4 4"/><text x="48" y="79" textAnchor="end">0</text><text x="56" y="15">Normal ↑ / unusual ↓ · decision score</text>{days.map((d, i) => d.score !== null && <rect key={d.date} x={56 + i / days.length * 920} width={Math.max(2, 920 / days.length - 1)} y={d.score < 0 ? 75 : 75 - d.score / max * 52} height={Math.max(1, Math.abs(d.score) / max * 52)} rx="1" fill={d.score < 0 ? RED : '#8eb29d'} stroke={selected === d.date ? '#173e30' : 'none'} role="button" tabIndex={0} aria-label={`${d.date} decision score ${d.score.toFixed(4)}`} onClick={() => select(d.date)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(d.date); } }}><title>{d.date}: {d.score.toFixed(5)} · {d.status}</title></rect>)}</svg>;
}

function OriginalSavingsDetective({ property, canSeed }: { property: BusinessProperty; canSeed: boolean }) {
  const endpoint = `/business/properties/${property.id}/detective`;
  const [report, setReport] = useState<DetectiveReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState('');
  const [filter, setFilter] = useState('all');
  const [explanation, setExplanation] = useState<{ answer: string; mode: string }>();
  const [explaining, setExplaining] = useState(false);
  const request = useRef<AbortController | null>(null);
  const aiRequest = useRef<AbortController | null>(null);
  const load = async (seed = false) => {
    request.current?.abort(); const abort = new AbortController(); request.current = abort;
    setLoading(true); setError(''); setReport(null); setExplanation(undefined);
    try {
      const result = await api<{ report: DetectiveReport | null }>(endpoint + (seed ? '/demo' : ''), { method: seed ? 'POST' : 'GET', ...(seed ? { body: '{}' } : {}), signal: abort.signal });
      if (!abort.signal.aborted) { setReport(result.report); setSelected(result.report?.days.find(d => d.status === 'INVESTIGATE' && d.direction === 'SHORTFALL')?.date ?? result.report?.days.find(d => d.status !== 'NORMAL')?.date ?? ''); }
    } catch (e) { if (!abort.signal.aborted) setError((e as Error).message); }
    finally { if (!abort.signal.aborted) setLoading(false); }
  };
  useEffect(() => { void load(); return () => { request.current?.abort(); aiRequest.current?.abort(); }; }, [endpoint]);
  useEffect(() => { aiRequest.current?.abort(); setExplanation(undefined); setExplaining(false); }, [selected]);
  const choose = (date: string) => { setSelected(date); };
  const ask = async () => {
    aiRequest.current?.abort(); const abort = new AbortController(); aiRequest.current = abort; setExplaining(true); setExplanation(undefined);
    try { const result = await api(`${endpoint}/explain`, { method: 'POST', body: JSON.stringify({ date: selected }), signal: abort.signal }); if (!abort.signal.aborted) setExplanation(result); }
    catch (e) { if (!abort.signal.aborted) setExplanation({ answer: (e as Error).message, mode: 'error' }); }
    finally { if (!abort.signal.aborted) setExplaining(false); }
  };
  const issues = report?.days.filter(d => d.status !== 'NORMAL') ?? [];
  const filtered = issues.filter(d => filter === 'all' || d.status === filter);
  const day = report?.days.find(d => d.date === selected);
  return <div className="sd-studio">
    <header className="sd-hero"><div><span className="sd-eyebrow">SOLARIS INTELLIGENCE / SYNTHETIC DEMONSTRATION</span><h2>Savings Detective<span>Find the days worth a closer look.</span></h2><p>Trace unusual solar output to a clear energy and financial comparison. Evidence first. Investigation next.</p></div><div className="sd-hero-mark" aria-hidden="true">⌕<span>IF / 250</span></div></header>
    {error && <div className="sd-alert" role="alert"><strong>Could not load model inference.</strong><p>{error}</p><button onClick={() => load()}>Retry connection</button></div>}
    {loading && <div className="sd-loading" role="status"><strong>Running the evidence through Isolation Forest…</strong><span>Python + Scikit-learn · first run may take a few seconds</span><div/><div/></div>}
    {!loading && !error && !report && <section className="sd-card sd-empty"><span className="sd-empty-icon" aria-hidden="true">⌕</span><h3>A new lens on your solar savings.</h3><p>No Savings Detective dataset is linked to this property yet. Load an isolated copy of the supplied 365-day synthetic reference dataset. It represents a 200 kWp reference system, not this property's real meter history.</p>{canSeed ? <button className="sd-primary" onClick={() => load(true)}>Load synthetic reference dataset <span>↗</span></button> : <p>Ask the property owner to load the synthetic reference dataset.</p>}<small>The model uses 220 days for fitting and evaluates the remaining 145. It does not diagnose equipment faults.</small></section>}
    {report && !loading && <>
      <div className="sd-context"><span><i/> SYNTHETIC · 200 kWp REFERENCE SYSTEM</span><p>{displayDate(report.days[0].date)} – {displayDate(report.days.at(-1)!.date)} · {report.summary.validDays}/{report.summary.days} complete evaluation days</p><button onClick={() => load()}>↻ Rerun inference</button></div>
      <div className="sd-kpis"><article><span>Days to investigate</span><strong>{report.summary.flags}<small> / {report.summary.days}</small></strong><p>Model flags, not confirmed faults</p></article><article className="sd-kpi-impact"><span>Flagged shortfall estimate</span><strong>{rupees(report.summary.flaggedShortfallInr)}</strong><p>Below-baseline flagged days only</p></article><article><span>Above-baseline flagged value</span><strong>{rupees(report.summary.flaggedSurplusInr)}</strong><p>Unusual can also mean higher output</p></article><article><span>Missing readings</span><strong>{report.summary.missingDays}<small> day{report.summary.missingDays !== 1 ? 's' : ''}</small></strong><p>Financial impact remains unknown</p></article></div>
      <section className="sd-card sd-chart-card"><header><div><span className="sd-section-label">01 / FOLLOW THE ENERGY</span><h3>Expected vs actual generation</h3><p>Select a highlighted day to inspect the evidence.</p></div><div className="sd-legend"><span><i style={{ background: AMBER }}/>Expected baseline</span><span><i style={{ background: GREEN }}/>Actual synthetic</span><span><i style={{ background: RED }}/>Unusual / quality issue</span></div></header><div className="sd-chart-scroll"><GenerationChart days={report.days} selected={selected} select={choose}/></div><div className="sd-chart-caption"><span>Paired expected: <b>{number(report.summary.expectedKwh)} kWh</b></span><span>Paired actual: <b>{number(report.summary.actualKwh)} kWh</b></span><span>Missing days excluded from both totals</span></div><details className="sd-score"><summary>Explore anomaly decision scores</summary><p>Below zero crosses the fitted threshold. Scores are not probabilities or measures of fault severity.</p><div className="sd-chart-scroll"><ScoreChart days={report.days} selected={selected} select={choose}/></div></details></section>
      <div className="sd-evidence-grid"><section className="sd-card sd-issues"><header><div><span className="sd-section-label">02 / REVIEW THE SIGNALS</span><h3>Detected anomalies & data gaps</h3></div><label><span className="sd-sr-only">Filter detected issues</span><select value={filter} onChange={e => setFilter(e.target.value)}><option value="all">All issues ({issues.length})</option><option value="INVESTIGATE">Model flags</option><option value="MISSING_DATA">Missing data</option></select></label></header><div className="sd-issue-table"><table><thead><tr><th>Day / signal</th><th>Decision score</th><th>Financial gap</th></tr></thead><tbody>{filtered.map(d => <tr key={d.date} className={selected === d.date ? 'selected' : ''}><td><button aria-pressed={selected === d.date} onClick={() => choose(d.date)}><b>{displayDate(d.date)}</b><span className={`sd-status ${d.status === 'MISSING_DATA' ? 'missing' : d.direction === 'ABOVE_BASELINE' ? 'above' : ''}`}>{kind(d)}</span></button></td><td>{d.score === null ? 'Not scored' : d.score.toFixed(4)}</td><td className={d.gapInr !== null && d.gapInr < 0 ? 'sd-surplus' : ''}>{rupees(d.gapInr)}</td></tr>)}</tbody></table>{!filtered.length && <p className="sd-no-issues">No issues match this filter.</p>}</div><p className="sd-footnote">Positive gap = less avoided energy cost than expected. Negative gap = above-baseline value. Missing data is separate from ML flags.</p></section>
      <aside className="sd-card sd-detail" aria-label="Selected anomaly evidence" aria-live="polite"><span className="sd-section-label">03 / UNDERSTAND THE DAY</span>{day ? <><div className="sd-detail-title"><h3>{displayDate(day.date)}</h3><span className={`sd-status ${day.status === 'MISSING_DATA' ? 'missing' : day.direction === 'ABOVE_BASELINE' ? 'above' : ''}`}>{kind(day)}</span></div><div className="sd-detail-impact"><span>Estimated avoided-energy-charge difference</span><strong>{rupees(day.gapInr)}</strong><small>{day.status === 'MISSING_DATA' ? 'No monetary estimate for an unknown reading' : day.gapInr! < 0 ? 'Above-baseline value · not lost savings' : 'Baseline shortfall · not a verified bill loss'}</small></div><dl><div><dt>Expected generation</dt><dd>{number(day.expectedKwh)} kWh</dd></div><div><dt>Actual generation</dt><dd>{day.actualKwh === null ? 'Missing reading' : `${number(day.actualKwh)} kWh`}</dd></div><div><dt>Generation ratio</dt><dd>{day.generationRatio === null ? 'Unavailable' : `${(day.generationRatio * 100).toFixed(1)}% of expected`}</dd></div><div><dt>Grid import residual</dt><dd>{day.importResidualKwh === null ? 'Unavailable' : `${number(day.importResidualKwh)} kWh`}</dd></div><div><dt>Decision score / threshold</dt><dd>{day.score === null ? 'Not scored' : `${day.score.toFixed(5)} / 0`}</dd></div></dl><details className="sd-calculation"><summary>View the financial calculation</summary>{day.gapInr === null ? <p>The generation reading is missing. Zero generation and a financial loss cannot be inferred.</p> : <><p>Expected avoided energy charge: {rupees(day.expectedAvoidedInr)}<br/>Actual avoided energy charge: {rupees(day.actualAvoidedInr)}<br/>Difference: {rupees(day.gapInr)}</p><p>Each charge = min(daily load, daily generation) × ₹{report.tariff}/kWh, rounded to paise. Fixed/demand charges, taxes and export settlement are not included.</p></>}</details><div className="sd-investigation"><b>What could you check?</b><p>{day.status === 'MISSING_DATA' ? 'Confirm the data feed, meter timestamps and communication logs before investigating generation.' : 'Compare weather and shading records, inverter availability, meter timestamps and maintenance logs. The data does not establish a root cause.'}</p></div><button className="sd-primary sd-ask" onClick={ask} disabled={explaining}>{explaining ? 'Reading authorised evidence…' : '✦ Ask Helios about this day'}</button>{explanation && <div className="sd-helios"><h4>✦ Helios / evidence explained</h4><p>{explanation.answer}</p><small>{explanation.mode === 'gemini' ? 'Gemini · server-side model evidence' : explanation.mode === 'error' ? 'Explanation could not load' : 'Deterministic evidence explanation · Gemini unavailable'}</small></div>}</> : <p>Select a day to view its evidence.</p>}</aside></div>
      <section className="sd-card sd-model"><header><div><span className="sd-section-label">MODEL TRANSPARENCY</span><h3>Reproducible. Synthetic. Still needs real-world validation.</h3></div><span className="sd-model-badge">Scikit-learn {report.sklearnVersion}</span></header><div className="sd-model-metrics"><span><b>{report.model.trainDays}</b> training days</span><span><b>{report.model.trees}</b> trees</span><span><b>{(report.evaluation.precision * 100).toFixed(1)}%</b> precision</span><span><b>{(report.evaluation.recall * 100).toFixed(1)}%</b> recall</span><span><b>{report.evaluation.f1.toFixed(3)}</b> F1</span></div><p>Evaluation uses {report.evaluation.injectedAnomalies} injected synthetic anomalies. These results do not establish production performance.</p><details><summary>Assumptions, provenance & model configuration</summary><ul>{report.assumptions.map(a => <li key={a}>{a}</li>)}</ul><p>{report.modelVersion} · seed {report.model.seed} · contamination {report.model.contamination} · features: {report.model.features.join(', ')}</p><p>Dataset {report.datasetId}<br/>SHA256 {report.sourceHash}<br/>Linked to property {report.propertyId} on {new Date(report.createdAt).toLocaleString()}</p></details></section>
    </>}
  </div>;
}

export default function SavingsDetective(props: { property: BusinessProperty; canSeed: boolean }) {
  const [weather, setWeather] = useState(true);
  return <><nav className="wd-mode-tabs" aria-label="Savings Detective analysis mode"><button className={weather ? 'active' : ''} aria-pressed={weather} onClick={() => setWeather(true)}>Weather-aware AI</button><button className={!weather ? 'active' : ''} aria-pressed={!weather} onClick={() => setWeather(false)}>Original reference model</button></nav>{weather ? <WeatherDetective {...props}/> : <OriginalSavingsDetective {...props}/>}</>;
}
