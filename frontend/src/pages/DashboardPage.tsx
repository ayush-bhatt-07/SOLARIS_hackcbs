import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

const RING_RADIUS = 26;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const PositionRing: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <div className="relative h-20 w-20 shrink-0">
    <svg viewBox="0 0 64 64" className="h-20 w-20 -rotate-90" aria-hidden="true">
      <circle cx="32" cy="32" r={RING_RADIUS} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="6" />
      <circle
        cx="32"
        cy="32"
        r={RING_RADIUS}
        fill="none"
        stroke="#9af4d8"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={`${(RING_CIRCUMFERENCE * value) / 100} ${RING_CIRCUMFERENCE}`}
      />
    </svg>
    <div className="absolute inset-0 flex flex-col items-center justify-center">
      <span className="font-headline text-lg font-bold leading-none">{value}%</span>
      <span className="mt-0.5 text-[7px] font-bold uppercase tracking-[0.12em] text-[#9af4d8]">{label}</span>
    </div>
  </div>
);

const MiniStat: React.FC<{ icon: string; value: string; label: string }> = ({ icon, value, label }) => (
  <div className="rounded-xl border border-white/10 bg-white/[0.07] p-2.5">
    <span className="material-symbols-outlined text-[16px] text-[#9af4d8]" aria-hidden="true">
      {icon}
    </span>
    <span className="font-headline mt-1 block text-sm font-bold leading-none">{value}</span>
    <span className="mt-1 block text-[9px] font-medium uppercase tracking-[0.1em] text-[#a3d0c4]">{label}</span>
  </div>
);

const PlanBar: React.FC<{
  label: string;
  value: number;
  max: number;
  tone: string;
  selected?: boolean;
}> = ({ label, value, max, tone, selected = false }) => (
  <div>
    <div className="flex items-center justify-between text-[10px]">
      <span className={selected ? 'font-bold text-[#002620]' : 'text-[#404846]'}>{label}</span>
      <span className="font-mono font-semibold text-[#002620]">₹{value}</span>
    </div>
    <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#e2f0f9]">
      <div
        className={`h-full rounded-full ${tone}`}
        style={{ width: `${Math.min(100, Math.round((value / max) * 100))}%` }}
      />
    </div>
  </div>
);

const JOURNEY = [
  { code: 'F01', label: 'Join', icon: 'groups', state: 'done' },
  { code: 'F02', label: 'Readiness', icon: 'gavel', state: 'verify' },
  { code: 'F03', label: 'Inputs', icon: 'fact_check', state: 'done' },
  { code: 'F04', label: 'Feasibility', icon: 'solar_power', state: 'done' },
  { code: 'F05', label: 'Plans', icon: 'bolt', state: 'active' },
  { code: 'F06', label: 'Consent', icon: 'draw', state: 'action' },
  { code: 'F07', label: 'Provider', icon: 'engineering', state: 'todo' },
  { code: 'F08', label: 'Finances', icon: 'account_balance_wallet', state: 'todo' },
  { code: 'F09', label: 'Reconcile', icon: 'receipt_long', state: 'todo' },
  { code: 'F10', label: 'Actual', icon: 'monitoring', state: 'todo' }
] as const;

const stateStyles: Record<string, string> = {
  done: 'bg-[#006b57] text-white',
  verify: 'bg-[#ffdea7] text-[#271900]',
  active: 'bg-[#9af4d8] text-[#002019] ring-4 ring-[#9af4d8]/25',
  action: 'bg-[#ffdea7] text-[#271900] state-pulse',
  todo: 'bg-[#e2f0f9] text-[#717976]'
};

const stateLabels: Record<string, string> = {
  done: 'Done',
  verify: 'Verify',
  active: 'Active',
  action: 'Action',
  todo: 'Next'
};

