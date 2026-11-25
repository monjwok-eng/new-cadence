'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  browserLocalPersistence,
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import {
  auth,
  googleAuthProvider,
  validateFirestoreConnection,
} from '@/lib/firebase';
import {
  COOKIE_CONSENT_NAME,
  CookieConsentValue,
  SESSION_HINT_COOKIE,
  THEME_COOKIE_NAME,
  WORKSPACE_COOKIE_NAME,
  deleteClientCookie,
  getClientCookie,
  setClientCookie,
} from '@/lib/cookies';
import { AVAILABLE_PHONE_CATALOG } from '@/lib/demo-data';
import { mapFirebaseAuthError } from '@/lib/firestore-errors';
import {
  connectPhoneNumberInDb,
  createApiKeyInDb,
  createKnowledgeUrlOrTextInDb,
  createLeadInDb,
  createVoiceAgentInDb,
  createWorkspaceInDb,
  deleteApiKeyInDb,
  deleteKnowledgeSourceInDb,
  deleteLeadInDb,
  deletePhoneNumberInDb,
  deleteVoiceAgentInDb,
  ensureUserOnboarding,
  inviteWorkspaceMemberInDb,
  removeWorkspaceMemberInDb,
  saveOnboardingInDb,
  selectPlanInDb,
  subscribeUserWorkspaces,
  subscribePublicWidgetLeads,
  subscribePublicWidgetTurns,
  subscribeWorkspaceAgents,
  subscribeWorkspaceApiKeys,
  subscribeWorkspaceCalls,
  subscribeWorkspaceKnowledge,
  subscribeWorkspaceLeads,
  subscribeWorkspaceMembers,
  subscribeWorkspacePhoneNumbers,
  syncPublicWidgetDoc,
  syncPublicWidgetKnowledgeBundle,
  updateKnowledgeSourceInDb,
  updateLeadStatusInDb,
  updatePhoneNumberAgentInDb,
  updateUserProfileInDb,
  updateVoiceAgentInDb,
  updateWorkspaceInDb,
  updateWorkspaceMemberRoleInDb,
  uploadKnowledgeDocumentInDb,
} from '@/lib/services/workspace-service';
import {
  AgentStatus,
  ApiKeyItem,
  BillingCycle,
  CallRecord,
  KnowledgeSource,
  Lead,
  LeadStatus,
  OnboardingData,
  PhoneNumberItem,
  PlanTier,
  TeamMember,
  UserProfile,
  VoiceAgent,
  Workspace,
  WorkspaceRole,
} from '@/lib/types';

export type ThemeMode = 'light' | 'dark';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'error';
}

const THEME_STORAGE_KEY = 'cadence_theme_v1';
const ACTIVE_WS_STORAGE_KEY = 'cadence_active_ws_v1';

