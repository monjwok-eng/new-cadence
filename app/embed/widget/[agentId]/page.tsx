'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { BrandMark } from '@/components/ui/brand-loader';
import { ChatbotPanel, ChatbotPanelAgent } from '@/components/embed/chatbot-panel';

function EmbeddedWidgetContent() {
  const params = useParams<{ agentId: string }>();
  const searchParams = useSearchParams();
  const agentId = params?.agentId || '';
  const host = searchParams.get('host') || '';
  const pageUrl = searchParams.get('page') || '';

  const [config, setConfig] = useState<ChatbotPanelAgent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [isEmbeddedFrame] = useState(
    () => typeof window !== 'undefined' && window.self !== window.top
  );

  useEffect(() => {
    if (!agentId) return;
    let cancelled = false;
    fetch(
      `/api/widget/${encodeURIComponent(agentId)}/config?host=${encodeURIComponent(host)}`,
      { cache: 'no-store' }
    )
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Widget unavailable.');
        }
        if (!cancelled) {
          setConfig(data.widget);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load widget.');
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [agentId, host]);

  const handleToggleExpand = () => {
    const next = !expanded;
    setExpanded(next);
    if (isEmbeddedFrame && typeof window !== 'undefined' && window.parent) {
      window.parent.postMessage(
        { type: 'cadence-widget-expand', agentId, expanded: next },
        '*'
      );
    }
  };

  const handleClose = () => {
    if (isEmbeddedFrame && typeof window !== 'undefined' && window.parent) {
      window.parent.postMessage({ type: 'cadence-widget-close', agentId }, '*');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white text-[#14110f]">
        <BrandMark className="h-8 w-9 animate-pulse" />
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-white p-6 text-center text-neutral-800">
        <AlertCircle className="h-7 w-7 text-rose-500" />
        <p className="mt-3 text-sm font-semibold">Chatbot unavailable</p>
        <p className="mt-1 max-w-xs text-xs text-neutral-500">
          {error || 'This chatbot may be inactive or restricted to another domain.'}
        </p>
      </div>
    );
  }

  if (isEmbeddedFrame) {
    return (
      <div className="h-screen w-screen overflow-hidden">
        <ChatbotPanel
          agent={config}
          hostDomain={host}
          sourcePageUrl={pageUrl}
          expanded={expanded}
          onToggleExpand={handleToggleExpand}
          onClose={handleClose}
        />
      </div>
    );
  }

  const wc = config.widgetConfig;
  const isDark = Boolean(wc?.enableDarkMode || config.widgetTheme === 'dark');
  const heightPercent =
    typeof wc?.height === 'number' && Number.isFinite(wc.height) && wc.height > 0
      ? Math.min(94, Math.max(40, wc.height))
      : 85;

  return (
    <div
      className={`flex min-h-screen items-center justify-center p-0 sm:p-4 ${
        isDark ? 'bg-gray-950' : 'bg-neutral-100'
      }`}
    >
      <div
        style={{
          '--embed-h': expanded ? '92dvh' : `${heightPercent}dvh`,
        } as React.CSSProperties}
        className={`h-dvh w-full overflow-hidden transition-[max-width,height] duration-200 sm:h-[var(--embed-h)] sm:rounded-2xl sm:border sm:shadow-2xl ${
          expanded ? 'sm:max-w-[520px]' : 'sm:max-w-[395px]'
        } ${
          isDark
            ? 'border-gray-800 bg-gray-900'
            : 'border-gray-200 bg-white'
        }`}
      >
        <ChatbotPanel
          agent={config}
          hostDomain={host}
          sourcePageUrl={pageUrl}
          expanded={expanded}
          onToggleExpand={handleToggleExpand}
        />
      </div>
    </div>
  );
}

export default function PublicEmbeddedWidgetPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center bg-white text-[#14110f]">
          <BrandMark className="h-8 w-9 animate-pulse" />
        </div>
      }
    >
      <EmbeddedWidgetContent />
    </Suspense>
  );
}
