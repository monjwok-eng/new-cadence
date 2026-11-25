'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3 } from 'lucide-react';
import { useApp } from '@/components/providers/app-provider';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';

type RangeKey = '7d' | '30d' | '90d';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

export function AnalyticsView() {
  const router = useRouter();
  const { isReady, agents, calls, leads, activeWorkspace } = useApp();
  const [range, setRange] = useState<RangeKey>('7d');
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  const totalConversations = calls.length;
  const totalLeads = Math.max(
    leads.length,
    calls.filter((c) => c.callStatus === 'lead_captured').length
  );
  const resolvedConversations = calls.filter(
    (c) => c.callStatus === 'completed' || c.callStatus === 'lead_captured'
  ).length;
  const totalDurationSec = calls.reduce((acc, c) => acc + c.durationSeconds, 0);
  const avgDurationSec = totalConversations > 0 ? Math.round(totalDurationSec / totalConversations) : 0;
  const resolutionPct =
    totalConversations > 0 ? ((resolvedConversations / totalConversations) * 100).toFixed(1) : '0.0';

  const dailyBuckets = useMemo(() => {
    const map = new Map<string, { day: string; calls: number; leads: number }>();
    WEEKDAYS.forEach((day) => map.set(day, { day, calls: 0, leads: 0 }));

    calls.forEach((c, idx) => {
      const parsed = Date.parse(c.timestamp);
      const dayIndex = Number.isNaN(parsed)
        ? idx % 7
        : (new Date(parsed).getDay() + 6) % 7;
      const key = WEEKDAYS[dayIndex];
      const bucket = map.get(key);
      if (bucket) {
        bucket.calls += 1;
        if (c.callStatus === 'lead_captured') bucket.leads += 1;
      }
    });

    return WEEKDAYS.map((d) => map.get(d)!);
  }, [calls]);

  const maxConversations = Math.max(1, ...dailyBuckets.map((d) => d.calls));

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 border-b border-neutral-200 pb-6 sm:flex-row sm:items-end dark:border-neutral-800">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            Analytics
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Voice chatbot conversations and website lead capture metrics for {activeWorkspace?.name || 'your workspace'}.
          </p>
        </div>

        <div className="inline-flex items-center gap-1 self-start rounded-lg border border-neutral-200 bg-neutral-100/70 p-1 dark:border-neutral-800 dark:bg-neutral-900">
          {(['7d', '30d', '90d'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                range === r
                  ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-800 dark:text-neutral-100'
                  : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'
              }`}
            >
              Last {r}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Strip */}
      {!isReady ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="mt-3 h-7 w-16" />
              <Skeleton className="mt-2 h-3 w-28" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
              Conversations ({range})
            </p>
            <p className="mt-2 text-2xl font-semibold text-neutral-900 tabular-nums dark:text-neutral-100">
              {totalConversations.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              {totalConversations === 0 ? 'No conversations logged yet' : 'Logged in Firestore'}
            </p>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
              Leads Captured
            </p>
            <p className="mt-2 text-2xl font-semibold text-neutral-900 tabular-nums dark:text-neutral-100">
              {totalLeads.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-neutral-500 tabular-nums dark:text-neutral-400">
              {totalConversations > 0 ? ((totalLeads / totalConversations) * 100).toFixed(1) : '0.0'}% lead conversion
            </p>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
              Avg Session Duration
            </p>
            <p className="mt-2 text-2xl font-semibold text-neutral-900 tabular-nums dark:text-neutral-100">
              {formatDuration(avgDurationSec)}
            </p>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              Across workspace conversations
            </p>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
              Resolution Rate
            </p>
            <p className="mt-2 text-2xl font-semibold text-neutral-900 tabular-nums dark:text-neutral-100">
              {resolutionPct}%
            </p>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              Completed + lead captured
            </p>
          </div>
        </div>
      )}

      {/* Daily Chart */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Daily Conversations &amp; Leads Captured
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Computed directly from workspace conversation logs
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-neutral-600 dark:text-neutral-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-xs bg-indigo-600 dark:bg-indigo-500" />
              Conversations
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-xs bg-emerald-500" />
              Leads Captured
            </span>
          </div>
        </div>

        {calls.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              icon={BarChart3}
              title="No conversation telemetry to chart yet"
              description="Metrics remain at 0 until visitors or team tests run voice conversations. Create a voice chatbot and add your website URL to prepare."
              actionLabel={agents.length === 0 ? 'Create Chatbot' : undefined}
              onAction={agents.length === 0 ? () => router.push('/create-chatbot') : undefined}
            />
          </div>
        ) : (
          <div className="mt-8 grid h-56 grid-cols-7 items-end gap-3 sm:gap-6">
            {dailyBuckets.map((d) => {
              const callsHeight =
                d.calls > 0 ? Math.max(12, Math.round((d.calls / maxConversations) * 100)) : 4;
              const leadsHeight =
                d.leads > 0 ? Math.max(8, Math.round((d.leads / maxConversations) * 100)) : 0;
              const isHovered = hoveredDay === d.day;

              return (
                <div
                  key={d.day}
                  onMouseEnter={() => setHoveredDay(d.day)}
                  onMouseLeave={() => setHoveredDay(null)}
                  className="relative flex h-full flex-col items-center justify-end gap-2"
                >
                  {isHovered && (
                    <div className="absolute -top-11 z-10 whitespace-nowrap rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-[11px] shadow-md dark:border-neutral-700 dark:bg-neutral-800">
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {d.calls} chats
                      </span>{' '}
                      ·{' '}
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {d.leads} leads
                      </span>
                    </div>
                  )}

                  <div className="flex h-full w-full max-w-[44px] items-end justify-center gap-1">
                    <div
                      className="w-1/2 rounded-t-md bg-indigo-600 transition-all dark:bg-indigo-500"
                      style={{ height: `${callsHeight}%` }}
                    />
                    {leadsHeight > 0 && (
                      <div
                        className="w-1/2 rounded-t-md bg-emerald-500 transition-all"
                        style={{ height: `${leadsHeight}%` }}
                      />
                    )}
                  </div>
                  <span className="font-mono text-[11px] text-neutral-500 tabular-nums dark:text-neutral-400">
                    {d.day}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Chatbot Breakdown Table */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="border-b border-neutral-200 px-5 py-3.5 dark:border-neutral-800">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Performance by Voice Chatbot
          </h2>
        </div>
        {agents.length === 0 ? (
          <div className="p-6 text-center text-xs text-neutral-500 dark:text-neutral-400">
            No voice chatbots configured in this workspace yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/70 text-xs font-medium text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950/40 dark:text-neutral-400">
                  <th className="px-4 py-3">Chatbot</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Conversations</th>
                  <th className="px-4 py-3 text-right">Leads</th>
                  <th className="px-4 py-3 text-right">Conversion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {agents.map((agent) => {
                  const conv =
                    agent.callsCount > 0
                      ? ((agent.leadsCaptured / agent.callsCount) * 100).toFixed(1)
                      : '0.0';
                  return (
                    <tr key={agent.id}>
                      <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">
                        {agent.name}
                      </td>
                      <td className="px-4 py-3 text-xs text-neutral-600 dark:text-neutral-400">
                        {agent.status}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs tabular-nums">
                        {agent.callsCount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs tabular-nums">
                        {agent.leadsCaptured.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs tabular-nums">
                        {conv}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
