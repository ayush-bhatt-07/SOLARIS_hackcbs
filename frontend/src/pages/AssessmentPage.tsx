import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { calculateSolarFeasibility } from '../utils/solarCalculations';
import { ReportExportModal } from '../components/common/ReportExportModal';

export const AssessmentPage: React.FC = () => {
  const { currentUser, updateCurrentUser, navigateTo } = useApp();
  
  const [billAmount, setBillAmount] = useState<number>(currentUser.monthlyBillInr || 6850);
  const [terraceArea, setTerraceArea] = useState<number>(currentUser.terraceAreaSqFt || 650);
  const [sanctionedLoad, setSanctionedLoad] = useState<number>(currentUser.sanctionedLoadKw || 5.0);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Deterministic calculation result based on real-time inputs
  const calculation = calculateSolarFeasibility({
    monthlyBillInr: billAmount,
    terraceAreaSqFt: terraceArea,
    sanctionedLoadKw: sanctionedLoad,
    isResidential: currentUser.tariffCategory === 'Domestic'
  });

  const handleSliderChange = (newVal: number) => {
    setBillAmount(newVal);
    updateCurrentUser({ monthlyBillInr: newVal });
  };

  return (
    <div className="flex flex-col w-full pb-16 max-w-3xl mx-auto px-4 fade-in-soft">
      
      {/* Top Progress & Header */}
      <div className="pt-2 pb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#9af4d8]/50 text-[#006b57] text-[10px] font-bold uppercase tracking-wider">
            <span className="material-symbols-outlined text-[14px]">tune</span> Step 2 of 4 • Simulation Active
          </span>
          <span className="flex items-center gap-1 text-[#404846] text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#006b57]"></span> Modelled
          </span>
        </div>
        <h1 className="font-headline text-2xl sm:text-3xl text-[#002620] tracking-tight font-bold">
          Rooftop Solar Feasibility
        </h1>
        <p className="text-xs sm:text-sm text-[#404846] mt-0.5 leading-snug">
          Calculate solar potential, estimate savings under Delhi DISCOM tariffs, and evaluate community options.
        </p>
      </div>

      <div className="space-y-4">
        
        {/* Calculator Deck Card */}
        <div className="bg-white rounded-xl shadow-sm border border-[#e2f0f9] p-4 flex flex-col gap-4">
          
          {/* Bill Slider */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#404846] flex items-center gap-1.5" htmlFor="bill-range">
                <span className="material-symbols-outlined text-[18px] text-[#006b57]">receipt_long</span>
                Monthly Electricity Bill
              </label>
              <span className="text-[11px] font-bold text-[#006b57] bg-[#9af4d8]/40 px-2 py-0.5 rounded-full font-mono">
                ~{calculation.monthlyConsumptionKwh} kWh / mo
              </span>
            </div>

            <div className="flex items-baseline justify-between bg-[#e8f6ff] px-3.5 py-2 rounded-lg border border-[#d6e5ee]">
              <div className="flex items-baseline gap-1">
                <span className="font-headline text-2xl text-[#002620] font-bold tracking-tight">
                  ₹{billAmount.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-[#404846]">/month</span>
              </div>
              <span className="text-[11px] text-[#404846]">Avg. Delhi LT-1</span>
            </div>

            <input
              id="bill-range"
              type="range"
              min="1500"
              max="25000"
              step="250"
              value={billAmount}
              onChange={(e) => handleSliderChange(Number(e.target.value))}
              className="w-full accent-[#006b57] cursor-pointer h-2 bg-[#dceaf4] rounded-lg appearance-none"
            />
            <div className="flex justify-between text-[11px] text-[#404846] px-1 font-mono">
              <span>₹1,500</span>
              <span>₹10,000</span>
              <span>₹25,000+</span>
            </div>
          </div>

          {/* Quick Parameter Grid */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div className="bg-[#e8f6ff] p-2.5 rounded-lg flex flex-col justify-between border border-[#d6e5ee]">
              <span className="text-[11px] text-[#404846]">DISCOM Provider</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="material-symbols-outlined text-[18px] text-[#006b57]">power</span>
                <span className="font-headline text-sm font-semibold text-[#002620] leading-tight">
                  {currentUser.discom}
                </span>
              </div>
              <span className="text-[10px] text-[#404846] mt-0.5 truncate">BSES Domestic LT-1</span>
            </div>

            <div className="bg-[#e8f6ff] p-2.5 rounded-lg flex flex-col justify-between border border-[#d6e5ee]">
              <span className="text-[11px] text-[#404846]">Sanctioned Load</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="material-symbols-outlined text-[18px] text-[#006b57]">speed</span>
                <span className="font-headline text-sm font-semibold text-[#002620] leading-tight">
                  {sanctionedLoad.toFixed(1)} kW
                </span>
              </div>
              <span className="text-[10px] text-[#006b57] mt-0.5 font-medium">Optimal headroom</span>
            </div>

            <div className="bg-[#e8f6ff] p-2.5 rounded-lg flex flex-col justify-between border border-[#d6e5ee]">
              <span className="text-[11px] text-[#404846]">Terrace Area</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="material-symbols-outlined text-[18px] text-[#006b57]">domain</span>
                <span className="font-headline text-sm font-semibold text-[#002620] leading-tight">
                  {terraceArea} sq.ft
                </span>
              </div>
              <span className="text-[10px] text-[#404846] mt-0.5 truncate">Flat RCC, South tilt</span>
            </div>

            <div className="bg-[#e8f6ff] p-2.5 rounded-lg flex flex-col justify-between border border-[#d6e5ee]">
              <span className="text-[11px] text-[#404846]">Roof Rights</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="material-symbols-outlined text-[18px] text-[#006b57]">verified_user</span>
                <span className="font-headline text-sm font-semibold text-[#002620] leading-tight">
                  Verified
                </span>
              </div>
              <span className="text-[10px] text-[#006b57] mt-0.5 font-medium">Self-owned / NOC</span>
            </div>
          </div>

          {/* Upfront Budget Ceiling */}
          <div className="bg-[#9af4d8]/30 p-3 rounded-lg flex items-center justify-between border border-[#9af4d8]/60">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#006b57] text-[22px]">account_balance</span>
              <div>
                <div className="text-xs font-bold text-[#002620]">Upfront Budget Ceiling: ₹1,50,000</div>
                <div className="text-[11px] text-[#404846]">Eligible for PM Surya Ghar Subsidy</div>
              </div>
            </div>
            <span className="material-symbols-outlined text-[#006b57] text-[18px]">check_circle</span>
          </div>
        </div>

        {/* Recommended System Hero Tile */}
        <div className="bg-[#103d35] text-white rounded-xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#f6bd4f] text-[20px]">wb_sunny</span>
              <span className="text-xs font-bold uppercase tracking-wider text-[#9af4d8]">
                Solar Feasibility Summary
              </span>
            </div>
            <span className="bg-[#9af4d8] text-[#002019] text-[10px] px-2 py-0.5 rounded-full font-bold">
              OPTIMAL
            </span>
          </div>

          <div className="flex items-baseline justify-between mb-3">
            <div>
              <span className="text-[11px] text-[#7ca89d] block">Recommended Capacity</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-headline text-3xl font-bold tracking-tight text-white">
                  {calculation.recommendedCapacityKw}
                </span>
                <span className="text-sm font-semibold text-[#9af4d8]">kWp</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-[#7ca89d] block">Est. Annual Generation</span>
              <div className="flex items-baseline justify-end gap-1 mt-0.5">
                <span className="font-headline text-2xl font-bold text-white font-mono">
                  {calculation.estAnnualGenerationKwh.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-[#9af4d8]">kWh/yr</span>
              </div>
            </div>
          </div>

          {/* Financial Matrix */}
          <div className="grid grid-cols-2 gap-2 bg-[#002620]/60 p-3 rounded-lg mb-3 border border-white/5">
            <div>
              <span className="text-[10px] text-[#7ca89d] block">Net Cost (After Subsidy)</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-headline text-lg font-bold text-[#f6bd4f]">
                  ₹{calculation.netInstallationCostInr.toLocaleString('en-IN')}
                </span>
              </div>
              <span className="text-[10px] text-[#7ca89d] line-through">
                ₹{calculation.grossInstallationCostInr.toLocaleString('en-IN')} Gross
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#7ca89d] block">Payback Horizon</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-headline text-lg font-bold text-white">
                  {calculation.paybackYears}
                </span>
                <span className="text-xs text-[#9af4d8]">Years</span>
              </div>
              <span className="text-[10px] text-[#9af4d8]">ROI ~{calculation.annualRoiPercentage}% p.a.</span>
            </div>
          </div>

          {/* Terrace Utilisation & Monthly Savings */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-[#a3d0c4]">
              <span>Terrace Space Utilisation</span>
              <span className="text-white font-semibold">
                {calculation.roofSpaceUtilisationPercentage}% ({calculation.roofAreaRequiredSqFt} of {terraceArea} sq.ft)
              </span>
            </div>
            <div className="w-full bg-[#002620] h-2 rounded-full overflow-hidden flex">
              <div 
                className="bg-[#7ed7bd] h-full rounded-full transition-all duration-500" 
                style={{ width: `${calculation.roofSpaceUtilisationPercentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#a3d0c4] pt-0.5">
              <span>Projected Monthly Bill Savings:</span>
              <span className="text-[#ffdea7] font-bold">
                ₹{(calculation.monthlySavingsInr - 400).toLocaleString('en-IN')} – ₹{calculation.monthlySavingsInr.toLocaleString('en-IN')} / mo
              </span>
            </div>
          </div>
        </div>

        {/* Comparative Solar Models Section */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <h2 className="font-headline text-base text-[#002620] font-bold tracking-tight">
              Financing &amp; Model Matrix
            </h2>
            <span className="text-xs text-[#404846] font-medium">3 Models Screened</span>
          </div>

          {/* Model 1: CAPEX */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-[#e2f0f9]">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#006b57]/10 flex items-center justify-center text-[#006b57]">
                  <span className="material-symbols-outlined text-[20px]">solar_power</span>
                </div>
                <div>
                  <h3 className="font-headline text-xs sm:text-sm font-semibold text-[#002620]">
                    1. Individual Rooftop CAPEX
                  </h3>
                  <p className="text-[11px] text-[#404846]">Full plant ownership • Max yield</p>
                </div>
              </div>
              <span className="bg-[#9af4d8] text-[#00725d] text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                HIGHEST ROI
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 py-2 bg-[#e8f6ff] rounded-lg text-center">
              <div>
                <span className="text-[10px] text-[#404846] block">Upfront Net</span>
                <span className="font-headline text-sm font-bold text-[#002620]">
                  ₹{(calculation.netInstallationCostInr / 100000).toFixed(2)}L
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#404846] block">Monthly Gain</span>
                <span className="font-headline text-sm font-bold text-[#006b57]">
                  ₹{calculation.monthlySavingsInr.toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#404846] block">Lifetime (25y)</span>
                <span className="font-headline text-sm font-bold text-[#002620]">
                  ₹{(calculation.monthlySavingsInr * 12 * 25 / 100000).toFixed(1)}L
                </span>
              </div>
            </div>
            <div className="mt-2.5 flex items-center justify-between text-xs text-[#404846]">
              <span className="flex items-center gap-1 text-[#006b57] font-semibold">
                <span className="material-symbols-outlined text-[16px]">check</span> PM Surya Ghar Subsidy: ₹{calculation.subsidyInr.toLocaleString('en-IN')}
              </span>
              <span className="font-mono text-[11px]">BRPL Net-Meter</span>
            </div>
          </div>

          {/* Model 2: RESCO */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-[#e2f0f9]">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#e2f0f9] flex items-center justify-center text-[#404846]">
                  <span className="material-symbols-outlined text-[20px]">handshake</span>
                </div>
                <div>
                  <h3 className="font-headline text-xs sm:text-sm font-semibold text-[#002620]">
                    2. RESCO / Developer Model
                  </h3>
                  <p className="text-[11px] text-[#404846]">Zero upfront cost • Pay per unit</p>
                </div>
              </div>
              <span className="bg-[#e2f0f9] text-[#404846] text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                NO CAPEX
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 py-2 bg-[#e8f6ff] rounded-lg text-center">
              <div>
                <span className="text-[10px] text-[#404846] block">Upfront Net</span>
                <span className="font-headline text-sm font-bold text-[#002620]">₹0</span>
              </div>
              <div>
                <span className="text-[10px] text-[#404846] block">Solar Tariff</span>
                <span className="font-headline text-sm font-bold text-[#002620]">₹4.50/kWh</span>
              </div>
              <div>
                <span className="text-[10px] text-[#404846] block">Savings / mo</span>
                <span className="font-headline text-sm font-bold text-[#006b57]">₹1,850</span>
              </div>
            </div>
            <div className="mt-2.5 flex items-center justify-between text-xs text-[#404846]">
              <span>Third-party maintains plant for 25 yrs</span>
              <span className="font-mono text-[11px]">PPA Locked</span>
            </div>
          </div>

          {/* Model 3: VNM */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-[#e2f0f9]">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#ffdea7]/60 flex items-center justify-center text-[#271900]">
                  <span className="material-symbols-outlined text-[20px]">groups</span>
                </div>
                <div>
                  <h3 className="font-headline text-xs sm:text-sm font-semibold text-[#002620]">
                    3. Virtual Net Metering (VNM)
                  </h3>
                  <p className="text-[11px] text-[#404846]">Shared terrace • Co-op distribution</p>
                </div>
              </div>
              <span className="bg-[#ffdea7] text-[#271900] text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                MULTI-UNIT
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 py-2 bg-[#e8f6ff] rounded-lg text-center">
              <div>
                <span className="text-[10px] text-[#404846] block">Your Share</span>
                <span className="font-headline text-sm font-bold text-[#002620]">1.5 kWp</span>
              </div>
              <div>
                <span className="text-[10px] text-[#404846] block">Net Outlay</span>
                <span className="font-headline text-sm font-bold text-[#002620]">₹48,000</span>
              </div>
              <div>
                <span className="text-[10px] text-[#404846] block">Pro-rata Sav.</span>
                <span className="font-headline text-sm font-bold text-[#006b57]">₹1,750</span>
              </div>
            </div>
            <div className="mt-2.5 flex items-center justify-between text-xs text-[#404846]">
              <span className="text-[#006b57] font-semibold">DERC Group Net Metering Guideline 2024</span>
              <span className="font-mono text-[11px]">11 Flats Joined</span>
            </div>
          </div>
        </div>

        {/* Data Confidence & Statutory Compliance Note */}
        <div className="bg-[#e8f6ff] rounded-xl p-3.5 space-y-2.5 border border-[#d6e5ee]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#006b57] text-[18px]">query_stats</span>
              <span className="text-xs font-bold text-[#002620]">Simulation Confidence</span>
            </div>
            <span className="bg-[#9af4d8] text-[#006b57] text-[10px] px-2 py-0.5 rounded-full font-bold">
              92% Precision
            </span>
          </div>
          <p className="text-xs text-[#404846] leading-relaxed">
            Calculated using high-resolution solar irradiance databases for Delhi NCR (Lat 28.61° N) and current DERC Tariff Order FY 2024-25.
          </p>
          <div className="p-2.5 bg-white rounded-lg flex items-start gap-2 border border-[#d6e5ee]">
            <span className="material-symbols-outlined text-[#717976] text-[16px] mt-0.5 shrink-0">info</span>
            <p className="text-[11px] text-[#404846] leading-tight">
              <strong>Statutory Compliance Note:</strong> Estimated savings are analytical projections, not guaranteed yields. Actual output varies with seasonal cloud cover, panel inclination, ambient dust, and bi-directional meter calibration by BSES Rajdhani.
            </p>
          </div>
        </div>

        {/* Actions Deck */}
        <div className="pt-2 space-y-2.5">
          <button
            onClick={() => navigateTo('/regulations')}
            className="w-full h-12 bg-[#006b57] text-white rounded-lg font-headline text-sm font-semibold flex items-center justify-center gap-2 shadow-md hover:bg-[#002620] active:scale-[0.99] transition-all"
          >
            <span>Proceed to Regulatory Check</span>
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </button>
          
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="w-full h-11 bg-white text-[#002620] border border-[#e2f0f9] rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-sm hover:bg-[#f4faff] transition-colors"
          >
            <span className="material-symbols-outlined text-[18px] text-[#006b57]">download</span>
            <span>Download Feasibility Report (.PDF)</span>
          </button>
        </div>

      </div>

      <ReportExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        defaultReportType="feasibility"
      />

    </div>
  );
};
