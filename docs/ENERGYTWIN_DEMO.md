# EnergyTwin — Shopping Complex Solar Benefit Intelligence

Implemented in the existing Solaris React/Express repository. This is the focused commercial USP; the household application is retained. All site/reading/policy figures in the demo are synthetic. Benefits are internal projections, never official DISCOM VNM credits.

## Root cause and repair

1. Earlier residential state used global browser keys. Account-scoped keys had been introduced, but switching identities could retain optimiser/community state and generate an audit event using the previous account's data. Private state now resets on account changes, automatic recomputation does not create a financial audit event, and authenticated residential records have their own account-and-organisation-scoped server endpoint.
2. New commercial endpoints checked an account's organisation but did not consistently enforce tenant/manager roles. Only the individual statement endpoint had a tenant check. A tenant could otherwise request the whole property, all bills, financial reports and mutations. Persisted **active organisation memberships** now authorise every protected route. Tenant access is restricted to a minimal assigned-property selector and their own property/shop statement. Manager access requires a property assignment and does not grant owner mutations.
3. The commercial and household components could retain in-memory state when changing users. Commercial pages and Helios are keyed by identity, commercial membership is confirmed against `/api/session`, and business users always enter a separate navigation/layout. Residential profiles restored from storage cannot grant business API access.
4. The previous mall was a static/isometric SVG. EnergyTwin now lazy-loads a genuine WebGL model using React Three Fiber and Three.js. All 24 selectable store objects use persisted shop IDs; a 2D floor grid uses those same IDs.

Identical starting numbers across demo organisations are reproducible **seed assumptions**, not a shared private property. Each has a distinct persisted organisation/property record; edits and queries are isolated.

## Working routes and launch

```sh
npm run dev
```

The command starts the API on 8787 and Vite on the next free port beginning at 3000. Open the exact printed URL, preferably `127.0.0.1` if `localhost` resolves incorrectly. During this implementation the working app is at `http://127.0.0.1:3002`.

- `/#/login/msme`: commercial owner/tenant login and demo entry.
- `/#/commercial`: EnergyTwin owner dashboard or restricted tenant statement, based on the server membership.
- `/#/login/household`: household login/demo.
- `/#/dashboard`, `/#/assessment`: preserved household screens.

The QA walkthrough used a separate frontend origin on 3030 so account switching did not sign the user out of the working 3002 browser.

## End-to-end walkthrough (about three minutes)

1. Open **MSME login → Explore mall demo**. A fresh server account, active owner membership, organisation and synthetic property are persisted. The owner sees the commercial EnergyTwin layout, with no household roster or budget.
2. Read the four calculated KPI cards. The 200 kWp example shows ₹1,94,400 monthly savings, ₹23,32,800 annual savings, 24,000 kWh/month estimated generation and 3.86-year simple payback.
3. Use the three-floor mall. Drag to orbit, scroll to zoom, hide/show the solar roof, or reset the camera. Colours show arrangement status. Clicking store geometry selects its persisted shop ID and requests its statement from the backend. Clicking a shop on another floor also selects that floor.
4. Switch to **2D grid**, choose **Shop 2 / Daily Market 1**, then return to **3D model**. The selection persists. Shop 2 uses 1,900 kWh and receives a projected ₹8,394.55; Shop 1 uses 1,800 kWh and receives ₹7,952.73. An ineligible/non-participating shop receives zero.
5. Expand **How is this calculated?** to inspect the pool, eligible consumption, shop consumption, period, policy version and paise-rounding basis.
6. Open **Shops & benefits** for the per-floor ledger. Changing an illustrative arrangement status creates a new immutable policy definition; it does not approve consent, issue a bill or change a utility allocation. Property setup permits review of the sharing fraction and financial assumptions.
7. Open **Bills & solar sizing** to select 100/200/300 kWp; the API supplies the comparisons and the tenant pool is recalculated. Open Financial reports to see saved input/policy snapshots or download a source-labelled report.
8. Log out. At MSME login choose **Explore restricted tenant demo**. The account has a real tenant membership assigned to one property/shop. It sees only its own statement and no owner navigation, other tenants, private bills or policy mutations.
9. Log out and choose **Household login → Explore household demo**. The existing dashboard and Rooftop Solar Feasibility screen remain available, with separate account state.

SolarMatch and quotation modules from earlier work are retained but removed from the primary commercial navigation. No new SolarMatch or advanced AI workflow was added for this USP.

## Reproducible calculation

| Input | Synthetic value |
| --- | --- |
| Main-meter monthly load | 100,000 kWh |
| Usable roof | 3,200 m² |
| Selected system | 200 kWp |
| Monthly solar yield | 120 kWh/kWp |
| Expected self-use fraction | 90%, capped at load |
| Energy tariff | ₹9/kWh |
| Fixed / other charges | ₹1,00,000/month |
| Demand charge | 500 kW × ₹100/kW = ₹50,000/month |
| Export settlement | ₹0/kWh |
| Installation cost | ₹45,000/kWp |
| Tenant sharing fraction | 50% of eligible projected savings |
| Policy method | Consumption-weighted eligible active shops; largest-remainder integer-paise rounding |
| Record period | 2026-10 |

Generation = 200 × 120 = **24,000 kWh**. Self-use = min(100,000, 24,000 × 0.9) = **21,600 kWh**. Imports = **78,400 kWh**, exports = **2,400 kWh**.

