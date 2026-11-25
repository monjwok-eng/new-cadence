'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bot,
  CheckCircle2,
  CirclePause,
  Code2,
  FileEdit,
  LayoutGrid,
  List,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { useApp } from '@/components/providers/app-provider';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { TableSkeleton } from '@/components/ui/skeleton';
import { AgentStatus, VoiceAgent } from '@/lib/types';

const STATUS_FILTERS: ('All' | AgentStatus)[] = ['All', 'Active', 'Draft', 'Inactive'];

function StatusIndicator({ status }: { status: AgentStatus }) {
  if (status === 'Active') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Active
      </span>
    );
  }
  if (status === 'Draft') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
        <FileEdit className="h-3.5 w-3.5" />
        Draft
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400">
      <CirclePause className="h-3.5 w-3.5" />
      Inactive
    </span>
  );
}

export function AgentsView() {
  const router = useRouter();
  const {
    isReady,
    agents,
    deleteAgent,
    toggleAgentStatus,
    pushToast,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | AgentStatus>('All');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [agentToDelete, setAgentToDelete] = useState<VoiceAgent | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const filteredAgents = agents.filter((agent) => {
    const matchesStatus = statusFilter === 'All' || agent.status === statusFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      agent.name.toLowerCase().includes(q) ||
      agent.businessName.toLowerCase().includes(q) ||
      agent.voiceLabel.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const handleConfirmDelete = async () => {
    if (!agentToDelete) return;
    const target = agentToDelete;
    setBusyId(target.id);
    setAgentToDelete(null);
    try {
      await deleteAgent(target.id);
      pushToast({
        title: 'Agent deleted',
        description: `${target.name} has been removed from this workspace.`,
      });
    } catch (err) {
      pushToast({
        title: 'Delete failed',
        description: err instanceof Error ? err.message : 'Unable to delete agent.',
        variant: 'error',
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleCycleStatus = async (agent: VoiceAgent) => {
    const next: AgentStatus =
      agent.status === 'Active' ? 'Inactive' : 'Active';
    setBusyId(agent.id);
    try {
      await toggleAgentStatus(agent.id, next);
      pushToast({
        title: `Agent set to ${next}`,
        description: `${agent.name} status updated.`,
      });
    } catch (err) {
      pushToast({
        title: 'Status update failed',
        description: err instanceof Error ? err.message : 'Unable to update status.',
        variant: 'error',
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-neutral-200 pb-6 sm:flex-row sm:items-end dark:border-neutral-800">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            Voice Chatbots
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Create, train, customize, and embed website AI voice chatbots across your domains.
          </p>
        </div>
        <Link
          href="/create-chatbot"
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4" />
          Create Chatbot
        </Link>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chatbots or voices..."
              className="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-9 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
            />
          </div>

          <div className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-neutral-100/70 p-1 dark:border-neutral-800 dark:bg-neutral-900">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setStatusFilter(filter)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  statusFilter === filter
                    ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-800 dark:text-neutral-100'
                    : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="inline-flex items-center gap-1 self-start rounded-lg border border-neutral-200 bg-white p-1 dark:border-neutral-800 dark:bg-neutral-900">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            aria-label="Table view"
            className={`rounded-md p-1.5 transition-colors ${
              viewMode === 'table'
                ? 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'
                : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
            }`}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            aria-label="Card view"
            className={`rounded-md p-1.5 transition-colors ${
              viewMode === 'cards'
                ? 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'
                : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {!isReady ? (
        <TableSkeleton rows={4} />
      ) : filteredAgents.length === 0 ? (
        <EmptyState
          icon={Bot}
          title={
            agents.length === 0
              ? 'No voice chatbots yet'
              : 'No chatbots match your current filter'
          }
          description={
            agents.length === 0
              ? 'Build your first website voice chatbot trained on your URLs and documents, then embed it in minutes.'
              : 'Try clearing your search term or switching the status filter.'
          }
          actionLabel={agents.length === 0 ? 'Create Chatbot' : 'Clear Filters'}
          onAction={() => {
            if (agents.length === 0) {
              router.push('/create-chatbot');
            } else {
              setSearchQuery('');
              setStatusFilter('All');
            }
          }}
        />
      ) : viewMode === 'table' ? (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/70 text-xs font-medium text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950/40 dark:text-neutral-400">
                  <th className="px-4 py-3">Chatbot</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Voice</th>
                  <th className="px-4 py-3 text-right">Conversations</th>
                  <th className="px-4 py-3">Last Updated</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {filteredAgents.map((agent) => (
                  <tr
                    key={agent.id}
                    className="transition-colors hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40"
                  >
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/agents/${agent.id}`}
                        className="block font-medium text-neutral-900 hover:text-indigo-600 dark:text-neutral-100 dark:hover:text-indigo-400"
                      >
                        {agent.name}
                      </Link>
                      <p className="mt-0.5 max-w-xs truncate text-xs text-neutral-500 dark:text-neutral-400">
                        {agent.businessName} · {agent.personality}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        type="button"
                        disabled={busyId === agent.id}
                        onClick={() => handleCycleStatus(agent)}
                        title="Click to toggle Active / Inactive"
                        className="rounded-md px-1.5 py-1 transition-colors hover:bg-neutral-100 disabled:opacity-60 dark:hover:bg-neutral-800"
                      >
                        <StatusIndicator status={agent.status} />
                      </button>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-neutral-700 dark:text-neutral-300">
                      {agent.voiceLabel}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-xs text-neutral-900 tabular-nums dark:text-neutral-100">
                      {agent.callsCount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-neutral-500 dark:text-neutral-400">
                      {agent.updatedAt}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="inline-flex items-center justify-end gap-1">
                        <Link
                          href={`/agents/${agent.id}?tab=embed`}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/40 whitespace-nowrap"
                        >
                          <Code2 className="h-3.5 w-3.5" />
                          Embed
                        </Link>
                        <Link
                          href={`/agents/${agent.id}?tab=settings`}
                          aria-label={`Edit ${agent.name}`}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 whitespace-nowrap"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Settings
                        </Link>
                        <button
                          type="button"
                          disabled={busyId === agent.id}
                          onClick={() => setAgentToDelete(agent)}
                          aria-label={`Delete ${agent.name}`}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-60 dark:text-rose-400 dark:hover:bg-rose-950/40 whitespace-nowrap"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAgents.map((agent) => (
            <div
              key={agent.id}
              className="flex flex-col justify-between rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/agents/${agent.id}`}
                      className="block truncate text-base font-semibold text-neutral-900 hover:text-indigo-600 dark:text-neutral-100 dark:hover:text-indigo-400"
                    >
                      {agent.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                      {agent.businessName} · {agent.personality}
                    </p>
                  </div>
                  <StatusIndicator status={agent.status} />
                </div>

                <p className="mt-3 line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">
                  {agent.description}
                </p>
              </div>

              <div className="mt-5 border-t border-neutral-200 pt-4 dark:border-neutral-800">
                <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                  <span className="truncate">{agent.voiceLabel}</span>
                  <span className="font-mono font-medium text-neutral-900 tabular-nums dark:text-neutral-100">
                    {agent.callsCount} chats
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[11px] text-neutral-400">
                    Updated {agent.updatedAt}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/agents/${agent.id}?tab=embed`}
                      className="rounded-lg border border-indigo-200 bg-indigo-50/70 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300"
                    >
                      Embed
                    </Link>
                    <Link
                      href={`/agents/${agent.id}`}
                      className="rounded-lg border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
                    >
                      Workspace
                    </Link>
                    <button
                      type="button"
                      disabled={busyId === agent.id}
                      onClick={() => setAgentToDelete(agent)}
                      className="rounded-lg border border-neutral-200 px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-60 dark:border-neutral-700 dark:text-rose-400 dark:hover:bg-rose-950/40"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(agentToDelete)}
        title="Delete voice chatbot?"
        description={
          agentToDelete
            ? `This will permanently remove "${agentToDelete.name}" from your workspace database.`
            : ''
        }
        confirmLabel="Delete Chatbot"
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setAgentToDelete(null)}
      />
    </div>
  );
}
