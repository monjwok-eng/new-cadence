'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { BrandMark } from '@/components/ui/brand-loader';
import { VoiceWidgetPopup, WidgetPopupConfig } from '@/components/embed/voice-widget-popup';

function EmbeddedWidgetContent() {
  const params = useParams<{ agentId: string }>();
  const searchParams = useSearchParams();
  const agentId = params?.agentId || '';
  const host = searchParams.get('host') || '';
  const pageUrl = searchParams.get('page') || '';

  const [config, setConfig] = useState<WidgetPopupConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
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
        <p className="mt-3 text-sm font-semibold">Voice chatbot unavailable</p>
        <p className="mt-1 max-w-xs text-xs text-neutral-500">
          {error || 'This chatbot may be inactive or restricted to another domain.'}
        </p>
      </div>
    );
  }

  if (isEmbeddedFrame) {
    return (
      <div className="h-screen w-screen overflow-hidden">
        <VoiceWidgetPopup
          widget={config}
          hostDomain={host}
          sourcePageUrl={pageUrl}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-100 p-4 dark:bg-neutral-950">
      <div className="h-[600px] w-full max-w-[392px] overflow-hidden rounded-2xl border border-neutral-200 shadow-2xl dark:border-neutral-800">
        <VoiceWidgetPopup
          widget={config}
          hostDomain={host}
          sourcePageUrl={pageUrl}
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
