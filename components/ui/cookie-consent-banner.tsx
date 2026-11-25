'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Cookie, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useApp } from '@/components/providers/app-provider';

export function CookieConsentBanner() {
  const pathname = usePathname();
  const {
    cookieConsent,
    cookieBannerOpen,
    closeCookieBanner,
    acceptCookies,
    declineCookies,
  } = useApp();
  const [saving, setSaving] = useState<'accept' | 'decline' | null>(null);

  if (pathname !== '/') {
    return null;
  }

  const handleAccept = async () => {
    setSaving('accept');
    try {
      await acceptCookies();
    } finally {
      setSaving(null);
    }
  };

  const handleDecline = async () => {
    setSaving('decline');
    try {
      await declineCookies();
    } finally {
      setSaving(null);
    }
  };

  return (
    <AnimatePresence>
      {cookieBannerOpen && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          role="dialog"
          aria-live="polite"
          aria-label="Cookie preferences"
          className="fixed inset-x-0 bottom-0 z-50 border-t border-[#e8e5df] bg-white/95 px-4 py-3.5 text-[#14110f] shadow-[0_-8px_30px_rgba(20,17,15,0.08)] backdrop-blur-md sm:px-8 dark:border-neutral-800 dark:bg-neutral-900/95 dark:text-neutral-100"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <div className="flex min-w-0 items-start gap-3 sm:items-center">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f4f2ee] text-[#14110f] sm:mt-0 dark:bg-neutral-800 dark:text-neutral-200">
                <Cookie className="h-4 w-4" />
              </span>
              <p className="text-[13px] font-light leading-snug text-[#4a4540] dark:text-neutral-300">
                <span className="font-normal text-[#14110f] dark:text-neutral-100">
                  We use cookies
                </span>{' '}
                to keep your login session active and remember your workspace and theme preferences. Essential authentication cookies remain active when signed in.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2.5 self-end sm:self-center">
              <button
                type="button"
                disabled={saving !== null}
                onClick={handleDecline}
                className="inline-flex h-10 items-center justify-center rounded-[6px] border border-[#d7d2c9] bg-white px-4 text-[13px] font-normal text-[#14110f] transition-colors hover:bg-[#faf8f5] disabled:opacity-60 whitespace-nowrap shrink-0 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                {saving === 'decline' ? 'Saving...' : 'Decline'}
              </button>
              <button
                type="button"
                disabled={saving !== null}
                onClick={handleAccept}
                className="inline-flex h-10 items-center justify-center rounded-[6px] bg-[#14110f] px-4 text-[13px] font-normal text-white transition-colors hover:bg-[#2d2622] disabled:opacity-60 whitespace-nowrap shrink-0 dark:bg-indigo-600 dark:hover:bg-indigo-700"
              >
                {saving === 'accept' ? 'Saving...' : 'Accept cookies'}
              </button>
              {cookieConsent !== null && (
                <button
                  type="button"
                  onClick={closeCookieBanner}
                  aria-label="Close cookie preferences"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-[6px] text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
