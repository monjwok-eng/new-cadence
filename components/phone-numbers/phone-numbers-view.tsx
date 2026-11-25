'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Globe,
  Info,
  Link2Off,
  Phone,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { useApp } from '@/components/providers/app-provider';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { TableSkeleton } from '@/components/ui/skeleton';
import { PhoneCountryCode, PhoneNumberItem } from '@/lib/types';

const COUNTRIES: { code: 'ALL' | PhoneCountryCode; label: string }[] = [
  { code: 'ALL', label: 'All Countries' },
  { code: 'US', label: 'United States (+1)' },
  { code: 'UK', label: 'United Kingdom (+44)' },
  { code: 'CA', label: 'Canada (+1)' },
  { code: 'DE', label: 'Germany (+49)' },
  { code: 'AU', label: 'Australia (+61)' },
];

export function PhoneNumbersView() {
  const {
    isReady,
    activeRole,
    agents,
    connectedNumbers,
    availableNumbers,
    connectPhoneNumber,
    assignAgentToNumber,
    disconnectPhoneNumber,
    pushToast,
  } = useApp();

  const canManageNumbers = activeRole === 'owner' || activeRole === 'admin';

  const [countryFilter, setCountryFilter] = useState<'ALL' | PhoneCountryCode>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [connectingNumber, setConnectingNumber] = useState<PhoneNumberItem | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [submittingConnect, setSubmittingConnect] = useState(false);
  const [disconnectingNumber, setDisconnectingNumber] = useState<PhoneNumberItem | null>(null);
  const [submittingDisconnect, setSubmittingDisconnect] = useState(false);

  const filteredAvailable = availableNumbers.filter((item) => {
    const matchesCountry =
      countryFilter === 'ALL' || item.countryCode === countryFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      item.number.toLowerCase().includes(q) ||
      item.locality.toLowerCase().includes(q) ||
      item.countryName.toLowerCase().includes(q);
    return matchesCountry && matchesSearch;
  });

  const handleOpenConnect = (item: PhoneNumberItem) => {
    setConnectingNumber(item);
    setSelectedAgentId(agents[0]?.id || '');
  };

  const handleConfirmConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectingNumber || submittingConnect) return;
    setSubmittingConnect(true);
    try {
      await connectPhoneNumber(connectingNumber, selectedAgentId || null);
      pushToast({
        title: 'Demo number saved',
        description: `${connectingNumber.number} saved to workspace database (demo routing only).`,
        variant: 'success',
      });
      setConnectingNumber(null);
    } catch (err) {
      pushToast({
        title: 'Failed to connect number',
        description: err instanceof Error ? err.message : 'Check workspace permissions.',
        variant: 'error',
      });
    } finally {
      setSubmittingConnect(false);
    }
  };

  const handleConfirmDisconnect = async () => {
    if (!disconnectingNumber || submittingDisconnect) return;
    setSubmittingDisconnect(true);
    try {
      await disconnectPhoneNumber(disconnectingNumber.id);
      pushToast({ title: 'Demo number disconnected' });
      setDisconnectingNumber(null);
    } catch (err) {
      pushToast({
        title: 'Failed to disconnect',
        description: err instanceof Error ? err.message : 'Try again.',
        variant: 'error',
      });
    } finally {
      setSubmittingDisconnect(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-neutral-200 pb-6 dark:border-neutral-800">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
          Phone Numbers
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Manage inbound and outbound demo phone routing saved to your workspace.
        </p>
      </div>

      {/* Honest Demo Notice */}
      <div className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
        <div className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
          <span className="font-semibold text-neutral-900 dark:text-neutral-100">
            Demo phone inventory:
          </span>{' '}
          Connected number assignments are persisted to your Firestore workspace, but no real phone numbers are purchased, leased, or billed in Milestone 2. Live carrier provisioning arrives in Milestone 3.
          {!canManageNumbers && (
            <span className="mt-1 block text-amber-700 dark:text-amber-400">
              Only workspace owners and admins can connect or disconnect phone numbers.
            </span>
          )}
        </div>
      </div>

      {/* Connected Numbers */}
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            Connected Numbers (Demo)
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Numbers currently saved and routed to voice agents in this workspace
          </p>
        </div>

        {!isReady ? (
          <TableSkeleton rows={2} />
        ) : connectedNumbers.length === 0 ? (
          <EmptyState
            icon={Phone}
            title="No connected numbers in this workspace"
            description="Select an available demo number below to preview routing calls to one of your voice agents."
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50/70 text-xs font-medium text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950/40 dark:text-neutral-400">
                    <th className="px-4 py-3">Phone Number</th>
                    <th className="px-4 py-3">Region</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Assigned Agent</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  {connectedNumbers.map((item) => (
                    <tr
                      key={item.id}
                      className="transition-colors hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40"
                    >
                      <td className="px-4 py-3.5">
                        <p className="font-mono text-sm font-medium text-neutral-900 tabular-nums dark:text-neutral-100">
                          {item.number}
                        </p>
                        <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                          {item.numberType} · {item.capabilities.join(', ')}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-neutral-700 dark:text-neutral-300">
                        {item.locality}, {item.countryCode}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {item.status === 'connected_demo'
                            ? 'Connected (Demo)'
                            : 'Unassigned'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <select
                          aria-label={`Assign agent for ${item.number}`}
                          value={item.assignedAgentId || ''}
                          disabled={!canManageNumbers}
                          onChange={async (e) => {
                            try {
                              await assignAgentToNumber(item.id, e.target.value || null);
                              pushToast({ title: 'Agent routing updated' });
                            } catch (err) {
                              pushToast({
                                title: 'Update failed',
                                description:
                                  err instanceof Error ? err.message : 'Unable to update.',
                                variant: 'error',
                              });
                            }
                          }}
                          className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs text-neutral-800 focus:border-indigo-500 focus:outline-none disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-200"
                        >
                          <option value="">Unassigned</option>
                          {agents.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {canManageNumbers && (
                          <button
                            type="button"
                            onClick={() => setDisconnectingNumber(item)}
                            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                          >
                            <Link2Off className="h-3.5 w-3.5" />
                            Disconnect
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Available Numbers */}
      <section className="space-y-3">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Available Numbers (Demo Inventory)
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Browse sample local and toll-free numbers by country
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Globe className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
              <select
                aria-label="Country selector"
                value={countryFilter}
                onChange={(e) =>
                  setCountryFilter(e.target.value as 'ALL' | PhoneCountryCode)
                }
                className="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-8 pr-8 text-xs font-medium text-neutral-800 focus:border-indigo-500 focus:outline-none sm:w-auto dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="City or area code..."
                className="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-8 pr-3 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-indigo-500 focus:outline-none sm:w-52 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
              />
            </div>
          </div>
        </div>

        {!isReady ? (
          <TableSkeleton rows={4} />
        ) : filteredAvailable.length === 0 ? (
          <EmptyState
            icon={Phone}
            title="No matching demo numbers"
            description="Try selecting another country or clearing your search query."
            actionLabel="Reset Filter"
            onAction={() => {
              setCountryFilter('ALL');
              setSearchQuery('');
            }}
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50/70 text-xs font-medium text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950/40 dark:text-neutral-400">
                    <th className="px-4 py-3">Number</th>
                    <th className="px-4 py-3">Country / Locality</th>
                    <th className="px-4 py-3">Capabilities</th>
                    <th className="px-4 py-3">Est. Monthly</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  {filteredAvailable.map((item) => (
                    <tr
                      key={item.id}
                      className="transition-colors hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40"
                    >
                      <td className="px-4 py-3.5">
                        <p className="font-mono text-sm font-medium text-neutral-900 tabular-nums dark:text-neutral-100">
                          {item.number}
                        </p>
                        <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                          {item.numberType}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-neutral-700 dark:text-neutral-300">
                        {item.locality} · {item.countryName}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-neutral-600 dark:text-neutral-400">
                        {item.capabilities.join(' · ')}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-neutral-600 tabular-nums dark:text-neutral-400">
                        {item.monthlyEstimate}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          disabled={!canManageNumbers}
                          onClick={() => handleOpenConnect(item)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-800 transition-colors hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700 whitespace-nowrap shrink-0"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Connect Number
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Connect Number Modal */}
      {connectingNumber && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleConfirmConnect}
            className="w-full max-w-md rounded-xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                Connect Demo Number
              </h3>
              <button
                type="button"
                onClick={() => setConnectingNumber(null)}
                className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
              Preview routing for{' '}
              <span className="font-mono font-semibold text-neutral-900 dark:text-neutral-100">
                {connectingNumber.number}
              </span>{' '}
              ({connectingNumber.locality}). No real carrier number is purchased.
            </p>

            <div className="mt-4">
              <label className="block text-sm font-medium text-neutral-800 dark:text-neutral-200">
                Assign to voice agent
              </label>
              <select
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-indigo-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
              >
                <option value="">Leave unassigned for now</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.status})
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConnectingNumber(null)}
                className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingConnect}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {submittingConnect ? 'Connecting...' : 'Connect Demo Number'}
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(disconnectingNumber)}
        title="Disconnect demo number?"
        description={
          disconnectingNumber
            ? `Remove ${disconnectingNumber.number} from your connected numbers and return it to the demo inventory?`
            : ''
        }
        confirmLabel={submittingDisconnect ? 'Disconnecting...' : 'Disconnect'}
        destructive
        onConfirm={handleConfirmDisconnect}
        onCancel={() => setDisconnectingNumber(null)}
      />
    </div>
  );
}
