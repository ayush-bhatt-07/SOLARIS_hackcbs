# Household and business MVP: API, operation and verification

## EnergyTwin update

Current runtime schema is **v3**, adding explicit active organisation memberships, private residential state, meter records and immutable policy definitions. v1/v2 files upgrade additively with backups. The three-floor model is now real lazy-loaded WebGL/React Three Fiber with a keyboard-accessible 2D floor grid, superseding the older SVG limitation below. Primary commercial navigation focuses on EnergyTwin, not marketplace modules.

Additional endpoints: `GET/PUT /api/residential/state` (household identity + organisation scoped), `GET /api/business/properties/:id/policies`, `PUT /api/business/properties/:id/readings/:meterId` (owner only), and `GET /api/business/properties/:id/shops/:shopId/statement`. Active tenant memberships can access only a minimal own-property selector and their assigned shop statement; all property-wide financial, report, history and write endpoints are denied. Property assignments are enforced for facility managers. `POST /api/auth/demo` additionally accepts `persona: "tenant"` for an isolated restricted-tenant demo.

`npm run test:energytwin` verifies these rules. See `ENERGYTWIN_DEMO.md` for current demo/calculation evidence. `npm run check:helios` checks the optional Gemini connection; a missing key is reported as unconfigured, never as a successful live AI integration.

## Run

`npm run dev` starts Express on 8787 and Vite on the next available port beginning with 3000. Open the Local URL printed by Vite. The frontend uses `/api`; Vite proxies this to the backend. Set `VITE_API_BASE_URL` only when intentionally using another API origin with the appropriate gateway configuration. This application does not enable blanket cross-origin credential access.

For a production-style single-process deployment: `npm run build`, then `npm start`. Mount persistent writable storage for `SOLARIS_DATA_FILE` (default `server/data/solaris.json`). Configure TLS on your reverse proxy, health-check `/api/health`, and route all requests to this Express process. Static-only Vercel hosting of `dist` is insufficient for authenticated business features. Production dependency installation must include `tsx`, currently used by startup.

Sessions live for 24 hours. No production password reset, email verification or identity-provider integration is included. Passwords use unique random salts and scrypt; only token hashes are persisted. Auth attempts are rate-limited per process/IP. Do not enable `SOLARIS_DEMO_HEADERS` outside the legacy test fixture environment.

## Public authentication

All JSON requests use `Content-Type: application/json`.

| Method | Path | Request / result |
| --- | --- | --- |
| POST | `/api/auth/register` | `{name,email,password,workspace}`; workspace is `household` or `commercial`; password 8–128 characters. Creates a new account and isolated organisation; returns `{account,token}`. |
| POST | `/api/auth/login` | `{email,password,workspace}`; account workspace must match. Returns `{account,token}`. |
| POST | `/api/auth/demo` | `{workspace}`; creates a fresh synthetic demo identity; mall demos include a property. No shared/demo password. |
| GET | `/api/session` | Bearer token required; returns the account without credentials. |
| POST | `/api/auth/logout` | Bearer token required; revokes that session. |

The frontend persists the active session in its existing local session store. For old household-only local accounts, existing browser authentication remains a compatibility fallback. That fallback never grants new server API permissions.

## Business endpoints

Send `Authorization: Bearer <token>` from a commercial account. All `:id` paths independently verify the persisted property's organisation. Unknown or foreign properties return 404. Household tokens return 403. Missing/expired sessions return 401. Invalid inputs return 400. Responses contain an `error` string for user-facing failures.

