import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  setDoc,
} from 'firebase/firestore';
import { deleteObject, ref, uploadBytes } from 'firebase/storage';
import { User } from 'firebase/auth';
import { db, storage } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';
import {
  AgentPersonality,
  AgentStatus,
  ApiKeyItem,
  BillingCycle,
  CallRecord,
  KnowledgeSource,
  Lead,
  LeadStatus,
  OnboardingData,
  PhoneCountryCode,
  PhoneNumberItem,
  PlanTier,
  TeamMember,
  UserProfile,
  VoiceAgent,
  WidgetPosition,
  WidgetTheme,
  Workspace,
  WorkspaceRole,
} from '@/lib/types';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
const ALLOWED_EXTENSIONS = ['.pdf', '.txt', '.md', '.docx'];

export function sanitizeText(value: string, maxLength: number): string {
  return value.replace(/[<>]/g, '').trim().slice(0, maxLength);
}

export function formatTimestamp(ts: unknown): string {
  if (!ts) return 'Just now';
  if (ts instanceof Timestamp) {
    return ts.toDate().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
  if (typeof ts === 'string') return ts;
  return 'Just now';
}

function makeInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');
}

function generateId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now()}_${rand}`;
}

export async function ensureUserOnboarding(
  firebaseUser: User,
  preferredName?: string,
  preferredWorkspaceName?: string
): Promise<{ profile: UserProfile; defaultWorkspaceId: string }> {
  const uid = firebaseUser.uid;
  const userRef = doc(db, 'users', uid);

  let existingProfile: UserProfile | null = null;
  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const d = snap.data();
      existingProfile = {
        id: d.id,
        fullName: d.fullName,
        email: d.email,
        avatarUrl: d.avatarUrl || '',
        roleTitle: d.roleTitle || 'Workspace Owner',
        initials: makeInitials(d.fullName || 'User'),
        onboardingCompleted:
          typeof d.onboardingCompleted === 'boolean' ? d.onboardingCompleted : true,
        planSelected:
          typeof d.planSelected === 'boolean' ? d.planSelected : true,
        selectedPlan: d.selectedPlan as PlanTier | undefined,
        billingCycle: d.billingCycle as BillingCycle | undefined,
        onboardingData: d.onboardingData as OnboardingData | undefined,
      };
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${uid}`);
  }

  const membershipsRef = collection(db, 'users', uid, 'memberships');
  let firstWorkspaceId = '';
  try {
    const memSnap = await getDocs(query(membershipsRef, where('userId', '==', uid)));
    if (!memSnap.empty) {
      firstWorkspaceId = memSnap.docs[0].data().workspaceId as string;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `users/${uid}/memberships`);
  }

  const displayName = sanitizeText(
    preferredName ||
      firebaseUser.displayName ||
      firebaseUser.email?.split('@')[0] ||
      'Account Owner',
    120
  );
  const email = sanitizeText(firebaseUser.email || '', 200);

  if (existingProfile && firstWorkspaceId) {
    return { profile: existingProfile, defaultWorkspaceId: firstWorkspaceId };
  }

  const batch = writeBatch(db);
  const now = serverTimestamp();

  if (!existingProfile) {
    const profilePayload: Record<string, unknown> = {
      id: uid,
      fullName: displayName,
      email,
      roleTitle: 'Workspace Owner',
      onboardingCompleted: false,
      planSelected: false,
      createdAt: now,
      updatedAt: now,
    };
    if (firebaseUser.photoURL) {
      profilePayload.avatarUrl = sanitizeText(firebaseUser.photoURL, 500);
    }
    batch.set(userRef, profilePayload);
    existingProfile = {
      id: uid,
      fullName: displayName,
      email,
      avatarUrl: firebaseUser.photoURL || '',
      roleTitle: 'Workspace Owner',
      initials: makeInitials(displayName),
      onboardingCompleted: false,
      planSelected: false,
    };
  }

  if (!firstWorkspaceId) {
    const wsId = `ws_${uid.slice(0, 10)}_${Math.random().toString(36).slice(2, 6)}`;
    const wsName = sanitizeText(
      preferredWorkspaceName || `${displayName.split(' ')[0]}'s Workspace`,
      120
    );

    batch.set(doc(db, 'workspaces', wsId), {
      id: wsId,
      name: wsName,
      industry: 'General Business',
      timezone: 'America/New_York',
      ownerId: uid,
      planName: 'Starter',
      subscriptionStatus: 'active',
      memberUids: [uid],
      createdAt: now,
      updatedAt: now,
    });

    batch.set(doc(db, 'workspaces', wsId, 'members', uid), {
      id: uid,
      workspaceId: wsId,
      workspaceOwnerId: uid,
      memberUids: [uid],
      userId: uid,
      fullName: displayName,
      email,
      role: 'owner',
      status: 'Active',
      createdAt: now,
      updatedAt: now,
    });

    batch.set(doc(db, 'users', uid, 'memberships', wsId), {
      workspaceId: wsId,
      userId: uid,
      role: 'owner',
      workspaceName: wsName,
      createdAt: now,
    });

    batch.set(doc(db, 'workspaces', wsId, 'subscriptions', wsId), {
      id: wsId,
      workspaceId: wsId,
      workspaceOwnerId: uid,
      memberUids: [uid],
      planName: 'Starter',
      subscriptionStatus: 'active',
      billingProvider: 'none',
      currentPeriodStart: now,
      currentPeriodEnd: now,
      createdAt: now,
    });

    firstWorkspaceId = wsId;
  }

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `onboarding/${uid}`);
  }

  return { profile: existingProfile, defaultWorkspaceId: firstWorkspaceId };
}

