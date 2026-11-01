export type OrganisationRole =
  | 'platform_admin'
  | 'society_admin'
  | 'household_member'
  | 'commercial_property_owner'
  | 'facility_manager'
  | 'shop_tenant'
  | 'installer_admin'
  | 'installer_engineer';

export type OrganisationType = 'HOUSING_SOCIETY' | 'COMMERCIAL_PROPERTY' | 'SOLAR_INSTALLER';

export interface Membership {
  userId: string;
  organisationId: string;
  role: OrganisationRole;
  shopId?: string;
  propertyIds?: string[];
  assignedProjectIds?: string[];
}

export interface RequestUser {
  id: string;
  name: string;
  memberships: Membership[];
}

const isPlatformAdmin = (user: RequestUser): boolean => user.memberships.some(
  (membership) => membership.role === 'platform_admin'
);

export const hasOrganisationRole = (
  user: RequestUser,
  organisationId: string,
  roles: OrganisationRole[]
): boolean => user.memberships.some(
  (membership) => membership.organisationId === organisationId && roles.includes(membership.role)
);

export const canReadProperty = (
  user: RequestUser,
  organisationId: string,
  propertyId: string
): boolean => {
  if (isPlatformAdmin(user)) return true;
  return user.memberships.some((membership) => {
    if (membership.organisationId !== organisationId) return false;
    return membership.propertyIds?.includes(propertyId) === true || [
      'commercial_property_owner',
      'facility_manager',
      'society_admin'
    ].includes(membership.role);
  });
};

export const canReadShop = (
  user: RequestUser,
  organisationId: string,
  shopId: string,
  propertyId: string
): boolean => {
  if (isPlatformAdmin(user)) return true;
  return user.memberships.some((membership) => {
    if (membership.organisationId !== organisationId) return false;
    if (membership.role === 'shop_tenant') return membership.shopId === shopId;
    return membership.propertyIds?.includes(propertyId) === true || [
      'commercial_property_owner',
      'facility_manager'
    ].includes(membership.role);
  });
};

export const canAccessInstallerProject = (
  user: RequestUser,
  organisationId: string,
  projectId: string
): boolean => {
  if (isPlatformAdmin(user)) return true;
  return user.memberships.some((membership) => {
    if (membership.organisationId !== organisationId) return false;
    if (membership.role === 'installer_admin') return true;
    return membership.role === 'installer_engineer' && membership.assignedProjectIds?.includes(projectId) === true;
  });
};
