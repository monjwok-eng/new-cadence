'use client';

import React, { useMemo, useState, useSyncExternalStore } from 'react';
import Image, { StaticImageData } from 'next/image';
import Link from 'next/link';
import {
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Plus,
  X,
} from 'lucide-react';
import { PiEnvelopeFill } from 'react-icons/pi';
import { useApp } from '@/components/providers/app-provider';
import { VoiceAgent } from '@/lib/types';
import googleChatIcon from '../../public/images/integrations/google-chat.png';
import messengerIcon from '../../public/images/integrations/messenger.png';
import crispIcon from '../../public/images/integrations/crisp.png';
import slackIcon from '../../public/images/integrations/slack.png';
import freshdeskIcon from '../../public/images/integrations/freshdesk.png';
import zendeskIcon from '../../public/images/integrations/zendesk.png';
import zohoIcon from '../../public/images/integrations/zoho.png';
import whatsappIcon from '../../public/images/integrations/whatsapp.png';

interface IntegrationDefinition {
  id: string;
  name: string;
  subtitle?: string;
  domainLabel?: string;
  externalUrl?: string;
  description: string;
  showPlusOnAction: boolean;
  imageAsset?: StaticImageData;
  iconBgClass?: string;
  iconTextClass?: string;
  Icon?: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  fieldLabel: string;
  fieldPlaceholder: string;
  helperText: string;
  billingHref?: string;
}

const INTEGRATIONS: IntegrationDefinition[] = [
  {
    id: 'email',
    name: 'Email',
    subtitle: 'AI email support',
    description:
      "Give your chatbot an email address. Cadence answers your customers' emails, or drafts replies for your team to approve.",
    showPlusOnAction: false,
    iconBgClass: 'bg-blue-50 ring-1 ring-inset ring-blue-100',
    iconTextClass: 'text-blue-600',
    Icon: PiEnvelopeFill,
    fieldLabel: 'Support Forwarding Address',
    fieldPlaceholder: 'support@yourcompany.com',
    helperText:
      'Forward inbound support emails to your Cadence routing address or configure auto-draft mode.',
    billingHref: '/pricing',
  },
  {
    id: 'google-chat',
    name: 'Google Chat',
    domainLabel: 'google.com',
    externalUrl: 'https://google.com/chat',
    description:
      'Connect Google Chat with Cadence and chat with your bot directly from Google Chat.',
    showPlusOnAction: true,
    imageAsset: googleChatIcon,
    fieldLabel: 'Google Chat Space Webhook URL',
    fieldPlaceholder: 'https://chat.googleapis.com/v1/spaces/.../messages',
    helperText:
      'Paste your Google Chat incoming webhook URL or Google Workspace app endpoint.',
  },
  {
    id: 'messenger',
    name: 'Messenger',
    domainLabel: 'messenger.com',
    externalUrl: 'https://messenger.com',
    description:
      'Connect Messenger with Cadence and chat with your bot directly from Messenger.',
    showPlusOnAction: true,
    imageAsset: messengerIcon,
    fieldLabel: 'Facebook Page ID',
    fieldPlaceholder: '109482736451829',
    helperText:
      'Connect your Facebook Page ID and verify the webhook token inside Meta Developer Settings.',
  },
  {
    id: 'crisp',
    name: 'Crisp',
    domainLabel: 'crisp.chat',
    externalUrl: 'https://crisp.chat',
    description:
      'Connect Crisp Chat with Cadence and chat with your bot directly from Crisp Chat.',
    showPlusOnAction: true,
    imageAsset: crispIcon,
    fieldLabel: 'Crisp Website ID',
    fieldPlaceholder: '8b9c2f10-3d4a-4e82-9a1b-xxxxxxxxxxxx',
    helperText:
      'Enter your Crisp Website ID from Crisp Settings → Website Settings → Setup Instructions.',
  },
  {
    id: 'slack',
    name: 'Slack',
    domainLabel: 'slack.com',
    externalUrl: 'https://slack.com',
    description:
      'Connect Slack Chat with Cadence and chat with your bot directly from Slack.',
    showPlusOnAction: true,
    imageAsset: slackIcon,
    fieldLabel: 'Slack Channel or Bot Token',
    fieldPlaceholder: '#customer-support',
    helperText:
      'Mention @Cadence in any linked Slack channel to answer team or customer questions automatically.',
  },
  {
    id: 'freshdesk',
    name: 'Freshdesk',
    domainLabel: 'freshdesk.com',
    externalUrl: 'https://freshdesk.com/freshdesk',
    description:
      'Connect Freshdesk Chat with Cadence and chat with your bot directly from Freshdesk.',
    showPlusOnAction: true,
    imageAsset: freshdeskIcon,
    fieldLabel: 'Freshdesk Domain',
    fieldPlaceholder: 'yourcompany.freshdesk.com',
    helperText:
      'Link your Freshdesk helpdesk portal so Cadence can respond inside Freshchat and ticket threads.',
  },
  {
    id: 'zendesk-marketplace',
    name: 'Zendesk Messaging',
    domainLabel: 'zendesk.com',
    externalUrl: 'https://zendesk.com',
    description:
      'Install Cadence as a Zendesk AI Agent. One-click setup, no API keys needed.',
    showPlusOnAction: true,
    imageAsset: zendeskIcon,
    fieldLabel: 'Zendesk Subdomain',
    fieldPlaceholder: 'yourcompany.zendesk.com',
    helperText:
      'Install the Cadence Zendesk app and paste your Chatbot ID below to authorize your subdomain.',
  },
  {
    id: 'zoho-chat',
    name: 'Zoho SalesIQ',
    domainLabel: 'www.zoho.com',
    externalUrl: 'https://www.zoho.com/salesiq',
    description:
      'Connect Zoho SalesIQ Chat with Cadence and chat with your bot directly from Zoho SalesIQ.',
    showPlusOnAction: true,
    imageAsset: zohoIcon,
    fieldLabel: 'Zoho SalesIQ Screen Name',
    fieldPlaceholder: 'salesiq_portal_id',
    helperText:
      'Connect your Zoho SalesIQ bot webhook with your Chatbot ID to handle incoming live chats.',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    domainLabel: 'www.whatsapp.com',
    externalUrl: 'https://www.whatsapp.com',
    description:
      'Connect your WhatsApp Business number and let Cadence answer your customers directly on WhatsApp.',
    showPlusOnAction: true,
    imageAsset: whatsappIcon,
    fieldLabel: 'WhatsApp Business Phone Number',
    fieldPlaceholder: '+1 (555) 234-5678',
    helperText:
      'Link your WhatsApp Business Cloud API number to respond to customer messages 24/7.',
    billingHref: '/pricing',
  },
];

