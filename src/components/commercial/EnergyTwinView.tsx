import React, { Component, Suspense, lazy, useEffect, useState } from 'react';
import type { MallShop } from '../../types/commercial';
import { SHOP_LABELS } from '../../utils/businessModel';
import { SHOP_COLORS } from '../../utils/mallLayout';

const MallScene = lazy(() => import('./MallScene'));
export interface TwinViewProps { shops: MallShop[]; floor: number; selected?: string; onSelect: (id: string) => void; flat: boolean; }
class ModelBoundary extends Component<{ children: React.ReactNode; fallback: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2');
    if (!context) return false;
    context.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch { return false; }
}
export default function EnergyTwinView(props: TwinViewProps) {
  const [webgl] = useState(supportsWebGL);
  const [lost, setLost] = useState(false);
  useEffect(() => { if (props.flat) setLost(false); }, [props.flat]);
  const grid = <div className="b-floor-grid">{props.shops.filter(s => s.floor === props.floor).map(shop => <button key={shop.id} data-shop-id={shop.id} aria-pressed={props.selected === shop.id} className={`b-map-shop ${props.selected === shop.id ? 'is-selected' : ''}`} onClick={() => props.onSelect(shop.id)} style={{ borderTopColor: SHOP_COLORS[shop.status] }}><span className="material-symbols-outlined" aria-hidden="true">storefront</span><strong>{shop.id.replace('shop-', 'Shop ')}</strong><small>{shop.name}</small><span className={`b-status ${shop.status}`}>{SHOP_LABELS[shop.status]}</span></button>)}</div>;
  if (props.flat || !webgl || lost) return <>{!props.flat && <p className="b-caption">3D is unavailable on this device. The same shop records are available in the floor grid.</p>}{grid}</>;
  return <ModelBoundary fallback={<><p role="status" className="b-caption">The 3D renderer could not start. Use the floor grid below.</p>{grid}</>}><Suspense fallback={<div className="twin-loading" role="status"><span className="material-symbols-outlined">view_in_ar</span>Building your EnergyTwin…</div>}><MallScene {...props} onContextLost={() => setLost(true)}/></Suspense></ModelBoundary>;
}
