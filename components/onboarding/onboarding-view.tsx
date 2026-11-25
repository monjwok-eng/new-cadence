'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import {
  Check,
  ChevronDown,
  Info,
  Plus,
  X,
} from 'lucide-react';
import { useApp } from '@/components/providers/app-provider';
import { BrandMark } from '@/components/ui/brand-loader';
import { VOICE_OPTIONS } from '@/lib/demo-data';
import {
  ACTION_STACK_OPTIONS,
  COMPANY_SIZE_OPTIONS,
  ChipOption,
  DEPLOY_CHANNEL_OPTIONS,
  HELPDESK_STACK_OPTIONS,
  REFERRAL_OPTIONS,
  ROLE_PRESETS,
} from './onboarding-data';
import { OnboardingPreviewStage } from './onboarding-preview-stage';

function SelectableChip({
  option,
  selected,
  onToggle,
}: {
  option: ChipOption;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      data-testid="onboarding-chip"
      data-chip-id={option.id}
      className={`inline-flex h-9 max-w-full cursor-pointer items-center gap-2 rounded-lg px-3 text-[14px] font-medium transition-shadow outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-1 ${
        selected
          ? 'bg-neutral-900/5 text-neutral-950 ring-1 ring-neutral-900 ring-inset'
          : 'bg-transparent text-neutral-900 ring-1 ring-neutral-200 ring-inset hover:bg-neutral-100/70'
      }`}
    >
      {option.renderIcon && (
        <span className="flex size-5 shrink-0 items-center justify-center">
          {option.renderIcon()}
        </span>
      )}
      <span className="truncate">{option.label}</span>
    </button>
  );
}

