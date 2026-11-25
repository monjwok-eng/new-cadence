'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  CheckCircle2,
  Chrome,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useApp } from '@/components/providers/app-provider';
import { BrandLoader, BrandMark } from '@/components/ui/brand-loader';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    authReady,
    isReady,
    firebaseUser,
    isEmailVerified,
    user,
    registerWithEmail,
    signInWithGoogle,
    pushToast,
  } = useApp();

  const preselectedPlan = searchParams.get('plan');
  const preselectedCycle = searchParams.get('cycle');

  const [fullName, setFullName] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    form?: string;
  }>({});
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  const pricingQuery =
    preselectedPlan || preselectedCycle
      ? `?${new URLSearchParams({
          ...(preselectedPlan ? { plan: preselectedPlan } : {}),
          ...(preselectedCycle ? { cycle: preselectedCycle } : {}),
        }).toString()}`
      : '';

  useEffect(() => {
    if (!authReady || !firebaseUser) return;
    if (!isEmailVerified) {
      router.replace(`/onboarding${pricingQuery}`);
      return;
    }
    if (isReady && user) {
      if (!user.onboardingCompleted) {
        router.replace(`/onboarding${pricingQuery}`);
      } else if (!user.planSelected) {
        router.replace(`/pricing${pricingQuery}`);
      } else {
        router.replace('/dashboard');
      }
    }
  }, [authReady, firebaseUser, isEmailVerified, isReady, user, pricingQuery, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: typeof errors = {};

    if (!fullName.trim()) {
      nextErrors.fullName = 'Enter your full name.';
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      await registerWithEmail(
        fullName.trim(),
        email.trim(),
        password,
        workspaceName.trim() || undefined
      );
      setSuccessMsg('Account created. Redirecting to setup...');
      pushToast({
        title: 'Account created',
        description: 'Verify your email address to begin onboarding.',
        variant: 'success',
      });
      router.push(`/onboarding${pricingQuery}`);
    } catch (err) {
      setErrors({
        form: err instanceof Error ? err.message : 'Unable to create account.',
      });
      setSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setErrors({});
    setSuccessMsg('');
    setGoogleSubmitting(true);
    try {
      await signInWithGoogle();
      setSuccessMsg('Connected with Google. Preparing onboarding...');
      pushToast({ title: 'Signed in with Google', variant: 'success' });
    } catch (err) {
      setErrors({
        form: err instanceof Error ? err.message : 'Google sign-up failed.',
      });
      setGoogleSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-start bg-white px-7 pt-12 pb-12 text-[#1c1714] sm:justify-center">
      <div className="w-full max-w-[380px]">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 text-[#1c1714] whitespace-nowrap"
        >
          <BrandMark className="h-7 w-8 text-[#1c1714]" />
          <span className="font-display text-[23px] font-semibold tracking-[-0.025em] text-[#1c1714]">
            Cadence
          </span>
        </Link>

        <div className="mt-7">
          <h1 className="text-[26px] font-normal tracking-[-0.015em] text-[#1c1714]">
            Create your account
          </h1>
          <p className="mt-2.5 text-[14.5px] leading-snug text-[#2b2623]">
            Start building your website-trained AI voice &amp; chat agent in minutes.
          </p>
        </div>

        {errors.form && (
          <div className="mt-5 flex items-center gap-2 rounded-[2px] border border-rose-300 bg-rose-50 px-3.5 py-3 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errors.form}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-5 flex items-center gap-2 rounded-[2px] border border-emerald-300 bg-emerald-50 px-3.5 py-3 text-xs text-emerald-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-3.5">
          <div>
            <label htmlFor="signup-name" className="sr-only">
              Full name*
            </label>
            <input
              id="signup-name"
              type="text"
              autoComplete="name"
              required
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (errors.fullName) setErrors((p) => ({ ...p, fullName: undefined }));
              }}
              placeholder="Full name*"
              className="h-[50px] w-full rounded-[2px] border border-[#c9c6c0] bg-white px-4 text-[15px] text-[#1c1714] placeholder:text-[#443e3a] focus:border-[#1c1714] focus:outline-none"
            />
            {errors.fullName && (
              <p className="mt-1 text-xs text-rose-600">{errors.fullName}</p>
            )}
          </div>

          <div>
            <label htmlFor="signup-workspace" className="sr-only">
              Company or workspace name
            </label>
            <input
              id="signup-workspace"
              type="text"
              autoComplete="organization"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              placeholder="Company / Workspace name (optional)"
              className="h-[50px] w-full rounded-[2px] border border-[#c9c6c0] bg-white px-4 text-[15px] text-[#1c1714] placeholder:text-[#6b655f] focus:border-[#1c1714] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="signup-email" className="sr-only">
              Email address*
            </label>
            <input
              id="signup-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
              }}
              placeholder="Work email address*"
              className="h-[50px] w-full rounded-[2px] border border-[#c9c6c0] bg-white px-4 text-[15px] text-[#1c1714] placeholder:text-[#443e3a] focus:border-[#1c1714] focus:outline-none"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-rose-600">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="signup-password" className="sr-only">
              Password*
            </label>
            <div className="relative">
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
                }}
                placeholder="Password (8+ characters)*"
                className="h-[50px] w-full rounded-[2px] border border-[#c9c6c0] bg-white px-4 pr-11 text-[15px] text-[#1c1714] placeholder:text-[#443e3a] focus:border-[#1c1714] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-neutral-500 hover:text-[#1c1714]"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-rose-600">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting || googleSubmitting}
            className="h-[52px] w-full rounded-[2px] bg-[#1c1714] text-[15px] font-normal text-white transition-colors hover:bg-[#2d2622] disabled:opacity-60"
          >
            {submitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div className="my-5 flex items-center">
          <div className="flex-grow border-t border-[#e5e2dc]" />
          <span className="mx-4 shrink text-[11px] font-medium tracking-widest text-[#3b3531]">
            OR
          </span>
          <div className="flex-grow border-t border-[#e5e2dc]" />
        </div>

        <button
          type="button"
          onClick={handleGoogleSignUp}
          disabled={googleSubmitting || submitting}
          className="flex h-[52px] w-full items-center justify-start gap-4 rounded-[2px] border border-[#c9c6c0] bg-white px-5 text-[15px] font-normal text-[#1c1714] transition-colors hover:bg-[#faf9f7] disabled:opacity-60"
        >
          <Chrome className="h-[18px] w-[18px] shrink-0 text-[#1c1714]" />
          <span>{googleSubmitting ? 'Connecting...' : 'Continue with Google'}</span>
        </button>

        <p className="mt-6 text-center text-[13.5px] text-[#4a4540]">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium text-[#1c1714] underline underline-offset-4 hover:opacity-75"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<BrandLoader />}>
      <SignupForm />
    </Suspense>
  );
}
