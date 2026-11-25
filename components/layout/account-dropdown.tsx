'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bot,
  ChevronDown,
  Cpu,
  CreditCard,
  Gauge,
  LogOut,
  MessageSquareMore,
  MessageSquareText,
  ScrollText,
  UserCircle2,
} from 'lucide-react';
import { useApp } from '@/components/providers/app-provider';

interface AccountDropdownProps {
  onOpenSupport?: () => void;
  onOpenFeedback?: () => void;
}

export function AccountDropdown({
  onOpenSupport,
  onOpenFeedback,
}: AccountDropdownProps) {
  const router = useRouter();
  const { firebaseUser, user, activeWorkspace, logout } = useApp();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    setOpen(false);
    await logout();
    router.push('/login');
  };

  return (
    <div className="relative shrink-0">
      {open && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="relative z-40 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 whitespace-nowrap shrink-0"
      >
        <UserCircle2 className="h-5 w-5 text-gray-500" />
        <span>My Account</span>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-60 rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg lg:w-40">
          <div className="lg:hidden">
            <div className="px-2.5 py-2">
              <p className="truncate text-xs font-semibold text-gray-900">
                {user?.fullName || firebaseUser?.displayName || 'My Account'}
              </p>
              <p className="truncate text-[11px] text-gray-500">
                {user?.email || firebaseUser?.email}
              </p>
              {activeWorkspace && (
                <p className="mt-1 truncate text-[11px] text-gray-400">
                  {activeWorkspace.name}
                </p>
              )}
            </div>

            <div className="my-1 border-t border-gray-200 pt-1">
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                <Cpu className="h-4 w-4 text-gray-500" />
                Chatbots
              </Link>
              <Link
                href="/agents"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                <Bot className="h-4 w-4 text-gray-500" />
                Agents
              </Link>
              <Link
                href="/pricing"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                <CreditCard className="h-4 w-4 text-gray-500" />
                Billing
              </Link>
              <Link
                href="/analytics"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                <Gauge className="h-4 w-4 text-gray-500" />
                Usage
              </Link>
              <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                <UserCircle2 className="h-4 w-4 text-gray-500" />
                Profile
              </Link>
              <Link
                href="/docs"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                <ScrollText className="h-4 w-4 text-gray-500" />
                Docs
              </Link>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onOpenSupport?.();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                <MessageSquareText className="h-4 w-4 text-gray-500" />
                Support
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onOpenFeedback?.();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                <MessageSquareMore className="h-4 w-4 text-gray-500" />
                Feedback
              </button>
            </div>

            <div className="my-1 border-t border-gray-200" />
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 lg:text-sm"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
