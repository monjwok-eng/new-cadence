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
  Mic,
  Puzzle,
  RefreshCw,
  Settings,
  UserPlus,
  X,
} from 'lucide-react';
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
  { href: '/settings', label: 'Settings', icon: Settings },
] as const;

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/embed/widget',
  '/pricing',
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

  const isHubRoute = pathname === '/dashboard' || pathname === '/create-chatbot';
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
        <div className="flex min-h-screen flex-col bg-white">
          <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur-xs">
            <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-neutral-950 whitespace-nowrap shrink-0"
              >
                <BrandMark className="h-7 w-7 text-blue-600" />
                <span className="font-display text-[17px] font-bold tracking-[-0.02em]">
                  Cadence
                </span>
              </Link>

              <AccountDropdown />
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6">
            <div className="mx-auto max-w-5xl">
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

              <AccountDropdown />
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


    </div>
  );
}
