'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Bot,
  Code2,
  LayoutDashboard,
  LogOut,
  MailCheck,
  Menu,
  MessageSquare,
  MessageSquareMore,
  MessageSquareText,
  Mic,
  Puzzle,
  RefreshCw,
  ScrollText,
  Settings,
  UserPlus,
  X,
} from 'lucide-react';
import {
  PiChatCenteredTextFill,
  PiChatTextFill,
  PiCpuDuotone,
  PiCreditCardDuotone,
  PiGaugeDuotone,
  PiRobotDuotone,
  PiScrollDuotone,
  PiUserCircleDuotone,
} from 'react-icons/pi';
import { useApp } from '@/components/providers/app-provider';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { BrandLoader, BrandMark } from '@/components/ui/brand-loader';
import { AccountDropdown } from '@/components/layout/account-dropdown';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Chatbots', icon: LayoutDashboard },
  { href: '/agents', label: 'Voice Chatbots', icon: Bot },
  { href: '/knowledge-base', label: 'Knowledge Sources', icon: BookOpen },
  { href: '/voice-test', label: 'Voice Chat Test', icon: Mic },
  { href: '/embed', label: 'Embed & Install', icon: Code2 },
  { href: '/calls', label: 'Conversation Logs', icon: MessageSquare },
  { href: '/leads', label: 'Leads', icon: UserPlus },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/integrations', label: 'Integrations', icon: Puzzle },
  { href: '/docs', label: 'Docs', icon: ScrollText },
  { href: '/settings', label: 'Settings', icon: Settings },
] as const;

type HubIconComponent = React.ComponentType<{
  className?: string;
  'aria-hidden'?: boolean;
}>;

type HubNavItem =
  | { type: 'link'; href: string; label: string; icon: HubIconComponent }
  | { type: 'action'; action: 'support' | 'feedback'; label: string; icon: HubIconComponent };

