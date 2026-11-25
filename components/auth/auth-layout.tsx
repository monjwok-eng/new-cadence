'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { BrandMark } from '@/components/ui/brand-loader';

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 text-neutral-900">
      <header className="flex h-14 items-center justify-between border-b border-neutral-200 bg-white px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-neutral-900 whitespace-nowrap shrink-0"
        >
          <BrandMark className="h-7 w-7 text-blue-600" />
          <span className="font-display text-lg font-bold tracking-tight">
            Cadence
          </span>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 whitespace-nowrap"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Home
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
              {title}
            </h1>
            <p className="mt-1.5 text-sm text-neutral-500">{subtitle}</p>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-xs">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
