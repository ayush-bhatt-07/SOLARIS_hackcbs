import React, { useCallback, useContext, useState, useEffect } from 'react';
import { AppContext } from './AppContextState';
import { 
  UserProfile, 
  CommunityProject, 
  CommunityMember, 
  AuditLogItem, 
  UserRole,
  OptimisationParams,
  OptimisationResult
} from '../types';
import { 
  DEMO_USERS, 
  INITIAL_COMMUNITY, 
  INITIAL_AUDIT_LOGS 
} from '../data/mockData';
import { runAffordabilityOptimiser } from '../utils/optimiserEngine';
import { api, post } from '../utils/api';
import type { Workspace, OrganisationMembership } from '../types/commercial';
import {
  authenticateAccount,
  clearAuthSession,
  getAuthSession,
  registerAccount,
  saveAuthSession,
  type AuthSession
} from '../utils/authStorage';

export interface AuthResult {
  success: boolean;
  error?: string;
}

export interface AppContextType {
  currentRole: UserRole;
  currentUser: UserProfile;
  switchRole: (role: UserRole) => void;
  updateCurrentUser: (updates: Partial<UserProfile>) => void;
  
  currentPath: string;
  navigateTo: (path: string) => void;

  isAuthenticated: boolean;
  signUp: (name: string, email: string, password: string, workspace?: Workspace) => Promise<AuthResult>;
  logIn: (email: string, password: string, workspace?: Workspace) => Promise<AuthResult>;
  demoLogin: (workspace: Workspace, persona?: 'owner' | 'tenant') => Promise<AuthResult>;
  logOut: () => void;

  community: CommunityProject;
  updateCommunity: (updates: Partial<CommunityProject>) => void;
  inviteMember: (newMember: Omit<CommunityMember, 'id'>) => void;
  toggleMemberConsent: (memberId: string) => void;
  
  signUserConsent: () => void;
  isConsentModalOpen: boolean;
  setIsConsentModalOpen: (open: boolean) => void;

  optimisationParams: OptimisationParams;
  setOptimisationParams: React.Dispatch<React.SetStateAction<OptimisationParams>>;
  optimisationResult: OptimisationResult;
  rerunOptimiser: () => void;

  auditLogs: AuditLogItem[];
  addAuditLog: (action: string, details: string, category?: AuditLogItem['category']) => void;

  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  currentWorkspaceAccess: Record<'household' | 'commercial' | 'installer', boolean>;
  getWorkspaceAccess: (workspace: 'household' | 'commercial' | 'installer') => boolean;
}

const STORAGE_KEYS = {
  ROLE: 'solaris_role',
  USER: 'solaris_user',
  COMMUNITY: 'solaris_community',
  LOGS: 'solaris_logs'
};

const scopedStorageKey = (key: string, accountId?: string | null): string =>
  accountId ? `${key}:${accountId}` : key;

const readScopedJson = <T,>(key: string, accountId?: string | null): T | null => {
  try {
    const raw = localStorage.getItem(scopedStorageKey(key, accountId));
    return raw ? JSON.parse(raw) as T : null;
  } catch {
    return null;
  }
};

