import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { REGULATORY_RULES } from '../data/mockData';

export const AdminPage: React.FC = () => {
  const { auditLogs } = useApp();
  const [activeTab, setActiveTab] = useState<'audit' | 'rules'>('audit');

  return (
    <div className="flex flex-col w-full pb-16 max-w-4xl mx-auto px-4 space-y-4 fade-in-soft">
      {/* Header */}
      <div className="pt-2 flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ffdea7] text-[#271900] text-xs font-bold mb-1">
            <span className="material-symbols-outlined text-[14px]">admin_panel_settings</span>
            <span>DERC Ombudsman &amp; Auditor Console</span>
          </div>
          <h1 className="font-headline text-2xl sm:text-3xl font-bold text-[#002620]">
            Rules &amp; Audit Ledger
          </h1>
          <p className="text-xs sm:text-sm text-[#404846] mt-0.5">
            Read-only statutory rule ledger and immutable transaction audit trail.
          </p>
        </div>

        <span className="px-2.5 py-1 rounded-lg bg-[#ffdad6] text-[#93000a] text-xs font-bold">
          Read-Only Audit Mode
        </span>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 rounded-xl bg-[#e2f0f9] text-xs font-semibold" role="tablist" aria-label="Admin console sections">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'audit'}
          onClick={() => setActiveTab('audit')}
          className={`flex-1 py-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#9af4d8]/60 focus:ring-offset-2 ${
            activeTab === 'audit' ? 'bg-white text-[#002620] shadow-sm font-bold' : 'text-[#404846]'
          }`}
        >
          Audit Logs ({auditLogs.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'rules'}
          onClick={() => setActiveTab('rules')}
          className={`flex-1 py-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#9af4d8]/60 focus:ring-offset-2 ${
            activeTab === 'rules' ? 'bg-white text-[#002620] shadow-sm font-bold' : 'text-[#404846]'
          }`}
        >
          Statutory Rules
        </button>
      </div>

      {/* Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-[#e2f0f9] space-y-3 fade-in-soft">
          <div className="flex items-center justify-between">
            <span className="font-headline text-sm font-bold text-[#002620]">Immutable Audit Trail</span>
            <span className="text-xs text-[#717976] font-mono">{auditLogs.length} events logged</span>
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3 bg-[#f8faf7] rounded-lg border border-[#e2f0f9] space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[#002620]">{log.action}</span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                      log.category === 'regulatory'
                        ? 'bg-[#e8f6ff] text-[#006b57]'
                        : log.category === 'financial'
                        ? 'bg-[#ffdea7] text-[#271900]'
                        : 'bg-[#e2f0f9] text-[#404846]'
                    }`}>
                      {log.category}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#717976] font-mono">{log.timestamp}</span>
                </div>
                <p className="text-[#404846] text-[11px] leading-relaxed">{log.details}</p>
                <div className="text-[10px] text-[#717976] pt-0.5">
                  Actor: <strong className="text-[#101d24]">{log.actor}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rules Ledger */}
      {activeTab === 'rules' && (
        <div className="space-y-3 fade-in-soft">
          <div className="flex items-center justify-between">
            <span className="font-headline text-sm font-bold text-[#002620]">Delhi DERC Statutory Rules</span>
            <span className="text-xs text-[#717976]">Read-only</span>
          </div>

          <div className="space-y-3">
            {REGULATORY_RULES.map((rule) => (
              <div key={rule.id} className="bg-white rounded-xl p-4 shadow-sm border border-[#e2f0f9] space-y-2.5 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-headline text-sm font-bold text-[#002620]">{rule.name}</h3>
                    <span className="text-[10px] text-[#717976] font-mono">{rule.policyCitation} · {rule.docketNumber}</span>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                    rule.status === 'eligible'
                      ? 'bg-[#9af4d8] text-[#00725d]'
                      : rule.status === 'potentially_eligible'
                      ? 'bg-[#e8f6ff] text-[#006b57]'
                      : rule.status === 'needs_verification'
                      ? 'bg-[#ffdea7] text-[#271900]'
                      : 'bg-[#d6e5ee] text-[#404846]'
                  }`}>
                    {rule.status.replace('_', ' ')}
                  </span>
                </div>

                <p className="text-[#404846] text-xs leading-relaxed">{rule.summary}</p>

                <div className="p-2.5 bg-[#f8faf7] rounded-lg border border-[#e2f0f9] space-y-1">
                  <span className="text-[10px] font-bold text-[#002620] uppercase block">Approval Pathway</span>
                  <p className="text-[11px] text-[#404846]">{rule.discomApprovalPathway}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
