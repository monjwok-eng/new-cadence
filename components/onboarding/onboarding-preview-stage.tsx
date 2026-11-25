'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Check,
  ChevronRight,
  Cpu,
  Globe,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  User,
  Webhook,
} from 'lucide-react';
import { BrandMark } from '@/components/ui/brand-loader';

interface OnboardingPreviewStageProps {
  step: number;
  isFullStage?: boolean;
  userName?: string;
  userEmail?: string;
  companySize?: string;
  websiteUrl?: string;
  otherSourceSummary?: string;
  agentRole?: string;
  instructions?: string;
  techStack?: string[];
  deployChannels?: string[];
  onContinueToPricing?: () => void;
  onBackToEdit?: () => void;
}

export function OnboardingPreviewStage({
  step,
  isFullStage = false,
  userName = 'Account Owner',
  userEmail = 'you@company.com',
  companySize,
  websiteUrl,
  otherSourceSummary,
  agentRole = 'Customer support',
  instructions,
  techStack = [],
  deployChannels = [],
  onContinueToPricing,
  onBackToEdit,
}: OnboardingPreviewStageProps) {
  const [liked, setLiked] = useState<'up' | 'down' | null>(null);

  const cleanDomain = websiteUrl?.trim()
    ? websiteUrl
        .trim()
        .replace(/^https?:\/\//i, '')
        .replace(/\/+$/, '')
    : 'yourwebsite.com';

  const activeInstructions =
    instructions?.trim() ||
    'Answer customer questions clearly and concisely. Stay polite and professional. Escalate billing or account issues to a human agent when unsure.';

  const activeTechLabel =
    techStack.length > 0 ? techStack.slice(0, 3).join(', ') : 'CRM & Actions API';

  const activeChannelLabel =
    deployChannels.length > 0 ? deployChannels.slice(0, 2).join(' · ') : 'Chat Bubble · Voice';

  return (
    <div
      className={`relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-[#F5F5F4] ${
        isFullStage ? 'min-h-screen w-full px-6 py-12' : 'h-full w-full px-6 py-10'
      }`}
    >
      {/* Subtle Geometric Rotated-Diamond Backdrop Pattern */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.45]"
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, #d4d4d4 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="absolute -top-16 -left-16 h-64 w-64 rotate-45 rounded-3xl border border-neutral-300/60 bg-white/30" />
        <div className="absolute -bottom-20 -right-20 h-72 w-72 rotate-45 rounded-3xl border border-neutral-300/60 bg-white/30" />
      </div>

      {/* Top Bar when Full Stage */}
      {isFullStage && (
        <div className="fixed inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-5 sm:px-10">
          <div className="flex items-center gap-2 text-neutral-900">
            <BrandMark className="h-6 w-7 text-neutral-900" />
            <span className="font-display text-lg font-bold tracking-tight">
              Cadence
            </span>
          </div>
          {onBackToEdit && (
            <button
              type="button"
              onClick={onBackToEdit}
              className="rounded-lg border border-neutral-300 bg-white px-3.5 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
            >
              Back to setup
            </button>
          )}
        </div>
      )}

      {/* Stage Heading (Full Stage) */}
      {isFullStage && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative z-10 mb-8 text-center"
        >
          <p className="font-mono text-xs uppercase tracking-widest text-[#F94C1F]">
            Workspace Provisioned
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
            Your AI Agent blueprint is ready
          </h1>
          <p className="mt-1.5 text-sm text-neutral-500">
            Trained on <span className="font-medium text-neutral-800">{cleanDomain}</span> ·{' '}
            {agentRole} · {activeChannelLabel}
          </p>
        </motion.div>
      )}

      {/* Main 3-Column Visual Stage (Left Cards · Center Phone · Right Cards) */}
      <div className="relative z-10 flex w-full max-w-[980px] items-center justify-center gap-6 xl:gap-10">
        {/* Left Floating Stack */}
        <div className="hidden w-[250px] shrink-0 flex-col gap-4 xl:flex">
          {/* Card 1: Model & instructions */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,0.05)]"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-100 text-neutral-800">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
                <span className="text-xs font-semibold text-neutral-900">
                  Model &amp; instructions
                </span>
              </div>
              <span className="rounded-[4px] bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                {agentRole}
              </span>
            </div>
            <p className="mt-3 line-clamp-3 text-[11.5px] leading-relaxed text-neutral-500">
              {activeInstructions}
            </p>
            <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-2.5 text-[11px] text-neutral-500">
              <span className="flex items-center gap-1.5">
                <Cpu className="h-3 w-3 text-neutral-400" />
                Cadence Voice + Chat
              </span>
              <span className="font-mono text-[10px] text-neutral-400">Step {Math.min(step, 6)}/6</span>
            </div>
          </motion.div>

          {/* Card 2: Sources */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.12 }}
            className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,0.05)]"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Globe className="h-3.5 w-3.5" />
              </span>
              <span className="text-xs font-semibold text-neutral-900">Sources</span>
            </div>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50/70 px-2.5 py-2">
                <span className="truncate text-[11.5px] font-medium text-neutral-800">
                  {cleanDomain}
                </span>
                <span className="ml-2 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <Check className="h-2.5 w-2.5" />
                </span>
              </div>
              {otherSourceSummary?.trim() && (
                <div className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50/70 px-2.5 py-1.5">
                  <span className="truncate text-[11px] text-neutral-600">
                    Custom knowledge notes
                  </span>
                  <span className="text-[10px] font-medium text-emerald-700">Added</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Center Phone Mockup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[330px] rounded-[34px] border-[7px] border-[#171717] bg-white p-3.5 shadow-[0_24px_64px_rgba(15,23,42,0.14)]"
        >
          {/* Phone Notch */}
          <div className="mx-auto mb-3 h-4 w-24 rounded-full bg-[#171717]" />

          {/* Agent Header */}
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#171717] text-white">
                <BrandMark className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-neutral-900">
                  Cadence AI Agent
                </p>
                <p className="truncate text-[10.5px] text-emerald-600">
                  Online · {cleanDomain}
                </p>
              </div>
            </div>
            <span className="rounded-[4px] bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-600">
              Live
            </span>
          </div>

          {/* Chat Thread */}
          <div className="my-4 space-y-3 text-[12px]">
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="max-w-[88%] rounded-2xl rounded-tl-xs bg-neutral-100 px-3.5 py-2.5 leading-relaxed text-neutral-800"
            >
              Hi! Ask me anything about <span className="font-medium">{cleanDomain}</span> — or tap to speak live.
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.25 }}
              className="ml-auto max-w-[84%] rounded-2xl rounded-tr-xs bg-[#171717] px-3.5 py-2.5 leading-relaxed text-white"
            >
              How quickly can our team launch on {cleanDomain}?
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="space-y-1.5"
            >
              <div className="max-w-[90%] rounded-2xl rounded-tl-xs bg-neutral-100 px-3.5 py-2.5 leading-relaxed text-neutral-800">
                Your agent is indexed on your site and configured for{' '}
                <span className="font-medium">{agentRole.toLowerCase()}</span>. Paste one line of embed code or connect{' '}
                <span className="font-medium">{activeChannelLabel}</span>.
              </div>

              <div className="flex items-center justify-between px-1 text-[10.5px] text-neutral-400">
                <span>Just now</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    aria-label="Helpful response"
                    onClick={() => setLiked('up')}
                    className={`rounded p-1 transition-colors ${
                      liked === 'up'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'hover:bg-neutral-100 hover:text-neutral-700'
                    }`}
                  >
                    <ThumbsUp className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    aria-label="Needs improvement"
                    onClick={() => setLiked('down')}
                    className={`rounded p-1 transition-colors ${
                      liked === 'down'
                        ? 'bg-rose-50 text-rose-600'
                        : 'hover:bg-neutral-100 hover:text-neutral-700'
                    }`}
                  >
                    <ThumbsDown className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Input Bar */}
          <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-[11.5px] text-neutral-400">
            <span>Ask a question...</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#171717] text-white">
              <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </motion.div>

        {/* Right Floating Stack */}
        <div className="hidden w-[250px] shrink-0 flex-col gap-4 xl:flex">
          {/* Card 3: User information */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.16 }}
            className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,0.05)]"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-100 text-neutral-800">
                <User className="h-3.5 w-3.5" />
              </span>
              <span className="text-xs font-semibold text-neutral-900">
                User information
              </span>
            </div>
            <div className="mt-3 space-y-2 text-[11.5px]">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Owner</span>
                <span className="max-w-[140px] truncate font-medium text-neutral-800">
                  {userName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Email</span>
                <span className="max-w-[140px] truncate font-medium text-neutral-800">
                  {userEmail}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Team</span>
                <span className="max-w-[140px] truncate font-medium text-neutral-800">
                  {companySize || 'Configuring...'}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Card 4: Connecting to API / Tech Stack */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.22 }}
            className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,0.05)]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <Webhook className="h-3.5 w-3.5" />
                </span>
                <span className="text-xs font-semibold text-neutral-900">
                  Connecting to API
                </span>
              </div>
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
            </div>
            <p className="mt-2.5 truncate text-[11.5px] text-neutral-500">
              {activeTechLabel}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(deployChannels.length > 0 ? deployChannels.slice(0, 3) : ['Chat Bubble', 'Voice']).map(
                (channel) => (
                  <span
                    key={channel}
                    className="rounded-[4px] border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[10.5px] font-medium text-neutral-700"
                  >
                    {channel}
                  </span>
                )
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Floating Continue Button on Full Stage */}
      {isFullStage && onContinueToPricing && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="fixed right-6 bottom-6 z-30"
        >
          <button
            type="button"
            onClick={onContinueToPricing}
            data-testid="preview-continue"
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#171717] px-5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
          >
            <span>Continue</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </div>
  );
}
