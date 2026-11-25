'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, Check, Eye, EyeOff } from 'lucide-react';
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

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const { confirmPasswordResetCode } = useApp();
  const oobCode = searchParams.get('oobCode') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [completed, setCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!oobCode) {
      setError('Invalid or missing password reset code. Request a new reset link.');
      return;
    }
    if (password.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await confirmPasswordResetCode(oobCode, password);
      setCompleted(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to reset password. Request a new link.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (completed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-7 py-12 text-center text-[#1c1714]">
        <div className="w-full max-w-[360px]">
          <div className="mx-auto flex h-[64px] w-[64px] items-center justify-center rounded-full border-2 border-[#4f6f18] text-[#4f6f18]">
            <Check className="h-7 w-7 stroke-[1.75]" aria-hidden="true" />
          </div>

          <h1 className="mt-7 text-[24px] font-normal tracking-[-0.015em] text-[#1c1714]">
            Password Changed
          </h1>

          <p className="mt-3 text-[14.5px] leading-relaxed text-[#2b2623]">
            Your password has been updated. Return to Cadence Studio to sign in.
          </p>

          <Link
            href="/login"
            className="mt-7 flex h-[52px] w-full items-center justify-center rounded-[2px] bg-[#1c1714] text-[15px] font-normal text-white transition-colors hover:bg-[#2d2622]"
          >
            Back to Cadence Studio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-start bg-white px-7 pt-14 pb-12 text-[#1c1714] sm:justify-center sm:pt-12">
      <div className="w-full max-w-[360px]">
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
            Change Your Password
          </h1>
          <p className="mt-3 text-[14.5px] leading-snug text-[#2b2623]">
            Enter a new password below to update your Cadence account.
          </p>
        </div>

        {!oobCode && (
          <div className="mt-6 flex items-start gap-2 rounded-[2px] border border-amber-300 bg-amber-50 px-3.5 py-3 text-xs text-amber-900">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              No reset code found in URL. Open the link from your reset email or{' '}
              <Link href="/forgot-password" className="font-medium underline">
                request a new one
              </Link>
              .
            </span>
          </div>
        )}

        {error && (
          <div className="mt-6 flex items-center gap-2 rounded-[2px] border border-rose-300 bg-rose-50 px-3.5 py-3 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-5">
          <div className="relative">
            <label
              htmlFor="new-password"
              className="absolute -top-2 left-3 z-10 bg-white px-1 text-[12px] leading-none text-[#443e3a]"
            >
              New password*
            </label>
            <input
              id="new-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError('');
              }}
              className="h-[54px] w-full rounded-[2px] border border-[#c9c6c0] bg-white px-4 pr-11 text-[15px] text-[#1c1714] focus:border-[#1c1714] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
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

          <div className="relative">
            <label
              htmlFor="confirm-new-password"
              className="absolute -top-2 left-3 z-10 bg-white px-1 text-[12px] leading-none text-[#443e3a]"
            >
              Confirm new password*
            </label>
            <input
              id="confirm-new-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (error) setError('');
              }}
              className="h-[54px] w-full rounded-[2px] border border-[#c9c6c0] bg-white px-4 text-[15px] text-[#1c1714] focus:border-[#1c1714] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !oobCode}
            className="h-[52px] w-full rounded-[2px] bg-[#1c1714] text-[15px] font-normal text-white transition-colors hover:bg-[#2d2622] disabled:opacity-60"
          >
            {submitting ? 'Updating...' : 'Reset password'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-[14px] font-medium text-[#1c1714] underline underline-offset-4 hover:opacity-75"
          >
            Back to Cadence Studio
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<BrandLoader />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
