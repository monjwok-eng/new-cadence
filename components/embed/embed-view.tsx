'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  TbCheck,
  TbCode,
  TbCopy,
  TbPlayerPlay,
  TbX,
} from 'react-icons/tb';
import { useApp } from '@/components/providers/app-provider';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { VoiceAgent } from '@/lib/types';

export function EmbedView({
  scopedAgentId,
  embedded = false,
}: {
  scopedAgentId?: string;
  embedded?: boolean;
} = {}) {
  const router = useRouter();
  const { isLoading, agents } = useApp();
  const [selectedId, setSelectedId] = useState<string>(scopedAgentId || '');
  const [tutorialOpen, setTutorialOpen] = useState(false);

  const effectiveId = scopedAgentId || selectedId;
  const selectedAgent = useMemo(
    () => agents.find((a) => a.id === effectiveId) || agents[0] || null,
    [agents, effectiveId]
  );

  if (isLoading) {
    return (
      <div className="space-y-5 pb-14">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-44 rounded-xl" />
        </div>
        <div className="rounded-2xl border border-blue-100 bg-[#f4f7ff] p-6 space-y-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-full max-w-md" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
        <div className="rounded-2xl border border-blue-100 bg-[#f4f7ff] p-6 space-y-4">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-full max-w-lg" />
          <Skeleton className="h-52 w-full rounded-xl bg-white" />
        </div>
      </div>
    );
  }

  if (agents.length === 0 || !selectedAgent) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-display text-2xl font-bold tracking-[-0.025em] text-neutral-950 sm:text-[28px]">
            Installation
          </h1>
        </div>

        <EmptyState
          icon={TbCode}
          title="No voice chatbots to install yet"
          description="Create your first website voice chatbot first, then copy its Chatbot ID and embed snippets here."
          actionLabel="Create Chatbot"
          onAction={() => router.push('/create-chatbot')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-16">
      {/* Top Header Row matching Installation design */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold tracking-[-0.025em] text-neutral-950 sm:text-[28px]">
          Installation
        </h1>

        <div className="flex items-center gap-3">
          {!embedded && agents.length > 1 && (
            <select
              id="embed-agent-select"
              aria-label="Select chatbot"
              value={selectedAgent.id}
              onChange={(e) => setSelectedId(e.target.value)}
              className="min-h-[40px] rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-900 focus:border-blue-500 focus:outline-none"
            >
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.businessName})
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={() => setTutorialOpen(true)}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-blue-500/80 bg-white px-3.5 py-2 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-50 whitespace-nowrap shrink-0"
          >
            <TbPlayerPlay className="h-4 w-4 shrink-0 text-blue-600" />
            Watch Video Tutorial
          </button>
        </div>
      </div>

      <EmbedEditor
        key={selectedAgent.id}
        selectedAgent={selectedAgent}
        tutorialOpen={tutorialOpen}
        onCloseTutorial={() => setTutorialOpen(false)}
      />
    </div>
  );
}

function EmbedEditor({
  selectedAgent,
  tutorialOpen,
  onCloseTutorial,
}: {
  selectedAgent: VoiceAgent;
  tutorialOpen: boolean;
  onCloseTutorial: () => void;
}) {
  const { pushToast } = useApp();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const origin =
    typeof window !== 'undefined' &&
    window.location.hostname &&
    !window.location.hostname.includes('run.app') &&
    !window.location.hostname.includes('localhost')
      ? window.location.origin
      : 'https://cadence-teal-eight.vercel.app';

  const id = selectedAgent.id || 'your_chatbot_id';

  const embedMethods = useMemo(
    () => [
      {
        key: 'javascript',
        title: 'JavaScript Embed',
        recommended: true,
        description:
          'Best for most websites. Automatically positions the chatbot and works on all pages.',
        code: `<script type="text/javascript">window.$cadence=[];(function(){var d=document;var s=d.createElement("script");s.src="${origin}/widget/${id}.js";s.async=1;d.getElementsByTagName("head")[0].appendChild(s);})();</script>`,
      },
      {
        key: 'nextjs',
        title: 'Next.js & React Embed',
        recommended: false,
        description:
          'Add directly inside your root layout or component using Next.js Script.',
        code: `import Script from 'next/script';\n\nexport function CadenceWidget() {\n  return <Script src="${origin}/widget/${id}.js" strategy="afterInteractive" />;\n}`,
      },
      {
        key: 'script-attr',
        title: 'WordPress & Universal Script',
        recommended: false,
        description:
          'Use with WPCode, Shopify theme.liquid, Webflow, or any CMS custom footer script.',
        code: `<script src="${origin}/widget.js" data-chatbot-id="${id}" async></script>`,
      },
    ],
    [id, origin]
  );

  const handleCopyText = async (
    key: string,
    text: string,
    toastTitle: string,
    toastDescription: string
  ) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      pushToast({
        title: toastTitle,
        description: toastDescription,
        variant: 'success',
      });
      window.setTimeout(() => {
        setCopiedKey((prev) => (prev === key ? null : prev));
      }, 2000);
    } catch {
      pushToast({
        title: 'Copy failed',
        description: 'Select the text and copy it manually.',
        variant: 'error',
      });
    }
  };

  return (
    <>
      <div className="space-y-5">
        {/* Card 1: Chatbot ID */}
        <section className="rounded-2xl border border-blue-100/90 bg-[#f4f7ff] p-5 sm:p-6">
          <div className="flex items-center gap-2.5">
            <TbCopy className="h-[18px] w-[18px] shrink-0 text-blue-600" />
            <h2 className="font-display text-[17px] font-bold tracking-[-0.015em] text-blue-800">
              Chatbot ID
            </h2>
          </div>

          <p className="mt-2.5 text-sm leading-relaxed text-blue-600">
            This is your unique chatbot identifier. Use this ID when integrating with
            third-party platforms like WordPress plugins.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3 sm:flex-nowrap">
            <div className="min-w-0 flex-1 rounded-xl bg-[#dbeafe]/80 px-4 py-3 font-mono text-[13px] font-medium text-blue-950 break-all select-all">
              {selectedAgent.id}
            </div>

            <button
              type="button"
              onClick={() =>
                handleCopyText(
                  'chatbot-id',
                  selectedAgent.id,
                  'Chatbot ID copied',
                  'Use this identifier for plugins and custom integrations.'
                )
              }
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-100/60 hover:text-blue-700 whitespace-nowrap shrink-0"
            >
              {copiedKey === 'chatbot-id' ? (
                <TbCheck className="h-4 w-4 text-emerald-600" />
              ) : (
                <TbCopy className="h-4 w-4" />
              )}
              <span>{copiedKey === 'chatbot-id' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </section>

        {/* Card 2: Embed Options */}
        <section className="rounded-2xl border border-blue-100/90 bg-[#f4f7ff] p-5 sm:p-6">
          <div className="flex items-center gap-2.5">
            <TbCode className="h-[19px] w-[19px] shrink-0 text-blue-600" />
            <h2 className="font-display text-[17px] font-bold tracking-[-0.015em] text-blue-800">
              Embed Options
            </h2>
          </div>

          <p className="mt-2.5 text-sm leading-relaxed text-blue-600">
            Choose between three embedding methods. Most users should use the JavaScript
            embed (recommended).
          </p>

          <div className="mt-5 space-y-4">
            {embedMethods.map((method) => {
              const isCopied = copiedKey === method.key;
              return (
                <div
                  key={method.key}
                  className="rounded-xl border border-blue-100 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-[16px] font-bold leading-snug text-blue-950">
                      {method.title}
                    </h3>
                    {method.recommended && (
                      <span className="shrink-0 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 whitespace-nowrap">
                        Recommended
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-sm leading-relaxed text-blue-600">
                    {method.description}
                  </p>

                  <div className="mt-4 rounded-xl bg-[#f1f5ff] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <pre className="min-w-0 flex-1 overflow-x-auto font-mono text-xs leading-relaxed text-blue-950 whitespace-pre-wrap break-all">
                        <code>{method.code}</code>
                      </pre>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyText(
                            method.key,
                            method.code,
                            `${method.title} copied`,
                            'Paste before </body> on your website to launch the floating voice chatbot.'
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-100/70 hover:text-blue-700 whitespace-nowrap shrink-0"
                      >
                        {isCopied ? (
                          <TbCheck className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <TbCopy className="h-3.5 w-3.5" />
                        )}
                        <span>{isCopied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {selectedAgent.status !== 'Active' && (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
              This chatbot is currently <strong>{selectedAgent.status}</strong>. Switch its
              status to <strong>Active</strong> in the Dashboard header so external website
              visitors can load it.
            </p>
          )}
        </section>
      </div>

      {/* Video Tutorial & Quick Walkthrough Modal */}
      {tutorialOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="install-tutorial-title"
          onClick={onCloseTutorial}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="install-tutorial-title"
                  className="font-display text-lg font-bold text-neutral-950"
                >
                  How to Install {selectedAgent.name}
                </h2>
                <p className="mt-1 text-xs text-neutral-500">
                  Go live on any website in under two minutes.
                </p>
              </div>
              <button
                type="button"
                onClick={onCloseTutorial}
                aria-label="Close installation guide"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
              >
                <TbX className="h-4 w-4" />
              </button>
            </div>

            <ol className="mt-5 space-y-3.5 text-sm text-neutral-700">
              <li className="rounded-xl border border-blue-100 bg-[#f4f7ff] p-3.5">
                <p className="font-semibold text-blue-950">
                  1. Copy the JavaScript Embed snippet
                </p>
                <p className="mt-1 text-xs leading-relaxed text-blue-700">
                  Click Copy inside the recommended JavaScript Embed card or copy your Chatbot
                  ID for WordPress plugins.
                </p>
              </li>
              <li className="rounded-xl border border-blue-100 bg-[#f4f7ff] p-3.5">
                <p className="font-semibold text-blue-950">
                  2. Paste before &lt;/body&gt; on your website
                </p>
                <p className="mt-1 text-xs leading-relaxed text-blue-700">
                  Add the script once to your site footer template (HTML, Next.js, WordPress
                  WPCode, or Shopify theme.liquid).
                </p>
              </li>
              <li className="rounded-xl border border-blue-100 bg-[#f4f7ff] p-3.5">
                <p className="font-semibold text-blue-950">
                  3. Publish and test your floating orb
                </p>
                <p className="mt-1 text-xs leading-relaxed text-blue-700">
                  Make sure your chatbot status is Active, then click the bottom-right voice
                  orb on your site to test live voice and text answers.
                </p>
              </li>
            </ol>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onCloseTutorial}
                className="min-h-[40px] rounded-lg border border-neutral-200 px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 whitespace-nowrap"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const jsMethod = embedMethods[0];
                  handleCopyText(
                    jsMethod.key,
                    jsMethod.code,
                    'JavaScript Embed copied',
                    'Paste before </body> on your website.'
                  );
                  onCloseTutorial();
                }}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 whitespace-nowrap"
              >
                <TbCopy className="h-3.5 w-3.5" />
                Copy JavaScript Embed
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
