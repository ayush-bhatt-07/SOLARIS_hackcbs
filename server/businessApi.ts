import { Router, type Request, type Response, type NextFunction } from 'express';
import { randomUUID } from 'node:crypto';
import {
  Account,
  accountForToken,
  addMembership,
  membershipFor,
  initialiseEnergyTwin,
  audit,
  createSession,
  db,
  newProperty,
  passwordHash,
  passwordMatches,
  persist,
  publicAccount,
  revokeSession,
} from './businessStore';
import { businessLedger, businessScenarios } from '../src/utils/businessModel';
import { getInstallerRecommendations, SOLAR_MATCH_PROVIDERS } from '../src/utils/solarMatch';
import type { BusinessInputs, BusinessProperty } from '../src/types/commercial';
import { registerEconomicsApi } from './economicsApi';
import { registerDetectiveApi } from './detectiveApi';
import { registerWeatherDetectiveApi } from './weatherDetectiveApi';
import { registerSolarDoctorApi } from './solarDoctorApi';

export const businessApi = Router();

type AuthRequest = Request & { account?: Account };

const tokenOf = (req: Request) => req.header('authorization')?.replace(/^Bearer /, '') ?? '';

const authenticated = (req: AuthRequest, res: Response, next: NextFunction) => {
  req.account = accountForToken(tokenOf(req));
  if (!req.account) {
    res.status(401).json({ error: 'Your session has expired. Please log in again.' });
    return;
  }
  if (!membershipFor(req.account)) {
    res.status(403).json({ error: 'An active organisation membership is required.' });
    return;
  }
  next();
};

const workspace = (value: unknown) => value === 'household' || value === 'commercial' || value === 'installer';
const fail = (res: Response, message: string) => { res.status(400).json({ error: message }); };

const authAttempts = new Map<string, { count: number; expires: number }>();

businessApi.use('/auth', (req, res, next) => {
  const key = req.ip ?? 'unknown';
  const now = Date.now();
  for (const [ip, attempt] of authAttempts) {
    if (attempt.expires < now) authAttempts.delete(ip);
  }
  const attempt = authAttempts.get(key) ?? { count: 0, expires: now + 60000 };
  attempt.count += 1;
  authAttempts.set(key, attempt);
  if (attempt.count > 30) {
    res.status(429).json({ error: 'Too many attempts. Please wait a minute.' });
    return;
  }
  next();
});

businessApi.post('/auth/register', (req, res) => {
  const { name, email, password, workspace: selected } = req.body;
  if (
    typeof name !== 'string' || name.trim().length < 2 || name.length > 100 ||
    typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    typeof password !== 'string' || password.length < 8 || password.length > 128 ||
    !workspace(selected)
  ) {
    fail(res, 'Enter a name, valid email, workspace, and password of 8–128 characters.');
    return;
  }
  const cleanEmail = email.trim().toLowerCase();
  if (db.accounts.some(a => a.email === cleanEmail)) {
    fail(res, 'An account already exists with this email. Please log in.');
    return;
  }
  const account: Account = {
    id: randomUUID(),
    name: name.trim(),
    email: cleanEmail,
    password: passwordHash(password),
    workspace: selected,
    organisationId: randomUUID(),
    demo: false,
    commercialRole: selected === 'commercial' ? 'property_owner' : selected === 'installer' ? 'installer_admin' : undefined,
  };
  db.accounts.push(account);
  addMembership(account);
  audit(account, 'account_registered');
  res.status(201).json({ account: publicAccount(account), token: createSession(account) });
});

businessApi.post('/auth/login', (req, res) => {
  const { email, password, workspace: selected } = req.body;
  const account = typeof email === 'string' ? db.accounts.find(a => a.email === email.trim().toLowerCase()) : undefined;
  if (!account || typeof password !== 'string' || password.length > 128 || !passwordMatches(password, account.password)) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }
  if (selected !== account.workspace) {
    res.status(403).json({ error: `This account belongs to ${account.workspace === 'commercial' ? 'MSME & Malls' : 'Households'}. Select that login.` });
    return;
  }
  if (!membershipFor(account)) {
    res.status(403).json({ error: 'This account has no active organisation membership.' });
    return;
  }
  res.json({ account: publicAccount(account), token: createSession(account) });
});

