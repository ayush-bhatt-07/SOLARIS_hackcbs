import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ReportExportModal } from '../components/common/ReportExportModal';

export const ReportsPage: React.FC = () => {
  const { community, currentUser, optimisationResult } = useApp();
  const [selectedReport, setSelectedReport] = useState<'feasibility' | 'community' | 'optimisation' | 'allocation' | 'regulatory' | 'maintenance'>('feasibility');
  const [isExportOpen, setIsExportOpen] = useState(false);

  const reportCards = [
    {
      id: 'feasibility' as const,
      title: 'Solar Feasibility & Yield Report',
      description: 'Engineering yield model, DC/AC sizing, roof space allocation, and PM Surya Ghar financial payback curves.',
      badge: 'Analytical',
      icon: 'calculate',
      timestamp: 'Updated 2026-10-22'
    },
    {
      id: 'community' as const,
      title: 'Community Participation & Roster Statement',
      description: 'Member capitalization progress, aggregated CA numbers, escrow deposits, and terrace authorization quorum.',
      badge: 'RWA Ledger',
      icon: 'groups',
      timestamp: 'Updated 2 hrs ago'
    },
    {
      id: 'optimisation' as const,
      title: 'Affordability Optimisation & Stress Proof',
      description: 'Linear programming solver outputs, baseline comparison against equal split, and monsoon sensitivity proofs.',
      badge: 'Mathematical',
      icon: 'bolt',
      timestamp: 'Re-run Oct 2026'
    },
    {
      id: 'allocation' as const,
      title: 'Credit Allocation Proposal & Reconciled Ledger',
      description: '100.0% zero-shortfall pro-rata distribution schedule ready for BSES Form A-VNM regulatory filing.',
      badge: 'DERC Formal',
      icon: 'pie_chart',
      timestamp: 'Cycle Oct 2026'
    },
    {
      id: 'regulatory' as const,
      title: 'Regulatory Checklist & Statutory Dossier',
      description: 'Structural integrity certificates, transformer load headroom verification, and national portal guidelines compliance.',
      badge: 'Compliance',
      icon: 'gavel',
      timestamp: 'Verified 2026-10-19'
    },
    {
      id: 'maintenance' as const,
      title: 'Plant Operations & Maintenance Summary',
      description: 'Quarterly array washdown schedule, smart meter AMR telemetry health, and inverter performance ratio records.',
      badge: 'Operations',
      icon: 'build',
      timestamp: 'Quarter Q3-2026'
    }
  ];

  const handleOpenExport = (type: typeof selectedReport) => {
    setSelectedReport(type);
    setIsExportOpen(true);
  };

  return (
    <div className="flex flex-col w-full pb-16 max-w-4xl mx-auto px-4 space-y-4 fade-in-soft">
      
      {/* Header */}
      <div className="pt-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#9af4d8]/60 text-[#00725d] text-xs font-semibold mb-1">
          <span className="material-symbols-outlined text-[14px]">download</span>
          <span>Downloadable &amp; Print-Ready Statements</span>
        </div>
        <h1 className="font-headline text-2xl sm:text-3xl font-bold text-[#002620]">
          Reports &amp; Regulatory Statements
        </h1>
        <p className="text-xs sm:text-sm text-[#404846] mt-0.5">
          Generate internal planning statements, evidence packs, and plan-vs-actual summaries. Not official DISCOM filings or utility bills.
        </p>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {reportCards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => handleOpenExport(card.id)}
            className="bg-white rounded-xl p-4 shadow-sm border border-[#e2f0f9] flex flex-col justify-between w-full text-left hover:border-[#006b57]/40 transition-colors focus:outline-none focus:ring-2 focus:ring-[#9af4d8]/60 focus:ring-offset-2"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#e8f6ff] text-[#006b57] font-bold">
                  {card.badge}
                </span>
                <span className="text-[10px] text-[#717976] font-mono">{card.timestamp}</span>
              </div>

              <div className="flex items-start gap-2.5 pt-1">
                <div className="w-9 h-9 rounded-lg bg-[#e2f0f9] text-[#006b57] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">{card.icon}</span>
                </div>
                <div>
                  <h3 className="font-headline text-sm font-bold text-[#002620]">{card.title}</h3>
                  <p className="text-xs text-[#404846] mt-1 leading-relaxed">{card.description}</p>
                </div>
              </div>
            </div>

<div className="pt-4 flex items-center gap-2 border-t border-[#e2f0f9] mt-3">
              <span className="flex-1 py-2 rounded-lg bg-[#006b57] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm">
                <span className="material-symbols-outlined text-[16px]">print</span>
                <span>View & Print</span>
              </span>

              <span className="py-2 px-3 rounded-lg bg-[#e8f6ff] text-[#006b57] text-xs font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">table_chart</span>
                <span>CSV</span>
              </span>
            </div>
</button>
        ))}
      </div>

      {/* Audit & Legal Footer */}
      <div className="p-4 bg-[#e8f6ff] rounded-xl border border-[#d6e5ee] space-y-2 text-xs text-[#404846]">
        <div className="flex items-center gap-1.5 font-bold text-[#002620]">
          <span className="material-symbols-outlined text-[18px] text-[#006b57]">verified_user</span>
          <span>Verified Document Generation Standards</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          All generated statements include reproducible algorithmic calculation hashes, verified timestamping, Delhi DERC tariff docket citations, and member CA linkage. Documents are generated as internal planning statements, not as billing invoices.
        </p>
      </div>

      <ReportExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        defaultReportType={selectedReport}
      />

    </div>
  );
};
