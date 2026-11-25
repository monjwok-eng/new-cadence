'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  TbArrowRight,
  TbCheck,
  TbCircleCheck,
  TbCopy,
  TbFilePencil,
  TbMessage,
  TbPlayerPause,
  TbPlayerPlay,
  TbPlus,
  TbRobot,
  TbSearch,
  TbWorld,
  TbX,
} from 'react-icons/tb';
import { useApp } from '@/components/providers/app-provider';
import { CadenceOrbLauncherIcon } from '@/components/embed/cadence-orb';
import { FloatingChatbotLauncher } from '@/components/embed/floating-chatbot-launcher';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';

export function OverviewView() {
  const router = useRouter();
  const { isLoading, agents, pushToast } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedAgentId, setCopiedAgentId] = useState<string | null>(null);
  const [tutorialOpen, setTutorialOpen] = useState(false);

  const origin =
    typeof window !== 'undefined' &&
    window.location.hostname &&
    !window.location.hostname.includes('run.app') &&
    !window.location.hostname.includes('localhost')
      ? window.location.origin
      : 'https://cadence-teal-eight.vercel.app';

  const featuredAgent = useMemo(
    () => agents.find((a) => a.status === 'Active') || agents[0] || null,
    [agents]
  );

  const filteredAgents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return agents;
    return agents.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.businessName.toLowerCase().includes(q) ||
        (a.websiteUrl || '').toLowerCase().includes(q)
    );
  }, [agents, searchQuery]);

  const handleCopyEmbed = async (
    e: React.MouseEvent,
    agentId: string,
    agentName: string
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const snippet = `<script type="text/javascript">window.$cadence=[];(function(){var d=document;var s=d.createElement("script");s.src="${origin}/widget/${agentId}.js";s.async=1;d.getElementsByTagName("head")[0].appendChild(s);})();</script>`;
    try {
      await navigator.clipboard.writeText(snippet);
      setCopiedAgentId(agentId);
      pushToast({
        title: 'Embed snippet copied',
        description: `Paste before </body> on your website for ${agentName}.`,
        variant: 'success',
      });
      window.setTimeout(() => {
        setCopiedAgentId((curr) => (curr === agentId ? null : curr));
      }, 2000);
    } catch {
      pushToast({
        title: 'Copy failed',
        description: 'Open the chatbot workspace to copy the embed snippet manually.',
        variant: 'error',
      });
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Chatbots Heading + Quick Tutorial */}
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-3.5">
          <h1 className="font-display text-2xl font-bold tracking-[-0.025em] text-neutral-950 sm:text-[28px]">
            Chatbots
          </h1>
          <button
            type="button"
            onClick={() => setTutorialOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-blue-200/90 bg-white px-3.5 py-1.5 text-[13.5px] font-medium text-blue-600 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-colors duration-150 hover:border-blue-300 hover:bg-blue-50/70 whitespace-nowrap shrink-0"
          >
            <TbPlayerPlay className="h-4 w-4 text-blue-600" />
            Watch Quick Tutorial
          </button>
        </div>

        {/* Full-Width Primary CTA */}
        <Link
          href="/create-chatbot"
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-display text-sm font-semibold tracking-[-0.01em] text-white shadow-xs transition-colors duration-150 hover:bg-blue-700 whitespace-nowrap"
        >
          <TbPlus className="h-4 w-4" />
          Create New Chatbot
        </Link>
      </div>

      {/* Optional Filter Bar when user has multiple chatbots */}
      {!isLoading && agents.length > 3 && (
        <div className="flex items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-xs">
            <TbSearch
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chatbots..."
              className="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-9 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 focus:outline-none"
            />
          </div>
          <span className="font-mono text-xs text-neutral-500 tabular-nums">
            {filteredAgents.length} of {agents.length}
          </span>
        </div>
      )}

      {/* Chatbot Cards Area */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-neutral-200/90 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
            >
              <div className="flex items-start justify-between gap-3">
                <Skeleton className="h-11 w-11 rounded-full" />
                <Skeleton className="h-4 w-14" />
              </div>
              <Skeleton className="mt-4 h-5 w-36" />
              <Skeleton className="mt-2 h-3.5 w-44" />
              <div className="mt-5 flex items-center gap-6 border-t border-neutral-100 pt-4">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-3.5 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : agents.length === 0 ? (
        <p className="pt-2 text-sm text-neutral-500">
          Your chatbots will appear here once created. Click &ldquo;Create New Chatbot&rdquo; above to get started.
        </p>
      ) : filteredAgents.length === 0 ? (
        <EmptyState
          icon={TbRobot}
          title="No chatbots match your search"
          description="Try another chatbot name, business name, or website URL."
          actionLabel="Clear Search"
          onAction={() => setSearchQuery('')}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAgents.map((agent) => {
            const isCopied = copiedAgentId === agent.id;

            return (
              <div
                key={agent.id}
                onClick={() => router.push(`/agents/${agent.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    router.push(`/agents/${agent.id}`);
                  }
                }}
                className="group flex cursor-pointer flex-col justify-between rounded-xl border border-neutral-200/90 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-150 hover:border-blue-300 hover:shadow-[0_6px_18px_-4px_rgba(37,99,235,0.12)]"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <CadenceOrbLauncherIcon className="h-11 w-11 shrink-0" />
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                        agent.status === 'Active'
                          ? 'text-emerald-700'
                          : agent.status === 'Draft'
                            ? 'text-amber-700'
                            : 'text-neutral-500'
                      }`}
                    >
                      {agent.status === 'Active' ? (
                        <TbCircleCheck className="h-3.5 w-3.5" />
                      ) : agent.status === 'Draft' ? (
                        <TbFilePencil className="h-3.5 w-3.5" />
                      ) : (
                        <TbPlayerPause className="h-3.5 w-3.5" />
                      )}
                      {agent.status}
                    </span>
                  </div>

                  <h2 className="mt-4 truncate font-display text-[17px] font-semibold tracking-[-0.015em] text-neutral-950 transition-colors group-hover:text-blue-600">
                    {agent.name}
                  </h2>

                  {(agent.websiteUrl || agent.businessName) && (
                    <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-neutral-500">
                      <TbWorld className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                      <span className="truncate font-mono text-[11.5px]">
                        {agent.websiteUrl || agent.businessName}
                      </span>
                    </p>
                  )}
                </div>

                <div className="mt-5 flex items-center gap-6 border-t border-neutral-100 pt-4">
                  <Link
                    href={`/agents/${agent.id}/chat`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 transition-colors hover:text-blue-600 whitespace-nowrap"
                  >
                    <TbMessage className="h-3.5 w-3.5" />
                    Chat Now
                  </Link>

                  <button
                    type="button"
                    onClick={(e) => handleCopyEmbed(e, agent.id, agent.name)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 transition-colors hover:text-blue-600 whitespace-nowrap"
                  >
                    {isCopied ? (
                      <>
                        <TbCheck className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <TbCopy className="h-3.5 w-3.5" />
                        Copy Embed
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Installed Floating Orb Chatbot Preview */}
      {!isLoading && featuredAgent && (
        <FloatingChatbotLauncher key={featuredAgent.id} agent={featuredAgent} />
      )}

      {/* Quick Tutorial Modal */}
      {tutorialOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/45 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tutorial-dialog-title"
          onClick={() => setTutorialOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-xl border border-neutral-200 bg-white p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="tutorial-dialog-title"
                  className="font-display text-lg font-semibold tracking-[-0.015em] text-neutral-950"
                >
                  Quick Start: Launch Your Voice Chatbot
                </h2>
                <p className="mt-1 text-xs text-neutral-500">
                  Go from setup to a live website voice assistant in three steps.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTutorialOpen(false)}
                aria-label="Close tutorial"
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
              >
                <TbX className="h-4 w-4" />
              </button>
            </div>

            <ol className="mt-5 space-y-4">
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 font-mono text-xs font-semibold text-blue-600">
                  1
                </span>
                <div>
                  <p className="text-sm font-medium text-neutral-900">
                    Create a dedicated chatbot
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    Enter your business website URL, system instructions, and preferred voice profile on the Create Chatbot page.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 font-mono text-xs font-semibold text-blue-600">
                  2
                </span>
                <div>
                  <p className="text-sm font-medium text-neutral-900">
                    Train &amp; test inside its workspace
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    Click any chatbot card to open its dedicated workspace for Voice Playground, Knowledge Base, and Chat History &amp; Leads.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 font-mono text-xs font-semibold text-blue-600">
                  3
                </span>
                <div>
                  <p className="text-sm font-medium text-neutral-900">
                    Embed on your website
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    Use Copy Embed on your chatbot card and paste the script before your site&apos;s closing &lt;/body&gt; tag.
                  </p>
                </div>
              </li>
            </ol>

            <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-neutral-200 pt-4">
              <button
                type="button"
                onClick={() => setTutorialOpen(false)}
                className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Close
              </button>
              <Link
                href="/create-chatbot"
                onClick={() => setTutorialOpen(false)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Create New Chatbot
                <TbArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
