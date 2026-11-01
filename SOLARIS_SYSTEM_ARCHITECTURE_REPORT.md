# SOLARIS — System Architecture, Technical Specification & Verification Report

**Document ID:** SOLARIS-ENG-SPEC-2026-v2.1  
**Project:** SOLARIS — Distributed Solar Resource Management & AI Asset Performance Platform  
**Target Geo & Jurisdiction:** National Capital Territory of Delhi, India  
**Applicable Regulations:** DERC Virtual Net Metering (VNM) Guidelines 2024, Group Net Metering (GNM), PM Surya Ghar Muft Bijli Yojana  
**Date:** November 1, 2026  

---

## Executive Summary

SOLARIS is a multi-tier clean energy platform designed to address the socio-economic and technical hurdles of distributed solar adoption in dense urban environments. It solves challenges spanning:
1. **B2C Residential Community Solar (VNM/GNM):** Equitable capitalisation, transparent billing reconciliation, and regulatory clearance under DERC Delhi distribution licenses (BRPL, BYPL, TPDDL).
2. **B2B Commercial Multi-Tenant Asset Management (EnergyTwin):** Interactive 3D WebGL digital twin modeling, consumption-weighted energy credit distribution, and tenant statement segregation.
3. **Weather-Aware Fault & Loss Intelligence (Savings Detective):** Separation of weather-induced solar yield suppression from true physical plant degradation using physics-based derating and unsupervised machine learning.
4. **Solar Asset Performance & Recovery Management (Solar Doctor):** End-to-end operational lifecycle (`Detect → Investigate → Quantify → Prioritise → Repair → Verify Recovery`) ensuring post-repair verification is backed by empirical data before ticket closure.
5. **Conversational Copilot (Helios):** A zero-hallucination, server-grounded energy reasoning assistant powered by Google Gemini 3.5 Flash with offline calculation fallback.

---

## 1. System Architecture & Topology

```
+--------------------------------------------------------------------------------------------------+
|                                    CLIENT TIER (React 19 + Vite 8)                               |
|   - B2C Community Solar Cockpit (Affordability Wizard, VNM Agreement, Digital Signatures)        |
|   - B2B EnergyTwin 3D Mall (React Three Fiber, 24-Store Mesh Raycasting, Floor Hierarchy)        |
|   - Solar Doctor APM (Incident Backlog, Avoided-Energy Impact, Repair ROI Scenarios)             |
|   - Proof of Recovery (Pre vs Post Weather-Adjusted PR Comparison & Signed PDF Exports)          |
|   - Role-Based Workspaces: Commercial Owner, Facility Manager, Tenant, Installer, Household      |
+--------------------------------------------------------------------------------------------------+
                                                 │
                                                 │ HTTPS / JSON REST (Bearer JWT Auth)
                                                 ▼
+--------------------------------------------------------------------------------------------------+
|                              APPLICATION & API TIER (Express + TypeScript)                       |
|   - Auth & Session Guard (server/businessStore.ts): Property membership & role isolation        |
|   - Solar Doctor Lifecycle API (server/solarDoctorApi.ts): Incident state machine & snapshots    |
|   - Deterministic Solar Engine (server/solarDoctorEngine.ts): Avoided cost, PR, ROI simulation   |
|   - Weather Detective API (server/weatherDetectiveApi.ts): Open-Meteo cache & physical baseline  |
|   - Economics Studio API (server/businessApi.ts): DCF, Payback, NPV, IRR calculation             |
|   - Background IPC Manager (server/detectiveWorker.ts): Stdio worker lifecycle & heartbeat       |
+--------------------------------------------------------------------------------------------------+
               │                                                 │
               ▼ (Bidirectional JSON-Lines Stdio IPC)            ▼ (External HTTPS Services)
+-----------------------------------------------+   +----------------------------------------------+
|     PYTHON MACHINE LEARNING INFERENCE WORKER  |   |            EXTERNAL SERVICES                 |
|   - Process: server/python/weather_detective  |   |   - Open-Meteo Historical Weather API        |
|   - Scikit-learn IsolationForest (250 trees)  |   |   - Google Gemini 3.5 Flash (Helios AI)      |
|   - Feature Scaling & Score Normalization     |   |   - MongoDB Atlas Managed Cluster            |
|   - Daylight Filtering & Zero-Division Guards |   +----------------------------------------------+
+-----------------------------------------------+
```

