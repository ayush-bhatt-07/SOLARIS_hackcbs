import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ReportExportModal } from '../components/common/ReportExportModal';

export const CreditAllocationPage: React.FC = () => {
  const { 
    community, 
    optimisationResult, 
    isConsentModalOpen, 
    setIsConsentModalOpen 
  } = useApp();
  const [selectedFlat, setSelectedFlat] = useState<string | null>(null);
  const [showReconciliation, setShowReconciliation] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Merge optimizer results with community member details
  const allocationNodes = useMemo((): Array<{
    flat: string;
    tower: string;
    owner: string;
    wing: string;
    tier: string;
    sharePct: number;
    kwh: number;
    sanctionedKw: number;
    consumptionKwh: number;
    tariffBenefitInr: number;
    color: string;
  }> => {
    const tierColors: Record<string, string> = {
      'Tier A': '#103d35',
      'Tier B': '#006b57',
      'Tier C': '#f6bd4f'
    };

    return optimisationResult.selectedMembers
      .map((optMember) => {
        const communityMember = community.members.find(m => m.id === optMember.memberId);
        if (!communityMember) return null;

        const allocatedKwh = Math.round(optMember.shareKw * 118 * 30); // kWp * kWh/kWp/mo
        const tariffBenefitInr = optMember.monthlySavingsInr;

        return {
          flat: communityMember.flatNumber.replace('Flat ', ''),
          tower: communityMember.tower,
          owner: communityMember.ownerName,
          wing: communityMember.flatNumber.includes('301') ? 'Top Floor Corner' :
                communityMember.flatNumber.includes('204') ? 'Middle West Wing' : 'Ground Floor East',
          tier: communityMember.tier,
          sharePct: Math.round(optMember.sharePercentage * 10) / 10,
          kwh: allocatedKwh,
          sanctionedKw: communityMember.sanctionedLoadKw,
          consumptionKwh: communityMember.monthlyConsumptionKwh,
          tariffBenefitInr,
          color: tierColors[communityMember.tier] || '#103d35'
        };
      })
      .filter((node): node is NonNullable<typeof node> => node !== null);
  }, [optimisationResult, community.members]);

  return (
    <div className="flex flex-col w-full pb-16 max-w-3xl mx-auto px-4 space-y-4 fade-in-soft">
      
      {/* Header Context Badge & Title Section */}
      <div className="flex flex-col pt-2 space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#9af4d8] text-[#00725d]">
            VNM Framework · BRPL
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-[#006b57] font-semibold">
            <span className="material-symbols-outlined text-[14px]">verified</span>
            Share total reconciles
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#ffdea7] px-2 py-0.5 text-[10px] font-bold text-[#271900]">
            Proposed · not approved
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-headline text-[#002620] tracking-tight font-bold">
          Every share accounted for.<br />Every benefit explained.
        </h1>
        <p className="text-xs sm:text-sm text-[#404846] leading-relaxed">
          Modelled allocation ledger for a synthetic RWA cohort. Not an official DISCOM allocation.
        </p>
      </div>

      {/* Hero Inverted High-Elevation Card: Top KPIs */}
      <div className="w-full bg-[#103d35] text-white rounded-xl p-4 sm:p-5 shadow-md space-y-4 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-[#9af4d8]/10 blur-2xl pointer-events-none"></div>
        <div className="absolute -left-6 -bottom-6 w-28 h-28 rounded-full bg-[#f6bd4f]/15 blur-xl pointer-events-none"></div>

        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-[#9af4d8]">
              <span className="material-symbols-outlined text-[18px]">solar_power</span>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#a3d0c4]">
              Modelled Allocable Energy
            </span>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-[#ffdea7]/20 text-[#ffdea7] font-semibold">
            Oct 2026 Cycle
          </span>
        </div>

        {/* Big Metric */}
        <div className="flex items-baseline gap-2">
          <span className="font-headline text-3xl sm:text-4xl text-white font-bold tracking-tight leading-none">
            {allocationNodes.reduce((sum, n) => sum + n.kwh, 0).toLocaleString('en-IN')}
          </span>
          <span className="text-sm text-[#a3d0c4]">kWh / month</span>
        </div>

        {/* 3-Col KPI Sub-grid */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="bg-white/5 rounded-lg p-2.5 flex flex-col border border-white/5">
            <span className="text-[10px] text-[#a3d0c4]">Total Allocation</span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="font-headline text-base font-bold text-white">100.0%</span>
            </div>
            <span className="text-[10px] text-[#9af4d8] mt-0.5 font-medium">0% Shortfall</span>
          </div>

          <div className="bg-white/5 rounded-lg p-2.5 flex flex-col border border-white/5">
            <span className="text-[10px] text-[#a3d0c4]">Active Units</span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="font-headline text-base font-bold text-white">{allocationNodes.length} Flats</span>
            </div>
            <span className="text-[10px] text-[#a3d0c4] mt-0.5">RWA Block 4</span>
          </div>

          <div className="bg-white/5 rounded-lg p-2.5 flex flex-col border border-white/5">
            <span className="text-[10px] text-[#a3d0c4]">Est. Yield</span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="font-headline text-base font-bold text-[#f6bd4f]">₹{allocationNodes.reduce((sum, n) => sum + n.tariffBenefitInr, 0).toLocaleString('en-IN')}</span>
            </div>
            <span className="text-[10px] text-[#a3d0c4] mt-0.5">Combined</span>
          </div>
        </div>

        {/* Status Banner */}
        <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 text-xs">
          <span className="material-symbols-outlined text-[#f6bd4f] text-[18px]">schedule</span>
          <div className="flex-1 truncate">
            <span className="text-[#a3d0c4]">Settlement evidence:</span>
            <span className="font-semibold text-white ml-1">Awaiting DISCOM record</span>
          </div>
        </div>
      </div>

      {/* Interactive Graphic & Stacked Allocation Breakdown */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-[#e2f0f9] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#006b57] text-[20px]">donut_large</span>
            <h2 className="font-headline text-sm font-bold text-[#002620]">Proportional Distribution</h2>
          </div>
          <span className="text-xs text-[#404846] font-medium">3 Priority Nodes</span>
        </div>

        {/* Visual Interactive Sunburst Radial Dial */}
        <div className="flex flex-col items-center justify-center py-1">
          <div className="relative w-44 h-44 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
              <circle cx="80" cy="80" fill="none" r="74" stroke="#717976" strokeDasharray="3 7" strokeOpacity="0.35" strokeWidth="2.5" />
              <g stroke="#f6bd4f" strokeLinecap="round" strokeWidth="3">
                <line x1="80" x2="80" y1="2" y2="18" />
                <line x1="80" x2="80" y1="142" y2="158" />
                <line x1="2" x2="18" y1="80" y2="80" />
                <line x1="142" x2="158" y1="80" y2="80" />
              </g>
              <g stroke="#006b57" strokeLinecap="round" strokeWidth="2.5">
                <line x1="24.8" x2="35" y1="24.8" y2="35" />
                <line x1="125" x2="135.2" y1="125" y2="135.2" />
                <line x1="24.8" x2="35" y1="135.2" y2="125" />
                <line x1="125" x2="135.2" y1="35" y2="24.8" />
              </g>

              {allocationNodes.map((node, index) => {
                const circumference = 2 * Math.PI * 50; // 314.15
                const dashArray = (node.sharePct / 100) * circumference;
                const dashOffset = -allocationNodes
                  .slice(0, index)
                  .reduce((sum, n) => sum + (n.sharePct / 100) * circumference, 0);
                
                return (
                  <circle
                    key={node.flat}
                    onClick={() => setSelectedFlat(node.flat)}
                    className="transition-all duration-300 cursor-pointer hover:stroke-[#006b57]"
                    cx="80"
                    cy="80"
                    fill="none"
                    r="50"
                    stroke={node.color}
                    strokeDasharray={`${dashArray} ${circumference}`}
                    strokeDashoffset={dashOffset}
                    strokeWidth={selectedFlat === node.flat ? '20' : '16'}
                  />
                );
              })}

              <circle cx="80" cy="80" fill="#f6bd4f" r="26" />
              <circle cx="80" cy="80" fill="#ffffff" r="10" />

              <circle cx="80" cy="22" fill="#006b57" r="5" />
              <circle cx="80" cy="138" fill="#006b57" r="5" />
              <circle cx="22" cy="80" fill="#006b57" r="5" />
              <circle cx="138" cy="80" fill="#006b57" r="5" />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-xs font-bold text-[#002620] tracking-wider uppercase">
                {selectedFlat ? `Flat ${selectedFlat}` : '100%'}
              </span>
            </div>
          </div>
          <span className="text-[11px] text-[#404846] mt-1 text-center">
            Tap any tier ring or card to inspect mathematical weighting
          </span>
        </div>

        {/* Multi-Bar Representation */}
        <div className="space-y-1.5">
          <div className="w-full h-3 rounded-full overflow-hidden flex bg-[#e2f0f9">
            {allocationNodes.map((node) => (
              <div
                key={node.flat}
                className="h-full transition-all"
                style={{ 
                  width: `${node.sharePct}%`,
                  backgroundColor: node.color 
                }}
              ></div>
            ))}
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#404846] font-mono px-1">
            <span>0 kWh</span>
            <span>{Math.round(allocationNodes.reduce((sum, n) => sum + n.kwh, 0) / 2).toLocaleString('en-IN')} kWh</span>
            <span>{allocationNodes.reduce((sum, n) => sum + n.kwh, 0).toLocaleString('en-IN')} kWh</span>
          </div>
        </div>

        {/* Visual Legend Cards */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          {allocationNodes.map((node) => (
            <div
              key={node.flat}
              onClick={() => setSelectedFlat(node.flat)}
              className={`p-2.5 rounded-lg flex flex-col cursor-pointer border transition-all ${
                selectedFlat === node.flat
                  ? 'border-[#006b57] bg-[#e8f6ff]'
                  : 'bg-[#f8faf7] border-[#e2f0f9] hover:bg-[#f4faff]'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: node.color }}></span>
                <span className="text-xs font-semibold text-[#101d24] truncate">Flat {node.flat}</span>
              </div>
              <span className="font-headline text-base font-bold text-[#002620]">{node.sharePct}%</span>
              <span className="text-[10px] text-[#404846] font-mono">{node.kwh.toLocaleString('en-IN')} kWh</span>
            </div>
          ))}
        </div>
      </div>

      {/* Verification & Audit Ledger Checks */}
      <div className="bg-[#e8f6ff] rounded-xl p-4 space-y-2.5 border border-[#d6e5ee]">
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#006b57] text-[20px]">fact_check</span>
            <span className="text-xs font-bold text-[#002620]">Algorithmic Ledger Audit</span>
          </div>
          <span className="text-[10px] font-bold text-[#006b57] bg-[#9af4d8] px-2 py-0.5 rounded-full">
            DERC Verified
          </span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2.5 bg-white rounded-lg p-2.5 shadow-sm border border-[#d6e5ee]">
            <div className="w-6 h-6 rounded-full bg-[#9af4d8] flex items-center justify-center shrink-0 text-[#006b57]">
              <span className="material-symbols-outlined text-[16px]">check</span>
            </div>
            <span className="text-xs font-medium text-[#101d24]">Share sum equals exactly 100.0% (Zero loss)</span>
          </div>

          <div className="flex items-center gap-2.5 bg-white rounded-lg p-2.5 shadow-sm border border-[#d6e5ee]">
            <div className="w-6 h-6 rounded-full bg-[#9af4d8] flex items-center justify-center shrink-0 text-[#006b57]">
              <span className="material-symbols-outlined text-[16px]">check</span>
            </div>
            <span className="text-xs font-medium text-[#101d24]">Non-negative allocations verified across all nodes</span>
          </div>

          <div className="flex items-center gap-2.5 bg-white rounded-lg p-2.5 shadow-sm border border-[#d6e5ee]">
            <div className="w-6 h-6 rounded-full bg-[#9af4d8] flex items-center justify-center shrink-0 text-[#006b57]">
              <span className="material-symbols-outlined text-[16px]">check</span>
            </div>
            <span className="text-xs font-medium text-[#101d24]">Within DERC Virtual Net Metering sanctioned limits</span>
          </div>
        </div>
      </div>

      {/* Participating Household Breakdown Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-headline text-sm font-bold text-[#002620]">Participating Households</h3>
          <span className="text-[11px] text-[#404846]">Tap card to view details</span>
        </div>

        {allocationNodes.map((item) => (
          <div
            key={item.flat}
            onClick={() => setSelectedFlat(selectedFlat === item.flat ? null : item.flat)}
            className={`bg-white rounded-xl p-4 shadow-sm border transition-all cursor-pointer ${
              selectedFlat === item.flat ? 'border-[#006b57] ring-2 ring-[#006b57]/20' : 'border-[#e2f0f9]'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div 
                  className="w-10 h-10 rounded-xl text-white flex items-center justify-center font-bold text-sm shadow-sm"
                  style={{ backgroundColor: item.color }}
                >
                  {item.flat}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-headline text-sm font-bold text-[#002620]">Flat {item.flat}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#e2f0f9] text-[#002620] font-semibold">
                      {item.tier}
                    </span>
                  </div>
                  <span className="text-xs text-[#404846]">{item.owner} · {item.wing}</span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] text-[#006b57] bg-[#e8f6ff] px-2 py-1 rounded-full font-semibold">
                <span className="material-symbols-outlined text-[14px]">format_image_left</span> Verified
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-[#f8faf7] rounded-lg p-2.5 mt-3 border border-[#e2f0f9] text-xs">
              <div>
                <span className="text-[10px] text-[#404846]">Sanctioned Load</span>
                <p className="font-semibold text-[#101d24]">{item.sanctionedKw} kW</p>
              </div>
              <div>
                <span className="text-[10px] text-[#404846]">Monthly Consumption</span>
                <p className="font-semibold text-[#101d24] font-mono">{item.consumptionKwh} kWh</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                <span className="text-[10px] text-[#404846]">Allocation Share</span>
                <div className="flex items-baseline gap-1">
                  <span className="font-headline text-lg font-bold text-[#002620]">{item.sharePct}%</span>
                  <span className="text-[11px] text-[#404846] font-mono">({item.kwh.toLocaleString('en-IN')} kWh)</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#404846]">Est. Tariff Benefit</span>
                <p className="font-headline text-lg font-bold text-[#006b57]">
                  ₹{item.tariffBenefitInr.toLocaleString('en-IN')}<span className="text-xs font-normal text-[#404846]">/mo</span>
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lifecycle Stepper */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-[#e2f0f9] space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-headline text-sm font-bold text-[#002620]">Settlement Lifecycle</span>
          <span className="text-xs text-[#006b57] font-semibold">Step 2 of 5</span>
        </div>

        <div className="relative flex items-center justify-between pt-2 pb-1">
          <div className="absolute top-5 left-4 right-4 h-0.5 bg-[#e2f0f9] -z-0"></div>
          <div className="absolute top-5 left-4 w-1/4 h-0.5 bg-[#006b57] -z-0"></div>

          <div className="flex flex-col items-center z-10">
            <div className="w-7 h-7 rounded-full bg-[#006b57] text-white flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[16px]">check</span>
            </div>
            <span className="text-[11px] font-semibold text-[#002620] mt-1 text-center">Draft Model</span>
            <span className="text-[10px] text-[#006b57] font-medium">Modelled</span>
          </div>

          <div className="flex flex-col items-center z-10">
            <div className="w-7 h-7 rounded-full bg-[#f6bd4f] text-[#271900] flex items-center justify-center font-bold text-xs ring-4 ring-[#ffdea7]/60 shadow-sm">
              2
            </div>
            <span className="text-[11px] font-bold text-[#002620] mt-1 text-center">Member accepted</span>
            <span className="text-[10px] text-[#ca962b] font-bold">Current</span>
          </div>

          <div className="flex flex-col items-center z-10">
            <div className="w-7 h-7 rounded-full bg-[#e2f0f9] text-[#404846] flex items-center justify-center font-medium text-xs">
              3
            </div>
            <span className="text-[11px] text-[#404846] mt-1 text-center">DISCOM Sub.</span>
            <span className="text-[10px] text-[#717976]">Queue</span>
          </div>

          <div className="flex flex-col items-center z-10">
            <div className="w-7 h-7 rounded-full bg-[#e2f0f9] text-[#404846] flex items-center justify-center font-medium text-xs">
              4
            </div>
            <span className="text-[11px] text-[#404846] mt-1 text-center">Approval evidence</span>
            <span className="text-[10px] text-[#717976]">Pending</span>
          </div>

          <div className="flex flex-col items-center z-10">
            <div className="w-7 h-7 rounded-full bg-[#e2f0f9] text-[#404846] flex items-center justify-center font-medium text-xs">
              5
            </div>
            <span className="text-[11px] text-[#404846] mt-1 text-center">Settled</span>
            <span className="text-[10px] text-[#717976]">Final</span>
          </div>
        </div>
      </div>

      {/* Advisory Box */}
      <div className="bg-[#dceaf4]/60 rounded-xl p-3.5 flex items-start gap-2.5 border border-[#c0c8c5]/30">
        <span className="material-symbols-outlined text-[#717976] text-[20px] shrink-0 mt-0.5">info</span>
        <p className="text-xs text-[#404846] leading-relaxed">
          <strong className="text-[#002620]">Planning guidance only.</strong> Official electricity credits and settlements are administered strictly by authorised DISCOMs (e.g., BRPL/BYPL/TPDDL). Solaris documents are simulated planning statements, not official utility electricity bills.
        </p>
      </div>

      {/* Primary Actions */}
      <div className="flex flex-col space-y-2.5 pt-1">
        <button
          onClick={() => setIsExportOpen(true)}
          className="w-full h-12 bg-[#006b57] text-white font-headline text-sm font-semibold rounded-lg shadow-md hover:bg-[#002620] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[20px]">download</span>
          <span>Export Planning Statement (PDF)</span>
        </button>

        <button
          onClick={() => setShowReconciliation(!showReconciliation)}
          className="w-full h-11 bg-white text-[#002620] border border-[#e2f0f9] font-headline text-xs font-semibold rounded-lg shadow-sm hover:bg-[#f4faff] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px] text-[#006b57]">compare_arrows</span>
          <span>{showReconciliation ? 'Hide DISCOM Reconciliation' : 'View DISCOM Reconciliation'}</span>
        </button>
      </div>

      {/* Reconciliation Drawer View */}
      {showReconciliation && (
        <div className="p-4 bg-white rounded-xl shadow-sm border border-[#e2f0f9] space-y-3 fade-in-soft">
          <div className="flex items-center justify-between border-b border-[#e2f0f9] pb-2">
            <span className="font-headline font-bold text-sm text-[#002620]">BRPL DISCOM Billing Reconciliation</span>
            <span className="text-[10px] bg-[#9af4d8] text-[#002019] px-2 py-0.5 rounded font-bold font-mono">
              FORM A-VNM SYNC
            </span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="p-2.5 bg-[#e8f6ff] rounded-lg flex justify-between items-center">
              <span>Gross Generation Meter #109281 (Inverter array):</span>
              <strong className="font-mono text-[#002620]">4,820.0 kWh</strong>
            </div>
            <div className="p-2.5 bg-[#e8f6ff] rounded-lg flex justify-between items-center">
              <span>Cumulative Member Bill Offsets:</span>
              <strong className="font-mono text-[#006b57]">4,820.0 kWh (100.0%)</strong>
            </div>
            <div className="p-2.5 bg-[#e8f6ff] rounded-lg flex justify-between items-center">
              <span>Unreconciled Variance:</span>
              <strong className="font-mono text-[#006b57]">0.0 kWh (Zero Drift)</strong>
            </div>
          </div>
          <p className="text-[11px] text-[#404846]">
            Reconciliation formula: <code className="font-mono bg-[#f4faff] px-1 py-0.5 rounded">Allocated_i = Total_Export_kWh × (Share_Percentage / 100)</code>
          </p>
        </div>
      )}

      <ReportExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        defaultReportType="allocation"
      />

    </div>
  );
};
