'use client';

import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { useApp } from '@/components/providers/app-provider';
import { CadenceOrbLauncherIcon } from '@/components/embed/cadence-orb';
import { VoiceWidgetPopup } from '@/components/embed/voice-widget-popup';
import { VoiceAgent } from '@/lib/types';

export function FloatingChatbotLauncher({ agent }: { agent: VoiceAgent }) {
  const { knowledgeSources } = useApp();
  const [open, setOpen] = useState(false);

  const relevantKnowledgeItems = useMemo(
    () =>
      knowledgeSources
        .filter(
          (s) =>
            (s.agentId === agent.id || s.agentId === 'all' || !s.agentId) &&
            typeof s.content === 'string' &&
            s.content.trim().length > 0
        )
        .map((s) => ({
          sourceName: s.sourceName,
          sourceType: s.sourceType,
          content: s.content || '',
        })),
    [knowledgeSources, agent.id]
  );

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key={`chatbot-popup-${agent.id}`}
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            role="dialog"
            aria-label={`${agent.name} chatbot`}
            className="fixed bottom-20 right-4 z-40 h-[540px] max-h-[calc(100vh-6.5rem)] w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-[0_24px_56px_-12px_rgba(15,23,42,0.22)] sm:right-5 sm:w-[390px]"
          >
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
              sourcePageUrl={
                typeof window !== 'undefined' ? window.location.href : ''
              }
              onClose={() => setOpen(false)}
              fallbackInteractContext={{
                agentConfig: {
                  name: agent.name,
                  businessName: agent.businessName,
                  personality: agent.personality,
                  customInstructions: agent.customInstructions,
                  language: agent.language,
                  websiteUrl: agent.websiteUrl,
                },
                knowledgeItems: relevantKnowledgeItems,
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom-Right Glowing Orb Launcher */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label={open ? `Close ${agent.name}` : `Open ${agent.name}`}
        title={open ? `Close ${agent.name}` : `Chat with ${agent.name}`}
        className="group fixed bottom-5 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full transition-transform duration-150 hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 sm:right-5"
      >
        {open ? (
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-neutral-200 bg-neutral-900 text-white shadow-lg transition-colors group-hover:bg-neutral-800">
            <X className="h-5 w-5" strokeWidth={2} />
          </span>
        ) : (
          <span className="relative flex h-12 w-12 items-center justify-center">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -inset-1 rounded-full bg-sky-400/25 blur-md transition-opacity duration-200 group-hover:bg-sky-400/40"
            />
            <CadenceOrbLauncherIcon className="relative h-12 w-12" />
          </span>
        )}
      </button>
    </>
  );
}
