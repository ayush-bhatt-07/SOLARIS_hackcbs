# SOLARIS — Together We Shine Brighter

## Solaris 2.0: Household + MSME / Mall workspaces

**Current focus: EnergyTwin.** The commercial workspace now has a genuine Three.js / React Three Fiber mall, persisted meter readings and benefit-policy versions, and tenant-safe backend statements. See [the complete EnergyTwin walkthrough, reproducible inputs, tests and limits](docs/ENERGYTWIN_DEMO.md). `npm run test:energytwin` runs the focused 20-check acceptance suite. At MSME login, **Explore restricted tenant demo** demonstrates an actual single-shop membership.

The website now has two visible login/signup paths. Household users keep the existing residential dashboard, onboarding, feasibility, community and optimisation flows. MSME accounts open a separate business dashboard with persisted organisation-scoped property records.

```sh
npm install
npm run dev
```

`npm run dev` starts **both** the API (8787) and Vite (normally 3000). Open the exact Local URL printed by Vite; it chooses another port if 3000 is occupied. Use the same origin for the frontend and `/api` proxy.

- **Household:** `/#/login/household` → create an account or **Explore household demo**.
- **MSME / Mall:** `/#/login/msme` → create an account or **Explore mall demo**.
- Each demo entry creates its own isolated server account. Demo values are synthetic. Regular MSME accounts start with an empty property list and can create/customise a starter property.
- Primary MSME sections: EnergyTwin, Property & setup, Bills & solar sizing, Shops & benefits, Financial reports. Earlier marketplace code is retained but hidden from the focused navigation.
- Property assumptions, selected capacity, reviewed consumption, hypothetical arrangement statuses, demo enquiries/quotes, audit events and input snapshots persist across reloads and server restarts.

The mall demo includes 24 shops over three floors, one main connection, 24 persisted sub-meters/readings and twelve monthly consumption records. Financial comparisons calculate 100/200/300 kWp scenarios. The documented 200 kWp fixture yields ₹10,50,000 before, ₹8,55,600 after and ₹1,94,400 monthly savings. The real WebGL mall and accessible floor grid share the same API records.

Real provider messaging and live utility integration are not connected. Quotation responses are generated only by **Simulate demo response** and are labelled synthetic. Shop statements are **hypothetical internal projections**, never official DISCOM VNM credits. The household's preexisting browser-local data remains in place.

Tests:

```sh
npm test
npm run test:api
npm run test:business
npm run lint
npm run build
```

For a single-process production-style run, first build, then run `npm start`. Express serves the built frontend and API together on `PORT` (default 8787). Use a persistent writable volume for `server/data/` and TLS at your hosting proxy. A static-only Vercel deployment does **not** run this API or persist its records. Do not deploy the JSON store on ephemeral/serverless filesystems or run multiple writer instances.

Optional Gemini: copy `.env.example` to `.env` and set server-only `GEMINI_API_KEY` and, if needed, `GEMINI_MODEL`. Financial questions use deterministic authorised server records; general educational answers can use Gemini. Without a key, curated help and financial explanations work offline. Live Gemini 3.5 Flash generation and the authenticated Helios endpoint were verified on 1 November 2026. Use `npm run check:helios` for a direct check and `npm run check:helios:api` with the API running for an authenticated endpoint check.

See [B2B API and deployment guide](docs/B2B_API.md) and [current implementation status](docs/IMPLEMENTATION_STATUS.md) for boundaries and known limitations.

An intelligent, regulation-aware solar adoption, community solar planning, affordability optimisation, and transparent credit allocation platform designed for India, starting with Delhi (BSES Rajdhani Power Limited, BSES Yamuna Power Limited, Tata Power DDL).

**Primary SDG Alignment:**

- **SDG 8** — Decent Work and Economic Growth
- **SDG 9** — Industry, Innovation, and Infrastructure
- Supporting **SDG 7** — Affordable and Clean Energy

---

