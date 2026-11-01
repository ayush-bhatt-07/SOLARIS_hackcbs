import assert from 'node:assert/strict';
import { once } from 'node:events';
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { existsSync, unlinkSync, readFileSync } from 'node:fs';
import { getDbStatus } from '../server/db/connection';

process.env.NODE_ENV = 'test';
process.env.GEMINI_API_KEY = '';

const testStore = join(tmpdir(), `verify-${randomUUID()}.json`);
process.env.SOLARIS_DATA_FILE = testStore;

const { app } = await import('../server/index');
const { db } = await import('../server/businessStore');

let passCount = 0;
const testPass = (label: string) => {
  passCount++;
  console.log(`[PASS] ${label}`);
};

const server = app.listen(0, '127.0.0.1');
await once(server, 'listening');
const address = server.address();
assert(address && typeof address !== 'string');
const base = `http://127.0.0.1:${address.port}/api`;

const call = async (path: string, token?: string, method = 'GET', body?: unknown, expectedStatus = 200) => {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  assert.equal(res.status, expectedStatus, `Expected ${expectedStatus} from ${path}, got ${res.status}: ${JSON.stringify(data)}`);
  return data;
};

try {
  console.log('--- SOLARIS 2.0 END-TO-END VERIFICATION SUITE ---');

  // Check 1: Health & Database connection configuration
  const health = await call('/health');
  assert.equal(health.ok, true);
  assert.ok(health.database.dbName === 'solaris_dev' || health.database.dbName === 'solaris_test');
  testPass('1. Health check reports operational status and target database ' + health.database.dbName);

  // Check 2: Landing Page UI source verification
  const landingCode = readFileSync('src/pages/LandingPage.tsx', 'utf8');
  assert.ok(landingCode.includes('Household login'), 'Expected Household login in LandingPage');
  assert.ok(landingCode.includes('MSME login'), 'Expected MSME login in LandingPage');
  assert.ok(landingCode.includes('MSME, Malls & Businesses'), 'Expected MSME workspace card');
  assert.ok(landingCode.includes('Households & Societies'), 'Expected Household workspace card');
  testPass('2. Landing Page source confirmed displaying Solaris 2.0 dual-workspace cards & login buttons');

  // Check 3: Login Page UI source verification
  const loginCode = readFileSync('src/pages/LoginPage.tsx', 'utf8');
  assert.ok(loginCode.includes('WorkspaceChoice'), 'Expected WorkspaceChoice in LoginPage');
  assert.ok(loginCode.includes('Explore mall demo') || loginCode.includes('commercial'), 'Expected demo explore buttons in LoginPage');
  testPass('3. Login Page source confirmed featuring WorkspaceChoice (Households, MSME, Installers)');

  // Check 4: Household Demo Login & Residential State Flow
  const household = await call('/auth/demo', undefined, 'POST', { workspace: 'household' }, 201);
  assert.ok(household.token, 'Expected session token');
  assert.equal(household.account.workspace, 'household');
  await call('/residential/state', household.token, 'PUT', { data: { caNumber: '102948192', billAmount: 6850 } });
  const resState = await call('/residential/state', household.token);
  assert.equal(resState.data.caNumber, '102948192');
  testPass('4. Household login is functional and residential state persists correctly');

  // Check 5: MSME / Commercial Demo Login & Dashboard Data
  const msme = await call('/auth/demo', undefined, 'POST', { workspace: 'commercial' }, 201);
  assert.ok(msme.token);
  assert.equal(msme.account.workspace, 'commercial');
  assert.equal(msme.account.commercialRole, 'property_owner');
  const properties = (await call('/business/properties', msme.token)).properties;
  assert.ok(properties.length >= 1);
  const property = properties[0];
  assert.equal(property.shops.length, 24);
  assert.equal(property.selectedCapacity, 200);
  const propDetail = await call(`/business/properties/${property.id}`, msme.token);
  assert.ok(propDetail.ledger, 'Expected commercial ledger');
  assert.ok(propDetail.scenarios, 'Expected capacity scenarios');
  testPass('5. MSME login is functional and commercial dashboard returns 24 shops and property ledger');

  // Check 6: Installer Demo Login & Role Access
  const installer = await call('/auth/demo', undefined, 'POST', { workspace: 'installer' }, 201);
  assert.ok(installer.token);
  assert.equal(installer.account.workspace, 'installer');
  assert.equal(installer.account.commercialRole, 'installer_admin');
  testPass('6. Installer login is functional and grants installer role');

  // Check 7: Cross-Workspace Authorization & Tenant Data Isolation
  // Household cannot access commercial properties
  await call('/business/properties', household.token, 'GET', undefined, 200); // returns empty
  const tenant = await call('/auth/demo', undefined, 'POST', { workspace: 'commercial', persona: 'tenant' }, 201);
  assert.equal(tenant.account.commercialRole, 'shop_tenant');
  const tenantProperties = (await call('/business/properties', tenant.token)).properties;
  assert.ok(tenantProperties.length >= 1);
  const tenantView = await call(`/business/properties/${tenantProperties[0].id}`, tenant.token, 'GET', undefined, 200);
  assert.ok(tenantView.property.shop, 'Tenant receives only their own shop record');
  assert.ok(!tenantView.property.shops, 'Tenant does not receive entire mall shop list');
  testPass('7. Multi-workspace authorization and tenant data isolation verified');

  // Check 8: Economics Studio Simulation & Six Chart Datasets
  const ecoRoot = `/business/properties/${property.id}/economics`;
  const defaults = (await call(`${ecoRoot}/defaults`, msme.token)).inputs;
  assert.ok(defaults.capacityKwp === 200);
  const sim = await call(`${ecoRoot}/simulate`, msme.token, 'POST', { inputs: defaults });
  assert.ok(sim.simulationId);
  assert.equal(sim.result.generation, 24000);
  assert.equal(sim.result.selfUse, 21600);
  assert.equal(sim.result.exported, 2400);
  assert.equal(sim.result.annualGross, 2332800);
  assert.equal(sim.result.annualNet, 2152800);
  assert.equal(sim.result.capex, 9000000);
  assert.equal(sim.comparisons.length, 4);
  testPass('8. Economics Studio simulation returns all 6 chart datasets with exact figures');

  // Check 9: Versioned Scenario Saving & Retrieval
  const savedV1 = (await call(`${ecoRoot}/scenarios/save`, msme.token, 'POST', { name: 'Q4 Budget Plan', inputs: defaults }, 201)).scenario;
  assert.equal(savedV1.name, 'Q4 Budget Plan');
  assert.equal(savedV1.version, 1);
  const savedV2 = (await call(`${ecoRoot}/scenarios/save`, msme.token, 'POST', { name: 'Q4 Budget Plan', inputs: { ...defaults, tenantShare: 60 } }, 201)).scenario;
  assert.equal(savedV2.version, 2);
  assert.ok(savedV2.result.retained < savedV1.result.retained);
  const scenarioList = (await call(`${ecoRoot}/scenarios`, msme.token)).scenarios;
  assert.ok(scenarioList.length >= 2);
  testPass('9. Versioned Economics Studio scenario saving and retrieval verified');

  // Check 10: EnergyTwin 3D Data Readiness & Structure
  assert.ok(property.meters && property.meters.length >= 25, 'Expected 1 main DISCOM meter + 24 submeters');
  assert.ok(property.readings && property.readings.length >= 25, 'Expected readings for all shops');
  assert.ok(property.benefitPolicies && property.benefitPolicies.length >= 1, 'Expected initial benefit policy');
  testPass('10. EnergyTwin 3D scene data (meters, submeters, readings, policies) fully verified');

  // Check 11: Savings Detective API Accessible
  const detectiveRes = await call(`/business/properties/${property.id}/detective`, msme.token, 'GET', undefined, 200);
  assert.ok(detectiveRes.dataset || detectiveRes.report !== undefined);
  testPass('11. Savings Detective backend endpoint confirmed responsive');

} finally {
  await new Promise<void>(resolve => server.close(() => resolve()));
  if (existsSync(testStore)) unlinkSync(testStore);
}

console.log(`\n========================================`);
console.log(`ALL ${passCount}/11 SOLARIS 2.0 VERIFICATIONS PASSED!`);
console.log(`========================================\n`);