businessApi.post('/auth/demo', (req, res) => {
  if (!workspace(req.body.workspace)) {
    fail(res, 'Choose a workspace.');
    return;
  }
  const tenantDemo = req.body.workspace === 'commercial' && req.body.persona === 'tenant';
  const installerDemo = req.body.workspace === 'installer';
  const account: Account = {
    id: randomUUID(),
    name: tenantDemo ? 'Demo Shop Tenant' : req.body.workspace === 'commercial' ? 'Demo Mall Owner' : installerDemo ? 'SunGrid Demo Installer' : 'Demo Household',
    email: `demo-${randomUUID()}@solaris.example`,
    password: passwordHash(randomUUID()),
    workspace: req.body.workspace,
    organisationId: installerDemo ? 'org-installer-sungrid' : randomUUID(),
    demo: true,
    commercialRole: tenantDemo ? 'shop_tenant' : req.body.workspace === 'commercial' ? 'property_owner' : installerDemo ? 'installer_admin' : undefined,
    shopId: tenantDemo ? 'shop-1' : undefined,
  };
  db.accounts.push(account);
  if (account.workspace === 'commercial') {
    const property = newProperty(account.organisationId);
    db.properties.push(property);
    addMembership(account, property.id);
  } else {
    addMembership(account);
  }
  audit(account, 'demo_session_created');
  res.status(201).json({ account: publicAccount(account), token: createSession(account) });
});

businessApi.post('/auth/logout', authenticated, (req: AuthRequest, res) => {
  revokeSession(tokenOf(req));
  res.json({ ok: true });
});

businessApi.get('/auth/session', authenticated, (req: AuthRequest, res) => {
  res.json({ account: publicAccount(req.account!) });
});

businessApi.get('/session', authenticated, (req: AuthRequest, res) => {
  res.json({ account: publicAccount(req.account!) });
});

businessApi.get('/me/workspaces', authenticated, (req: AuthRequest, res) => {
  const account = req.account!;
  const userMemberships = db.memberships.filter(m => m.accountId === account.id && m.status === 'active');
  res.json({
    activeWorkspace: account.workspace,
    memberships: userMemberships.map(m => ({
      organisationId: m.organisationId,
      workspace: m.workspace,
      role: m.role,
      propertyId: m.propertyId,
      shopId: m.shopId,
    })),
  });
});

businessApi.get('/residential/state', authenticated, (req: AuthRequest, res) => {
  const account = req.account!;
  const state = db.residentialStates.find(s => s.accountId === account.id && s.organisationId === account.organisationId);
  res.json({ data: state?.data ?? {} });
});

businessApi.put('/residential/state', authenticated, (req: AuthRequest, res) => {
  const account = req.account!;
  if (!req.body || typeof req.body.data !== 'object') {
    fail(res, 'Valid state data object is required.');
    return;
  }
  let state = db.residentialStates.find(s => s.accountId === account.id && s.organisationId === account.organisationId);
  if (!state) {
    state = { accountId: account.id, organisationId: account.organisationId, data: req.body.data };
    db.residentialStates.push(state);
  } else {
    state.data = req.body.data;
  }
  audit(account, 'residential_state_updated');
  persist();
  res.json({ ok: true, data: state.data });
});

// Middleware ensuring property belongs to user's organisation and meets RBAC requirements
const propertyAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const account = req.account!;
  if (account.workspace !== 'commercial') {
    res.status(403).json({ error: 'Commercial workspace access required.' });
    return;
  }
  const property = db.properties.find(p => p.id === req.params.id && p.organisationId === account.organisationId);
  if (!property) {
    res.status(404).json({ error: 'Property not found.' });
    return;
  }
  res.locals.property = property;
  next();
};

const ownerOrManager = (req: AuthRequest, res: Response, next: NextFunction) => {
  const account = req.account!;
  if (account.commercialRole !== 'property_owner' && account.commercialRole !== 'facility_manager') {
    res.status(403).json({ error: 'Property owner or manager permissions required.' });
    return;
  }
  next();
};

const ownerOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
  const account = req.account!;
  if (account.commercialRole !== 'property_owner') {
    res.status(403).json({ error: 'Property owner permission required for this operation.' });
    return;
  }
  next();
};