const HUB_NAV_ITEMS: HubNavItem[] = [
  { type: 'link', href: '/dashboard', label: 'Chatbots', icon: PiCpuDuotone },
  { type: 'link', href: '/agents', label: 'Agents', icon: PiRobotDuotone },
  { type: 'link', href: '/pricing', label: 'Billing', icon: PiCreditCardDuotone },
  { type: 'link', href: '/analytics', label: 'Usage', icon: PiGaugeDuotone },
  { type: 'link', href: '/profile', label: 'Profile', icon: PiUserCircleDuotone },
  { type: 'link', href: '/docs', label: 'Docs', icon: PiScrollDuotone },
  { type: 'action', action: 'support', label: 'Support', icon: PiChatCenteredTextFill },
  { type: 'action', action: 'feedback', label: 'Feedback', icon: PiChatTextFill },
];

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/embed/widget',
  '/pricing',
  '/docs',
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    authReady,
    isReady,
    firebaseUser,
    isEmailVerified,
    backendError,
    user,
    activeWorkspace,
    logout,
    resendVerificationEmail,
    refreshAuthUser,
    pushToast,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [verifyingCheck, setVerifyingCheck] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);

  const isPublicRoute =
    pathname === '/' ||
    PUBLIC_ROUTES.some((route) => route !== '/' && pathname.startsWith(route));
  const isOnboardingRoute = pathname.startsWith('/onboarding');
  const isPricingRoute = pathname.startsWith('/pricing');

  useEffect(() => {
    if (!isPublicRoute && authReady && !firebaseUser) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (
      !isPublicRoute &&
      authReady &&
      firebaseUser &&
      isEmailVerified &&
      isReady &&
      user
    ) {
      if (!user.onboardingCompleted && !isOnboardingRoute) {
        router.replace('/onboarding');
      } else if (
        user.onboardingCompleted &&
        !user.planSelected &&
        !isPricingRoute
      ) {
        router.replace('/pricing');
      }
    }
  }, [
    isPublicRoute,
    isOnboardingRoute,
    isPricingRoute,
    authReady,
    isReady,
    firebaseUser,
    isEmailVerified,
    user,
    pathname,
    router,
  ]);

  if (isPublicRoute) {
    return <ErrorBoundary>{children}</ErrorBoundary>;
  }

  if (!authReady || !firebaseUser) {
    return <BrandLoader />;
  }

  if (!isEmailVerified) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-4">
        <div className="w-full max-w-md rounded-xl border border-neutral-200 bg-white p-6 text-center shadow-xs">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <MailCheck className="h-5 w-5" />
          </div>
          <h1 className="mt-4 text-lg font-semibold text-neutral-900">
            Verify your email address
          </h1>
          <p className="mt-1.5 text-sm text-neutral-600">
            We sent a verification link to{' '}
            <span className="font-medium text-neutral-900">
              {firebaseUser.email}
            </span>
            . Confirm your email before accessing your workspace.
          </p>

          <div className="mt-6 space-y-2.5">
            <button
              type="button"
              disabled={verifyingCheck}
              onClick={async () => {
                setVerifyingCheck(true);
                try {
                  const verified = await refreshAuthUser();
                  if (!verified) {
                    pushToast({
                      title: 'Not verified yet',
                      description: 'Please click the link in your inbox, then try again.',
                    });
                  } else {
                    pushToast({ title: 'Email verified', variant: 'success' });
                  }
                } catch (err) {
                  pushToast({
                    title: 'Check failed',
                    description:
                      err instanceof Error ? err.message : 'Unable to verify status.',
                    variant: 'error',
                  });
                } finally {
                  setVerifyingCheck(false);
                }
              }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${verifyingCheck ? 'animate-spin' : ''}`}
              />
              I verified my email — continue
            </button>

            <button
              type="button"
              disabled={resendingEmail}
              onClick={async () => {
                setResendingEmail(true);
                try {
                  await resendVerificationEmail();
                  pushToast({
                    title: 'Verification email sent',
                    description: `Check ${firebaseUser.email} (including spam).`,
                    variant: 'success',
                  });
                } catch (err) {
                  pushToast({
                    title: 'Unable to send email',
                    description:
                      err instanceof Error ? err.message : 'Try again shortly.',
                    variant: 'error',
                  });
                } finally {
                  setResendingEmail(false);
                }
              }}
              className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
            >
              {resendingEmail ? 'Sending...' : 'Resend verification email'}
            </button>

            <button
              type="button"
              onClick={async () => {
                await logout();
                router.push('/login');
              }}
              className="w-full rounded-lg px-4 py-2 text-xs font-medium text-neutral-500 hover:text-neutral-800"
            >
              Sign out and use a different account
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isReady) {
    return <BrandLoader />;
  }

  if (
    user &&
    ((!user.onboardingCompleted && !isOnboardingRoute) ||
      (user.onboardingCompleted && !user.planSelected && !isPricingRoute))
  ) {
    return <BrandLoader />;
  }

  if (isOnboardingRoute) {
    return <ErrorBoundary>{children}</ErrorBoundary>;
  }

  const isHubRoute =
    pathname === '/dashboard' ||
    pathname === '/create-chatbot' ||
    pathname === '/profile';
  const isChatbotWorkspaceRoute =
    pathname.startsWith('/agents/') && pathname !== '/agents';



  const handleSignOut = async () => {
    await logout();
    router.push('/login');
  };

  const SidebarContent = (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-14 items-center justify-between border-b border-neutral-200 px-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-neutral-900 whitespace-nowrap shrink-0"
          onClick={() => setMobileMenuOpen(false)}
        >
          <BrandMark className="h-7 w-7 text-blue-600" />
          <span className="font-display text-lg font-bold tracking-tight">
            Cadence
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Close navigation"
          className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 lg:hidden"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="border-b border-neutral-200 p-3">
        <div className="flex w-full items-center gap-2.5 rounded-lg border border-neutral-200 bg-neutral-50/80 px-3 py-2 text-left">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-600 text-xs font-semibold text-white">
            {activeWorkspace?.name?.[0]?.toUpperCase() || 'W'}
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-neutral-900">
              {activeWorkspace?.name || 'Workspace'}
            </p>
            <p className="truncate text-[11px] text-neutral-500">
              {activeWorkspace ? `${activeWorkspace.planName} Plan` : 'Active'}
            </p>
          </div>
        </div>
      </div>

      <nav
        aria-label="Primary navigation"
        className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              target={item.href === '/docs' ? '_blank' : undefined}
              rel={item.href === '/docs' ? 'noopener noreferrer' : undefined}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                active
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${
                  active ? 'text-blue-600' : 'text-neutral-400'
                }`}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-neutral-200 p-3">
        <div className="flex items-center justify-between gap-2 px-2 py-1">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
              {user?.initials || 'U'}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-neutral-900">
                {user?.fullName || firebaseUser.displayName || 'Account'}
              </p>
              <p className="truncate text-[11px] text-neutral-500">
                {user?.email || firebaseUser.email}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            aria-label="Logout"
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-rose-50 hover:text-rose-600"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      {isChatbotWorkspaceRoute ? (
        <>
          {backendError && (
            <div className="border-b border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-700">
              <div className="mx-auto flex max-w-6xl items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{backendError}</span>
              </div>
            </div>
          )}
          <ErrorBoundary>{children}</ErrorBoundary>
        </>
      ) : isHubRoute ? (
        <div className="flex min-h-screen flex-col bg-white text-gray-900">
          <header className="sticky top-0 z-30 shrink-0 border-b border-gray-200 bg-white">
            <div className="mx-auto max-w-[86rem] px-4 sm:px-6">
              <div className="flex h-16 items-center justify-between gap-4">
                <Link
                  href="/dashboard"
                  className="mr-auto flex shrink-0 items-center gap-2 text-gray-950 whitespace-nowrap lg:mx-0 lg:-ml-2 lg:gap-2.5"
                >
                  <BrandMark className="h-7 w-8 text-blue-600 lg:h-9 lg:w-10" />
                  <span className="font-display text-lg font-bold tracking-tight text-gray-950 lg:text-[22px] lg:leading-none">
                    Cadence
                  </span>
                </Link>

                <nav
                  aria-label="Dashboard navigation"
                  className="hidden lg:flex lg:items-center lg:justify-center lg:gap-1.5 xl:gap-3"
                >
                  {HUB_NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    if (item.type === 'action') {
                      const handleClick =
                        item.action === 'support'
                          ? () => setSupportModalOpen(true)
                          : () => setFeedbackModalOpen(true);
                      return (
                        <button
                          key={item.label}
                          type="button"
                          onClick={handleClick}
                          className="group inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-gray-600 transition-all duration-150 hover:bg-gray-100 hover:text-gray-900 whitespace-nowrap shrink-0"
                        >
                          <Icon
                            aria-hidden={true}
                            className="h-5 w-5 shrink-0 text-gray-500 transition-all duration-150 group-hover:text-gray-900"
                          />
                          <span>{item.label}</span>
                        </button>
                      );
                    }

                    const active =
                      item.href === '/dashboard'
                        ? pathname === '/dashboard'
                        : pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        target={item.href === '/docs' ? '_blank' : undefined}
                        rel={item.href === '/docs' ? 'noopener noreferrer' : undefined}
                        aria-current={active ? 'page' : undefined}
                        className={`group inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-all duration-150 whitespace-nowrap shrink-0 ${
                          active
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                      >
                        <Icon
                          aria-hidden={true}
                          className={`h-5 w-5 shrink-0 transition-all duration-150 ${
                            active
                              ? 'text-blue-600'
                              : 'text-gray-500 group-hover:text-gray-900'
                          }`}
                        />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>

                <div className="flex items-center">
                  <AccountDropdown
                    onOpenSupport={() => setSupportModalOpen(true)}
                    onOpenFeedback={() => setFeedbackModalOpen(true)}
                  />
                </div>
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1 bg-white">
            <div
              className={
                pathname === '/create-chatbot'
                  ? 'mx-auto max-w-screen-2xl px-4 py-6 sm:px-6'
                  : 'px-4 py-6 sm:px-6 sm:py-8'
              }
            >
              {backendError && (
                <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{backendError}</span>
                </div>
              )}
              <ErrorBoundary>{children}</ErrorBoundary>
            </div>
          </main>
        </div>
      ) : (
        <div className="flex min-h-screen bg-neutral-50 text-neutral-900">
          <aside className="hidden w-64 shrink-0 border-r border-neutral-200 bg-white lg:block">
            <div className="sticky top-0 h-screen">{SidebarContent}</div>
          </aside>

          {mobileMenuOpen && (
            <div className="fixed inset-0 z-40 flex lg:hidden">
              <div
                className="fixed inset-0 bg-neutral-950/40"
                onClick={() => setMobileMenuOpen(false)}
              />
              <aside className="relative z-50 w-72 max-w-[85vw] border-r border-neutral-200 bg-white">
                {SidebarContent}
              </aside>
            </div>
          )}

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b border-neutral-200 bg-white px-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(true)}
                  aria-label="Open navigation menu"
                  className="rounded-lg p-1.5 text-neutral-600 hover:bg-neutral-100 lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 text-neutral-900 lg:hidden whitespace-nowrap shrink-0"
                >
                  <BrandMark className="h-7 w-7 text-blue-600" />
                  <span className="font-display text-lg font-bold tracking-tight">
                    Cadence
                  </span>
                </Link>
              </div>

              <AccountDropdown
                onOpenSupport={() => setSupportModalOpen(true)}
                onOpenFeedback={() => setFeedbackModalOpen(true)}
              />
            </header>

            <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-6xl">
                {backendError && (
                  <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>{backendError}</span>
                  </div>
                )}
                <ErrorBoundary>{children}</ErrorBoundary>
              </div>
            </main>
          </div>
        </div>
      )}

      {supportModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="support-modal-title"
          onClick={() => setSupportModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <MessageSquareText className="h-5 w-5" />
                </div>
                <div>
                  <h2 id="support-modal-title" className="text-base font-semibold text-gray-900">
                    Contact Support
                  </h2>
                  <p className="text-xs text-gray-500">
                    Get help from the Cadence team
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSupportModalOpen(false)}
                aria-label="Close support dialog"
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              className="mt-4 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!supportMessage.trim()) return;
                pushToast({
                  title: 'Support request sent',
                  description: `We'll reply to ${user?.email || firebaseUser.email || 'your email'} shortly.`,
                  variant: 'success',
                });
                setSupportMessage('');
                setSupportModalOpen(false);
              }}
            >
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  How can we help?
                </label>
                <textarea
                  rows={4}
                  required
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  placeholder="Describe your question or issue with your chatbot..."
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <a
                  href="mailto:support@cadence.ai"
                  className="text-xs font-medium text-gray-500 hover:text-gray-800"
                >
                  support@cadence.ai
                </a>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSupportModalOpen(false)}
                    className="rounded-lg border border-gray-200 px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    Send message
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {feedbackModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="feedback-modal-title"
          onClick={() => setFeedbackModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <MessageSquareMore className="h-5 w-5" />
                </div>
                <div>
                  <h2 id="feedback-modal-title" className="text-base font-semibold text-gray-900">
                    Share Feedback
                  </h2>
                  <p className="text-xs text-gray-500">
                    Tell us what you&apos;d like to see next in Cadence
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFeedbackModalOpen(false)}
                aria-label="Close feedback dialog"
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              className="mt-4 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!feedbackMessage.trim()) return;
                pushToast({
                  title: 'Feedback received',
                  description: 'Thank you for helping us improve Cadence.',
                  variant: 'success',
                });
                setFeedbackMessage('');
                setFeedbackModalOpen(false);
              }}
            >
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  Your feedback
                </label>
                <textarea
                  rows={4}
                  required
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  placeholder="Feature requests, voice quality notes, or UI improvements..."
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setFeedbackModalOpen(false)}
                  className="rounded-lg border border-gray-200 px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Submit feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
