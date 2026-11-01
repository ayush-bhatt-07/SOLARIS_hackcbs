import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ReportExportModal } from '../components/common/ReportExportModal';
import { calculateEqualSplitBaseline, calculateIndividualBaseline } from '../utils/optimiserEngine';

export const OptimiserPage: React.FC = () => {
  const { 
    community, 
    optimisationParams, 
    setOptimisationParams, 
    optimisationResult, 
    navigateTo,
    addAuditLog 
  } = useApp();

  const [activeScenario, setActiveScenario] = useState<'optimal' | 'equal' | 'individual'>('optimal');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [committedFeedback, setCommittedFeedback] = useState(false);

  // Real-time recalculation toggles
  const handleRoofAreaChange = (val: number) => {
    setOptimisationParams(prev => ({ ...prev, roofAreaSqFt: val }));
  };

  const handleKwSelect = (kw: 10 | 12 | 15) => {
    setOptimisationParams(prev => ({ 
      ...prev, 
      targetCapacityKw: kw,
      budgetCeilingInr: kw === 10 ? 500000 : kw === 12 ? 580000 : 720000 
    }));
  };

  const toggleStressChip = (key: keyof typeof optimisationParams.stressFactors) => {
    setOptimisationParams(prev => ({
      ...prev,
      stressFactors: {
        ...prev.stressFactors,
        [key]: !prev.stressFactors[key]
      }
    }));
  };

  const handleReset = () => {
    setOptimisationParams({
      roofAreaSqFt: 1400,
      targetCapacityKw: 12,
      budgetCeilingInr: 580000,
      financingRatePercentage: 8.5,
      participantCapInr: 4500,
      stressFactors: {
        monsoonDrop: false,
        rateSpike: false,
        unitDropOut: false,
        subsidyDelay: false
      }
    });
  };

  const handleCommitShare = () => {
    setCommittedFeedback(true);
    addAuditLog(
      'Optimised Power Allocation Committed',
      `Locked ${optimisationParams.targetCapacityKw} kWp allocation distribution across ${optimisationResult.includedCount} flats.`,
      'financial'
    );
    setTimeout(() => {
      navigateTo('/credit-allocation');
    }, 800);
  };

  const equalSplit = calculateEqualSplitBaseline(community.members, optimisationParams.budgetCeilingInr - 78000);
  const individual = calculateIndividualBaseline();

  return (
    <div className="flex flex-col w-full pb-16 max-w-3xl mx-auto px-4 gap-4 fade-in-soft">
      
      {/* Status Badge Notification */}
      <div className="pt-2">
        <div className="flex items-center gap-2.5 p-3 rounded-lg bg-[#103d35] text-white shadow-sm">
          <span className="material-symbols-outlined text-[20px] text-[#f6bd4f]">verified</span>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#9af4d8]">
                Feasible plan found
              </span>
              <span className="text-white/40 text-[10px]">•</span>
              <span className="text-[11px] text-[#7ca89d] truncate">
                Modelled VNM arrangement
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Narrative Header Box */}
      <div className="flex flex-col gap-1 px-1">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full bg-[#9af4d8] text-[#002019] text-[10px] font-bold font-mono">
            DERC Group Model
          </span>
          <span className="text-[#717976] text-xs font-mono">{optimisationResult.solverVersion}</span>
        </div>
        <h2 className="font-headline text-xl sm:text-2xl text-[#002620] tracking-tight font-bold">
          The smartest solar plan is the one everyone can afford.
        </h2>
        <p className="text-xs text-[#404846]">
          Simulated for {community.totalEligibleFlats} residential units in Block C, Pocket 2 with peak solar alignment.
        </p>
      </div>

      {/* Scenario Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar" role="tablist" aria-label="Optimisation scenarios">
        <button
          type="button"
          role="tab"
          aria-selected={activeScenario === 'optimal'}
          onClick={() => setActiveScenario('optimal')}
          className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#9af4d8]/60 focus:ring-offset-2 ${
            activeScenario === 'optimal'
              ? 'bg-[#006b57] text-white'
              : 'bg-[#e2f0f9] text-[#404846] hover:text-[#101d24]'
          }`}
        >
          <span className="material-symbols-outlined text-[16px] text-[#f6bd4f]">stars</span>
          Optimised Scenario (Rec.)
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeScenario === 'equal'}
          onClick={() => setActiveScenario('equal')}
          className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-[#9af4d8]/60 focus:ring-offset-2 ${
            activeScenario === 'equal'
              ? 'bg-[#006b57] text-white'
              : 'bg-[#e2f0f9] text-[#404846] hover:text-[#101d24]'
          }`}
        >
          Equal Split Baseline
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeScenario === 'individual'}
          onClick={() => setActiveScenario('individual')}
          className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-[#9af4d8]/60 focus:ring-offset-2 ${
            activeScenario === 'individual'
              ? 'bg-[#006b57] text-white'
              : 'bg-[#e2f0f9] text-[#404846] hover:text-[#101d24]'
          }`}
        >
          Individual Rooftop
        </button>
      </div>

      {/* Primary Solver Card */}
      {activeScenario === 'optimal' && (
        <div className="w-full rounded-xl bg-[#103d35] text-white p-4 sm:p-5 shadow-md flex flex-col gap-4 relative overflow-hidden fade-in-soft">
          <div className="absolute -top-10 -right-10 w-36 h-36 bg-[#006b57]/30 rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#a3d0c4]">
                Avg. Net Monthly Benefit
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-headline text-3xl font-extrabold text-white">
                  ₹{optimisationResult.avgNetMonthlySavingsInr.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-[#7ca89d]">/flat savings</span>
              </div>
              <span className="text-xs text-[#9af4d8] mt-0.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">trending_up</span>
                Net gain after {optimisationParams.financingRatePercentage}% EMI clearance
              </span>
            </div>

            <div className="flex flex-col items-end">
              <div className="px-2.5 py-1 rounded-full bg-[#006b57] text-white text-xs font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#f6bd4f] animate-pulse"></span>
                100% Subscribed
              </div>
              <span className="text-[11px] text-[#7ca89d] mt-1">
                {optimisationResult.includedCount} of {optimisationResult.totalCount} Flats Joined
              </span>
            </div>
          </div>

          {/* Micro Bar Distribution */}
          <div className="p-3 rounded-lg bg-white/10 backdrop-blur-md flex flex-col gap-2 border border-white/10">
            <div className="flex justify-between items-center text-xs">
              <span className="flex items-center gap-1.5 text-white">
                <span className="w-2 h-2 rounded-full bg-[#9af4d8]"></span> Grid Bill Offset
              </span>
              <span className="font-bold text-[#9af4d8]">
                ₹{optimisationResult.avgGridOffsetInr.toLocaleString('en-IN')}/mo
              </span>
            </div>

            <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden flex">
              <div className="bg-[#9af4d8] h-full" style={{ width: '63%' }}></div>
              <div className="bg-[#f6bd4f] h-full" style={{ width: '37%' }}></div>
            </div>

            <div className="flex justify-between items-center text-xs text-[#7ca89d]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#f6bd4f]"></span> SBI Green Loan EMI
              </span>
              <span className="font-bold text-[#ffdea7]">
                ₹{optimisationResult.avgEmiInr.toLocaleString('en-IN')}/mo
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Baseline Comparisons */}
      {activeScenario === 'equal' && (
        <div className="w-full rounded-xl bg-white p-4 shadow-sm border border-[#e2f0f9] flex flex-col gap-3 fade-in-soft">
          <div className="flex items-center justify-between border-b border-[#e2f0f9] pb-2">
            <span className="font-headline font-bold text-sm text-[#002620]">Equal Split Baseline Model</span>
            <span className="text-xs text-[#ba1a1a] font-bold bg-[#ffdad6] px-2 py-0.5 rounded-full">
              High Dropout Risk
            </span>
          </div>
          <p className="text-xs text-[#404846] leading-relaxed">
            In an equal allocation model, every flat pays exactly ₹{equalSplit.equalCostPerMemberInr.toLocaleString('en-IN')} upfront (EMI: ₹{equalSplit.equalEmiInr}/mo).
          </p>
          <div className="grid grid-cols-3 gap-2 py-2 bg-[#e8f6ff] rounded-lg text-center text-xs">
            <div>
              <span className="text-[10px] text-[#404846] block">Viable Units</span>
              <span className="font-bold text-[#002620]">{equalSplit.participationCount} of 14</span>
            </div>
            <div>
              <span className="text-[10px] text-[#404846] block">Dropouts</span>
              <span className="font-bold text-[#ba1a1a]">{equalSplit.dropouts} Flats</span>
            </div>
            <div>
              <span className="text-[10px] text-[#404846] block">Fairness Score</span>
              <span className="font-bold text-[#ca962b]">{equalSplit.fairnessIndex}%</span>
            </div>
          </div>
          <span className="text-[11px] text-[#404846]">
            ⚠️ Smaller 2BHK flats with lower electricity usage drop out because the equal contribution exceeds their monthly power savings.
          </span>
        </div>
      )}

      {activeScenario === 'individual' && (
        <div className="w-full rounded-xl bg-white p-4 shadow-sm border border-[#e2f0f9] flex flex-col gap-3 fade-in-soft">
          <div className="flex items-center justify-between border-b border-[#e2f0f9] pb-2">
            <span className="font-headline font-bold text-sm text-[#002620]">Individual Rooftop CAPEX Baseline</span>
            <span className="text-xs text-[#404846] font-bold bg-[#e2f0f9] px-2 py-0.5 rounded-full">
              Roof Constrained
            </span>
          </div>
          <p className="text-xs text-[#404846] leading-relaxed">
            Each household installs private 3 kW rooftop system independently.
          </p>
          <div className="grid grid-cols-3 gap-2 py-2 bg-[#e8f6ff] rounded-lg text-center text-xs">
            <div>
              <span className="text-[10px] text-[#404846] block">Net Upfront / Flat</span>
              <span className="font-bold text-[#002620]">₹1.32 Lacs</span>
            </div>
            <div>
              <span className="text-[10px] text-[#404846] block">Individual EMI</span>
              <span className="font-bold text-[#006b57]">₹{individual.individualEmiInr}/mo</span>
            </div>
            <div>
              <span className="text-[10px] text-[#404846] block">Eligibility</span>
              <span className="font-bold text-[#ca962b]">&lt;20% units</span>
            </div>
          </div>
          <span className="text-[11px] text-[#404846]">
            ⚠️ Over 80% of urban apartment residents lack private unencumbered roof ownership, locking them out of rooftop solar completely without Solaris VNM.
          </span>
        </div>
      )}

      {/* Solver Boundary Parameters */}
      <div className="w-full rounded-xl bg-white p-4 shadow-sm border border-[#e2f0f9] flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#006b57] text-[20px]">tune</span>
            <h3 className="font-headline text-sm font-bold text-[#101d24]">Solver Boundary Parameters</h3>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-semibold text-[#006b57] hover:underline"
          >
            Reset
          </button>
        </div>

        {/* Roof Area Slider */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-baseline">
            <label className="text-xs font-semibold text-[#404846]">Usable Shadow-Free Roof</label>
            <div className="flex items-baseline gap-1">
              <span className="font-headline text-lg font-bold text-[#101d24]">
                {optimisationParams.roofAreaSqFt.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-[#717976]">sq.ft</span>
            </div>
          </div>
          <input
            type="range"
            min="800"
            max="2200"
            step="50"
            value={optimisationParams.roofAreaSqFt}
            onChange={(e) => handleRoofAreaChange(Number(e.target.value))}
            className="w-full accent-[#006b57] h-2 bg-[#dceaf4] rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[#717976] text-[11px] font-mono">
            <span>800 sq.ft</span>
            <span className="text-[#006b57] font-semibold">
              Max Cap: {Math.floor(optimisationParams.roofAreaSqFt / 95)} kWp potential
            </span>
            <span>2,200 sq.ft</span>
          </div>
        </div>

        {/* Capacity Selector Pills */}
        <div className="flex flex-col gap-1.5 pt-1">
          <div className="flex justify-between items-baseline">
            <span className="text-xs font-semibold text-[#404846]">System Sizing (Target kWp)</span>
            <span className="text-xs text-[#006b57] font-bold">
              {optimisationParams.targetCapacityKw} kWp Selected
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { kw: 10, label: 'Starter fit' },
              { kw: 12, label: 'Optimal Yield' },
              { kw: 15, label: 'High Cap' }
            ].map((item) => (
              <button
                key={item.kw}
                type="button"
                onClick={() => handleKwSelect(item.kw as any)}
                className={`py-2 px-1 text-center rounded-lg text-xs transition-all focus:outline-none focus:ring-2 focus:ring-[#9af4d8]/60 focus:ring-offset-2 ${
                  optimisationParams.targetCapacityKw === item.kw
                    ? 'bg-[#006b57] text-white shadow-sm font-bold'
                    : 'bg-[#e2f0f9] text-[#101d24] hover:bg-[#dceaf4]'
                }`}
              >
                <span className="block font-bold">{item.kw} kWp</span>
                <span className="text-[10px] opacity-80">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Parameter Guardrails */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <div className="p-3 rounded-lg bg-[#e8f6ff] flex flex-col gap-0.5 border border-[#d6e5ee]">
            <span className="text-[10px] text-[#717976]">Total Budget Ceiling</span>
            <span className="font-headline text-sm font-bold text-[#101d24]">
              ₹{optimisationParams.budgetCeilingInr.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-[#006b57] font-medium">MNRE Subsidy: -₹78,000</span>
          </div>

          <div className="p-3 rounded-lg bg-[#e8f6ff] flex flex-col gap-0.5 border border-[#d6e5ee]">
            <span className="text-[10px] text-[#717976]">Financing Terms</span>
            <span className="font-headline text-sm font-bold text-[#101d24]">
              {optimisationParams.financingRatePercentage}% p.a.
            </span>
            <span className="text-[10px] text-[#404846]">SBI Surya Ghar 5-yr</span>
          </div>
        </div>

        {/* Participant Budget Cap */}
        <div className="p-3 rounded-lg bg-[#e2f0f9] flex items-center justify-between border border-[#d6e5ee]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#006b57] text-[20px]">security</span>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[#101d24]">Participant budget ceiling</span>
              <span className="text-[10px] text-[#404846]">Self-reported upper bound · not a payment pledge</span>
            </div>
          </div>
          <span className="text-xs font-bold text-[#002620] bg-white px-2.5 py-1 rounded-md shadow-sm">
            ₹{optimisationParams.participantCapInr.toLocaleString('en-IN')}/mo max
          </span>
        </div>
      </div>

      {/* What-If Real-Time Stress Tests */}
      <div className="w-full rounded-xl bg-white p-4 shadow-sm border border-[#e2f0f9] flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#ca962b] text-[20px]">science</span>
            <div>
              <h3 className="font-headline text-sm font-bold text-[#101d24]">Stress-Testing Simulator</h3>
              <p className="text-[11px] text-[#717976]">Toggle contingencies to stress-test solvency</p>
            </div>
          </div>
        </div>

        {/* Stress Chips */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => toggleStressChip('monsoonDrop')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all focus:outline-none focus:ring-2 focus:ring-[#9af4d8]/60 focus:ring-offset-2 ${
              optimisationParams.stressFactors.monsoonDrop
                ? 'bg-[#ffdea7] text-[#271900] shadow-sm'
                : 'bg-[#e2f0f9] text-[#404846] hover:bg-[#dceaf4]'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">cloud</span>
            Monsoon Drop (-20%)
          </button>

          <button
            type="button"
            onClick={() => toggleStressChip('rateSpike')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all focus:outline-none focus:ring-2 focus:ring-[#9af4d8]/60 focus:ring-offset-2 ${
              optimisationParams.stressFactors.rateSpike
                ? 'bg-[#ffdea7] text-[#271900] shadow-sm'
                : 'bg-[#e2f0f9] text-[#404846] hover:bg-[#dceaf4]'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">percent</span>
            Rate Spike (+1.5%)
          </button>

          <button
            type="button"
            onClick={() => toggleStressChip('unitDropOut')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all focus:outline-none focus:ring-2 focus:ring-[#9af4d8]/60 focus:ring-offset-2 ${
              optimisationParams.stressFactors.unitDropOut
                ? 'bg-[#ffdea7] text-[#271900] shadow-sm'
                : 'bg-[#e2f0f9] text-[#404846] hover:bg-[#dceaf4]'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">person_remove</span>
            1 Unit Drops Out
          </button>

          <button
            type="button"
            onClick={() => toggleStressChip('subsidyDelay')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all focus:outline-none focus:ring-2 focus:ring-[#9af4d8]/60 focus:ring-offset-2 ${
              optimisationParams.stressFactors.subsidyDelay
                ? 'bg-[#ffdea7] text-[#271900] shadow-sm'
                : 'bg-[#e2f0f9] text-[#404846] hover:bg-[#dceaf4]'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">schedule</span>
            Subsidy Delay (6m)
          </button>
        </div>

        {/* Stress Result Indicator */}
        <div className="p-3 rounded-lg bg-[#e8f6ff] flex items-center justify-between border border-[#d6e5ee]">
          <div className="flex flex-col">
            <span className="text-[10px] text-[#717976]">Resilience Status</span>
            <span className="text-xs font-bold text-[#006b57] flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">verified_user</span>
              {optimisationResult.resilienceRating}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-[#717976]">Projected Worst Case</span>
            <span className="font-headline text-sm font-bold text-[#101d24] block">
              +₹{optimisationResult.worstCaseMonthlySavingsInr.toLocaleString('en-IN')}/mo
            </span>
          </div>
        </div>
      </div>

      {/* Mathematical Reasoning Drawer */}
      <div className="w-full rounded-xl bg-[#e8f6ff] p-4 flex flex-col gap-2.5 border border-[#d6e5ee]">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#006b57] text-[20px]">functions</span>
          <span className="font-headline text-xs font-bold text-[#002620]">
            Solver Logic &amp; DERC Verification
          </span>
        </div>
        <p className="text-xs text-[#404846] leading-relaxed">
          Linear program maximized the participation function <code className="font-mono bg-white px-1 py-0.5 rounded text-[#002620]">f(P)</code> while enforcing the strict inequality <code className="font-mono bg-white px-1 py-0.5 rounded text-[#002620]">EMI_i &lt; ΔBill_i</code> across all {community.totalEligibleFlats} flats.
        </p>

        <div className="flex flex-col gap-2 pt-1">
          <div className="flex items-start gap-2 bg-white p-2.5 rounded-lg shadow-sm border border-[#d6e5ee]">
            <span className="material-symbols-outlined text-[#006b57] text-[18px] mt-0.5">check_circle</span>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[#101d24]">Zero Out-Of-Pocket Threshold</span>
              <span className="text-[11px] text-[#404846]">
                Even lower-consumption 2BHK owners generate a minimum net savings of ₹420/month on current slab rates.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2 bg-white p-2.5 rounded-lg shadow-sm border border-[#d6e5ee]">
            <span className="material-symbols-outlined text-[#006b57] text-[18px] mt-0.5">check_circle</span>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[#101d24]">Group Net Metering Sanctioning</span>
              <span className="text-[11px] text-[#404846]">
                Fully adheres to BSES Rajdhani Power Limited (BRPL) virtual transformer capacity rules (&lt;80% kVA).
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Proposed Roof Layout Spec */}
      <div className="w-full rounded-xl bg-white p-4 shadow-sm border border-[#e2f0f9] flex flex-col gap-2.5">
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold text-[#101d24]">Proposed Roof Layout Spec</span>
          <span className="text-xs text-[#006b57] font-bold">Azimuth 180° South</span>
        </div>

        <div className="relative w-full h-36 rounded-lg overflow-hidden border border-[#c0c8c5]/30">
          <img 
            alt="Rooftop layout render" 
            className="w-full h-full object-cover" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCCphPNE2WOvoa3tOo53ABl0sFyH_Afag6S13EsAx30CKI8FMbSxUfsrHuW3BqoGkaiSUwno5MHoMO6AXc3_uWwQyiGUYRT6uKcQum8-sIHiz6hUX9jXCHACZLK35N24tZHJhIus9K_jXLjQT_xITAzmJFbbzEUh7mYMFhMgVpP4Hje0HdPhm9m7sYedcvY_bYwm4EiF1AR7-TmrhSu5P7zBZ0PonHX0wYunkuRGR9NYKG4-9535MX_bg"
          />
          <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded bg-[#103d35]/90 text-white text-[11px] font-medium backdrop-blur-md flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px] text-[#f6bd4f]">wb_sunny</span>
            36 Bifacial Mono-PERC Modules
          </div>
        </div>
      </div>

      {/* Action CTAs */}
      <div className="flex flex-col gap-2 pt-1">
        <button
          type="button"
          onClick={handleCommitShare}
          className="w-full py-3.5 px-4 rounded-xl bg-[#006b57] text-white font-headline text-sm font-semibold shadow-md hover:bg-[#002620] active:scale-[0.99] transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#9af4d8]/60 focus:ring-offset-2"
        >
          <span className="material-symbols-outlined text-[20px]">bookmark</span>
          {committedFeedback ? 'Power Share Committed! Redirecting...' : 'Save & Commit Power Share'}
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setIsExportOpen(true)}
            className="py-2.5 px-3 rounded-xl bg-[#e2f0f9] text-[#101d24] text-xs font-semibold hover:bg-[#dceaf4] transition-all flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#9af4d8]/60 focus:ring-offset-2"
          >
            <span className="material-symbols-outlined text-[18px] text-[#006b57]">picture_as_pdf</span>
            Feasibility PDF
          </button>
          
          <button
            type="button"
            onClick={() => setIsExportOpen(true)}
            className="py-2.5 px-3 rounded-xl bg-[#e2f0f9] text-[#101d24] text-xs font-semibold hover:bg-[#dceaf4] transition-all flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#9af4d8]/60 focus:ring-offset-2"
          >
            <span className="material-symbols-outlined text-[18px] text-[#006b57]">share</span>
            RWA Proposal
          </button>
        </div>
      </div>

      <ReportExportModal 
        isOpen={isExportOpen} 
        onClose={() => setIsExportOpen(false)} 
        defaultReportType="optimisation"
      />

    </div>
  );
};