interface AppContextValue {
  authReady: boolean;
  isReady: boolean;
  isLoading: boolean;
  firebaseUser: User | null;
  isEmailVerified: boolean;
  backendError: string | null;
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
  user: UserProfile | null;
  activeRole: WorkspaceRole;
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  setActiveWorkspaceId: (id: string) => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (
    fullName: string,
    email: string,
    password: string,
    workspaceName?: string
  ) => Promise<{ needsVerification: boolean }>;
  sendPasswordReset: (email: string) => Promise<void>;
  confirmPasswordResetCode: (oobCode: string, newPassword: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  refreshAuthUser: () => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (updates: {
    fullName: string;
    email: string;
    roleTitle: string;
  }) => Promise<void>;
  saveOnboardingProgress: (
    data: OnboardingData,
    completed: boolean
  ) => Promise<void>;
  selectPricingPlan: (input: {
    planName: PlanTier;
    billingCycle: BillingCycle;
    subscriptionStatus: 'active' | 'trialing';
    billingProvider: string;
    enterpriseContact?: { company?: string; notes?: string };
  }) => Promise<void>;
  createWorkspace: (name: string, industry: string) => Promise<void>;
  updateWorkspace: (
    id: string,
    updates: { name: string; industry: string; timezone: string }
  ) => Promise<void>;
  agents: VoiceAgent[];
  addAgent: (
    agent: Omit<
      VoiceAgent,
      | 'id'
      | 'workspaceId'
      | 'workspaceOwnerId'
      | 'memberUids'
      | 'createdBy'
      | 'callsCount'
      | 'avgDurationSec'
      | 'leadsCaptured'
      | 'updatedAt'
    >
  ) => Promise<string>;
  updateAgent: (id: string, updates: Partial<VoiceAgent>) => Promise<void>;
  deleteAgent: (id: string) => Promise<void>;
  toggleAgentStatus: (id: string, status: AgentStatus) => Promise<void>;
  knowledgeSources: KnowledgeSource[];
  addWebsiteOrTextKnowledge: (input: {
    agentId: string;
    sourceType: 'website' | 'text';
    sourceName: string;
    sourceUrl?: string;
    content?: string;
  }) => Promise<string | undefined>;
  updateKnowledgeSource: (
    sourceId: string,
    updates: {
      content?: string;
      processingStatus?: 'queued' | 'crawling' | 'processing' | 'ready' | 'failed';
    }
  ) => Promise<void>;
  uploadKnowledgeFile: (agentId: string, file: File) => Promise<string | undefined>;
  deleteKnowledgeSource: (source: KnowledgeSource) => Promise<void>;
  syncPublicWidgets: () => Promise<void>;
  connectedNumbers: PhoneNumberItem[];
  availableNumbers: PhoneNumberItem[];
  connectPhoneNumber: (
    item: PhoneNumberItem,
    assignedAgentId: string | null
  ) => Promise<void>;
  assignAgentToNumber: (numberId: string, agentId: string | null) => Promise<void>;
  disconnectPhoneNumber: (numberId: string) => Promise<void>;
  calls: CallRecord[];
  leads: Lead[];
  addLead: (input: {
    agentId: string;
    agentName: string;
    visitorName: string;
    visitorEmail: string;
    visitorPhone?: string;
    company?: string;
    inquirySummary?: string;
    sourcePageUrl?: string;
    status?: LeadStatus;
  }) => Promise<string | undefined>;
  updateLeadStatus: (leadId: string, status: LeadStatus) => Promise<void>;
  deleteLead: (leadId: string) => Promise<void>;
  teamMembers: TeamMember[];
  inviteTeamMember: (email: string, role: 'admin' | 'member') => Promise<void>;
  updateTeamMemberRole: (
    memberId: string,
    role: 'admin' | 'member'
  ) => Promise<void>;
  removeTeamMember: (memberId: string) => Promise<void>;
  apiKeys: ApiKeyItem[];
  createApiKey: (name: string) => Promise<{ rawPreview: string }>;
  deleteApiKey: (keyId: string) => Promise<void>;
  toasts: ToastMessage[];
  pushToast: (toast: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;
  wizardOpen: boolean;
  editingAgent: VoiceAgent | null;
  openCreateWizard: () => void;
  openEditWizard: (agent: VoiceAgent) => void;
  closeWizard: () => void;
  cookieConsent: CookieConsentValue | null;
  cookieBannerOpen: boolean;
  openCookieSettings: () => void;
  closeCookieBanner: () => void;
  acceptCookies: () => Promise<void>;
  declineCookies: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [authReady, setAuthReady] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [loadedAgentsWorkspaceId, setLoadedAgentsWorkspaceId] = useState<string | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);

  const [theme, setThemeState] = useState<ThemeMode>('light');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState<string>('');
  const [rawAgents, setRawAgents] = useState<VoiceAgent[]>([]);
  const [knowledgeSources, setKnowledgeSources] = useState<KnowledgeSource[]>([]);
  const [connectedNumbers, setConnectedNumbers] = useState<PhoneNumberItem[]>([]);
  const [workspaceCalls, setWorkspaceCalls] = useState<CallRecord[]>([]);
  const [widgetCalls, setWidgetCalls] = useState<CallRecord[]>([]);
  const [workspaceLeads, setWorkspaceLeads] = useState<Lead[]>([]);
  const [widgetLeads, setWidgetLeads] = useState<Lead[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<VoiceAgent | null>(null);
  const [cookieConsent, setCookieConsent] = useState<CookieConsentValue | null>(null);
  const [cookieBannerOpen, setCookieBannerOpen] = useState(false);

  const pendingRegistrationMetaRef = useRef<{
    fullName?: string;
    workspaceName?: string;
  }>({});
  const cookieConsentRef = useRef<CookieConsentValue | null>(null);

  const applyThemeClass = useCallback(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.remove('dark');
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        applyThemeClass();
        const cookieChoice = getClientCookie(COOKIE_CONSENT_NAME);
        const storedChoice = window.localStorage.getItem(COOKIE_CONSENT_NAME);
        const resolvedChoice =
          cookieChoice === 'accepted' || cookieChoice === 'declined'
            ? cookieChoice
            : storedChoice === 'accepted' || storedChoice === 'declined'
              ? storedChoice
              : null;

        cookieConsentRef.current = resolvedChoice;
        setCookieConsent(resolvedChoice);
        if (!resolvedChoice) {
          setCookieBannerOpen(true);
        }

        if (resolvedChoice !== 'declined') {
          window.localStorage.setItem(THEME_STORAGE_KEY, 'light');
          if (resolvedChoice === 'accepted') {
            setClientCookie(THEME_COOKIE_NAME, 'light');
          }
          const savedWs =
            getClientCookie(WORKSPACE_COOKIE_NAME) ||
            window.localStorage.getItem(ACTIVE_WS_STORAGE_KEY);
          if (savedWs) {
            setActiveWorkspaceIdState(savedWs);
          }
        }
      } catch {
        // Ignore storage errors
      }
      validateFirestoreConnection().then((ok) => {
        if (!ok) {
          setBackendError(
            'Unable to connect to the database. Check your network and Firebase configuration.'
          );
        }
      });
    });
  }, [applyThemeClass]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (toast: Omit<ToastMessage, 'id'>) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { ...toast, id }]);
      window.setTimeout(() => dismissToast(id), 4500);
    },
    [dismissToast]
  );

  const setTheme = useCallback(
    (_mode: ThemeMode) => {
      void _mode;
      setThemeState('light');
      applyThemeClass();
      if (cookieConsentRef.current === 'declined') return;
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, 'light');
        if (cookieConsentRef.current === 'accepted') {
          setClientCookie(THEME_COOKIE_NAME, 'light');
        }
      } catch {
        // Ignore
      }
    },
    [applyThemeClass]
  );

  const toggleTheme = useCallback(() => {
    setTheme('light');
  }, [setTheme]);

  useEffect(() => {
    setPersistence(auth, browserLocalPersistence).catch(() => {
      // Fallback to default persistence if storage restricted
    });

    let unsubWorkspaces: (() => void) | null = null;
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (unsubWorkspaces) {
        unsubWorkspaces();
        unsubWorkspaces = null;
      }

      setFirebaseUser(fbUser);
      if (!fbUser) {
        deleteClientCookie(SESSION_HINT_COOKIE);
        fetch('/api/auth/session', { method: 'DELETE' }).catch(() => {});
        setIsEmailVerified(false);
        setUser(null);
        setWorkspaces([]);
        setRawAgents([]);
        setKnowledgeSources([]);
        setConnectedNumbers([]);
        setWorkspaceCalls([]);
        setWidgetCalls([]);
        setWorkspaceLeads([]);
        setWidgetLeads([]);
        setTeamMembers([]);
        setApiKeys([]);
        setLoadedAgentsWorkspaceId(null);
        setIsReady(true);
        setAuthReady(true);
        return;
      }

      setClientCookie(SESSION_HINT_COOKIE, '1', 60 * 60 * 24 * 30);
      fbUser
        .getIdToken()
        .then((token) =>
          fetch('/api/auth/session', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          })
        )
        .catch(() => {});

      setIsEmailVerified(fbUser.emailVerified);
      setAuthReady(true);

      if (!fbUser.emailVerified) {
        setIsReady(true);
        return;
      }

      setIsReady(false);
      try {
        const { profile, defaultWorkspaceId } = await ensureUserOnboarding(
          fbUser,
          pendingRegistrationMetaRef.current.fullName,
          pendingRegistrationMetaRef.current.workspaceName
        );
        pendingRegistrationMetaRef.current = {};
        setUser(profile);
        setBackendError(null);

        unsubWorkspaces = subscribeUserWorkspaces(fbUser.uid, (list) => {
          setWorkspaces(list);
          setActiveWorkspaceIdState((current) => {
            if (current && list.some((w) => w.id === current)) return current;
            const nextId = list[0]?.id || defaultWorkspaceId;
            if (cookieConsentRef.current !== 'declined' && nextId) {
              try {
                window.localStorage.setItem(ACTIVE_WS_STORAGE_KEY, nextId);
                if (cookieConsentRef.current === 'accepted') {
                  setClientCookie(WORKSPACE_COOKIE_NAME, nextId);
                }
              } catch {
                // Ignore
              }
            }
            return nextId;
          });
          setIsReady(true);
        });
      } catch (err) {
        setBackendError(
          err instanceof Error ? err.message : 'Failed to load user workspace.'
        );
        setIsReady(true);
      }
    });

    return () => {
      unsubscribe();
      if (unsubWorkspaces) unsubWorkspaces();
    };
  }, []);

  const activeWorkspace = useMemo(
    () => workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0] || null,
    [workspaces, activeWorkspaceId]
  );

  const setActiveWorkspaceId = useCallback((id: string) => {
    setActiveWorkspaceIdState(id);
    if (cookieConsentRef.current === 'declined') return;
    try {
      window.localStorage.setItem(ACTIVE_WS_STORAGE_KEY, id);
      if (cookieConsentRef.current === 'accepted') {
        setClientCookie(WORKSPACE_COOKIE_NAME, id);
      }
    } catch {
      // Ignore
    }
  }, []);

  const acceptCookies = useCallback(async () => {
    cookieConsentRef.current = 'accepted';
    setCookieConsent('accepted');
    setCookieBannerOpen(false);
    setClientCookie(COOKIE_CONSENT_NAME, 'accepted');
    setClientCookie(THEME_COOKIE_NAME, theme);
    if (activeWorkspaceId) {
      setClientCookie(WORKSPACE_COOKIE_NAME, activeWorkspaceId);
    }
    try {
      window.localStorage.setItem(COOKIE_CONSENT_NAME, 'accepted');
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
      if (activeWorkspaceId) {
        window.localStorage.setItem(ACTIVE_WS_STORAGE_KEY, activeWorkspaceId);
      }
    } catch {
      // Ignore
    }
    try {
      await fetch('/api/cookies/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ choice: 'accepted' }),
      });
    } catch {
      // Ignore network errors; client cookie already saved
    }
  }, [theme, activeWorkspaceId]);

  const declineCookies = useCallback(async () => {
    cookieConsentRef.current = 'declined';
    setCookieConsent('declined');
    setCookieBannerOpen(false);
    setClientCookie(COOKIE_CONSENT_NAME, 'declined');
    deleteClientCookie(THEME_COOKIE_NAME);
    deleteClientCookie(WORKSPACE_COOKIE_NAME);
    try {
      window.localStorage.setItem(COOKIE_CONSENT_NAME, 'declined');
      window.localStorage.removeItem(THEME_STORAGE_KEY);
      window.localStorage.removeItem(ACTIVE_WS_STORAGE_KEY);
    } catch {
      // Ignore
    }
    try {
      await fetch('/api/cookies/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ choice: 'declined' }),
      });
    } catch {
      // Ignore network errors
    }
  }, []);

  const openCookieSettings = useCallback(() => {
    setCookieBannerOpen(true);
  }, []);

  const closeCookieBanner = useCallback(() => {
    setCookieBannerOpen(false);
  }, []);

  useEffect(() => {
    if (!authReady || !firebaseUser || !isEmailVerified || !activeWorkspace) {
      return;
    }

    const wsId = activeWorkspace.id;
    const uid = firebaseUser.uid;
    const ownerId = activeWorkspace.ownerId;

    const unsubs = [
      subscribeWorkspaceAgents(wsId, uid, (list) => {
        setRawAgents(list);
        setLoadedAgentsWorkspaceId(wsId);
      }),
      subscribeWorkspaceKnowledge(wsId, uid, setKnowledgeSources),
      subscribeWorkspacePhoneNumbers(wsId, uid, setConnectedNumbers),
      subscribeWorkspaceCalls(wsId, uid, setWorkspaceCalls),
      subscribePublicWidgetTurns(wsId, ownerId, uid, setWidgetCalls),
      subscribeWorkspaceLeads(wsId, uid, setWorkspaceLeads),
      subscribePublicWidgetLeads(wsId, ownerId, uid, setWidgetLeads),
      subscribeWorkspaceMembers(wsId, uid, setTeamMembers),
      subscribeWorkspaceApiKeys(wsId, uid, setApiKeys),
    ];

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [authReady, firebaseUser, isEmailVerified, activeWorkspace]);

  useEffect(() => {
    if (!authReady || !firebaseUser || !isEmailVerified || !activeWorkspace || rawAgents.length === 0) {
      return;
    }
    const wsId = activeWorkspace.id;
    const ownerId = activeWorkspace.ownerId;
    rawAgents.forEach((agent) => {
      syncPublicWidgetDoc(agent.id, wsId, ownerId, agent).catch(() => {});
      syncPublicWidgetKnowledgeBundle(wsId, agent.id, knowledgeSources).catch(() => {});
    });
  }, [authReady, firebaseUser, isEmailVerified, activeWorkspace, rawAgents, knowledgeSources]);

  const calls = useMemo(() => {
    return [...widgetCalls, ...workspaceCalls];
  }, [widgetCalls, workspaceCalls]);

  const leads = useMemo(() => {
    return [...widgetLeads, ...workspaceLeads];
  }, [widgetLeads, workspaceLeads]);

  const agents = useMemo(() => {
    return rawAgents.map((agent) => {
      const agentCalls = calls.filter((c) => c.agentId === agent.id);
      const agentLeads = leads.filter((l) => l.agentId === agent.id);
      const callsCount = agentCalls.length;
      const totalDuration = agentCalls.reduce((sum, c) => sum + c.durationSeconds, 0);
      const avgDurationSec = callsCount > 0 ? Math.round(totalDuration / callsCount) : 0;
      const leadsCaptured =
        agentLeads.length +
        agentCalls.filter((c) => c.callStatus === 'lead_captured').length;
      return {
        ...agent,
        callsCount,
        avgDurationSec,
        leadsCaptured,
      };
    });
  }, [rawAgents, calls, leads]);

  const activeRole: WorkspaceRole = useMemo(() => {
    if (!firebaseUser || !activeWorkspace) return 'member';
    if (activeWorkspace.ownerId === firebaseUser.uid) return 'owner';
    const member = teamMembers.find((m) => m.userId === firebaseUser.uid);
    return member?.role || 'member';
  }, [firebaseUser, activeWorkspace, teamMembers]);

  const availableNumbers = useMemo(() => {
    const connectedSet = new Set(connectedNumbers.map((c) => c.number));
    return AVAILABLE_PHONE_CATALOG.filter((item) => !connectedSet.has(item.number));
  }, [connectedNumbers]);

  const signInWithGoogle = useCallback(async () => {
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (error) {
      throw new Error(mapFirebaseAuthError(error));
    }
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error) {
      throw new Error(mapFirebaseAuthError(error));
    }
  }, []);

  const registerWithEmail = useCallback(
    async (
      fullName: string,
      email: string,
      password: string,
      workspaceName?: string
    ) => {
      try {
        pendingRegistrationMetaRef.current = {
          fullName: fullName.trim(),
          workspaceName: workspaceName?.trim(),
        };
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (fullName.trim()) {
          await updateProfile(cred.user, { displayName: fullName.trim() });
        }
        await sendEmailVerification(cred.user);
        return { needsVerification: !cred.user.emailVerified };
      } catch (error) {
        pendingRegistrationMetaRef.current = {};
        throw new Error(mapFirebaseAuthError(error));
      }
    },
    []
  );

  const sendPasswordReset = useCallback(async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (error) {
      throw new Error(mapFirebaseAuthError(error));
    }
  }, []);

  const confirmPasswordResetCode = useCallback(
    async (oobCode: string, newPassword: string) => {
      try {
        await confirmPasswordReset(auth, oobCode, newPassword);
      } catch (error) {
        throw new Error(mapFirebaseAuthError(error));
      }
    },
    []
  );

  const resendVerificationEmail = useCallback(async () => {
    if (!auth.currentUser) throw new Error('No active user session.');
    try {
      await sendEmailVerification(auth.currentUser);
    } catch (error) {
      throw new Error(mapFirebaseAuthError(error));
    }
  }, []);

  const refreshAuthUser = useCallback(async (): Promise<boolean> => {
    if (!auth.currentUser) return false;
    await auth.currentUser.reload();
    await auth.currentUser.getIdToken(true);
    const verified = Boolean(auth.currentUser.emailVerified);
    setIsEmailVerified(verified);
    if (verified) {
      const { profile, defaultWorkspaceId } = await ensureUserOnboarding(
        auth.currentUser
      );
      setUser(profile);
      setActiveWorkspaceIdState((curr) => curr || defaultWorkspaceId);
    }
    return verified;
  }, []);

  const logout = useCallback(async () => {
    deleteClientCookie(SESSION_HINT_COOKIE);
    deleteClientCookie(WORKSPACE_COOKIE_NAME);
    try {
      await fetch('/api/auth/session', { method: 'DELETE' });
    } catch {
      // Ignore network errors
    }
    await signOut(auth);
    try {
      window.localStorage.removeItem(ACTIVE_WS_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  const updateUser = useCallback(
    async (updates: { fullName: string; email: string; roleTitle: string }) => {
      if (!firebaseUser) throw new Error('Authentication required.');
      await updateUserProfileInDb(firebaseUser.uid, updates);
      if (updates.fullName.trim()) {
        await updateProfile(firebaseUser, { displayName: updates.fullName.trim() });
      }
      setUser((prev) =>
        prev
          ? {
              ...prev,
              fullName: updates.fullName.trim(),
              email: updates.email.trim(),
              roleTitle: updates.roleTitle.trim(),
              initials: updates.fullName
                .trim()
                .split(/\s+/)
                .slice(0, 2)
                .map((p) => p[0]?.toUpperCase() || '')
                .join(''),
            }
          : prev
      );
    },
    [firebaseUser]
  );

  const saveOnboardingProgress = useCallback(
    async (data: OnboardingData, completed: boolean) => {
      if (!firebaseUser) throw new Error('Authentication required.');
      const cleanData = await saveOnboardingInDb(firebaseUser.uid, data, completed);
      setUser((prev) =>
        prev
          ? {
              ...prev,
              onboardingData: cleanData,
              onboardingCompleted: completed,
            }
          : prev
      );
    },
    [firebaseUser]
  );

  const selectPricingPlan = useCallback(
    async (input: {
      planName: PlanTier;
      billingCycle: BillingCycle;
      subscriptionStatus: 'active' | 'trialing';
      billingProvider: string;
      enterpriseContact?: { company?: string; notes?: string };
    }) => {
      if (!firebaseUser) throw new Error('Authentication required.');
      await selectPlanInDb(firebaseUser.uid, activeWorkspace, input);
      setUser((prev) =>
        prev
          ? {
              ...prev,
              planSelected: true,
              selectedPlan: input.planName,
              billingCycle: input.billingCycle,
            }
          : prev
      );
    },
    [firebaseUser, activeWorkspace]
  );

  const createWorkspace = useCallback(
    async (name: string, industry: string) => {
      if (!firebaseUser || !user) throw new Error('Authentication required.');
      const wsId = await createWorkspaceInDb(
        firebaseUser.uid,
        user.fullName,
        user.email,
        name,
        industry
      );
      setActiveWorkspaceId(wsId);
      pushToast({
        title: 'Workspace created',
        description: `Switched to ${name.trim()}`,
        variant: 'success',
      });
    },
    [firebaseUser, user, setActiveWorkspaceId, pushToast]
  );

  const updateWorkspace = useCallback(
    async (
      id: string,
      updates: { name: string; industry: string; timezone: string }
    ) => {
      if (!firebaseUser) throw new Error('Authentication required.');
      await updateWorkspaceInDb(firebaseUser.uid, id, updates);
    },
    [firebaseUser]
  );

  const addAgent = useCallback(
    async (
      input: Omit<
        VoiceAgent,
        | 'id'
        | 'workspaceId'
        | 'workspaceOwnerId'
        | 'memberUids'
        | 'createdBy'
        | 'callsCount'
        | 'avgDurationSec'
        | 'leadsCaptured'
        | 'updatedAt'
      >
    ): Promise<string> => {
      if (!firebaseUser || !activeWorkspace) throw new Error('Workspace not ready.');
      return await createVoiceAgentInDb(activeWorkspace, firebaseUser.uid, input);
    },
    [firebaseUser, activeWorkspace]
  );

  const updateAgent = useCallback(
    async (id: string, updates: Partial<VoiceAgent>) => {
      if (!activeWorkspace) throw new Error('Workspace not ready.');
      await updateVoiceAgentInDb(activeWorkspace.id, id, updates);
    },
    [activeWorkspace]
  );

  const deleteAgent = useCallback(
    async (id: string) => {
      if (!activeWorkspace) throw new Error('Workspace not ready.');
      await deleteVoiceAgentInDb(activeWorkspace.id, id);
    },
    [activeWorkspace]
  );

  const toggleAgentStatus = useCallback(
    async (id: string, status: AgentStatus) => {
      if (!activeWorkspace) throw new Error('Workspace not ready.');
      await updateVoiceAgentInDb(activeWorkspace.id, id, { status });
    },
    [activeWorkspace]
  );

  const addWebsiteOrTextKnowledge = useCallback(
    async (input: {
      agentId: string;
      sourceType: 'website' | 'text';
      sourceName: string;
      sourceUrl?: string;
      content?: string;
    }): Promise<string | undefined> => {
      if (!firebaseUser || !activeWorkspace) throw new Error('Workspace not ready.');
      return await createKnowledgeUrlOrTextInDb(activeWorkspace, firebaseUser.uid, input);
    },
    [firebaseUser, activeWorkspace]
  );

  const uploadKnowledgeFile = useCallback(
    async (agentId: string, file: File): Promise<string | undefined> => {
      if (!firebaseUser || !activeWorkspace) throw new Error('Workspace not ready.');
      return await uploadKnowledgeDocumentInDb(activeWorkspace, firebaseUser.uid, agentId, file);
    },
    [firebaseUser, activeWorkspace]
  );

  const updateKnowledgeSource = useCallback(
    async (
      sourceId: string,
      updates: {
        content?: string;
        processingStatus?: 'queued' | 'crawling' | 'processing' | 'ready' | 'failed';
      }
    ) => {
      if (!activeWorkspace) throw new Error('Workspace not ready.');
      await updateKnowledgeSourceInDb(activeWorkspace.id, sourceId, updates);
    },
    [activeWorkspace]
  );

  const deleteKnowledgeSource = useCallback(
    async (source: KnowledgeSource) => {
      if (!activeWorkspace) throw new Error('Workspace not ready.');
      await deleteKnowledgeSourceInDb(activeWorkspace.id, source);
    },
    [activeWorkspace]
  );

  const syncPublicWidgets = useCallback(async () => {
    if (!activeWorkspace) return;
    await Promise.all(
      rawAgents.map(async (agent) => {
        await syncPublicWidgetDoc(
          agent.id,
          activeWorkspace.id,
          activeWorkspace.ownerId,
          agent
        );
        await syncPublicWidgetKnowledgeBundle(
          activeWorkspace.id,
          agent.id,
          knowledgeSources
        );
      })
    );
  }, [activeWorkspace, rawAgents, knowledgeSources]);

  const connectPhoneNumber = useCallback(
    async (item: PhoneNumberItem, assignedAgentId: string | null) => {
      if (!activeWorkspace) throw new Error('Workspace not ready.');
      await connectPhoneNumberInDb(activeWorkspace, item, assignedAgentId);
    },
    [activeWorkspace]
  );

  const assignAgentToNumber = useCallback(
    async (numberId: string, agentId: string | null) => {
      if (!activeWorkspace) throw new Error('Workspace not ready.');
      await updatePhoneNumberAgentInDb(activeWorkspace.id, numberId, agentId);
    },
    [activeWorkspace]
  );

  const disconnectPhoneNumber = useCallback(
    async (numberId: string) => {
      if (!activeWorkspace) throw new Error('Workspace not ready.');
      await deletePhoneNumberInDb(activeWorkspace.id, numberId);
    },
    [activeWorkspace]
  );

  const inviteTeamMember = useCallback(
    async (email: string, role: 'admin' | 'member') => {
      if (!activeWorkspace) throw new Error('Workspace not ready.');
      await inviteWorkspaceMemberInDb(activeWorkspace, email, role);
    },
    [activeWorkspace]
  );

  const updateTeamMemberRole = useCallback(
    async (memberId: string, role: 'admin' | 'member') => {
      if (!activeWorkspace) throw new Error('Workspace not ready.');
      await updateWorkspaceMemberRoleInDb(activeWorkspace.id, memberId, role);
    },
    [activeWorkspace]
  );

  const removeTeamMember = useCallback(
    async (memberId: string) => {
      if (!activeWorkspace) throw new Error('Workspace not ready.');
      await removeWorkspaceMemberInDb(activeWorkspace.id, memberId);
    },
    [activeWorkspace]
  );

  const createApiKey = useCallback(
    async (name: string) => {
      if (!firebaseUser || !activeWorkspace) throw new Error('Workspace not ready.');
      return await createApiKeyInDb(activeWorkspace, firebaseUser.uid, name);
    },
    [firebaseUser, activeWorkspace]
  );

  const deleteApiKey = useCallback(
    async (keyId: string) => {
      if (!activeWorkspace) throw new Error('Workspace not ready.');
      await deleteApiKeyInDb(activeWorkspace.id, keyId);
    },
    [activeWorkspace]
  );

  const addLead = useCallback(
    async (input: {
      agentId: string;
      agentName: string;
      visitorName: string;
      visitorEmail: string;
      visitorPhone?: string;
      company?: string;
      inquirySummary?: string;
      sourcePageUrl?: string;
      status?: LeadStatus;
    }) => {
      if (!activeWorkspace) throw new Error('Workspace not ready.');
      return await createLeadInDb(activeWorkspace, input);
    },
    [activeWorkspace]
  );

  const updateLeadStatus = useCallback(
    async (leadId: string, status: LeadStatus) => {
      if (!activeWorkspace) throw new Error('Workspace not ready.');
      const target = leads.find((l) => l.id === leadId);
      await updateLeadStatusInDb(
        activeWorkspace.id,
        leadId,
        status,
        target?.storageCollection || 'workspace'
      );
    },
    [activeWorkspace, leads]
  );

  const deleteLead = useCallback(
    async (leadId: string) => {
      if (!activeWorkspace) throw new Error('Workspace not ready.');
      const target = leads.find((l) => l.id === leadId);
      await deleteLeadInDb(
        activeWorkspace.id,
        leadId,
        target?.storageCollection || 'workspace'
      );
    },
    [activeWorkspace, leads]
  );

  const openCreateWizard = useCallback(() => {
    setEditingAgent(null);
    setWizardOpen(true);
  }, []);

  const openEditWizard = useCallback((agent: VoiceAgent) => {
    setEditingAgent(agent);
    setWizardOpen(true);
  }, []);

  const closeWizard = useCallback(() => {
    setWizardOpen(false);
    setEditingAgent(null);
  }, []);

  const agentsReady =
    !firebaseUser ||
    !isEmailVerified ||
    !activeWorkspace ||
    loadedAgentsWorkspaceId === activeWorkspace.id;

  const isLoading = !authReady || !isReady || !agentsReady;

  return (
    <AppContext.Provider
      value={{
        authReady,
        isReady,
        isLoading,
        firebaseUser,
        isEmailVerified,
        backendError,
        theme,
        toggleTheme,
        setTheme,
        user,
        activeRole,
        workspaces,
        activeWorkspace,
        setActiveWorkspaceId,
        signInWithGoogle,
        signInWithEmail,
        registerWithEmail,
        sendPasswordReset,
        confirmPasswordResetCode,
        resendVerificationEmail,
        refreshAuthUser,
        logout,
        updateUser,
        saveOnboardingProgress,
        selectPricingPlan,
        createWorkspace,
        updateWorkspace,
        agents,
        addAgent,
        updateAgent,
        deleteAgent,
        toggleAgentStatus,
        knowledgeSources,
        addWebsiteOrTextKnowledge,
        updateKnowledgeSource,
        uploadKnowledgeFile,
        deleteKnowledgeSource,
        syncPublicWidgets,
        connectedNumbers,
        availableNumbers,
        connectPhoneNumber,
        assignAgentToNumber,
        disconnectPhoneNumber,
        calls,
        leads,
        addLead,
        updateLeadStatus,
        deleteLead,
        teamMembers,
        inviteTeamMember,
        updateTeamMemberRole,
        removeTeamMember,
        apiKeys,
        createApiKey,
        deleteApiKey,
        toasts,
        pushToast,
        dismissToast,
        wizardOpen,
        editingAgent,
        openCreateWizard,
        openEditWizard,
        closeWizard,
        cookieConsent,
        cookieBannerOpen,
        openCookieSettings,
        closeCookieBanner,
        acceptCookies,
        declineCookies,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used inside AppProvider');
  }
  return ctx;
}
