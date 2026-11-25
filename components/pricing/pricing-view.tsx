'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowUpCircle,
  AudioLines,
  BarChart2,
  Code2,
  Cpu,
  FileCheck,
  FileSearch,
  Headphones,
  Info,
  KeyRound,
  LayoutGrid,
  LifeBuoy,
  Lightbulb,
  Megaphone,
  Palette,
  Phone,
  Puzzle,
  Receipt,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Ticket,
  TrendingUp,
  UserCheck,
  UserCog,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { useApp } from '@/components/providers/app-provider';
import { BrandMark } from '@/components/ui/brand-loader';
import { BillingCycle, PlanTier } from '@/lib/types';

interface FeatureItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tooltip?: string;
}

const BASIC_FEATURES: FeatureItem[] = [
  {
    label: 'Access to frontier models',
    icon: Sparkles,
    tooltip: 'Includes access to Gemini 2.5 Flash, GPT-4o, and Claude Sonnet models.',
  },
  {
    label: 'Unlimited members, no seat fees',
    icon: Users,
    tooltip: 'Invite your entire support, sales, and engineering team at zero extra per-seat cost.',
  },
  {
    label: 'Integrations',
    icon: Puzzle,
    tooltip: 'Connect Slack, Shopify, Stripe, Calendly, and custom webhooks.',
  },
  {
    label: 'Actions & Procedures',
    icon: Zap,
    tooltip: 'Trigger API workflows, capture leads, and run automated booking actions.',
  },
  {
    label: 'Widgets',
    icon: LayoutGrid,
    tooltip: 'Customize floating chat bubbles, voice orbs, and embedded website widgets.',
  },
  {
    label: 'MCP',
    icon: Cpu,
    tooltip: 'Connect external Model Context Protocol servers to extend your agent capabilities.',
  },
  { label: 'Basic analytics', icon: BarChart2 },
  { label: 'API access', icon: Code2 },
  {
    label: 'Personalization',
    icon: SlidersHorizontal,
    tooltip: 'Pass visitor context and tailor replies automatically by page or user profile.',
  },
  {
    label: 'Auto-resync agents',
    icon: RefreshCw,
    tooltip: 'Automatically re-crawl website URLs on schedule so answers never go stale.',
  },
  {
    label: 'Helpdesk',
    icon: Headphones,
    tooltip: 'Seamless human escalation and conversation inbox handoff.',
  },
  { label: 'Voice', icon: AudioLines },
  { label: 'Outbound campaigns', icon: Megaphone },
  {
    label: 'Telephony',
    icon: Phone,
    tooltip: 'Provision local or toll-free phone numbers for inbound and outbound voice.',
  },
];

const BUSINESS_FEATURES: FeatureItem[] = [
  {
    label: 'Advanced analytics',
    icon: TrendingUp,
    tooltip: 'Topic clustering, sentiment scoring, resolution funnels, and conversion attribution.',
  },
  {
    label: 'Sources suggestions',
    icon: Lightbulb,
    tooltip: 'AI identifies unanswered visitor questions and recommends new docs to index.',
  },
  {
    label: 'Tickets and Zendesk macros as sources',
    icon: Ticket,
    tooltip: 'Train directly on historical resolved support tickets and approved helpdesk macros.',
  },
];

const ENTERPRISE_FEATURES: FeatureItem[] = [
  { label: 'Higher limits', icon: ArrowUpCircle },
  {
    label: 'Flexible billing',
    icon: Receipt,
    tooltip: 'Annual invoicing, purchase orders, and custom credit pooling across workspaces.',
  },
  { label: 'Custom roles & permissions', icon: UserCog },
  { label: 'SSO', icon: KeyRound },
  { label: 'White-labeling', icon: Palette },
  { label: 'Audit logs', icon: FileSearch },
  { label: 'HIPAA-eligible', icon: ShieldCheck },
  { label: 'Priority support', icon: LifeBuoy },
  { label: 'Success manager (CSM)', icon: UserCheck },
  { label: 'SLAs', icon: FileCheck },
];

function FeatureRow({ item }: { item: FeatureItem }) {
  const Icon = item.icon;
  return (
    <li className="group relative flex items-center gap-2.5 text-[14px] text-neutral-700">
      <Icon className="h-4 w-4 shrink-0 text-neutral-500" />
      {item.tooltip ? (
        <span
          tabIndex={0}
          className="cursor-help border-b border-dotted border-neutral-400 text-neutral-800 outline-none"
        >
          {item.label}
          <span className="pointer-events-none absolute bottom-full left-6 z-20 mb-2 hidden w-60 rounded-lg border border-neutral-200 bg-neutral-900 px-3 py-2 text-xs leading-relaxed text-white shadow-lg group-hover:block group-focus-within:block">
            {item.tooltip}
          </span>
        </span>
      ) : (
        <span>{item.label}</span>
      )}
    </li>
  );
}

