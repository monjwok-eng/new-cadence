'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Bot,
  Check,
  Code2,
  Copy,
  Mic,
  ScrollText,
  Sparkles,
} from 'lucide-react';
import { useApp } from '@/components/providers/app-provider';

export function DocsView() {
  const { agents } = useApp();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const sampleAgentId = agents[0]?.id || 'your-agent-id';

  const embedSnippet = `<script src="${
    typeof window !== 'undefined' ? window.location.origin : ''
  }/widget.js" data-agent-id="${sampleAgentId}" async></script>`;

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // Clipboard API unavailable
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600">
            <ScrollText className="h-3.5 w-3.5" />
            Documentation
          </div>
          <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Cadence Developer &amp; Setup Docs
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Configure voice chatbots, train knowledge sources, and embed the live widget on any website.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Back to Chatbots
        </Link>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Bot className="h-5 w-5" />
          </div>
          <h2 className="mt-3 text-base font-semibold text-gray-900">
            1. Create a Voice Chatbot
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
            Launch a chatbot from your dashboard, define its persona and greeting, and attach website URLs or files for grounded answers.
          </p>
          <Link
            href="/create-chatbot"
            className="mt-4 inline-block text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            Create a chatbot &rarr;
          </Link>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Mic className="h-5 w-5" />
          </div>
          <h2 className="mt-3 text-base font-semibold text-gray-900">
            2. Test Real-Time Voice
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
            Verify speech recognition, tone, and knowledge-base retrieval in the interactive voice simulator before publishing.
          </p>
          <Link
            href="/voice-test"
            className="mt-4 inline-block text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            Open Voice Test &rarr;
          </Link>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Sparkles className="h-5 w-5" />
          </div>
          <h2 className="mt-3 text-base font-semibold text-gray-900">
            3. Monitor Usage &amp; Leads
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
            Track conversation volume, latency, and qualified leads captured from your embedded web widget and voice endpoints.
          </p>
          <Link
            href="/analytics"
            className="mt-4 inline-block text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            View Usage &rarr;
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Code2 className="h-5 w-5 text-blue-600" />
            <h2 className="text-base font-semibold text-gray-900">
              Quick Website Embed Snippet
            </h2>
          </div>
          <button
            type="button"
            onClick={() => handleCopy('embed', embedSnippet)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            {copiedId === 'embed' ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy snippet
              </>
            )}
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          Paste this script tag before the closing <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">&lt;/body&gt;</code> tag of your site.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-gray-950 p-4 text-xs text-gray-100">
          <code>{embedSnippet}</code>
        </pre>
      </div>
    </div>
  );
}
