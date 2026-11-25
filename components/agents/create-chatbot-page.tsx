'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Globe,
  Pause,
  Play,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { useApp } from '@/components/providers/app-provider';
import { VOICE_OPTIONS } from '@/lib/demo-data';
import {
  AgentPersonality,
  AgentStatus,
  VoiceOption,
  WidgetPosition,
  WidgetTheme,
} from '@/lib/types';

const PERSONALITIES: {
  id: AgentPersonality;
  title: string;
  summary: string;
}[] = [
  {
    id: 'Friendly',
    title: 'Friendly',
    summary: 'Warm, approachable, and conversational for website visitors and product questions.',
  },
  {
    id: 'Professional',
    title: 'Professional',
    summary: 'Polished, structured, and reassuring for SaaS, healthcare, finance, and B2B sites.',
  },
  {
    id: 'Casual',
    title: 'Casual',
    summary: 'Relaxed, natural, and concise for modern consumer brands and storefronts.',
  },
];

const INSTRUCTION_TEMPLATES = [
  {
    label: 'Sales & Pricing Guide',
    text: 'Greet visitors warmly, answer pricing and product questions from our website knowledge base, and ask for their name and email if they want a custom demo.',
  },
  {
    label: 'Lead Qualification',
    text: 'Ask about the visitor’s primary goal, timeline, and company size. Summarize their request and invite them to leave their email for a specialist follow-up.',
  },
  {
    label: 'Website Customer Support',
    text: 'Answer onboarding and troubleshooting questions concisely from our indexed documentation, and capture contact details if a human follow-up is needed.',
  },
];

const COLOR_PRESETS = ['#2563eb', '#4f46e5', '#f94c1f', '#0f172a', '#059669'];

