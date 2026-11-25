'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Check,
  Copy,
  CreditCard,
  Info,
  KeyRound,
  Plus,
  ShieldAlert,
  Trash2,
  User,
  Users,
} from 'lucide-react';
import { useApp } from '@/components/providers/app-provider';
import { WorkspaceRole } from '@/lib/types';

type SettingsTab = 'profile' | 'workspace' | 'billing' | 'api-keys' | 'team';

const TABS: { id: SettingsTab; label: string; icon: typeof User }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'workspace', label: 'Workspace', icon: Building2 },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'api-keys', label: 'API Keys', icon: KeyRound },
  { id: 'team', label: 'Team', icon: Users },
];

export function SettingsView() {
  const {
    user,
    activeRole,
    updateUser,
    activeWorkspace,
    updateWorkspace,
    calls,
    teamMembers,
    inviteTeamMember,
    updateTeamMemberRole,
    removeTeamMember,
    apiKeys,
    createApiKey,
    deleteApiKey,
    pushToast,
  } = useApp();

  const canAdmin = activeRole === 'owner' || activeRole === 'admin';
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  // Nullable draft overrides (avoids synchronous setState inside useEffect)
  const [draftProfile, setDraftProfile] = useState<{
    fullName?: string;
    email?: string;
    roleTitle?: string;
  }>({});
  const [savingProfile, setSavingProfile] = useState(false);

  const [wsDraft, setWsDraft] = useState<{
    wsId: string;
    name?: string;
    industry?: string;
    timezone?: string;
  } | null>(null);
  const [savingWorkspace, setSavingWorkspace] = useState(false);

  const [newKeyName, setNewKeyName] = useState('');
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [creatingKey, setCreatingKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [inviting, setInviting] = useState(false);

  const profileName = draftProfile.fullName ?? user?.fullName ?? '';
  const profileEmail = draftProfile.email ?? user?.email ?? '';
  const profileRole = draftProfile.roleTitle ?? user?.roleTitle ?? '';

  const currentWsId = activeWorkspace?.id || '';
  const effectiveWsDraft = wsDraft?.wsId === currentWsId ? wsDraft : null;
  const wsName = effectiveWsDraft?.name ?? activeWorkspace?.name ?? '';
  const wsIndustry = effectiveWsDraft?.industry ?? activeWorkspace?.industry ?? '';
  const wsTimezone =
    effectiveWsDraft?.timezone ?? activeWorkspace?.timezone ?? 'America/New_York';

  const loggedMinutes = Math.round(
    calls.reduce((sum, c) => sum + c.durationSeconds, 0) / 60
  );
  const planMinutesLimit =
    activeWorkspace?.planName === 'Business' ||
    activeWorkspace?.planName === 'Enterprise'
      ? 10000
      : activeWorkspace?.planName === 'Basic' ||
          activeWorkspace?.planName === 'Growth'
        ? 3000
        : 500;
  const usagePct = Math.min(100, Math.round((loggedMinutes / planMinutesLimit) * 100));

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim() || !profileEmail.trim() || savingProfile) return;
    setSavingProfile(true);
    try {
      await updateUser({
        fullName: profileName.trim(),
        email: profileEmail.trim(),
        roleTitle: profileRole.trim(),
      });
      setDraftProfile({});
      pushToast({
        title: 'Profile updated',
        description: 'Your account profile has been saved to Firestore.',
        variant: 'success',
      });
    } catch (err) {
      pushToast({
        title: 'Failed to update profile',
        description: err instanceof Error ? err.message : 'Try again.',
        variant: 'error',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace || !wsName.trim() || !canAdmin || savingWorkspace) return;
    setSavingWorkspace(true);
    try {
      await updateWorkspace(activeWorkspace.id, {
        name: wsName.trim(),
        industry: wsIndustry.trim(),
        timezone: wsTimezone,
      });
      setWsDraft(null);
      pushToast({
        title: 'Workspace settings saved',
        variant: 'success',
      });
    } catch (err) {
      pushToast({
        title: 'Failed to save workspace',
        description: err instanceof Error ? err.message : 'Try again.',
        variant: 'error',
      });
    } finally {
      setSavingWorkspace(false);
    }
  };

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim() || !canAdmin || creatingKey) return;
    setCreatingKey(true);
    try {
      const { rawPreview } = await createApiKey(newKeyName);
      setNewlyCreatedKey(rawPreview);
      setNewKeyName('');
      setCopied(false);
      pushToast({
        title: 'Preview API key saved',
        description: 'Live API authentication activates in Milestone 3.',
        variant: 'success',
      });
    } catch (err) {
      pushToast({
        title: 'Failed to create API key',
        description: err instanceof Error ? err.message : 'Try again.',
        variant: 'error',
      });
    } finally {
      setCreatingKey(false);
    }
  };

  const handleCopyKey = async () => {
    if (!newlyCreatedKey) return;
    try {
      await navigator.clipboard.writeText(newlyCreatedKey);
      setCopied(true);
    } catch {
      // Clipboard fallback ignored
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteEmail.includes('@') || !canAdmin || inviting) return;
    setInviting(true);
    try {
      await inviteTeamMember(inviteEmail.trim(), inviteRole);
      setInviteEmail('');
      pushToast({
        title: 'Team invite recorded',
        description: 'Pending workspace member saved to Firestore.',
        variant: 'success',
      });
    } catch (err) {
      pushToast({
        title: 'Invite failed',
        description: err instanceof Error ? err.message : 'Check workspace role permissions.',
        variant: 'error',
      });
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-neutral-200 pb-6 dark:border-neutral-800">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
          Settings
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Manage your profile, workspace preferences, subscription overview, API keys, and team roles.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-neutral-200 pb-3 dark:border-neutral-800">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                active
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Profile Settings */}
      {activeTab === 'profile' && (
        <form
          onSubmit={handleSaveProfile}
          className="max-w-2xl space-y-5 rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Profile Settings
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Update your personal display name and role title stored in your user profile.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Full name
              </label>
              <input
                type="text"
                required
                value={profileName}
                onChange={(e) =>
                  setDraftProfile((prev) => ({ ...prev, fullName: e.target.value }))
                }
                className="mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-sm text-neutral-900 focus:border-indigo-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Email address
              </label>
              <input
                type="email"
                required
                value={profileEmail}
                onChange={(e) =>
                  setDraftProfile((prev) => ({ ...prev, email: e.target.value }))
                }
                className="mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-sm text-neutral-900 focus:border-indigo-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Role title
              </label>
              <input
                type="text"
                value={profileRole}
                onChange={(e) =>
                  setDraftProfile((prev) => ({ ...prev, roleTitle: e.target.value }))
                }
                className="mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-sm text-neutral-900 focus:border-indigo-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
              />
            </div>
          </div>

          <div className="flex justify-end border-t border-neutral-200 pt-4 dark:border-neutral-800">
            <button
              type="submit"
              disabled={savingProfile}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {savingProfile ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      )}

      {/* Workspace Settings */}
      {activeTab === 'workspace' && (
        <div className="max-w-2xl space-y-6">
          {!canAdmin && (
            <div className="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>
                You have <span className="font-semibold">{activeRole}</span> access. Only workspace owners and admins can edit workspace settings.
              </span>
            </div>
          )}

          <form
            onSubmit={handleSaveWorkspace}
            className="space-y-5 rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div>
              <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                Workspace Settings
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Configure organization name, industry, and default call timezone.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  Workspace name
                </label>
                <input
                  type="text"
                  required
                  disabled={!canAdmin}
                  value={wsName}
                  onChange={(e) =>
                    setWsDraft({
                      wsId: currentWsId,
                      name: e.target.value,
                      industry: wsIndustry,
                      timezone: wsTimezone,
                    })
                  }
                  className="mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-sm text-neutral-900 focus:border-indigo-500 focus:outline-none disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    Industry
                  </label>
                  <input
                    type="text"
                    disabled={!canAdmin}
                    value={wsIndustry}
                    onChange={(e) =>
                      setWsDraft({
                        wsId: currentWsId,
                        name: wsName,
                        industry: e.target.value,
                        timezone: wsTimezone,
                      })
                    }
                    className="mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-sm text-neutral-900 focus:border-indigo-500 focus:outline-none disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    Default timezone
                  </label>
                  <select
                    disabled={!canAdmin}
                    value={wsTimezone}
                    onChange={(e) =>
                      setWsDraft({
                        wsId: currentWsId,
                        name: wsName,
                        industry: wsIndustry,
                        timezone: e.target.value,
                      })
                    }
                    className="mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-indigo-500 focus:outline-none disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                  >
                    <option value="America/New_York">Eastern Time (US &amp; Canada)</option>
                    <option value="America/Chicago">Central Time (US &amp; Canada)</option>
                    <option value="America/Los_Angeles">Pacific Time (US &amp; Canada)</option>
                    <option value="Europe/London">London (GMT/BST)</option>
                    <option value="Europe/Berlin">Central European Time</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-neutral-200 pt-4 dark:border-neutral-800">
              <button
                type="submit"
                disabled={!canAdmin || savingWorkspace}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {savingWorkspace ? 'Saving...' : 'Save Workspace'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Billing Settings */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                  Current Plan
                </p>
                <h2 className="mt-1 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  {activeWorkspace?.planName || 'Starter'} ({activeWorkspace?.subscriptionStatus || 'active'})
                </h2>
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  Billing cycle: {user?.billingCycle || 'monthly'}. Manage or switch plans anytime from the pricing page.
                </p>
              </div>
              <Link
                href="/pricing"
                className="inline-flex items-center rounded-lg bg-neutral-900 px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 whitespace-nowrap"
              >
                Change or upgrade plan
              </Link>
            </div>

            <div className="mt-5 space-y-2 border-t border-neutral-200 pt-5 dark:border-neutral-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-600 dark:text-neutral-400">
                  Logged call minutes this period
                </span>
                <span className="font-mono font-medium text-neutral-900 tabular-nums dark:text-neutral-100">
                  {loggedMinutes.toLocaleString()} / {planMinutesLimit.toLocaleString()} min
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                <div
                  className="h-full rounded-full bg-indigo-600"
                  style={{ width: `${usagePct}%` }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {(
              [
                {
                  name: 'Basic',
                  audience: 'For startups & growing websites',
                  price: '$150/mo',
                  limits: ['Frontier AI models', '3,000 voice minutes/mo', 'Unlimited team seats'],
                },
                {
                  name: 'Business',
                  audience: 'For scaling customer operations',
                  price: '$500/mo',
                  limits: ['Advanced analytics', '10,000 voice minutes/mo', 'Ticket & macro sync'],
                },
                {
                  name: 'Enterprise',
                  audience: 'For multi-location orgs',
                  price: 'Custom',
                  limits: ['Unlimited scale & limits', 'SSO & HIPAA-eligible', 'Dedicated CSM & SLA'],
                },
              ] as const
            ).map((tier) => {
              const isCurrent = (activeWorkspace?.planName || 'Starter') === tier.name;
              return (
                <div
                  key={tier.name}
                  className="flex flex-col justify-between rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <div>
                    <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                      {tier.audience}
                    </p>
                    <div className="mt-1 flex items-baseline justify-between">
                      <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                        {tier.name}
                      </h3>
                      <span className="font-mono text-sm font-semibold text-neutral-900 tabular-nums dark:text-neutral-100">
                        {tier.price}
                      </span>
                    </div>
                    <ul className="mt-4 space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
                      {tier.limits.map((lim) => (
                        <li key={lim} className="flex items-center gap-2">
                          <Check className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                          {lim}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Link
                    href="/pricing"
                    className={`mt-5 block w-full rounded-lg px-3.5 py-2 text-center text-xs font-medium transition-colors ${
                      isCurrent
                        ? 'border border-neutral-200 bg-neutral-50 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {isCurrent ? 'Current Plan' : 'View on Pricing Page'}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* API Keys */}
      {activeTab === 'api-keys' && (
        <div className="space-y-5">
          {!canAdmin && (
            <div className="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>
                Only workspace owners and admins can generate or revoke API keys.
              </span>
            </div>
          )}

          <form
            onSubmit={handleCreateApiKey}
            className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-5 sm:flex-row sm:items-end dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="flex-1">
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Create API Key (Preview Metadata)
              </label>
              <input
                type="text"
                disabled={!canAdmin}
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g., Production CRM Bridge"
                className="mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-indigo-500 focus:outline-none disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
              />
            </div>
            <button
              type="submit"
              disabled={!canAdmin || creatingKey}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-60 whitespace-nowrap shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              {creatingKey ? 'Generating...' : 'Generate Key'}
            </button>
          </form>

          {newlyCreatedKey && (
            <div className="flex flex-col justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 sm:flex-row sm:items-center dark:border-emerald-900/60 dark:bg-emerald-950/30">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                  Preview key created (external REST endpoints activate in Milestone 3)
                </p>
                <p className="mt-1 truncate font-mono text-xs text-emerald-900 dark:text-emerald-200">
                  {newlyCreatedKey}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyKey}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-neutral-900 dark:text-emerald-300 whitespace-nowrap shrink-0"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50/70 text-xs font-medium text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950/40 dark:text-neutral-400">
                    <th className="px-4 py-3">Key Name</th>
                    <th className="px-4 py-3">Token</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  {apiKeys.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-8 text-center text-xs text-neutral-500 dark:text-neutral-400"
                      >
                        No API keys generated in this workspace yet.
                      </td>
                    </tr>
                  ) : (
                    apiKeys.map((k) => (
                      <tr key={k.id}>
                        <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">
                          {k.name}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-neutral-600 dark:text-neutral-400">
                          {k.maskedKey}
                        </td>
                        <td className="px-4 py-3 text-xs text-neutral-500 dark:text-neutral-400">
                          {k.createdAt}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {canAdmin && (
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await deleteApiKey(k.id);
                                  pushToast({ title: 'API key revoked' });
                                } catch (err) {
                                  pushToast({
                                    title: 'Failed to revoke key',
                                    description:
                                      err instanceof Error ? err.message : 'Try again.',
                                    variant: 'error',
                                  });
                                }
                              }}
                              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Revoke
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Team Management */}
      {activeTab === 'team' && (
        <div className="space-y-5">
          <div className="flex items-start gap-2.5 rounded-xl border border-neutral-200 bg-white p-4 text-xs text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
            <span>
              Workspace roles follow RBAC rules (<span className="font-mono">owner</span>,{' '}
              <span className="font-mono">admin</span>, <span className="font-mono">member</span>) enforced by Firestore security rules. Only owners and admins can invite members or change roles.
            </span>
          </div>

          <form
            onSubmit={handleInviteMember}
            className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-5 sm:flex-row sm:items-end dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="flex-1">
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Invite team member
              </label>
              <input
                type="email"
                required
                disabled={!canAdmin}
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-indigo-500 focus:outline-none disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Role
              </label>
              <select
                disabled={!canAdmin}
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member')}
                className="mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-indigo-500 focus:outline-none disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
              >
                <option value="admin">Admin</option>
                <option value="member">Member</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={!canAdmin || inviting}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-60 whitespace-nowrap shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              {inviting ? 'Sending...' : 'Send Invite'}
            </button>
          </form>

          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50/70 text-xs font-medium text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950/40 dark:text-neutral-400">
                    <th className="px-4 py-3">Member</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  {teamMembers.map((member) => (
                    <tr key={member.id}>
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-neutral-900 dark:text-neutral-100">
                          {member.fullName}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {member.email} · {member.joinedAt}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-neutral-600 dark:text-neutral-400">
                        {member.status}
                      </td>
                      <td className="px-4 py-3.5">
                        <select
                          aria-label={`Role for ${member.fullName}`}
                          value={member.role}
                          disabled={!canAdmin || member.role === 'owner'}
                          onChange={async (e) => {
                            const nextRole = e.target.value as WorkspaceRole;
                            if (nextRole !== 'admin' && nextRole !== 'member') return;
                            try {
                              await updateTeamMemberRole(member.id, nextRole);
                              pushToast({ title: 'Member role updated' });
                            } catch (err) {
                              pushToast({
                                title: 'Role update failed',
                                description:
                                  err instanceof Error ? err.message : 'Check permissions.',
                                variant: 'error',
                              });
                            }
                          }}
                          className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-xs capitalize text-neutral-800 disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-200"
                        >
                          {member.role === 'owner' && <option value="owner">owner</option>}
                          <option value="admin">admin</option>
                          <option value="member">member</option>
                        </select>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {canAdmin && member.role !== 'owner' && (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await removeTeamMember(member.id);
                                pushToast({ title: 'Team member removed' });
                              } catch (err) {
                                pushToast({
                                  title: 'Remove failed',
                                  description:
                                    err instanceof Error ? err.message : 'Check permissions.',
                                  variant: 'error',
                                });
                              }
                            }}
                            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