Before = 100,000 × ₹9 + ₹1,00,000 + ₹50,000 = **₹10,50,000**.

After = 78,400 × ₹9 + ₹1,00,000 + ₹50,000 − 2,400 × ₹0 = **₹8,55,600**.

Savings = **₹1,94,400/month**. Eligible illustrative pool = 50% = **₹97,200**. Total active-shop consumption in policy v1 = **22,000 kWh**. The 24 tenant readings total 70,800 kWh, leaving 29,200 kWh for common/non-shop consumption; the main and sub-meters are never added as independent utility purchases.

- Shop 1: ₹97,200 × 1,800 ÷ 22,000, rounded by the deterministic pool allocator → **₹7,952.73**.
- Shop 2: ₹97,200 × 1,900 ÷ 22,000 → **₹8,394.55**.
- Sum of shop allocations: exactly **₹97,200**, with no over-allocation. No eligible shops means zero allocation.

Monthly generation/self-use and annual extrapolation are estimates. No live irradiance, actual load interval, legal agreement or utility approval is claimed. Fixed and demand charges remain payable. Official VNM is not a commercial demo mode.

## Data and permission contract

- Store schema v3: accounts, memberships, sessions, private residential records, properties, meter hierarchy/readings, immutable benefit-policy versions, audit events and input snapshots. Version 1/2 migrations retain records and backup the original file before upgrading.
- `GET /api/business/properties/:id`: authorised owner/assigned manager receives the model and deterministic scenarios.
- `GET /api/business/properties/:id/shops/:shopId/statement`: shop, calculation details, reading source and illustrative policy. Tenants must match both property and shop assignment.
- `GET /api/business/properties/:id/policies`: owner/assigned manager policy history; tenants denied.
- `PUT /api/business/properties/:id/readings/:meterId`: owner-only reviewed readings. Tenant totals above the main meter are rejected without mutation.
- `GET/PUT /api/residential/state`: active household membership only, bound to server identity and organisation. Caller-supplied account/org fields do not redirect the lookup or write.
- Tenant aggregate property, report, history, installer, quote and mutation routes return 403. Foreign-organisation object IDs return 404. Inactive memberships block existing tokens.

## Validation evidence

| Check | Result |
| --- | --- |
| `npm run test:energytwin` | 20 focused acceptance checks pass: membership isolation, both workspaces, same-mall tenant restrictions across all endpoints, revoked memberships, meter hierarchy/consistency, geometry mapping, immutable policies, reproducible allocations and restricted tenant demo. |
| `npm run test:business` | 39 broader checks pass, including persistence, migration, finance, report/procurement regressions and Helios boundaries. |
| `npm test` | 12 residential/helper/financial checks pass. |
| `npm run test:api` | 11 legacy synthetic-fixture API regression checks pass. |
| `npm run lint` | TypeScript passes. |
| `npm run build` | Production build passes; Three.js model is a lazy-loaded chunk. |

Browser evidence: owner demo entered the distinct dashboard; real WebGL canvas rendered; clicking its centre raycast selected persisted Shop 11 on Floor 2 and fetched the correct 2,800 kWh / ₹0 statement; grid selection changed to Shop 13 and ₹13,254.55, then Shop 2 and ₹8,394.55. The 3D→2D→3D transition preserved selection. Restricted tenant demo showed only Shop 1. Switching to household demo reached the original dashboard and feasibility page. No full mobile-device or long-running performance certification is claimed.

Build warnings: existing Vite `__dirname` compatibility notice and large-bundle warnings. The model renders on demand and caps device pixel ratio; it does not continuously animate. The current Three.js/Fiber combination may log a `THREE.Clock` deprecation warning, which does not prevent rendering.

## Completed versus synthetic or deferred

**Completed:** persisted active memberships; account/organisation query isolation; tenant property/shop restrictions; isolated residential server state; separate commercial layout/navigation; genuine three-floor WebGL mall with roof panels/orbit/zoom/selection; same-record keyboard-accessible 2D fallback; backend meter/policy/benefit calculations; on-click API statements; exact pool reconciliation; loading/error/empty states; policy/input history; calculation explanations and the tested flow above.

**Synthetic by design:** mall geometry is generic, all initial meter readings and tariffs, installer/finance assumptions and arrangement statuses. Benefits are projections. Demo agreements have not been legally verified.

**Deferred:** production relational database, production identity provider/email recovery, real meter/DISCOM feeds, legal agreement activation, real charges/payments, official VNM reconciliation, live installer integration, multi-organisation administration UI, and extensive mobile/performance testing. Runtime JSON persistence supports one writer process and needs a persistent disk.

## Helios / Gemini readiness

Gemini remains server-only via `GEMINI_API_KEY` and optional `GEMINI_MODEL` in `.env`. Neither value is exposed through `VITE_*`. `npm run check:helios` performs a minimal live generation check without printing the key or sending customer data. **Verified on 1 November 2026:** the user-supplied server key successfully generated a response with `gemini-3.5-flash`, and `npm run check:helios:api` confirmed that authenticated `/api/helios/chat` returned `mode: gemini`. The API was restarted to load the saved configuration. The original configured model returned 404 and was replaced with an available, tested model. No credentials or private customer data were logged. Numerical business explanations continue to use authorised deterministic records; tenants receive only their own assigned-shop explanation.