---

## 2. Technical Stack Selection & Justifications

### 2.1 Frontend Tier: React 19, TypeScript, Tailwind CSS v4, React Three Fiber
- **React 19 + TypeScript:** Chosen for strict compile-time type safety across complex regulatory schemas, financial structures, and role configurations. React 19's concurrent rendering prevents UI hitching during complex state recalculations.
- **Tailwind CSS v4:** Uses a CSS-first token configuration that eliminates JavaScript build-time runtime overhead, yielding sub-second Vite HMR and small bundle sizes.
- **React Three Fiber (R3F) & Three.js:** Powers the EnergyTwin commercial mall digital twin. R3F allows declarative React component lifecycles for 3D meshes, enabling raycasting and shop selection without manual WebGL canvas management.
- **`canvas-confetti` & Lucide Icons:** Lightweight visual feedback assets for onboarding milestones and enterprise data visualization.

### 2.2 Application Server Tier: Node.js 22+, Express, `tsx`, `decimal.js`
- **Node.js 22+ with ESM & Express:** High-throughput asynchronous I/O with minimal event-loop latency.
- **`decimal.js`:** Prevents IEEE-754 floating-point rounding errors (`0.1 + 0.2 = 0.30000000000000004`). In solar billing and multi-tenant credit distribution, floating-point drift can corrupt financial ledgers. All calculations are executed in integer paise.
- **`tsx` (TypeScript Execution Engine):** Executes TypeScript backend modules directly with esbuild speed, eliminating compilation lag during local development and test runs.

### 2.3 Machine Learning Inference Tier: Python 3.11, Scikit-learn, NumPy, Pandas
- **Why Python over Node-based ML (e.g., TensorFlow.js / ONNX)?**
  Unsupervised ensemble algorithms like Isolation Forests, along with robust statistical vector transformations, are mature and optimized in Scikit-learn and NumPy. Node.js ML ports lack comprehensive implementations of Isolation Forest with customizable tree-depth decision scoring and robust NaN handling.
- **Stdio JSON-Lines IPC vs HTTP/gRPC Microservices:**
  Rather than incurring the operational overhead and socket exhaustion of an auxiliary HTTP microservice or gRPC daemon, SOLARIS runs a persistent Python child process communicating via standard input/output (`stdin`/`stdout`) with newline-delimited JSON. This eliminates cold starts while keeping memory footprints below 85 MB.

### 2.4 Data Tier: MongoDB Atlas + Atomic Local JSON Store
- **Dual Persistence Strategy:** Production environments target MongoDB Atlas (`solaris-dev`), while local environments use an atomic file-persisted JSON database (`SOLARIS_DATA_FILE`).
- **Atomic File Swapping:** JSON writes use temporary file creation followed by atomic filesystem renames (`fs.renameSync`), preventing file corruption during process termination.

---

## 3. Core Algorithms & Mathematical Foundations

### 3.1 Physics-Informed Solar Yield Baseline Model
The expected generation $E_{\text{expected}}$ (kWh) is calculated by coupling global tilted plane-of-array irradiance ($G_{\text{poa}}$) with ambient temperature derating:

$$T_{\text{cell}}(t) = T_{\text{ambient}}(t) + \left(\frac{\text{NOCT} - 20}{800}\right) \times G_{\text{poa}}(t)$$

$$\eta_{\text{temp}}(t) = 1 - \gamma \cdot \left(T_{\text{cell}}(t) - 25^\circ\text{C}\right)$$