export const DashboardPage: React.FC = () => {
  const { currentUser, community, navigateTo, setIsConsentModalOpen } = useApp();
  const [activeModelRange, setActiveModelRange] = useState<'30day' | 'annual'>('30day');

  const firstName = currentUser.name.split(' ')[0];
  const monthlySavings = currentUser.role === 'msme' ? '₹18,400' : '₹3,480';
  const capacity = currentUser.role === 'msme' ? '25.0' : '6.8';

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 pb-16">
      {/* Hero: position + next action */}
      <section className="grid gap-3 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="relative overflow-hidden rounded-2xl bg-[#103d35] p-4 text-white shadow-[0_20px_50px_-24px_rgba(0,38,32,0.75)] sm:p-5">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full border-[18px] border-white/5"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-[#006b57]/40 blur-2xl"
          />

          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[#9af4d8]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#9af4d8]" />
                Synthetic demo · Oct 2026
              </span>
              <h1 className="font-headline mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                Good morning, {firstName}.
              </h1>
              <p className="mt-1 text-[11px] leading-relaxed text-[#a3d0c4]">
                Your community solar position at a glance.
              </p>
            </div>
            <PositionRing value={78} label="offset" />
          </div>

          <div className="relative mt-4 grid grid-cols-3 gap-2">
            <MiniStat icon="currency_rupee" value={monthlySavings} label="Est. monthly" />
            <MiniStat icon="solar_power" value={`${capacity} kWp`} label="Capacity" />
            <MiniStat
              icon="groups"
              value={`${community.committedMembersCount}/${community.totalEligibleFlats}`}
              label="Flats joined"
            />
          </div>

          <div className="relative mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigateTo('/assessment')}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#f6bd4f] px-3 text-[11px] font-bold text-[#271900] shadow-sm transition-colors hover:bg-[#ffdea7]"
            >
              Open feasibility
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
            <button
              type="button"
              onClick={() => navigateTo('/optimiser')}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-white/10 px-3 text-[11px] font-semibold text-white transition-colors hover:bg-white/20"
            >
              <span className="material-symbols-outlined text-[16px] text-[#9af4d8]">bolt</span>
              Compare plans
            </button>
          </div>
        </div>

        <div className="flex flex-col rounded-2xl border border-[#e2f0f9] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#717976]">Next best action</span>
            <span className="rounded-full bg-[#ffdea7] px-1.5 py-0.5 text-[9px] font-bold text-[#271900]">
              2 days
            </span>
          </div>

          {currentUser.consentSigned ? (
            <div className="flex flex-1 flex-col items-center justify-center py-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#9af4d8]/60 text-[#006b57]">
                <span className="material-symbols-outlined text-[28px]">verified</span>
              </div>
              <h2 className="font-headline mt-3 text-base font-bold text-[#002620]">Consent recorded</h2>
              <p className="mt-1 text-[11px] text-[#404846]">Signed {currentUser.consentDate || '22 Oct 2026'}</p>
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#e2f0f9] px-2 py-0.5 text-[9px] font-semibold text-[#006b57]">
                Proposed share · not approved
              </span>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center py-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8f6ff] text-[#006b57]">
                <span className="material-symbols-outlined text-[28px]">draw</span>
              </div>
              <h2 className="font-headline mt-3 text-base font-bold text-[#002620]">Confirm your share</h2>
              <p className="mt-1 text-[11px] text-[#404846]">12 kWp pod · {community.committedMembersCount} flats ready</p>
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#e2f0f9] px-2 py-0.5 text-[9px] font-semibold text-[#ca962b]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#f6bd4f]" />
                Not yet approved
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsConsentModalOpen(true)}
            className="mt-2 inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-[#006b57] px-3 text-[11px] font-bold text-white transition-colors hover:bg-[#002620]"
          >
            {currentUser.consentSigned ? 'Review agreement' : 'Review & sign'}
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      </section>

      {/* Journey strip */}
      <section className="rounded-2xl border border-[#e2f0f9] bg-white p-3 shadow-sm sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-[#006b57]">route</span>
            <h2 className="font-headline text-sm font-bold text-[#002620]">Your path to credit</h2>
          </div>
          <span className="rounded-full bg-[#e2f0f9] px-2 py-0.5 text-[9px] font-bold text-[#006b57]">
            Step 5 of 10
          </span>
        </div>

        <div className="no-scrollbar mt-3 flex items-start gap-1 overflow-x-auto pb-1">
          {JOURNEY.map((step, index) => (
            <React.Fragment key={step.code}>
              <div className="flex min-w-[62px] flex-1 flex-col items-center gap-1 text-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${stateStyles[step.state]}`}
                  aria-label={`${step.code} ${step.label}: ${stateLabels[step.state]}`}
                >
                  <span className="material-symbols-outlined text-[16px]">{step.icon}</span>
                </div>
                <span className="text-[10px] font-bold leading-tight text-[#002620]">{step.label}</span>
                <span className="text-[8px] font-semibold uppercase tracking-[0.1em] text-[#717976]">
                  {stateLabels[step.state]}
                </span>
              </div>
              {index < JOURNEY.length - 1 && (
                <span
                  aria-hidden="true"
                  className={`mt-4 h-0.5 w-3 shrink-0 rounded-full ${
                    step.state === 'done' ? 'bg-[#006b57]' : 'bg-[#dceaf4]'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* Visual status bento */}
      <section className="grid gap-3 md:grid-cols-3">
        <button
          type="button"
          onClick={() => navigateTo('/optimiser')}
          className="group rounded-2xl border border-[#e2f0f9] bg-white p-4 text-left shadow-sm transition-colors hover:border-[#006b57]/40"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#717976]">Plan options</span>
            <span className="rounded-full bg-[#9af4d8] px-1.5 py-0.5 text-[9px] font-bold text-[#002019]">Modelled</span>
          </div>
          <div className="mt-3 space-y-2.5">
            <PlanBar label="Equal share" value={68} max={120} tone="bg-[#a3d0c4]" />
            <PlanBar label="Affordability" value={88} max={120} tone="bg-[#7ed7bd]" />
            <PlanBar label="Benefit-aware" value={104} max={120} tone="bg-[#006b57]" selected />
          </div>
          <div className="mt-3 flex items-center justify-between text-[10px]">
            <span className="inline-flex items-center gap-1 font-semibold text-[#006b57]">
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              Benefit-aware selected
            </span>
            <span className="font-mono text-[#717976]">₹/flat/mo</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => navigateTo('/credit-allocation')}
          className="group rounded-2xl border border-[#e2f0f9] bg-white p-4 text-left shadow-sm transition-colors hover:border-[#006b57]/40"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#717976]">Credit reconciliation</span>
            <span className="rounded-full bg-[#ffdea7] px-1.5 py-0.5 text-[9px] font-bold text-[#271900]">Needs evidence</span>
          </div>

          <div className="mt-3 space-y-2.5">
            <div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[#404846]">Expected</span>
                <span className="font-mono font-semibold text-[#002620]">540 kWh</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#e2f0f9]">
                <div className="h-full w-3/4 rounded-full bg-[#006b57]" />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[#404846]">Recorded</span>
                <span className="inline-flex items-center gap-1 font-mono text-[#ca962b]">
                  <span className="material-symbols-outlined text-[13px]">lock</span>
                  Unverified
                </span>
              </div>
              <div className="mt-1 flex h-2 items-center gap-0.5 overflow-hidden rounded-full bg-[#e2f0f9] px-1">
                {Array.from({ length: 12 }).map((_, index) => (
                  <span key={index} className="h-1 flex-1 rounded-full bg-[#c0c8c5]/60" />
                ))}
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-[10px]">
            <span className="font-semibold text-[#ca962b]">Settlement period not matched</span>
            <span className="material-symbols-outlined text-[16px] text-[#717976] transition-transform group-hover:translate-x-0.5">
              arrow_forward
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => navigateTo('/reports')}
          className="group rounded-2xl border border-[#e2f0f9] bg-white p-4 text-left shadow-sm transition-colors hover:border-[#006b57]/40"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#717976]">Projected vs actual</span>
            <span className="rounded-full bg-[#e2f0f9] px-1.5 py-0.5 text-[9px] font-bold text-[#006b57]">Month 1</span>
          </div>

          <div className="mt-3 space-y-2.5">
            <PlanBar label="Projected" value={3480} max={4000} tone="bg-[#a3d0c4]" />
            <PlanBar label="Actual" value={3120} max={4000} tone="bg-[#006b57]" />
          </div>

          <div className="mt-3 flex items-center justify-between text-[10px]">
            <span className="inline-flex items-center gap-1 font-semibold text-[#ca962b]">
              <span className="material-symbols-outlined text-[14px]">trending_down</span>
              −10.3% variance
            </span>
            <span className="font-mono text-[9px] text-[#717976]">Internal · not a bill</span>
          </div>
        </button>
      </section>

      {/* Generation vs consumption forecast */}
      <div className="flex flex-col gap-3.5 rounded-2xl border border-[#e2f0f9] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-[#006b57]">monitoring</span>
              <span className="font-headline text-sm font-bold text-[#002620]">Generation vs consumption</span>
            </div>
            <div className="flex items-center gap-1 rounded-lg bg-[#e2f0f9] p-0.5 text-[10px]">
              <button
                onClick={() => setActiveModelRange('30day')}
                className={`rounded px-2 py-0.5 font-semibold transition-colors ${
                  activeModelRange === '30day' ? 'bg-white text-[#002620] shadow-sm' : 'text-[#404846]'
                }`}
              >
                30 days
              </button>
              <button
                onClick={() => setActiveModelRange('annual')}
                className={`rounded px-2 py-0.5 font-semibold transition-colors ${
                  activeModelRange === 'annual' ? 'bg-white text-[#002620] shadow-sm' : 'text-[#404846]'
                }`}
              >
                12 months
              </button>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-[#404846]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#006b57]" />
            <span>Modelled at 28.61° N · Delhi NCR</span>
          </div>
        </div>

        <div className="relative flex h-40 w-full flex-col justify-between overflow-hidden rounded-xl bg-[#e8f6ff] p-3">
          <div className="z-10 flex flex-wrap items-center justify-between gap-2 text-[#101d24]">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-[#006b57]" />
                <span className="text-[11px] font-semibold text-[#002620]">
                  Solar: {activeModelRange === '30day' ? '540 kWh' : '6,480 kWh'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-[#f6bd4f]" />
                <span className="text-[11px] font-semibold text-[#404846]">
                  Grid: {activeModelRange === '30day' ? '610 kWh' : '7,320 kWh'}
                </span>
              </div>
            </div>
            <span className="rounded bg-[#9af4d8]/60 px-2 py-0.5 text-[10px] font-bold text-[#006b57]">
              Peak solstice
            </span>
          </div>

          <div className="relative flex h-24 w-full items-end">
            <svg className="h-full w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 320 90">
              <defs>
                <linearGradient id="dashSolarGlow" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#006b57" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#006b57" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="dashGridGlow" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#f6bd4f" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#f6bd4f" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <line stroke="#c0c8c5" strokeDasharray="3 3" strokeWidth="1" x1="0" x2="320" y1="20" y2="20" />
              <line stroke="#c0c8c5" strokeDasharray="3 3" strokeWidth="1" x1="0" x2="320" y1="55" y2="55" />

              <path d="M0,45 Q40,40 80,30 T160,25 T240,35 T320,28 L320,90 L0,90 Z" fill="url(#dashGridGlow)" />
              <path d="M0,45 Q40,40 80,30 T160,25 T240,35 T320,28" fill="none" stroke="#ca962b" strokeLinecap="round" strokeWidth="2" />

              <path d="M0,80 Q40,75 80,50 T160,15 T240,40 T320,70 L320,90 L0,90 Z" fill="url(#dashSolarGlow)" />
              <path d="M0,80 Q40,75 80,50 T160,15 T240,40 T320,70" fill="none" stroke="#006b57" strokeLinecap="round" strokeWidth="2.5" />
              <circle cx="160" cy="15" fill="#006b57" r="4.5" stroke="#ffffff" strokeWidth="1.5" />
            </svg>
          </div>

          <div className="flex justify-between pt-1 font-mono text-[9px] text-[#404846]">
            <span>W1</span>
            <span>W2</span>
            <span className="font-bold text-[#002620]">W3 peak</span>
            <span>W4</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center justify-between rounded-lg bg-[#e2f0f9] p-2.5">
            <div>
              <span className="block text-[10px] text-[#404846]">Grid bill offset</span>
              <span className="font-headline text-base font-bold text-[#006b57]">78%</span>
            </div>
            <span className="material-symbols-outlined text-[22px] text-[#006b57]">energy_savings_leaf</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-[#e2f0f9] p-2.5">
            <div>
              <span className="block text-[10px] text-[#404846]">Export surplus</span>
              <span className="font-headline text-base font-bold text-[#002620]">₹640</span>
            </div>
            <span className="material-symbols-outlined text-[22px] text-[#f6bd4f]">payments</span>
          </div>
        </div>
      </div>

      {/* Rooftop verification */}
      <button
        type="button"
        onClick={() => navigateTo('/assessment')}
        className="flex w-full items-center gap-3 rounded-2xl border border-[#e2f0f9] bg-white p-3.5 text-left shadow-sm transition-colors hover:border-[#006b57]/40"
      >
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#e8f6ff] text-[#006b57]">
          <span className="material-symbols-outlined text-[28px]">satellite_alt</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate font-headline text-xs font-bold text-[#002620] sm:text-sm">
              Terrace C-Block · spatial scan
            </span>
            <span className="material-symbols-outlined text-[16px] text-[#006b57]">check_circle</span>
          </div>
          <p className="mt-0.5 text-[10px] text-[#404846]">720 sq.ft unshaded · 94.2% solar access</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className="rounded bg-[#9af4d8]/50 px-1.5 py-0.5 text-[9px] font-semibold text-[#006b57]">
              Simulated
            </span>
            <span className="rounded bg-[#e2f0f9] px-1.5 py-0.5 text-[9px] font-semibold text-[#404846]">
              Not a technical approval
            </span>
          </div>
        </div>
        <span className="material-symbols-outlined text-[18px] text-[#717976]">chevron_right</span>
      </button>

      {/* Agreement & approval path */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#e2f0f9] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-headline text-sm font-bold text-[#002620]">Agreement & approval path</h3>
            <p className="text-[10px] text-[#404846]">Records held by Solaris · external approval stays external</p>
          </div>
          <span className="rounded-full bg-[#9af4d8]/40 px-2 py-0.5 text-[10px] font-bold text-[#006b57]">Step 3 of 5</span>
        </div>

        <div className="no-scrollbar flex items-start gap-2 overflow-x-auto pb-1 pt-1">
          {[
            { label: 'Draft plan', icon: 'edit_document', state: 'done', note: 'Modelled' },
            { label: 'Member accepted', icon: 'how_to_reg', state: 'done', note: '10 flats' },
            { label: 'Society confirmed', icon: 'groups', state: 'active', note: 'In progress' },
            { label: 'Approval evidence', icon: 'verified_user', state: 'todo', note: 'Pending' },
            { label: 'Commissioned', icon: 'solar_power', state: 'todo', note: 'Pending' }
          ].map((step, index, steps) => (
            <React.Fragment key={step.label}>
              <div className="flex min-w-[84px] flex-1 flex-col items-center gap-1 text-center">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full ${stateStyles[step.state]}`}>
                  <span className="material-symbols-outlined text-[15px]">{step.icon}</span>
                </div>
                <span className="text-[10px] font-bold leading-tight text-[#002620]">{step.label}</span>
                <span className="text-[9px] font-medium text-[#717976]">{step.note}</span>
              </div>
              {index < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className={`mt-3.5 h-0.5 w-4 shrink-0 ${step.state === 'done' ? 'bg-[#006b57]' : 'bg-[#dceaf4]'}`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Project pulse */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#e2f0f9] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-[#006b57]">bolt</span>
            <h3 className="font-headline text-sm font-bold text-[#002620]">Project pulse</h3>
          </div>
          <button
            type="button"
            onClick={() => navigateTo('/community')}
            className="rounded text-[10px] font-semibold text-[#006b57] hover:underline"
          >
            View all
          </button>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          {[
            { icon: 'payments', tone: 'bg-[#9af4d8]/70 text-[#00725d]', name: 'Flat 302', action: 'Committed ₹45,000', time: '2h' },
            { icon: 'engineering', tone: 'bg-[#e2f0f9] text-[#002620]', name: 'BRPL', action: 'DT load study done', time: '1d' },
            { icon: 'tune', tone: 'bg-[#ffdea7] text-[#271900]', name: 'Solver', action: 'Rebalanced shares', time: '2d' }
          ].map((item) => (
            <div key={item.name} className="flex items-center gap-2 rounded-xl bg-[#f4faff] p-2.5">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${item.tone}`}>
                <span className="material-symbols-outlined text-[17px]">{item.icon}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-1">
                  <span className="truncate text-[10px] font-bold text-[#002620]">{item.name}</span>
                  <span className="text-[9px] text-[#717976]">{item.time}</span>
                </div>
                <p className="truncate text-[10px] text-[#404846]">{item.action}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Provider workspace */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#c0c8c5]/30 bg-[#e2f0f9] p-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#006b57] shadow-sm">
            <span className="material-symbols-outlined text-[20px]">engineering</span>
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-[#002620]">Provider workspace</h4>
            <p className="truncate text-[10px] text-[#404846]">Quotes, milestones, generation & settlement imports</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigateTo('/monitoring')}
          className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-[10px] font-semibold text-[#006b57] shadow-sm transition-colors hover:bg-[#f4faff]"
        >
          Open
        </button>
      </div>
    </div>
  );
};
