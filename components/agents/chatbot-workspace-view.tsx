'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  CirclePause,
  Clock,
  FileEdit,
  Files,
  Globe,
  Link2,
  Menu,
  MessageSquare,
  MessagesSquare,
  Pause,
  Play,
  Plus,
  Quote,
  Save,
  Sparkles,
  ThumbsUp,
  Trash2,
  UserPlus,
  Volume2,
  X,
} from 'lucide-react';
import {
  TbAddressBook,
  TbBriefcase,
  TbBriefcaseFilled,
  TbChartBar,
  TbFiles,
  TbFilesFilled,
  TbLayoutNavbar,
  TbLayoutNavbarFilled,
  TbLetterCase,
  TbLink,
  TbMessages,
  TbMessagesFilled,
  TbQuote,
  TbQuoteFilled,
  TbSelector,
  TbSettings,
  TbSettingsFilled,
} from 'react-icons/tb';
import { useApp } from '@/components/providers/app-provider';
import { BrandMark } from '@/components/ui/brand-loader';
import { AccountDropdown } from '@/components/layout/account-dropdown';
import { CadenceOrbLauncherIcon } from '@/components/embed/cadence-orb';
import { FloatingChatbotLauncher } from '@/components/embed/floating-chatbot-launcher';
import { KnowledgeBaseView } from '@/components/knowledge-base/knowledge-base-view';
import { EmbedView } from '@/components/embed/embed-view';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { VOICE_OPTIONS } from '@/lib/demo-data';
import {
  AgentPersonality,
  AgentStatus,
  CallOutcome,
  CallRecord,
  LeadStatus,
  VoiceAgent,
  VoiceOption,
} from '@/lib/types';

type WorkspaceTab =
  | 'dashboard'
  | 'embed'
  | 'logs'
  | 'analytics'
  | 'leads'
  | 'custom-responses'
  | 'text-snippets'
  | 'links'
  | 'files'
  | 'settings';

const VALID_TABS: WorkspaceTab[] = [
  'dashboard',
  'embed',
  'logs',
  'analytics',
  'leads',
  'custom-responses',
  'text-snippets',
  'links',
  'files',
  'settings',
];

const PERSONALITIES: {
  id: AgentPersonality;
  title: string;
  summary: string;
}[] = [
  {
    id: 'Friendly',
    title: 'Friendly',
    summary:
      'Warm, approachable, and conversational for website visitors and product questions.',
  },
  {
    id: 'Professional',
    title: 'Professional',
    summary:
      'Polished, structured, and reassuring for SaaS, healthcare, finance, and B2B sites.',
  },
  {
    id: 'Casual',
    title: 'Casual',
    summary: 'Relaxed, natural, and concise for modern consumer brands and storefronts.',
  },
];

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

function outcomeLabel(status: CallOutcome): string {
  if (status === 'lead_captured') return 'Lead Captured';
  if (status === 'completed') return 'Completed';
  if (status === 'voicemail') return 'Callback Requested';
  return 'Dropped';
}

function StatusDisplay({ status }: { status: AgentStatus }) {
  if (status === 'Active') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Active
      </span>
    );
  }
  if (status === 'Draft') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
        <FileEdit className="h-3.5 w-3.5" />
        Draft
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500">
      <CirclePause className="h-3.5 w-3.5" />
      Inactive
    </span>
  );
}

