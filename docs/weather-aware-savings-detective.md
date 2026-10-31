# Weather-aware Solaris Savings Detective

## Demo walkthrough

Open `http://127.0.0.1:8791/#/commercial` (the isolated review demo) or the existing development server. Choose **Savings Detective → Weather-aware AI → Run synthetic weather experiment**. The **Original reference model** remains available and retains its existing records/API behavior.

1. **Inspect a rainy day** selects **22 August 2025**. The backend reports approximately 206.3 kWh expected versus 205.7 kWh actual, 1.33 kWh/m² daylight irradiation, 96% cloud cover and 9.6 mm daylight precipitation. Ratio is 99.7%, decision score approximately +0.21678. The model status is **Consistent with weather**, not a fault alert. The signed avoided-charge difference is ₹5.32.
2. **Inspect sunny underperformance** selects **28 August 2025**. Expected is approximately 944.5 kWh, actual 385.0 kWh, irradiation 6.57 kWh/m² and cloud cover 12%. Actual/expected is 40.8%, decision score approximately −0.11872. The real Python model returns **INVESTIGATE**; the signed estimated avoided-charge shortfall is **₹2,730.42**.
3. Select chart points, table dates or the day selector to see matching solar/weather evidence. The daily irradiation graph distinguishes sunny/cloudy/rainy conditions. Missing solar, missing weather and meter inconsistency days have no production score or financial estimate. No absent readings are plotted as zero generation.
4. Choose **Ask Helios about this weather**. The read-only function uses the exact authorised analysis snapshot shown in the UI, not client-supplied expected kWh or a separately invented calculation. It explains weather-consistent low output versus unusual weather-normalised deviation and suggests checks without asserting a diagnosis.

All solar and weather data in this experiment are **synthetic**. The independently fetched Open-Meteo check is not joined to the invented solar data or presented as validation of that experiment.

## Real property weather analysis

The previous property model had neither coordinates nor hourly inverter data. No city-based coordinates or weather constants are silently assigned to a real property.

1. A property owner opens **Property coordinates, system assumptions & hourly import** and enters latitude, longitude, IANA timezone, capacity and performance ratio. Optional pairs are tilt/azimuth and power temperature coefficient/NOCT. These settings are versioned separately from existing EnergyTwin/financial planning inputs.
2. Import a JSON array containing the actual property's hourly records. `timestamp` is the **UTC epoch-second end of a one-hour interval**. Fields `actualKwh`, `loadKwh`, `gridImportKwh` are hourly energy, not instantaneous kW or cumulative meter counters. Use `null` when a value is unavailable. The importer sends batches of at most 168 records and upserts by timestamp. Already accepted batches remain stored if a later batch fails; retrying the same timestamps is safe. Maximum is 9000 records across 367 days.

```json
[
  {"timestamp":1755718200,"actualKwh":null,"loadKwh":null,"gridImportKwh":null},
  {"timestamp":1755721800,"actualKwh":null,"loadKwh":null,"gridImportKwh":null}
]
```

This is a schema example with unknown readings, not a scored demo. Use genuine authorised interval data for the property path.

3. **Fetch Open-Meteo & analyse property readings** derives coordinates from the saved authorised property and dates from its stored readings. It requests historical ERA5 hourly shortwave radiation, cloud cover, precipitation, air temperature and day/night status, plus GTI when both orientation fields exist. It uses no browser-supplied location or provider URL.
4. A short dataset can show a physical baseline with explicit **INSUFFICIENT_TRAINING** status. IF scoring requires over 220 chronological calendar days and at least 90 complete training days. No synthetic history or fitted model is substituted when history is insufficient.
5. Reanalysis/modelled weather estimates, provider retrieval time, grid coordinates, units, baseline assumptions and source warnings are displayed. Real-data accuracy metrics remain **unvalidated**, because uploaded readings have no verified fault labels.

This is a manual hourly-data integration, not a live inverter connector or a weather station. User-provided readings and system assumptions are not independently certified by Solaris. Provider account/licensing requirements must be reviewed before a commercial deployment; the live check used the public historical endpoint for the hackathon reference coordinates.

## Time matching and weather provenance