| Method | Path below `/api/business` | Behaviour |
| --- | --- | --- |
| GET | `/properties` | List the caller's own properties. |
| POST | `/properties` | Create a clearly labelled synthetic starter; max ten per org. |
| GET | `/properties/:id` | Property, financial scenarios and hypothetical benefit ledger. |
| PUT | `/properties/:id` | `{inputs,selectedCapacity}`; validate complete `BusinessInputs`, 100/200/300 kWp selection, roof area and numeric ranges. |
| PATCH | `/properties/:id/shops/:shopId` | `{status}`; changes a hypothetical arrangement and advances policy version. |
| POST | `/properties/:id/bills` | `{month:"YYYY-MM",consumptionKwh}`; insert/replace reviewed consumption with `USER_CONFIRMED` provenance. Does not automatically change comparison inputs. |
| GET | `/properties/:id/installers` | Hard-filtered and ranked fictional demo providers for saved requirements. |
| POST | `/properties/:id/quotes` | `{installerId}`; persist a demo enquiry for an eligible provider, idempotent per capacity/provider. No external communication. |
| POST | `/properties/:id/quotes/:quoteId/simulate` | Explicitly produce an illustrative provider quote from saved request capacity. |
| POST | `/properties/:id/quotes/:quoteId/select` | Shortlist a returned quote matching current capacity. No agreement/payment. |
| GET | `/properties/:id/report` | CSV attachment with assumptions, comparisons, benefit projections and provenance. Formula-leading cells are escaped. |
| GET | `/properties/:id/history` | Own property's saved calculation/policy-change history and previous assumptions. |

`BusinessInputs` is defined in `src/types/commercial.ts`. Monthly yield, self-use fraction and export compensation are user assumptions, not claimed measurements or sourced tariffs. Monthly fixed/demand charges remain on both sides. No automatic carry-forward of excess export settlement is modelled; final billed amounts are floored at zero. Cash-flow estimates exclude O&M, degradation, financing, replacements and taxes unless the user includes relevant costs in their assumptions.

## Helios

`POST /api/helios/chat` accepts `{question,propertyId?}` with a bearer token. The property ID is independently checked against the account's organisation before any data retrieval. Financial questions return exact saved model results; allocation questions return the deterministic projection pool. General education optionally uses server-side Gemini (`GEMINI_API_KEY`, configurable `GEMINI_MODEL`). It has no SQL, payment, allocation-write or approval tools. Without Gemini credentials/service, curated FAQ and numerical explanations remain available. Live Gemini service has not been tested here.

## Persistence and migration

The single-process store uses synchronous atomic temp-file rename. It retains salted password hashes, token hashes, organisation-owned records, append-only audit events and cloned input snapshots. It is deliberately not suitable for multiple writer processes or ephemeral function storage. Back up the data file and protect file access on the host.

Schema version 2 adds snapshots. When reading a version-1 store, the loader preserves all accounts, sessions, properties and audit entries, keeps the original file as `.v1-backup`, and adds an empty snapshot collection. Subsequent persistence writes version 2 atomically. Unknown versions fail startup. To roll back this migration, stop all writers, retain a copy of the new store, and restore the backup with a compatible older application. Historical changes that predate snapshots cannot be reconstructed.

The two preexisting `.sql` migrations remain reference material, not the runtime database. No migration of household localStorage is performed. Keep browser data intact.

## Verification

Automated suites:

- `npm test`: ten existing residential/helper/financial checks.
- `npm run test:api`: eleven legacy fixture API checks; test process explicitly enables demo headers.
- `npm run test:business`: 39 acceptance checks covering authentication, account/workspace isolation, every resource path, scoped shop statements, restart persistence, documented financial fixture, paise allocation, annualised IRR, manual consumption, provider eligibility, quotation lifecycle, CSV provenance, immutable snapshots, store migration and Helios permission/grounding.
- `npm run lint`: TypeScript without emit.
- `npm run build`: Vite production build.

Browser checks performed on the local app: landing exposes both login choices; MSME demo enters the business dashboard; three-floor selection changes the selected shop; 100 kWp selection recalculates KPIs and survives a reload; SolarMatch enquiry appears in Quotations and explicit simulation produces an example response; logout returns to landing; household demo opens the original dashboard and feasibility page.

The production-built MSME login and dashboard were also opened against `npm start`, confirming Express serves the client and authenticated API together. All 60 automated checks passed, as did TypeScript and the production build. Vite reports the preexisting `__dirname` compatibility warning and a main bundle size warning; neither fails the build.

Known verification limits: no live Gemini credentials/service call, no production deployment, no complete mobile-browser sweep, no real DISCOM/installer integration, and no full residential regression beyond these smoke checks. The isometric mall is SVG with an accessible grid fallback. It is not a true Three.js digital twin.