$$E_{\text{expected}}(t) = P_{\text{dc}} \times \left(\frac{G_{\text{poa}}(t)}{1000\,\text{W/m}^2}\right) \times \eta_{\text{temp}}(t) \times \eta_{\text{bos}}$$

**Parameter Defaults:**
- $P_{\text{dc}}$: Nominal installed array capacity (kWp)
- $\text{NOCT}$: Nominal Operating Cell Temperature ($45^\circ\text{C}$)
- $\gamma$: Photovoltaic temperature power coefficient ($0.0038 / ^\circ\text{C}$)
- $\eta_{\text{bos}}$: Balance-of-system efficiency factor ($0.84$, accounting for inverter thermal clipping, dust layer reflection, DC wiring drop, and MPPT tracking efficiency)
- **Zero-Division Protection:** For night or low-light hours ($G_{\text{poa}} < 10\,\text{W/m}^2$), $E_{\text{expected}}(t)$ evaluates to $0$ and ratio evaluation is suppressed.

---

### 3.2 Unsupervised Anomaly Scoring: Scikit-learn Isolation Forest
The machine learning pipeline processes normalized hourly features to detect anomalous degradation:

$$\vec{x}_t = \begin{bmatrix} 
\frac{E_{\text{actual}}(t) + \epsilon}{E_{\text{expected}}(t) + \epsilon} \\ 
I_{\text{grid\_actual}}(t) - I_{\text{grid\_expected}}(t) \\ 
\text{Normalized Generation Gap} 
\end{bmatrix}$$