export function subscribeUserWorkspaces(
  uid: string,
  onData: (workspaces: Workspace[]) => void
) {
  const q = query(
    collection(db, 'workspaces'),
    where('memberUids', 'array-contains', uid)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items: Workspace[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: data.id || d.id,
          name: data.name,
          industry: data.industry || 'General Business',
          timezone: data.timezone || 'America/New_York',
          ownerId: data.ownerId,
          planName: data.planName || 'Starter',
          subscriptionStatus: data.subscriptionStatus || 'active',
          memberUids: Array.isArray(data.memberUids) ? data.memberUids : [uid],
        };
      });
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'workspaces');
    }
  );
}

export function subscribeWorkspaceAgents(
  workspaceId: string,
  uid: string,
  onData: (agents: VoiceAgent[]) => void
) {
  const path = `workspaces/${workspaceId}/voice_agents`;
  const q = query(
    collection(db, path),
    where('workspaceId', '==', workspaceId),
    where('memberUids', 'array-contains', uid)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items: VoiceAgent[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: data.id || d.id,
          workspaceId: data.workspaceId,
          workspaceOwnerId: data.workspaceOwnerId,
          memberUids: data.memberUids || [uid],
          createdBy: data.createdBy,
          name: data.name,
          businessName: data.businessName,
          description: data.description,
          personality: data.personality as AgentPersonality,
          customInstructions: data.customInstructions,
          voiceId: data.voiceId,
          voiceLabel: data.voiceLabel,
          language: data.language || 'English (US)',
          status: data.status as AgentStatus,
          websiteUrl: data.websiteUrl || '',
          welcomeMessage: data.welcomeMessage || '',
          accentColor: data.accentColor || '#2563eb',
          widgetPosition: (data.widgetPosition as WidgetPosition) || 'bottom-right',
          widgetTheme: (data.widgetTheme as WidgetTheme) || 'light',
          launcherLabel: data.launcherLabel || 'Talk with us',
          leadCaptureEnabled:
            typeof data.leadCaptureEnabled === 'boolean'
              ? data.leadCaptureEnabled
              : true,
          allowedDomains: Array.isArray(data.allowedDomains)
            ? data.allowedDomains.slice(0, 20)
            : [],
          callsCount: 0,
          avgDurationSec: 0,
          leadsCaptured: 0,
          updatedAt: formatTimestamp(data.updatedAt),
        };
      });
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeWorkspaceKnowledge(
  workspaceId: string,
  uid: string,
  onData: (items: KnowledgeSource[]) => void
) {
  const path = `workspaces/${workspaceId}/knowledge_sources`;
  const q = query(
    collection(db, path),
    where('workspaceId', '==', workspaceId),
    where('memberUids', 'array-contains', uid)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items: KnowledgeSource[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: data.id || d.id,
          workspaceId: data.workspaceId,
          workspaceOwnerId: data.workspaceOwnerId,
          memberUids: data.memberUids || [uid],
          createdBy: data.createdBy,
          agentId: data.agentId || 'all',
          sourceType: data.sourceType,
          sourceName: data.sourceName,
          sourceUrl: data.sourceUrl,
          filePath: data.filePath,
          fileSizeBytes: data.fileSizeBytes,
          content: data.content,
          processingStatus: data.processingStatus,
          addedAt: formatTimestamp(data.createdAt),
        };
      });
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeWorkspacePhoneNumbers(
  workspaceId: string,
  uid: string,
  onData: (items: PhoneNumberItem[]) => void
) {
  const path = `workspaces/${workspaceId}/phone_numbers`;
  const q = query(
    collection(db, path),
    where('workspaceId', '==', workspaceId),
    where('memberUids', 'array-contains', uid)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items: PhoneNumberItem[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: data.id || d.id,
          workspaceId: data.workspaceId,
          workspaceOwnerId: data.workspaceOwnerId,
          memberUids: data.memberUids || [uid],
          number: data.phoneNumber,
          countryCode: (data.country as PhoneCountryCode) || 'US',
          countryName: data.country || 'United States',
          locality: data.locality || 'Local',
          numberType:
            data.phoneNumber?.includes('800') || data.phoneNumber?.includes('888')
              ? 'Toll-Free'
              : 'Local',
          provider: data.provider || 'demo_inventory',
          status: data.status || 'connected_demo',
          assignedAgentId: data.agentId || null,
          capabilities: ['Inbound', 'Outbound'],
          monthlyEstimate: '$2.00/mo (Demo)',
        };
      });
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeWorkspaceCalls(
  workspaceId: string,
  uid: string,
  onData: (items: CallRecord[]) => void
) {
  const path = `workspaces/${workspaceId}/call_logs`;
  const q = query(
    collection(db, path),
    where('workspaceId', '==', workspaceId),
    where('memberUids', 'array-contains', uid)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items: CallRecord[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: data.id || d.id,
          workspaceId: data.workspaceId,
          agentId: data.agentId,
          agentName: data.agentName,
          phoneNumber: data.phoneNumber,
          callerName: data.callerName || data.phoneNumber,
          callDirection: data.callDirection || 'inbound',
          durationSeconds: Number(data.durationSeconds || 0),
          callStatus: data.callStatus || 'completed',
          timestamp: formatTimestamp(data.startedAt || data.createdAt),
          transcript: data.transcript || '',
        };
      });
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeWorkspaceMembers(
  workspaceId: string,
  uid: string,
  onData: (items: TeamMember[]) => void
) {
  const path = `workspaces/${workspaceId}/members`;
  const q = query(
    collection(db, path),
    where('workspaceId', '==', workspaceId),
    where('memberUids', 'array-contains', uid)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items: TeamMember[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: data.id || d.id,
          workspaceId: data.workspaceId,
          workspaceOwnerId: data.workspaceOwnerId,
          memberUids: data.memberUids || [uid],
          userId: data.userId,
          fullName: data.fullName,
          email: data.email,
          role: (data.role as WorkspaceRole) || 'member',
          status: data.status || 'Active',
          joinedAt: formatTimestamp(data.createdAt),
        };
      });
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeWorkspaceApiKeys(
  workspaceId: string,
  uid: string,
  onData: (items: ApiKeyItem[]) => void
) {
  const path = `workspaces/${workspaceId}/api_keys`;
  const q = query(
    collection(db, path),
    where('workspaceId', '==', workspaceId),
    where('memberUids', 'array-contains', uid)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items: ApiKeyItem[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: data.id || d.id,
          workspaceId: data.workspaceId,
          workspaceOwnerId: data.workspaceOwnerId,
          memberUids: data.memberUids || [uid],
          createdBy: data.createdBy,
          name: data.name,
          maskedKey: data.maskedKey,
          createdAt: formatTimestamp(data.createdAt),
        };
      });
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeWorkspaceLeads(
  workspaceId: string,
  uid: string,
  onData: (items: Lead[]) => void
) {
  const path = `workspaces/${workspaceId}/leads`;
  const q = query(
    collection(db, path),
    where('workspaceId', '==', workspaceId),
    where('memberUids', 'array-contains', uid)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items: Lead[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: data.id || d.id,
          workspaceId: data.workspaceId,
          workspaceOwnerId: data.workspaceOwnerId,
          memberUids: data.memberUids || [uid],
          agentId: data.agentId,
          agentName: data.agentName || 'Voice Chatbot',
          visitorName: data.visitorName || 'Website Visitor',
          visitorEmail: data.visitorEmail || '',
          visitorPhone: data.visitorPhone || '',
          company: data.company || '',
          inquirySummary: data.inquirySummary || '',
          sourcePageUrl: data.sourcePageUrl || '',
          status: (data.status as LeadStatus) || 'New',
          storageCollection: 'workspace',
          createdAt: formatTimestamp(data.createdAt),
          updatedAt: formatTimestamp(data.updatedAt),
        };
      });
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribePublicWidgetLeads(
  workspaceId: string,
  ownerId: string,
  currentUid: string,
  onData: (items: Lead[]) => void
) {
  if (!workspaceId || !ownerId || ownerId !== currentUid) {
    onData([]);
    return () => {};
  }
  const q = query(
    collection(db, 'public_widget_leads'),
    where('workspaceId', '==', workspaceId),
    where('workspaceOwnerId', '==', ownerId)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items: Lead[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: data.id || d.id,
          workspaceId: data.workspaceId,
          workspaceOwnerId: data.workspaceOwnerId,
          memberUids: [ownerId],
          agentId: data.agentId,
          agentName: data.agentName || 'Voice Chatbot',
          visitorName: data.visitorName || 'Website Visitor',
          visitorEmail: data.visitorEmail || '',
          visitorPhone: data.visitorPhone || '',
          company: data.company || '',
          inquirySummary: data.inquirySummary || '',
          sourcePageUrl: data.sourcePageUrl || '',
          status: (data.status as LeadStatus) || 'New',
          storageCollection: 'public_widget',
          createdAt: formatTimestamp(data.createdAt),
          updatedAt: formatTimestamp(data.updatedAt),
        };
      });
      onData(items);
    },
    (error) => {
      console.warn('Public widget leads listener notice:', error);
    }
  );
}

