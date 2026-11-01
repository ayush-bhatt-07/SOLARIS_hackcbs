# SOLARIS 2.0 — SOLAR DOCTOR IMPLEMENTATION
## AI-Powered Solar Loss-to-Recovery Intelligence

### 1. Executive Summary & Core Differentiator
Commercial rooftop solar systems frequently underperform due to weather variations (rain, cloud cover, seasonal irradiance swings) as well as genuine physical issues (panel soiling, inverter faults, loose DC strings, shading, equipment degradation). 

Traditional monitoring tools either trigger false alarms on stormy days or report raw kWh drops without evidence or financial translation. Furthermore, existing maintenance software treats ticket completion as proof of recovery without verifying performance afterward.

**Solar Doctor** closes this operational and financial loop with the **Solar Doctor Recovery Loop**:
$$\text{Detect} \longrightarrow \text{Investigate} \longrightarrow \text{Quantify} \longrightarrow \text{Prioritise} \longrightarrow \text{Repair} \longrightarrow \text{Verify Recovery}$$

---

### 2. Architecture & Tech Stack

```
+--------------------------------------------------------------------------------------------------+
|                                    SOLARIS 2.0 FRONTEND (React 19 + Vite)                        |
|   - Solar Doctor Overview (Health, Active Anomalies, Avoided-Cost Impact, Open Tickets)          |
|   - Anomaly Detail & Weather-Adjusted Generation Comparison Chart                                |
|   - Repair ROI Simulator (Deterministic Low / Base / High scenarios)                             |
|   - Maintenance Ticket Workflow (Audit trail, quotes, inspections, completion evidence)          |
|   - Proof of Recovery View (Pre vs Post weather-adjusted performance ratio, report export)       |
|   - EnergyTwin 3D Mall Scene with plant-level rooftop health alerts & 2D floor fallback          |
|   - Installer Workspace (/installer) with strict tenant-data & financial isolation              |
+--------------------------------------------------------------------------------------------------+
                                                 │
                                                 ▼ (HTTP / REST + Bearer Session)
+--------------------------------------------------------------------------------------------------+
|                                  EXPRESS + TYPESCRIPT BACKEND (Port 8787)                        |
|   - server/businessApi.ts: RBAC routing, organisation isolation, tenant submeter protection      |
|   - server/solarDoctorApi.ts: Doctor overview, incidents, repair simulation, ticket lifecycle    |
|   - server/solarDoctorEngine.ts: Pure deterministic financial & verification calculation engine   |
|   - server/weatherDetectiveApi.ts: Open-Meteo caching, solar baseline, weather normalization     |
|   - server/detectiveWorker.ts: Async IPC child process worker manager                             |
|   - server/db/connection.ts: MongoDB Atlas connection manager (solaris_dev) with DNS fallback    |
+--------------------------------------------------------------------------------------------------+
               │                                                 │
               ▼ (Stdio JSON-Lines IPC)                          ▼ (HTTPS / API)
+-----------------------------------------------+   +----------------------------------------------+
|     PYTHON MACHINE LEARNING INFERENCE SERVICE |   |            EXTERNAL SERVICES                 |
|   - server/python/weather_detective.py        |   |   - Open-Meteo Historical Weather API        |
|   - server/python/savings_detective.py        |   |   - Google Gemini 3.5 Flash (Helios AI)      |
|   - Scikit-learn IsolationForest (250 trees)  |   |   - MongoDB Atlas Cluster                    |
|   - Feature scaling & score normalization     |   +----------------------------------------------+
+-----------------------------------------------+
```

---

### 3. Detailed Data Flow

1. **Weather Ingestion & Baseline Estimation:**
   * Open-Meteo historical weather data (GHI, direct/diffuse radiation, cloud cover, temperature, precipitation) is ingested and cached with strict data provenance.
   * A deterministic physical baseline calculates expected solar generation based on installed kWp, irradiance, and temperature derating.
   * Daylight hours with near-zero irradiance are protected against zero-division errors.
   * Rainy/cloudy days produce naturally lower expected generation; therefore, low generation on a stormy day results in a normal actual-to-expected ratio and is **never** flagged as a fault.

2. **Isolation Forest Anomaly Scoring:**
   * Features fed to the Scikit-learn `IsolationForest` pipeline:
     - `generation_ratio = actual_generation_kwh / expected_generation_kwh`
     - `import_residual_kwh = grid_import_kwh - expected_grid_import_kwh`
   * Anomalies are identified by decision score threshold crossing ($< 0$).
   * Missing meter data is explicitly classified as `MISSING_DATA` and never conflated with zero generation or equipment failure.