// Mount Economics Studio routes under /business/properties/:id/economics
businessApi.use('/business/properties/:id/economics', authenticated, propertyAuth, ownerOrManager);
registerEconomicsApi(businessApi);
registerDetectiveApi(businessApi);
registerWeatherDetectiveApi(businessApi);
registerSolarDoctorApi(businessApi, authenticated as unknown as import('express').RequestHandler);

businessApi.get('/business/properties', authenticated, (req: AuthRequest, res) => {
  const account = req.account!;
  if (account.workspace !== 'commercial') {
    res.json({ properties: [] });
    return;
  }
  const orgProperties = db.properties.filter(p => p.organisationId === account.organisationId);
  res.json({ properties: orgProperties });
});

businessApi.post('/business/properties', authenticated, ownerOnly, (req: AuthRequest, res) => {
  const account = req.account!;
  const property = newProperty(account.organisationId);
  db.properties.push(property);
  audit(account, 'property_created');
  persist();
  res.status(201).json({ property });
});

businessApi.get('/business/properties/:id', authenticated, propertyAuth, (req: AuthRequest, res) => {
  const account = req.account!;
  const property: BusinessProperty = res.locals.property;
  if (account.commercialRole === 'shop_tenant') {
    const shop = property.shops.find(s => s.id === account.shopId);
    const ledger = businessLedger(property);
    const statement = ledger.statements.find(s => s.shopId === account.shopId);
    res.json({
      property: {
        id: property.id,
        inputs: { name: property.inputs.name, city: property.inputs.city },
        shop,
        statement,
      },
    });
    return;
  }
  res.json({ property, ledger: businessLedger(property), scenarios: businessScenarios(property) });
});

businessApi.put('/business/properties/:id', authenticated, propertyAuth, ownerOnly, (req: AuthRequest, res) => {
  const property: BusinessProperty = res.locals.property;
  const updates = req.body.inputs as Partial<BusinessInputs>;
  if (updates) {
    Object.assign(property.inputs, updates);
  }
  if (typeof req.body.selectedCapacity === 'number') {
    property.selectedCapacity = req.body.selectedCapacity;
  }
  property.updatedAt = new Date().toISOString();
  audit(req.account!, 'property_updated');
  persist();
  res.json({ property });
});

businessApi.post('/business/properties/:id/bills', authenticated, propertyAuth, ownerOrManager, (req: AuthRequest, res) => {
  const { month, consumptionKwh } = req.body;
  if (
    typeof month !== 'string' ||
    !/^\d{4}-(0[1-9]|1[0-2])$/.test(month) ||
    !Number.isFinite(consumptionKwh) ||
    consumptionKwh < 0 ||
    consumptionKwh > 100000000
  ) {
    fail(res, 'Enter a valid billing month (YYYY-MM) and positive consumption.');
    return;
  }
  const property: BusinessProperty = res.locals.property;
  property.bills = property.bills.filter(b => b.month !== month);
  property.bills.push({ month, consumptionKwh, sourceState: 'USER_CONFIRMED' });
  property.bills.sort((a, b) => a.month.localeCompare(b.month));
  audit(req.account!, 'bill_consumption_confirmed');
  persist();
  res.status(201).json({ property });
});

businessApi.get('/business/properties/:id/installers', authenticated, propertyAuth, (_req, res) => {
  const property: BusinessProperty = res.locals.property;
  res.json({
    recommendations: getInstallerRecommendations({
      location: property.inputs.city,
      serviceArea: property.inputs.city,
      annualConsumptionKwh: property.inputs.consumptionKwh * 12,
      roofAreaSqFt: property.inputs.roofAreaM2 * 10.764,
      desiredCapacityKw: property.selectedCapacity,
      budgetInr: property.selectedCapacity * property.inputs.costPerKwp * 1.2,
      financingPreference: 'cash',
      requiredTimelineWeeks: 12,
      isCommercial: true,
    }),
  });
});

