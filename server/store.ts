import type { Membership, OrganisationRole, OrganisationType, RequestUser } from './rbac';

export interface Organisation {
  id: string;
  name: string;
  type: OrganisationType;
}

export interface Property {
  id: string;
  organisationId: string;
  name: string;
  location: string;
  synthetic: boolean;
}

export interface Shop {
  id: string;
  propertyId: string;
  organisationId: string;
  floor: number;
  name: string;
  tenantUserId?: string;
  benefitStatus: 'active' | 'pending' | 'eligible' | 'unconfigured' | 'issue';
}

export const organisations: Organisation[] = [
  { id: 'org-society-gulmohar', name: 'Gulmohar Enclave Society', type: 'HOUSING_SOCIETY' },
  { id: 'org-mall-sunrise', name: 'Sunrise Mall Operations', type: 'COMMERCIAL_PROPERTY' },
  { id: 'org-installer-sungrid', name: 'SunGrid Delhi (Demo)', type: 'SOLAR_INSTALLER' }
];

export const properties: Property[] = [
  { id: 'property-sunrise-mall', organisationId: 'org-mall-sunrise', name: 'Sunrise Mall', location: 'Delhi', synthetic: true },
  { id: 'property-gulmohar', organisationId: 'org-society-gulmohar', name: 'Gulmohar Enclave', location: 'Delhi', synthetic: true }
];

export const shops: Shop[] = Array.from({ length: 24 }, (_, index) => ({
  id: `shop-${index + 1}`,
  propertyId: 'property-sunrise-mall',
  organisationId: 'org-mall-sunrise',
  floor: Math.floor(index / 8) + 1,
  name: `Shop ${String(index + 1).padStart(2, '0')}`,
  benefitStatus: (['active', 'pending', 'eligible', 'unconfigured', 'issue'][index % 5]) as Shop['benefitStatus']
}));

export const users: RequestUser[] = [
  {
    id: 'user-platform-admin',
    name: 'Platform Administrator',
    memberships: [{ userId: 'user-platform-admin', organisationId: 'org-society-gulmohar', role: 'platform_admin' }]
  },
  {
    id: 'user-facility-manager',
    name: 'Sunrise Facility Manager',
    memberships: [{ userId: 'user-facility-manager', organisationId: 'org-mall-sunrise', role: 'facility_manager', propertyIds: ['property-sunrise-mall'] }]
  },
  {
    id: 'user-shop-tenant-1',
    name: 'Shop Tenant 1',
    memberships: [{ userId: 'user-shop-tenant-1', organisationId: 'org-mall-sunrise', role: 'shop_tenant', shopId: 'shop-1' }]
  },
  {
    id: 'user-installer-engineer',
    name: 'Installer Engineer',
    memberships: [{ userId: 'user-installer-engineer', organisationId: 'org-installer-sungrid', role: 'installer_engineer', assignedProjectIds: ['project-sunrise-200kwp'] }]
  }
];

export const findUser = (userId: string): RequestUser | undefined => users.find((user) => user.id === userId);
export const findProperty = (propertyId: string): Property | undefined => properties.find((property) => property.id === propertyId);
export const findShop = (shopId: string): Shop | undefined => shops.find((shop) => shop.id === shopId);

export const roleLabel = (role: OrganisationRole): string => role.replaceAll('_', ' ');