export function subscribePublicWidgetTurns(
  workspaceId: string,
  ownerId: string,
  currentUid: string,
  onData: (items: CallRecord[]) => void
) {
  if (!workspaceId || !ownerId || ownerId !== currentUid) {
    onData([]);
    return () => {};
  }
  const q = query(
    collection(db, 'public_widget_turns'),
    where('workspaceId', '==', workspaceId),
    where('workspaceOwnerId', '==', ownerId)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const grouped = new Map<
        string,
        {
          sessionId: string;
          agentId: string;
          agentName: string;
          hostDomain: string;
          turns: { ms: number; label: string; user: string; reply: string }[];
        }
      >();

      snapshot.docs.forEach((d) => {
        const data = d.data();
        const sessionId = String(data.sessionId || d.id);
        const createdAt = data.createdAt;
        const ms =
          createdAt instanceof Timestamp ? createdAt.toMillis() : Date.now();
        const timeStr =
          createdAt instanceof Timestamp
            ? createdAt.toDate().toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : 'Just now';

        const existingGroup = grouped.get(sessionId) || {
          sessionId,
          agentId: String(data.agentId || ''),
          agentName: String(data.agentName || 'Voice Chatbot'),
          hostDomain: String(data.hostDomain || 'Website Widget'),
          turns: [],
        };

        existingGroup.turns.push({
          ms,
          label: timeStr,
          user: String(data.userMessage || ''),
          reply: String(data.assistantReply || ''),
        });
        grouped.set(sessionId, existingGroup);
      });

      const records: CallRecord[] = Array.from(grouped.values()).map((grp) => {
        grp.turns.sort((a, b) => a.ms - b.ms);
        const lastTurn = grp.turns[grp.turns.length - 1];
        const transcript = grp.turns
          .map((t) => `Visitor: ${t.user}\n${grp.agentName}: ${t.reply}`)
          .join('\n\n');
        return {
          id: grp.sessionId,
          workspaceId,
          agentId: grp.agentId,
          agentName: grp.agentName,
          phoneNumber: grp.hostDomain || 'Website Widget',
          callerName: `Web Visitor (${grp.hostDomain || 'Widget'})`,
          callDirection: 'inbound',
          durationSeconds: Math.max(15, grp.turns.length * 28),
          callStatus: 'completed',
          timestamp: lastTurn?.label || 'Just now',
          transcript,
        };
      });

      onData(records);
    },
    (error) => {
      console.warn('Public widget turns listener notice:', error);
    }
  );
}

