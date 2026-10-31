# Solaris Economics Studio

Open the existing commercial workspace at `http://127.0.0.1:3002/#/commercial` and choose **Economics Studio**. `npm run dev` starts both servers; use the port Vite prints if 3002 is occupied.

## Demo walkthrough

1. Log in as an MSME owner or use the isolated commercial demo. Select the intended property in the existing property selector.
2. Open Economics Studio. The initial recorded policy period is selected (October 2026 in the synthetic reference mall).
3. At 200 kWp, ₹45,000/kWp, ₹1,80,000 annual maintenance, ₹9/kWh and zero export rate: generation is 24,000 kWh/month; on-site use is 21,600 kWh; export is 2,400 kWh. Monthly avoided energy charge is ₹1,94,400. Annual operating benefit before sharing is ₹21,52,800. CAPEX is ₹90,00,000; plant payback is 4.18 years.
4. Set tenant share to zero: investor benefit equals plant benefit. At 50% sharing with the recorded eligible October submeter readings, investor benefit is ₹10,76,400/year and payback is 8.36 years. At 75%, retained benefit is ₹5,38,200/year and payback is 16.72 years. At 100%, retained benefit is zero and there is no positive simple payback.
5. Select a capacity candidate. All six views update from one backend result. Inspect roof and budget feasibility independently of return.
6. Select a tenant bar. Usage, agreement, energy cost, attributed benefit and calculation change together. Internal benefit statements are not official VNM credits.
7. Name and save a version. Change sharing, then save another version with the same name. Compare both rows or reload either version from the selector. Loading a saved version reruns its inputs against current property records; the comparison table retains its immutable original outputs and timestamps.
8. Use Ask Helios on a chart. The server looks up this session's authorised simulation. Gemini explains those outputs; if unavailable, a clearly labelled deterministic explanation remains available.

## Implemented

- Six responsive visualisations: generation donut, stacked bill components, connected floating-bar waterfall, cumulative cash flow with break-even marker, selectable capacity comparison, and selectable tenant allocation bars.
- Debounced server simulation, cancellation of stale requests, backend validation, loading/error/retry states, scenario persistence and version comparison.
- Integer-paise charges reusing the existing rational-decimal charge helper. Largest-remainder tenant allocation. Sharing applies once after maintenance and other operating costs.
- Organisation/property checks reuse the existing authenticated property middleware. Tenants cannot access aggregate studio data. Assigned facility managers may simulate/explain; saving retains the existing owner-only policy.
- Scenario inputs, outputs, provenance, calculation/tariff versions and creation timestamps are saved in the existing JSON store. No credentials or environment variables are changed. No dependencies added.

## Simulated and intentionally limited

- Existing synthetic mall: 24 shops, one main connection, tenant submeters, 12 monthly main-meter billing records. Only the existing recorded submeter period is available; other months explicitly return no tenant allocations rather than borrowing readings.
- No interval load profile exists in the current property model. The service uses the property's labelled monthly self-use assumption capped by load. It does not claim measured interval matching.
- Annual projections repeat the selected month 12 times. This is not a full seasonal annual simulation. Forecast is 25 years, flat real cash flow, no financing, escalation, degradation, replacement or residual value.
- Demand and fixed charges stay unchanged. Tax/surcharge inputs are unavailable and explicitly assumed zero. Export settlement defaults to zero; an operator-entered rate is unverified and capped at the remaining bill, with no assumed cash payout.
- NPV/IRR are illustrative unlevered estimates, not validated investment advice or a system-size recommendation. No live DISCOM settlement, meter integration, financing schedule, MongoDB integration or official VNM credit is implemented.
- Studio exploration does not change the property's existing EnergyTwin capacity or tenant policy. Existing property report export still describes the saved EnergyTwin property, not an unsaved studio scenario.

## Reproduction and checks

`npx tsx scripts/test-economics.ts` tests reference figures, generation/load accounting, unchanged fixed/demand charges, pool conservation, sharing/payback, missing readings, validation, zero/negative returns, settlement caps, NPV/IRR, organisation isolation, tenant denial, saved versions, Helios result ownership and residential state.

Also run `npm test`, `npm run test:energytwin`, `npm run lint` and `npm run build`. API tests use a unique temporary store and never modify the user's application data. Gemini network responses are not required for automated correctness checks.

Validation completed: 13 Economics Studio checks, 20 EnergyTwin acceptance checks and 12 core checks passed; type checking and production build passed. `npx tsx scripts/test-economics.ts --live-helios` also passed against live Gemini with synthetic data. Mobile layout was checked at 390 px with no document overflow. Existing Vite configuration and bundle-size warnings remain.

The browser save check was rejected by automatic approval review because it would persist a scenario in the running application. Save/version behavior was verified in the disposable integration-test database instead.

## Files changed

New feature files:

- `src/types/economics.ts`
- `server/economicsEngine.ts`
- `server/economicsApi.ts`
- `src/components/commercial/EconomicsStudio.tsx`
- `src/components/commercial/economics.css`
- `scripts/test-economics.ts`
- `docs/economics-studio.md`

Feature integration changes:

- `server/businessApi.ts` — register property-scoped routes and allow assigned managers' read-only simulation/explanation requests.
- `server/businessStore.ts` — optional saved-scenario collection in the existing store.
- `src/pages/CommercialPage.tsx` — commercial navigation and studio rendering.
- `src/utils/commercialFinancialEngine.ts` — export the existing money-charge helper without changing its behavior.

Earlier visual-review edits retained:

- `src/components/common/Header.tsx`
- `src/components/common/Sidebar.tsx`
- `src/components/common/BottomNav.tsx`
- `src/styles/saas-review.css` (new)
- `src/main.tsx` — import the presentation stylesheet directly so development hot reload resolves it reliably.

No dependencies, environment variables, authentication credentials, package files or residential business logic were changed. The unrelated `solaris_isolation_forest/` directory observed during work was not created or edited by this implementation.
