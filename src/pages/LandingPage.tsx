import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

const audienceContent = [
  {
    id: 'homes',
    label: 'Homes',
    icon: 'home',
    title: 'For independent homes',
    description:
      'Size a rooftop system around your sanctioned load, monthly bill, and PM Surya Ghar subsidy eligibility. Keep ownership simple and see the payback before you commit.',
    tags: [
      { icon: 'bolt', label: '2–10 kW scale' },
      { icon: 'trending_down', label: 'Up to 70% bill offset' },
      { icon: 'verified', label: '25-year panel warranty' }
    ]
  },
  {
    id: 'rwas',
    label: 'RWAs',
    icon: 'apartment',
    title: 'For communities and RWAs',
    description:
      'Model a shared terrace plant, invite consenting flats, and test who can afford which contribution. Every proposed credit is reconciled before it reaches a member statement.',
    tags: [
      { icon: 'handshake', label: 'Group net metering' },
      { icon: 'groups', label: 'Participant consent' },
      { icon: 'gavel', label: 'DERC-aware checks' }
    ]
  },
  {
    id: 'msme',
    label: 'MSMEs',
    icon: 'factory',
    title: 'For businesses and MSMEs',
    description:
      'Compare CAPEX and RESCO pathways without assuming a residential subsidy. Review daytime load, accelerated depreciation, and a verified quote side by side.',
    tags: [
      { icon: 'corporate_fare', label: '20–100+ kWp' },
      { icon: 'receipt_long', label: 'Accelerated depreciation' },
      { icon: 'description', label: 'ESG-ready reporting' }
    ]
  }
];

const steps = [
  {
    number: '01',
    icon: 'fact_check',
    title: 'Assess the rooftop',
    description: 'Enter your DISCOM, consumer number, and bill. Solaris estimates usable capacity, yield, and net cost.'
  },
  {
    number: '02',
    icon: 'gavel',
    title: 'Check the pathway',
    description: 'Screen VNM, CAPEX, RESCO, and group net metering rules before any shared-credit assumption is allowed.'
  },
  {
    number: '03',
    icon: 'bolt',
    title: 'Optimise the cohort',
    description: 'Set budgets and target capacity. The solver maximises eligible participants while keeping shares honest.'
  },
  {
    number: '04',
    icon: 'monitoring',
    title: 'Track the outcome',
    description: 'Review synthetic O&M signals, compare expected versus actual generation, and export an internal statement.'
  }
];

const comparisonRows = [
  {
    icon: 'account_balance_wallet',
    label: 'Upfront capital',
    individual: '100% borne by one owner (₹1.8L–₹4.5L)',
    shared: 'Distributed share from ₹28,000 per seat'
  },
  {
    icon: 'roofing',
    label: 'Roof access',
    individual: 'Requires exclusive, unshaded roof rights',
    shared: 'Open to shared terraces and shaded roofs'
  },
  {
    icon: 'description',
    label: 'Regulatory paperwork',
    individual: 'Individual DISCOM coordination and follow-ups',
    shared: 'One collective filing with a shared evidence trail'
  },
  {
    icon: 'visibility',
    label: 'Benefit transparency',
    individual: 'Household bill remains the only reference',
    shared: 'Reconciled allocation ledger for every member'
  }
];

const metrics = [
  { value: '20', label: 'flats per modelled cohort', icon: 'apartment' },
  { value: '10 / 12 / 15', label: 'kWp scenario sizes', icon: 'bolt' },
  { value: '100%', label: 'allocation reconciliation', icon: 'pie_chart' },
  { value: '< 10s', label: 'solver target', icon: 'speed' }
];

