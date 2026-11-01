import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const OnboardingPage: React.FC = () => {
  const { currentUser, updateCurrentUser, navigateTo, addAuditLog } = useApp();

  const [discom, setDiscom] = useState<'BRPL' | 'BYPL' | 'TPDDL'>(currentUser.discom || 'BRPL');
  const [caNumber, setCaNumber] = useState(currentUser.consumerNumber || '102948192');
  const [isVerified, setIsVerified] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [monthlyBill, setMonthlyBill] = useState(currentUser.monthlyBillInr || 6850);
  const [housingType, setHousingType] = useState<'Apartment' | 'Independent' | 'MSME'>(currentUser.housingType || 'Apartment');
  const [terraceAccess, setTerraceAccess] = useState<'Shared' | 'Private'>(currentUser.terraceAccess || 'Shared');
  const [solarGoal, setSolarGoal] = useState<'vnm' | 'capex' | 'resco'>(currentUser.primaryGoal || 'vnm');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVerifyCA = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setIsVerified(true);
      addAuditLog('DISCOM CA Validated', `CA #${caNumber} verified on ${discom} Delhi grid ledger.`, 'regulatory');
    }, 600);
  };

  const handleContinue = () => {
    setIsSubmitting(true);
    // Estimated consumption based on bill
    const estKwh = Math.round(monthlyBill / 9.2);
    updateCurrentUser({
      discom,
      consumerNumber: caNumber,
      monthlyBillInr: monthlyBill,
      monthlyConsumptionKwh: estKwh,
      housingType,
      terraceAccess,
      primaryGoal: solarGoal,
      onboardingCompleted: true,
      needsOnboarding: false
    });
    addAuditLog('Onboarding Completed', `Profile configured for CA #${caNumber} with ₹${monthlyBill}/mo bill.`, 'system');

    setTimeout(() => {
      setIsSubmitting(false);
      navigateTo('/dashboard');
    }, 400);
  };

  return (
    <div className="flex flex-col w-full pb-16 max-w-2xl mx-auto px-4 fade-in-soft">
      
      {/* Top Command & Status Bar */}
      <div className="pt-2 pb-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigateTo('/dashboard')}
              aria-label="Go Back"
              className="w-8 h-8 rounded-full bg-[#e2f0f9] flex items-center justify-center text-[#101d24] hover:bg-[#dceaf4] active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#9af4d8]/60 focus:ring-offset-2"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            </button>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[#006b57] text-[18px]">wb_sunny</span>
                <span className="font-headline text-sm font-bold text-[#002620] tracking-tight">SOLARIS</span>
              </div>
              <span className="text-[10px] text-[#404846] font-medium">Together We Shine Brighter</span>
            </div>
          </div>
<button
            type="button"
            onClick={() => navigateTo('/dashboard')}
            className="px-3 py-1 rounded-full bg-white text-[#006b57] text-xs font-semibold shadow-sm border border-[#e2f0f9] hover:bg-[#f4faff] focus:outline-none focus:ring-2 focus:ring-[#9af4d8]/60 focus:ring-offset-2"
          >
            Save & Exit
          </button>
        </div>

        {/* Stepper Tracker */}
        <div className="bg-white p-3 rounded-xl shadow-sm border border-[#e2f0f9] flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#101d24]">Step 2 of 5 · Location &amp; Profile</span>
            <span className="text-xs font-bold text-[#006b57]">40% Completed</span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#e2f0f9] overflow-hidden">
            <div className="h-full bg-[#006b57] rounded-full transition-all duration-500" style={{ width: '40%' }}></div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        
        {/* Welcome Motivational Banner */}
        <div className="relative overflow-hidden rounded-xl bg-[#103d35] p-4 text-white shadow-md">
          <div className="relative z-10 flex flex-col gap-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#006b57] text-white text-[10px] font-semibold uppercase tracking-wider self-start">
              <span className="material-symbols-outlined text-[14px]">bolt</span> Delhi VNM Sandbox
            </div>
            <h1 className="font-headline text-lg sm:text-xl font-bold">Welcome to Solaris</h1>
            <p className="text-xs text-[#7ca89d] leading-relaxed">
              Let's configure your solar transition profile using your real power DISCOM ledger to unlock accurate generation credits.
            </p>
          </div>
          <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-[#006b57]/20 blur-xl pointer-events-none"></div>
        </div>

        {/* Role Summary Ribbon */}
        <div className="rounded-xl bg-white p-3 shadow-sm border border-[#e2f0f9] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#9af4d8] flex items-center justify-center text-[#00725d]">
              <span className="material-symbols-outlined text-[20px]">apartment</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] text-[#404846] font-medium">Selected Role</span>
              <span className="text-xs font-semibold text-[#101d24]">{currentUser.roleTitle}</span>
            </div>
          </div>
        </div>

        {/* DISCOM Connection Card */}
        <div className="rounded-xl bg-white p-4 shadow-sm border border-[#e2f0f9] flex flex-col gap-3.5">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#006b57] text-[20px]">electrical_services</span>
              <h2 className="font-headline text-sm font-semibold text-[#101d24]">Provider &amp; DISCOM Connection</h2>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-[#ffdea7] text-[#271900] text-[10px] font-bold uppercase tracking-wide">
              Delhi NCR
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-[#404846]">Power Distribution Utility (DISCOM)</label>
            <div className="grid grid-cols-1 gap-2">
              {[
                { id: 'BRPL', name: 'BSES Rajdhani Power Limited (BRPL)', zone: 'South & West Delhi Grid' },
                { id: 'BYPL', name: 'BSES Yamuna Power Limited (BYPL)', zone: 'Central & East Delhi Grid' },
                { id: 'TPDDL', name: 'Tata Power Delhi Distribution (TPDDL)', zone: 'North & Northwest Delhi' }
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setDiscom(opt.id as any)}
                  className={`relative flex items-center justify-between p-3 rounded-lg border w-full text-left transition-all focus:outline-none focus:ring-2 focus:ring-[#9af4d8]/60 focus:ring-offset-2 ${
                    discom === opt.id 
                      ? 'bg-[#e8f6ff] border-[#006b57]' 
                      : 'bg-white border-[#e2f0f9] hover:bg-[#f4faff]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                      discom === opt.id ? 'border-[#006b57] bg-[#006b57]' : 'border-[#c0c8c5]'
                    }`}>
                      {discom === opt.id && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-[#101d24]">{opt.name}</span>
                      <span className="text-[11px] text-[#404846]">{opt.zone}</span>
                    </div>
                  </div>
                  {discom === opt.id && (
                    <span className="material-symbols-outlined text-[#006b57] text-[20px]">check_circle</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* CA Input & Verification */}
          <div className="flex flex-col gap-1.5 pt-1">
            <label className="text-xs font-medium text-[#404846]" htmlFor="ca-input">
              Consumer Account (CA) Number
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  id="ca-input"
                  type="text"
                  value={caNumber}
                  onChange={(e) => {
                    setCaNumber(e.target.value);
                    setIsVerified(false);
                  }}
                  placeholder="10-digit CA Number"
                  className="w-full h-11 px-3.5 bg-[#e8f6ff] rounded-lg font-mono text-sm text-[#101d24] font-semibold border border-[#d6e5ee] focus:outline-none focus:border-[#006b57]"
                />
                {isVerified && (
                  <span className="absolute right-3 top-2.5 material-symbols-outlined text-[#006b57] text-[20px]">
                    verified
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleVerifyCA}
                disabled={isVerifying}
                className={`h-11 px-4 rounded-lg font-headline text-xs font-semibold tracking-wide flex items-center gap-1 active:scale-95 shrink-0 transition-colors focus:outline-none focus:ring-2 focus:ring-[#9af4d8]/60 focus:ring-offset-2 ${
                  isVerified 
                    ? 'bg-[#103d35] text-white' 
                    : 'bg-[#006b57] text-white hover:bg-[#002620]'
                }`}
              >
                {isVerifying ? (
                  <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>
                ) : isVerified ? (
                  <>
                    <span>Verified</span>
                    <span className="material-symbols-outlined text-[16px]">check</span>
                  </>
                ) : (
                  <span>Verify CA</span>
                )}
              </button>
            </div>

            {isVerified && (
              <div className="mt-1 p-2.5 rounded-lg bg-[#e8f6ff] flex items-center gap-2 border border-[#d6e5ee]">
                <span className="material-symbols-outlined text-[#006b57] text-[18px]">task_alt</span>
                <div className="flex-1 flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#101d24]">Verified LT-1 Domestic Consumer</span>
                  <span className="text-[#006b57] font-bold">Sanctioned: 5.0 kW</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Monthly Consumption Profile */}
        <div className="rounded-xl bg-white p-4 shadow-sm border border-[#e2f0f9] flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#006b57] text-[20px]">equalizer</span>
              <h2 className="font-headline text-sm font-semibold text-[#101d24]">Monthly Consumption Profile</h2>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-[#9af4d8] text-[#00725d] text-[10px] font-bold">
              Auto-Synced
            </span>
          </div>

          <div className="bg-[#e8f6ff] p-3.5 rounded-xl flex flex-col gap-2 border border-[#d6e5ee]">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-[#404846] font-medium">Average Monthly Power Bill</span>
              <div className="flex items-baseline gap-1">
                <span className="font-headline text-2xl text-[#002620] font-bold">
                  ₹{monthlyBill.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-[#404846] font-medium">/month</span>
              </div>
            </div>

            <div className="py-2">
              <input
                type="range"
                min="1500"
                max="25000"
                step="250"
                value={monthlyBill}
                onChange={(e) => setMonthlyBill(Number(e.target.value))}
                className="w-full h-2 bg-[#dceaf4] rounded-lg appearance-none cursor-pointer accent-[#006b57]"
              />
            </div>

            <div className="flex items-center justify-between text-[#404846] text-xs font-mono">
              <span>₹1,500</span>
              <span className="text-[#006b57] font-bold">Est. {Math.round(monthlyBill / 9.2)} kWh / mo</span>
              <span>₹25,000+</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-lg bg-[#e8f6ff] flex flex-col">
              <span className="text-[11px] text-[#404846]">Connected Sanctioned Load</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-headline text-lg font-bold text-[#101d24]">5.0</span>
                <span className="text-xs text-[#404846] font-semibold">kW</span>
              </div>
              <span className="text-[11px] text-[#006b57] font-medium mt-0.5">Matched from DISCOM</span>
            </div>
            <div className="p-3 rounded-lg bg-[#e8f6ff] flex flex-col">
              <span className="text-[11px] text-[#404846]">Applicable Tariff Tier</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-headline text-lg font-bold text-[#101d24]">Domestic</span>
              </div>
              <span className="text-[11px] text-[#00725d] font-medium mt-0.5">Govt Subsidy: Active</span>
            </div>
          </div>
        </div>

        {/* Rooftop & Society Feasibility */}
        <div className="rounded-xl bg-white p-4 shadow-sm border border-[#e2f0f9] flex flex-col gap-3.5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#006b57] text-[20px]">roofing</span>
            <h2 className="font-headline text-sm font-semibold text-[#101d24]">Rooftop &amp; Society Feasibility</h2>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#404846]">Housing Architecture</label>
            <div className="p-1 rounded-xl bg-[#e2f0f9] flex gap-1">
              {[
                { id: 'Independent', label: 'Independent' },
                { id: 'Apartment', label: 'Apartment / CGHS' },
                { id: 'MSME', label: 'MSME Villa' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setHousingType(opt.id as any)}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-[#9af4d8]/60 focus:ring-offset-2 ${
                    housingType === opt.id
                      ? 'bg-white text-[#002620] shadow-sm'
                      : 'text-[#404846] hover:text-[#002620]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#404846]">Terrace Access Rights</label>
            <div className="grid grid-cols-1 gap-2">
              <label className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer ${
                terraceAccess === 'Shared' ? 'bg-[#e8f6ff] border-[#006b57]' : 'bg-white border-[#e2f0f9]'
              }`}>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="terrace"
                    value="Shared"
                    checked={terraceAccess === 'Shared'}
                    onChange={() => setTerraceAccess('Shared')}
                    className="accent-[#006b57] focus:outline-none focus:ring-2 focus:ring-[#9af4d8]/60 focus:ring-offset-2"
                  />
                  <span className="text-xs font-medium text-[#101d24]">Shared Common Terrace (RWA Co-owned)</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#9af4d8] text-[#00725d] text-[10px] font-bold">
                  VNM Eligible
                </span>
              </label>

              <label className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer ${
                terraceAccess === 'Private' ? 'bg-[#e8f6ff] border-[#006b57]' : 'bg-white border-[#e2f0f9]'
              }`}>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="terrace"
                    value="Private"
                    checked={terraceAccess === 'Private'}
                    onChange={() => setTerraceAccess('Private')}
                    className="accent-[#006b57] focus:outline-none focus:ring-2 focus:ring-[#9af4d8]/60 focus:ring-offset-2"
                  />
                  <span className="text-xs font-medium text-[#101d24]">Private Exclusive Terrace Roof Rights</span>
                </div>
                <span className="text-xs text-[#404846] font-medium">Standard Net Meter</span>
              </label>
            </div>
          </div>

          {/* Satellite Visual View */}
          <div className="relative w-full h-36 rounded-xl overflow-hidden shadow-inner border border-[#c0c8c5]/30">
            <img 
              alt="Satellite map view" 
              className="w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDzXFtpV251t5TfQJD4K7rvKswP3vtsRqfw2D9R3pIEVHVzBGx0wR6HRgq-LedHLFvZgEORrk8x_tu45mfqjIiRwGYJ1jshcLBjrY0UOMbQ8XJDeAgVOwM7vATeHt1-nxt-bTbaFoW0nJ7UT7N4f6exEKNYsCxKXzliVd9MxgBzp6ONahYd754_Ne11alAlfB_0H0qZaj9mjQzn2Y4IWsX9p7H0su7_ohSCxkT1XeBWr8zuX20c3Lyogg"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#002620]/80 via-[#002620]/30 to-transparent flex flex-col justify-end p-3 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#f6bd4f] text-[18px]">solar_power</span>
                  <span className="text-xs font-semibold">Simulated Solar Yield: 1,420 kWh/kWp/yr</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/30 backdrop-blur-md">
                  GIS High Precision
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Primary Solar Goal Selection */}
        <div className="rounded-xl bg-white p-4 shadow-sm border border-[#e2f0f9] flex flex-col gap-3">
          <div>
            <h2 className="font-headline text-sm font-semibold text-[#101d24]">Select Your Primary Solar Goal</h2>
            <p className="text-xs text-[#404846]">Choose how you wish to monetize or offset your monthly electricity bills.</p>
          </div>

          <div className="space-y-2.5">
            {/* Goal 1: VNM */}
            <button
              type="button"
              onClick={() => setSolarGoal('vnm')}
              className={`w-full p-3.5 rounded-xl border text-left transition-all focus:outline-none focus:ring-2 focus:ring-[#9af4d8]/60 focus:ring-offset-2 ${
                solarGoal === 'vnm' 
                  ? 'bg-[#e8f6ff] border-[#006b57] shadow-sm'
                  : 'bg-white border-[#e2f0f9] hover:bg-[#f4faff]'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  solarGoal === 'vnm' ? 'bg-[#006b57] text-white' : 'bg-[#e2f0f9] text-[#006b57]'
                }`}>
                  <span className="material-symbols-outlined text-[20px]">groups</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-headline text-sm font-bold text-[#002620]">Join Community Solar (VNM)</span>
                    {solarGoal === 'vnm' && (
                      <span className="w-5 h-5 rounded-full bg-[#006b57] text-white flex items-center justify-center">
                        <span className="material-symbols-outlined text-[14px]">check</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#404846] mt-1 leading-snug">
                    Lower upfront cost, pool society roof with flat owners, zero maintenance headaches. Credits directly routed to your individual CA ledger.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-[#9af4d8] text-[#00725d] text-[10px] font-bold">
                      Zero Structural Modification
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#e2f0f9] text-[#404846] text-[10px] font-semibold">
                      Readiness check
                    </span>
                  </div>
                </div>
              </div>
            </button>

            {/* Goal 2: CAPEX */}
            <button
              type="button"
              onClick={() => setSolarGoal('capex')}
              className={`w-full p-3.5 rounded-xl border text-left transition-all focus:outline-none focus:ring-2 focus:ring-[#9af4d8]/60 focus:ring-offset-2 ${
                solarGoal === 'capex' 
                  ? 'bg-[#e8f6ff] border-[#006b57] shadow-sm'
                  : 'bg-white border-[#e2f0f9] hover:bg-[#f4faff]'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  solarGoal === 'capex' ? 'bg-[#006b57] text-white' : 'bg-[#e2f0f9] text-[#006b57]'
                }`}>
                  <span className="material-symbols-outlined text-[20px]">savings</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-headline text-sm font-semibold text-[#101d24]">Maximize Private Bill Savings</span>
                    {solarGoal === 'capex' && (
                      <span className="w-5 h-5 rounded-full bg-[#006b57] text-white flex items-center justify-center">
                        <span className="material-symbols-outlined text-[14px]">check</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#404846] mt-1 leading-snug">
                    100% individual rooftop ownership via PM Surya Ghar: Muft Bijli Yojana capital subsidies up to ₹78,000.
                  </p>
                </div>
              </div>
            </button>

            {/* Goal 3: RESCO */}
            <button
              type="button"
              onClick={() => setSolarGoal('resco')}
              className={`w-full p-3.5 rounded-xl border text-left transition-all focus:outline-none focus:ring-2 focus:ring-[#9af4d8]/60 focus:ring-offset-2 ${
                solarGoal === 'resco' 
                  ? 'bg-[#e8f6ff] border-[#006b57] shadow-sm' 
                  : 'bg-white border-[#e2f0f9] hover:bg-[#f4faff]'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  solarGoal === 'resco' ? 'bg-[#006b57] text-white' : 'bg-[#e2f0f9] text-[#006b57]'
                }`}>
                  <span className="material-symbols-outlined text-[20px]">handshake</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-headline text-sm font-semibold text-[#101d24]">Zero-Upfront RESCO Model</span>
                    {solarGoal === 'resco' && (
                      <span className="w-5 h-5 rounded-full bg-[#006b57] text-white flex items-center justify-center">
                        <span className="material-symbols-outlined text-[14px]">check</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#404846] mt-1 leading-snug">
                    Third-party developer sets up plant at no cost. You purchase solar power at 30% below grid tariff.
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Submit Deck */}
        <div className="sticky bottom-2 z-30 pt-2 flex flex-col gap-2">
          <div className="rounded-xl bg-white/95 backdrop-blur-md p-3.5 shadow-xl border border-[#c0c8c5]/40 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={handleContinue}
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-xl bg-[#006b57] text-white font-headline text-sm font-bold shadow-md hover:bg-[#002620] transition-all flex items-center justify-center gap-2 active:scale-98 focus:outline-none focus:ring-2 focus:ring-[#9af4d8]/60 focus:ring-offset-2"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                  <span>Running GIS Solar Yield Analysis...</span>
                </>
              ) : (
                <>
                  <span>Continue to Solar Feasibility Assessment</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </>
              )}
            </button>
          </div>

          <div className="px-2 flex items-start gap-2 text-[#404846]">
            <span className="material-symbols-outlined text-[16px] text-[#006b57] shrink-0 mt-0.5">lock</span>
            <p className="text-[11px] leading-tight">
              Your electricity connection data is encrypted and used strictly for solar planning simulations in compliance with DERC Virtual Net Metering (VNM) regulations.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
