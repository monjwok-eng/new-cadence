'use client';

import React, { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useApp } from '@/components/providers/app-provider';
import { VoiceWidgetPopup } from '@/components/embed/voice-widget-popup';
import { Skeleton } from '@/components/ui/skeleton';

export default function StandaloneAgentChatPage() {
  const params = useParams();
  const agentId = params.agentId as string;
  const { isLoading, agents, knowledgeSources } = useApp();

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
        <Skeleton className="h-dvh w-full max-w-2xl bg-neutral-200/75 sm:h-[min(780px,92dvh)] sm:rounded-2xl" />
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

  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-neutral-50 p-0 sm:p-6">
      <div className="h-dvh w-full max-w-2xl overflow-hidden bg-white sm:h-[min(780px,92dvh)] sm:rounded-2xl sm:border sm:border-neutral-200 sm:shadow-[0_12px_36px_-8px_rgba(15,23,42,0.12)]">
        <VoiceWidgetPopup
          widget={{
            id: agent.id,
            name: agent.name,
            businessName: agent.businessName,
            voiceId: agent.voiceId,
            voiceLabel: agent.voiceLabel,
            language: agent.language,
            welcomeMessage:
              agent.welcomeMessage ||
              `Hi! Ask me anything about ${agent.businessName}.`,
            accentColor: agent.accentColor || '#2563eb',
            widgetTheme: 'light',
            launcherLabel: agent.launcherLabel || 'Talk with us',
            leadCaptureEnabled: agent.leadCaptureEnabled ?? true,
            status: agent.status,
          }}
          hostDomain={
            typeof window !== 'undefined' ? window.location.hostname : ''
          }
          sourcePageUrl={agent.websiteUrl || ''}
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
