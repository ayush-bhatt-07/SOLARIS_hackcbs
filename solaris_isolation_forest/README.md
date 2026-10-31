# Solaris Savings Detective — Isolation Forest MVP

Synthetic educational prototype for a single mall solar system. **Not trained or validated on real mall data.**

## Run
`pip install -r requirements.txt`
`python train_savings_detective.py`

## Files
- `synthetic_daily_solar.csv`: 365 synthetic days; first 220 are model fitting; last 145 evaluation (one missing reading).
- `scored_evaluation.csv`: evaluation period with Isolation Forest score, status and ground-truth anomaly label.
- `evaluation_metrics.json`: reproducible held-out precision/recall/F1 and confusion matrix.
- `savings_detective_chart.png`: generation comparison and avoided-cost gap.

## Model inputs
- `generation_ratio = actual_generation_kwh / expected_generation_kwh`
- `import_residual_kwh = grid_import_kwh - expected_grid_import_kwh`

Expected generation here is synthetically constructed using seasonal and weather-like factors. Production: use measured irradiation/ambient conditions, installed capacity, shading/derate and a properly validated PV baseline. Never use actual generation to derive the expected baseline.

## Inference
`predict = -1` means flagged as unusual; `decision_function < 0` means it crosses fitted threshold. The model **does not diagnose faults** and its scores are not probabilities. Missing data is handled separately as `MISSING_DATA`. The observed financial gap is computed deterministically at an illustrative ₹9/kWh avoided energy charge; it is not the full utility-bill difference.

## Production adaptation
Replace synthetic files with authorised, timestamped inverter/meter data and credible weather-adjusted expected PV estimates; retain units, timezone and source. Use historical *normal* data for baseline fitting, evaluate by time/season and site, incorporate consistent interval profiles, monitor drift and verify alerts with facility staff. Use backend authorisation on every project-specific query and only send scoped, necessary evidence to Gemini/Helios for narrative explanations.