// --- Mutations ---

export async function createWorkspaceInDb(
  uid: string,
  userFullName: string,
  userEmail: string,
  name: string,
  industry: string
): Promise<string> {
  const wsId = generateId('ws');
  const cleanName = sanitizeText(name, 120);
  const cleanIndustry = sanitizeText(industry || 'General Business', 100);
  if (!cleanName) throw new Error('Workspace name is required.');

  const batch = writeBatch(db);
  const now = serverTimestamp();

  batch.set(doc(db, 'workspaces', wsId), {
    id: wsId,
    name: cleanName,
    industry: cleanIndustry,
    timezone: 'America/New_York',
    ownerId: uid,
    planName: 'Starter',
    subscriptionStatus: 'active',
    memberUids: [uid],
    createdAt: now,
    updatedAt: now,
  });

  batch.set(doc(db, 'workspaces', wsId, 'members', uid), {
    id: uid,
    workspaceId: wsId,
    workspaceOwnerId: uid,
    memberUids: [uid],
    userId: uid,
    fullName: sanitizeText(userFullName, 120),
    email: sanitizeText(userEmail, 200),
    role: 'owner',
    status: 'Active',
    createdAt: now,
    updatedAt: now,
  });

  batch.set(doc(db, 'users', uid, 'memberships', wsId), {
    workspaceId: wsId,
    userId: uid,
    role: 'owner',
    workspaceName: cleanName,
    createdAt: now,
  });

  batch.set(doc(db, 'workspaces', wsId, 'subscriptions', wsId), {
    id: wsId,
    workspaceId: wsId,
    workspaceOwnerId: uid,
    memberUids: [uid],
    planName: 'Starter',
    subscriptionStatus: 'active',
    billingProvider: 'none',
    currentPeriodStart: now,
    currentPeriodEnd: now,
    createdAt: now,
  });

  try {
    await batch.commit();
    return wsId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `workspaces/${wsId}`);
  }
}

export async function updateWorkspaceInDb(
  uid: string,
  workspaceId: string,
  updates: { name: string; industry: string; timezone: string }
) {
  const cleanName = sanitizeText(updates.name, 120);
  const cleanIndustry = sanitizeText(updates.industry, 100);
  const cleanTimezone = sanitizeText(updates.timezone, 80);
  if (!cleanName) throw new Error('Workspace name cannot be empty.');

  const batch = writeBatch(db);
  batch.update(doc(db, 'workspaces', workspaceId), {
    name: cleanName,
    industry: cleanIndustry,
    timezone: cleanTimezone,
    updatedAt: serverTimestamp(),
  });
  batch.update(doc(db, 'users', uid, 'memberships', workspaceId), {
    workspaceName: cleanName,
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `workspaces/${workspaceId}`);
  }
}

export async function updateUserProfileInDb(
  uid: string,
  updates: { fullName: string; email: string; roleTitle: string }
) {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, path), {
      fullName: sanitizeText(updates.fullName, 120),
      email: sanitizeText(updates.email, 200),
      roleTitle: sanitizeText(updates.roleTitle, 100),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function saveOnboardingInDb(
  uid: string,
  data: OnboardingData,
  completed: boolean
): Promise<OnboardingData> {
  const cleanData: OnboardingData = {
    referralSource: sanitizeText(data.referralSource || '', 120),
    companySize: sanitizeText(data.companySize || '', 80),
    websiteUrl: sanitizeText(data.websiteUrl || '', 500),
    otherSourceSummary: sanitizeText(data.otherSourceSummary || '', 2000),
    agentRole: sanitizeText(data.agentRole || '', 100),
    instructions: sanitizeText(data.instructions || '', 2500),
    techStack: Array.isArray(data.techStack)
      ? data.techStack.map((t) => sanitizeText(t, 80)).filter(Boolean).slice(0, 25)
      : [],
    deployChannels: Array.isArray(data.deployChannels)
      ? data.deployChannels.map((c) => sanitizeText(c, 80)).filter(Boolean).slice(0, 25)
      : [],
  };

  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, path), {
      onboardingData: cleanData,
      onboardingCompleted: Boolean(completed),
      updatedAt: serverTimestamp(),
    });
    return cleanData;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function selectPlanInDb(
  uid: string,
  workspace: Workspace | null,
  input: {
    planName: PlanTier;
    billingCycle: BillingCycle;
    subscriptionStatus: 'active' | 'trialing';
    billingProvider: string;
    enterpriseContact?: { company?: string; notes?: string };
  }
) {
  const batch = writeBatch(db);
  const now = serverTimestamp();

  const userUpdates: Record<string, unknown> = {
    planSelected: true,
    selectedPlan: input.planName,
    billingCycle: input.billingCycle,
    updatedAt: now,
  };

  if (input.enterpriseContact) {
    userUpdates.enterpriseContact = {
      company: sanitizeText(input.enterpriseContact.company || '', 120),
      notes: sanitizeText(input.enterpriseContact.notes || '', 1000),
      requestedAt: new Date().toISOString().slice(0, 80),
    };
  }

  batch.update(doc(db, 'users', uid), userUpdates);

  if (workspace && workspace.ownerId === uid) {
    batch.update(doc(db, 'workspaces', workspace.id), {
      planName: input.planName,
      subscriptionStatus: input.subscriptionStatus,
      updatedAt: now,
    });

    const subRef = doc(db, 'workspaces', workspace.id, 'subscriptions', workspace.id);
    const subSnap = await getDoc(subRef);
    if (subSnap.exists()) {
      batch.update(subRef, {
        planName: input.planName,
        subscriptionStatus: input.subscriptionStatus,
        billingProvider: sanitizeText(input.billingProvider, 60),
        currentPeriodStart: now,
        currentPeriodEnd: now,
      });
    }
  }

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
}

