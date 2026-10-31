import type { OrganisationMembership } from '../types/commercial';
export interface AuthAccount {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface AuthSession {
  accountId: string;
  name: string;
  email: string;
  token?: string;
  workspace?: 'household' | 'commercial';
  organisationId?: string;
  demo?: boolean;
  membership?: OrganisationMembership;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  account?: AuthAccount;
}

const ACCOUNTS_KEY = 'solaris_auth_accounts';
const SESSION_KEY = 'solaris_auth_session';

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const readAccounts = (): AuthAccount[] => {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeAccounts = (accounts: AuthAccount[]) => {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
};

const fallbackHash = (value: string): string => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `fallback-${(hash >>> 0).toString(16)}`;
};

export const hashPassword = async (password: string): Promise<string> => {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const data = new TextEncoder().encode(`solaris:${password}`);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  }
  return fallbackHash(`solaris:${password}`);
};

export const getAuthSession = (): AuthSession | null => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.accountId || !parsed?.email) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const saveAuthSession = (account: Pick<AuthAccount, 'id' | 'name' | 'email'> & Partial<Pick<AuthSession, 'token' | 'workspace' | 'organisationId' | 'demo' | 'membership'>>) => {
  const session: AuthSession = {
    accountId: account.id,
    name: account.name,
    email: account.email,
    token: account.token,
    workspace: account.workspace,
    organisationId: account.organisationId,
    demo: account.demo,
    membership: account.membership
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
};

export const clearAuthSession = () => {
  localStorage.removeItem(SESSION_KEY);
};

export const registerAccount = async (name: string, email: string, password: string): Promise<AuthResult> => {
  const cleanName = name.trim();
  const cleanEmail = normalizeEmail(email);

  if (cleanName.length < 2) {
    return { success: false, error: 'Please enter your full name.' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return { success: false, error: 'Please enter a valid email address.' };
  }
  if (password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters long.' };
  }

  const accounts = readAccounts();
  if (accounts.some((account) => account.email === cleanEmail)) {
    return { success: false, error: 'An account with this email already exists. Please log in.' };
  }

  const account: AuthAccount = {
    id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: cleanName,
    email: cleanEmail,
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString()
  };

  writeAccounts([...accounts, account]);
  return { success: true, account };
};

export const authenticateAccount = async (email: string, password: string): Promise<AuthResult> => {
  const cleanEmail = normalizeEmail(email);
  const accounts = readAccounts();
  const account = accounts.find((entry) => entry.email === cleanEmail);

  if (!account) {
    return { success: false, error: 'Invalid email or password.' };
  }

  const passwordHash = await hashPassword(password);
  if (account.passwordHash !== passwordHash) {
    return { success: false, error: 'Invalid email or password.' };
  }

  return { success: true, account };
};
