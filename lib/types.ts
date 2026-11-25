export type AgentStatus = 'Active' | 'Draft' | 'Inactive';

export type AgentPersonality = 'Friendly' | 'Professional' | 'Casual';

export type WidgetPosition = 'bottom-right' | 'bottom-left';
export type WidgetTheme = 'light' | 'dark';

export interface VoiceOption {
  id: string;
  name: string;
  gender: 'Female' | 'Male' | 'Neutral';
  language: string;
  accent: string;
  tone: string;
  sampleLine: string;
}

export interface VoiceAgent {
  id: string;
  workspaceId: string;
  workspaceOwnerId: string;
  memberUids: string[];
  createdBy: string;
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
  callsCount: number;
  avgDurationSec: number;
  leadsCaptured: number;
  updatedAt: string;
  createdAt?: string;
}

export type KnowledgeSourceType = 'website' | 'document' | 'text';
export type KnowledgeProcessingStatus =
  | 'queued'
  | 'crawling'
  | 'processing'
  | 'ready'
  | 'failed'
  | 'pending_milestone_3';

export interface KnowledgeSource {
  id: string;
  workspaceId: string;
  workspaceOwnerId: string;
  memberUids: string[];
  createdBy: string;
  agentId: string | 'all';
  sourceType: KnowledgeSourceType;
  sourceName: string;
  sourceUrl?: string;
  filePath?: string;
  fileSizeBytes?: number;
  content?: string;
  processingStatus: KnowledgeProcessingStatus;
  addedAt: string;
}

export type PhoneCountryCode = 'US' | 'UK' | 'CA' | 'DE' | 'AU';

export interface PhoneNumberItem {
  id: string;
  workspaceId: string;
  workspaceOwnerId?: string;
  memberUids?: string[];
  number: string;
  countryCode: PhoneCountryCode;
  countryName: string;
  locality: string;
  numberType: 'Local' | 'Toll-Free';
  provider: string;
  status: 'connected_demo' | 'Available' | 'unassigned';
  assignedAgentId: string | null;
  capabilities: ('Inbound' | 'Outbound')[];
  monthlyEstimate: string;
}

export type CallOutcome = 'completed' | 'missed' | 'voicemail' | 'lead_captured';

export interface CallRecord {
  id: string;
  workspaceId: string;
  agentId: string;
  agentName: string;
  phoneNumber: string;
  callerName: string;
  callDirection: 'inbound' | 'outbound';
  durationSeconds: number;
  callStatus: CallOutcome;
  timestamp: string;
  transcript: string;
}

export type WorkspaceRole = 'owner' | 'admin' | 'member';

export type PlanTier = 'Starter' | 'Growth' | 'Basic' | 'Business' | 'Enterprise';
export type BillingCycle = 'monthly' | 'yearly';

export interface OnboardingData {
  referralSource?: string;
  companySize?: string;
  websiteUrl?: string;
  otherSourceSummary?: string;
  agentRole?: string;
  instructions?: string;
  techStack?: string[];
  deployChannels?: string[];
}

export interface Workspace {
  id: string;
  name: string;
  industry: string;
  timezone: string;
  ownerId: string;
  planName: PlanTier;
  subscriptionStatus: 'active' | 'trialing' | 'past_due' | 'canceled';
  memberUids: string[];
  role?: WorkspaceRole;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  roleTitle: string;
  initials: string;
  onboardingCompleted: boolean;
  planSelected: boolean;
  selectedPlan?: PlanTier;
  billingCycle?: BillingCycle;
  onboardingData?: OnboardingData;
}

export interface TeamMember {
  id: string;
  workspaceId: string;
  workspaceOwnerId: string;
  memberUids: string[];
  userId: string;
  fullName: string;
  email: string;
  role: WorkspaceRole;
  status: 'Active' | 'Pending Invite';
  joinedAt: string;
}

export interface ApiKeyItem {
  id: string;
  workspaceId: string;
  workspaceOwnerId: string;
  memberUids: string[];
  createdBy: string;
  name: string;
  maskedKey: string;
  createdAt: string;
}

export type LeadStatus = 'New' | 'Contacted' | 'Qualified';

export interface Lead {
  id: string;
  workspaceId: string;
  workspaceOwnerId: string;
  memberUids: string[];
  agentId: string;
  agentName: string;
  visitorName: string;
  visitorEmail: string;
  visitorPhone?: string;
  company?: string;
  inquirySummary?: string;
  sourcePageUrl?: string;
  status: LeadStatus;
  storageCollection?: 'workspace' | 'public_widget';
  createdAt: string;
  updatedAt: string;
}

export interface PublicWidgetConfig {
  id: string;
  workspaceId: string;
  workspaceOwnerId: string;
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
  accentColor: string;
  widgetPosition: WidgetPosition;
  widgetTheme: WidgetTheme;
  launcherLabel?: string;
  leadCaptureEnabled: boolean;
  allowedDomains?: string[];
}