3. **Deterministic Financial Loss Quantification:**
   * Underperformance is valued at the property's configured avoided import tariff (default ₹9.00/kWh) using exact integer-paise arithmetic:
     $$\text{Shortfall kWh} = \max(0, E_{\text{expected}} - E_{\text{actual}})$$
     $$\text{Daily Financial Impact} = \text{Shortfall kWh} \times \text{Tariff Rate}$$
   * The financial impact is explicitly presented as an avoided-energy-charge estimate, distinct from an audited utility statement. Fixed charges, demand charges, and taxes are excluded.

4. **Severity Prioritisation:**
   * Alerts are categorised into `Critical`, `High`, `Medium`, and `Low` based on financial impact, anomaly persistence, inverter safety flags, and data completeness.
   * Sunny days with severe unexplained generation drops receive `Critical` priority.

5. **Maintenance Ticket Lifecycle:**
   * Operators can create draft tickets from anomalies with immutable snapshots of evidence and financial estimates.
   * Lifecycle states: `Draft` $\rightarrow$ `Submitted` $\rightarrow$ `Assigned` $\rightarrow$ `Accepted` $\rightarrow$ `Inspection Scheduled` $\rightarrow$ `Inspection Completed` $\rightarrow$ `Quote Submitted` $\rightarrow$ `Approved` $\rightarrow$ `In Progress` $\rightarrow$ `Work Completed` $\rightarrow$ `Verification Pending` $\rightarrow$ `Verified` / `Closed` / `Reopened`.
   * Operators review and approve quotations; installers cannot self-approve or self-verify.

6. **Installer Workspace Isolation:**
   * Authorized installers log in via `/installer`.
   * RBAC restricts installers to assigned tickets only: property financial statements, tenant benefit splits, and unrelated properties are strictly stripped.
   * Installers submit inspection findings (`Observed`, `Possible`, `Confirmed`), itemised quotes, and completion evidence.

7. **Proof of Recovery Engine:**
   * Ticket closure does **not** equal plant recovery.
   * Post-service readings (minimum 3–7 daylight days) are normalised against weather-adjusted expectations and compared with pre-service performance:
     $$\Delta \text{PR} = \text{PR}_{\text{after}} - \text{PR}_{\text{before}}$$
   * Possible verification outcomes: `Improved`, `No clear improvement`, `Deteriorated`, `Insufficient evidence`.
   * Clear disclaimer: improvement indicates performance change, not absolute scientific proof of single-factor causation.

8. **Helios AI Assistant:**
   * Server-side Gemini integration acts as a grounded, read-only diagnostic explainer.
   * Injects strictly server-calculated numbers (never allows the LLM to invent figures or approve tickets).
   * Tone is professional, evidence-based, with occasional light solar humour.

---

### 4. Security & RBAC Enforcement

| Role | Permitted Actions | Prohibited Actions |
| :--- | :--- | :--- |
| **Property Owner** | Full commercial access, property configuration, quote approval, ticket creation & closure, scenario saving | Cannot view other commercial properties |
| **Facility Manager** | Run simulations, explore scenarios, acknowledge/suppress alerts, submit service requests | Cannot approve quotes, change property ownership policy, or delete properties |
| **Shop Tenant** | View own submeter reading and tenant benefit statement | Cannot access mall solar plant status, doctor alerts, tickets, or other tenant statements |
| **Solar Installer** | View assigned tickets, submit inspection findings, upload quotes, record completion | Cannot view property financial ledgers, tenant allocations, or unassigned tickets |
| **Household User** | Residential state management and community solar participation | Strictly prohibited from commercial doctor and installer endpoints (HTTP 403) |

---

### 5. Automated Test Suite

The feature is protected by comprehensive test suites:
* `scripts/test-solar-doctor.ts`: 19/19 checks passing (Authentication, RBAC isolation, financial arithmetic, ticket lifecycle, proof of recovery verification, quotation rejection, and deep evidence snapshotting).
* `scripts/test-weather-detective.ts`: 10/10 checks passing (Open-Meteo cache scoping, hourly alignment, rainy vs sunny anomaly separation, provider error handling).
* `scripts/test-detective.ts`: 10/10 checks passing (Python worker IPC, reproducible Scikit-learn inference, cross-organisation rejection).
* `scripts/test-energytwin.ts`: 20/20 checks passing (Mall geometry mapping, shop submeter consistency, tenant statement protection).
* `scripts/test-economics.ts`: 13/13 checks passing (Deterministic integer-paise calculations, versioned scenarios, NPV/IRR).
* `scripts/test-db-connection.ts`: All checks passing (Mongoose schemas, MongoDB Atlas live connectivity).