export async function createVoiceAgentInDb(
  workspace: Workspace,
  uid: string,
  input: {
    name: string;
    businessName: string;
    description: string;
    personality: AgentPersonality;
    customInstructions: string;
    voiceId: string;
    voiceLabel: string;
    language: string;
    status: AgentStatus;
    websiteUrl?: string;
    welcomeMessage?: string;
    accentColor?: string;
    widgetPosition?: WidgetPosition;
    widgetTheme?: WidgetTheme;
    launcherLabel?: string;
    leadCaptureEnabled?: boolean;
    allowedDomains?: string[];
  }
) {
  const agentId = generateId('agent');
  const path = `workspaces/${workspace.id}/voice_agents/${agentId}`;
  const now = serverTimestamp();

  const payload: Record<string, unknown> = {
    id: agentId,
    workspaceId: workspace.id,
    workspaceOwnerId: workspace.ownerId,
    memberUids: workspace.memberUids,
    createdBy: uid,
    name: sanitizeText(input.name, 120),
    businessName: sanitizeText(input.businessName, 120),
    description: sanitizeText(input.description, 1000),
    personality: input.personality,
    customInstructions: sanitizeText(input.customInstructions, 5000),
    voiceId: sanitizeText(input.voiceId, 80),
    voiceLabel: sanitizeText(input.voiceLabel, 120),
    language: sanitizeText(input.language, 60),
    status: input.status,
    websiteUrl: sanitizeText(input.websiteUrl || '', 1000),
    welcomeMessage: sanitizeText(
      input.welcomeMessage || `Hi! Ask me anything about ${sanitizeText(input.businessName, 60)}.`,
      500
    ),
    accentColor: sanitizeText(input.accentColor || '#2563eb', 20) || '#2563eb',
    widgetPosition:
      input.widgetPosition === 'bottom-left' ? 'bottom-left' : 'bottom-right',
    widgetTheme: input.widgetTheme === 'dark' ? 'dark' : 'light',
    launcherLabel: sanitizeText(input.launcherLabel || 'Talk with us', 60) || 'Talk with us',
    leadCaptureEnabled:
      typeof input.leadCaptureEnabled === 'boolean' ? input.leadCaptureEnabled : true,
    allowedDomains: Array.isArray(input.allowedDomains)
      ? input.allowedDomains
          .map((d) => sanitizeText(d, 253).toLowerCase())
          .filter(Boolean)
          .slice(0, 20)
      : [],
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(doc(db, path), payload);
    await syncPublicWidgetDoc(agentId, workspace.id, workspace.ownerId, {
      name: String(payload.name),
      businessName: String(payload.businessName),
      description: String(payload.description || ''),
      personality: payload.personality as AgentPersonality,
      customInstructions: String(payload.customInstructions || ''),
      voiceId: String(payload.voiceId),
      voiceLabel: String(payload.voiceLabel),
      language: String(payload.language),
      status: payload.status as AgentStatus,
      websiteUrl: String(payload.websiteUrl || ''),
      welcomeMessage: String(payload.welcomeMessage || ''),
      accentColor: String(payload.accentColor || '#2563eb'),
      widgetPosition: payload.widgetPosition as WidgetPosition,
      widgetTheme: payload.widgetTheme as WidgetTheme,
      launcherLabel: String(payload.launcherLabel || 'Talk with us'),
      leadCaptureEnabled: Boolean(payload.leadCaptureEnabled),
      allowedDomains: (payload.allowedDomains as string[]) || [],
    });
    return agentId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function syncPublicWidgetDoc(
  agentId: string,
  workspaceId: string,
  workspaceOwnerId: string,
  input: {
    name: string;
    businessName: string;
    description?: string;
    personality: AgentPersonality;
    customInstructions: string;
    voiceId: string;
    voiceLabel: string;
    language: string;
    status: AgentStatus;
    websiteUrl?: string;
    welcomeMessage?: string;
    accentColor?: string;
    widgetPosition?: WidgetPosition;
    widgetTheme?: WidgetTheme;
    launcherLabel?: string;
    leadCaptureEnabled?: boolean;
    allowedDomains?: string[];
  }
) {
  const widgetPayload: Record<string, unknown> = {
    id: agentId,
    workspaceId,
    workspaceOwnerId,
    name: sanitizeText(input.name, 120) || 'AI Voice Chatbot',
    businessName: sanitizeText(input.businessName, 120) || 'Business',
    description: sanitizeText(input.description || '', 1000),
    personality: input.personality || 'Professional',
    customInstructions: sanitizeText(input.customInstructions || '', 5000),
    voiceId: sanitizeText(input.voiceId || 'voice_aria', 80),
    voiceLabel: sanitizeText(input.voiceLabel || 'Aria', 120),
    language: sanitizeText(input.language || 'English (US)', 60),
    status: input.status || 'Active',
    websiteUrl: sanitizeText(input.websiteUrl || '', 1000),
    welcomeMessage: sanitizeText(
      input.welcomeMessage || `Hi! Ask me anything about ${sanitizeText(input.businessName, 60)}.`,
      500
    ),
    accentColor: sanitizeText(input.accentColor || '#2563eb', 20) || '#2563eb',
    widgetPosition: input.widgetPosition === 'bottom-left' ? 'bottom-left' : 'bottom-right',
    widgetTheme: input.widgetTheme === 'dark' ? 'dark' : 'light',
    launcherLabel: sanitizeText(input.launcherLabel || 'Talk with us', 60) || 'Talk with us',
    leadCaptureEnabled:
      typeof input.leadCaptureEnabled === 'boolean' ? input.leadCaptureEnabled : true,
    allowedDomains: Array.isArray(input.allowedDomains)
      ? input.allowedDomains
          .map((d) => sanitizeText(d, 253).toLowerCase())
          .filter(Boolean)
          .slice(0, 20)
      : [],
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'public_widgets', agentId), widgetPayload);
  } catch (err) {
    console.warn('Public widget sync notice:', err);
  }
}

