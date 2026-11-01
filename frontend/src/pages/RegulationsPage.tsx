import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { REGULATORY_RULES } from '../data/mockData';

export const RegulationsPage: React.FC = () => {
  const { currentUser, navigateTo } = useApp();
  const [filterType, setFilterType] = useState<'res' | 'com'>('res');
  const [isChecklistOpen, setIsChecklistOpen] = useState(true);

  return (
    <div className="flex flex-col w-full pb-16 max-w-3xl mx-auto px-4 fade-in-soft">
      
      {/* Subsidies Category Toggle Bar */}
      <section className="pt-2 pb-3">
        <div className="flex items-center justify-between bg-[#e2f0f9] p-1 rounded-xl shadow-sm mb-3" role="tablist" aria-label="Regulatory pathway categories">
          <button
            type="button"
            role="tab"
            aria-selected={filterType === 'res'}
            onClick={() => setFilterType('res')}
            className={`flex-1 py-2 px-3 rounded-lg text-center text-xs font-semibold transition-all flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#9af4d8]/60 focus:ring-offset-2 ${
              filterType === 'res'
                ? 'bg-white text-[#002620] shadow-sm'
                : 'text-[#404846] hover:text-[#002620]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px] text-[#006b57]">home</span>
            <span>Residential PM Surya Ghar</span>
          </button>
          
          <button
            type="button"
            role="tab"
            aria-selected={filterType === 'com'}
            onClick={() => setFilterType('com')}
            className={`flex-1 py-2 px-3 rounded-lg text-center text-xs font-semibold transition-all flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#9af4d8]/60 focus:ring-offset-2 ${
              filterType === 'com'
                ? 'bg-white text-[#002620] shadow-sm'
                : 'text-[#404846] hover:text-[#002620]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px] text-[#006b57]">storefront</span>
            <span>MSME / Commercial</span>
          </button>
        </div>

        {/* Connection Context Badge */}
        <div className="bg-[#e8f6ff] rounded-xl p-3.5 flex items-center justify-between shadow-sm border border-[#d6e5ee]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-[#103d35] text-[#bfece0] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">electric_meter</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-[#404846] uppercase tracking-wider font-semibold">
                Active Property Context
              </span>
              <span className="font-headline text-xs sm:text-sm text-[#002620] font-bold truncate">
                {filterType === 'res' ? 'Domestic LT-1 · 5.0 kW Sanctioned' : 'Non-Domestic / MSME · 25.0 kW Sanctioned'}
              </span>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-1 bg-[#d6e5ee] px-2.5 py-1 rounded-full text-[#006b57] text-[11px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#006b57]"></span>
            <span>{currentUser.discom} Delhi</span>
          </div>
        </div>
      </section>

      {/* Editorial Headline */}
      <section className="mb-4">
        <div className="bg-gradient-to-br from-[#e2f0f9] to-[#e8f6ff] p-4 rounded-xl shadow-sm relative overflow-hidden border border-[#d6e5ee]">
          <div className="relative z-10 flex flex-col gap-1">
            <div className="inline-flex items-center gap-1.5 text-[#006b57] text-[11px] uppercase tracking-wider font-bold">
              <span className="material-symbols-outlined text-[16px]">policy</span>
              <span>Delhi DERC &amp; Central MNRE Framework</span>
            </div>
            <h1 className="font-headline text-xl sm:text-2xl text-[#002620] tracking-tight font-bold">
              Know what's possible before you invest.
            </h1>
            <p className="text-xs text-[#404846] leading-relaxed">
              Interactive regulatory decision tree &amp; statutory eligibility matrix across Delhi grid jurisdiction.
            </p>
          </div>
          <div className="absolute -right-3 -bottom-3 text-[#006b57]/10 pointer-events-none">
            <span className="material-symbols-outlined text-[110px]">balance</span>
          </div>
        </div>
      </section>

      {/* Pathways Container */}
      <section className="flex flex-col gap-3.5">
        
        {/* Card 1: VNM */}
        <article className="bg-white rounded-xl shadow-sm border border-[#e2f0f9] p-4 flex flex-col gap-3.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-1 min-w-0">
              <span className="inline-flex items-center gap-1 w-fit px-2.5 py-0.5 rounded-full bg-[#9af4d8] text-[#00725d] text-[10px] font-bold uppercase tracking-wider">
                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                POTENTIALLY ELIGIBLE · High Feasibility
              </span>
              <h2 className="font-headline text-base text-[#002620] font-bold mt-1">
                Community Solar / Virtual Net Metering (VNM)
              </h2>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#e2f0f9] text-[#006b57] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">diversity_3</span>
            </div>
          </div>

          <div className="bg-[#e8f6ff] rounded-lg p-3 flex flex-col gap-1 text-[#101d24]">
            <div className="flex items-center gap-2 text-[#002620] font-headline text-xs font-semibold">
              <span className="material-symbols-outlined text-[16px] text-[#006b57]">apartment</span>
              <span>Multi-Dwelling Buildings &amp; RWAs</span>
            </div>
            <p className="text-xs text-[#404846] leading-relaxed">
              Shared terrace with dedicated solar generation meter feeding BRPL grid; credits distributed algorithmically via DISCOM billing cycles.
            </p>
          </div>

          <div className="flex flex-col gap-2 text-xs">
            <div className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[18px] text-[#006b57] shrink-0 mt-0.5">folder_shared</span>
              <div className="flex flex-col">
                <span className="text-xs text-[#002620] font-semibold">Required Documentation</span>
                <span className="text-[11px] text-[#404846]">
                  RWA Resolution (≥70% terrace consent), bills of member CA numbers, proof of common roof rights.
                </span>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[18px] text-[#006b57] shrink-0 mt-0.5">verified_user</span>
              <div className="flex flex-col">
                <span className="text-xs text-[#002620] font-semibold">DISCOM Approval Pathway</span>
                <span className="text-[11px] text-[#404846]">
                  Form A-VNM to BSES Rajdhani + Transformer capacity clearance (&lt;80% rated kVA).
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-1 border-t border-[#e2f0f9]">
            <div className="flex items-center justify-between text-[#404846] text-xs">
              <span className="flex items-center gap-1 font-medium text-[11px]">
                <span className="material-symbols-outlined text-[14px]">gavel</span>
                DERC VNM Guidelines 2024
              </span>
              <span className="font-mono text-[10px]">F.3(644)/Tariff/DERC</span>
            </div>
            <button
              type="button"
              onClick={() => navigateTo('/community')}
              className="w-full h-11 rounded-lg bg-[#006b57] text-white font-headline text-xs font-semibold flex items-center justify-center gap-2 shadow-sm hover:bg-[#002620] active:scale-[0.99] transition-all focus:outline-none focus:ring-2 focus:ring-[#9af4d8]/60 focus:ring-offset-2"
            >
              <span>Start Community VNM Draft</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </article>

        {/* Card 2: CAPEX */}
        <article className="bg-white rounded-xl shadow-sm border border-[#e2f0f9] p-4 flex flex-col gap-3.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-1 min-w-0">
              <span className="inline-flex items-center gap-1 w-fit px-2.5 py-0.5 rounded-full bg-[#9af4d8] text-[#00725d] text-[10px] font-bold uppercase tracking-wider">
                <span className="material-symbols-outlined text-[14px]">verified</span>
                {filterType === 'res' ? 'ELIGIBLE · PM Surya Ghar Covered' : 'COMMERCIAL · Accelerated Depreciation'}
              </span>
              <h2 className="font-headline text-base text-[#002620] font-bold mt-1">
                Individual Rooftop Net Metering (CAPEX)
              </h2>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#e2f0f9] text-[#006b57] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">roofing</span>
            </div>
          </div>

          {filterType === 'res' ? (
            <div className="bg-[#ffdea7]/40 rounded-lg p-3 flex items-center justify-between border border-[#ffdea7]">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[#f6bd4f] text-[24px]">savings</span>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-[#5e4200] uppercase">Central Subsidy Eligible</span>
                  <span className="font-headline text-sm font-bold text-[#2e1e00]">₹78,000 Direct DBT</span>
                </div>
              </div>
              <span className="text-[10px] bg-white px-2 py-0.5 rounded text-[#493200] font-semibold">1-3 kW Band</span>
            </div>
          ) : (
            <div className="bg-[#e8f6ff] rounded-lg p-3 flex items-center justify-between border border-[#d6e5ee]">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[#006b57] text-[24px]">percent</span>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-[#006b57] uppercase">Income Tax Benefit</span>
                  <span className="font-headline text-sm font-bold text-[#002620]">40% Year 1 Depreciation</span>
                </div>
              </div>
              <span className="text-[10px] bg-white px-2 py-0.5 rounded text-[#006b57] font-semibold">Section 32 IT Act</span>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <p className="text-xs text-[#404846] leading-relaxed">
              Full private ownership on independent roof or exclusive private terrace rights with direct bi-directional grid export.
            </p>
            <div className="flex flex-wrap gap-1.5 mt-1">
              <span className="px-2 py-1 rounded bg-[#e2f0f9] text-[#404846] text-[11px]">Unencumbered Roof Rights</span>
              <span className="px-2 py-1 rounded bg-[#e2f0f9] text-[#404846] text-[11px]">BSES Bi-directional Meter</span>
              <span className="px-2 py-1 rounded bg-[#e2f0f9] text-[#404846] text-[11px]">CEA Compliant Inverter</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-1 border-t border-[#e2f0f9]">
            <div className="flex items-center justify-between text-[#404846] text-xs">
              <span className="flex items-center gap-1 font-medium text-[11px]">
                <span className="material-symbols-outlined text-[14px]">account_balance</span>
                MNRE National Portal Guidelines 2024
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigateTo('/assessment')}
              className="w-full h-11 rounded-lg bg-[#e2f0f9] text-[#002620] font-headline text-xs font-semibold flex items-center justify-center gap-2 hover:bg-[#dceaf4] transition-colors focus:outline-none focus:ring-2 focus:ring-[#9af4d8]/60 focus:ring-offset-2"
            >
              <span>View Individual Assessment</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </article>

        {/* Card 3: GNM */}
        <article className="bg-white rounded-xl shadow-sm border border-[#e2f0f9] p-4 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-1 min-w-0">
              <span className="inline-flex items-center gap-1 w-fit px-2.5 py-0.5 rounded-full bg-[#ffdea7] text-[#271900] text-[10px] font-bold uppercase tracking-wider">
                <span className="material-symbols-outlined text-[14px]">pending</span>
                NEEDS VERIFICATION
              </span>
              <h2 className="font-headline text-base text-[#002620] font-bold mt-1">
                Group Net Metering (GNM)
              </h2>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#e2f0f9] text-[#ca962b] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">alt_route</span>
            </div>
          </div>
          
          <p className="text-xs text-[#404846] leading-relaxed">
            Designed for a single entity with multiple electricity connections (e.g., residence + separate water pump meter + parking common utility).
          </p>
          
          <div className="bg-[#dceaf4]/60 rounded-lg p-2.5 flex items-start gap-2 text-[#404846] text-xs">
            <span className="material-symbols-outlined text-[18px] text-[#493200] shrink-0 mt-0.5">warning</span>
            <span className="text-[11px]">
              Critical Caveat: All recipient meters must strictly operate under the identical DISCOM distribution boundary (BRPL).
            </span>
          </div>

        </article>

        {/* Card 4: P2P */}
        <article className="bg-white/80 rounded-xl shadow-sm border border-[#e2f0f9] p-4 flex flex-col gap-2.5 opacity-90">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-1 min-w-0">
              <span className="inline-flex items-center gap-1 w-fit px-2.5 py-0.5 rounded-full bg-[#d6e5ee] text-[#404846] text-[10px] font-bold uppercase tracking-wider">
                <span className="material-symbols-outlined text-[14px]">lock</span>
                PILOT ONLY / RESTRICTED
              </span>
              <h2 className="font-headline text-base text-[#404846] font-bold mt-1">
                Peer-to-Peer (P2P) Energy Trading
              </h2>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#dceaf4] text-[#717976] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">swap_horiz</span>
            </div>
          </div>
          
          <div className="bg-[#e8f6ff] rounded-lg p-3">
            <p className="text-xs text-[#404846] leading-relaxed">
              Under DERC regulations, direct consumer-to-consumer trading is strictly restricted to designated regulatory sandbox pilots and cannot be commercialised for billing offsets without specific commission orders.
            </p>
          </div>
        </article>

      </section>

      {/* Compliance Checklist Accordion */}
      <section className="mt-5">
        <div className="bg-white rounded-xl shadow-sm border border-[#e2f0f9] overflow-hidden">
          <button
            type="button"
            onClick={() => setIsChecklistOpen(!isChecklistOpen)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-[#f4faff] transition-colors focus:outline-none focus:ring-2 focus:ring-[#9af4d8]/60 focus:ring-offset-2"
            aria-expanded={isChecklistOpen}
            aria-controls="compliance-checklist"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#9af4d8] text-[#006b57] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">fact_check</span>
              </div>
              <div className="flex flex-col">
                <span className="font-headline text-sm text-[#002620] font-bold">
                  Statutory Compliance Checklist
                </span>
                <span className="text-[11px] text-[#006b57] font-semibold">3 of 3 Pre-requisites Satisfied</span>
              </div>
            </div>
            <span className={`material-symbols-outlined text-[#002620] text-[24px] transition-transform duration-200 ${
              isChecklistOpen ? 'rotate-0' : 'rotate-180'
            }`}>
              expand_more
            </span>
          </button>

          {isChecklistOpen && (
            <div id="compliance-checklist" className="px-4 pb-4 pt-1 flex flex-col gap-2.5 fade-in-soft">
              <div className="flex items-start gap-3 p-2.5 rounded-lg bg-[#e8f6ff] border border-[#d6e5ee]">
                <span className="material-symbols-outlined text-[#006b57] text-[20px] shrink-0 mt-0.5">check_circle</span>
                <div className="flex flex-col">
                  <span className="text-xs text-[#002620] font-bold">Rooftop Structural Integrity</span>
                  <span className="text-[11px] text-[#404846]">Unencumbered structural certificate verified for wind loads up to 150 km/h.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-lg bg-[#e8f6ff] border border-[#d6e5ee]">
                <span className="material-symbols-outlined text-[#006b57] text-[20px] shrink-0 mt-0.5">check_circle</span>
                <div className="flex flex-col">
                  <span className="text-xs text-[#002620] font-bold">Sanctioned Meter Limit Match</span>
                  <span className="text-[11px] text-[#404846]">Solar capacity capped strictly within 100% of sanctioned load (5.0 kW max injection).</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-lg bg-[#e8f6ff] border border-[#d6e5ee]">
                <span className="material-symbols-outlined text-[#006b57] text-[20px] shrink-0 mt-0.5">check_circle</span>
                <div className="flex flex-col">
                  <span className="text-xs text-[#002620] font-bold">Distribution Transformer Headroom</span>
                  <span className="text-[11px] text-[#404846]">&gt;22 kW spare capacity available on feeder DT-14B (Current saturation: 58%).</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Statutory Disclaimer Notice */}
      <section className="mt-4">
        <div className="p-3.5 rounded-xl bg-[#dceaf4]/60 flex items-start gap-2.5 text-[#404846] border border-[#c0c8c5]/30">
          <span className="material-symbols-outlined text-[20px] text-[#717976] shrink-0 mt-0.5">shield</span>
          <p className="text-[11px] leading-relaxed">
            <strong>Statutory Notice:</strong> Solaris provides regulatory planning guidance. Official eligibility, metering approvals, and tariff credit settlement depend strictly upon the authorised DISCOM (BRPL/BYPL/TPDDL) and applicable Delhi DERC orders.
          </p>
        </div>
      </section>

    </div>
  );
};
