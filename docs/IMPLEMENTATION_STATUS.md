# Solaris 2.0 implementation status

## Latest: EnergyTwin focused USP

The current commercial experience now includes a real React Three Fiber / Three.js three-floor mall, roof panels, orbit/zoom, persisted shop selection and a 2D fallback. The earlier SVG-only limitation below is historical. Persisted active memberships now gate every protected query; tenants cannot bypass statement permissions through whole-property, export or mutation endpoints. Residential private state also has an account-and-organisation-scoped backend service. The v3 additive store migration retains existing account/property data and adds memberships and meter/policy records.

See `ENERGYTWIN_DEMO.md` for the authoritative current walkthrough, exact calculation fixture, complete versus synthetic/deferred checklist and validation evidence. The 20 focused acceptance checks, broader suites, TypeScript and build pass. Live Gemini 3.5 Flash and the authenticated Helios endpoint were verified on 1 November 2026 using the user-supplied server key; direct and API smoke checks passed without logging credentials. No advanced SolarMatch or Helios feature expansion was undertaken for EnergyTwin.

## Current update: two login paths and working B2B planning workspace

31 October 2026, following the Sprint 0 audit below. This section supersedes the baseline findings where noted.

Implemented and exercised:

- Visible household and MSME/mall entry cards, separate login/signup routes, workspace-specific account creation and isolated demos. MSME login opens the business dashboard rather than a household profile.
- Server account credentials use salted scrypt; bearer tokens are random, expire after 24 hours, are stored hashed server-side and are revoked at logout. Switching the client workspace cannot grant server access. Legacy fixture identity headers are disabled by default.
- Every new B2B resource route derives organisation scope from the authenticated account and persisted property record. A second organisation cannot read or mutate properties, shops, bills, enquiries, quotes, reports, snapshots or Helios property context.
- Persistent, editable commercial property assumptions; 24-shop/three-floor synthetic starter; twelve monthly consumption records; manual reviewed consumption replacement with provenance; one main connection and 24 sub-meter identifiers.
- Calculated 100/200/300 kWp comparisons, roof suitability, before/after bills, self-use/import/export, fixed/demand charges, payback, NPV and annualised IRR. Each charge is rounded half-up to integer paise using decimal-rational multiplication. Interval imports use their own time tariffs.
- Interactive isometric SVG mall and accessible 2D shop grid; floor selection and selected-shop statement; hypothetical policy changes; consumption-weighted benefit pool with exact paise totals.
- Shared SolarMatch helper hard-filters geography, roof size, capacity, budget and timeline before configurable weighted ranking. B2B UI shows explicit synthetic scores and fictional providers.
- Persistent demo RFQ → explicitly simulated provider response → quote comparison/shortlist. No real provider notification, contract or payment occurs.
- Downloadable CSV with saved assumptions, capacity comparisons, tenant projections and source warnings. Immutable property snapshots preserve previous input/policy/procurement versions; recent changes appear in Financial reports.
- Helios uses independently scoped server data for business financial and benefit explanations, refuses cross-org context and has no write/approval tool. Optional Gemini adapter handles general education, with a curated offline fallback.
- `npm run dev` launches the API and frontend together. `npm start` serves the production build and API from one process.

Verified in the browser: both login paths and demo entries; household dashboard and feasibility; MSME dashboard, floor selection, capacity recalculation and persistence through reload; saved enquiry and synthetic quotation response. Automated evidence and current test counts are in `B2B_API.md`. Responsive breakpoints are implemented; a full mobile-browser sweep has not been completed.

Remaining limitations (do not interpret as full original-spec completion):

- Persistence is a single-process, versioned JSON store, not a relational production database. Version 1 → 2 migration is additive and retains a `.v1-backup`; preexisting SQL migrations remain unapplied reference schemas.
- One workspace/organisation is provisioned per new account. Multi-organisation membership administration, facility-manager/tenant-specific business sign-ins and real installer-company accounts are not added by this two-login slice.
- Household planning/community data still uses its existing browser store. Legacy local accounts remain supported without granting B2B API access. Household financial data is not silently imported into the server.
- The mall view is SVG isometric, not a WebGL/Three.js digital twin. It includes the functional 2D grid alternative.
- No bill PDF/OCR, private file service, live meters, real utility settlement, legal agreement verification or official VNM credit issuance. Manual bill history currently stores consumption, not a full uploaded charge-line document.
- Tenant adjustments are projections only. No real statements or tenant charges are issued. Synthetic shop consumption does not become measured data after editing property assumptions.
- Installer responses are explicitly simulated; the original installer page remains a demo. No real assigned-installer quote submission/milestone workflow is claimed.
- Gemini code is integrated but a live API-key/service call was not verified. Financial outputs bypass model invention; they come directly from saved inputs and the deterministic engine.
- Original residential SmartExit approval/ownership persistence and full household end-to-end acceptance coverage remain outstanding.

## Sprint 0 baseline (historical)

Audit date: 31 October 2026. Specifications: `docs_updated/01_SOLARIS_PRD.txt` through `05_SOLARIS_IMPLEMENTATION_PLAN.txt`; `00_SOLARIS_COMPLETE_MASTER.txt` is the combined reference. These updated files supersede the old documentation paths in the task brief.

## Already implemented

- React 19 / TypeScript / Vite 8 frontend, Tailwind 4, Lucide icons and Motion. Existing green/off-white dashboard components can be reused.
- Hash navigation for landing, login/signup, onboarding, dashboard, assessment, regulations, community, optimiser, credit allocation, monitoring, reports and admin. Commercial and installer routes have been added in the preexisting working tree.
- Residential calculation helpers: feasibility, EMI, subsidy assumptions, affordability optimisation and allocation arithmetic. Five existing unit checks pass; this does not establish current regulatory eligibility or official settlement accuracy.
- Express API has health, current-user, workspace, property/shop reads and an installer assignment read. Demo fixtures contain 24 shops across three floors.
- Ten existing automated checks pass, plus TypeScript and a production build. See `BASELINE_RESULTS.md` for scope and limitations.