export async function syncPublicWidgetKnowledgeBundle(
  workspaceId: string,
  agentId: string,
  sources: KnowledgeSource[]
) {
  const relevant = sources.filter(
    (s) =>
      (s.agentId === agentId || s.agentId === 'all' || !s.agentId) &&
      typeof s.content === 'string' &&
      s.content.trim().length > 0
  );

  const compactItems: { sourceName: string; sourceType: string; content: string }[] = [];
  let totalChars = 2; // '[]'

  for (const src of relevant.slice(0, 40)) {
    const snippet = sanitizeText(src.content || '', 3500);
    if (!snippet) continue;
    const item = {
      sourceName: sanitizeText(src.sourceName, 120) || 'Knowledge Source',
      sourceType: src.sourceType,
      content: snippet,
    };
    const serialized = JSON.stringify(item);
    if (totalChars + serialized.length + 2 > 76000) break;
    compactItems.push(item);
    totalChars += serialized.length + 2;
  }

  try {
    await setDoc(doc(db, 'public_widgets', agentId, 'knowledge', 'bundle'), {
      agentId,
      workspaceId,
      chunksJson: JSON.stringify(compactItems),
      sourceCount: compactItems.length,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Public widget knowledge sync notice:', err);
  }
}

export async function updateVoiceAgentInDb(
  workspaceId: string,
  agentId: string,
  updates: Partial<{
    name: string;
    businessName: string;
    description: string;
    personality: AgentPersonality;
    customInstructions: string;
    voiceId: string;
    voiceLabel: string;
    language: string;
    status: AgentStatus;
    websiteUrl: string;
    welcomeMessage: string;
    accentColor: string;
    widgetPosition: WidgetPosition;
    widgetTheme: WidgetTheme;
    launcherLabel: string;
    leadCaptureEnabled: boolean;
    allowedDomains: string[];
  }>
) {
  const path = `workspaces/${workspaceId}/voice_agents/${agentId}`;
  const payload: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (updates.name !== undefined) payload.name = sanitizeText(updates.name, 120);
  if (updates.businessName !== undefined) {
    payload.businessName = sanitizeText(updates.businessName, 120);
  }
  if (updates.description !== undefined) {
    payload.description = sanitizeText(updates.description, 1000);
  }
  if (updates.personality !== undefined) payload.personality = updates.personality;
  if (updates.customInstructions !== undefined) {
    payload.customInstructions = sanitizeText(updates.customInstructions, 5000);
  }
  if (updates.voiceId !== undefined) payload.voiceId = sanitizeText(updates.voiceId, 80);
  if (updates.voiceLabel !== undefined) {
    payload.voiceLabel = sanitizeText(updates.voiceLabel, 120);
  }
  if (updates.language !== undefined) payload.language = sanitizeText(updates.language, 60);
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.websiteUrl !== undefined) {
    payload.websiteUrl = sanitizeText(updates.websiteUrl, 1000);
  }
  if (updates.welcomeMessage !== undefined) {
    payload.welcomeMessage = sanitizeText(updates.welcomeMessage, 500);
  }
  if (updates.accentColor !== undefined) {
    payload.accentColor = sanitizeText(updates.accentColor, 20) || '#2563eb';
  }
  if (updates.widgetPosition !== undefined) {
    payload.widgetPosition =
      updates.widgetPosition === 'bottom-left' ? 'bottom-left' : 'bottom-right';
  }
  if (updates.widgetTheme !== undefined) {
    payload.widgetTheme = updates.widgetTheme === 'dark' ? 'dark' : 'light';
  }
  if (updates.launcherLabel !== undefined) {
    payload.launcherLabel = sanitizeText(updates.launcherLabel, 60);
  }
  if (updates.leadCaptureEnabled !== undefined) {
    payload.leadCaptureEnabled = Boolean(updates.leadCaptureEnabled);
  }
  if (updates.allowedDomains !== undefined) {
    payload.allowedDomains = updates.allowedDomains
      .map((d) => sanitizeText(d, 253).toLowerCase())
      .filter(Boolean)
      .slice(0, 20);
  }

  try {
    await updateDoc(doc(db, path), payload);
    const fullSnap = await getDoc(doc(db, path));
    if (fullSnap.exists()) {
      const full = fullSnap.data();
      await syncPublicWidgetDoc(agentId, workspaceId, String(full.workspaceOwnerId), {
        name: String(full.name),
        businessName: String(full.businessName),
        description: String(full.description || ''),
        personality: full.personality as AgentPersonality,
        customInstructions: String(full.customInstructions || ''),
        voiceId: String(full.voiceId),
        voiceLabel: String(full.voiceLabel),
        language: String(full.language || 'English (US)'),
        status: full.status as AgentStatus,
        websiteUrl: String(full.websiteUrl || ''),
        welcomeMessage: String(full.welcomeMessage || ''),
        accentColor: String(full.accentColor || '#2563eb'),
        widgetPosition: (full.widgetPosition as WidgetPosition) || 'bottom-right',
        widgetTheme: (full.widgetTheme as WidgetTheme) || 'light',
        launcherLabel: String(full.launcherLabel || 'Talk with us'),
        leadCaptureEnabled:
          typeof full.leadCaptureEnabled === 'boolean' ? full.leadCaptureEnabled : true,
        allowedDomains: Array.isArray(full.allowedDomains) ? full.allowedDomains : [],
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteVoiceAgentInDb(workspaceId: string, agentId: string) {
  const path = `workspaces/${workspaceId}/voice_agents/${agentId}`;
  try {
    try {
      await deleteDoc(doc(db, 'public_widgets', agentId, 'knowledge', 'bundle'));
    } catch {
      // Ignore if bundle does not exist
    }
    try {
      await deleteDoc(doc(db, 'public_widgets', agentId));
    } catch {
      // Ignore if widget projection does not exist
    }
    await deleteDoc(doc(db, path));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function createKnowledgeUrlOrTextInDb(
  workspace: Workspace,
  uid: string,
  input: {
    agentId: string;
    sourceType: 'website' | 'text';
    sourceName: string;
    sourceUrl?: string;
    content?: string;
  }
) {
  const sourceId = generateId('kb');
  const path = `workspaces/${workspace.id}/knowledge_sources/${sourceId}`;
  const now = serverTimestamp();

  const payload: Record<string, unknown> = {
    id: sourceId,
    workspaceId: workspace.id,
    workspaceOwnerId: workspace.ownerId,
    memberUids: workspace.memberUids,
    createdBy: uid,
    agentId: input.agentId || 'all',
    sourceType: input.sourceType,
    sourceName: sanitizeText(input.sourceName, 200),
    processingStatus: input.sourceType === 'text' ? 'ready' : 'pending_milestone_3',
    createdAt: now,
    updatedAt: now,
  };

  if (input.sourceUrl) {
    payload.sourceUrl = sanitizeText(input.sourceUrl, 1000);
  }
  if (input.content) {
    payload.content = sanitizeText(input.content, 20000);
  }

  try {
    await setDoc(doc(db, path), payload);
    return sourceId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function uploadKnowledgeDocumentInDb(
  workspace: Workspace,
  uid: string,
  agentId: string,
  file: File
) {
  const lowerName = file.name.toLowerCase();
  const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
  if (!hasValidExt && !ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error('Only PDF, TXT, DOCX, and Markdown (.md) files are allowed.');
  }
  if (file.size <= 0 || file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('File size must be between 1 byte and 10 MB.');
  }

  const sourceId = generateId('kb');
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
  const storagePath = `workspaces/${workspace.id}/knowledge/${sourceId}/${safeName}`;
  const storageRef = ref(storage, storagePath);

  await uploadBytes(storageRef, file, {
    contentType: file.type || 'application/octet-stream',
    customMetadata: {
      workspaceId: workspace.id,
      uploadedBy: uid,
    },
  });

  const docPath = `workspaces/${workspace.id}/knowledge_sources/${sourceId}`;
  const now = serverTimestamp();

  try {
    await setDoc(doc(db, docPath), {
      id: sourceId,
      workspaceId: workspace.id,
      workspaceOwnerId: workspace.ownerId,
      memberUids: workspace.memberUids,
      createdBy: uid,
      agentId: agentId || 'all',
      sourceType: 'document',
      sourceName: sanitizeText(file.name, 200),
      filePath: storagePath,
      fileSizeBytes: file.size,
      processingStatus: 'pending_milestone_3',
      createdAt: now,
      updatedAt: now,
    });
    return sourceId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, docPath);
  }
}

export async function updateKnowledgeSourceInDb(
  workspaceId: string,
  sourceId: string,
  updates: {
    content?: string;
    processingStatus?: 'queued' | 'crawling' | 'processing' | 'ready' | 'failed';
  }
) {
  const path = `workspaces/${workspaceId}/knowledge_sources/${sourceId}`;
  const payload: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (updates.content !== undefined) {
    payload.content = sanitizeText(updates.content, 20000);
  }
  if (updates.processingStatus !== undefined) {
    payload.processingStatus = updates.processingStatus;
  }
  try {
    await updateDoc(doc(db, path), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteKnowledgeSourceInDb(
  workspaceId: string,
  source: KnowledgeSource
) {
  if (source.filePath) {
    try {
      await deleteObject(ref(storage, source.filePath));
    } catch {
      // Ignore missing storage object if already removed
    }
  }
  const path = `workspaces/${workspaceId}/knowledge_sources/${source.id}`;
  try {
    await deleteDoc(doc(db, path));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function connectPhoneNumberInDb(
  workspace: Workspace,
  item: PhoneNumberItem,
  assignedAgentId: string | null
) {
  const phoneId = generateId('num');
  const path = `workspaces/${workspace.id}/phone_numbers/${phoneId}`;
  const now = serverTimestamp();

  const payload: Record<string, unknown> = {
    id: phoneId,
    workspaceId: workspace.id,
    workspaceOwnerId: workspace.ownerId,
    memberUids: workspace.memberUids,
    phoneNumber: sanitizeText(item.number, 40),
    country: sanitizeText(item.countryCode, 60),
    locality: sanitizeText(item.locality, 120),
    provider: 'demo_inventory',
    status: 'connected_demo',
    createdAt: now,
    updatedAt: now,
  };
  if (assignedAgentId) {
    payload.agentId = assignedAgentId;
  }

  try {
    await setDoc(doc(db, path), payload);
    return phoneId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updatePhoneNumberAgentInDb(
  workspaceId: string,
  phoneId: string,
  agentId: string | null
) {
  const path = `workspaces/${workspaceId}/phone_numbers/${phoneId}`;
  try {
    await updateDoc(doc(db, path), {
      agentId: agentId || '',
      status: agentId ? 'connected_demo' : 'unassigned',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deletePhoneNumberInDb(workspaceId: string, phoneId: string) {
  const path = `workspaces/${workspaceId}/phone_numbers/${phoneId}`;
  try {
    await deleteDoc(doc(db, path));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function inviteWorkspaceMemberInDb(
  workspace: Workspace,
  email: string,
  role: 'admin' | 'member'
) {
  const inviteId = generateId('invite');
  const cleanEmail = sanitizeText(email, 200);
  const guessedName =
    cleanEmail.split('@')[0]?.replace(/[._-]/g, ' ') || 'Invited Member';
  const formattedName = guessedName
    .split(' ')
    .filter(Boolean)
    .map((s) => s[0].toUpperCase() + s.slice(1))
    .join(' ');
  const path = `workspaces/${workspace.id}/members/${inviteId}`;
  const now = serverTimestamp();

  try {
    await setDoc(doc(db, path), {
      id: inviteId,
      workspaceId: workspace.id,
      workspaceOwnerId: workspace.ownerId,
      memberUids: workspace.memberUids,
      userId: inviteId,
      fullName: sanitizeText(formattedName, 120),
      email: cleanEmail,
      role,
      status: 'Pending Invite',
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateWorkspaceMemberRoleInDb(
  workspaceId: string,
  memberId: string,
  role: 'admin' | 'member'
) {
  const path = `workspaces/${workspaceId}/members/${memberId}`;
  try {
    await updateDoc(doc(db, path), {
      role,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function removeWorkspaceMemberInDb(
  workspaceId: string,
  memberId: string
) {
  const path = `workspaces/${workspaceId}/members/${memberId}`;
  try {
    await deleteDoc(doc(db, path));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function createApiKeyInDb(
  workspace: Workspace,
  uid: string,
  name: string
): Promise<{ rawPreview: string }> {
  const keyId = generateId('key');
  const suffix = Math.random().toString(36).slice(2, 6);
  const rawPreview = `cdnc_live_${Math.random().toString(36).slice(2, 18)}${suffix}`;
  const maskedKey = `cdnc_live_••••••••••••••••${suffix}`;
  const path = `workspaces/${workspace.id}/api_keys/${keyId}`;

  try {
    await setDoc(doc(db, path), {
      id: keyId,
      workspaceId: workspace.id,
      workspaceOwnerId: workspace.ownerId,
      memberUids: workspace.memberUids,
      createdBy: uid,
      name: sanitizeText(name, 100),
      maskedKey,
      createdAt: serverTimestamp(),
    });
    return { rawPreview };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteApiKeyInDb(workspaceId: string, keyId: string) {
  const path = `workspaces/${workspaceId}/api_keys/${keyId}`;
  try {
    await deleteDoc(doc(db, path));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function createLeadInDb(
  workspace: Workspace,
  input: {
    agentId: string;
    agentName: string;
    visitorName: string;
    visitorEmail: string;
    visitorPhone?: string;
    company?: string;
    inquirySummary?: string;
    sourcePageUrl?: string;
    status?: LeadStatus;
  }
) {
  const leadId = generateId('lead');
  const path = `workspaces/${workspace.id}/leads/${leadId}`;
  const now = serverTimestamp();

  const payload: Record<string, unknown> = {
    id: leadId,
    workspaceId: workspace.id,
    workspaceOwnerId: workspace.ownerId,
    memberUids: workspace.memberUids,
    agentId: sanitizeText(input.agentId, 128),
    agentName: sanitizeText(input.agentName, 120) || 'Voice Chatbot',
    visitorName: sanitizeText(input.visitorName, 120),
    visitorEmail: sanitizeText(input.visitorEmail, 200),
    status: input.status || 'New',
    createdAt: now,
    updatedAt: now,
  };
  if (input.visitorPhone) {
    payload.visitorPhone = sanitizeText(input.visitorPhone, 40);
  }
  if (input.company) {
    payload.company = sanitizeText(input.company, 120);
  }
  if (input.inquirySummary) {
    payload.inquirySummary = sanitizeText(input.inquirySummary, 2000);
  }
  if (input.sourcePageUrl) {
    payload.sourcePageUrl = sanitizeText(input.sourcePageUrl, 1000);
  }

  try {
    await setDoc(doc(db, path), payload);
    return leadId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateLeadStatusInDb(
  workspaceId: string,
  leadId: string,
  status: LeadStatus,
  storageCollection: 'workspace' | 'public_widget' = 'workspace'
) {
  const path =
    storageCollection === 'public_widget'
      ? `public_widget_leads/${leadId}`
      : `workspaces/${workspaceId}/leads/${leadId}`;
  try {
    await updateDoc(doc(db, path), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteLeadInDb(
  workspaceId: string,
  leadId: string,
  storageCollection: 'workspace' | 'public_widget' = 'workspace'
) {
  const path =
    storageCollection === 'public_widget'
      ? `public_widget_leads/${leadId}`
      : `workspaces/${workspaceId}/leads/${leadId}`;
  try {
    await deleteDoc(doc(db, path));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
