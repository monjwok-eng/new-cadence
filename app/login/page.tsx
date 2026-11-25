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
import { BrandLoader } from '@/components/ui/brand-loader';

function BrandMark({ className = 'h-7 w-8' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M5 12.5C5 6.5 11 3.5 19.5 3.5C24.5 3.5 27.5 6 27.5 9.2C27.5 12.1 24.2 13.8 19.5 13.8C14.2 13.8 10.2 12.2 6.2 14.2C5.4 14.6 5 13.8 5 12.5Z"
        fill="currentColor"
      />
      <path
        d="M27 15.5C27 21.5 21 24.5 12.5 24.5C7.5 24.5 4.5 22 4.5 18.8C4.5 15.9 7.8 14.2 12.5 14.2C17.8 14.2 21.8 15.8 25.8 13.8C26.6 13.4 27 14.2 27 15.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    authReady,
    isReady,
    firebaseUser,
    isEmailVerified,
    user,
    signInWithGoogle,
    signInWithEmail,
    pushToast,
  } = useApp();

  const nextParam = searchParams.get('next');
  const safeRedirect =
    nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//')
      ? nextParam
      : '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    form?: string;
  }>({});
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  useEffect(() => {
    if (!authReady || !firebaseUser) return;
    if (!isEmailVerified) {
      router.replace(safeRedirect);
      return;
    }
    if (isReady && user) {
      if (!user.onboardingCompleted) {
        router.replace('/onboarding');
      } else if (!user.planSelected) {
        router.replace('/pricing');
      } else {
        router.replace(safeRedirect);
      }
    }
  }, [authReady, isReady, firebaseUser, isEmailVerified, user, safeRedirect, router]);

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrors({ email: 'Enter a valid email address.' });
      return;
    }
    if (!showPasswordField) {
      setShowPasswordField(true);
      return;
    }
    if (!password) {
      setErrors({ password: 'Enter your password.' });
      return;
    }

    setSubmitting(true);
    signInWithEmail(email, password)
      .then(() => {
        setSuccessMsg('Signed in. Loading your workspace...');
        pushToast({ title: 'Welcome back', variant: 'success' });
      })
      .catch((err) => {
        setErrors({
          form: err instanceof Error ? err.message : 'Invalid email or password.',
        });
        setSubmitting(false);
      });
  };

  const handleGoogleSignIn = async () => {
    setErrors({});
    setSuccessMsg('');
    setGoogleSubmitting(true);
    try {
      await signInWithGoogle();
      setSuccessMsg('Signed in with Google. Redirecting...');
      pushToast({ title: 'Signed in', variant: 'success' });
    } catch (err) {
      setErrors({
        form: err instanceof Error ? err.message : 'Google sign-in failed.',
      });
      setGoogleSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-start bg-white px-7 pt-14 pb-12 text-[#1c1714] sm:justify-center sm:pt-12">
      <div className="w-full max-w-[360px]">
        {/* Brand Lockup — Parloa Auth Style */}
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 text-[#1c1714] whitespace-nowrap"
        >
          <BrandMark className="h-7 w-8 text-[#1c1714]" />
          <span className="font-display text-[23px] font-semibold tracking-[-0.025em] text-[#1c1714]">
            Cadence
          </span>
        </Link>

        {/* Heading & Subtitle */}
        <div className="mt-7">
          <h1 className="text-[26px] font-normal tracking-[-0.015em] text-[#1c1714]">
            Welcome
          </h1>
          <p className="mt-3 text-[14.5px] leading-snug text-[#2b2623]">
            Log in to Cadence to continue to Cadence Studio.
          </p>
        </div>

        {/* Status Feedback */}
        {errors.form && (
          <div className="mt-6 flex items-center gap-2 rounded-[2px] border border-rose-300 bg-rose-50 px-3.5 py-3 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errors.form}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-6 flex items-center gap-2 rounded-[2px] border border-emerald-300 bg-emerald-50 px-3.5 py-3 text-xs text-emerald-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Identifier / Password Form */}
        <form onSubmit={handleContinue} noValidate className="mt-7 space-y-5">
          <div>
            {!showPasswordField ? (
              <div>
                <label htmlFor="login-email" className="sr-only">
                  Email address*
                </label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  placeholder="Email address*"
                  className="h-[54px] w-full rounded-[2px] border border-[#c9c6c0] bg-white px-4 text-[15px] text-[#1c1714] placeholder:text-[#443e3a] focus:border-[#1c1714] focus:outline-none"
                />
                {errors.email && (
                  <p className="mt-1.5 text-xs text-rose-600">{errors.email}</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Confirmed Email Row with Edit */}
                <div className="flex h-[54px] items-center justify-between rounded-[2px] border border-[#c9c6c0] bg-[#faf9f7] px-4 text-[14px]">
                  <span className="truncate text-[#1c1714]">{email}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordField(false);
                      setPassword('');
                      setErrors({});
                    }}
                    className="ml-3 shrink-0 text-[13px] font-medium text-[#1c1714] underline hover:opacity-70"
                  >
                    Edit
                  </button>
                </div>

                {/* Password Input with Visibility Toggle */}
                <div>
                  <label htmlFor="login-password" className="sr-only">
                    Password*
                  </label>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      autoFocus
                      required
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password)
                          setErrors((prev) => ({ ...prev, password: undefined }));
                      }}
                      placeholder="Password*"
                      className="h-[54px] w-full rounded-[2px] border border-[#c9c6c0] bg-white px-4 pr-11 text-[15px] text-[#1c1714] placeholder:text-[#443e3a] focus:border-[#1c1714] focus:outline-none"
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
                    <p className="mt-1.5 text-xs text-rose-600">{errors.password}</p>
                  )}
                  <div className="mt-2.5">
                    <Link
                      href="/forgot-password"
                      className="text-[13px] font-medium text-[#1c1714] hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="h-[52px] w-full rounded-[2px] bg-[#1c1714] text-[15px] font-normal text-white transition-colors hover:bg-[#2d2622] disabled:opacity-60"
          >
            {submitting
              ? 'Signing in...'
              : showPasswordField
                ? 'Sign in'
                : 'Continue'}
          </button>
        </form>

        {/* OR Divider */}
        <div className="my-6 flex items-center">
          <div className="flex-grow border-t border-[#e5e2dc]" />
          <span className="mx-4 shrink text-[11px] font-medium tracking-widest text-[#3b3531]">
            OR
          </span>
          <div className="flex-grow border-t border-[#e5e2dc]" />
        </div>

        {/* Social Auth Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleSubmitting || submitting}
          className="flex h-[52px] w-full items-center justify-start gap-4 rounded-[2px] border border-[#c9c6c0] bg-white px-5 text-[15px] font-normal text-[#1c1714] transition-colors hover:bg-[#faf9f7] disabled:opacity-60"
        >
          <Chrome className="h-[18px] w-[18px] shrink-0 text-[#1c1714]" />
          <span>{googleSubmitting ? 'Connecting...' : 'Continue with Google'}</span>
        </button>

        <p className="mt-6 text-center text-[13.5px] text-[#4a4540]">
          Don&apos;t have an account?{' '}
          <Link
            href="/signup"
            className="font-medium text-[#1c1714] underline underline-offset-4 hover:opacity-75"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<BrandLoader />}>
      <LoginForm />
    </Suspense>
  );
}
