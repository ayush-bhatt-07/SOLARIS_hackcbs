# Solaris Savings Detective

## Open and demonstrate

In the existing Business/MSME workspace (`/#/commercial`), choose **Savings Detective**. The existing `npm run dev` command still starts Solaris. The private Python worker starts on the first model request; no additional public port or Python server command is needed.

The review demo runs at `http://127.0.0.1:8791/#/commercial`, using the production frontend build and a separate temporary application store. It does not use or modify the main application's accounts/property records.

1. Log in as a business owner or choose **Explore mall demo**.
2. Open **Savings Detective**. Choose **Load synthetic reference dataset** once. This creates an isolated dataset associated with the selected authorised property. Seeding is owner-only and idempotent; an assigned facility manager can read an existing dataset.
3. Inspect expected versus actual daily generation. Select a highlighted point or an anomaly-list date. Both mouse and keyboard selection are supported.
4. For **28 August 2025**, the model reports approximately 749.1 kWh expected, 300.1 kWh actual, decision score −0.18607 and **₹4,040.99** estimated avoided-energy-charge shortfall. Selecting **29 August** changes the statement to approximately 717.2/304.5 kWh and **₹3,714.64**.
5. Select **16 August** to see an above-baseline flag with **−₹845.65** signed gap. An unusual reading is not necessarily lost savings.
6. Select **18 October**: the generation reading, anomaly score and financial impact are unavailable. The UI does not infer zero generation or a loss.
7. Select an unusual day and choose **Ask Helios about this day**. The backend function `explain_savings_anomaly` retrieves the property's persisted readings, runs inference and sends only the selected day's synthetic evidence to Gemini. The response explains evidence and possible checks without asserting a fault cause. Provider failure produces a labelled deterministic explanation.

## Audit and reproducibility

All seven supplied files were inspected: the Python training script, both CSVs, metrics JSON, README, requirements and PNG. The supplied prototype was executed in a temporary copy, leaving the originals unchanged.

- Training: first 220 chronological synthetic days.
- Evaluation: last 145 days; 144 scoreable, one missing reading.
- Isolation Forest: 250 trees, contamination 0.035, seed 42; StandardScaler fitted only on training rows.
- Features: actual/expected generation ratio and actual minus expected grid imports.
- Flags: 13; all 10 injected anomalies plus three above-baseline false positives.
- Confusion matrix: `[[131, 3], [0, 10]]`; precision `0.7692307692307693`; recall `1`; F1 `0.8695652173913043`.
- Every row and column of both regenerated CSVs matched the supplied outputs within `1e-12`; metrics matched exactly. The chart regenerated successfully; image bytes differ with plotting-library rendering.
- Source daily CSV SHA256: `c291b6845b734a907e2c679a92a4e591a089d83204e7f463bfb7f5aae290ac69`.

The integration recomputes features and predictions from raw dataset records. It never loads the pre-scored evaluation CSV as detection output. Synthetic truth labels affect evaluation only, not features, fitting or decisions.

## Financial interpretation

Daily avoided energy charge = `min(site load, generation) × ₹9/kWh`. Expected and actual charges each round half-up to integer paise; the signed gap is their difference. Positive means below the illustrative baseline, negative means above it. Missing generation produces null monetary values and is excluded from paired generation totals and every financial aggregation.

For this dataset:

- Flagged below-baseline shortfall estimate: **₹38,870.86**.
- Flagged above-baseline value: **₹2,339.65**.
- These are different aggregates; neither is an actual utility-bill loss or equipment diagnosis.

The prototype treated missing actual generation as zero for cost calculations. The integrated service intentionally corrects this, while preserving all scoreable-day model predictions. Daily data assumes coincident on-site use; no interval overlap, export settlement, demand/fixed charges, taxes or tenant sharing is included. This reference data is a synthetic **200 kWp system in 2025**, not a scaled measurement of the property's saved installation.

## Backend and access control

- `GET /api/business/properties/:id/detective`: empty state or actual inference report.
- `POST /api/business/properties/:id/detective/demo`: owner-only property-scoped synthetic dataset creation.
- `POST /api/business/properties/:id/detective/explain`: read-only server function, accepting a date; caller-supplied scores/financial figures are ignored.

Existing session, active membership, organisation and assigned-property checks run before every endpoint. Tenants cannot read aggregate mall data or invoke the explanation. The exported explanation function independently repeats access checks, so direct internal use cannot bypass them. Revocation blocks existing sessions. Dataset IDs, timestamps, source hash, tariff and 365 copied readings persist in the existing JSON store under explicit organisation/property identifiers; no MongoDB or authentication rewrite is introduced.

Python runs as a bounded JSON-lines worker over private standard input/output, spawned by Express without a shell. It has no HTTP listener, no API keys in its environment, no user-selected file paths and no direct frontend access. Model caching is bounded to eight training feature sets; pending requests are bounded. Missing Python dependencies or worker failure returns a retryable 503 and does not stop household routes. Gemini remains server-side, with a 30-second timeout and deterministic fallback.