The implementation follows the [Open-Meteo Historical Weather documentation](https://open-meteo.com/en/docs/historical-weather-api). Radiation values are preceding-hour means in W/m²; precipitation is a preceding-hour sum in mm; temperature is an air-temperature sample in °C. Timestamps are requested as UTC epoch seconds and converted using the property's IANA timezone. Interval-end minus one second determines the local energy day, preserving 23/25-hour DST days. Equivalent IANA aliases are accepted.

GTI uses supplied tilt (0–90°) and provider azimuth convention (0° south, −90° east, +90° west). Provider GTI is itself an estimate with an isotropic-sky/albedo assumption. Unknown orientation uses a labelled, uncertain GHI proxy; it does not invent an orientation.

Weather cache keys include organisation, property, coordinates, requested date range, model, timezone, variable set and orientation. Responses persist in the existing application store. Cache lifetime is seven days; stale responses are not silently used after provider failure. Old entries are pruned/bounded. Provider errors, unexpected units, invalid timestamps and malformed responses surface as retryable errors. Null/out-of-range weather values remain unavailable and cause data-quality exclusion. Synthetic weather is never a production fallback.

Live integration check: a three-day Delhi reference request returned **72 ERA5 hours**, timezone `Asia/Kolkata`, and validated W/m², %, mm and °C units, including GTI. This verifies retrieval/normalisation, not real-site prediction accuracy.

## Physical baseline and numerical accounting

Baseline version: `pv-hourly-pr-noct-1`.

```text
expected_hour_kWh = capacity_kWp × irradiation_W_per_m2 / 1000 × 1 hour
                    × performance_ratio × temperature_factor

cell_temperature ≈ air_temperature + (NOCT − 20) / 800 × irradiation
temperature_factor = max(0, 1 + coefficient × (cell_temperature − 25))
```

The STC irradiance reference is 1 kW/m². PR represents other losses, excluding the explicit temperature correction. Temperature correction is applied only when the owner supplies its complete parameter pair; instantaneous air temperature is an approximation for the hourly condition, not measured module temperature. No inverter clipping, detailed shading, wind cooling or validated site calibration is claimed.

Nighttime and radiation under 20 W/m² are excluded. Every scored local day must have complete hourly intervals and sufficient weather/solar/load/import evidence for every daylight interval. Missing data is not zero-filled. A main-meter balance inconsistency beyond max(1 kWh, 2% of hourly load) excludes the day; the balance assumes no batteries or other generators.

Residual is actual minus expected generation; ratio is actual/expected. Financial difference sums hourly `min(load, expected)` minus `min(load, actual)` avoided energy charges at the saved tariff (₹9/kWh in the synthetic experiment), with each charge rounded half-up to integer paise. Exports do not automatically reduce imports. Fixed/demand charges, taxes, export settlement and tenant sharing are excluded. Unknown/untrusted evidence produces null monetary estimates.

## Model comparison

Model version: `weather-iforest-1`. Seeded synthetic experiment: generator seed 2026; 365 days / 8760 hourly records, including normal sunny/rainy/cloudy output, sunny underperformance, gradual degradation, missing readings/weather and meter inconsistency. The first 220 days fit the scalers/forests; the final 145 days are held out. Three quality-excluded days leave 142 eligible evaluation days, with 22 labelled underperformance cases.

Normalised IF features are ratio minus one, generation residual divided by capacity, and hourly-matched import residual divided by expected generation. Ground-truth labels/scenario names never feed expected generation, feature fitting or model decisions. Held-out changes cannot change the training fit.

| Method | Precision | Recall | F1 | False positives | Rain/cloud false alerts |
|---|---:|---:|---:|---:|---:|
| Original IF algorithm / fixed clear-day baseline | 31.9% | 100% | 0.484 | 47 | 5 |
| Weather-normalised IF | 75.9% | 100% | 0.863 | 7 | 3 |
| Predeclared weather-adjusted ratio < 0.8 threshold | 100% | 86.4% | 0.927 | 0 | 0 |

These are synthetic results, not real-world accuracy. The simple threshold has fewer false positives and misses three milder cases; the dashboard shows this trade-off. Weather-aware IF still produces false alerts, so it is not presented as eliminating them.

The original supplied prototype already used a synthetic weather-like expectation. Comparator A therefore explicitly reuses its two-feature/scaler/250-tree/seed-42 IF algorithm against a training-only fixed clear-day expectation to make it weather-unaware. It is an adapted comparator, not a claim that the old prototype had no weather information. The separate original-reference mode, supplied CSVs and original reproduction tests remain intact.

## Helios and access control

New routes remain below `/api/business/properties/:id/detective/weather`:

- `GET /`: site configuration and existing synthetic report.
- `POST /demo`: owner-only synthetic experiment seed/rerun.
- `PUT /site`: owner-only validated configuration.
- `POST /readings`: owner-only hourly imports.
- `POST /analyse`: assigned owner/manager property analysis using real provider retrieval or a valid scoped cache.
- `POST /explain`: read-only weather-aware explanation.

All routes reuse active session, organisation and property membership middleware. Tenants cannot read aggregate property/weather data. Assigned facility managers can read/analyse/explain but cannot change site settings, seed datasets or import readings. Direct calls to `explain_weather_savings_anomaly` independently enforce membership and assignment. Revoked memberships and foreign organisations are denied before data/provider access.

Analysis snapshots are bounded and expire after 30 minutes. Their report ID, organisation/property, source mode, dataset version and site version are checked before explaining. Changed inputs require rerunning analysis. Solar-record hashes, model/baseline versions, source and settings version support reproduction. Gemini receives selected server-calculated evidence, never instructions to invent expected kWh. Incomplete Gemini outputs are rejected; provider unavailability uses a labelled deterministic explanation.

The live weather-specific Gemini test encountered provider HTTP 429. It is therefore **not claimed to have passed live**. Rainy/sunny deterministic explanations and snapshot ownership were verified, and the same Gemini integration can be retested when quota is available.

## Verification

```powershell
.\.venv-detective\Scripts\python.exe server/python/test_weather_detective.py
npx tsx scripts/test-weather-detective.ts
npx tsx scripts/check-open-meteo.ts
# Requires available Gemini quota:
npx tsx scripts/test-weather-detective.ts --live-helios
```

The ten Python weather tests cover the rainy/sunny flow, reproducible comparisons, irradiation/temperature/GTI units, missing data, meter inconsistencies, no actual-to-expected leakage, no label/test leakage, nighttime exclusion, interval-matched money, DST and insufficient history. The ten API acceptance checks cover actual Python inference, source separation, property-owned settings/imports, provider errors/units/timezones, scoped caching, unvalidated real-data metrics, expired/changed snapshots, tenants, managers, foreign organisations, revocation and residential state.

The existing 63 core/EnergyTwin/Economics/original-Detective/Python checks also remain relevant. Production build and type checking use `npm run build` and `npm run lint`. No Node or Python package dependencies or environment files were changed for this upgrade; it reuses Scikit-learn, NumPy, pandas, standard-library timezone support and native server fetch.

Completed validation: **83 automated checks passed** (10 weather Python, 10 weather API, 63 existing regression checks), plus type checking, production build and Git whitespace checking. The supplied prototype CSV hash remains unchanged. The live Open-Meteo retrieval check passed. Browser review confirmed the rainy-day non-alert and sunny-day model alert with changing matched weather/solar figures. The separate live weather-Gemini acceptance command did not pass because of provider HTTP 429; deterministic explanation checks passed.

The final browser walkthrough also displayed the selected sunny-day Helios fallback: expected 944.5 kWh, actual 385.0 kWh, irradiation 6.57 kWh/m² and ₹2,730.42 signed avoided-charge difference. It explicitly described investigation evidence rather than a confirmed fault and labelled both synthetic data and Gemini unavailability.

## Files changed for this upgrade

- `server/historicalWeather.ts`: Open-Meteo adapter, units/timezone checks and scoped cache.
- `server/weatherDetectiveApi.ts`: scoped datasets/settings/import/analysis, snapshots and Helios.
- `server/python/weather_detective.py`: synthetic experiment, physical estimator, quality checks and three-model comparison.
- `server/python/test_weather_detective.py`: new model/numerical tests.
- `scripts/test-weather-detective.ts`, `scripts/check-open-meteo.ts`: isolated API and live-provider checks.
- `src/types/weatherDetective.ts`: shared weather/site/report types.
- `src/components/commercial/WeatherDetective.tsx`, `weather-detective.css`: dashboard, settings, imports and explanations.
- `src/components/commercial/SavingsDetective.tsx`: mode wrapper retaining the original reference view.
- `src/types/commercial.ts`: optional property-owned weather configuration.
- `server/businessStore.ts`: optional scoped weather datasets/cache collections.
- `server/businessApi.ts`: register routes and narrow read-only manager exceptions.
- `server/detectiveWorker.ts`, `server/python/savings_detective.py`: new private worker operations, preserving original operations.
- `docs/weather-aware-savings-detective.md`: this report.

Earlier uncommitted work remains intact. No residential business logic, credentials, original prototype files or MongoDB configurations were changed. Production readiness still requires validated meter/inverter ingestion, site-specific baseline calibration, verified normal training history, real labelled fault evaluation, drift monitoring and provider operational arrangements.
