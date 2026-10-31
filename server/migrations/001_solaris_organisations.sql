-- Migration-ready SQLite schema. The current demo API uses deterministic in-memory
-- fixtures; this schema is the first persistence boundary and preserves tenant keys.
CREATE TABLE IF NOT EXISTS organisations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('HOUSING_SOCIETY', 'COMMERCIAL_PROPERTY', 'SOLAR_INSTALLER')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS memberships (
  user_id TEXT NOT NULL,
  organisation_id TEXT NOT NULL REFERENCES organisations(id),
  role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  PRIMARY KEY (user_id, organisation_id)
);

CREATE INDEX IF NOT EXISTS idx_memberships_organisation ON memberships(organisation_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user_role ON memberships(user_id, role);

CREATE TABLE IF NOT EXISTS properties (
  id TEXT PRIMARY KEY,
  organisation_id TEXT NOT NULL REFERENCES organisations(id),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  synthetic INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_properties_organisation ON properties(organisation_id);

CREATE TABLE IF NOT EXISTS shops (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id),
  organisation_id TEXT NOT NULL REFERENCES organisations(id),
  floor INTEGER NOT NULL CHECK (floor > 0),
  name TEXT NOT NULL,
  tenant_user_id TEXT,
  benefit_status TEXT NOT NULL DEFAULT 'unconfigured'
);

CREATE INDEX IF NOT EXISTS idx_shops_property ON shops(property_id);
CREATE INDEX IF NOT EXISTS idx_shops_tenant ON shops(tenant_user_id);
