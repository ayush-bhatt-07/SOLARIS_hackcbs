import assert from 'node:assert/strict';
import { connectDb, disconnectDb, getDbStatus, getDbName } from '../server/db/connection';
import { AccountModel } from '../server/models/Account';
import { EconomicsScenarioModel } from '../server/models/EconomicsScenario';
import { PropertyModel } from '../server/models/Property';
import { SessionModel } from '../server/models/Session';
import { MembershipModel } from '../server/models/Membership';
import { ResidentialStateModel } from '../server/models/ResidentialState';
import { AuditLogModel } from '../server/models/AuditLog';

async function runDbTests() {
  console.log('Testing MongoDB connection module and Mongoose schemas...');
  const dbName = getDbName();
  console.log(`Target database: ${dbName}`);

  // Test status when disconnected
  const initialStatus = getDbStatus();
  assert.equal(initialStatus.connected, false);
  assert.equal(initialStatus.dbName, dbName);
  console.log('PASS Initial disconnected status verified');

  // Verify Mongoose model compilation and collection names
  assert.equal(AccountModel.collection.name, 'accounts');
  assert.equal(SessionModel.collection.name, 'sessions');
  assert.equal(MembershipModel.collection.name, 'memberships');
  assert.equal(PropertyModel.collection.name, 'properties');
  assert.equal(EconomicsScenarioModel.collection.name, 'economics_scenarios');
  assert.equal(ResidentialStateModel.collection.name, 'residential_states');
  assert.equal(AuditLogModel.collection.name, 'audit_logs');
  console.log('PASS All 7 Mongoose schemas and collections compiled successfully');

  // If MONGODB_URI is provided in environment, test live connection
  if (process.env.MONGODB_URI) {
    console.log('Connecting to MongoDB Atlas...');
    const conn = await connectDb();
    assert.ok(conn, 'Expected successful connection');
    const status = getDbStatus();
    assert.equal(status.connected, true);
    console.log(`PASS Connected to ${status.mode} database: ${status.dbName} (${status.host})`);
    await disconnectDb();
    console.log('PASS Disconnected cleanly');
  } else {
    console.log('NOTE: MONGODB_URI is not set in environment. Skipping live network roundtrip.');
  }

  console.log('All DB unit checks passed.');
}

runDbTests().catch((err) => {
  console.error('FAIL DB test error:', err);
  process.exit(1);
});
