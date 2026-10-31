import assert from 'node:assert/strict';
import { once } from 'node:events';

// Import without opening the application's normal listening port.
process.env.NODE_ENV = 'test';
process.env.SOLARIS_DEMO_HEADERS = 'true';
const { app } = await import('../server/index');
const server = app.listen(0, '127.0.0.1');
await once(server, 'listening');
const address = server.address();
assert(address && typeof address !== 'string');
const base = `http://127.0.0.1:${address.port}`;
let passed = 0;
const check = async (name: string, path: string, status: number, user?: string) => {
  const response = await fetch(base + path, {
    headers: user ? { 'x-user-id': user } : {},
  });
  assert.equal(response.status, status, name);
  const body = await response.json();
  console.log(`PASS ${name}`);
  passed += 1;
  return body;
};

try {
  await check('Public health endpoint', '/api/health', 200);
  await check('Anonymous workspace access denied', '/api/workspaces', 401);
  await check('Unknown demo identity denied', '/api/me', 401, 'missing-user');
  const workspaces = await check('Tenant membership resolved', '/api/workspaces', 200, 'user-shop-tenant-1');
  assert.equal(workspaces.workspaces.length, 1);
  assert.equal(workspaces.workspaces[0].shopId, 'shop-1');
  const own = await check('Tenant reads own shop', '/api/shops/shop-1', 200, 'user-shop-tenant-1');
  assert.equal(own.shop.id, 'shop-1');
  await check('Tenant cannot read another shop', '/api/shops/shop-2', 403, 'user-shop-tenant-1');
  await check('Tenant cannot list property shops', '/api/properties/property-sunrise-mall/shops', 403, 'user-shop-tenant-1');
  const shops = await check('Facility manager sees 24 synthetic shops', '/api/properties/property-sunrise-mall/shops', 200, 'user-facility-manager');
  assert.equal(shops.shops.length, 24);
  await check('Facility manager cannot access society shops', '/api/properties/property-gulmohar/shops', 403, 'user-facility-manager');
  await check('Engineer reads assigned project', '/api/installer/projects/project-sunrise-200kwp', 200, 'user-installer-engineer');
  await check('Engineer cannot read unassigned project', '/api/installer/projects/project-other', 403, 'user-installer-engineer');
  console.log(`${passed} API baseline checks passed. Demo headers are not authentication.`);
} finally {
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
}