function ToggleSwitch({
  id,
  checked,
  onChange,
}: {
  id: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
        checked ? 'bg-blue-600' : 'bg-neutral-300 dark:bg-neutral-700'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

export function CreateChatbotPage() {
  const router = useRouter();
  const {
    activeWorkspace,
    addAgent,
    addWebsiteOrTextKnowledge,
    updateKnowledgeSource,
    pushToast,
  } = useApp();

  const [name, setName] = useState('');
  const [businessNameOverride, setBusinessNameOverride] = useState<string | null>(null);
  const businessName = businessNameOverride ?? (activeWorkspace?.name || '');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [description, setDescription] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [status, setStatus] = useState<AgentStatus>('Active');
  const [personality, setPersonality] = useState<AgentPersonality>('Friendly');
  const [customInstructions, setCustomInstructions] = useState(
    'Greet website visitors politely, answer questions accurately using indexed knowledge, and invite them to share their name and email if follow-up is needed.'
  );
  const [voiceId, setVoiceId] = useState(VOICE_OPTIONS[0].id);
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);

  const [autoCrawlWebsite, setAutoCrawlWebsite] = useState(true);
  const [leadCaptureEnabled, setLeadCaptureEnabled] = useState(true);
  const [widgetTheme, setWidgetTheme] = useState<WidgetTheme>('light');
  const [widgetPosition, setWidgetPosition] = useState<WidgetPosition>('bottom-right');
  const [launcherLabel, setLauncherLabel] = useState('Voice chat');
  const [accentColor, setAccentColor] = useState('#2563eb');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!previewingVoiceId) return;
    const timer = window.setTimeout(() => {
      setPreviewingVoiceId(null);
    }, 3500);
    return () => window.clearTimeout(timer);
  }, [previewingVoiceId]);

  const selectedVoice =
    VOICE_OPTIONS.find((v) => v.id === voiceId) || VOICE_OPTIONS[0];

  const toggleVoicePreview = (voice: VoiceOption) => {
    if (previewingVoiceId === voice.id) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setPreviewingVoiceId(null);
      return;
    }

    setPreviewingVoiceId(voice.id);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
      const utterance = new SpeechSynthesisUtterance(voice.sampleLine);
      utterance.rate = 1.0;
      utterance.pitch =
        voice.gender === 'Female' ? 1.2 : voice.gender === 'Male' ? 0.8 : 1.0;

      const voices = window.speechSynthesis.getVoices();
      const matchingVoice = voices.find((v) => v.lang.includes('en')) || voices[0];
      if (matchingVoice) utterance.voice = matchingVoice;

      utterance.onend = () => setPreviewingVoiceId(null);
      utterance.onerror = () => setPreviewingVoiceId(null);
      window.speechSynthesis.speak(utterance);
    }
  };

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = 'Chatbot name is required.';
    if (!businessName.trim()) nextErrors.businessName = 'Business name is required.';
    if (!description.trim()) {
      nextErrors.description = 'Add a short summary of what this chatbot handles.';
    }
    if (customInstructions.trim().length < 15) {
      nextErrors.customInstructions =
        'Provide at least 15 characters of instructions to guide your chatbot.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || submitting) return;

    const cleanUrl = websiteUrl.trim();
    const voiceLabel = `${selectedVoice.name} · ${selectedVoice.gender} · ${selectedVoice.language}`;

    setSubmitting(true);
    try {
      const newAgentId = await addAgent({
        name: name.trim(),
        businessName: businessName.trim(),
        description: description.trim(),
        websiteUrl: cleanUrl,
        welcomeMessage:
          welcomeMessage.trim() ||
          `Hi! Ask me anything about ${businessName.trim()}.`,
        status,
        personality,
        customInstructions: customInstructions.trim(),
        voiceId: selectedVoice.id,
        voiceLabel,
        language: selectedVoice.language,
        accentColor,
        widgetPosition,
        widgetTheme,
        launcherLabel: launcherLabel.trim() || 'Voice chat',
        leadCaptureEnabled,
      });

      if (autoCrawlWebsite && cleanUrl && activeWorkspace) {
        try {
          const normalizedUrl = cleanUrl.startsWith('http')
            ? cleanUrl
            : `https://${cleanUrl}`;
          const parsed = new URL(normalizedUrl);
          const sourceId = await addWebsiteOrTextKnowledge({
            agentId: newAgentId,
            sourceType: 'website',
            sourceName: parsed.hostname + parsed.pathname,
            sourceUrl: parsed.toString(),
          });
          if (sourceId) {
            fetch('/api/kb/process', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                workspaceId: activeWorkspace.id,
                sourceId,
                action: 'crawl',
                sourceUrl: parsed.toString(),
              }),
            })
              .then(async (res) => {
                const data = await res.json();
                if (res.ok && data.extractedText) {
                  await updateKnowledgeSource(sourceId, {
                    content: data.extractedText,
                    processingStatus: 'ready',
                  });
                } else {
                  await updateKnowledgeSource(sourceId, { processingStatus: 'failed' });
                }
              })
              .catch(() => {
                // Background crawl failure is surfaced in knowledge sources tab
              });
          }
        } catch {
          // Ignore malformed optional URL during background crawl
        }
      }

      pushToast({
        title: 'Voice chatbot created',
        description: `${name.trim()} is ready in your workspace.`,
        variant: 'success',
      });
      router.push(`/agents/${newAgentId}`);
    } catch (err) {
      pushToast({
        title: 'Unable to create chatbot',
        description:
          err instanceof Error ? err.message : 'Check your connection and try again.',
        variant: 'error',
      });
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-8">
      {/* Top Breadcrumb + Header */}
      <div className="space-y-3 border-b border-neutral-200 pb-6 dark:border-neutral-800">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Chatbots
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            Create New Voice Chatbot
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Configure your website voice chatbot’s identity, instructions, voice profile, and widget behavior.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Website & Chatbot Identity */}
        <section className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="border-b border-neutral-200 pb-4 dark:border-neutral-800">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Website &amp; Identity
            </h2>
            <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
              Define the business name, source website URL, and greeting visitors see first.
            </p>
          </div>

          <div className="mt-5 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="create-name"
                  className="block text-sm font-medium text-neutral-800 dark:text-neutral-200"
                >
                  Chatbot name
                </label>
                <input
                  id="create-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Website Concierge"
                  className="mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="create-business"
                  className="block text-sm font-medium text-neutral-800 dark:text-neutral-200"
                >
                  Business name
                </label>
                <input
                  id="create-business"
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessNameOverride(e.target.value)}
                  placeholder="e.g., Acme SaaS"
                  className="mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                />
                {errors.businessName && (
                  <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                    {errors.businessName}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="create-website"
                className="block text-sm font-medium text-neutral-800 dark:text-neutral-200"
              >
                Website URL
              </label>
              <div className="relative mt-1.5">
                <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  id="create-website"
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-9 pr-3.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="create-description"
                className="block text-sm font-medium text-neutral-800 dark:text-neutral-200"
              >
                What does this chatbot handle?
              </label>
              <textarea
                id="create-description"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Answers product & pricing questions and qualifies incoming website leads..."
                className="mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
              />
              {errors.description && (
                <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                  {errors.description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="create-welcome"
                  className="block text-sm font-medium text-neutral-800 dark:text-neutral-200"
                >
                  Widget greeting message
                </label>
                <input
                  id="create-welcome"
                  type="text"
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  placeholder="Hi! Tap the orb and ask anything."
                  className="mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                />
              </div>

              <div>
                <span className="block text-sm font-medium text-neutral-800 dark:text-neutral-200">
                  Initial status
                </span>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  {(['Active', 'Draft'] as AgentStatus[]).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setStatus(option)}
                      className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                        status === option
                          ? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-950/60 dark:text-blue-300'
                          : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-800'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Personality & Prompt Instructions */}
        <section className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="border-b border-neutral-200 pb-4 dark:border-neutral-800">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Personality &amp; Instructions
            </h2>
            <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
              Choose how your voice chatbot speaks and what goals it prioritizes.
            </p>
          </div>

          <div className="mt-5 space-y-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {PERSONALITIES.map((item) => {
                const active = personality === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPersonality(item.id)}
                    className={`rounded-xl border p-3.5 text-left transition-colors ${
                      active
                        ? 'border-blue-600 bg-blue-50/70 dark:border-blue-500 dark:bg-blue-950/40'
                        : 'border-neutral-200 bg-white hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        {item.title}
                      </span>
                      {active && (
                        <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                      {item.summary}
                    </p>
                  </button>
                );
              })}
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="create-instructions"
                  className="block text-sm font-medium text-neutral-800 dark:text-neutral-200"
                >
                  System instructions
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {INSTRUCTION_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.label}
                      type="button"
                      onClick={() => setCustomInstructions(tpl.text)}
                      className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:border-neutral-800 dark:bg-neutral-800/70 dark:text-neutral-300 dark:hover:bg-neutral-800 whitespace-nowrap"
                    >
                      <Sparkles className="h-3 w-3" />
                      {tpl.label}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                id="create-instructions"
                rows={4}
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                className="mt-2 w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm leading-relaxed text-neutral-900 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
              />
              {errors.customInstructions && (
                <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                  {errors.customInstructions}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Section 3: Voice Selection */}
        <section className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center justify-between gap-2 border-b border-neutral-200 pb-4 dark:border-neutral-800">
            <div>
              <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                Voice Profile
              </h2>
              <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                Select how your chatbot sounds and click Preview to hear a sample.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {VOICE_OPTIONS.map((voice) => {
              const selected = voice.id === voiceId;
              const isPreviewing = previewingVoiceId === voice.id;
              return (
                <div
                  key={voice.id}
                  onClick={() => setVoiceId(voice.id)}
                  role="radio"
                  aria-checked={selected}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setVoiceId(voice.id);
                    }
                  }}
                  className={`cursor-pointer rounded-xl border p-3.5 transition-colors ${
                    selected
                      ? 'border-blue-600 bg-blue-50/60 dark:border-blue-500 dark:bg-blue-950/35'
                      : 'border-neutral-200 bg-white hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                          {voice.name}
                        </span>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                          {voice.gender} · {voice.language}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                        {voice.tone} ({voice.accent})
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleVoicePreview(voice);
                      }}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                        isPreviewing
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800'
                      }`}
                    >
                      {isPreviewing ? (
                        <>
                          <Pause className="h-3 w-3" />
                          Playing
                        </>
                      ) : (
                        <>
                          <Play className="h-3 w-3" />
                          Preview
                        </>
                      )}
                    </button>
                  </div>

                  {isPreviewing && (
                    <div className="mt-2.5 flex items-center gap-2 rounded-lg bg-neutral-100 px-2.5 py-2 text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                      <Volume2 className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
                      <span className="truncate italic">&ldquo;{voice.sampleLine}&rdquo;</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 4: Widget Behavior & Appearance */}
        <section className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="border-b border-neutral-200 pb-4 dark:border-neutral-800">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Widget Settings &amp; Behavior
            </h2>
            <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
              Customize visitor interactions and floating launcher defaults. You can refine any setting later in the workspace.
            </p>
          </div>

          <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
            <div className="flex items-start justify-between gap-4 py-4">
              <div>
                <label
                  htmlFor="toggle-auto-crawl"
                  className="text-sm font-medium text-neutral-900 dark:text-neutral-100"
                >
                  Auto-Index Website Knowledge
                </label>
                <p className="mt-0.5 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                  Automatically crawl your Website URL right after creating the chatbot so it can answer visitor questions immediately.
                </p>
              </div>
              <ToggleSwitch
                id="toggle-auto-crawl"
                checked={autoCrawlWebsite}
                onChange={setAutoCrawlWebsite}
              />
            </div>

            <div className="flex items-start justify-between gap-4 py-4">
              <div>
                <label
                  htmlFor="toggle-lead-capture"
                  className="text-sm font-medium text-neutral-900 dark:text-neutral-100"
                >
                  Capture Visitor Leads
                </label>
                <p className="mt-0.5 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                  Allow visitors who have questions or request follow-up to share their name, email, and phone inside the voice widget.
                </p>
              </div>
              <ToggleSwitch
                id="toggle-lead-capture"
                checked={leadCaptureEnabled}
                onChange={setLeadCaptureEnabled}
              />
            </div>

            <div className="flex items-start justify-between gap-4 py-4">
              <div>
                <label
                  htmlFor="toggle-dark-widget"
                  className="text-sm font-medium text-neutral-900 dark:text-neutral-100"
                >
                  Use Dark Widget Theme
                </label>
                <p className="mt-0.5 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                  Turn this on to display the floating voice widget popup with a dark surface instead of crisp white.
                </p>
              </div>
              <ToggleSwitch
                id="toggle-dark-widget"
                checked={widgetTheme === 'dark'}
                onChange={(next) => setWidgetTheme(next ? 'dark' : 'light')}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 pt-5 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="create-launcher-label"
                  className="block text-xs font-medium text-neutral-700 dark:text-neutral-300"
                >
                  Launcher Button Label
                </label>
                <input
                  id="create-launcher-label"
                  type="text"
                  maxLength={60}
                  value={launcherLabel}
                  onChange={(e) => setLauncherLabel(e.target.value)}
                  placeholder="Voice chat"
                  className="mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                />
              </div>

              <div>
                <span className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  Screen Corner
                </span>
                <div className="mt-1.5 flex rounded-lg border border-neutral-200 bg-neutral-100/70 p-1 dark:border-neutral-800 dark:bg-neutral-950">
                  {(['bottom-right', 'bottom-left'] as const).map((pos) => (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => setWidgetPosition(pos)}
                      className={`flex-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                        widgetPosition === pos
                          ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-800 dark:text-neutral-100'
                          : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'
                      }`}
                    >
                      {pos === 'bottom-right' ? 'Right' : 'Left'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  Brand Color
                </span>
                <div className="mt-2 flex items-center gap-2">
                  {COLOR_PRESETS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setAccentColor(c)}
                      aria-label={`Select accent color ${c}`}
                      style={{ backgroundColor: c }}
                      className={`h-7 w-7 rounded-md border transition-transform ${
                        accentColor.toLowerCase() === c
                          ? 'scale-110 border-neutral-900 ring-2 ring-blue-500/40 dark:border-white'
                          : 'border-black/10'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Full-Width Primary CTA */}
        <div className="sticky bottom-0 z-10 border-t border-neutral-200 bg-white/95 py-3 backdrop-blur-xs dark:border-neutral-800 dark:bg-neutral-950/95">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
          >
            <span>{submitting ? 'Creating Chatbot...' : 'Create Chatbot'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
