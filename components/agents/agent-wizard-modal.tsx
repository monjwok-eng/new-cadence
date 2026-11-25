'use client';

import React, { useEffect, useState } from 'react';
import {
  Bot,
  Calendar,
  Check,
  Code2,
  FileText,
  Layers,
  MessageSquare,
  Mic,
  Pause,
  PhoneCall,
  Play,
  Pencil,
  Puzzle,
  Send,
  Sliders,
  Sparkles,
  Tag,
  UserCheck,
  Volume2,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useApp } from '@/components/providers/app-provider';
import { VOICE_OPTIONS } from '@/lib/demo-data';
import { AgentPersonality, AgentStatus, VoiceAgent, VoiceOption } from '@/lib/types';

const AGENT_TABS = [
  { id: 'general', label: 'General', icon: Bot },
  { id: 'training', label: 'Training', icon: FileText },
  { id: 'transfer_calls', label: 'Transfer calls', icon: PhoneCall },
  { id: 'send_texts', label: 'Send texts', icon: Send },
  { id: 'schedule', label: 'Schedule', icon: Calendar },
  { id: 'custom_actions', label: 'Custom actions', icon: Sliders },
  { id: 'custom_fields', label: 'Custom fields', icon: Layers },
  { id: 'tags', label: 'Tags', icon: Tag },
  { id: 'integrations', label: 'Integrations', icon: Puzzle },
] as const;

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

