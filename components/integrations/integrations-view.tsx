'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Code2,
  Database,
  Globe,
  Info,
  MessageSquare,
  Search,
  ShoppingBag,
  Webhook,
  Workflow,
  X,
} from 'lucide-react';
import { useApp } from '@/components/providers/app-provider';

interface IntegrationCatalogItem {
  id: string;
  name: string;
  category: 'Website Embed' | 'CRM' | 'Calendar' | 'Automation';
  description: string;
  availability: 'Ready in Embed Studio' | 'Upcoming (Milestone 5)';
  requiredFields: string[];
  icon: typeof Globe;
  embedReady?: boolean;
}

const INTEGRATIONS: IntegrationCatalogItem[] = [
  {
    id: 'html-embed',
    name: 'HTML / React / Next.js',
    category: 'Website Embed',
    description: 'Drop one lightweight Cadence script snippet onto any landing page, SaaS app, or marketing site.',
    availability: 'Ready in Embed Studio',
    requiredFields: ['Chatbot ID', 'Allowed Domain Allowlist'],
    icon: Code2,
    embedReady: true,
  },
  {
    id: 'wordpress',
    name: 'WordPress',
    category: 'Website Embed',
    description: 'Paste the Cadence header or footer snippet inside any WordPress theme, WPCode, or Elementor site.',
    availability: 'Ready in Embed Studio',
    requiredFields: ['Chatbot ID', 'Site Domain'],
    icon: Globe,
    embedReady: true,
  },
  {
    id: 'shopify',
    name: 'Shopify Storefront',
    category: 'Website Embed',
    description: 'Answer product, shipping, and sizing questions by voice right inside your Shopify storefront.',
    availability: 'Ready in Embed Studio',
    requiredFields: ['Chatbot ID', 'theme.liquid Placement'],
    icon: ShoppingBag,
    embedReady: true,
  },
  {
    id: 'hubspot',
    name: 'HubSpot CRM',
    category: 'CRM',
    description: 'Automatically sync captured website visitor leads, transcripts, and intents to HubSpot contacts.',
    availability: 'Upcoming (Milestone 5)',
    requiredFields: ['Workspace OAuth Authorization'],
    icon: Database,
  },
  {
    id: 'gcal',
    name: 'Google Calendar',
    category: 'Calendar',
    description: 'Allow website voice chatbots to check live slot availability and book visitor discovery demos.',
    availability: 'Upcoming (Milestone 5)',
    requiredFields: ['Google Calendar OAuth Scope'],
    icon: Calendar,
  },
  {
    id: 'slack',
    name: 'Slack Lead Alerts',
    category: 'Automation',
    description: 'Post instant conversation summaries and qualified visitor lead alerts directly to team channels.',
    availability: 'Upcoming (Milestone 5)',
    requiredFields: ['Target Channel', 'Slack Bot Token'],
    icon: MessageSquare,
  },
  {
    id: 'zapier',
    name: 'Zapier & Make',
    category: 'Automation',
    description: 'Trigger downstream workflows whenever your voice widget captures a lead or finishes a chat.',
    availability: 'Upcoming (Milestone 5)',
    requiredFields: ['Workspace API Key'],
    icon: Workflow,
  },
  {
    id: 'webhooks',
    name: 'Custom Webhooks',
    category: 'Automation',
    description: 'Receive signed JSON payloads for conversation.completed and lead.captured events.',
    availability: 'Upcoming (Milestone 5)',
    requiredFields: ['Endpoint URL', 'Signing Secret'],
    icon: Webhook,
  },
];

export function IntegrationsView() {
  const { pushToast } = useApp();
  const [categoryFilter, setCategoryFilter] = useState<'All' | IntegrationCatalogItem['category']>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewItem, setPreviewItem] = useState<IntegrationCatalogItem | null>(null);

  const filtered = INTEGRATIONS.filter((item) => {
    const matchesCat = categoryFilter === 'All' || item.category === categoryFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-neutral-200 pb-6 dark:border-neutral-800">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
          Integrations
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Install your voice chatbot on any website platform or connect CRMs and lead automation workflows.
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
        <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
          <span className="font-semibold text-neutral-900 dark:text-neutral-100">
            Website Embeds &amp; Connectors:
          </span>{' '}
          Copy installation snippets for HTML, React/Next.js, WordPress, and Shopify directly in{' '}
          <Link href="/embed" className="font-medium text-indigo-600 underline dark:text-indigo-400">
            Embed &amp; Install
          </Link>
          . Automated CRM and webhook sync launches in Milestone 5.
        </p>
      </div>

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search integrations..."
            className="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-9 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-indigo-500 focus:outline-none dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
          />
        </div>

        <div className="inline-flex flex-wrap items-center gap-1 self-start rounded-lg border border-neutral-200 bg-neutral-100/70 p-1 dark:border-neutral-800 dark:bg-neutral-900">
          {(['All', 'Website Embed', 'CRM', 'Calendar', 'Automation'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                categoryFilter === cat
                  ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-800 dark:text-neutral-100'
                  : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="flex flex-col justify-between rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-700 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      item.embedReady
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-neutral-500 dark:text-neutral-400'
                    }`}
                  >
                    {item.embedReady ? 'Available' : 'Upcoming'}
                  </span>
                </div>
                <h2 className="mt-4 text-base font-semibold text-neutral-900 dark:text-neutral-100">
                  {item.name}
                </h2>
                <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                  {item.category}
                </p>
                <p className="mt-2.5 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                  {item.description}
                </p>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-neutral-200 pt-4 dark:border-neutral-800">
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  {item.availability}
                </span>
                {item.embedReady ? (
                  <Link
                    href="/embed"
                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700 whitespace-nowrap"
                  >
                    Open Embed
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPreviewItem(item)}
                    className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-800 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700 whitespace-nowrap"
                  >
                    Preview Setup
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {previewItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                {previewItem.name} — Setup Preview
              </h3>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              {previewItem.description}
            </p>
            <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-3.5 dark:border-neutral-800 dark:bg-neutral-950">
              <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                Configuration fields:
              </p>
              <ul className="mt-2 space-y-1 text-xs text-neutral-600 dark:text-neutral-400">
                {previewItem.requiredFields.map((field) => (
                  <li key={field}>· {field}</li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
                Status: {previewItem.availability}
              </p>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="rounded-lg border border-neutral-200 px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  pushToast({
                    title: 'Integration roadmap noted',
                    description: `${previewItem.name} automated sync launches in Milestone 5.`,
                  });
                  setPreviewItem(null);
                }}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-700"
              >
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
