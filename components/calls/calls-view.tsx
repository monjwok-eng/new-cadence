'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Globe,
  MessageSquare,
  Mic,
  PhoneMissed,
  Search,
  UserPlus,
  X,
} from 'lucide-react';
import { useApp } from '@/components/providers/app-provider';
import { EmptyState } from '@/components/ui/empty-state';
import { TableSkeleton } from '@/components/ui/skeleton';
import { CallOutcome, CallRecord } from '@/lib/types';

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

export function CallsView() {
  const { isReady, calls } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState<'all' | CallOutcome>('all');
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);

  const filteredCalls = calls.filter((call) => {
    const matchesOutcome =
      outcomeFilter === 'all' || call.callStatus === outcomeFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      call.callerName.toLowerCase().includes(q) ||
      call.phoneNumber.toLowerCase().includes(q) ||
      call.agentName.toLowerCase().includes(q);
    return matchesOutcome && matchesQuery;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 border-b border-neutral-200 pb-6 sm:flex-row sm:items-end dark:border-neutral-800">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            Conversation Logs
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Inspect visitor voice sessions, durations, and transcripts persisted to your workspace.
          </p>
        </div>
        <Link
          href="/voice-test"
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <Mic className="h-4 w-4" />
          Open Voice Chat Test
        </Link>
      </div>

          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search visitor, source, or chatbot..."
                className="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-9 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-indigo-500 focus:outline-none dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
              />
            </div>

            <div className="inline-flex items-center gap-1 self-start rounded-lg border border-neutral-200 bg-neutral-100/70 p-1 dark:border-neutral-800 dark:bg-neutral-900">
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'lead_captured', label: 'Lead Captured' },
                  { id: 'completed', label: 'Completed' },
                  { id: 'voicemail', label: 'Callback' },
                  { id: 'missed', label: 'Dropped' },
                ] as const
              ).map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setOutcomeFilter(o.id)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                    outcomeFilter === o.id
                      ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-800 dark:text-neutral-100'
                      : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {!isReady ? (
            <TableSkeleton rows={5} />
          ) : calls.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No conversations recorded yet"
              description="Test a chatbot in Voice Chat Test or embed Cadence on your website to inspect visitor transcripts here."
            />
          ) : filteredCalls.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No matching conversations"
              description="Try clearing your search or selecting another outcome filter."
              actionLabel="Reset Filters"
              onAction={() => {
                setSearchQuery('');
                setOutcomeFilter('all');
              }}
            />
          ) : (
            <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50/70 text-xs font-medium text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950/40 dark:text-neutral-400">
                      <th className="px-4 py-3">Visitor</th>
                      <th className="px-4 py-3">Session</th>
                      <th className="px-4 py-3">Chatbot</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Duration</th>
                      <th className="px-4 py-3 text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                    {filteredCalls.map((call) => (
                      <tr
                        key={call.id}
                        onClick={() => setSelectedCall(call)}
                        className="cursor-pointer transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/40"
                      >
                        <td className="px-4 py-3.5">
                          <p className="font-medium text-neutral-900 dark:text-neutral-100">
                            {call.callerName}
                          </p>
                          <p className="font-mono text-xs text-neutral-500 tabular-nums dark:text-neutral-400">
                            {call.phoneNumber || 'Website Widget'}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-neutral-600 dark:text-neutral-400">
                          <span className="inline-flex items-center gap-1 capitalize">
                            {call.callDirection === 'inbound' ? (
                              <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <ArrowUpRight className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                            )}
                            {call.callDirection === 'inbound' ? 'Widget' : 'Outbound'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-neutral-700 dark:text-neutral-300">
                          {call.agentName}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                              call.callStatus === 'lead_captured'
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : call.callStatus === 'completed'
                                  ? 'text-indigo-700 dark:text-indigo-400'
                                  : call.callStatus === 'voicemail'
                                    ? 'text-amber-700 dark:text-amber-400'
                                    : 'text-rose-700 dark:text-rose-400'
                            }`}
                          >
                            {call.callStatus === 'lead_captured' ? (
                              <UserPlus className="h-3.5 w-3.5" />
                            ) : call.callStatus === 'completed' ? (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            ) : call.callStatus === 'voicemail' ? (
                              <Globe className="h-3.5 w-3.5" />
                            ) : (
                              <PhoneMissed className="h-3.5 w-3.5" />
                            )}
                            {outcomeLabel(call.callStatus)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono text-xs text-neutral-700 tabular-nums dark:text-neutral-300">
                          {formatDuration(call.durationSeconds)}
                        </td>
                        <td className="px-4 py-3.5 text-right text-xs text-neutral-500 dark:text-neutral-400">
                          {call.timestamp}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {selectedCall && (
            <div
              className="fixed inset-0 z-50 flex justify-end bg-neutral-950/40"
              role="dialog"
              aria-modal="true"
            >
              <div className="flex h-full w-full max-w-md flex-col border-l border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
                <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
                  <div>
                    <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      {selectedCall.callerName}
                    </h2>
                    <p className="text-xs text-neutral-500 tabular-nums dark:text-neutral-400">
                      {selectedCall.phoneNumber || 'Website Widget'} · {selectedCall.timestamp}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCall(null)}
                    aria-label="Close conversation drawer"
                    className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex-1 space-y-5 overflow-y-auto p-5">
                  <div className="grid grid-cols-2 gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3.5 text-xs dark:border-neutral-800 dark:bg-neutral-950">
                    <div>
                      <span className="text-neutral-500 dark:text-neutral-400">Chatbot</span>
                      <p className="mt-0.5 font-medium text-neutral-900 dark:text-neutral-100">
                        {selectedCall.agentName}
                      </p>
                    </div>
                    <div>
                      <span className="text-neutral-500 dark:text-neutral-400">Duration</span>
                      <p className="mt-0.5 flex items-center gap-1 font-mono font-medium text-neutral-900 tabular-nums dark:text-neutral-100">
                        <Clock className="h-3 w-3 text-neutral-400" />
                        {formatDuration(selectedCall.durationSeconds)}
                      </p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      Transcript
                    </h3>
                    <div className="mt-2.5 rounded-lg border border-neutral-200 bg-neutral-50/70 p-3.5 text-sm leading-relaxed whitespace-pre-wrap text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950/60 dark:text-neutral-300">
                      {selectedCall.transcript || 'No transcript recorded for this conversation.'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
    </div>
  );
}
