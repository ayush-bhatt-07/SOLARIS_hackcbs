CREATE TABLE IF NOT EXISTS meters (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id),
  shop_id TEXT,
  meter_type TEXT NOT NULL CHECK (meter_type IN ('MAIN_DISCOM', 'SHOP_SUBMETER')),
  masked_account_ref TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS meter_readings (
  id TEXT PRIMARY KEY,
  meter_id TEXT NOT NULL REFERENCES meters(id),
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  consumption_kwh REAL NOT NULL CHECK (consumption_kwh >= 0),
  source TEXT NOT NULL,
  synthetic INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS electricity_bills (
  id TEXT PRIMARY KEY,
  meter_id TEXT NOT NULL REFERENCES meters(id),
  billing_month TEXT NOT NULL,
  consumption_kwh REAL NOT NULL CHECK (consumption_kwh >= 0),
  energy_charge_inr REAL NOT NULL CHECK (energy_charge_inr >= 0),
  fixed_charge_inr REAL NOT NULL DEFAULT 0 CHECK (fixed_charge_inr >= 0),
  demand_charge_inr REAL NOT NULL DEFAULT 0 CHECK (demand_charge_inr >= 0),
  source_state TEXT NOT NULL CHECK (source_state IN ('SYNTHETIC', 'IMPORTED', 'CONFIRMED')),
  UNIQUE(meter_id, billing_month)
);

CREATE TABLE IF NOT EXISTS benefit_policies (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id),
  version INTEGER NOT NULL,
  policy_type TEXT NOT NULL,
  allocation_rules_json TEXT NOT NULL,
  effective_from TEXT NOT NULL,
  effective_to TEXT,
  status TEXT NOT NULL,
  UNIQUE(property_id, version)
);

CREATE TABLE IF NOT EXISTS tenant_statements (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL REFERENCES shops(id),
  policy_id TEXT NOT NULL REFERENCES benefit_policies(id),
  billing_month TEXT NOT NULL,
  consumption_kwh REAL NOT NULL,
  estimated_savings_inr REAL NOT NULL,
  benefit_basis TEXT NOT NULL CHECK (benefit_basis IN ('INTERNAL_ADJUSTMENT', 'OFFICIAL_DISCOM_VNM', 'PROJECTED')),
  agreement_status TEXT NOT NULL,
  UNIQUE(shop_id, billing_month, policy_id)
);

CREATE TABLE IF NOT EXISTS installer_profiles (
  id TEXT PRIMARY KEY,
  organisation_id TEXT NOT NULL REFERENCES organisations(id),
  service_areas_json TEXT NOT NULL,
  min_capacity_kwp REAL NOT NULL,
  max_capacity_kwp REAL NOT NULL,
  portfolio_json TEXT NOT NULL,
  synthetic INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS solar_quotes (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  installer_profile_id TEXT NOT NULL REFERENCES installer_profiles(id),
  capacity_kwp REAL NOT NULL,
  quoted_cost_inr REAL NOT NULL,
  assumptions_json TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_meter_readings_meter_period ON meter_readings(meter_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_bills_meter_month ON electricity_bills(meter_id, billing_month);
CREATE INDEX IF NOT EXISTS idx_statements_shop_month ON tenant_statements(shop_id, billing_month);