## Partially implemented

| Capability | Evidence and remaining gap |
| --- | --- |
| Residential registration/login | Browser-local account/session storage; no backend identity binding. Preserve during migration. |
| Household intake and community registration | Existing forms and localStorage state; no private server-side bill store. |
| Feasibility and affordability | Reusable calculation engine and UI; real policy/finance inputs require evidence. |
| Ownership, consent, allocation | Local community records and controls; no durable approval workflow. A 100% sum is arithmetic, not reconciliation evidence. |
| Financial dashboard, monitoring, reports | Existing demo views; no live utility/inverter integration. |
| SmartExit | Existing optimiser/dropout simulation; no durable ownership transfer, outstanding obligation or consent workflow. |
| RBAC | Backend helper checks and demo memberships exist; frontend role switching and server identity are disconnected. |
| Commercial economics | Backend deterministic engine supports capacity sweeps and interval energy balance; EnergyTwin dashboard now renders API-returned results. |
| SolarMatch | Shared hard-filter/ranking helper and three labelled fictional providers; incomplete sizing, eligibility/evidence and configurable-weight validation. |
| Migrations and seed | Two SQLite schema files and JSON seed script; no migration runner or database-backed repositories. |

## Mocked functionality

- EnergyTwin uses the persisted 24-shop, three-floor API seed and backend statements. Its “3D” view remains an SVG isometric model rather than WebGL/Three.js, with an accessible grid fallback.
- Installer page shows fixed portfolio entries, capacity, service area and enquiry count; no registration, RFQ or quotation mutation exists.
- Helios widget calls a local keyword FAQ. Gemini dependency and environment example exist, but there is no server Gemini adapter or authorised tool orchestration.
- Browser role switcher is demo impersonation, not an access grant.

## Missing

- Authenticated server sessions; organisation membership workspace selection; durable multi-org identities and tenant-period isolation.
- Property onboarding APIs, validated meter hierarchy, confirmed bill intake, private documents, versioned tariff/simulation snapshots.
- RFQs, versioned quotes, company registration, project milestones and authorised generation upload.
- Versioned benefit engine, contractual eligibility, deterministic rounding/caps and tenant statement endpoints.
- API-backed mall selection and accessible 2D fallback, then optional lazy-loaded 3D.
- Server-side Gemini, curated context, allowlisted read tools and per-tool permission tests.
- Durable audit trail, migration execution/rollback verification, deployment for API/database and full residential browser regression.

## Technical risks

1. `x-user-id` is accepted directly as identity. Anyone can impersonate a fixture user. No production security claim is justified.
2. Platform admin currently bypasses private resource checks; installer admin can read any project ID in its organisation context without a recorded project assignment.
3. Property helpers allow broad role-level access without consistently enforcing designated-property scope.
4. Interval after-solar energy currently uses the default tariff rather than each interval tariff. IRR is calculated monthly but labelled as a percentage without annualisation. Binary floating-point money and silent clamping need replacement/validation.
5. Static Vercel rewrites serve the frontend only; no API deployment/proxy is configured. The development frontend has no API proxy either.
6. Existing uncommitted modifications and deleted old documentation predate this audit. Preserve them; do not reset or overwrite them to establish a baseline. No backup commit or branch was created in this audit.
7. Existing tests do not exercise browser login/dashboard/billing, private files, Helios permissions, ledger caps or tenant turnover. Sprint 0 browser exit criterion remains open.

## Planned changes and safe migration strategy

1. Finish Sprint 0: browser-smoke household login, dashboard and intake; retain local test accounts/data. Record actual results. Current audit adds HTTP tests without changing application behavior.
2. Sprint 1: add server identity/session storage, active memberships and explicit project/property/tenancy authorization; expose a typed workspace API. Keep legacy residential state through a versioned, opt-in import with validation and backup. Never accept local roles as server authority.
3. Sprint 2: introduce a migration runner and additive durable tables; preserve schema history. Import synthetic fixtures into isolated demo organisations. Add exact-money billing, dated tariff inputs, immutable scenarios and API-backed commercial onboarding/UI.
4. Sprint 3: shared SolarMatch intake and evidence-aware filtering; persist explicit RFQ sharing, quote versions and installer assignments; test buyer/installer round trip.
5. Sprint 4: policy/tenancy-bound statements, capped allocation and API-driven floor/shop grid; add 3D only after data and access tests pass.
6. Sprint 5: backend Gemini adapter and independently authorised read tools; offline FAQ remains explicitly labelled fallback.
7. Sprint 6: migrate residential capabilities incrementally; SmartExit proposals distinguish ownership transfer from finance shortfall and never alter official allocations.
8. Sprint 7: browser role journeys, responsive/error states, fresh setup, deployment and evidence review.

For every persistence change: back up the source store, run additive migrations on a copy, validate counts and foreign keys, import idempotently with provenance, compare results, then switch behind a feature flag. Keep rollback to the previous application/store until parity is verified. Never silently convert internal tenant adjustments into official VNM credits.

## Sprint checklist

- [x] Read updated specifications and inspect current source/deployment.
- [x] Inventory implemented, partial, mocked and missing features.
- [x] Run existing tests, typecheck and production build.
- [x] Add executable HTTP baseline checks.
- [ ] Verify residential login/billing/dashboard in a browser.
- [ ] Complete Sprint 1 through Sprint 7 acceptance gates.

No full-MVP or production-readiness claim is made by this report.