const faqs = [
  {
    id: 'faq-vnm',
    question: 'What is Delhi Virtual or Group Net Metering?',
    answer:
      'Under DERC regulations, energy from a single shared rooftop plant can be credited to multiple consumer accounts within the same DISCOM boundary. Solaris models the proposed pathway and flags where official approval is still required.'
  },
  {
    id: 'faq-subsidy',
    question: 'How is PM Surya Ghar subsidy handled?',
    answer:
      'Residential eligibility is checked against the applicable subsidy rules and capped at ₹78,000 for qualifying systems of 3 kW and above. MSME and commercial cases do not receive a residential subsidy assumption by default.'
  },
  {
    id: 'faq-shadow',
    question: 'What if our apartment terrace is shaded?',
    answer:
      'The planning model adjusts usable roof area and yield. If your own roof is not suitable, the community workspace can model participation in a compliant shared plant on another portion of the terrace.'
  },
  {
    id: 'faq-official',
    question: 'Is Solaris an official DISCOM portal?',
    answer:
      'No. Solaris is a planning and decision-support prototype. It generates internal planning statements, not utility bills, official approvals, or guaranteed credit settlements.'
  }
];

const generationBars = [38, 46, 58, 68, 80, 88, 84, 76, 64, 52, 42, 36];
const consumptionBars = [58, 62, 60, 66, 72, 78, 80, 78, 70, 64, 58, 54];
const months = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description?: string;
  id?: string;
}

const SectionHeading: React.FC<SectionHeadingProps> = ({ eyebrow, title, description, id }) => (
  <div className="max-w-2xl">
    <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#006b57]">{eyebrow}</span>
    <h2 id={id} className="font-headline mt-2 text-2xl font-bold tracking-tight text-[#002620] sm:text-3xl lg:text-4xl">
      {title}
    </h2>
    {description && <p className="mt-3 text-sm leading-relaxed text-[#404846] sm:text-base">{description}</p>}
  </div>
);