## Architecture & Technology Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS v4 design tokens, Material Symbols & Lucide Icons, Canvas Confetti
- **State Management & Persistence:** Centralized `AppContext` with live reactive recalculations and localStorage persistence for CA numbers, budget preferences, consent agreements, and audit history
- **Solar Engineering Engine (`src/utils/solarCalculations.ts`):** Deterministic calculations for Delhi insolation (~1,420 kWh/kWp/year), DERC LT-1 domestic tariff brackets, and official PM Surya Ghar: Muft Bijli Yojana subsidies (capped at ₹78,000 for residential 3kW+)
- **Smart Affordability Optimiser (`src/utils/optimiserEngine.ts`):** Exact combinatorial linear solver optimizing binary participant selection, adhering strictly to budget ceilings, non-negative allocations, 100.0% zero-shortfall reconciliation, and EMI_i < ΔBill_i personal net benefit constraints
- **Audit & Governance:** Continuous logging of all regulatory approvals, member consent e-signatures, and solver executions in an immutable audit ledger
- **Build:** Vite 8, ESM, hash-based routing (no React Router), localStorage-only auth (SHA-256 via Web Crypto API)

---

## Supported Roles

| Role                        | Demo User   | Context                                                               |
| --------------------------- | ----------- | --------------------------------------------------------------------- |
| Household / Resident        | Rohit Rao   | Flat 301, Pocket 2 RWA, 5.0 kW Sanctioned load                        |
| MSME / Business Owner       | Alok Gupta  | Shree Fabric Mills, 25.0 kW Sanctioned load, accelerated depreciation |
| RWA / Community Coordinator | Anita Verma | General Secretary, Gulmohar Enclave RWA                               |

---

## Implemented Routes & Features

| Route                | Feature                                                                                           | Status       |
| -------------------- | ------------------------------------------------------------------------------------------------- | ------------ |
| `/`                  | Public Landing Page                                                                               | **Complete** |
| `/login`             | Email/password login                                                                              | **Complete** |
| `/signup`            | Account creation → onboarding                                                                     | **Complete** |
| `/onboarding`        | 5-step profile wizard (DISCOM, CA, bill, housing, terrace, solar goal)                            | **Complete** |
| `/dashboard`         | Main cockpit (KPIs, generation chart, consent banner, activity feed)                              | **Complete** |
| `/assessment`        | Solar feasibility calculator (sizing, subsidy, payback, 3-model matrix)                           | **Complete** |
| `/regulations`       | Regulatory checker (Residential/MSME tabs, VNM/CAPEX/GNM/P2P)                                     | **Complete** |
| `/community`         | Community workspace (roster, governance, timeline, terrace envelope)                              | **Complete** |
| `/optimiser`         | Smart affordability optimiser (linear solver, stress tests, scenario tabs)                        | **Complete** |
| `/credit-allocation` | Transparent allocation ledger (radial dial, node cards, lifecycle, reconciliation)                | **Complete** |
| `/monitoring`        | Synthetic O&M panel (inverter, generation, performance ratio, alerts)                             | **Complete** |
| `/reports`           | Exportable statements (feasibility, community, optimisation, allocation, regulatory, maintenance) | **Complete** |
| `/admin`             | Read-only audit logs & statutory rules                                                            | **Complete** |

---

## Critical End-to-End Demo Flow

1. **Landing** → Explore solar potential, review 4-step roadmap
2. **Signup** → Create account (email/password) → auto-redirect to onboarding
3. **Onboarding** → Select DISCOM (BRPL), verify CA #102948192, adjust monthly bill (₹6,850), pick housing/terrace, choose "Join Community Solar (VNM)"
4. **Assessment** → Calculates 4.2 kWp optimal, ₹1.32L net cost after ₹78k subsidy, 2.4-year payback
5. **Regulations** → Reviews DERC VNM 2024 clearance
6. **Community** → Inspects Gulmohar Enclave RWA cohort, capitalization progress
7. **Optimiser** → Tests 12 kWp, runs stress contingencies (Monsoon -20%, Rate spike +1.5%)
8. **Credit Allocation** → Verifies 100% reconciled radial allocation (Flat 301=40%, 204=35%, 102=25%)
9. **Consent** → Digital signature on VNM agreement, audit log entry
10. **Monitoring/Reports** → Downloads planning statement, checks synthetic telemetry

