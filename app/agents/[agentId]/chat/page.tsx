'use client';

import React, { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useApp } from '@/components/providers/app-provider';
import { ChatbotPanel } from '@/components/embed/chatbot-panel';
import { Skeleton } from '@/components/ui/skeleton';

export default function StandaloneAgentChatPage() {
  const params = useParams();
  const agentId = params.agentId as string;
  const { isLoading, agents, knowledgeSources } = useApp();
  const [expanded, setExpanded] = useState(false);

  const agent = useMemo(
    () => agents.find((a) => a.id === agentId) || null,
    [agents, agentId]
  );

  const knowledgeItems = useMemo(
    () =>
      knowledgeSources
        .filter(
          (s) =>
            (s.agentId === agentId || s.agentId === 'all' || !s.agentId) &&
            typeof s.content === 'string' &&
            s.content.trim().length > 0
        )
        .map((s) => ({
          sourceName: s.sourceName,
          sourceType: s.sourceType,
          content: s.content || '',
        })),
    [knowledgeSources, agentId]
  );

  if (isLoading) {
    return (
      <div className="flex min-h-dvh w-full items-center justify-center bg-neutral-50 p-0 sm:p-6">
        <Skeleton className="h-dvh w-full max-w-[440px] bg-neutral-200/75 sm:h-[85dvh] sm:rounded-2xl" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex min-h-dvh w-full items-center justify-center bg-neutral-50 p-6 text-center">
        <div className="max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs">
          <h1 className="font-display text-lg font-semibold text-neutral-950">
            Chatbot not found
          </h1>
          <p className="mt-1.5 text-sm text-neutral-500">
            This chatbot may have been removed or belongs to a different account.
          </p>
        </div>
      </div>
    );
  }

  const wc = agent.widgetConfig;
  const isDark = Boolean(wc?.enableDarkMode || agent.widgetTheme === 'dark');
  const heightPercent =
    typeof wc?.height === 'number' && Number.isFinite(wc.height) && wc.height > 0
      ? Math.min(94, Math.max(40, wc.height))
      : 85;

  return (
    <div
      className={`flex min-h-dvh w-full items-center justify-center p-0 sm:p-6 ${
        isDark ? 'bg-gray-950' : 'bg-neutral-50'
      }`}
    >
      <div
        style={{
          '--chat-h': expanded ? '92dvh' : `${heightPercent}dvh`,
        } as React.CSSProperties}
        className={`h-dvh w-full overflow-hidden transition-[max-width,height] duration-200 sm:h-[var(--chat-h)] sm:rounded-2xl sm:border sm:shadow-[0_12px_36px_-8px_rgba(15,23,42,0.12)] ${
          expanded ? 'sm:max-w-2xl' : 'sm:max-w-[440px]'
        } ${
          isDark
            ? 'border-gray-800 bg-gray-900'
            : 'border-gray-200 bg-white'
        }`}
      >
        <ChatbotPanel
          agent={{
            id: agent.id,
            name: agent.name,
            businessName: agent.businessName,
            welcomeMessage:
              agent.welcomeMessage || 'Hello! How can I assist you today?',
            accentColor: agent.accentColor || '#000000',
            widgetTheme: agent.widgetTheme,
            status: agent.status,
            widgetConfig: agent.widgetConfig,
          }}
          hostDomain={
            typeof window !== 'undefined' ? window.location.hostname : ''
          }
          sourcePageUrl={agent.websiteUrl || ''}
          expanded={expanded}
          onToggleExpand={() => setExpanded((prev) => !prev)}
          fallbackInteractContext={{
            agentConfig: {
              name: agent.name,
              businessName: agent.businessName,
              personality: agent.personality,
              customInstructions: agent.customInstructions,
              language: agent.language,
              websiteUrl: agent.websiteUrl,
            },
            knowledgeItems,
          }}
        />
      </div>
    </div>
  );
}