export function OnboardingView() {
  const router = useRouter();
  const {
    user,
    activeWorkspace,
    agents,
    addAgent,
    addWebsiteOrTextKnowledge,
    updateKnowledgeSource,
    saveOnboardingProgress,
    pushToast,
  } = useApp();

  const initialData = user?.onboardingData;

  const [step, setStep] = useState<number>(1);
  const [previewReady, setPreviewReady] = useState(false);

  const [referralSource, setReferralSource] = useState<string>(
    initialData?.referralSource || ''
  );
  const [companySize, setCompanySize] = useState<string>(
    initialData?.companySize || ''
  );
  const [websiteDomain, setWebsiteDomain] = useState<string>(() => {
    const raw = initialData?.websiteUrl || '';
    return raw.replace(/^https?:\/\//i, '');
  });
  const [otherSourceSummary, setOtherSourceSummary] = useState<string>(
    initialData?.otherSourceSummary || ''
  );
  const [otherSourcesOpen, setOtherSourcesOpen] = useState(false);
  const [draftOtherSource, setDraftOtherSource] = useState('');

  const [agentRole, setAgentRole] = useState<string>(
    initialData?.agentRole || ROLE_PRESETS[0].id
  );
  const [instructions, setInstructions] = useState<string>(
    initialData?.instructions || ROLE_PRESETS[0].instructions
  );
  const [techStack, setTechStack] = useState<string[]>(
    initialData?.techStack || []
  );
  const [deployChannels, setDeployChannels] = useState<string[]>(
    initialData?.deployChannels || []
  );

  const [saving, setSaving] = useState(false);
  const [websiteError, setWebsiteError] = useState('');
  const [legalDialog, setLegalDialog] = useState<'terms' | 'privacy' | null>(null);

  const normalizedWebsiteUrl = useMemo(() => {
    const trimmed = websiteDomain.trim().replace(/^https?:\/\//i, '');
    if (!trimmed) return '';
    return `https://${trimmed}`;
  }, [websiteDomain]);

  const toggleMultiItem = (
    list: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    label: string
  ) => {
    setter(
      list.includes(label)
        ? list.filter((item) => item !== label)
        : [...list, label]
    );
  };

  const handleRoleChange = (nextRole: string) => {
    const prevPreset = ROLE_PRESETS.find((r) => r.id === agentRole);
    const nextPreset = ROLE_PRESETS.find((r) => r.id === nextRole);
    setAgentRole(nextRole);
    if (
      nextPreset &&
      (!instructions.trim() || instructions === prevPreset?.instructions)
    ) {
      setInstructions(nextPreset.instructions);
    }
  };

  const canProceed = useMemo(() => {
    if (step === 1) return Boolean(referralSource);
    if (step === 2) return Boolean(companySize);
    if (step === 4) return instructions.trim().length >= 5;
    return true;
  }, [step, referralSource, companySize, instructions]);

  const handleNext = async () => {
    setWebsiteError('');
    if (step === 3 && websiteDomain.trim()) {
      try {
        const parsed = new URL(normalizedWebsiteUrl);
        if (!parsed.hostname.includes('.')) {
          setWebsiteError('Enter a valid domain such as www.example.com.');
          return;
        }
      } catch {
        setWebsiteError('Enter a valid domain such as www.example.com.');
        return;
      }
    }

    if (step < 6) {
      setStep((s) => s + 1);
      return;
    }

    // Final onboarding step (Step 6 -> persist + provision initial agent + show Full Preview Stage)
    if (saving) return;
    setSaving(true);
    try {
      const payload = {
        referralSource,
        companySize,
        websiteUrl: normalizedWebsiteUrl,
        otherSourceSummary: otherSourceSummary.trim(),
        agentRole,
        instructions: instructions.trim(),
        techStack,
        deployChannels,
      };

      await saveOnboardingProgress(payload, true);

      // Provision starter agent & knowledge sources if workspace doesn't already have an agent
      if (activeWorkspace && agents.length === 0) {
        const domainHost = normalizedWebsiteUrl
          ? new URL(normalizedWebsiteUrl).hostname.replace(/^www\./, '')
          : '';
        const businessLabel =
          activeWorkspace.name?.replace(/'s Workspace$/i, '').trim() ||
          domainHost ||
          'My Business';
        const defaultVoice = VOICE_OPTIONS[0];
        const personality =
          agentRole === 'Sales & Lead Gen'
            ? 'Friendly'
            : agentRole === 'Technical Specialist'
              ? 'Professional'
              : 'Professional';

        const agentId = await addAgent({
          name: `${businessLabel} AI Agent`,
          businessName: businessLabel,
          description: `${agentRole} assistant trained on ${domainHost || 'company knowledge'}.`,
          personality,
          customInstructions: instructions.trim(),
          voiceId: defaultVoice.id,
          voiceLabel: `${defaultVoice.name} · ${defaultVoice.gender} · ${defaultVoice.language}`,
          language: defaultVoice.language,
          status: 'Active',
          websiteUrl: normalizedWebsiteUrl,
          welcomeMessage: `Hi! Ask me anything about ${businessLabel}.`,
          accentColor: '#171717',
          widgetPosition: 'bottom-right',
          widgetTheme: 'light',
          launcherLabel: 'Talk with us',
          leadCaptureEnabled: true,
        });

        if (normalizedWebsiteUrl) {
          const parsed = new URL(normalizedWebsiteUrl);
          const sourceId = await addWebsiteOrTextKnowledge({
            agentId,
            sourceType: 'website',
            sourceName: parsed.hostname + (parsed.pathname === '/' ? '' : parsed.pathname),
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
                }
              })
              .catch(() => {});
          }
        }

        if (otherSourceSummary.trim()) {
          await addWebsiteOrTextKnowledge({
            agentId,
            sourceType: 'text',
            sourceName: 'Onboarding Notes & FAQs',
            content: otherSourceSummary.trim(),
          });
        }
      }

      setPreviewReady(true);
    } catch (err) {
      pushToast({
        title: 'Unable to save setup',
        description:
          err instanceof Error ? err.message : 'Please check your connection and try again.',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  if (previewReady) {
    return (
      <OnboardingPreviewStage
        step={7}
        isFullStage
        userName={user?.fullName || 'Account Owner'}
        userEmail={user?.email || 'you@company.com'}
        companySize={companySize}
        websiteUrl={normalizedWebsiteUrl}
        otherSourceSummary={otherSourceSummary}
        agentRole={agentRole}
        instructions={instructions}
        techStack={techStack}
        deployChannels={deployChannels}
        onBackToEdit={() => setPreviewReady(false)}
        onContinueToPricing={() => router.push('/pricing')}
      />
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-white text-neutral-900 lg:h-screen lg:flex-row lg:overflow-hidden">
      {/* Left Form Column */}
      <section className="relative flex min-h-screen flex-1 flex-col items-center gap-8 bg-white px-5 pt-8 pb-24 lg:h-full lg:min-h-0 lg:gap-12 lg:overflow-y-auto lg:border-r lg:border-neutral-200 lg:px-8 lg:pt-12 lg:pb-8">
        {/* Top Header: Brand + Diamond Progress Indicator */}
        <header className="sticky top-0 z-10 flex w-full max-w-[452px] items-center justify-between bg-white py-3 lg:static lg:h-8 lg:py-0">
          <Link
            href="/"
            aria-label="Cadence home"
            className="flex items-center gap-2 text-neutral-950 whitespace-nowrap"
          >
            <BrandMark className="h-6 w-7 text-neutral-950" />
            <span className="font-display text-[19px] font-bold tracking-tight">
              Cadence
            </span>
          </Link>

          <nav
            role="progressbar"
            aria-label="Onboarding progress"
            aria-valuemin={1}
            aria-valuemax={6}
            aria-valuenow={step}
            className="flex items-center gap-2.5"
          >
            {[1, 2, 3, 4, 5, 6].map((idx) => {
              const isPast = idx < step;
              const isCurrent = idx === step;
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={!isPast}
                  onClick={() => {
                    if (isPast) setStep(idx);
                  }}
                  aria-label={`Step ${idx}`}
                  className={`size-2 rotate-45 rounded-[1.5px] transition-all ${
                    isCurrent
                      ? 'scale-110 bg-neutral-900 ring-2 ring-neutral-900/20'
                      : isPast
                        ? 'cursor-pointer bg-neutral-900 hover:scale-125'
                        : 'cursor-default bg-neutral-300'
                  }`}
                />
              );
            })}
          </nav>
        </header>

        {/* Main Step Content */}
        <div className="flex w-full max-w-[452px] flex-1 flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-6"
            >
              {/* STEP 1 */}
              {step === 1 && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <h1 className="text-[24px] leading-snug font-medium tracking-tight text-neutral-950">
                      How did you hear about us?
                    </h1>
                    <p className="text-sm text-neutral-500">
                      Just a quick question before we begin.
                    </p>
                  </div>

                  <fieldset className="flex flex-wrap gap-2">
                    <legend className="sr-only">How did you hear about us?</legend>
                    {REFERRAL_OPTIONS.map((opt) => (
                      <SelectableChip
                        key={opt.id}
                        option={opt}
                        selected={referralSource === opt.label}
                        onToggle={() =>
                          setReferralSource((prev) =>
                            prev === opt.label ? '' : opt.label
                          )
                        }
                      />
                    ))}
                  </fieldset>
                </>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <h1 className="text-[24px] leading-snug font-medium tracking-tight text-neutral-950">
                      What&apos;s your company size?
                    </h1>
                    <p className="text-sm text-neutral-500">
                      Select the option that best describes your team.
                    </p>
                  </div>

                  <fieldset className="flex flex-wrap gap-2">
                    <legend className="sr-only">Company size</legend>
                    {COMPANY_SIZE_OPTIONS.map((opt) => (
                      <SelectableChip
                        key={opt.id}
                        option={opt}
                        selected={companySize === opt.label}
                        onToggle={() =>
                          setCompanySize((prev) =>
                            prev === opt.label ? '' : opt.label
                          )
                        }
                      />
                    ))}
                  </fieldset>
                </>
              )}

              {/* STEP 3 */}
              {step === 3 && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <h1 className="text-[24px] leading-snug font-medium tracking-tight text-neutral-950">
                      How would you like to train your AI Agent?
                    </h1>
                    <p className="text-sm text-neutral-500">
                      Choose your primary knowledge source to get started.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-2">
                      <label
                        htmlFor="website-url"
                        className="text-sm font-medium text-neutral-900"
                      >
                        Your website (recommended)
                      </label>
                      <div className="flex h-10 w-full overflow-hidden rounded-lg border border-neutral-200 bg-white focus-within:border-neutral-900 focus-within:ring-2 focus-within:ring-neutral-900/10">
                        <span className="flex items-center border-r border-neutral-200 bg-neutral-50 px-3 text-sm text-neutral-500 select-none">
                          https://
                        </span>
                        <input
                          id="website-url"
                          type="text"
                          value={websiteDomain}
                          onChange={(e) => {
                            setWebsiteDomain(e.target.value);
                            if (websiteError) setWebsiteError('');
                          }}
                          placeholder="www.example.com"
                          className="w-full bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
                        />
                      </div>
                      {websiteError && (
                        <p className="text-xs text-rose-600">{websiteError}</p>
                      )}
                      <div className="flex items-start gap-2 text-xs text-neutral-500">
                        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" />
                        <span>
                          This URL will be crawled to train your AI Agent. You can add more sources later.
                        </span>
                      </div>
                    </div>

                    <div className="mt-1 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-neutral-900">
                          Other sources
                        </span>
                        {otherSourceSummary.trim() && (
                          <span className="inline-flex items-center gap-1 rounded-[4px] bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700">
                            <Check className="h-3 w-3" />
                            Notes added
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setDraftOtherSource(otherSourceSummary);
                          setOtherSourcesOpen(true);
                        }}
                        className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-neutral-300 bg-neutral-50/40 px-4 text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-400 hover:bg-neutral-50"
                      >
                        <Plus className="h-4 w-4 text-neutral-500" />
                        <span>
                          {otherSourceSummary.trim()
                            ? 'Edit Notion, Files, or Text notes'
                            : 'Add Notion, Files, Text and more'}
                        </span>
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* STEP 4 */}
              {step === 4 && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <h1 className="text-[24px] leading-snug font-medium tracking-tight text-neutral-950">
                      Customize your agent&apos;s personality
                    </h1>
                    <p className="text-sm text-neutral-500">
                      Define how your AI Agent communicates with your customers.
                    </p>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="agent-role"
                        className="text-sm font-medium text-neutral-900"
                      >
                        Role
                      </label>
                      <div className="relative">
                        <select
                          id="agent-role"
                          value={agentRole}
                          onChange={(e) => handleRoleChange(e.target.value)}
                          className="h-10 w-full appearance-none rounded-lg border border-neutral-200 bg-white pr-9 pl-3.5 text-sm font-medium text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                        >
                          {ROLE_PRESETS.map((preset) => (
                            <option key={preset.id} value={preset.id}>
                              {preset.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="instructions"
                          className="text-sm font-medium text-neutral-900"
                        >
                          Instructions
                        </label>
                        <span className="font-mono text-[11px] text-neutral-400 tabular-nums">
                          {instructions.length} / 2000
                        </span>
                      </div>
                      <textarea
                        id="instructions"
                        maxLength={2000}
                        rows={6}
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        placeholder="Describe how your agent should respond to visitors..."
                        className="w-full resize-none rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm leading-relaxed text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* STEP 5 */}
              {step === 5 && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <h1 className="text-[24px] leading-snug font-medium tracking-tight text-neutral-950">
                      Select the tools in your tech stack
                    </h1>
                    <p className="text-sm text-neutral-500">
                      We&apos;ll highlight the relevant integrations for your workflow.
                    </p>
                  </div>

                  <div className="flex flex-col gap-5">
                    <fieldset className="flex flex-wrap gap-2">
                      <legend className="mb-2 text-xs font-medium text-neutral-500">
                        Actions
                      </legend>
                      {ACTION_STACK_OPTIONS.map((opt) => (
                        <SelectableChip
                          key={opt.id}
                          option={opt}
                          selected={techStack.includes(opt.label)}
                          onToggle={() =>
                            toggleMultiItem(techStack, setTechStack, opt.label)
                          }
                        />
                      ))}
                    </fieldset>

                    <fieldset className="flex flex-wrap gap-2">
                      <legend className="mb-2 text-xs font-medium text-neutral-500">
                        Helpdesk tools
                      </legend>
                      {HELPDESK_STACK_OPTIONS.map((opt) => (
                        <SelectableChip
                          key={opt.id}
                          option={opt}
                          selected={techStack.includes(opt.label)}
                          onToggle={() =>
                            toggleMultiItem(techStack, setTechStack, opt.label)
                          }
                        />
                      ))}
                    </fieldset>
                  </div>
                </>
              )}

              {/* STEP 6 */}
              {step === 6 && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <h1 className="text-[24px] leading-snug font-medium tracking-tight text-neutral-950">
                      Where will you be deploying your AI agents?
                    </h1>
                    <p className="text-sm text-neutral-500">
                      Choose all the channels where you want your AI Agent to interact.
                    </p>
                  </div>

                  <fieldset className="flex flex-wrap gap-2">
                    <legend className="sr-only">Deployment channels</legend>
                    {DEPLOY_CHANNEL_OPTIONS.map((opt) => (
                      <SelectableChip
                        key={opt.id}
                        option={opt}
                        selected={deployChannels.includes(opt.label)}
                        onToggle={() =>
                          toggleMultiItem(
                            deployChannels,
                            setDeployChannels,
                            opt.label
                          )
                        }
                      />
                    ))}
                  </fieldset>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Navigation Bar */}
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-neutral-200 bg-white px-5 py-4 lg:static lg:z-auto lg:w-full lg:max-w-[452px] lg:border-0 lg:bg-transparent lg:p-0">
          <div className="mx-auto flex max-w-[452px] items-center justify-end gap-2">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                data-testid="onboarding-back"
                className="inline-flex h-10 items-center justify-center rounded-lg border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-50"
              >
                Back
              </button>
            )}
            <button
              type="button"
              disabled={!canProceed || saving}
              onClick={handleNext}
              data-testid="onboarding-continue"
              className="inline-flex h-10 flex-1 items-center justify-center rounded-lg bg-[#171717] px-4 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:pointer-events-none disabled:opacity-45"
            >
              {saving ? 'Building your agent...' : 'Continue'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="hidden w-full max-w-[452px] items-center justify-between text-xs text-neutral-500 lg:flex">
          <span>© 2026 Cadence</span>
          <nav className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setLegalDialog('terms')}
              className="transition-colors hover:text-neutral-900"
            >
              Terms
            </button>
            <span aria-hidden="true" className="block h-3 w-px bg-neutral-200" />
            <button
              type="button"
              onClick={() => setLegalDialog('privacy')}
              className="transition-colors hover:text-neutral-900"
            >
              Privacy
            </button>
          </nav>
        </footer>
      </section>

      {/* Right Live Blueprint Preview Column (Desktop) */}
      <div className="hidden lg:flex lg:flex-1">
        <OnboardingPreviewStage
          step={step}
          userName={user?.fullName || 'Account Owner'}
          userEmail={user?.email || 'you@company.com'}
          companySize={companySize}
          websiteUrl={normalizedWebsiteUrl}
          otherSourceSummary={otherSourceSummary}
          agentRole={agentRole}
          instructions={instructions}
          techStack={techStack}
          deployChannels={deployChannels}
        />
      </div>

      {/* Other Sources Modal */}
      {otherSourcesOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="other-sources-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/40 p-4 backdrop-blur-[1px]"
        >
          <div className="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="other-sources-title"
                  className="text-base font-semibold text-neutral-950"
                >
                  Add Notion, FAQ, or Text Knowledge
                </h2>
                <p className="mt-1 text-xs text-neutral-500">
                  Paste product notes, pricing details, or support guidelines to train your agent immediately.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOtherSourcesOpen(false)}
                aria-label="Close modal"
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <textarea
              rows={6}
              maxLength={2000}
              value={draftOtherSource}
              onChange={(e) => setDraftOtherSource(e.target.value)}
              placeholder="e.g., Support hours: Mon–Fri 9am–6pm EST. Refund policy: 30-day money-back guarantee on annual plans..."
              className="mt-4 w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none"
            />

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setOtherSourcesOpen(false)}
                className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setOtherSourceSummary(draftOtherSource.trim());
                  setOtherSourcesOpen(false);
                }}
                className="rounded-lg bg-[#171717] px-4 py-2 text-xs font-medium text-white hover:bg-neutral-800"
              >
                Save notes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terms / Privacy Info Modal */}
      {legalDialog && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/40 p-4 backdrop-blur-[1px]"
        >
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-neutral-950">
                {legalDialog === 'terms' ? 'Cadence Terms of Service' : 'Cadence Privacy Notice'}
              </h2>
              <button
                type="button"
                onClick={() => setLegalDialog(null)}
                aria-label="Close modal"
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600">
              {legalDialog === 'terms'
                ? 'Your Cadence workspace, voice chatbots, and indexed knowledge sources belong exclusively to your organization. You control allowed domains and agent activation at all times.'
                : 'Cadence stores workspace profiles and knowledge snippets inside isolated tenant databases. Visitor transcripts and leads are readable only by verified workspace members.'}
            </p>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setLegalDialog(null)}
                className="rounded-lg bg-[#171717] px-4 py-2 text-xs font-medium text-white hover:bg-neutral-800"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