businessApi.post('/business/properties/:id/quotes', authenticated, propertyAuth, ownerOnly, (req: AuthRequest, res) => {
  const property: BusinessProperty = res.locals.property;
  const provider = SOLAR_MATCH_PROVIDERS.find(p => p.id === req.body.installerId);
  const eligible = getInstallerRecommendations({
    location: property.inputs.city,
    serviceArea: property.inputs.city,
    annualConsumptionKwh: property.inputs.consumptionKwh * 12,
    roofAreaSqFt: property.inputs.roofAreaM2 * 10.764,
    desiredCapacityKw: property.selectedCapacity,
    budgetInr: property.selectedCapacity * property.inputs.costPerKwp * 1.2,
    financingPreference: 'cash',
    requiredTimelineWeeks: 12,
  }).some(r => r.provider.id === provider?.id);

  if (!provider || !eligible) {
    fail(res, 'Choose an eligible installer for this property.');
    return;
  }

  if (!property.quotes.some(q => q.installerId === provider.id && q.capacityKwp === property.selectedCapacity)) {
    property.quotes.push({
      id: randomUUID(),
      installerId: provider.id,
      installerName: provider.name,
      capacityKwp: property.selectedCapacity,
      status: 'requested',
      createdAt: new Date().toISOString(),
    });
    audit(req.account!, 'demo_rfq_created');
    persist();
  }
  res.status(201).json({ property });
});

businessApi.post('/business/properties/:id/quotes/:quoteId/simulate', authenticated, propertyAuth, ownerOrManager, (req: AuthRequest, res) => {
  const property: BusinessProperty = res.locals.property;
  const quote = property.quotes.find(q => q.id === req.params.quoteId);
  if (!quote) {
    res.status(404).json({ error: 'Quote not found.' });
    return;
  }
  if (quote.status === 'requested') {
    const provider = SOLAR_MATCH_PROVIDERS.find(p => p.id === quote.installerId)!;
    Object.assign(quote, {
      status: 'demo_quote',
      amountInr: provider.baseRatePerKwInr * quote.capacityKwp,
      warranty: 'Illustrative: 10-year workmanship / 25-year panel performance',
      timelineWeeks: provider.quoteLeadTimeWeeks,
    });
    audit(req.account!, 'synthetic_quote_simulated');
    persist();
  }
  res.json({ property });
});

businessApi.post('/business/properties/:id/quotes/:quoteId/select', authenticated, propertyAuth, ownerOnly, (req: AuthRequest, res) => {
  const property: BusinessProperty = res.locals.property;
  const quote = property.quotes.find(q => q.id === req.params.quoteId && q.amountInr && q.capacityKwp === property.selectedCapacity);
  if (!quote) {
    fail(res, 'A returned quote matching the selected capacity is required.');
    return;
  }
  property.quotes.forEach(q => { if (q.status === 'selected') q.status = 'demo_quote'; });
  quote.status = 'selected';
  audit(req.account!, 'demo_quote_shortlisted');
  persist();
  res.json({ property });
});

businessApi.get('/business/properties/:id/report', authenticated, propertyAuth, (_req, res) => {
  const p: BusinessProperty = res.locals.property;
  const scenarios = businessScenarios(p);
  const rows = [
    ['Solaris solar planning report — synthetic / estimated, not a utility bill'],
    ['Property', p.inputs.name],
    ['City', p.inputs.city],
    ['Assumptions', JSON.stringify(p.inputs)],
    ['Capacity kWp', 'Before INR/month', 'After INR/month', 'Savings INR/month', 'Payback years', 'Roof suitable'],
    ...scenarios.map(s => [
      s.capacityKwp,
      s.result.billBeforeSolarInr,
      s.result.billAfterSolarInr,
      s.result.monthlySavingsInr,
      s.result.simplePaybackYears ?? 'Unavailable',
      s.roofFits,
    ]),
    ['Tenant benefits are hypothetical internal projections. No official VNM credit.'],
    ['Shop', 'kWh', 'Projected INR', 'Policy version'],
    ...businessLedger(p).statements.map(s => [s.shopId, s.consumptionKwh, s.benefitInr, s.policyVersion]),
  ];
  const csv = rows.map(row => row.map(value => {
    let cell = String(value);
    if (/^[=+\-@\t\r]/.test(cell)) cell = `'${cell}`;
    return `"${cell.replaceAll('"', '""')}"`;
  }).join(',')).join('\r\n');
  res.type('text/csv').attachment('solaris-business-report.csv').send(csv);
});