- **Tree Ensembling:** 250 randomized isolation trees isolate anomalous feature combinations using orthogonal hyperplane cuts.
- **Anomaly Score Formulation:**
  $$s(x, n) = 2^{-\frac{\mathbb{E}(h(x))}{c(n)}}$$
  Where $\mathbb{E}(h(x))$ is the average path length across all isolation trees, and $c(n)$ is the average path length of an unsuccessful search in a binary search tree of size $n$:
  $$c(n) = 2 \ln(n - 1) + 0.5772156649 \text{ (Euler's constant)} - \frac{2(n - 1)}{n}$$
- **Thresholding:** Normal points yield $s < 0.5$; anomalies exhibit $s \ge 0.5$ (decision function $< 0$).
- **Weather Guarding Rule:** When rain or heavy overcast occurs ($G_{\text{poa}} < 120\,\text{W/m}^2$), actual yield drops naturally. The system flags this as **Weather Consistent** and suppresses anomaly creation. Sunny days with generation ratios below $0.65$ are marked as **Critical Anomalies**.

---

### 3.3 Zero-Shortfall Credit Reconciliation (Largest Remainder / Hare-Niemeyer)
When allocating community or multi-tenant credits across $M$ entities from a discrete solar pool of $S$ paise:

1. **Exact Quota:** For each tenant $k \in \{1, \dots, M\}$:
   $$q_k = S \times \frac{C_k}{\sum_{j=1}^M C_j}$$
   *(where $C_k$ is the billing period metered consumption).*
2. **Floor Allocation:** 
   $$a_k = \lfloor q_k \rfloor$$
3. **Remainder Tracking:** 
   $$r_k = q_k - a_k$$
4. **Surplus Reconciliation:** Calculate unassigned paise:
   $$\Delta = S - \sum_{k=1}^M a_k$$
5. Rank all entities by descending order of $r_k$, allocating $+1$ paisa to the top $\Delta$ entities.
6. **Mathematical Guarantee:**
   $$\sum_{k=1}^M a_k^* \equiv S \quad (\text{Exact zero-leak conservation})$$

---

### 3.4 Multi-Scenario Financial ROI & Discounted Cash Flow (DCF)
The Solar Doctor repair simulation evaluates Low, Base, and High payback scenarios based on repair quotation costs and estimated daily loss avoidance:

$$\text{Annual Avoided Loss} = 365 \times \text{Daily Loss (kWh)} \times \text{Tariff Rate (₹/kWh)} \times \text{Recovery Efficiency}$$

$$\text{Simple Payback (Years)} = \frac{\text{Quoted Repair Cost}}{\text{Annual Avoided Loss}}$$

$$\text{NPV} = -\text{CAPEX} + \sum_{y=1}^{T} \frac{\text{Net Cash Flow}_y}{(1 + r)^y}$$

*Internal Rate of Return (IRR) is computed iteratively via the Newton-Raphson method until $\text{NPV}(r) = 0$.*

---

### 3.5 Weather-Normalized Recovery Verification Engine
To prevent tickets being closed without proof of physical recovery, post-service generation is compared against pre-service baselines using weather-adjusted Performance Ratios ($PR$):

$$PR_{\text{period}} = \frac{\sum_{t \in \text{period}} E_{\text{actual}}(t)}{\sum_{t \in \text{period}} E_{\text{expected}}(t)}$$

$$\Delta PR = PR_{\text{post-service}} - PR_{\text{pre-service}}$$

- **Outcome Classification:**
  - $\Delta PR \ge +0.15$ with $\ge 5$ validated sunny days: **Improved / Recovered** (Eligible for closure).
  - $-0.05 \le \Delta PR < +0.15$: **No Clear Improvement**.
  - $\Delta PR < -0.05$: **Deteriorated**.
  - Valid post-service days $< 3$: **Insufficient Evidence** (Closure blocked by state engine).

---

## 4. AI Copilot (Helios): Architecture & Model Selection Analysis

### 4.1 Comparison: Why Google Gemini 3.5 Flash vs OpenAI Codex / GPT-4o / Claude

| Feature | Google Gemini 3.5 Flash (Helios) | OpenAI Codex / Legacy Code Models | OpenAI GPT-4o / Claude 3.5 Sonnet |
| :--- | :--- | :--- | :--- |
| **Primary Specialty** | High-speed analytical explanation, multimodal synthesis. | Code syntax generation and auto-completion. | General reasoning, long-form creative text. |
| **Solar Engineering Suitability** | **High.** Strong reasoning over tabular energy data and physics metrics. | **Low.** Designed to output programming code, not energy audits or tenant advice. | **Moderate.** Capable, but higher cost and higher latency for live dashboards. |
| **Time-to-First-Token (TTFT)** | **~250ms - 400ms.** Responsive on interactive dashboard cards. | Fast for completion, slow for conversational context. | **~800ms - 1500ms.** Noticeable UI delay during interactive clicks. |
| **Cost Efficiency** | Low token pricing per million tokens. | Specialized/legacy endpoint. | Premium frontier pricing. |
| **API Integration** | First-party `@google/genai` TypeScript SDK with structured types. | Deprecated in favour of broad GPT models. | OpenAI REST SDK. |

### 4.2 Hallucination Elimination: Server-Grounded Fact Injection
In clean energy FinTech, large language models must not perform arithmetic or invent numbers. SOLARIS uses a **Server-Grounded Guardrail**:
1. All mathematical, financial, and weather data is calculated deterministically on the server.
2. The server packages these calculations into an immutable context payload:
   ```json
   {
     "incidentId": "inc-2026-10-18",
     "dailyAvoidedLossPaise": 482000,
     "dailyAvoidedLossInr": 4820.00,
     "generationRatio": 0.58,
     "rootCause": "Inverter DC String Disconnect",
     "weatherStatus": "Sunny / Unclouded"
   }
   ```
3. Gemini is prompted strictly as an explainer of the provided payload.
4. If an API key is missing or the external service fails, the system seamlessly falls back to a deterministic template generator (`calculation-fallback`), ensuring continuous uptime.

---

## 5. Architectural Trade-offs & Engineering Decisions

```
+-----------------------------------+-----------------------------------+-----------------------------------+
| Architecture Decision             | Chosen Implementation             | Trade-Off / Rationalisation       |
+-----------------------------------+-----------------------------------+-----------------------------------+
| Python / Node Bridge              | Persistent Stdio JSON-Lines IPC   | Fast and self-contained; single-  |
|                                   |                                   | host deployment required.         |
+-----------------------------------+-----------------------------------+-----------------------------------+
| Route Navigation                  | Hash-based Routing (`/#/`)        | Avoids server-side URL rewrites;  |
|                                   |                                   | less optimal for public web SEO.  |
+-----------------------------------+-----------------------------------+-----------------------------------+
| Weather Data Source               | Open-Meteo Satellite Reanalysis   | Free API with no key required;    |
|                                   |                                   | slight delay vs on-site sensors.  |
+-----------------------------------+-----------------------------------+-----------------------------------+
| Database Tier                     | MongoDB + Atomic JSON Fallback    | Fast development and portability; |
|                                   |                                   | no relational foreign-key checks. |
+-----------------------------------+-----------------------------------+-----------------------------------+
| 3D Visualization                  | Client-Side WebGL / Three.js      | Rich interactive experience;      |
|                                   |                                   | higher GPU usage on low-end PCs.  |
+-----------------------------------+-----------------------------------+-----------------------------------+
```

---

## 6. Comprehensive Verification & QA Test Results

The SOLARIS test suite exercises all subsystems end-to-end:

```
[TEST SUMMARY: 100% SUITE EXECUTION]
-----------------------------------------------------------------------------------------
1. TypeScript Strict Type-Check (npm run lint)                 --> PASS (0 errors)
2. Economics Studio Suite (scripts/test-economics.ts)          --> 13 / 13 checks passed
   - Reference 200 kWp / 90 Lakh reproduce exactly              --> PASS
   - Nonnegative imports/exports, fixed charges unchanged       --> PASS
   - Negative returns never fabricate distributions             --> PASS
   - Role-Based Access Control (Tenant/Facility Mgr isolation)  --> PASS
3. Solar Doctor APM Suite (scripts/test-solar-doctor.ts)       --> 19 / 19 checks passed
   - Weather-consistent rain check (No false alarms)            --> PASS
   - Deterministic avoided-energy financial quantification      --> PASS
   - Repair ROI multi-scenario simulator                        --> PASS
   - Complete 9-step ticket lifecycle & immutable snapshots     --> PASS
   - Weather-adjusted pre/post performance ratio verification   --> PASS
4. Weather Detective Suite (scripts/test-weather-detective.ts) --> 10 / 10 checks passed
   - Python Isolation Forest IPC inference execution            --> PASS
   - Cache scoping by org, property, and coordinate bounds      --> PASS
5. Savings Detective Suite (scripts/test-detective.ts)         --> 10 / 10 checks passed
   - Truncated/empty AI response fallback resilience            --> PASS
   - Multi-tenant data segregation                              --> PASS
-----------------------------------------------------------------------------------------
TOTAL VERIFICATION PASS RATE: 52 / 52 Automated Suite Checks Succeeded (100%)
```

---

## 7. Future Strategic & Technical Roadmap

1. **Hardware Modbus/MQTT Telemetry Gateway:**  
   Replace synthetic simulation pollers with a real-time IoT gateway ingesting SunSpec-compliant inverter metrics (RS-485 to MQTT) directly into an Apache Kafka or Redis stream.
2. **Thermal & Drone Computer Vision:**  
   Deploy an edge-hosted YOLOv10 or Segment Anything Model (SAM) to ingest aerial drone thermal imagery for automated pinpointing of panel-level microcracks, hot spots, and localized bird droppings.
3. **Battery Energy Storage (BESS) Arbitrage:**  
   Extend the Economics Studio to optimize LiFePO4 battery dispatch against Delhi's Peak/Off-Peak Time-of-Day (ToD) industrial tariff differentials.
4. **Decentralised P2P Energy Settlement:**  
   Implement an on-chain or consortium-based cryptographically signed ledger for automated peer-to-peer VNM settlements across DISCOM boundary transformers.

---
*End of Technical Specification Report.*
