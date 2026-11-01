export type WorkspaceKey = 'household' | 'commercial' | 'installer';

export const WORKSPACE_ACCESS_BY_ROLE: Record<string, Record<WorkspaceKey, boolean>> = {
  household: { household: true, commercial: false, installer: false },
  msme: { household: true, commercial: true, installer: false },
  rwa_coordinator: { household: true, commercial: false, installer: false },
  installer_partner: { household: false, commercial: false, installer: true },
  admin_auditor: { household: true, commercial: false, installer: false },
  platform_admin: { household: true, commercial: true, installer: true },
  society_admin: { household: true, commercial: false, installer: false },
  household_member: { household: true, commercial: false, installer: false },
  commercial_property_owner: { household: false, commercial: true, installer: false },
  facility_manager: { household: false, commercial: true, installer: false },
  shop_tenant: { household: false, commercial: true, installer: false },
  installer_admin: { household: false, commercial: false, installer: true },
  installer_engineer: { household: false, commercial: false, installer: true }
};

export const getWorkspaceAccess = (role: string): Record<WorkspaceKey, boolean> => {
  return WORKSPACE_ACCESS_BY_ROLE[role] ?? { household: true, commercial: false, installer: false };
};