export const LandingPage: React.FC = () => {
  const { navigateTo, isAuthenticated, currentWorkspaceAccess } = useApp();
  const dashboardPath = currentWorkspaceAccess.commercial && !currentWorkspaceAccess.household ? '/commercial' : '/dashboard';
  const [activeAudience, setActiveAudience] = useState(0);
  const [openFaq, setOpenFaq] = useState<string | null>(faqs[0].id);

  const audience = audienceContent[activeAudience];

  const primaryAction = isAuthenticated ? dashboardPath : '/signup';
  const primaryLabel = isAuthenticated ? 'Open my dashboard' : 'Get started free';
  const secondaryAction = isAuthenticated ? '/assessment' : '/login';
  const secondaryLabel = isAuthenticated ? 'Run an assessment' : 'Log in';

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#F8FAF7]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-[#002620] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>

      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[42rem] overflow-hidden">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#9af4d8]/40 blur-3xl" />
        <div className="absolute left-[-10rem] top-48 h-80 w-80 rounded-full bg-[#ffdea7]/35 blur-3xl" />
        <div className="absolute left-1/2 top-24 h-64 w-[42rem] -translate-x-1/2 rounded-full bg-white/60 blur-3xl" />
      </div>

      <header className="sticky top-0 z-50 border-b border-[#dbe9e2]/80 bg-[#F8FAF7]/85 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigateTo('/')}
            className="flex min-h-11 items-center gap-2.5 rounded-lg text-left"
            aria-label="Solaris home"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#006b57] text-white shadow-sm">
              <span aria-hidden="true" className="material-symbols-outlined text-[20px]">solar_power</span>
            </span>
            <span className="font-headline text-lg font-bold tracking-tight text-[#002620]">SOLARIS</span>
            <span className="hidden items-center gap-1 rounded-full bg-[#e2f0f9] px-2 py-1 text-[10px] font-semibold text-[#006b57] sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-[#006b57]" />
              Delhi
            </span>
          </button>

          <nav aria-label="Landing page sections" className="hidden items-center gap-1 lg:flex">
            {[
              { href: '#how-it-works', label: 'How it works' },
              { href: '#solutions', label: 'Solutions' },
              { href: '#compare', label: 'Compare' },
              { href: '#impact', label: 'Impact' },
              { href: '#faq', label: 'FAQ' }
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="flex min-h-11 items-center rounded-lg px-3 text-xs font-semibold text-[#404846] transition-colors hover:bg-[#e2f0f9] hover:text-[#002620]"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => navigateTo(dashboardPath)}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-[#006b57] px-4 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#002620]"
              >
                Dashboard
                <span aria-hidden="true" className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => navigateTo('/login')}
                  className="inline-flex min-h-11 items-center rounded-lg px-3 text-xs font-bold text-[#006b57] transition-colors hover:bg-[#e2f0f9]"
                >
                  Household login
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo('/login/msme')}
                  className="inline-flex min-h-11 items-center rounded-lg bg-[#006b57] px-4 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#002620]"
                >
                  MSME login
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main id="main-content">
        <section className="mx-auto grid max-w-6xl gap-4 px-4 pt-8 sm:grid-cols-2 sm:px-6 lg:px-8" aria-label="Choose your solar workspace">
          {[{ title: 'Households & Societies', text: 'Plan your rooftop, build a community, and understand your savings.', icon: 'home', path: '/login/household', label: 'Household login' },
            { title: 'MSME, Malls & Businesses', text: 'One property. Every shop. A clearer solar investment.', icon: 'domain', path: '/login/msme', label: 'MSME / Mall login' }].map(item => (
            <button key={item.path} onClick={() => navigateTo(isAuthenticated ? dashboardPath : item.path)} className={`group flex items-center gap-4 rounded-2xl border p-5 text-left transition-all hover:-translate-y-1 hover:shadow-lg ${item.icon === 'domain' ? 'border-[#006b57] bg-[#003f34] text-white' : 'border-[#dce5df] bg-white text-[#003f34]'}`}>
              <span className="material-symbols-outlined text-4xl opacity-80">{item.icon}</span><span className="flex-1"><span className="block font-headline text-lg font-bold">{item.title}</span><span className="mt-1 block text-xs opacity-75">{item.text}</span><span className="mt-3 block text-xs font-bold">{item.label} →</span></span>
            </button>
          ))}
        </section>
        <section className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-12 pt-10 sm:px-6 sm:pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pb-20 lg:pt-20">
          <div className="landing-rise max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#a7f3d0] bg-white/70 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#006b57] shadow-sm backdrop-blur-sm">
              <span aria-hidden="true" className="material-symbols-outlined text-[15px]">sunny</span>
              Community solar, made clear
            </span>

            <h1 className="font-headline mt-5 text-balance text-4xl font-bold leading-[1.05] tracking-tight text-[#002620] sm:text-5xl lg:text-6xl">
              Solar is brighter when we{' '}
              <span className="relative inline-block text-[#006b57]">
                grow together
                <span aria-hidden="true" className="absolute -bottom-1 left-0 h-1.5 w-full rounded-full bg-[#f6bd4f]/70" />
              </span>
              .
            </h1>

            <p className="mt-5 max-w-lg text-base leading-relaxed text-[#404846] sm:text-lg">
              Plan rooftop capacity, check DERC-aware eligibility, and optimise a community budget without hiding the maths.
              Solaris separates internal planning from any official DISCOM settlement.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => navigateTo(primaryAction)}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#006b57] px-5 text-sm font-bold text-white shadow-[0_12px_30px_-12px_rgba(0,107,87,0.65)] transition-all hover:-translate-y-0.5 hover:bg-[#002620] active:translate-y-0"
              >
                {primaryLabel}
                <span aria-hidden="true" className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
              <button
                type="button"
                onClick={() => navigateTo(secondaryAction)}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#c0c8c5] bg-white/70 px-5 text-sm font-bold text-[#002620] backdrop-blur-sm transition-colors hover:border-[#006b57] hover:bg-white"
              >
                <span aria-hidden="true" className="material-symbols-outlined text-[18px] text-[#006b57]">
                  {isAuthenticated ? 'calculate' : 'login'}
                </span>
                {secondaryLabel}
              </button>
            </div>

            <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2.5 text-[11px] font-semibold text-[#404846] sm:text-xs">
              {['DERC-aware planning', 'PM Surya Ghar subsidy logic', 'No official bill claims'].map((item) => (
                <li key={item} className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="material-symbols-outlined text-[15px] text-[#006b57]">
                    check_circle
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="landing-rise relative mx-auto w-full max-w-lg lg:mx-0" style={{ animationDelay: '120ms' }}>
            <div aria-hidden="true" className="absolute -inset-8 rounded-[2.5rem] bg-[#9af4d8]/25 blur-3xl" />

            <div className="relative overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/80 p-4 shadow-[0_32px_80px_-28px_rgba(0,38,32,0.45)] backdrop-blur-xl sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#006b57]">Community plan</span>
                  <h2 className="font-headline mt-1 text-lg font-bold text-[#002620]">Gulmohar Enclave · Block C</h2>
                  <p className="mt-0.5 text-[11px] text-[#5f6865]">BRPL · 20-flat modelled cohort</p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#9af4d8]/45 px-2.5 py-1 text-[10px] font-bold text-[#00725d]">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#006b57]" />
                  Planning model
                </span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  { label: 'Capacity', value: '12', unit: 'kWp' },
                  { label: 'Flats', value: '11', unit: 'consented' },
                  { label: 'Reconciled', value: '100', unit: '%' }
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl border border-[#e2f0f9] bg-[#f8faf7] p-2.5">
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-[#5f6865]">{stat.label}</span>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="font-mono text-lg font-bold tabular-nums text-[#002620]">{stat.value}</span>
                      <span className="text-[9px] font-medium text-[#5f6865]">{stat.unit}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-xl border border-[#e2f0f9] bg-[#f8faf7] p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#002620]">
                    <span aria-hidden="true" className="material-symbols-outlined text-[15px] text-[#ca962b]">
                      wb_sunny
                    </span>
                    Generation vs consumption
                  </span>
                  <span className="text-[9px] font-medium text-[#5f6865]">kWh / month</span>
                </div>

                <div
                  role="img"
                  aria-label="Illustrative monthly solar generation compared with grid consumption, peaking in June."
                  className="mt-3 flex h-28 items-end justify-between gap-1"
                >
                  {generationBars.map((height, index) => (
                    <div key={`${months[index]}-${index}`} className="flex h-full flex-1 items-end justify-center gap-0.5">
                      <span
                        className="w-1/2 max-w-[7px] rounded-t bg-[#006b57]"
                        style={{ height: `${height}%` }}
                      />
                      <span
                        className="w-1/2 max-w-[7px] rounded-t bg-[#f6bd4f]"
                        style={{ height: `${consumptionBars[index]}%` }}
                      />
                    </div>
                  ))}
                </div>

                <div aria-hidden="true" className="mt-1 flex justify-between text-[8px] font-mono text-[#5f6865]">
                  {months.map((month, index) => (
                    <span key={`${month}-${index}`}>{month}</span>
                  ))}
                </div>

                <div className="mt-2 flex items-center gap-4 border-t border-[#e2f0f9] pt-2 text-[9px] font-medium text-[#404846]">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-sm bg-[#006b57]" />
                    Solar generation
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-sm bg-[#f6bd4f]" />
                    Grid consumption
                  </span>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {[
                  { flat: 'Flat 301', percent: 40, amount: '₹4,880' },
                  { flat: 'Flat 204', percent: 35, amount: '₹4,270' },
                  { flat: 'Flat 102', percent: 25, amount: '₹3,050' }
                ].map((row) => (
                  <div key={row.flat} className="flex items-center gap-3 text-[10px]">
                    <span className="w-14 shrink-0 font-semibold text-[#404846]">{row.flat}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#e2f0f9]">
                      <div className="h-full rounded-full bg-[#006b57]" style={{ width: `${row.percent}%` }} />
                    </div>
                    <span className="w-8 shrink-0 text-right font-mono font-bold text-[#002620]">{row.percent}%</span>
                    <span className="w-12 shrink-0 text-right font-mono text-[#5f6865]">{row.amount}</span>
                  </div>
                ))}
              </div>

              <p className="mt-3 border-t border-[#e2f0f9] pt-2 text-[9px] leading-relaxed text-[#5f6865]">
                Internal planning statement · Not a utility bill or official credit approval.
              </p>
            </div>

            <div className="landing-float absolute -left-2 -top-7 hidden items-center gap-2 rounded-xl border border-white/80 bg-white/90 px-3 py-2 shadow-lg backdrop-blur-md sm:flex">
              <span aria-hidden="true" className="material-symbols-outlined text-[18px] text-[#ca962b]">
                savings
              </span>
              <div>
                <span className="block text-[9px] font-semibold uppercase tracking-wider text-[#5f6865]">Subsidy modelled</span>
                <span className="font-mono text-xs font-bold text-[#002620]">₹78,000</span>
              </div>
            </div>

            <div className="landing-float absolute -bottom-7 -right-2 hidden items-center gap-2 rounded-xl border border-white/80 bg-white/90 px-3 py-2 shadow-lg backdrop-blur-md sm:flex" style={{ animationDelay: '1.2s' }}>
              <span aria-hidden="true" className="material-symbols-outlined text-[18px] text-[#006b57]">
                verified
              </span>
              <div>
                <span className="block text-[9px] font-semibold uppercase tracking-wider text-[#5f6865]">Share check</span>
                <span className="text-xs font-bold text-[#002620]">100% reconciled</span>
              </div>
            </div>
          </div>
        </section>

        <section aria-label="Illustrative platform metrics" className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 lg:px-8 lg:pb-16">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[#dbe9e2] bg-[#dbe9e2] sm:grid-cols-4">
            {metrics.map((metric) => (
              <div key={metric.label} className="flex items-center gap-3 bg-white/85 p-4 backdrop-blur-sm sm:flex-col sm:items-start sm:gap-2">
                <span aria-hidden="true" className="material-symbols-outlined text-[20px] text-[#006b57]">
                  {metric.icon}
                </span>
                <div>
                  <span className="font-headline block text-lg font-bold tabular-nums text-[#002620] sm:text-xl">{metric.value}</span>
                  <span className="mt-0.5 block text-[10px] font-medium leading-snug text-[#5f6865] sm:text-[11px]">{metric.label}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-center text-[10px] leading-relaxed text-[#5f6865]">
            Illustrative planning metrics from the synthetic 20-flat demo. Not live DISCOM, inverter, or settlement data.
          </p>
        </section>

        <section id="solutions" className="scroll-mt-24 border-t border-[#e2f0f9]">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
            <SectionHeading
              eyebrow="Solutions built for you"
              title="One platform, three pathways"
              description="Start with the rooftop you have. Solaris adapts the eligibility screen, finance comparison, and allocation model to your consumer category."
            />

            <div className="mt-7 grid gap-3 sm:mt-9 sm:grid-cols-3">
              {audienceContent.map((segment, index) => {
                const isActive = index === activeAudience;
                return (
                  <button
                    key={segment.id}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setActiveAudience(index)}
                    className={`flex min-h-14 items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                      isActive
                        ? 'border-[#006b57] bg-[#002620] text-white shadow-md'
                        : 'border-[#dbe9e2] bg-white/75 text-[#002620] hover:-translate-y-0.5 hover:border-[#9af4d8] hover:bg-white'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`material-symbols-outlined flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[21px] ${
                        isActive ? 'bg-white/10 text-[#9af4d8]' : 'bg-[#e2f0f9] text-[#006b57]'
                      }`}
                    >
                      {segment.icon}
                    </span>
                    <span>
                      <span className="block text-sm font-bold">{segment.title}</span>
                      <span className={`mt-0.5 block text-[11px] ${isActive ? 'text-[#a3d0c4]' : 'text-[#5f6865]'}`}>
                        {segment.label === 'Homes' ? 'Individual rooftops' : segment.label === 'RWAs' ? 'Shared terraces' : 'Commercial loads'}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div
              key={audience.id}
              aria-live="polite"
              className="landing-rise mt-4 grid gap-5 rounded-2xl border border-[#dbe9e2] bg-white/80 p-5 shadow-sm backdrop-blur-sm sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center"
            >
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e2f0f9] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#006b57]">
                  <span aria-hidden="true" className="material-symbols-outlined text-[14px]">{audience.icon}</span>
                  {audience.label}
                </span>
                <h3 className="font-headline mt-3 text-lg font-bold text-[#002620] sm:text-xl">{audience.title}</h3>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#404846]">{audience.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {audience.tags.map((tag) => (
                    <span
                      key={tag.label}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#dbe9e2] bg-[#f8faf7] px-2.5 py-1.5 text-[11px] font-semibold text-[#404846]"
                    >
                      <span aria-hidden="true" className="material-symbols-outlined text-[14px] text-[#006b57]">{tag.icon}</span>
                      {tag.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-[#dbe9e2] bg-[#f8faf7] p-4 lg:w-56">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#5f6865]">What you can test</span>
                <ul className="mt-2 space-y-2 text-[11px] leading-relaxed text-[#404846]">
                  {['Capacity and yield', 'Subsidy and payback', 'Budget-constrained sharing'].map((item) => (
                    <li key={item} className="flex items-start gap-1.5">
                      <span aria-hidden="true" className="material-symbols-outlined mt-0.5 text-[14px] text-[#006b57]">check</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-24 border-t border-[#e2f0f9] bg-white/45">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
            <SectionHeading
              eyebrow="Simple roadmap"
              title="From roof to reconciled credit"
              description="Four deliberate steps keep the regulatory gate, the money model, and the shared allocation in the right order."
            />

            <div className="mt-8 grid gap-3 sm:mt-10 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step) => (
                <article
                  key={step.number}
                  className="group relative overflow-hidden rounded-2xl border border-[#dbe9e2] bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:border-[#9af4d8] hover:shadow-md"
                >
                  <span aria-hidden="true" className="font-mono absolute right-3 top-3 text-3xl font-bold text-[#e2f0f9]">
                    {step.number}
                  </span>
                  <span aria-hidden="true" className="material-symbols-outlined flex h-11 w-11 items-center justify-center rounded-xl bg-[#e2f0f9] text-[23px] text-[#006b57]">
                    {step.icon}
                  </span>
                  <h3 className="font-headline mt-4 text-sm font-bold text-[#002620]">{step.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-[#404846]">{step.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="compare" className="scroll-mt-24 border-t border-[#e2f0f9]">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
            <SectionHeading
              eyebrow="Smart comparison"
              title="Individual rooftop vs shared solar"
              description="The trade-offs are structural, not just financial. Solaris makes them visible before a community commits."
            />

            <div className="mt-8 overflow-hidden rounded-2xl border border-[#dbe9e2] bg-white shadow-sm">
              <div className="hidden gap-4 border-b border-[#e2f0f9] bg-[#f8faf7] px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-[#5f6865] sm:grid sm:grid-cols-[1.05fr_1fr_1fr]">
                <span>Decision factor</span>
                <span>Individual rooftop</span>
                <span className="text-[#006b57]">Solaris shared plan</span>
              </div>

              {comparisonRows.map((row, index) => (
                <div
                  key={row.label}
                  className={`grid gap-3 px-5 py-4 text-xs sm:grid-cols-[1.05fr_1fr_1fr] sm:items-center sm:gap-4 ${
                    index !== comparisonRows.length - 1 ? 'border-b border-[#e2f0f9]' : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span aria-hidden="true" className="material-symbols-outlined text-[18px] text-[#006b57]">{row.icon}</span>
                    <span className="font-bold text-[#002620]">{row.label}</span>
                  </div>
                  <div className="rounded-lg bg-[#f8faf7] p-2.5 leading-relaxed text-[#404846] sm:bg-transparent sm:p-0">
                    <span className="mr-1 font-bold text-[#5f6865] sm:hidden">Individual:</span>
                    {row.individual}
                  </div>
                  <div className="rounded-lg bg-[#e8f6ff] p-2.5 font-medium leading-relaxed text-[#006b57] sm:bg-transparent sm:p-0">
                    <span className="mr-1 font-bold text-[#006b57] sm:hidden">Solaris:</span>
                    {row.shared}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="impact" className="scroll-mt-24 border-t border-[#e2f0f9]">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
            <div className="relative overflow-hidden rounded-3xl bg-[#002620] p-5 text-white shadow-[0_30px_70px_-30px_rgba(0,38,32,0.8)] sm:p-8 lg:p-10">
              <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#9af4d8]/15 blur-3xl" />
              <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 left-10 h-72 w-72 rounded-full bg-[#f6bd4f]/10 blur-3xl" />

              <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#9af4d8]">
                    <span aria-hidden="true" className="material-symbols-outlined text-[14px]">public</span>
                    Sustainable impact
                  </span>
                  <h2 className="font-headline mt-3 text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                    Better decisions, shared prosperity.
                  </h2>
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#a3d0c4] sm:text-base">
                    Solaris is aligned with SDG 8 and SDG 9, with a supporting role for SDG 7. The goal is not just more panels — it is more households who can afford to participate and understand what they receive.
                  </p>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {[
                      { code: 'SDG 8', icon: 'work', value: '142+', label: 'Illustrative installer job hours facilitated', tone: 'text-[#f6bd4f]' },
                      { code: 'SDG 9', icon: 'precision_manufacturing', value: '1.2 MW', label: 'Mapped rooftop resilience potential', tone: 'text-[#9af4d8]' }
                    ].map((item) => (
                      <div key={item.code} className="rounded-xl border border-white/10 bg-white/[0.06] p-4">
                        <div className={`flex items-center gap-1.5 text-[11px] font-bold ${item.tone}`}>
                          <span aria-hidden="true" className="material-symbols-outlined text-[16px]">{item.icon}</span>
                          {item.code}
                        </div>
                        <span className="font-headline mt-2 block text-2xl font-bold">{item.value}</span>
                        <span className="mt-1 block text-[10px] leading-relaxed text-[#a3d0c4]">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <blockquote className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-sm sm:p-6">
                  <span aria-hidden="true" className="material-symbols-outlined text-[26px] text-[#9af4d8]">format_quote</span>
                  <p className="mt-2 text-base font-medium leading-relaxed text-white sm:text-lg">
                    “We could finally show every flat what they contribute and what they receive — without pretending it was an official DISCOM bill.”
                  </p>
                  <footer className="mt-5 flex items-center gap-3 border-t border-white/10 pt-4">
                    <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#9af4d8] text-xs font-bold text-[#002620]">
                      AV
                    </span>
                    <div>
                      <cite className="block text-xs font-bold not-italic text-white">Anita Verma</cite>
                      <span className="block text-[10px] text-[#a3d0c4]">RWA Coordinator · Gulmohar Enclave</span>
                    </div>
                  </footer>
                  <span className="mt-3 block text-[9px] font-semibold uppercase tracking-wider text-[#7ca89d]">
                    Illustrative pilot feedback · synthetic demo persona
                  </span>
                </blockquote>
              </div>

              <p className="relative mt-6 text-[10px] leading-relaxed text-[#7ca89d]">
                Impact figures are illustrative planning estimates, not verified outcomes. Real savings, jobs, and installations require post-deployment measurement.
              </p>
            </div>
          </div>
        </section>

        <section id="faq" className="scroll-mt-24 border-t border-[#e2f0f9] bg-white/45">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12 lg:px-8 lg:py-20">
            <div>
              <SectionHeading
                eyebrow="Got questions?"
                title="Answers before you commit"
                description="The rules are complex by design. Solaris keeps the caveats visible instead of burying them in a quote."
              />
              <button
                type="button"
                onClick={() => navigateTo(isAuthenticated ? '/assessment' : '/signup')}
                className="mt-6 inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-[#006b57] px-4 text-xs font-bold text-white transition-colors hover:bg-[#002620]"
              >
                {isAuthenticated ? 'Open the assessment' : 'Create a free account'}
                <span aria-hidden="true" className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>

            <div className="space-y-3">
              {faqs.map((faq) => {
                const isOpen = openFaq === faq.id;
                return (
                  <div key={faq.id} className="overflow-hidden rounded-xl border border-[#dbe9e2] bg-white shadow-sm">
                    <h3>
                      <button
                        id={`${faq.id}-question`}
                        type="button"
                        onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                        aria-expanded={isOpen}
                        aria-controls={`${faq.id}-answer`}
                        className="flex min-h-14 w-full items-center justify-between gap-4 px-4 py-3.5 text-left sm:px-5"
                      >
                        <span className="text-sm font-bold text-[#002620]">{faq.question}</span>
                        <span
                          aria-hidden="true"
                          className={`material-symbols-outlined shrink-0 text-[20px] text-[#006b57] transition-transform duration-200 ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        >
                          expand_more
                        </span>
                      </button>
                    </h3>
                    {isOpen && (
                      <div
                        id={`${faq.id}-answer`}
                        role="region"
                        aria-labelledby={`${faq.id}-question`}
                        className="landing-rise border-t border-[#e2f0f9] px-4 pb-4 pt-3 sm:px-5"
                      >
                        <p className="text-sm leading-relaxed text-[#404846]">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-4 pb-16 pt-2 sm:px-6 lg:px-8">
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-gradient-to-br from-[#006b57] via-[#064f43] to-[#002620] p-6 text-white shadow-[0_30px_70px_-30px_rgba(0,38,32,0.85)] sm:p-9 lg:p-11">
            <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full border-[24px] border-white/5" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-[#9af4d8]/10 blur-2xl" />

            <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-xl">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#9af4d8]">
                  <span aria-hidden="true" className="material-symbols-outlined text-[14px]">solar_power</span>
                  Your solar future starts here
                </span>
                <h2 className="font-headline mt-3 text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                  Bring your community into the plan.
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[#a3d0c4] sm:text-base">
                  Start with a bill and a budget. Solaris will keep the assumptions, permissions, and allocation maths in view.
                </p>
              </div>

              <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:shrink-0">
                <button
                  type="button"
                  onClick={() => navigateTo(primaryAction)}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-[#002620] shadow-sm transition-colors hover:bg-[#e2f0f9]"
                >
                  {primaryLabel}
                  <span aria-hidden="true" className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo(secondaryAction)}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/[0.06] px-5 text-sm font-bold text-white transition-colors hover:bg-white/10"
                >
                  {secondaryLabel}
                </button>
              </div>
            </div>

            <div className="relative mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/10 pt-4 text-[10px] font-medium text-[#a3d0c4]">
              {['Delhi-first', 'Synthetic demo data', 'No official bill claims'].map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="material-symbols-outlined text-[14px] text-[#9af4d8]">check_circle</span>
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#dbe9e2] bg-[#f4faff]">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="max-w-sm">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#006b57] text-white">
                  <span aria-hidden="true" className="material-symbols-outlined text-[20px]">solar_power</span>
                </span>
                <span className="font-headline text-lg font-bold tracking-tight text-[#002620]">SOLARIS</span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-[#5f6865]">
                One sun. Many communities. Shared prosperity. A Delhi-first planning platform for solar adoption, community optimisation, and transparent allocation.
              </p>
            </div>

            <nav aria-label="Footer navigation" className="grid grid-cols-2 gap-x-10 gap-y-2 text-xs font-semibold text-[#404846] sm:grid-cols-3">
              <a className="min-h-11 hover:text-[#006b57]" href="#how-it-works">How it works</a>
              <a className="min-h-11 hover:text-[#006b57]" href="#solutions">Solutions</a>
              <a className="min-h-11 hover:text-[#006b57]" href="#compare">Compare</a>
              <a className="min-h-11 hover:text-[#006b57]" href="#impact">Impact</a>
              <a className="min-h-11 hover:text-[#006b57]" href="#faq">FAQ</a>
              <button type="button" onClick={() => navigateTo('/login')} className="min-h-11 text-left hover:text-[#006b57]">
                Log in
              </button>
            </nav>
          </div>

          <div className="mt-6 border-t border-[#dbe9e2] pt-4 text-[10px] leading-relaxed text-[#5f6865]">
            <p>
              Solaris is a planning and decision-support prototype. It is not a DISCOM, electricity retailer, official bill issuer, lender, or approval authority. Regulatory rules and financing figures must be verified before production use.
            </p>
            <p className="mt-1">© 2026 Solaris. Internal planning estimates only.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