const buildAuthProfile = (account: { id: string; name: string; email: string; workspace?: Workspace; membership?: OrganisationMembership }, needsOnboarding: boolean = false): UserProfile => ({
  ...DEMO_USERS[account.workspace === 'commercial' ? 'msme' : 'household'],
  id: account.id,
  name: account.name,
  email: account.email,
  role: account.workspace === 'commercial' ? account.membership?.role === 'shop_tenant' ? 'shop_tenant' : account.membership?.role === 'facility_manager' ? 'facility_manager' : 'commercial_property_owner' : 'household',
  roleTitle: account.workspace === 'commercial' ? 'MSME · Mall Owner' : 'Resident · Solaris Member',
  consentSigned: false,
  consentDate: undefined,
  onboardingCompleted: account.workspace === 'commercial',
  needsOnboarding: account.workspace !== 'commercial' && needsOnboarding
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(() => getAuthSession());
  const isAuthenticated = Boolean(session);

  // 1. Role & User State
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    const activeSession = getAuthSession();
    const saved = localStorage.getItem(scopedStorageKey(STORAGE_KEYS.ROLE, activeSession?.accountId));
    return (saved as UserRole) || 'household';
  });

  const organisationRoleMap: Partial<Record<UserRole, UserRole>> = {
    platform_admin: 'platform_admin',
    society_admin: 'society_admin',
    household_member: 'household_member',
    commercial_property_owner: 'commercial_property_owner',
    facility_manager: 'facility_manager',
    shop_tenant: 'shop_tenant',
    installer_admin: 'installer_admin',
    installer_engineer: 'installer_engineer'
  };

  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const activeSession = getAuthSession();
    const saved = localStorage.getItem(scopedStorageKey(STORAGE_KEYS.USER, activeSession?.accountId));
    if (saved) {
      try {
        const profile = JSON.parse(saved);
        if (activeSession && profile.id === activeSession.accountId) return profile;
      } catch (e) {
        console.error(e);
      }
    }
    if (activeSession) {
      return buildAuthProfile({
        id: activeSession.accountId,
        name: activeSession.name,
        email: activeSession.email,
        workspace: activeSession.workspace,
        membership: activeSession.membership
      });
    }
    return DEMO_USERS['household'];
  });

  // 2. Navigation State
  const [currentPath, setCurrentPath] = useState<string>(() => {
    const hash = window.location.hash.replace('#', '');
    return hash || '/';
  });

  const navigateTo = useCallback((path: string) => {
    window.location.hash = path;
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      setCurrentPath(hash || '/');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // 3. Community State
  const [community, setCommunity] = useState<CommunityProject>(() => {
    return readScopedJson<CommunityProject>(STORAGE_KEYS.COMMUNITY, getAuthSession()?.accountId) ?? INITIAL_COMMUNITY;
  });

  // 4. Modal & UI State
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 5. Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(() => {
    return readScopedJson<AuditLogItem[]>(STORAGE_KEYS.LOGS, getAuthSession()?.accountId) ?? INITIAL_AUDIT_LOGS;
  });
  const [privateStateReady, setPrivateStateReady] = useState(false);
  const [stateError, setStateError] = useState('');

  // A browser can switch between authenticated accounts without a full reload.
  // Reload private residential state when that identity changes; never retain
  // the previous account's community roster, bills, or audit history in memory.
  useEffect(() => {
    const accountId = session?.accountId;
    setCommunity(readScopedJson<CommunityProject>(STORAGE_KEYS.COMMUNITY, accountId) ?? INITIAL_COMMUNITY);
    setAuditLogs(readScopedJson<AuditLogItem[]>(STORAGE_KEYS.LOGS, accountId) ?? INITIAL_AUDIT_LOGS);
    setPrivateStateReady(false); setStateError('');
    if (!session?.token || session.workspace !== 'household') { setPrivateStateReady(true); return; }
    let cancelled = false;
    api('/residential/state').then(result => {
      if (cancelled) return;
      if (result.data?.community) setCommunity(result.data.community);
      if (result.data?.logs) setAuditLogs(result.data.logs);
      if (result.data?.optimisationParams) setOptimisationParams(result.data.optimisationParams);
      const storedProfile = result.data?.profile ?? readScopedJson<UserProfile>(STORAGE_KEYS.USER, accountId);
      const authority = buildAuthProfile({ id: accountId!, name: session.name, email: session.email, workspace: session.workspace, membership: session.membership });
      if (storedProfile) setCurrentUser({ ...authority, ...storedProfile, id: accountId, name: session.name, email: session.email, role: 'household' });
      setPrivateStateReady(true);
    }).catch(e => { if (!cancelled) setStateError(e.message); });
    return () => { cancelled = true; };
  }, [session?.accountId]);

  // 6. Optimiser State
  const [optimisationParams, setOptimisationParams] = useState<OptimisationParams>({
    roofAreaSqFt: 1400,
    targetCapacityKw: 12,
    budgetCeilingInr: 580000,
    financingRatePercentage: 8.5,
    participantCapInr: 4500,
    stressFactors: {
      monsoonDrop: false,
      rateSpike: false,
      unitDropOut: false,
      subsidyDelay: false
    }
  });

  const [optimisationResult, setOptimisationResult] = useState<OptimisationResult>(() => {
    return runAffordabilityOptimiser(INITIAL_COMMUNITY.members, {
      roofAreaSqFt: 1400,
      targetCapacityKw: 12,
      budgetCeilingInr: 580000,
      financingRatePercentage: 8.5,
      participantCapInr: 4500,
      stressFactors: {
        monsoonDrop: false,
        rateSpike: false,
        unitDropOut: false,
        subsidyDelay: false
      }
    });
  });

  const rerunOptimiser = () => {
    const result = runAffordabilityOptimiser(community.members, optimisationParams);
    setOptimisationResult(result);
    addAuditLog(
      'Affordability Solver Executed',
      `Re-solved for ${optimisationParams.targetCapacityKw} kWp with ${result.includedCount} subscribers, avg gain ₹${result.avgNetMonthlySavingsInr}/mo.`,
      'financial'
    );
  };

  useEffect(() => {
    setOptimisationResult(runAffordabilityOptimiser(community.members, optimisationParams));
  }, [optimisationParams, community.members]);

  useEffect(() => {
    if (!privateStateReady || !session?.token || session.workspace !== 'household' || currentUser.id !== session.accountId) return;
    const handle = setTimeout(() => {
      api('/residential/state', { method: 'PUT', body: JSON.stringify({ data: { profile: currentUser, community, logs: auditLogs, optimisationParams } }) }).catch(e => setStateError(e.message));
    }, 250);
    return () => clearTimeout(handle);
  }, [privateStateReady, currentUser, community, auditLogs, optimisationParams, session?.accountId]);

  // Actions
  const switchRole = (role: UserRole) => {
    if (session?.token) return; // Authenticated membership cannot be elevated by a demo role switch.
    setCurrentRole(role);
    const newUser = DEMO_USERS[role] || DEMO_USERS['household'];
    setCurrentUser(newUser);
    localStorage.setItem(scopedStorageKey(STORAGE_KEYS.ROLE, session?.accountId), role);
    localStorage.setItem(scopedStorageKey(STORAGE_KEYS.USER, session?.accountId), JSON.stringify(newUser));
    addAuditLog('Role Switch', `Switched active demo context to ${newUser.name} (${newUser.roleTitle})`, 'system');
  };

  const workspaceAccessByRole = useCallback((role: UserRole) => ({
    household: ['household', 'msme', 'rwa_coordinator', 'admin_auditor', 'platform_admin', 'society_admin', 'household_member'].includes(role),
    commercial: ['msme', 'commercial_property_owner', 'facility_manager', 'shop_tenant', 'platform_admin'].includes(role),
    installer: ['installer_partner', 'installer_admin', 'installer_engineer', 'platform_admin'].includes(role)
  }), []);

  const currentWorkspaceAccess = session?.token ? { household: session.workspace === 'household', commercial: session.workspace === 'commercial', installer: false } : workspaceAccessByRole(currentUser.role);

  const updateCurrentUser = (updates: Partial<UserProfile>) => {
    setCurrentUser(prev => {
      const updated = { ...prev, ...updates };
      localStorage.setItem(scopedStorageKey(STORAGE_KEYS.USER, session?.accountId), JSON.stringify(updated));
      return updated;
    });
  };

  const getWorkspaceAccess = (workspace: 'household' | 'commercial' | 'installer') => currentWorkspaceAccess[workspace];

  const applyAuthSession = (account: { id: string; name: string; email: string; token?: string; workspace?: Workspace; organisationId?: string; demo?: boolean; membership?: OrganisationMembership }, needsOnboarding: boolean = false) => {
    const authSession = saveAuthSession(account);
    const authority = buildAuthProfile(account, needsOnboarding);
    const saved = readScopedJson<UserProfile>(STORAGE_KEYS.USER, account.id);
    const profile = { ...authority, ...(saved ?? {}), id: account.id, name: account.name, email: account.email, role: authority.role };
    setCommunity(readScopedJson<CommunityProject>(STORAGE_KEYS.COMMUNITY, account.id) ?? structuredClone(INITIAL_COMMUNITY));
    setAuditLogs(readScopedJson<AuditLogItem[]>(STORAGE_KEYS.LOGS, account.id) ?? structuredClone(INITIAL_AUDIT_LOGS));
    setOptimisationParams({ roofAreaSqFt: 1400, targetCapacityKw: 12, budgetCeilingInr: 580000, financingRatePercentage: 8.5, participantCapInr: 4500, stressFactors: { monsoonDrop: false, rateSpike: false, unitDropOut: false, subsidyDelay: false } });
    setSession(authSession);
    setCurrentRole(profile.role);
    setCurrentUser(profile);
    localStorage.setItem(scopedStorageKey(STORAGE_KEYS.ROLE, account.id), profile.role);
    localStorage.setItem(scopedStorageKey(STORAGE_KEYS.USER, account.id), JSON.stringify(profile));
  };

  const signUp = async (name: string, email: string, password: string, workspace: Workspace = 'household'): Promise<AuthResult> => {
    try {
      const result = await post('/auth/register', { name, email, password, workspace });
      applyAuthSession({ ...result.account, token: result.token }, true);
      return { success: true };
    } catch (error) { return { success: false, error: (error as Error).message }; }
  };

  const logIn = async (email: string, password: string, workspace: Workspace = 'household'): Promise<AuthResult> => {
    try {
      const result = await post('/auth/login', { email, password, workspace });
      applyAuthSession({ ...result.account, token: result.token });
      return { success: true };
    } catch (error) {
      // Preserve preexisting browser-local household accounts without granting API access.
      if (workspace === 'household') {
        const legacy = await authenticateAccount(email, password);
        if (legacy.success && legacy.account) { applyAuthSession(legacy.account); return { success: true }; }
      }
      return { success: false, error: (error as Error).message };
    }
  };

  const demoLogin = async (workspace: Workspace, persona: 'owner' | 'tenant' = 'owner'): Promise<AuthResult> => {
    try {
      const result = await post('/auth/demo', { workspace, persona });
      applyAuthSession({ ...result.account, token: result.token });
      return { success: true };
    } catch (error) { return { success: false, error: (error as Error).message }; }
  };

  const logOut = () => {
    if (session?.token) post('/auth/logout', {}).catch(() => {});
    clearAuthSession();
    localStorage.removeItem('solaris_active_property');
    setSession(null);
    setCurrentRole('household');
    setCurrentUser(DEMO_USERS['household']);
    setCommunity(structuredClone(INITIAL_COMMUNITY)); setAuditLogs(structuredClone(INITIAL_AUDIT_LOGS));
    setIsConsentModalOpen(false);
    setIsSidebarOpen(false);
    navigateTo('/');
  };

  const updateCommunity = (updates: Partial<CommunityProject>) => {
    setCommunity(prev => {
      const updated = { ...prev, ...updates };
      localStorage.setItem(scopedStorageKey(STORAGE_KEYS.COMMUNITY, session?.accountId), JSON.stringify(updated));
      return updated;
    });
  };

  const inviteMember = (newMemberData: Omit<CommunityMember, 'id'>) => {
    const newId = `m_${Date.now()}`;
    const newMember: CommunityMember = {
      ...newMemberData,
      id: newId
    };
    const updatedMembers = [...community.members, newMember];
    updateCommunity({
      members: updatedMembers,
      totalEligibleFlats: community.totalEligibleFlats + 1
    });
    addAuditLog(
      'Participant Added',
      `Invited ${newMember.ownerName} (${newMember.flatNumber}, ${newMember.tower}) with CA #${newMember.caNumber}`,
      'consent'
    );
  };

  const toggleMemberConsent = (memberId: string) => {
    const updated = community.members.map(m => {
      if (m.id === memberId) {
        const nextSigned = !m.consentSigned;
        return {
          ...m,
          consentSigned: nextSigned,
          status: (nextSigned ? 'signed_deposited' : 'pending_invite') as CommunityMember['status']
        };
      }
      return m;
    });
    updateCommunity({ members: updated });
  };

  const signUserConsent = () => {
    updateCurrentUser({
      consentSigned: true,
      consentDate: new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    });
    // Also update in community members list if matching
    const updated = community.members.map(m => {
      if (m.flatNumber.includes('301')) {
        return { ...m, consentSigned: true, status: 'signed_deposited' as const };
      }
      return m;
    });
    updateCommunity({
      members: updated,
      committedMembersCount: Math.min(community.totalEligibleFlats, community.committedMembersCount + 1),
      totalCommittedInr: community.totalCommittedInr + 45000
    });
    addAuditLog(
      'Digital Member Consent Executed',
      `Rohit Rao (Flat 301) digitally signed single-point BRPL Virtual Net Metering agreement.`,
      'consent'
    );
    setIsConsentModalOpen(false);
  };

  const addAuditLog = (action: string, details: string, category: AuditLogItem['category'] = 'system') => {
    const newLog: AuditLogItem = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toLocaleString('en-IN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }) + ' IST',
      actor: currentUser.name,
      action,
      details,
      category
    };
    setAuditLogs(prev => {
      const updated = [newLog, ...prev];
      localStorage.setItem(scopedStorageKey(STORAGE_KEYS.LOGS, session?.accountId), JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AppContext.Provider
      value={{
        currentRole,
        currentUser,
        switchRole,
        updateCurrentUser,
        currentPath,
        navigateTo,
        isAuthenticated,
        signUp,
        logIn,
        demoLogin,
        logOut,
        community,
        updateCommunity,
        inviteMember,
        toggleMemberConsent,
        signUserConsent,
        isConsentModalOpen,
        setIsConsentModalOpen,
        optimisationParams,
        setOptimisationParams,
        optimisationResult,
        rerunOptimiser,
        auditLogs,
        addAuditLog,
        isSidebarOpen,
        setIsSidebarOpen,
        currentWorkspaceAccess,
        getWorkspaceAccess
      }}
    >
      {stateError && <div role="alert" className="fixed bottom-4 left-4 z-[100] max-w-sm rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">Residential sync unavailable: {stateError}. Your local account data remains saved.</div>}
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
