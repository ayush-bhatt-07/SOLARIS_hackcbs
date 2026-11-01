import express, { type NextFunction, type Request, type Response } from 'express';
import 'dotenv/config';
import path from 'node:path';
import { connectDb, getDbStatus } from './db/connection';
import { businessApi } from './businessApi';
import { canAccessInstallerProject, canReadProperty, canReadShop, type RequestUser } from './rbac';
import { findProperty, findShop, findUser, organisations, properties, shops } from './store';

const app = express();
app.use(express.json({ limit: '10mb' }));

// Health check endpoint reporting service status and MongoDB Atlas status
app.get('/api/health', (_request: Request, response: Response) => {
  response.json({
    ok: true,
    service: 'solaris-api',
    database: getDbStatus(),
    syntheticDemo: true,
    timestamp: new Date().toISOString(),
  });
});

// Primary Business & Economics API
app.use('/api', businessApi);

// Legacy Demo / RBAC routes for backward compatibility
interface AuthenticatedRequest extends Request {
  user?: RequestUser;
}

const requireUser = (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
  const userId = process.env.SOLARIS_DEMO_HEADERS === 'true' ? request.header('x-user-id') : undefined;
  const user = userId ? findUser(userId) : undefined;
  if (!user) {
    response.status(401).json({ error: 'Authentication required. Demo identity headers are disabled by default.' });
    return;
  }
  request.user = user;
  next();
};

app.get('/api/me', requireUser, (request: AuthenticatedRequest, response: Response) => {
  response.json({ id: request.user!.id, name: request.user!.name, memberships: request.user!.memberships });
});

app.get('/api/workspaces', requireUser, (request: AuthenticatedRequest, response: Response) => {
  const memberships = request.user!.memberships;
  response.json({
    workspaces: memberships.map((membership) => ({
      organisation: organisations.find((organisation) => organisation.id === membership.organisationId),
      role: membership.role,
      shopId: membership.shopId,
      propertyIds: membership.propertyIds ?? [],
    })),
  });
});

app.get('/api/organisations/:organisationId/properties', requireUser, (request: AuthenticatedRequest, response: Response) => {
  const { organisationId } = request.params;
  const visible = properties.filter((property) => property.organisationId === organisationId && canReadProperty(request.user!, organisationId, property.id));
  response.json({ properties: visible });
});

app.get('/api/properties/:propertyId/shops', requireUser, (request: AuthenticatedRequest, response: Response) => {
  const property = findProperty(request.params.propertyId);
  if (!property || !canReadProperty(request.user!, property.organisationId, property.id)) {
    response.status(403).json({ error: 'Property access denied.' });
    return;
  }
  response.json({ shops: shops.filter((shop) => shop.propertyId === property.id) });
});

app.get('/api/shops/:shopId', requireUser, (request: AuthenticatedRequest, response: Response) => {
  const shop = findShop(request.params.shopId);
  if (!shop || !canReadShop(request.user!, shop.organisationId, shop.id, shop.propertyId)) {
    response.status(403).json({ error: 'Shop access denied.' });
    return;
  }
  response.json({ shop });
});

app.get('/api/installer/projects/:projectId', requireUser, (request: AuthenticatedRequest, response: Response) => {
  const organisationId = request.header('x-organisation-id') ?? 'org-installer-sungrid';
  if (!canAccessInstallerProject(request.user!, organisationId, request.params.projectId)) {
    response.status(403).json({ error: 'Installer project access denied.' });
    return;
  }
  response.json({ id: request.params.projectId, organisationId, synthetic: true, status: 'assigned' });
});

app.use('/api', (_req: Request, res: Response) => res.status(404).json({ error: 'API route not found.' }));

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.resolve('dist')));
  app.get('*', (_req: Request, res: Response) => res.sendFile(path.resolve('dist/index.html')));
}

const port = Number(process.env.PORT ?? 8787);

// Initialize MongoDB Atlas connection
if (process.env.NODE_ENV !== 'test') {
  connectDb().catch((err) => {
    if (process.env.NODE_ENV === 'production') {
      console.error('[Solaris API] Production database connection failed. Exiting process.', err);
      process.exit(1);
    }
  });

  app.listen(port, () => {
    console.log(`Solaris API listening on http://localhost:${port}`);
  });
}

export { app };
