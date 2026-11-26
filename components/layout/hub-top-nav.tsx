'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MessageSquareMore,
  MessageSquareText,
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
import { BrandMark } from '@/components/ui/brand-loader';
import { AccountDropdown } from '@/components/layout/account-dropdown';

type HubIconComponent = React.ComponentType<{
  className?: string;
  'aria-hidden'?: boolean;
}>;

type HubNavItem =
  | { type: 'link'; href: string; label: string; icon: HubIconComponent }
  | {
      type: 'action';
      action: 'support' | 'feedback';
      label: string;
      icon: HubIconComponent;
    };

export const HUB_NAV_ITEMS: HubNavItem[] = [
  { type: 'link', href: '/dashboard', label: 'Chatbots', icon: PiCpuDuotone },
  { type: 'link', href: '/agents', label: 'Agents', icon: PiRobotDuotone },
  { type: 'link', href: '/pricing', label: 'Billing', icon: PiCreditCardDuotone },
  { type: 'link', href: '/analytics', label: 'Usage', icon: PiGaugeDuotone },
  { type: 'link', href: '/profile', label: 'Profile', icon: PiUserCircleDuotone },
  { type: 'link', href: '/docs', label: 'Docs', icon: PiScrollDuotone },
  { type: 'action', action: 'support', label: 'Support', icon: PiChatCenteredTextFill },
  { type: 'action', action: 'feedback', label: 'Feedback', icon: PiChatTextFill },
];

export function HubHeaderBar({
  leftMobileControl,
  zIndexClass = 'z-30',
}: {
  leftMobileControl?: React.ReactNode;
  zIndexClass?: string;
}) {
  const pathname = usePathname();
  const { user, firebaseUser, pushToast } = useApp();

  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  return (
    <>
      <header
        className={`sticky top-0 ${zIndexClass} shrink-0 border-b border-gray-200 bg-white`}
      >
        <div className="mx-auto max-w-[86rem] px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              {leftMobileControl}
              <Link
                href="/dashboard"
                className="mr-auto flex shrink-0 items-center gap-2 text-gray-950 whitespace-nowrap lg:mx-0 lg:-ml-2 lg:gap-2.5"
              >
                <BrandMark className="h-7 w-8 text-blue-600 lg:h-9 lg:w-10" />
                <span className="font-display text-lg font-bold tracking-tight text-gray-950 lg:text-[22px] lg:leading-none">
                  Cadence
                </span>
              </Link>
            </div>

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
                      className="group inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-gray-600 transition-all duration-150 hover:bg-gray-100 hover:text-gray-900 whitespace-nowrap"
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
                    : item.href === '/agents'
                      ? pathname === '/agents'
                      : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    target={item.href === '/docs' ? '_blank' : undefined}
                    rel={item.href === '/docs' ? 'noopener noreferrer' : undefined}
                    aria-current={active ? 'page' : undefined}
                    className={`group inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-all duration-150 whitespace-nowrap ${
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
                  <h2
                    id="support-modal-title"
                    className="text-base font-semibold text-gray-900"
                  >
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
                  description: `We'll reply to ${
                    user?.email || firebaseUser?.email || 'your email'
                  } shortly.`,
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
                  <h2
                    id="feedback-modal-title"
                    className="text-base font-semibold text-gray-900"
                  >
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
    </>
  );
}
