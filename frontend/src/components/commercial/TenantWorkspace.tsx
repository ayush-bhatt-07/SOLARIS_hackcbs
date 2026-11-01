import React, { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import { useApp } from '../../context/AppContext';
import type { MallShop } from '../../types/commercial';
import type { businessLedger } from '../../utils/businessModel';
import { SHOP_LABELS } from '../../utils/businessModel';

type OwnStatement = { shop: MallShop; statement: ReturnType<typeof businessLedger>['statements'][number] };
export default function TenantWorkspace() {
  const { logOut, currentUser } = useApp();
  const [data, setData] = useState<OwnStatement>();
  const [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    api('/business/properties').then(async result => {
      const property = result.properties[0];
      if (!property?.tenantView || !property.shopId) throw new Error('No active shop assignment is available.');
      const statement = await api<OwnStatement>(`/business/properties/${property.id}/shops/${property.shopId}/statement`);
      if (!cancelled) setData(statement);
    }).catch(e => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, []);
  return <div className="b-app"><main className="b-content twin-tenant-content"><header className="b-page-heading"><div><span className="b-eyebrow">SOLARIS / ENERGYTWIN</span><h1>Your shop. Your solar statement.</h1><p>{currentUser.name} · Restricted tenant workspace</p></div><button className="b-button b-outline" onClick={logOut}>Log out</button></header>{error ? <div role="alert" className="b-alert b-error">{error}</div> : !data ? <p role="status">Loading your assigned shop…</p> : <section className="b-card"><div className="b-card-heading"><div><h2>{data.shop.name}</h2><p>Floor {data.shop.floor} · {data.shop.meterId} · {data.statement.period}</p></div><span className={`b-status ${data.shop.status}`}>{SHOP_LABELS[data.shop.status]}</span></div><div className="b-kpis"><div className="b-metric"><span>Recorded consumption</span><strong>{data.statement.consumptionKwh.toLocaleString('en-IN')} kWh</strong><small>{data.statement.readingSource}</small></div><div className="b-metric b-metric-accent"><span>Projected internal benefit</span><strong>₹{data.statement.benefitInr.toLocaleString('en-IN')}</strong><small>Policy v{data.statement.policyVersion} · Estimate</small></div></div><h2>How your projection is calculated</h2><p className="b-caption">Eligible pool ₹{(data.statement.calculation.poolPaise / 100).toLocaleString('en-IN')} × your {data.statement.calculation.shopConsumptionKwh.toLocaleString('en-IN')} kWh ÷ {data.statement.calculation.eligibleConsumptionKwh.toLocaleString('en-IN')} eligible kWh. Non-participating shops receive zero; allocations are rounded in paise without exceeding the pool.</p><div className="b-assumptions"><span className="material-symbols-outlined">info</span><p>This illustrative statement uses synthetic readings and projected savings. It is an internal benefit projection, not an official DISCOM VNM credit or a utility bill. Your account cannot access other tenants’ records or the property's private bills.</p></div></section>}</main></div>;
}
