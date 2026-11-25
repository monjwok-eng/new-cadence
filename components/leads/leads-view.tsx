'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Download,
  Mail,
  Plus,
  Search,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import { useApp } from '@/components/providers/app-provider';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { TableSkeleton } from '@/components/ui/skeleton';
import { Lead, LeadStatus } from '@/lib/types';

const STATUS_TABS: ('All' | LeadStatus)[] = ['All', 'New', 'Contacted', 'Qualified'];

export function LeadsView() {
  const router = useRouter();
  const {
    isReady,
    leads,
    agents,
    addLead,
    updateLeadStatus,
    deleteLead,
    pushToast,
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<'All' | LeadStatus>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [saving, setSaving] = useState(false);

  const [agentId, setAgentId] = useState('');
  const [visitorName, setVisitorName] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [company, setCompany] = useState('');
  const [inquirySummary, setInquirySummary] = useState('');
  const [sourcePageUrl, setSourcePageUrl] = useState('');

  const filteredLeads = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return leads.filter((lead) => {
      const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;
      const matchesSearch =
        !q ||
        lead.visitorName.toLowerCase().includes(q) ||
        lead.visitorEmail.toLowerCase().includes(q) ||
        (lead.company || '').toLowerCase().includes(q) ||
        lead.agentName.toLowerCase().includes(q) ||
        (lead.inquirySummary || '').toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [leads, statusFilter, searchQuery]);

  const counts = useMemo(
    () => ({
      total: leads.length,
      newCount: leads.filter((l) => l.status === 'New').length,
      contactedCount: leads.filter((l) => l.status === 'Contacted').length,
      qualifiedCount: leads.filter((l) => l.status === 'Qualified').length,
    }),
    [leads]
  );

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetAgent = agents.find((a) => a.id === agentId) || agents[0];
    if (!targetAgent) {
      pushToast({
        title: 'Create a chatbot first',
        description: 'Leads must belong to a voice chatbot in your workspace.',
        variant: 'error',
      });
      return;
    }
    if (!visitorName.trim() || !visitorEmail.trim()) {
      pushToast({
        title: 'Missing required fields',
        description: 'Visitor name and email are required.',
        variant: 'error',
      });
      return;
    }

    setSaving(true);
    try {
      await addLead({
        agentId: targetAgent.id,
        agentName: targetAgent.name,
        visitorName: visitorName.trim(),
        visitorEmail: visitorEmail.trim(),
        visitorPhone: visitorPhone.trim() || undefined,
        company: company.trim() || undefined,
        inquirySummary: inquirySummary.trim() || undefined,
        sourcePageUrl: sourcePageUrl.trim() || targetAgent.websiteUrl || undefined,
        status: 'New',
      });
      setVisitorName('');
      setVisitorEmail('');
      setVisitorPhone('');
      setCompany('');
      setInquirySummary('');
      setSourcePageUrl('');
      setModalOpen(false);
      pushToast({
        title: 'Lead saved',
        description: `${visitorName.trim()} added to workspace leads.`,
        variant: 'success',
      });
    } catch (err) {
      pushToast({
        title: 'Failed to save lead',
        description: err instanceof Error ? err.message : 'Unable to save lead.',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleExportCsv = () => {
    if (filteredLeads.length === 0) return;
    const escape = (val: string) => `"${(val || '').replace(/"/g, '""')}"`;
    const rows = [
      ['Name', 'Email', 'Phone', 'Company', 'Chatbot', 'Status', 'Source Page', 'Summary', 'Created'].join(','),
      ...filteredLeads.map((l) =>
        [
          escape(l.visitorName),
          escape(l.visitorEmail),
          escape(l.visitorPhone || ''),
          escape(l.company || ''),
          escape(l.agentName),
          escape(l.status),
          escape(l.sourcePageUrl || ''),
          escape(l.inquirySummary || ''),
          escape(l.createdAt),
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cadence-leads.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleConfirmDelete = async () => {
    if (!leadToDelete) return;
    const target = leadToDelete;
    setLeadToDelete(null);
    try {
      await deleteLead(target.id);
      pushToast({
        title: 'Lead removed',
        description: `${target.visitorName} was removed from leads.`,
      });
    } catch (err) {
      pushToast({
        title: 'Delete failed',
        description: err instanceof Error ? err.message : 'Unable to delete lead.',
        variant: 'error',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 border-b border-neutral-200 pb-6 sm:flex-row sm:items-end dark:border-neutral-800">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            Leads
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Website visitors who shared contact details through your embedded voice chatbots.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredLeads.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 whitespace-nowrap"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => {
              if (agents.length === 0) {
                router.push('/create-chatbot');
                return;
              }
              setAgentId(agents[0]?.id || '');
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            Add Lead
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Total Leads</p>
          <p className="mt-1.5 text-2xl font-semibold text-neutral-900 tabular-nums dark:text-neutral-100">
            {counts.total}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">New</p>
          <p className="mt-1.5 text-2xl font-semibold text-indigo-600 tabular-nums dark:text-indigo-400">
            {counts.newCount}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Contacted</p>
          <p className="mt-1.5 text-2xl font-semibold text-amber-600 tabular-nums dark:text-amber-400">
            {counts.contactedCount}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Qualified</p>
          <p className="mt-1.5 text-2xl font-semibold text-emerald-600 tabular-nums dark:text-emerald-400">
            {counts.qualifiedCount}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search leads by name, email, or chatbot..."
            className="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-9 pr-3 text-sm text-neutral-900 focus:border-indigo-500 focus:outline-none dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
          />
        </div>

        <div className="inline-flex items-center gap-1 self-start rounded-lg border border-neutral-200 bg-neutral-100/70 p-1 dark:border-neutral-800 dark:bg-neutral-900">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                statusFilter === tab
                  ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-800 dark:text-neutral-100'
                  : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Leads Table */}
      {!isReady ? (
        <TableSkeleton rows={4} />
      ) : filteredLeads.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title={leads.length === 0 ? 'No captured leads yet' : 'No matching leads'}
          description={
            leads.length === 0
              ? 'When website visitors submit their contact details in your embedded voice widget (or when you log one manually), they appear here.'
              : 'Try adjusting your search query or status filter.'
          }
          actionLabel={
            leads.length === 0
              ? agents.length === 0
                ? 'Create Chatbot First'
                : 'Add Test Lead'
              : undefined
          }
          onAction={
            leads.length === 0
              ? () => {
                  if (agents.length === 0) {
                    router.push('/create-chatbot');
                  } else {
                    setAgentId(agents[0].id);
                    setModalOpen(true);
                  }
                }
              : undefined
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/70 text-xs font-medium text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950/60 dark:text-neutral-400">
                  <th className="px-4 py-3">Visitor</th>
                  <th className="px-4 py-3">Chatbot</th>
                  <th className="px-4 py-3">Summary</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Captured</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="transition-colors hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40"
                  >
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-neutral-900 dark:text-neutral-100">
                        {lead.visitorName}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                        <Mail className="h-3 w-3" />
                        <span>{lead.visitorEmail}</span>
                        {lead.company && <span>· {lead.company}</span>}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                      {lead.agentName}
                    </td>
                    <td className="max-w-xs px-4 py-3.5 text-xs text-neutral-600 dark:text-neutral-400">
                      <p className="line-clamp-2">
                        {lead.inquirySummary || 'Voice inquiry from website widget'}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <select
                        value={lead.status}
                        onChange={(e) =>
                          updateLeadStatus(lead.id, e.target.value as LeadStatus)
                        }
                        aria-label={`Status for ${lead.visitorName}`}
                        className="rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-neutral-800 focus:border-indigo-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-200"
                      >
                        <option value="New">New</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Qualified">Qualified</option>
                      </select>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-neutral-500 tabular-nums dark:text-neutral-400 whitespace-nowrap">
                      {lead.createdAt}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => setLeadToDelete(lead)}
                        aria-label={`Delete ${lead.visitorName}`}
                        className="rounded-md p-1.5 text-neutral-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Lead Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleCreateLead}
            className="w-full max-w-md rounded-xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                Add Lead
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  Voice Chatbot
                </label>
                <select
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                >
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    Visitor Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    placeholder="Alex Morgan"
                    className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={visitorEmail}
                    onChange={(e) => setVisitorEmail(e.target.value)}
                    placeholder="alex@company.com"
                    className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    Company
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Acme Corp"
                    className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={visitorPhone}
                    onChange={(e) => setVisitorPhone(e.target.value)}
                    placeholder="+1 555 234 5678"
                    className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  Inquiry Summary
                </label>
                <textarea
                  rows={2}
                  value={inquirySummary}
                  onChange={(e) => setInquirySummary(e.target.value)}
                  placeholder="Asked about enterprise pricing and website installation."
                  className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save Lead'}
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(leadToDelete)}
        title="Delete lead?"
        description={
          leadToDelete
            ? `Permanently remove ${leadToDelete.visitorName} (${leadToDelete.visitorEmail}) from your workspace leads?`
            : ''
        }
        confirmLabel="Delete Lead"
        onConfirm={handleConfirmDelete}
        onCancel={() => setLeadToDelete(null)}
      />
    </div>
  );
}