type SavedIntegrationMap = Record<string, { value: string; connectedAt: string }>;

const integrationListeners = new Set<() => void>();

function subscribeIntegrations(listener: () => void) {
  integrationListeners.add(listener);
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', listener);
  }
  return () => {
    integrationListeners.delete(listener);
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', listener);
    }
  };
}

function readRawIntegrations(storageKey: string): string {
  if (typeof window === 'undefined') return '{}';
  try {
    return window.localStorage.getItem(storageKey) || '{}';
  } catch {
    return '{}';
  }
}

export function ChatbotIntegrationsView({ agent }: { agent: VoiceAgent }) {
  const { pushToast } = useApp();
  const storageKey = `cadence_integrations_${agent.id}`;

  const rawConnected = useSyncExternalStore(
    subscribeIntegrations,
    () => readRawIntegrations(storageKey),
    () => '{}'
  );

  const connectedMap = useMemo<SavedIntegrationMap>(() => {
    try {
      const parsed = JSON.parse(rawConnected) as SavedIntegrationMap;
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }, [rawConnected]);

  const [activeIntegration, setActiveIntegration] =
    useState<IntegrationDefinition | null>(null);
  const [configValue, setConfigValue] = useState('');
  const [copiedId, setCopiedId] = useState(false);

  const persistConnections = (next: SavedIntegrationMap) => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next));
      integrationListeners.forEach((listener) => listener());
    } catch {
      // Ignore storage quota errors
    }
  };

  const handleOpenModal = (integration: IntegrationDefinition) => {
    setActiveIntegration(integration);
    setConfigValue(connectedMap[integration.id]?.value || '');
    setCopiedId(false);
  };

  const handleSaveIntegration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeIntegration) return;
    const trimmed = configValue.trim();
    if (!trimmed) return;

    const next: SavedIntegrationMap = {
      ...connectedMap,
      [activeIntegration.id]: {
        value: trimmed,
        connectedAt: new Date().toISOString(),
      },
    };
    persistConnections(next);
    pushToast({
      title: `${activeIntegration.name} connected`,
      description: `${agent.name} is now linked to ${trimmed}.`,
      variant: 'success',
    });
    setActiveIntegration(null);
  };

  const handleDisconnectIntegration = () => {
    if (!activeIntegration) return;
    const next = { ...connectedMap };
    delete next[activeIntegration.id];
    persistConnections(next);
    pushToast({
      title: `${activeIntegration.name} disconnected`,
    });
    setActiveIntegration(null);
  };

  const handleCopyAgentId = async () => {
    try {
      await navigator.clipboard.writeText(agent.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 1800);
    } catch {
      pushToast({
        title: 'Unable to copy',
        description: 'Select the Chatbot ID and copy manually.',
        variant: 'error',
      });
    }
  };

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <div className="space-y-8">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Integrations
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
          {INTEGRATIONS.map((item) => {
            const Icon = item.Icon;
            const connected = Boolean(connectedMap[item.id]);

            return (
              <div
                key={item.id}
                className="relative divide-y divide-gray-200 rounded-xl bg-white shadow-sm ring-1 ring-gray-200 transition-all duration-150 hover:shadow-md"
              >
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center gap-4">
                    {item.imageAsset ? (
                      <Image
                        src={item.imageAsset}
                        alt={item.name}
                        width={48}
                        height={48}
                        priority
                        referrerPolicy="no-referrer"
                        className="h-12 w-12 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      Icon && (
                        <div
                          className={`grid h-12 w-12 shrink-0 place-items-center rounded-lg ${item.iconBgClass || ''} ${item.iconTextClass || ''}`}
                        >
                          <Icon className="h-6 w-6" aria-hidden={true} />
                        </div>
                      )
                    )}
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-lg font-semibold leading-6 text-gray-900">
                        {item.name}
                      </h2>
                      {item.subtitle ? (
                        <p className="text-sm font-medium leading-6 text-gray-600">
                          {item.subtitle}
                        </p>
                      ) : (
                        item.externalUrl && (
                          <a
                            target="_blank"
                            rel="noopener noreferrer"
                            href={item.externalUrl}
                            className="inline-flex items-center gap-1.5 text-sm font-medium leading-6 text-gray-600 hover:text-gray-900"
                          >
                            {item.domainLabel}
                            <ExternalLink className="h-4 w-4" aria-hidden={true} />
                          </a>
                        )
                      )}
                    </div>
                  </div>

                  <p className="mt-4 text-sm font-normal text-gray-600">
                    {item.description}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-6 p-4 sm:px-6">
                  <button
                    type="button"
                    onClick={() => handleOpenModal(item)}
                    className="inline-flex items-center gap-2 text-sm font-semibold leading-6 text-blue-600 transition-all duration-150 hover:text-blue-700"
                  >
                    {connected ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden={true} />
                        <span>Manage Connection</span>
                      </>
                    ) : (
                      <>
                        {item.showPlusOnAction && (
                          <Plus className="h-5 w-5" strokeWidth={2.2} aria-hidden={true} />
                        )}
                        <span>Get Started</span>
                      </>
                    )}
                  </button>

                  {connected && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      Connected
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Integration Setup Modal */}
      {activeIntegration && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-neutral-950/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="integration-modal-title"
          onClick={() => setActiveIntegration(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {activeIntegration.imageAsset ? (
                  <Image
                    src={activeIntegration.imageAsset}
                    alt={activeIntegration.name}
                    width={40}
                    height={40}
                    priority
                    referrerPolicy="no-referrer"
                    className="h-10 w-10 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  activeIntegration.Icon && (
                    <div
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${activeIntegration.iconBgClass || ''} ${activeIntegration.iconTextClass || ''}`}
                    >
                      <activeIntegration.Icon className="h-5 w-5" aria-hidden={true} />
                    </div>
                  )
                )}
                <div>
                  <h3
                    id="integration-modal-title"
                    className="text-base font-semibold text-gray-900"
                  >
                    Connect {activeIntegration.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Chatbot: {agent.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveIntegration(null)}
                aria-label="Close integration setup"
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/70 p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-blue-700">
                Chatbot ID
              </p>
              <div className="mt-1.5 flex items-center justify-between gap-2">
                <code className="truncate font-mono text-xs text-blue-900">
                  {agent.id}
                </code>
                <button
                  type="button"
                  onClick={handleCopyAgentId}
                  className="inline-flex shrink-0 items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-medium text-blue-700 shadow-xs hover:bg-blue-100"
                >
                  {copiedId ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveIntegration} className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  {activeIntegration.fieldLabel}
                </label>
                <input
                  type="text"
                  required
                  value={configValue}
                  onChange={(e) => setConfigValue(e.target.value)}
                  placeholder={activeIntegration.fieldPlaceholder}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  {activeIntegration.helperText}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2">
                  {connectedMap[activeIntegration.id] && (
                    <button
                      type="button"
                      onClick={handleDisconnectIntegration}
                      className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      Disconnect
                    </button>
                  )}
                  {activeIntegration.billingHref && (
                    <Link
                      href={activeIntegration.billingHref}
                      className="text-xs font-medium text-blue-600 hover:underline"
                    >
                      View plan options
                    </Link>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveIntegration(null)}
                    className="rounded-lg border border-gray-200 px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    {connectedMap[activeIntegration.id]
                      ? 'Save Changes'
                      : 'Connect'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
