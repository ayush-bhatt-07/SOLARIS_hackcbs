import { randomBytes, randomUUID, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { BusinessProperty, Workspace, OrganisationMembership } from '../src/types/commercial';

export interface Account {
  id: string; name: string; email: string; password: string; workspace: Workspace;
  organisationId: string; demo: boolean; commercialRole?: 'property_owner' | 'facility_manager' | 'shop_tenant'; shopId?: string;
}
interface Store {
  version: 3; accounts: Account[];
  memberships: OrganisationMembership[];
  residentialStates: { accountId: string; organisationId: string; data: Record<string, unknown> }[];
  sessions: { digest: string; accountId: string; expires: number }[];
  properties: BusinessProperty[];
  audit: { actorId: string; organisationId: string; action: string; at: string }[];
  snapshots: { id: string; organisationId: string; actorId: string; action: string; at: string; property: BusinessProperty }[];
}
const file = process.env.SOLARIS_DATA_FILE ?? resolve('server/data/solaris.json');
const initial = (): Store => ({ version: 3, accounts: [], memberships: [], residentialStates: [], sessions: [], properties: [], audit: [], snapshots: [] });
export const initialiseEnergyTwin = (property: BusinessProperty) => {
  property.meters ??= [{ id: 'MAIN-DISCOM', kind: 'MAIN_DISCOM' }, ...property.shops.map(shop => ({ id: shop.meterId, kind: 'SUBMETER' as const, parentId: 'MAIN-DISCOM', shopId: shop.id }))];
  property.readings ??= [{ meterId: 'MAIN-DISCOM', period: '2026-10', consumptionKwh: property.inputs.consumptionKwh, sourceState: 'SYNTHETIC' }, ...property.shops.map(shop => ({ meterId: shop.meterId, period: '2026-10', consumptionKwh: shop.consumptionKwh, sourceState: 'SYNTHETIC' as const }))];
  property.benefitPolicies ??= [];
  if (!property.benefitPolicies.some(policy => policy.version === property.policyVersion)) {
    property.benefitPolicies.push({ version: property.policyVersion, effectiveFrom: new Date().toISOString(), period: '2026-10', sharingPercent: property.inputs.sharingPercent,
      eligibleShopIds: property.shops.filter(s => s.status === 'active').map(s => s.id), method: 'CONSUMPTION_WEIGHTED', state: 'ILLUSTRATIVE', sourceState: 'SYNTHETIC', rounding: 'LARGEST_REMAINDER_PAISE' });
  }
  return property;
};
const readStore = (): Store => {
  if (!existsSync(file)) return initial();
  const raw = readFileSync(file, 'utf8');
  const stored = JSON.parse(raw);
  // Additive v1 → v2 migration: keep every account, session and property. Retain
  // the original on disk before the next atomic persistence writes v2.
  if (stored.version === 1) {
    if (!existsSync(`${file}.v1-backup`)) writeFileSync(`${file}.v1-backup`, raw, { mode: 0o600 });
    stored.version = 2; stored.snapshots = [];
  }
  if (stored.version === 2) {
    if (!existsSync(`${file}.v2-backup`)) writeFileSync(`${file}.v2-backup`, raw, { mode: 0o600 });
    stored.memberships = stored.accounts.map((account: Account) => ({ accountId: account.id, organisationId: account.organisationId, workspace: account.workspace,
      role: account.workspace === 'household' ? 'household_member' : account.commercialRole ?? 'property_owner', status: 'active',
      shopId: account.shopId, propertyId: account.shopId ? stored.properties.find((p: BusinessProperty) => p.organisationId === account.organisationId)?.id : undefined }));
    stored.residentialStates = []; stored.version = 3;
    stored.properties.forEach(initialiseEnergyTwin);
  }
  if (stored.version !== 3) throw new Error('Unsupported Solaris store version. Back up and migrate before starting.');
  return stored;
};
export const db: Store = readStore();
export const persist = () => {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(`${file}.tmp`, JSON.stringify(db, null, 2), { mode: 0o600 });
  renameSync(`${file}.tmp`, file);
};
const digest = (token: string) => createHash('sha256').update(token).digest('hex');
export const passwordHash = (password: string) => {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
};
export const passwordMatches = (password: string, encoded: string) => {
  const [salt, hash] = encoded.split(':');
  return timingSafeEqual(scryptSync(password, salt, 64), Buffer.from(hash, 'hex'));
};
export const createSession = (account: Account) => {
  const token = randomBytes(32).toString('hex');
  db.sessions = db.sessions.filter(s => s.expires > Date.now());
  db.sessions.push({ digest: digest(token), accountId: account.id, expires: Date.now() + 86400000 });
  persist();
  return token;
};
export const accountForToken = (token: string) => {
  const session = db.sessions.find(s => s.digest === digest(token) && s.expires > Date.now());
  return session ? db.accounts.find(a => a.id === session.accountId) : undefined;
};
export const revokeSession = (token: string) => { db.sessions = db.sessions.filter(s => s.digest !== digest(token)); persist(); };
export const membershipFor = (account: Account) => db.memberships.find(m => m.accountId === account.id && m.organisationId === account.organisationId && m.workspace === account.workspace && m.status === 'active');
export const addMembership = (account: Account, propertyId?: string) => {
  const membership: OrganisationMembership = { accountId: account.id, organisationId: account.organisationId, workspace: account.workspace,
    role: account.workspace === 'household' ? 'household_member' : account.commercialRole ?? 'property_owner', status: 'active', shopId: account.shopId, propertyId };
  db.memberships.push(membership); return membership;
};
export const publicAccount = (account: Account) => ({
  id: account.id, name: account.name, email: account.email, workspace: account.workspace,
  organisationId: account.organisationId, demo: account.demo, commercialRole: account.commercialRole, shopId: account.shopId,
  membership: membershipFor(account),
});
export const canReadBusinessShop = (account: Account, shopId: string): boolean =>
  account.commercialRole !== 'shop_tenant' || account.shopId === shopId;
export const audit = (account: Account, action: string) => {
  const at = new Date().toISOString();
  db.audit.push({ actorId: account.id, organisationId: account.organisationId, action, at });
  for (const property of db.properties.filter(p => p.organisationId === account.organisationId)) {
    db.snapshots.push({ id: randomUUID(), actorId: account.id, organisationId: account.organisationId, action, at, property: structuredClone(property) });
  }
};
export const newProperty = (organisationId: string): BusinessProperty => initialiseEnergyTwin({
  id: randomUUID(), organisationId,
  inputs: { name: 'Solaris Demo Mall', city: 'Delhi', discom: 'Illustrative DISCOM', roofAreaM2: 3200,
    consumptionKwh: 100000, tariff: 9, fixedCharges: 100000, demandKw: 500, demandRate: 100,
    yieldKwhPerKwp: 120, selfUseRatio: 0.9, exportRate: 0, costPerKwp: 45000, sharingPercent: 50 },
  selectedCapacity: 200, policyVersion: 1, sourceState: 'SYNTHETIC', updatedAt: new Date().toISOString(),
  shops: Array.from({ length: 24 }, (_, i) => ({
    id: `shop-${i + 1}`, name: ['Urban Threads', 'Daily Market', 'Tech Corner', 'Coffee & Co.', 'Studio Living', 'Wellness Hub', 'Book Garden', 'Little Steps'][i % 8] + ` ${Math.floor(i / 8) + 1}`,
    floor: Math.floor(i / 8) + 1, category: ['Fashion', 'Grocery', 'Electronics', 'Dining', 'Home', 'Health', 'Books', 'Kids'][i % 8],
    consumptionKwh: 1800 + i * 100, status: (['active', 'active', 'pending', 'eligible', 'unconfigured', 'issue'][i % 6]) as BusinessProperty['shops'][number]['status'],
    meterId: `SUB-${String(i + 1).padStart(3, '0')}`, agreement: i % 6 < 2 ? 'Synthetic agreement example' : 'Not confirmed',
  })),
  bills: Array.from({ length: 12 }, (_, i) => ({ month: `2026-${String(i + 1).padStart(2, '0')}`, consumptionKwh: 100000 + [0, -3000, 2000, 4000, 8000, 12000, 10000, 7000, 3000, 0, -2000, -4000][i], sourceState: 'SYNTHETIC' as const })),
  quotes: [],
});
