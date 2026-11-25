'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Check,
  CirclePlay,
  Copy,
  ExternalLink,
  Plus,
  X,
} from 'lucide-react';
import { useApp } from '@/components/providers/app-provider';
import { CadenceBotFaceIcon } from '@/components/embed/cadence-bot-icon';
import { FloatingChatbotLauncher } from '@/components/embed/floating-chatbot-launcher';
import { Skeleton } from '@/components/ui/skeleton';

export function OverviewView() {
  const router = useRouter();
  const { isLoading, agents, pushToast } = useApp();
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
    <div className="space-y-8 pb-16">
      {/* Header Row — Exact layout, font sizes, and colors from reference */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-bold tracking-tight text-gray-900">
            Chatbots
          </h1>
          <button
            type="button"
            onClick={() => setTutorialOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-100 whitespace-nowrap shrink-0"
          >
            <CirclePlay className="h-4 w-4 shrink-0" />
            Watch Video Tutorial
          </button>
        </div>

        <Link
          href="/create-chatbot"
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:w-auto whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4 shrink-0" />
          Create New Chatbot
        </Link>
      </div>

      {/* Horizontal Chatbot Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white px-6 py-5"
            >
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="h-5 w-28" />
              </div>
              <div className="flex items-center gap-5">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : agents.length === 0 ? null : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {agents.map((agent) => {
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
                className="group flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white px-6 py-5 shadow-2xs transition-all duration-150 hover:border-gray-300 hover:shadow-sm cursor-pointer sm:flex-nowrap"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                    <CadenceBotFaceIcon
                      className="h-7 w-7 text-white"
                      eyeStroke="#2563eb"
                    />
                  </span>
                  <h2 className="truncate font-display text-base font-bold text-gray-900 transition-colors group-hover:text-blue-600">
                    {agent.name}
                  </h2>
                </div>

                <div className="flex shrink-0 items-center gap-5">
                  <Link
                    href={`/agents/${agent.id}/chat`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 whitespace-nowrap"
                  >
                    <ExternalLink className="h-4 w-4 text-gray-500" />
                    Chat Now
                  </Link>

                  <button
                    type="button"
                    onClick={(e) => handleCopyEmbed(e, agent.id, agent.name)}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 whitespace-nowrap"
                  >
                    {isCopied ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-600" />
                        <span className="text-emerald-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 text-gray-500" />
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

      {/* Floating Bottom-Right Chatbot Launcher */}
      {!isLoading && featuredAgent && (
        <FloatingChatbotLauncher
          key={featuredAgent.id}
          agent={featuredAgent}
          variant="dark"
        />
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
            className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="tutorial-dialog-title"
                  className="font-display text-lg font-semibold text-gray-950"
                >
                  Quick Start: Launch Your Voice Chatbot
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  Go from setup to a live website voice assistant in three steps.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTutorialOpen(false)}
                aria-label="Close tutorial"
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <ol className="mt-5 space-y-4">
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 font-mono text-xs font-semibold text-blue-600">
                  1
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Create a dedicated chatbot
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Enter your business website URL, system instructions, and preferred voice profile on the Create Chatbot page.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 font-mono text-xs font-semibold text-blue-600">
                  2
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Train &amp; test inside its workspace
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Click any chatbot card to open its workspace for Voice Playground, Knowledge Base, and Chat History &amp; Leads.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 font-mono text-xs font-semibold text-blue-600">
                  3
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Embed on your website
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Use Copy Embed on your chatbot card and paste the script before your site&apos;s closing &lt;/body&gt; tag.
                  </p>
                </div>
              </li>
            </ol>

            <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-gray-200 pt-4">
              <button
                type="button"
                onClick={() => setTutorialOpen(false)}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <Link
                href="/create-chatbot"
                onClick={() => setTutorialOpen(false)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Create New Chatbot
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