export function PricingView() {
  const router = useRouter();
  const {
    firebaseUser,
    isEmailVerified,
    user,
    activeWorkspace,
    selectPricingPlan,
    pushToast,
  } = useApp();

  const [yearly, setYearly] = useState(false);
  const [submittingPlan, setSubmittingPlan] = useState<string | null>(null);
  const [enterpriseOpen, setEnterpriseOpen] = useState(false);
  const [enterpriseCompany, setEnterpriseCompany] = useState(
    activeWorkspace?.name || ''
  );
  const [enterpriseNotes, setEnterpriseNotes] = useState('');

  const billingCycle: BillingCycle = yearly ? 'yearly' : 'monthly';
  const basicPrice = yearly ? '$120' : '$150';
  const businessPrice = yearly ? '$400' : '$500';
  const billingLabel = yearly ? 'billed yearly' : 'billed monthly';

  const handleSelectPlan = async (
    planName: PlanTier,
    mode: 'trial' | 'buy_now'
  ) => {
    if (!firebaseUser || !isEmailVerified) {
      router.push(`/signup?plan=${encodeURIComponent(planName)}&cycle=${billingCycle}`);
      return;
    }

    const key = `${planName}-${mode}`;
    if (submittingPlan) return;
    setSubmittingPlan(key);

    try {
      await selectPricingPlan({
        planName,
        billingCycle,
        subscriptionStatus: mode === 'trial' ? 'trialing' : 'active',
        billingProvider: 'self_serve',
      });
      pushToast({
        title:
          mode === 'trial'
            ? `${planName} 7-day trial activated`
            : `${planName} plan selected`,
        description: 'Welcome to your Cadence workspace.',
        variant: 'success',
      });
      router.push('/dashboard');
    } catch (err) {
      pushToast({
        title: 'Unable to save plan',
        description:
          err instanceof Error ? err.message : 'Please try again shortly.',
        variant: 'error',
      });
      setSubmittingPlan(null);
    }
  };

  const handleEnterpriseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser || !isEmailVerified) {
      router.push('/signup?plan=Enterprise');
      return;
    }

    setSubmittingPlan('Enterprise-contact');
    try {
      await selectPricingPlan({
        planName: 'Enterprise',
        billingCycle,
        subscriptionStatus: 'active',
        billingProvider: 'enterprise_sales',
        enterpriseContact: {
          company: enterpriseCompany.trim() || activeWorkspace?.name || 'Organization',
          notes: enterpriseNotes.trim() || 'Requested custom enterprise walkthrough.',
        },
      });
      setEnterpriseOpen(false);
      pushToast({
        title: 'Enterprise inquiry recorded',
        description: 'Our solutions team will reach out shortly. Opening your workspace.',
        variant: 'success',
      });
      router.push('/dashboard');
    } catch (err) {
      pushToast({
        title: 'Unable to submit inquiry',
        description:
          err instanceof Error ? err.message : 'Please try again shortly.',
        variant: 'error',
      });
      setSubmittingPlan(null);
    }
  };

  return (
    <section className="min-h-screen bg-[#F5F5F4] px-4 py-8 text-neutral-900 sm:px-6 lg:py-12">
      <div className="mx-auto flex w-full max-w-[1160px] flex-col gap-10 lg:gap-12">
        {/* Top Header */}
        <header className="flex w-full items-center justify-between">
          <Link
            href="/"
            aria-label="Cadence home"
            className="flex items-center gap-2 text-neutral-950 whitespace-nowrap"
          >
            <BrandMark className="h-6 w-7 text-neutral-950" />
            <span className="font-display text-[20px] font-bold tracking-tight">
              Cadence
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {firebaseUser && user?.planSelected ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Dashboard
              </Link>
            ) : !firebaseUser ? (
              <Link
                href="/login"
                className="text-sm font-medium text-neutral-700 hover:text-neutral-950"
              >
                Log in
              </Link>
            ) : (
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-900"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to setup
              </Link>
            )}
          </div>
        </header>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex w-full flex-col gap-6"
        >
          {/* Heading & Yearly Toggle */}
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <h1 className="text-[32px] leading-tight font-medium tracking-tight text-neutral-950">
              Choose your plan
            </h1>

            <div className="flex items-center gap-2.5">
              <button
                id="yearly-toggle"
                type="button"
                role="switch"
                aria-checked={yearly}
                onClick={() => setYearly((prev) => !prev)}
                className={`relative inline-flex h-[18px] w-8 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 ${
                  yearly ? 'bg-[#171717]' : 'bg-neutral-300'
                }`}
              >
                <span
                  className={`pointer-events-none block size-3.5 rounded-full bg-white shadow-xs transition-transform ${
                    yearly ? 'translate-x-[15px]' : 'translate-x-[1px]'
                  }`}
                />
              </button>
              <label
                htmlFor="yearly-toggle"
                className="cursor-pointer text-sm font-medium text-neutral-900 select-none"
              >
                Yearly
              </label>
              <span className="rounded-[4px] border border-[#FFD1BC] bg-[#FFEDE5] px-1.5 py-0.5 text-[11px] font-medium text-[#D94608] whitespace-nowrap">
                20% off
              </span>
            </div>
          </div>

          {/* 3-Column Pricing Table */}
          <div className="grid grid-cols-1 divide-y divide-neutral-200 overflow-hidden rounded-xl border border-neutral-200 bg-white lg:grid-cols-3 lg:divide-x lg:divide-y-0">
            {/* Column 1: Basic */}
            <div className="flex flex-col">
              <div className="h-2 w-full bg-[#B0067E]" />
              <div className="flex flex-1 flex-col gap-6 p-6 lg:p-8">
                {/* Title + Price + Credits */}
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <h2 className="text-[20px] font-medium tracking-tight text-neutral-950">
                        Basic
                      </h2>
                      <span className="rounded-[4px] bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-700">
                        Popular
                      </span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="flex items-baseline gap-1 text-neutral-950 tabular-nums">
                        <span className="text-[36px] leading-none font-medium tracking-tight">
                          {basicPrice}
                        </span>
                        <span className="text-[18px] text-neutral-500">/m</span>
                      </div>
                      <span className="text-sm text-neutral-500">
                        {billingLabel}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-sm text-neutral-600 tabular-nums">
                    <span>
                      <strong className="font-medium text-neutral-950">4,000</strong>{' '}
                      msg credits /m
                    </span>
                    <span className="group relative inline-flex">
                      <Info className="h-3.5 w-3.5 cursor-help text-neutral-400" />
                      <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-56 -translate-x-1/2 rounded-lg bg-neutral-900 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
                        Each visitor message or voice turn consumes 1–2 message credits depending on the model.
                      </span>
                    </span>
                  </div>
                </div>

                {/* CTAs */}
                <div className="flex flex-col items-center gap-2">
                  <button
                    type="button"
                    disabled={Boolean(submittingPlan)}
                    onClick={() => handleSelectPlan('Basic', 'trial')}
                    className="flex h-10 w-full items-center justify-center rounded-lg bg-[#171717] px-4 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-60"
                  >
                    {submittingPlan === 'Basic-trial'
                      ? 'Activating trial...'
                      : 'Start 7-day trial'}
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(submittingPlan)}
                    onClick={() => handleSelectPlan('Basic', 'buy_now')}
                    className="flex h-8 w-full items-center justify-center rounded-md text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-950 disabled:opacity-60"
                  >
                    {submittingPlan === 'Basic-buy_now'
                      ? 'Selecting Basic...'
                      : 'or buy now'}
                  </button>
                </div>

                {/* Features */}
                <ul className="flex flex-col gap-3">
                  {BASIC_FEATURES.map((item) => (
                    <FeatureRow key={item.label} item={item} />
                  ))}
                </ul>
              </div>
            </div>

            {/* Column 2: Business */}
            <div className="flex flex-col">
              <div className="h-2 w-full bg-[#D97706]" />
              <div className="flex flex-1 flex-col gap-6 p-6 lg:p-8">
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-3">
                    <h2 className="text-[20px] font-medium tracking-tight text-neutral-950">
                      Business
                    </h2>

                    <div className="flex flex-col gap-1">
                      <div className="flex items-baseline gap-1 text-neutral-950 tabular-nums">
                        <span className="text-[36px] leading-none font-medium tracking-tight">
                          {businessPrice}
                        </span>
                        <span className="text-[18px] text-neutral-500">/m</span>
                      </div>
                      <span className="text-sm text-neutral-500">
                        {billingLabel}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-sm text-neutral-600 tabular-nums">
                    <span>
                      <strong className="font-medium text-neutral-950">15,000</strong>{' '}
                      msg credits /m
                    </span>
                    <span className="group relative inline-flex">
                      <Info className="h-3.5 w-3.5 cursor-help text-neutral-400" />
                      <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-56 -translate-x-1/2 rounded-lg bg-neutral-900 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
                        High-volume credit pool shared across all agents and channels in your workspace.
                      </span>
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <button
                    type="button"
                    disabled={Boolean(submittingPlan)}
                    onClick={() => handleSelectPlan('Business', 'trial')}
                    className="flex h-10 w-full items-center justify-center rounded-lg border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-950 transition-colors hover:bg-neutral-50 disabled:opacity-60"
                  >
                    {submittingPlan === 'Business-trial'
                      ? 'Activating trial...'
                      : 'Start 7-day trial'}
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(submittingPlan)}
                    onClick={() => handleSelectPlan('Business', 'buy_now')}
                    className="flex h-8 w-full items-center justify-center rounded-md text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-950 disabled:opacity-60"
                  >
                    {submittingPlan === 'Business-buy_now'
                      ? 'Selecting Business...'
                      : 'or buy now'}
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  <p className="text-sm font-medium text-neutral-950">
                    Everything in Basic, plus
                  </p>
                  <ul className="flex flex-col gap-3">
                    {BUSINESS_FEATURES.map((item) => (
                      <FeatureRow key={item.label} item={item} />
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Column 3: Enterprise */}
            <div className="flex flex-col">
              <div className="h-2 w-full bg-[#0891B2]" />
              <div className="flex flex-1 flex-col gap-6 p-6 lg:p-8">
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-3">
                    <h2 className="text-[20px] font-medium tracking-tight text-neutral-950">
                      Enterprise
                    </h2>

                    <div className="flex flex-col gap-1">
                      <span className="text-[36px] leading-none font-medium tracking-tight text-neutral-950">
                        Let&apos;s talk
                      </span>
                      <span className="mt-1 text-sm text-neutral-500">
                        Power at your pace with custom solutions.
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-2 lg:pt-7">
                  <button
                    type="button"
                    disabled={Boolean(submittingPlan)}
                    onClick={() => setEnterpriseOpen(true)}
                    className="flex h-10 w-full items-center justify-center rounded-lg border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-950 transition-colors hover:bg-neutral-50 disabled:opacity-60"
                  >
                    Contact us
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  <p className="text-sm font-medium text-neutral-950">
                    Everything in Business, plus
                  </p>
                  <ul className="flex flex-col gap-3">
                    {ENTERPRISE_FEATURES.map((item) => (
                      <FeatureRow key={item.label} item={item} />
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Enterprise Contact Modal */}
      {enterpriseOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="enterprise-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/40 p-4 backdrop-blur-[1px]"
        >
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="enterprise-modal-title"
                  className="text-base font-semibold text-neutral-950"
                >
                  Enterprise Solutions
                </h2>
                <p className="mt-1 text-xs text-neutral-500">
                  Tell us about your security, volume, and SLA needs. We&apos;ll unlock your workspace immediately while our team reaches out.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEnterpriseOpen(false)}
                aria-label="Close modal"
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleEnterpriseSubmit} className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="enterprise-company"
                  className="block text-xs font-medium text-neutral-700"
                >
                  Company name
                </label>
                <input
                  id="enterprise-company"
                  type="text"
                  required
                  maxLength={120}
                  value={enterpriseCompany}
                  onChange={(e) => setEnterpriseCompany(e.target.value)}
                  placeholder="Acme Corporation"
                  className="mt-1.5 h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="enterprise-notes"
                  className="block text-xs font-medium text-neutral-700"
                >
                  Requirements (optional)
                </label>
                <textarea
                  id="enterprise-notes"
                  rows={3}
                  maxLength={1000}
                  value={enterpriseNotes}
                  onChange={(e) => setEnterpriseNotes(e.target.value)}
                  placeholder="SSO/SAML, HIPAA BAA, dedicated CSM, expected monthly volume..."
                  className="mt-1.5 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEnterpriseOpen(false)}
                  className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPlan === 'Enterprise-contact'}
                  className="rounded-lg bg-[#171717] px-4 py-2 text-xs font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
                >
                  {submittingPlan === 'Enterprise-contact'
                    ? 'Submitting...'
                    : 'Submit & Open Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
