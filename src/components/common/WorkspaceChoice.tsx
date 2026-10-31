import React from 'react';
import type { Workspace } from '../../types/commercial';

export const WorkspaceChoice = ({ value, onChange }: { value: Workspace; onChange: (value: Workspace) => void }) => (
  <div className="grid grid-cols-2 gap-2" role="group" aria-label="Login workspace">
    {([{ id: 'household', title: 'Households', detail: 'Homes & societies', icon: 'home' },
      { id: 'commercial', title: 'MSME & Malls', detail: 'Business solar · B2B', icon: 'domain' }] as const).map(item => (
      <button key={item.id} type="button" aria-pressed={value === item.id} onClick={() => onChange(item.id)}
        className={`rounded-xl border p-3 text-left transition-colors ${value === item.id ? 'border-[#006b57] bg-[#e2f6ec] text-[#006b57]' : 'border-[#dce5df] bg-white text-[#53615a]'}`}>
        <span className="material-symbols-outlined block mb-1">{item.icon}</span>
        <span className="block text-sm font-bold">{item.title}</span><span className="block text-[11px] mt-1">{item.detail}</span>
      </button>
    ))}
  </div>
);
