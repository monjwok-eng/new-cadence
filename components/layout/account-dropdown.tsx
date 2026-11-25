'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronDown,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Settings,
  UserCircle2,
} from 'lucide-react';
import { useApp } from '@/components/providers/app-provider';

export function AccountDropdown() {
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
        className="relative z-40 inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900 whitespace-nowrap shrink-0"
      >
        <UserCircle2 className="h-5 w-5 text-neutral-500" />
        <span>My Account</span>
        <ChevronDown className="h-4 w-4 text-neutral-400" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-60 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-lg">
          <div className="px-2.5 py-2">
            <p className="truncate text-xs font-semibold text-neutral-900">
              {user?.fullName || firebaseUser?.displayName || 'My Account'}
            </p>
            <p className="truncate text-[11px] text-neutral-500">
              {user?.email || firebaseUser?.email}
            </p>
            {activeWorkspace && (
              <p className="mt-1 truncate text-[11px] text-neutral-400">
                {activeWorkspace.name}
              </p>
            )}
          </div>

          <div className="my-1 border-t border-neutral-200 pt-1">
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
            >
              <LayoutDashboard className="h-3.5 w-3.5 text-neutral-400" />
              All Chatbots
            </Link>
            <Link
              href="/pricing"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
            >
              <CreditCard className="h-3.5 w-3.5 text-neutral-400" />
              Plans &amp; Pricing
            </Link>
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
            >
              <Settings className="h-3.5 w-3.5 text-neutral-400" />
              Account Settings
            </Link>
          </div>

          <div className="my-1 border-t border-neutral-200 pt-1">
            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
