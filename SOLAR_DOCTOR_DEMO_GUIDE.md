# SOLARIS 2.0 — SOLAR DOCTOR DEMO GUIDE
## Judge-Facing End-to-End Walkthrough of the Loss-to-Recovery Loop

This guide walks through the complete **Solar Doctor Recovery Loop**:
$$\text{Detect} \longrightarrow \text{Investigate} \longrightarrow \text{Quantify} \longrightarrow \text{Prioritise} \longrightarrow \text{Repair} \longrightarrow \text{Verify Recovery}$$

---

### Prerequisites & Starting the Application

1. In PowerShell, start the development server:
   ```powershell
   npm run dev
   ```
2. Open your browser to [**http://localhost:3000**](http://localhost:3000).

---

### Step-by-Step Demonstration Script

#### Scene 1: Mall Operator Login & Detection
1. On the landing page, click **MSME & Malls Login** (or choose "Malls & Businesses").
2. Click **One-Click Demo Mall Owner** to enter the commercial workspace.
3. In the navigation bar, click on **Solar Doctor**.
4. **Observe:**
   * **Solar Health Status:** "Investigation recommended" or "Monitor".
   * **Active Anomalies:** Identifies abnormal generation days with weather adjustment.
   * **Weather Intelligence:** Notice that a rainy day with 180 kWh output is **not** flagged as an anomaly because its weather-adjusted expectation was also low.
   * **Sunny Day Alert:** A clear sunny day with only 380 kWh output against an expected 850 kWh is highlighted in **Critical red**.

#### Scene 2: Investigation & Grounded Evidence
1. Click on the flagged sunny day in the **Actual vs Weather-Adjusted Generation** chart.
2. Review the **Investigation Panel**:
   * **Observed Evidence:** "Generation was 55% below weather-adjusted expectation."
   * **Data Quality:** Confirmed valid meter readings (not a missing-data gap).
   * **Inverter Diagnostics:** Warning indicates DC string voltage dropped below threshold.
   * **Evidence Level:** Clearly distinguishes *Observed* facts from *Possible* causes (e.g., loose DC string or panel soiling).

#### Scene 3: Deterministic Financial Quantification
1. Inspect the **Avoided-Cost Loss Calculation**:
   * Daily shortfall: $\approx 470\text{ kWh}$.
   * Financial valuation: $\approx ₹4,230\text{/day}$ under property's configured ₹9.00/kWh tariff.
   * Disclaimer: Explains that this is an avoided-energy-charge estimate, not an audited utility bill loss.

#### Scene 4: Grounded Helios AI Diagnostic
1. In the Solar Doctor panel or floating widget, click **Ask Helios**:
   > *"Why was this sunny day flagged and what is the financial impact?"*
2. **Observe Helios's response:**
   * Grounded purely in server-side evidence.
   * Cites the exact numbers (380 kWh vs 850 kWh, ₹4,230 shortfall).
   * Explains that weather conditions were favorable, eliminating weather as the excuse.
   * Notes that Helios cannot self-approve repairs or diagnose internal faults with certainty.

#### Scene 5: Repair ROI Simulator
1. Scroll down to the **Repair ROI Simulator**.
2. Select proposed action: **"Inverter & DC String Inspection"**.
3. Adjust estimated cost (e.g., ₹18,000) and expected recovery percentage (80%).
4. **Observe:** The deterministic low / base / high ROI projection calculates expected monthly recovered savings and simple payback period in months.

#### Scene 6: Maintenance Request Creation
1. Click **Create Maintenance Request**.
2. Review the pre-populated ticket with immutable evidence snapshots.
3. Select the authorized synthetic service partner: **"SunGrid Solar Solutions"**.
4. Click **Submit Request**. The ticket status transitions to **"Submitted"** and then **"Assigned"**.

#### Scene 7: Role-Separated Installer Workflow
1. In the top-right user menu, click **Log Out**.
2. On the login page, select **Solar Installer Workspace** $\rightarrow$ click **One-Click Demo Installer**.
3. **Observe Installer RBAC:**
   * The installer sees the assigned ticket for Solaris Mall.
   * Property financial ledgers and tenant statements are **completely hidden**.
   * Only operational and physical evidence is visible.
4. The installer clicks **Accept Work** $\rightarrow$ schedules the inspection.
5. Enter inspection findings:
   * Findings: *"Loose MC4 connector identified on String 3 of Inverter 1; reseated connector and cleaned module surface."*
   * Classification: **Confirmed**.
6. Submit quotation: ₹18,000.
7. Click **Start Work** $\rightarrow$ submit completion evidence $\rightarrow$ **Mark Work Completed**.

#### Scene 8: Proof of Recovery Verification (The Flagship Closer)
1. Log out of installer $\rightarrow$ log back in as **Demo Mall Owner**.
2. Navigate back to **Solar Doctor** $\rightarrow$ open the completed ticket.
3. The operator reviews the installer's inspection notes and approved quote.
4. Click **Run Recovery Verification**:
   * Compares 7-day weather-adjusted performance before maintenance against post-maintenance days.
   * **Verification Outcome:** **"Improved"** (+18.4 percentage-point increase in normalized Performance Ratio).
   * **Financial Benefit:** Confirms incremental avoided energy savings recovered.
   * **Methodological Integrity:** Displays clear disclaimers that before/after improvement indicates performance recovery, but does not constitute single-variable scientific proof of causation.
5. Click **Download Verification Report** for an executive PDF/text report ready for management review.

#### Scene 9: EnergyTwin Integration
1. Click **EnergyTwin** in the top navigation.
2. In the 3D mall visualization, the rooftop solar array status indicator reflects the verified health state.
3. Clicking the rooftop plant banner directly opens the verified Solar Doctor audit record.