export function ChatbotWorkspaceView({ agentId }: { agentId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    isLoading,
    user,
    firebaseUser,
    agents,
    calls,
    leads,
    knowledgeSources,
    toggleAgentStatus,
    updateLeadStatus,
    deleteAgent,
    pushToast,
  } = useApp();

  const tabParam = searchParams.get('tab') as WorkspaceTab | null;
  const activeTab: WorkspaceTab =
    tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'dashboard';

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [chatbotSwitcherOpen, setChatbotSwitcherOpen] = useState(false);
  const [cyclingStatus, setCyclingStatus] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);

  const agent = useMemo(
    () => agents.find((a) => a.id === agentId) || null,
    [agents, agentId]
  );

  const agentCalls = useMemo(
    () => calls.filter((c) => c.agentId === agentId),
    [calls, agentId]
  );

  const agentLeads = useMemo(
    () => leads.filter((l) => l.agentId === agentId),
    [leads, agentId]
  );

  const agentKnowledge = useMemo(
    () =>
      knowledgeSources.filter(
        (s) => s.agentId === agentId || s.agentId === 'all' || !s.agentId
      ),
    [knowledgeSources, agentId]
  );

  const linksCount = useMemo(
    () => agentKnowledge.filter((s) => s.sourceType === 'website').length,
    [agentKnowledge]
  );

  const filesCount = useMemo(
    () => agentKnowledge.filter((s) => s.sourceType === 'document').length,
    [agentKnowledge]
  );

  const customResponsesCount = useMemo(
    () => agentKnowledge.filter((s) => s.sourceType === 'text').length,
    [agentKnowledge]
  );

  const avgDurationSec = useMemo(() => {
    if (agentCalls.length === 0) return 0;
    const total = agentCalls.reduce((acc, c) => acc + (c.durationSeconds || 0), 0);
    return Math.round(total / agentCalls.length);
  }, [agentCalls]);

  const handleSelectTab = (nextTab: WorkspaceTab) => {
    setMobileSidebarOpen(false);
    setChatbotSwitcherOpen(false);
    router.replace(`/agents/${agentId}?tab=${nextTab}`, { scroll: false });
  };

  const handleToggleStatus = async () => {
    if (!agent || cyclingStatus) return;
    const next: AgentStatus = agent.status === 'Active' ? 'Inactive' : 'Active';
    setCyclingStatus(true);
    try {
      await toggleAgentStatus(agent.id, next);
      pushToast({
        title: `Chatbot is now ${next}`,
        description: `${agent.name} updated.`,
        variant: 'success',
      });
    } catch (err) {
      pushToast({
        title: 'Status update failed',
        description: err instanceof Error ? err.message : 'Unable to update status.',
        variant: 'error',
      });
    } finally {
      setCyclingStatus(false);
    }
  };

  const handleDeleteChatbot = async () => {
    if (!agent || deleting) return;
    setDeleting(true);
    try {
      await deleteAgent(agent.id);
      pushToast({
        title: 'Chatbot deleted',
        description: `${agent.name} has been removed from your workspace.`,
      });
      router.push('/dashboard');
    } catch (err) {
      pushToast({
        title: 'Delete failed',
        description: err instanceof Error ? err.message : 'Unable to delete chatbot.',
        variant: 'error',
      });
      setDeleting(false);
    }
  };

  const accountEmail = user?.email || firebaseUser?.email || 'Workspace';

  const SidebarNav = (
    <div className="flex h-full flex-col bg-white">
      {/* Chatbot Switcher Card */}
      <div className="relative px-3.5 pt-4 pb-1">
        {isLoading && !agent ? (
          <div className="flex w-full items-center justify-between gap-3 rounded-xl border border-neutral-200/90 bg-white px-3.5 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-3 w-36" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-6 shrink-0 rounded-full" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
            <Skeleton className="h-4 w-4 shrink-0" />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setChatbotSwitcherOpen((prev) => !prev)}
            aria-expanded={chatbotSwitcherOpen}
            className="flex w-full items-center justify-between gap-3 rounded-xl border border-neutral-200/90 bg-white px-3.5 py-2.5 text-left shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-colors hover:border-neutral-300"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11.5px] text-neutral-500">{accountEmail}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <CadenceOrbLauncherIcon className="h-6 w-6 shrink-0" />
                <span className="truncate font-display text-sm font-semibold tracking-[-0.01em] text-neutral-950">
                  {agent?.name || 'Select Chatbot'}
                </span>
              </div>
            </div>
            <TbSelector className="h-4 w-4 shrink-0 text-neutral-400" />
          </button>
        )}

        {chatbotSwitcherOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setChatbotSwitcherOpen(false)}
              aria-hidden="true"
            />
            <div className="absolute left-3.5 right-3.5 top-full z-20 mt-1.5 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-lg">
              <p className="px-2.5 py-1 text-[11px] font-medium text-neutral-500">
                Switch Chatbot
              </p>
              <div className="max-h-56 space-y-0.5 overflow-y-auto">
                {agents.map((item) => {
                  const isCurrent = item.id === agentId;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setChatbotSwitcherOpen(false);
                        setMobileSidebarOpen(false);
                        if (!isCurrent) {
                          router.push(`/agents/${item.id}?tab=${activeTab}`);
                        }
                      }}
                      className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${
                        isCurrent
                          ? 'bg-neutral-100 font-semibold text-neutral-900'
                          : 'text-neutral-700 hover:bg-neutral-50'
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <CadenceOrbLauncherIcon className="h-5 w-5 shrink-0" />
                        <span className="truncate">{item.name}</span>
                      </span>
                      {isCurrent && <Check className="h-3.5 w-3.5 shrink-0 text-blue-600" strokeWidth={2.1} />}
                    </button>
                  );
                })}
              </div>
              <div className="my-1 border-t border-neutral-200 pt-1">
                <Link
                  href="/dashboard"
                  onClick={() => {
                    setChatbotSwitcherOpen(false);
                    setMobileSidebarOpen(false);
                  }}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  <ArrowLeft className="h-3.5 w-3.5 text-neutral-400" strokeWidth={1.85} />
                  All Chatbots
                </Link>
                <Link
                  href="/create-chatbot"
                  onClick={() => {
                    setChatbotSwitcherOpen(false);
                    setMobileSidebarOpen(false);
                  }}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-blue-600 hover:bg-blue-50"
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                  Create New Chatbot
                </Link>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Scoped Sidebar Items */}
      <nav
        aria-label="Chatbot workspace navigation"
        className="flex-1 space-y-4 overflow-y-auto px-3 py-3"
      >
        <div className="space-y-0.5">
          {(
            [
              {
                id: 'dashboard',
                label: 'Dashboard',
                icon: TbLayoutNavbar,
                activeIcon: TbLayoutNavbarFilled,
              },
              {
                id: 'embed',
                label: 'Installation',
                icon: TbBriefcase,
                activeIcon: TbBriefcaseFilled,
              },

              {
                id: 'logs',
                label: 'Chat History',
                icon: TbMessages,
                activeIcon: TbMessagesFilled,
              },
              {
                id: 'analytics',
                label: 'Analytics',
                icon: TbChartBar,
                activeIcon: TbChartBar,
              },
              {
                id: 'leads',
                label: 'Leads',
                icon: TbAddressBook,
                activeIcon: TbAddressBook,
              },
            ] as const
          ).map((item) => {
            const active = activeTab === item.id;
            const Icon = active ? item.activeIcon : item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectTab(item.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13.5px] transition-colors duration-150 whitespace-nowrap ${
                  active
                    ? 'font-semibold text-blue-600'
                    : 'font-medium text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950'
                }`}
              >
                <Icon
                  className={`h-[19px] w-[19px] shrink-0 ${
                    active ? 'text-blue-600' : 'text-neutral-500'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* KNOWLEDGE BASE Section */}
        <div className="border-t border-neutral-200/80 pt-4">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-400">
            Knowledge Base
          </p>
          <div className="space-y-0.5">
            {(
              [
                {
                  id: 'custom-responses',
                  label: 'Custom Responses',
                  icon: TbQuote,
                  activeIcon: TbQuoteFilled,
                },
                {
                  id: 'text-snippets',
                  label: 'Text Snippets',
                  icon: TbLetterCase,
                  activeIcon: TbLetterCase,
                },
                {
                  id: 'links',
                  label: 'Website Links',
                  icon: TbLink,
                  activeIcon: TbLink,
                },
                {
                  id: 'files',
                  label: 'Files & Data Sources',
                  icon: TbFiles,
                  activeIcon: TbFilesFilled,
                },
              ] as const
            ).map((item) => {
              const active = activeTab === item.id;
              const Icon = active ? item.activeIcon : item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectTab(item.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13.5px] transition-colors duration-150 whitespace-nowrap ${
                    active
                      ? 'font-semibold text-blue-600'
                      : 'font-medium text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950'
                  }`}
                >
                  <Icon
                    className={`h-[19px] w-[19px] shrink-0 ${
                      active ? 'text-blue-600' : 'text-neutral-500'
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* CUSTOMIZATIONS Section */}
        <div className="border-t border-neutral-200/80 pt-4">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-400">
            Customizations
          </p>
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => handleSelectTab('settings')}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13.5px] transition-colors duration-150 whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'font-semibold text-blue-600'
                  : 'font-medium text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950'
              }`}
            >
              {activeTab === 'settings' ? (
                <TbSettingsFilled className="h-[19px] w-[19px] shrink-0 text-blue-600" />
              ) : (
                <TbSettings className="h-[19px] w-[19px] shrink-0 text-neutral-500" />
              )}
              <span>Settings</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-50/70 text-neutral-900">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between gap-4 border-b border-neutral-200 bg-white px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen((prev) => !prev)}
            aria-label={
              mobileSidebarOpen
                ? 'Close chatbot workspace menu'
                : 'Open chatbot workspace menu'
            }
            aria-expanded={mobileSidebarOpen}
            className={`rounded-lg p-1.5 text-neutral-700 transition-colors lg:hidden ${
              mobileSidebarOpen
                ? 'bg-neutral-100 hover:bg-neutral-200/70'
                : 'hover:bg-neutral-100'
            }`}
          >
            {mobileSidebarOpen ? (
              <X className="h-5 w-5" strokeWidth={1.85} />
            ) : (
              <Menu className="h-5 w-5" strokeWidth={1.85} />
            )}
          </button>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-neutral-950 whitespace-nowrap shrink-0"
          >
            <BrandMark className="h-7 w-7 text-blue-600" />
            <span className="font-display text-[17px] font-bold tracking-[-0.02em]">
              Cadence
            </span>
          </Link>
        </div>

        <AccountDropdown />
      </header>

      <div className="flex">
        {/* Desktop Scoped Left Sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-neutral-200 bg-white lg:block">
          <div className="sticky top-14 h-[calc(100vh-3.5rem)]">{SidebarNav}</div>
        </aside>

        {/* Mobile Slide-Over Sidebar Drawer (sits cleanly beneath the h-14 header) */}
        {mobileSidebarOpen && (
          <div className="fixed inset-x-0 top-14 bottom-0 z-40 flex lg:hidden">
            <div
              className="fixed inset-x-0 top-14 bottom-0 bg-neutral-950/35"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <aside className="relative z-10 h-full w-72 max-w-[85vw] border-r border-neutral-200 bg-white shadow-xl">
              {SidebarNav}
            </aside>
          </div>
        )}

        {/* Main Workspace Content */}
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-8">
          <div className="mx-auto max-w-4xl">
            {isLoading && !agent ? (
              <div
                role="status"
                aria-label="Loading chatbot dashboard"
                className="space-y-5 pb-14"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <Skeleton className="h-8 w-36" />
                    <Skeleton className="mt-2 h-3.5 w-52" />
                  </div>
                  <Skeleton className="h-8 w-20 rounded-lg" />
                </div>

                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-neutral-200/90 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                    >
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                        <Skeleton className="h-4 w-36" />
                      </div>
                      <div className="mt-4 flex items-center justify-between gap-4">
                        <Skeleton className="h-8 w-10" />
                        <Skeleton className="h-8 w-24 rounded-lg" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : !agent ? (
              <div className="space-y-6">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-900"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to Chatbots
                </Link>
                <EmptyState
                  icon={Sparkles}
                  title="Chatbot not found"
                  description="This voice chatbot may have been deleted or belongs to a different workspace."
                  actionLabel="Return to Chatbots"
                  onAction={() => router.push('/dashboard')}
                />
              </div>
            ) : (
              <>
                {activeTab === 'dashboard' && (
                  <div className="space-y-5 pb-14">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h1 className="font-display text-2xl font-bold tracking-[-0.025em] text-neutral-950 sm:text-[28px]">
                          Dashboard
                        </h1>
                        <p className="mt-1 text-xs text-neutral-500">
                          {agent.name} · {agent.websiteUrl || agent.businessName}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={cyclingStatus}
                        onClick={handleToggleStatus}
                        title="Toggle Active / Inactive"
                        className="rounded-lg border border-neutral-200/90 bg-white px-2.5 py-1.5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-colors hover:bg-neutral-50 disabled:opacity-50"
                      >
                        <StatusDisplay status={agent.status} />
                      </button>
                    </div>

                    <div className="space-y-4">
                      {/* Total Links */}
                      <div
                        className={`rounded-xl bg-white p-5 transition-colors ${
                          linksCount === 0
                            ? 'border border-dashed border-blue-300/90'
                            : 'border border-neutral-200/90 shadow-[0_1px_2px_rgba(15,23,42,0.04)]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                            <Link2 className="h-[18px] w-[18px]" strokeWidth={1.85} />
                          </span>
                          <span className="text-sm font-medium text-neutral-800">
                            Total Links
                          </span>
                        </div>
                        <div className="mt-4 flex items-center justify-between gap-4">
                          <span
                            className={`font-display text-[32px] leading-none font-bold tracking-[-0.03em] tabular-nums ${
                              linksCount === 0 ? 'text-neutral-400' : 'text-neutral-950'
                            }`}
                          >
                            {linksCount}
                          </span>
                          {linksCount === 0 ? (
                            <button
                              type="button"
                              onClick={() => handleSelectTab('links')}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-blue-700 whitespace-nowrap"
                            >
                              <Plus className="h-3.5 w-3.5" strokeWidth={2.2} />
                              Add
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSelectTab('links')}
                              className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap"
                            >
                              View All Links
                              <ChevronRight className="h-4 w-4" strokeWidth={1.9} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Total Files */}
                      <div
                        className={`rounded-xl bg-white p-5 transition-colors ${
                          filesCount === 0
                            ? 'border border-dashed border-blue-300/90'
                            : 'border border-neutral-200/90 shadow-[0_1px_2px_rgba(15,23,42,0.04)]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                            <Files className="h-[18px] w-[18px]" strokeWidth={1.85} />
                          </span>
                          <span className="text-sm font-medium text-neutral-800">
                            Total Files
                          </span>
                        </div>
                        <div className="mt-4 flex items-center justify-between gap-4">
                          <span
                            className={`font-display text-[32px] leading-none font-bold tracking-[-0.03em] tabular-nums ${
                              filesCount === 0 ? 'text-neutral-400' : 'text-neutral-950'
                            }`}
                          >
                            {filesCount}
                          </span>
                          {filesCount === 0 ? (
                            <button
                              type="button"
                              onClick={() => handleSelectTab('files')}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-blue-700 whitespace-nowrap"
                            >
                              <Plus className="h-3.5 w-3.5" strokeWidth={2.2} />
                              Add
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSelectTab('files')}
                              className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap"
                            >
                              View All Files
                              <ChevronRight className="h-4 w-4" strokeWidth={1.9} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Total Custom Responses */}
                      <div
                        className={`rounded-xl bg-white p-5 transition-colors ${
                          customResponsesCount === 0
                            ? 'border border-dashed border-blue-300/90'
                            : 'border border-neutral-200/90 shadow-[0_1px_2px_rgba(15,23,42,0.04)]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                            <Quote className="h-[18px] w-[18px]" strokeWidth={1.85} />
                          </span>
                          <span className="text-sm font-medium text-neutral-800">
                            Total Custom Responses
                          </span>
                        </div>
                        <div className="mt-4 flex items-center justify-between gap-4">
                          <span
                            className={`font-display text-[32px] leading-none font-bold tracking-[-0.03em] tabular-nums ${
                              customResponsesCount === 0
                                ? 'text-neutral-400'
                                : 'text-neutral-950'
                            }`}
                          >
                            {customResponsesCount}
                          </span>
                          {customResponsesCount === 0 ? (
                            <button
                              type="button"
                              onClick={() => handleSelectTab('custom-responses')}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-blue-700 whitespace-nowrap"
                            >
                              <Plus className="h-3.5 w-3.5" strokeWidth={2.2} />
                              Add
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSelectTab('custom-responses')}
                              className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap"
                            >
                              View Custom Responses
                              <ChevronRight className="h-4 w-4" strokeWidth={1.9} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Total Messages */}
                      <div className="rounded-xl border border-neutral-200/90 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                            <MessagesSquare className="h-[18px] w-[18px]" strokeWidth={1.85} />
                          </span>
                          <span className="text-sm font-medium text-neutral-800">
                            Total Messages
                          </span>
                        </div>
                        <div className="mt-4 flex items-center justify-between gap-4">
                          <span className="font-display text-[32px] leading-none font-bold tracking-[-0.03em] text-neutral-950 tabular-nums">
                            {agentCalls.length}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleSelectTab('logs')}
                            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap"
                          >
                            View Chat History
                            <ChevronRight className="h-4 w-4" strokeWidth={1.9} />
                          </button>
                        </div>
                      </div>

                      {/* Captured Leads */}
                      <div className="rounded-xl border border-neutral-200/90 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                            <ThumbsUp className="h-[18px] w-[18px]" strokeWidth={1.85} />
                          </span>
                          <span className="text-sm font-medium text-neutral-800">
                            Captured Leads
                          </span>
                        </div>
                        <div className="mt-4 flex items-center justify-between gap-4">
                          <span className="font-display text-[32px] leading-none font-bold tracking-[-0.03em] text-neutral-950 tabular-nums">
                            {agentLeads.length}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleSelectTab('leads')}
                            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap"
                          >
                            View Leads
                            <ChevronRight className="h-4 w-4" strokeWidth={1.9} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'embed' && (
                  <EmbedView scopedAgentId={agent.id} embedded />
                )}



                {activeTab === 'links' && (
                  <div className="space-y-4">
                    <div>
                      <h1 className="font-display text-2xl font-bold tracking-[-0.025em] text-neutral-950">
                        Website Links
                      </h1>
                      <p className="mt-1 text-sm text-neutral-500">
                        Crawl and index website pages for {agent.name}.
                      </p>
                    </div>
                    <KnowledgeBaseView
                      key="links"
                      scopedAgentId={agent.id}
                      initialSourceType="website"
                      embedded
                    />
                  </div>
                )}

                {activeTab === 'files' && (
                  <div className="space-y-4">
                    <div>
                      <h1 className="font-display text-2xl font-bold tracking-[-0.025em] text-neutral-950">
                        Files &amp; Data Sources
                      </h1>
                      <p className="mt-1 text-sm text-neutral-500">
                        Upload PDFs, TXT, DOCX, or Markdown documents for {agent.name}.
                      </p>
                    </div>
                    <KnowledgeBaseView
                      key="files"
                      scopedAgentId={agent.id}
                      initialSourceType="document"
                      embedded
                    />
                  </div>
                )}

                {activeTab === 'custom-responses' && (
                  <div className="space-y-4">
                    <div>
                      <h1 className="font-display text-2xl font-bold tracking-[-0.025em] text-neutral-950">
                        Custom Responses
                      </h1>
                      <p className="mt-1 text-sm text-neutral-500">
                        Save exact Q&amp;A pairs, scripts, and policy snippets for {agent.name}.
                      </p>
                    </div>
                    <KnowledgeBaseView
                      key="custom-responses"
                      scopedAgentId={agent.id}
                      initialSourceType="text"
                      embedded
                    />
                  </div>
                )}

                {activeTab === 'text-snippets' && (
                  <div className="space-y-4">
                    <div>
                      <h1 className="font-display text-2xl font-bold tracking-[-0.025em] text-neutral-950">
                        Text Snippets
                      </h1>
                      <p className="mt-1 text-sm text-neutral-500">
                        Add concise knowledge snippets, FAQs, and reference notes for {agent.name}.
                      </p>
                    </div>
                    <KnowledgeBaseView
                      key="text-snippets"
                      scopedAgentId={agent.id}
                      initialSourceType="text"
                      embedded
                    />
                  </div>
                )}

                {activeTab === 'logs' && (
                  <div className="space-y-4">
                    <div>
                      <h1 className="font-display text-2xl font-bold tracking-[-0.025em] text-neutral-950">
                        Chat History
                      </h1>
                      <p className="mt-1 text-sm text-neutral-500">
                        {agentCalls.length} conversations handled by {agent.name}
                      </p>
                    </div>

                    {agentCalls.length === 0 ? (
                      <EmptyState
                        icon={MessageSquare}
                        title="No conversations yet"
                        description={`Open a standalone chat or embed ${agent.name} on your website to see visitor transcripts here.`}
                        actionLabel="Open Installation"
                        onAction={() => handleSelectTab('embed')}
                      />
                    ) : (
                      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xs">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm">
                            <thead>
                              <tr className="border-b border-neutral-200 bg-neutral-50 text-xs font-medium text-neutral-500">
                                <th className="px-4 py-3">Visitor</th>
                                <th className="px-4 py-3">Outcome</th>
                                <th className="px-4 py-3 text-right">Duration</th>
                                <th className="px-4 py-3 text-right">Time</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200">
                              {agentCalls.map((call) => (
                                <tr
                                  key={call.id}
                                  onClick={() => setSelectedCall(call)}
                                  className="cursor-pointer transition-colors hover:bg-neutral-50"
                                >
                                  <td className="px-4 py-3">
                                    <p className="font-medium text-neutral-900">
                                      {call.callerName}
                                    </p>
                                    <p className="text-xs text-neutral-500">
                                      {call.phoneNumber || 'Website Widget'}
                                    </p>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span
                                      className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                                        call.callStatus === 'lead_captured'
                                          ? 'text-emerald-700'
                                          : call.callStatus === 'completed'
                                            ? 'text-blue-700'
                                            : 'text-amber-700'
                                      }`}
                                    >
                                      {call.callStatus === 'lead_captured' ? (
                                        <UserPlus className="h-3.5 w-3.5" />
                                      ) : (
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                      )}
                                      {outcomeLabel(call.callStatus)}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-right font-mono text-xs text-neutral-700 tabular-nums">
                                    {formatDuration(call.durationSeconds)}
                                  </td>
                                  <td className="px-4 py-3 text-right text-xs text-neutral-500">
                                    {call.timestamp}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'analytics' && (
                  <div className="space-y-5">
                    <div>
                      <h1 className="font-display text-2xl font-bold tracking-[-0.025em] text-neutral-950">
                        Analytics
                      </h1>
                      <p className="mt-1 text-sm text-neutral-500">
                        Performance metrics scoped specifically to {agent.name}.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs">
                        <p className="text-xs font-medium text-neutral-500">
                          Total Chats
                        </p>
                        <p className="mt-2 text-2xl font-bold text-neutral-900 tabular-nums">
                          {agentCalls.length}
                        </p>
                      </div>
                      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs">
                        <p className="text-xs font-medium text-neutral-500">
                          Leads Captured
                        </p>
                        <p className="mt-2 text-2xl font-bold text-neutral-900 tabular-nums">
                          {agentLeads.length}
                        </p>
                      </div>
                      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs">
                        <p className="text-xs font-medium text-neutral-500">
                          Avg Chat Duration
                        </p>
                        <p className="mt-2 text-2xl font-bold text-neutral-900 tabular-nums">
                          {formatDuration(avgDurationSec)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs">
                        <p className="text-xs font-medium text-neutral-500">
                          Knowledge Sources
                        </p>
                        <p className="mt-2 text-2xl font-bold text-neutral-900 tabular-nums">
                          {agentKnowledge.length}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs">
                      <h2 className="text-sm font-semibold text-neutral-900">
                        Training Breakdown
                      </h2>
                      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                          <p className="text-xs text-neutral-500">Website Links</p>
                          <p className="mt-1 text-xl font-bold text-neutral-900 tabular-nums">
                            {linksCount}
                          </p>
                        </div>
                        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                          <p className="text-xs text-neutral-500">Uploaded Files</p>
                          <p className="mt-1 text-xl font-bold text-neutral-900 tabular-nums">
                            {filesCount}
                          </p>
                        </div>
                        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                          <p className="text-xs text-neutral-500">Custom Responses</p>
                          <p className="mt-1 text-xl font-bold text-neutral-900 tabular-nums">
                            {customResponsesCount}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'leads' && (
                  <div className="space-y-4">
                    <div>
                      <h1 className="font-display text-2xl font-bold tracking-[-0.025em] text-neutral-950">
                        Leads
                      </h1>
                      <p className="mt-1 text-sm text-neutral-500">
                        Visitors who shared their contact details inside {agent.name}.
                      </p>
                    </div>

                    {agentLeads.length === 0 ? (
                      <EmptyState
                        icon={UserPlus}
                        title="No leads captured yet"
                        description="When visitors leave their name, email, or phone inside this chatbot widget, they appear here."
                        actionLabel="Open Installation"
                        onAction={() => handleSelectTab('embed')}
                      />
                    ) : (
                      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xs">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm">
                            <thead>
                              <tr className="border-b border-neutral-200 bg-neutral-50 text-xs font-medium text-neutral-500">
                                <th className="px-4 py-3">Visitor</th>
                                <th className="px-4 py-3">Summary</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-right">Captured</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200">
                              {agentLeads.map((lead) => (
                                <tr key={lead.id}>
                                  <td className="px-4 py-3">
                                    <p className="font-medium text-neutral-900">
                                      {lead.visitorName}
                                    </p>
                                    <p className="text-xs text-neutral-500">
                                      {lead.visitorEmail}
                                      {lead.visitorPhone ? ` · ${lead.visitorPhone}` : ''}
                                    </p>
                                  </td>
                                  <td className="px-4 py-3 text-xs text-neutral-600">
                                    {lead.inquirySummary || lead.sourcePageUrl || '—'}
                                  </td>
                                  <td className="px-4 py-3">
                                    <select
                                      value={lead.status}
                                      onChange={(e) =>
                                        updateLeadStatus(
                                          lead.id,
                                          e.target.value as LeadStatus
                                        )
                                      }
                                      className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-neutral-800 focus:border-blue-500 focus:outline-none"
                                    >
                                      <option value="New">New</option>
                                      <option value="Contacted">Contacted</option>
                                      <option value="Qualified">Qualified</option>
                                    </select>
                                  </td>
                                  <td className="px-4 py-3 text-right text-xs text-neutral-500">
                                    {lead.createdAt}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'settings' && (
                  <div className="space-y-4">
                    <div>
                      <h1 className="font-display text-2xl font-bold tracking-[-0.025em] text-neutral-950">
                        Settings
                      </h1>
                      <p className="mt-1 text-sm text-neutral-500">
                        Customize {agent.name}&apos;s identity, instructions, status, and voice profile.
                      </p>
                    </div>
                    <ChatbotSettingsForm
                      key={agent.id}
                      agent={agent}
                      onRequestDelete={() => setConfirmDeleteOpen(true)}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Floating Bottom-Right Interactive Chatbot Launcher */}
      {agent && <FloatingChatbotLauncher key={agent.id} agent={agent} />}

      {/* Transcript Slide-over Drawer */}
      {selectedCall && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-neutral-950/35"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex h-full w-full max-w-md flex-col border-l border-neutral-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">
                  {selectedCall.callerName}
                </h3>
                <p className="text-xs text-neutral-500 tabular-nums">
                  {selectedCall.phoneNumber} · {selectedCall.timestamp}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCall(null)}
                aria-label="Close call details"
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              <div className="grid grid-cols-2 gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3.5 text-xs">
                <div>
                  <span className="text-neutral-500">Chatbot</span>
                  <p className="mt-0.5 font-medium text-neutral-900">
                    {selectedCall.agentName}
                  </p>
                </div>
                <div>
                  <span className="text-neutral-500">Duration</span>
                  <p className="mt-0.5 flex items-center gap-1 font-mono font-medium text-neutral-900 tabular-nums">
                    <Clock className="h-3 w-3 text-neutral-400" />
                    {formatDuration(selectedCall.durationSeconds)}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Transcript
                </h4>
                <div className="mt-2.5 rounded-lg border border-neutral-200 bg-neutral-50/70 p-3.5 text-sm leading-relaxed whitespace-pre-wrap text-neutral-700">
                  {selectedCall.transcript ||
                    'No transcript recorded for this conversation.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete voice chatbot?"
        description={
          agent
            ? `This will permanently delete "${agent.name}" and disconnect its public widget embed snippet.`
            : ''
        }
        confirmLabel={deleting ? 'Deleting...' : 'Delete Chatbot'}
        destructive
        onConfirm={handleDeleteChatbot}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </div>
  );
}

function ChatbotSettingsForm({
  agent,
  onRequestDelete,
}: {
  agent: VoiceAgent;
  onRequestDelete: () => void;
}) {
  const { updateAgent, pushToast } = useApp();

  const [name, setName] = useState(agent.name);
  const [businessName, setBusinessName] = useState(agent.businessName);
  const [websiteUrl, setWebsiteUrl] = useState(agent.websiteUrl || '');
  const [description, setDescription] = useState(agent.description);
  const [welcomeMessage, setWelcomeMessage] = useState(agent.welcomeMessage || '');
  const [status, setStatus] = useState<AgentStatus>(agent.status);
  const [personality, setPersonality] = useState<AgentPersonality>(agent.personality);
  const [customInstructions, setCustomInstructions] = useState(
    agent.customInstructions
  );
  const [voiceId, setVoiceId] = useState(agent.voiceId);
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!previewingVoiceId) return;
    const timer = window.setTimeout(() => {
      setPreviewingVoiceId(null);
    }, 3500);
    return () => window.clearTimeout(timer);
  }, [previewingVoiceId]);

  const toggleVoicePreview = (voice: VoiceOption) => {
    if (previewingVoiceId === voice.id) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setPreviewingVoiceId(null);
      return;
    }
    setPreviewingVoiceId(voice.id);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
      const utterance = new SpeechSynthesisUtterance(voice.sampleLine);
      utterance.rate = 1.0;
      utterance.pitch =
        voice.gender === 'Female' ? 1.2 : voice.gender === 'Male' ? 0.8 : 1.0;
      const voices = window.speechSynthesis.getVoices();
      const match = voices.find((v) => v.lang.includes('en')) || voices[0];
      if (match) utterance.voice = match;
      utterance.onend = () => setPreviewingVoiceId(null);
      utterance.onerror = () => setPreviewingVoiceId(null);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !businessName.trim() || saving) return;

    const selectedVoice =
      VOICE_OPTIONS.find((v) => v.id === voiceId) || VOICE_OPTIONS[0];
    const voiceLabel = `${selectedVoice.name} · ${selectedVoice.gender} · ${selectedVoice.language}`;

    setSaving(true);
    try {
      await updateAgent(agent.id, {
        name: name.trim(),
        businessName: businessName.trim(),
        websiteUrl: websiteUrl.trim(),
        description: description.trim(),
        welcomeMessage:
          welcomeMessage.trim() ||
          `Hi! Ask me anything about ${businessName.trim()}.`,
        status,
        personality,
        customInstructions: customInstructions.trim(),
        voiceId: selectedVoice.id,
        voiceLabel,
        language: selectedVoice.language,
      });
      pushToast({
        title: 'Chatbot settings saved',
        description: `${name.trim()} updated in Firestore and live widget.`,
        variant: 'success',
      });
    } catch (err) {
      pushToast({
        title: 'Save failed',
        description: err instanceof Error ? err.message : 'Unable to save settings.',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <form
        onSubmit={handleSave}
        className="space-y-6 rounded-xl border border-neutral-200 bg-white p-6 shadow-xs"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-neutral-800">
              Chatbot name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-800">
              Business name
            </label>
            <input
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-neutral-800">
              Website URL
            </label>
            <div className="relative mt-1.5">
              <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://yourwebsite.com"
                className="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-9 pr-3.5 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <span className="block text-sm font-medium text-neutral-800">
              Status
            </span>
            <div className="mt-1.5 grid grid-cols-3 gap-2">
              {(['Active', 'Draft', 'Inactive'] as AgentStatus[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setStatus(option)}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                    status === option
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-800">
            Description
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-800">
            Widget Greeting Message
          </label>
          <input
            type="text"
            value={welcomeMessage}
            onChange={(e) => setWelcomeMessage(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <span className="block text-sm font-medium text-neutral-800">
            Personality
          </span>
          <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {PERSONALITIES.map((item) => {
              const active = personality === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPersonality(item.id)}
                  className={`rounded-xl border p-3.5 text-left transition-colors ${
                    active
                      ? 'border-blue-600 bg-blue-50/70'
                      : 'border-neutral-200 bg-white hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-neutral-900">
                      {item.title}
                    </span>
                    {active && <Check className="h-4 w-4 text-blue-600" />}
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">{item.summary}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-800">
            Custom Instructions
          </label>
          <textarea
            rows={4}
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-sm leading-relaxed text-neutral-900 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <span className="block text-sm font-medium text-neutral-800">
            Voice Profile
          </span>
          <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {VOICE_OPTIONS.map((voice) => {
              const selected = voice.id === voiceId;
              const isPreviewing = previewingVoiceId === voice.id;
              return (
                <div
                  key={voice.id}
                  onClick={() => setVoiceId(voice.id)}
                  role="radio"
                  aria-checked={selected}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setVoiceId(voice.id);
                    }
                  }}
                  className={`cursor-pointer rounded-xl border p-3.5 transition-colors ${
                    selected
                      ? 'border-blue-600 bg-blue-50/60'
                      : 'border-neutral-200 bg-white hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-neutral-900">
                        {voice.name}
                      </p>
                      <p className="mt-0.5 text-xs text-neutral-500">
                        {voice.gender} · {voice.language}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleVoicePreview(voice);
                      }}
                      className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium whitespace-nowrap ${
                        isPreviewing
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                      }`}
                    >
                      {isPreviewing ? (
                        <>
                          <Pause className="h-3 w-3" />
                          Playing
                        </>
                      ) : (
                        <>
                          <Play className="h-3 w-3" />
                          Preview
                        </>
                      )}
                    </button>
                  </div>
                  {isPreviewing && (
                    <div className="mt-2 flex items-center gap-2 rounded-lg bg-neutral-100 px-2.5 py-1.5 text-xs text-neutral-700">
                      <Volume2 className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                      <span className="truncate italic">&ldquo;{voice.sampleLine}&rdquo;</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end border-t border-neutral-200 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Chatbot Settings'}
          </button>
        </div>
      </form>

      {/* Danger Zone */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50/40 p-5 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-sm font-semibold text-rose-900">
            Delete this chatbot
          </h3>
          <p className="mt-0.5 text-xs text-rose-700">
            Permanently remove {agent.name} and disconnect its embed widget from websites.
          </p>
        </div>
        <button
          type="button"
          onClick={onRequestDelete}
          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3.5 py-2 text-xs font-medium text-rose-700 transition-colors hover:bg-rose-50 whitespace-nowrap shrink-0"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete Chatbot
        </button>
      </div>
    </div>
  );
}