## Python setup

The current machine has a project-local `.venv-detective` environment. Runtime versions verified: NumPy 2.5.3, pandas 3.0.6 and Scikit-learn 1.9.1. Matplotlib 3.11.2 was installed locally for prototype reproduction; inference does not import it.

For a fresh Windows checkout with a compatible Python (tested with Python 3.14):

```powershell
python -m venv .venv-detective
.\.venv-detective\Scripts\python.exe -m pip install -r server/python/requirements.txt
# Optional: reproduce the original chart as well as CSVs/metrics
.\.venv-detective\Scripts\python.exe -m pip install matplotlib==3.11.2
npm run dev
```

On other platforms, use `.venv-detective/bin/python`. The gateway auto-detects the local environment, with optional `SOLARIS_PYTHON` override; no existing environment file was edited. Python dependencies are pinned in `server/python/requirements.txt`. No Node/frontend dependencies were added.

## Validation commands

```powershell
.\.venv-detective\Scripts\python.exe scripts/verify-detective.py
.\.venv-detective\Scripts\python.exe server/python/test_savings_detective.py
npx tsx scripts/test-detective.ts
npx tsx scripts/test-detective.ts --live-helios
npx tsx scripts/test-economics.ts
npm run test:energytwin
npm test
npm run lint
npm run build
```

Python tests cover saved prediction/score agreement, missing data, money-safe rounding, load caps, positive/negative impact, label leakage, training/evaluation separation, invalid inputs and an entirely missing evaluation period. API tests use a unique temporary store and cover actual inference, idempotent persistence, forged body IDs, cross-organisation denial, tenants, facility assignment, direct explanation RBAC, revoked memberships and existing household state.

Validation completed: **8 Python tests, 10 Savings Detective API acceptance checks and 45 existing core/EnergyTwin/Economics Studio checks passed**. Type checking and the production build passed. Live Gemini acceptance also passed with a completed (`STOP`) response; truncated or empty responses are rejected in favour of the deterministic explanation. Existing Vite configuration and bundle-size warnings remain.

The production-build browser walkthrough also passed: isolated mall demo login → Savings Detective → property-owned synthetic dataset → generation chart → highlighted-day selection → changing financial statements → complete Gemini explanation. Chart selection was checked for 30 August, list selection for 29 August, and unknown impact for the missing 18 October reading. Worker requests have a bounded 45-second allowance to accommodate cold Python startup; a shorter startup allowance failed during verification and was increased before the final passing API run.

Gemini uses low thinking effort for this evidence-summary task, consistent with the [Gemini thinking guidance](https://ai.google.dev/gemini-api/docs/thinking). The server checks completion before showing generated text; the model never calculates or replaces the evidence shown in the dashboard.

## Implemented versus simulated

**Implemented:** actual Python/Scikit-learn inference behind scoped APIs; persisted property-specific datasets; interactive generation/score charts, anomaly selection, financial detail, filters, loading/empty/error states, model provenance, Gemini explanations and offline fallback.

**Simulated:** the supplied solar readings, independent weather-like expected baseline, injected evaluation truth and ₹9/kWh tariff. The same reference template may be explicitly copied to another authorised property, but it receives a separate owned dataset; it never claims to be that property's real readings.

**Not implemented/validated for production:** live inverter or meter ingestion, real weather/irradiance baseline, retraining/drift monitoring, real-site seasonal validation, exact fault diagnosis, actual utility-bill loss, official credits, alerts or automated corrective actions. The supplied synthetic precision/recall does not establish real-world reliability.

## Files for this integration

- `.gitignore` — exclude local Python environments and bytecode.
- `server/businessApi.ts` — register scoped routes and permit assigned managers' read-only explanations.
- `server/businessStore.ts` — optional property-owned dataset collection.
- `server/detectiveApi.ts` — dataset/report endpoints and `explain_savings_anomaly`.
- `server/detectiveWorker.ts` — private bounded Python worker bridge.
- `server/python/savings_detective.py` — reusable validated inference and deterministic monetary accounting.
- `server/python/requirements.txt` — pinned runtime dependencies.
- `server/python/test_savings_detective.py` — model and numerical tests.
- `src/types/detective.ts` — shared report and dataset types.
- `src/components/commercial/SavingsDetective.tsx` and `savings-detective.css` — presentation and existing API-client integration.
- `src/pages/CommercialPage.tsx` — navigation and feature mounting.
- `scripts/verify-detective.py` and `scripts/test-detective.ts` — reproduction and API acceptance tests.
- `docs/savings-detective.md` — this walkthrough and implementation report.

Earlier uncommitted Economics Studio and frontend redesign changes were retained. No supplied prototype files, residential components, existing credentials or environment files were modified by this integration.
