import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api, post } from '../utils/api';
import { SHOP_LABELS, businessScenarios, businessLedger } from '../utils/businessModel';
import type { BusinessInputs, BusinessProperty, MallShop } from '../types/commercial';
import { getInstallerRecommendations } from '../utils/solarMatch';
import './commercial.css';
import EconomicsStudio from '../components/commercial/EconomicsStudio';

const currency = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const compact = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(2)}L` : currency(n);
const num = (n: number) => n.toLocaleString('en-IN', { maximumFractionDigits: 1 });

const tabs = [
  { id: 'economics', icon: 'query_stats', label: 'Economics Studio' },
  { id: 'property', icon: 'domain', label: 'Property & setup' },
  { id: 'energy', icon: 'bolt', label: 'Bills & solar sizing' },
  { id: 'shops', icon: 'storefront', label: 'Shops & benefits' },
  { id: 'match', icon: 'handshake', label: 'SolarMatch' },
  { id: 'quotes', icon: 'request_quote', label: 'Quotations' },
  { id: 'reports', icon: 'monitoring', label: 'Financial reports' },
] as const;

type Tab = typeof tabs[number]['id'];
const colors: Record<string, string> = { active: '#2c8b66', pending: '#e9b447', eligible: '#70a9dc', unconfigured: '#b8c2bc', issue: '#d9756b' };
const Icon = ({ children }: { children: string }) => <span aria-hidden="true" className="material-symbols-outlined">{children}</span>;
const Metric = ({ label, value, detail, icon, accent = false }: { label: string; value: string; detail: string; icon: string; accent?: boolean }) => (
  <div className={`b-metric ${accent ? 'b-metric-accent' : ''}`}>
    <div className="b-metric-top"><span>{label}</span><Icon>{icon}</Icon></div>
    <strong>{value}</strong>
    <small>{detail}</small>
  </div>
);

const BusinessOwnerPage: React.FC = () => {
  const { currentUser, navigateTo } = useApp();
  const [tab, setTab] = useState<Tab>('economics');
  const [properties, setProperties] = useState<BusinessProperty[]>([]);
  const [property, setProperty] = useState<BusinessProperty>();
  const [draft, setDraft] = useState<BusinessInputs>();
  const [capacity, setCapacity] = useState(200);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [recommendations, setRecommendations] = useState<ReturnType<typeof getInstallerRecommendations>>([]);
  const [billMonth, setBillMonth] = useState('2026-10');
  const [billKwh, setBillKwh] = useState(100000);
  const [serverDetail, setServerDetail] = useState<{ scenarios: ReturnType<typeof businessScenarios>; ledger: ReturnType<typeof businessLedger> } | null>(null);

  const install = (p: BusinessProperty) => {
    localStorage.setItem(`solaris_active_property:${currentUser.id}`, p.id);
    setProperty(p);
    setDraft({ ...p.inputs });
    setCapacity(p.selectedCapacity);
    setServerDetail(null);
    setProperties(prev => [...prev.filter(item => item.id !== p.id), p]);
  };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await api('/business/properties');
      setProperties(result.properties);
      if (result.properties[0]) install(result.properties[0]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!property) return;
    let cancelled = false;
    api(`/business/properties/${property.id}`).then(result => {
      if (!cancelled) setServerDetail({ scenarios: result.scenarios, ledger: result.ledger });
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [property?.id, property?.updatedAt]);

  const act = async (action: () => Promise<{ property: BusinessProperty }>, successNotice: string) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const res = await action();
      install(res.property);
      setNotice(successNotice);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="b-app">
        <main className="b-content b-empty" role="status">Loading commercial workspace...</main>
      </div>
    );
  }

  if (error && !property) {
    return (
      <div className="b-app">
        <main className="b-content b-empty">
          <h1>Workspace error</h1>
          <p role="alert">{error}</p>
          <button className="b-button b-primary" onClick={load}>Retry</button>
        </main>
      </div>
    );
  }

  if (!property || !draft) {
    return (
      <div className="b-app">
        <main className="b-content b-empty">
          <h1>No commercial property found</h1>
          <p>Please register a commercial property to begin solar planning.</p>
          <button className="b-button b-primary" onClick={() => navigateTo('/dashboard')}>Return to Dashboard</button>
        </main>
      </div>
    );
  }

  const endpoint = `/business/properties/${property.id}`;
  const scenarios = serverDetail?.scenarios ?? businessScenarios(property);
  const ledger = serverDetail?.ledger ?? businessLedger(property);
  const selectedScenario = scenarios.find(s => s.capacityKwp === property.selectedCapacity) ?? scenarios[0];
  const result = selectedScenario?.result;

  return (
    <div className="b-app">
      <aside className="b-sidebar">
        <a href="#/dashboard" className="b-brand">
          <div className="b-logo"><Icon>solar_power</Icon></div>
          <span>SOLARIS</span>
          <span className="b-version">2.0</span>
        </a>
        <div className="b-workspace-badge">
          <span className="b-dot" />
          <span>COMMERCIAL WORKSPACE</span>
        </div>
        <div className="b-nav-label">MODULES</div>
        <nav>
          {tabs.map(t => (
            <button
              key={t.id}
              className={tab === t.id ? 'active' : ''}
              onClick={() => { setTab(t.id); setError(''); setNotice(''); }}
            >
              <Icon>{t.icon}</Icon>
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
        <div className="b-sidebar-bottom">
          <div className="b-solar-note">
            <Icon>wb_sunny</Icon>
            <strong>Economics Studio Active</strong>
            <p>Evaluating solar feasibility, tenant sharing and investor payback.</p>
          </div>
        </div>
      </aside>

      <main className="b-main">
        <header className="b-topbar">
          <div>
            <div className="b-breadcrumb">
              Commercial<span>/</span>{property.inputs.name}<span>/</span>{tabs.find(t => t.id === tab)?.label}
            </div>
            <strong>{property.inputs.name} ({property.inputs.city})</strong>
          </div>
          <div className="b-topbar-right">
            {properties.length > 1 && (
              <select
                value={property.id}
                onChange={e => {
                  const target = properties.find(p => p.id === e.target.value);
                  if (target) install(target);
                }}
              >
                {properties.map(p => (
                  <option key={p.id} value={p.id}>{p.inputs.name}</option>
                ))}
              </select>
            )}
          </div>
        </header>

        <div className="b-content">
          {error && <div className="eco-warning" role="alert" style={{ marginBottom: 16 }}>{error}</div>}
          {notice && <div className="eco-notice" role="status" style={{ marginBottom: 16 }}>{notice}</div>}

          {tab === 'economics' && (
            <EconomicsStudio property={property} canSave={true} />
          )}

          {tab === 'property' && (
            <section className="b-card">
              <h2>Property Setup & Assumptions</h2>
              <p>Configure property dimensions, electricity tariffs, and base load.</p>
              <div className="eco-fields" style={{ marginTop: 20 }}>
                <label>
                  Property Name
                  <input
                    type="text"
                    value={draft.name}
                    onChange={e => setDraft({ ...draft, name: e.target.value })}
                  />
                </label>
                <label>
                  City
                  <input
                    type="text"
                    value={draft.city}
                    onChange={e => setDraft({ ...draft, city: e.target.value })}
                  />
                </label>
                <label>
                  Roof Area (m²)
                  <input
                    type="number"
                    value={draft.roofAreaM2}
                    onChange={e => setDraft({ ...draft, roofAreaM2: Number(e.target.value) })}
                  />
                </label>
                <label>
                  Base Monthly Consumption (kWh)
                  <input
                    type="number"
                    value={draft.consumptionKwh}
                    onChange={e => setDraft({ ...draft, consumptionKwh: Number(e.target.value) })}
                  />
                </label>
                <label>
                  Commercial Tariff (₹/kWh)
                  <input
                    type="number"
                    value={draft.tariff}
                    onChange={e => setDraft({ ...draft, tariff: Number(e.target.value) })}
                  />
                </label>
                <label>
                  Cost per kWp (₹)
                  <input
                    type="number"
                    value={draft.costPerKwp}
                    onChange={e => setDraft({ ...draft, costPerKwp: Number(e.target.value) })}
                  />
                </label>
              </div>
              <div style={{ marginTop: 20 }}>
                <button
                  className="b-button b-primary"
                  disabled={busy}
                  onClick={() => act(() => post(endpoint, { inputs: draft }), 'Property updated.')}
                >
                  Save Property Details
                </button>
              </div>
            </section>
          )}

          {tab === 'energy' && (
            <section className="b-card">
              <h2>Billing Records & Solar Sizing</h2>
              <p>Record monthly DISCOM meter readings and examine system capacity choices.</p>
              <div className="eco-save" style={{ marginTop: 20 }}>
                <label>
                  Month (YYYY-MM)
                  <input
                    type="text"
                    value={billMonth}
                    onChange={e => setBillMonth(e.target.value)}
                  />
                </label>
                <label>
                  Consumption (kWh)
                  <input
                    type="number"
                    value={billKwh}
                    onChange={e => setBillKwh(Number(e.target.value))}
                  />
                </label>
                <button
                  className="b-button b-primary"
                  disabled={busy}
                  onClick={() => act(() => post(`${endpoint}/bills`, { month: billMonth, consumptionKwh: billKwh }), 'Billing record updated.')}
                >
                  Record Bill
                </button>
              </div>
            </section>
          )}

          {tab === 'shops' && (
            <section className="b-card">
              <h2>Shop Roster & Internal Benefit Allocation</h2>
              <div className="b-table-scroll" style={{ marginTop: 15 }}>
                <table className="b-table">
                  <thead>
                    <tr>
                      <th>Shop</th>
                      <th>Category</th>
                      <th>Floor</th>
                      <th>Status</th>
                      <th>Monthly Usage</th>
                      <th>Internal Benefit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {property.shops.map(s => {
                      const stmt = ledger.statements.find(st => st.shopId === s.id);
                      return (
                        <tr key={s.id}>
                          <td><strong>{s.name}</strong></td>
                          <td>{s.category}</td>
                          <td>Floor {s.floor}</td>
                          <td>
                            <span style={{ color: colors[s.status] || '#555', fontWeight: 600 }}>
                              {SHOP_LABELS[s.status]}
                            </span>
                          </td>
                          <td>{num(s.consumptionKwh)} kWh</td>
                          <td><strong>{currency(stmt?.benefitInr ?? 0)}</strong></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {tab === 'match' && (
            <section className="b-card">
              <h2>SolarMatch Provider Recommendations</h2>
              <p>Top ranked installers for {property.inputs.city} based on technical capability, warranties, and project budget.</p>
              <div style={{ marginTop: 20 }}>
                <button
                  className="b-button b-primary"
                  onClick={async () => {
                    const res = await api(`${endpoint}/installers`);
                    setRecommendations(res.recommendations);
                  }}
                >
                  Find Matching Installers
                </button>
              </div>
              {recommendations.length > 0 && (
                <div style={{ marginTop: 20, display: 'grid', gap: 15 }}>
                  {recommendations.map(r => (
                    <article key={r.provider.id} className="b-metric" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>{r.provider.name}</strong>
                        <p style={{ margin: '4px 0', fontSize: 12 }}>Score: {r.score}/100 · Estimated Quote: {currency(r.estimatedQuoteInr)}</p>
                        <small>{r.reasons.join(' · ')}</small>
                      </div>
                      <button
                        className="b-button b-outline"
                        onClick={() => act(() => post(`${endpoint}/quotes`, { installerId: r.provider.id }), 'Quote requested.')}
                      >
                        Request Quote
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          {tab === 'quotes' && (
            <section className="b-card">
              <h2>Procurement Quotations</h2>
              {property.quotes.length === 0 ? (
                <p style={{ marginTop: 15 }}>No quotes requested yet. Use SolarMatch to request contractor bids.</p>
              ) : (
                <div style={{ marginTop: 15, display: 'grid', gap: 12 }}>
                  {property.quotes.map(q => (
                    <div key={q.id} className="b-metric" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>{q.installerName}</strong> ({q.capacityKwp} kWp)
                        <p style={{ margin: '4px 0', fontSize: 13 }}>{q.amountInr ? currency(q.amountInr) : 'Status: ' + q.status}</p>
                        {q.warranty && <small>{q.warranty}</small>}
                      </div>
                      {q.status === 'requested' && (
                        <button
                          className="b-button b-outline"
                          onClick={() => act(() => post(`${endpoint}/quotes/${q.id}/simulate`, {}), 'Simulated quote response.')}
                        >
                          Simulate Response
                        </button>
                      )}
                      {q.status === 'demo_quote' && (
                        <button
                          className="b-button b-primary"
                          onClick={() => act(() => post(`${endpoint}/quotes/${q.id}/select`, {}), 'Quote shortlisted.')}
                        >
                          Shortlist Quote
                        </button>
                      )}
                      {q.status === 'selected' && (
                        <span style={{ color: '#2c8b66', fontWeight: 'bold' }}>Shortlisted ✓</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {tab === 'reports' && result && (
            <section className="b-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2>Solar Feasibility & Commercial Report</h2>
                  <p>Download structured CSV statement for your commercial solar installation.</p>
                </div>
                <a href={`/api${endpoint}/report`} download className="b-button b-primary">
                  <Icon>download</Icon> Download CSV Report
                </a>
              </div>
              <div className="b-kpis" style={{ marginTop: 24 }}>
                <Metric label="Net Present Value" value={result.npvInr ? compact(result.npvInr) : 'Unavailable'} detail="20-year unlevered" icon="savings" />
                <Metric label="IRR" value={result.irrPercentage ? `${result.irrPercentage}%` : 'Unavailable'} detail="Annualised internal rate" icon="trending_up" />
                <Metric label="Tenant Pool" value={currency(ledger.poolInr) + '/mo'} detail="Shared internal allocation" icon="groups" />
                <Metric label="Simple Payback" value={result.simplePaybackYears ? `${result.simplePaybackYears} yrs` : 'Unavailable'} detail="Return on initial CAPEX" icon="timelapse" />
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export const CommercialPage: React.FC = () => {
  return <BusinessOwnerPage />;
};
