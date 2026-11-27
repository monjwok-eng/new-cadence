'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Globe, Link2, Sparkles, Webhook, ChevronRight } from 'lucide-react';
import { BrandMark } from '@/components/ui/brand-loader';

interface OnboardingCrawlProgressProps {
  websiteUrl?: string;
  agentRole?: string;
  onComplete: () => void;
}

export function OnboardingCrawlProgress({
  websiteUrl,
  agentRole = 'Customer support',
  onComplete,
}: OnboardingCrawlProgressProps) {
  const [crawlStep, setCrawlStep] = useState<number>(0);
  const [isDone, setIsDone] = useState(false);

  const cleanDomain = websiteUrl?.trim()
    ? websiteUrl
        .trim()
        .replace(/^https?:\/\//i, '')
        .replace(/\/+$/, '')
        : 'yourwebsite.com';

  const steps = [
    { label: 'Extracting branding & site metadata...', sub: `Analyzing ${cleanDomain}` },
    { label: 'Connecting to API & knowledge base...', sub: 'Establishing secure vector connection' },
    { label: 'Crawling website pages & FAQs...', sub: 'Indexing readable text & document chunks' },
    { label: 'AI Agent blueprint ready!', sub: 'Successfully connected and verified' },
  ];

  useEffect(() => {
    const timer1 = setTimeout(() => setCrawlStep(1), 1100);
    const timer2 = setTimeout(() => setCrawlStep(2), 2600);
    const timer3 = setTimeout(() => {
      setCrawlStep(3);
      setIsDone(true);
    }, 4000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white px-6 text-[#14110f] antialiased">
      {/* Subtle background grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden opacity-40"
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, #e5e2dc 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-lg text-center space-y-8">
        {/* Brand Icon Badge */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50 shadow-sm">
          <BrandMark className="h-8 w-9 text-[#14110f]" />
        </div>

        {/* Main Heading matching screenshot 1 */}
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-normal tracking-tight text-neutral-900 font-serif">
            Cadence will help you build a customer experience agent for{' '}
            <span className="inline-flex items-center gap-1.5 font-medium text-blue-600">
              <Globe className="h-5 w-5" />
              {cleanDomain}
            </span>
            .
          </h1>
          <p className="text-sm font-light text-neutral-500 animate-pulse">
            {steps[crawlStep]?.label || 'Processing...'}
          </p>
        </div>

        {/* Connecting to API Card matching screenshot 2 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0_12px_36px_rgba(0,0,0,0.06)]"
        >
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-4">
            <span>Connecting to API</span>
            <span className="flex items-center gap-1.5 text-emerald-600 font-medium normal-case">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              {isDone ? 'Connected' : 'Syncing...'}
            </span>
          </div>

          <div className="flex items-center justify-center gap-6 py-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-900 text-white font-bold text-lg shadow-md">
              C
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-neutral-300 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="h-2 w-2 rounded-full bg-neutral-300 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="h-2 w-2 rounded-full bg-neutral-300 animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="h-2 w-2 rounded-full bg-neutral-300 animate-bounce" style={{ animationDelay: '450ms' }} />
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-lg shadow-md">
              {cleanDomain.slice(0, 2).toUpperCase()}
            </div>
          </div>

          <p className="text-xs text-neutral-500 mt-2">
            {steps[crawlStep]?.sub || 'Crawling website pages & vector embeddings'}
          </p>
        </motion.div>

        {/* Sources List matching screenshot 3 */}
        {crawlStep >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="rounded-2xl border border-neutral-200 bg-white p-5 text-left shadow-sm space-y-3"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Sources indexed
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2 text-xs">
                <span className="flex items-center gap-2 font-medium text-neutral-800 truncate">
                  <Link2 className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                  https://{cleanDomain}
                </span>
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <Check className="h-3.5 w-3.5" />
                  Crawled
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2 text-xs">
                <span className="flex items-center gap-2 font-medium text-neutral-800 truncate">
                  <Webhook className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  {agentRole} Knowledge Base &amp; FAQs
                </span>
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <Check className="h-3.5 w-3.5" />
                  Synced
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Continue Button */}
        <div className="pt-2">
          <button
            type="button"
            disabled={!isDone}
            onClick={onComplete}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#171717] px-6 text-sm font-medium text-white shadow-lg transition-all hover:bg-neutral-800 disabled:opacity-45 disabled:cursor-not-allowed"
          >
            <span>{isDone ? 'Continue to workspace' : 'Crawling & Indexing...'}</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