function AgentWizardForm({
  editingAgent,
  defaultBusinessName,
  onClose,
  onSave,
}: {
  editingAgent: VoiceAgent | null;
  defaultBusinessName: string;
  onClose: () => void;
  onSave: (payload: {
    name: string;
    businessName: string;
    description: string;
    websiteUrl: string;
    welcomeMessage: string;
    status: AgentStatus;
    personality: AgentPersonality;
    customInstructions: string;
    voiceId: string;
    voiceLabel: string;
    language: string;
  }) => Promise<void>;
}) {
  const [activeTab, setActiveTab] = useState<string>('general');
  const [name, setName] = useState(editingAgent?.name || 'Jessica');
  const [businessName, setBusinessName] = useState(
    editingAgent?.businessName || defaultBusinessName || 'My Company'
  );
  const [websiteUrl, setWebsiteUrl] = useState(editingAgent?.websiteUrl || '');
  const [welcomeMessage, setWelcomeMessage] = useState(
    editingAgent?.welcomeMessage || ''
  );
  const [description, setDescription] = useState(editingAgent?.description || '');
  const [status, setStatus] = useState<AgentStatus>(editingAgent?.status || 'Active');
  const [personality, setPersonality] = useState<AgentPersonality>(
    editingAgent?.personality || 'Friendly'
  );
  const [customInstructions, setCustomInstructions] = useState(
    editingAgent?.customInstructions ||
      'Greet website visitors politely, answer questions accurately using indexed knowledge, and invite them to share their name and email if follow-up is needed.'
  );
  const [voiceId, setVoiceId] = useState(editingAgent?.voiceId || VOICE_OPTIONS[0].id);
  
  // Call transfer settings state
  const [transferEnabled, setTransferEnabled] = useState(true);
  const [transferNumber, setTransferNumber] = useState('+1 (555) 382-9100');
  const [transferOnHumanRequest, setTransferOnHumanRequest] = useState(true);
  const [transferOnPricing, setTransferOnPricing] = useState(true);
  const [transferOnComplaint, setTransferOnComplaint] = useState(true);

  // Send texts settings state
  const [sendSmsAfterCall, setSendSmsAfterCall] = useState(true);
  const [smsTemplate, setSmsTemplate] = useState('Thanks for chatting with {agentName} at {businessName}! Here is the link to schedule your follow-up: https://calendly.com');

  // Schedule settings state
  const [timezone, setTimezone] = useState('Eastern Time (US & Canada)');
  const [workingHoursStart, setWorkingHoursStart] = useState('09:00');
  const [workingHoursEnd, setWorkingHoursEnd] = useState('18:00');

  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);
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

  const handleSubmit = async () => {
    if (!name.trim() || !businessName.trim() || submitting) {
      setErrors({ name: !name.trim() ? 'Name required' : '', businessName: !businessName.trim() ? 'Business name required' : '' });
      setActiveTab('general');
      return;
    }

    const voiceLabel = `${selectedVoice.name} · ${selectedVoice.gender} · ${selectedVoice.language}`;
    setSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        businessName: businessName.trim(),
        description: description.trim(),
        websiteUrl: websiteUrl.trim(),
        welcomeMessage:
          welcomeMessage.trim() ||
          `Hi! Ask me anything about ${businessName.trim()}.`,
        status,
        personality,
        customInstructions: customInstructions.trim(),
        voiceId: selectedVoice.id,
        voiceLabel,
        language: selectedVoice.language,
      });
    } finally {
      setSubmitting(false);
    }
  };

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
      const utter = new SpeechSynthesisUtterance(`Hello! I am ${name}, your AI voice assistant for ${businessName}.`);
      utter.rate = voice.gender === 'Female' ? 1.02 : 0.98;
      utter.onend = () => setPreviewingVoiceId(null);
      utter.onerror = () => setPreviewingVoiceId(null);
      window.speechSynthesis.speak(utter);
    } else {
      setTimeout(() => setPreviewingVoiceId(null), 3000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900"
    >
      {/* Top Header with Avatar & Name */}
      <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
        <div className="flex items-center gap-3.5">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-500 via-indigo-500 to-pink-500 text-white shadow-md">
            <Bot className="h-6 w-6" />
            <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900 text-white shadow-xs dark:bg-neutral-100 dark:text-neutral-900">
              <Pencil className="h-2.5 w-2.5" />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
              {name || 'Agent'}
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Phone: <span className="font-mono font-medium text-neutral-700 dark:text-neutral-300">(315) 273-6033</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Horizontal Scrollable Tabs Strip (Matches UpFirst Screenshot UI) */}
      <div className="flex shrink-0 overflow-x-auto border-b border-neutral-200 bg-neutral-50/80 px-4 scrollbar-none dark:border-neutral-800 dark:bg-neutral-950/60">
        <div className="flex gap-1 py-2">
          {AGENT_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-neutral-900 text-white shadow-xs dark:bg-neutral-100 dark:text-neutral-900'
                    : 'text-neutral-600 hover:bg-neutral-200/60 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${active ? 'text-white dark:text-neutral-900' : 'text-neutral-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Body Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <AnimatePresence mode="wait">
          {activeTab === 'general' && (
            <motion.div
              key="general"
              initial={{ opacity: 0, x: 4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -4 }}
              transition={{ duration: 0.12 }}
              className="space-y-5"
            >
              <div>
                <label className="block text-sm font-medium text-neutral-800 dark:text-neutral-200">
                  Agent name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Jessica"
                  className="mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 focus:border-indigo-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                />
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  For your reference only. Callers won&apos;t hear this.
                </p>
                {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-neutral-800 dark:text-neutral-200">
                    Business name
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g., Acme Corp"
                    className="mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 focus:border-indigo-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                  />
                  {errors.businessName && <p className="mt-1 text-xs text-rose-500">{errors.businessName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-800 dark:text-neutral-200">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://yourbusiness.com"
                    className="mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 focus:border-indigo-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-800 dark:text-neutral-200">
                  Agent phone number
                </label>
                <div className="mt-1.5 flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 dark:border-neutral-700 dark:bg-neutral-950">
                  <span className="font-mono text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    (315) 273-6033
                  </span>
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    Active line
                  </span>
                </div>
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  Forward calls to this number or use it directly for your business.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-800 dark:text-neutral-200">
                  Agent&apos;s time zone
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 focus:border-indigo-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                >
                  <option>Eastern Time (US & Canada)</option>
                  <option>Central Time (US & Canada)</option>
                  <option>Mountain Time (US & Canada)</option>
                  <option>Pacific Time (US & Canada)</option>
                  <option>Greenwich Mean Time (GMT)</option>
                </select>
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  Used for greetings, scheduling, and call transfers.
                </p>
              </div>

              <div>
                <span className="block text-sm font-medium text-neutral-800 dark:text-neutral-200">
                  Chatbot status
                </span>
                <div className="mt-1.5 grid grid-cols-3 gap-2">
                  {(['Active', 'Draft', 'Inactive'] as AgentStatus[]).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setStatus(option)}
                      className={`rounded-lg border px-3 py-2.5 text-xs font-medium transition-colors ${
                        status === option
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/60 dark:text-indigo-300'
                          : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-800'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'training' && (
            <motion.div
              key="training"
              initial={{ opacity: 0, x: 4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -4 }}
              transition={{ duration: 0.12 }}
              className="space-y-5"
            >
              <div>
                <label className="block text-sm font-medium text-neutral-800 dark:text-neutral-200">
                  Widget greeting message
                </label>
                <input
                  type="text"
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  placeholder="Hi! Ask me anything about our products."
                  className="mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 focus:border-indigo-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                />
              </div>

              <div>
                <span className="block text-sm font-medium text-neutral-800 dark:text-neutral-200">
                  Conversation personality
                </span>
                <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  {PERSONALITIES.map((item) => {
                    const active = personality === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setPersonality(item.id)}
                        className={`rounded-xl border p-3.5 text-left transition-colors ${
                          active
                            ? 'border-indigo-600 bg-indigo-50/70 dark:border-indigo-500 dark:bg-indigo-950/40'
                            : 'border-neutral-200 bg-white hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-neutral-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                            {item.title}
                          </span>
                          {active && <Check className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />}
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                          {item.summary}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="block text-sm font-medium text-neutral-800 dark:text-neutral-200">
                    Custom instructions &amp; prompts
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {INSTRUCTION_TEMPLATES.map((tpl) => (
                      <button
                        key={tpl.label}
                        type="button"
                        onClick={() => setCustomInstructions(tpl.text)}
                        className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-800/70 dark:text-neutral-300"
                      >
                        <Sparkles className="h-3 w-3" />
                        {tpl.label}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  rows={4}
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm leading-relaxed text-neutral-900 focus:border-indigo-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-2">
                  Voice profile
                </label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {VOICE_OPTIONS.map((voice) => {
                    const selected = voice.id === voiceId;
                    const isPreviewing = previewingVoiceId === voice.id;
                    return (
                      <div
                        key={voice.id}
                        onClick={() => setVoiceId(voice.id)}
                        className={`cursor-pointer rounded-xl border p-3 transition-colors ${
                          selected
                            ? 'border-indigo-600 bg-indigo-50/60 dark:border-indigo-500 dark:bg-indigo-950/35'
                            : 'border-neutral-200 bg-white hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-950'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                              {voice.name}
                            </p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                              {voice.gender} · {voice.language}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleVoicePreview(voice);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300"
                          >
                            {isPreviewing ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                            {isPreviewing ? 'Stop' : 'Preview'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'transfer_calls' && (
            <motion.div
              key="transfer_calls"
              initial={{ opacity: 0, x: 4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -4 }}
              transition={{ duration: 0.12 }}
              className="space-y-5"
            >
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 dark:border-indigo-950 dark:bg-indigo-950/30">
                <h4 className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">
                  Live Call Handoff &amp; Transfers
                </h4>
                <p className="mt-1 text-xs leading-relaxed text-indigo-700 dark:text-indigo-300">
                  Set rules for when the AI hands a call over to a real person. Routine calls are handled by the AI, and you only receive escalations that need human attention.
                </p>
              </div>

              <label className="flex items-center justify-between rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
                <div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    Enable Live Call Transfers
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Allow the AI agent to bridge calls to your team&apos;s phone numbers.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={transferEnabled}
                  onChange={(e) => setTransferEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                />
              </label>

              <div>
                <label className="block text-sm font-medium text-neutral-800 dark:text-neutral-200">
                  Destination Phone Number
                </label>
                <input
                  type="tel"
                  value={transferNumber}
                  onChange={(e) => setTransferNumber(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 focus:border-indigo-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                />
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  Where transferred calls should ring (your cell or a teammate&apos;s).
                </p>
              </div>

              <div className="space-y-3">
                <span className="block text-sm font-medium text-neutral-800 dark:text-neutral-200">
                  Escalation Trigger Rules
                </span>
                <label className="flex items-center gap-3 text-xs text-neutral-700 dark:text-neutral-300">
                  <input
                    type="checkbox"
                    checked={transferOnHumanRequest}
                    onChange={(e) => setTransferOnHumanRequest(e.target.checked)}
                    className="h-4 w-4 rounded border-neutral-300 text-indigo-600"
                  />
                  <span>Caller explicitly asks to speak with a human or agent</span>
                </label>
                <label className="flex items-center gap-3 text-xs text-neutral-700 dark:text-neutral-300">
                  <input
                    type="checkbox"
                    checked={transferOnPricing}
                    onChange={(e) => setTransferOnPricing(e.target.checked)}
                    className="h-4 w-4 rounded border-neutral-300 text-indigo-600"
                  />
                  <span>Caller asks for complex custom pricing or enterprise sales negotiation</span>
                </label>
                <label className="flex items-center gap-3 text-xs text-neutral-700 dark:text-neutral-300">
                  <input
                    type="checkbox"
                    checked={transferOnComplaint}
                    onChange={(e) => setTransferOnComplaint(e.target.checked)}
                    className="h-4 w-4 rounded border-neutral-300 text-indigo-600"
                  />
                  <span>Caller hits angry/complaint sentiment or demands a manager</span>
                </label>
              </div>
            </motion.div>
          )}

          {activeTab === 'send_texts' && (
            <motion.div
              key="send_texts"
              initial={{ opacity: 0, x: 4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -4 }}
              transition={{ duration: 0.12 }}
              className="space-y-5"
            >
              <label className="flex items-center justify-between rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
                <div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    Send automated SMS follow-up after calls
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Automatically text visitors when they provide their phone number.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={sendSmsAfterCall}
                  onChange={(e) => setSendSmsAfterCall(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                />
              </label>

              <div>
                <label className="block text-sm font-medium text-neutral-800 dark:text-neutral-200">
                  SMS Follow-up Template
                </label>
                <textarea
                  rows={3}
                  value={smsTemplate}
                  onChange={(e) => setSmsTemplate(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm leading-relaxed text-neutral-900 focus:border-indigo-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                />
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  Variables available: <code className="text-indigo-600 dark:text-indigo-400">{'{agentName}'}</code>, <code className="text-indigo-600 dark:text-indigo-400">{'{businessName}'}</code>
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === 'schedule' && (
            <motion.div
              key="schedule"
              initial={{ opacity: 0, x: 4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -4 }}
              transition={{ duration: 0.12 }}
              className="space-y-5"
            >
              <div>
                <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  Agent Availability &amp; Operating Hours
                </h4>
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  Configure when this voice agent is live to take incoming calls and widget chats.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    Opening Time
                  </label>
                  <input
                    type="time"
                    value={workingHoursStart}
                    onChange={(e) => setWorkingHoursStart(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    Closing Time
                  </label>
                  <input
                    type="time"
                    value={workingHoursEnd}
                    onChange={(e) => setWorkingHoursEnd(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {['custom_actions', 'custom_fields', 'tags', 'integrations'].includes(activeTab) && (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -4 }}
              transition={{ duration: 0.12 }}
              className="py-8 text-center"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                <Sliders className="h-6 w-6" />
              </div>
              <h4 className="mt-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100 capitalize">
                {activeTab.replace('_', ' ')} Management
              </h4>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
                Configure advanced {activeTab.replace('_', ' ')} rules, webhooks, and workspace attributes for {name}.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('general')}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900"
              >
                Back to General
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal Footer */}
      <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50/70 px-6 py-4 dark:border-neutral-800 dark:bg-neutral-950/50">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          <Check className="h-4 w-4" />
          {submitting ? 'Saving...' : editingAgent ? 'Save Changes' : 'Create Chatbot'}
        </button>
      </div>
    </motion.div>
  );
}

export function AgentWizardModal() {
  const {
    wizardOpen,
    editingAgent,
    closeWizard,
    activeWorkspace,
    addAgent,
    updateAgent,
    pushToast,
  } = useApp();

  if (!wizardOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/50 p-3 sm:p-6 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="agent-wizard-title"
    >
      <AgentWizardForm
        key={`${editingAgent?.id || 'new'}_${activeWorkspace?.id || 'none'}`}
        editingAgent={editingAgent}
        defaultBusinessName={activeWorkspace?.name || ''}
        onClose={closeWizard}
        onSave={async (payload) => {
          try {
            if (editingAgent) {
              await updateAgent(editingAgent.id, payload);
              pushToast({
                title: 'Voice chatbot updated',
                description: `${payload.name} changes saved to Firestore.`,
                variant: 'success',
              });
            } else {
              await addAgent(payload);
              pushToast({
                title: 'Voice chatbot created',
                description: `${payload.name} is saved in your workspace.`,
                variant: 'success',
              });
            }
            closeWizard();
          } catch (err) {
            pushToast({
              title: 'Save failed',
              description:
                err instanceof Error ? err.message : 'Unable to save voice chatbot.',
              variant: 'error',
            });
          }
        }}
      />
    </div>
  );
}