---

## Quick Start

```bash
# Install dependencies (peer conflict workaround)
npm install --legacy-peer-deps

# Development server (port 3000)
npm run dev

# Type-check / lint
npm run lint

# Production build
npm run build

# Preview production build
npm run preview
```

---

## Deployment (Vercel)

```bash
npm i -g vercel
vercel login
vercel
```

- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install --legacy-peer-deps`
- Hash-based routing works natively; `vercel.json` handles SPA rewrites

---

## Project Structure

```
src/
├── App.tsx                    # Root, routing, providers
├── main.tsx                   # Entry point
├── index.css                  # Tailwind v4 @theme, animations, focus rings
├── index.html                 # Viewport, fonts, Material Symbols
├── context/
│   └── AppContext.tsx         # Global state & actions
├── components/common/
│   ├── Header.tsx             # Top bar, user menu, mobile menu
│   ├── Sidebar.tsx            # Collapsible overlay drawer
│   ├── BottomNav.tsx          # Mobile bottom nav
│   ├── AuthShell.tsx          # Auth page layout
│   ├── ConsentModal.tsx       # Digital consent signing
│   ├── InviteModal.tsx        # Community invitations
│   └── ReportExportModal.tsx  # PDF/CSV export
├── pages/                     # 13 page components
├── utils/
│   ├── authStorage.ts         # LocalStorage auth (SHA-256)
│   ├── solarCalculations.ts   # Feasibility math
│   └── optimiserEngine.ts     # LP solver for allocation
├── data/
│   └── mockData.ts            # Demo users, community, rules, tickets
└── types/
    └── index.ts               # TypeScript interfaces
```

---

## Key Implementation Details

### Authentication

- LocalStorage-only (no backend)
- SHA-256 via Web Crypto API (fallback FNV-1a)
- Keys: `solaris_auth_accounts`, `solaris_auth_session`, `solaris_user`, `solaris_role`, `solaris_community`, `solaris_logs`
- Onboarding required **only after signup** (flag `needsOnboarding`)

### Optimiser (Deterministic Linear Program)

- Runs client-side in <10ms via `useEffect` in AppContext
- Maximizes participants with net positive savings
- Constraints: budget ceiling, EMI cap (₹4,500/mo), DERC transformer limits, sanctioned load
- Stress tests: Monsoon -20%, Rate spike +1.5%, Unit dropout, Subsidy delay
- Outputs: share %, kWp, kWh, EMI, net benefit, resilience rating

### Accessibility (WCAG 2.1 AA)

- Contrast ≥ 4.5:1 (muted text #5f6865)
- Focus rings on all interactive elements
- ARIA roles on tabs, accordions, menus
- Reduced motion support (`prefers-reduced-motion`)
- Touch targets ≥ 44×44px
- Viewport zoom enabled
- No emoji as structural icons (Material Symbols only)

---

## Statutory Disclaimer

Solaris provides regulatory planning guidance and algorithmic simulation models under Delhi Electricity Regulatory Commission (DERC) regulations. Official metering approvals, sanctioned load expansions, and final electricity tariff credit settlements are administered strictly by authorized DISCOMs (BSES Rajdhani, BSES Yamuna, Tata Power DDL). Documents generated by Solaris are internal planning statements and do not represent official utility electricity bills.

---

## Hackathon Metadata

- **Event:** Prompt-ae-thon
- **Built with:** opencode
- **Design System:** ui-ux-pro-max skill (Glassmorphism + Community/Forum Landing)
- **Repository:** [GitHub](https://github.com/aryandas2911/Solaris)
