'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { useApp } from '@/components/providers/app-provider';
import { BrandMark } from '@/components/ui/brand-loader';
import { ChatbotPanel } from '@/components/embed/chatbot-panel';
import { IconSizeOption, VoiceAgent } from '@/lib/types';

const ICON_SIZE_PIXELS: Record<IconSizeOption, number> = {
  SMALL: 48,
  MEDIUM: 56,
  LARGE: 64,
  XL: 72,
  '2XL': 80,
  '3XL': 96,
  '4XL': 128,
  '5XL': 156,
};

export function FloatingChatbotLauncher({
  agent,
}: {
  agent: VoiceAgent;
  variant?: 'orb' | 'dark';
}) {
  const { knowledgeSources } = useApp();
  const cfg = agent.widgetConfig;

  const isLeft =
    cfg?.iconPosition === 'LEFT' || agent.widgetPosition === 'bottom-left';
  const iconShape = cfg?.iconShape === 'SQUARE' ? 'SQUARE' : 'CIRCLE';
  const iconSizePx = ICON_SIZE_PIXELS[cfg?.iconSize || 'SMALL'] || 48;
  const primaryColor = cfg?.brandColor?.trim() || agent.accentColor || '#000000';
  const textColor = cfg?.brandTextColor?.trim() || '#FFFFFF';
  const iconBgColor = cfg?.iconBackgroundColor?.trim() || primaryColor;
  const iconBgTransparent = Boolean(cfg?.iconBackgroundTransparent);
  const isDark = Boolean(cfg?.enableDarkMode || agent.widgetTheme === 'dark');
  const rtl = Boolean(cfg?.rtl);

  const heightPercent =
    typeof cfg?.height === 'number' && Number.isFinite(cfg.height) && cfg.height > 0
      ? Math.min(100, Math.max(40, cfg.height))
      : 85;

  const welcomeMessage =
    agent.welcomeMessage?.trim() || 'Hello! How can I assist you today?';
  const tooltipText = cfg?.tooltip?.trim() || welcomeMessage;
  const hideTooltip = Boolean(cfg?.hideTooltip);

  const desktopBottom =
    typeof cfg?.distanceFromBottom === 'number' ? cfg.distanceFromBottom : 16;
  const mobileBottom =
    typeof cfg?.distanceFromBottomInMobile === 'number'
      ? cfg.distanceFromBottomInMobile
      : desktopBottom;
  const desktopHorizontal =
    typeof cfg?.horizontalDistance === 'number' ? cfg.horizontalDistance : 16;
  const mobileHorizontal =
    typeof cfg?.horizontalDistanceInMobile === 'number'
      ? cfg.horizontalDistanceInMobile
      : desktopHorizontal;

  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [open, setOpen] = useState(false);
  const [tooltipDismissed, setTooltipDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 639px)');
    const update = () => setIsMobileViewport(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const mode = isMobileViewport
      ? cfg?.autoOpenChatWindowInMobile
      : cfg?.autoOpenChatWindowInDesktop;
    if (mode !== 'ALWAYS_OPEN_WITH_DELAY') return;

    const delaySec = isMobileViewport
      ? cfg?.autoOpenChatWindowDelayInMobile ?? 5
      : cfg?.autoOpenChatWindowDelayInDesktop ?? 5;
    const timer = window.setTimeout(() => {
      setOpen(true);
    }, Math.max(0, delaySec) * 1000);
    return () => window.clearTimeout(timer);
  }, [
    isMobileViewport,
    cfg?.autoOpenChatWindowInDesktop,
    cfg?.autoOpenChatWindowDelayInDesktop,
    cfg?.autoOpenChatWindowInMobile,
    cfg?.autoOpenChatWindowDelayInMobile,
  ]);

  const relevantKnowledgeItems = useMemo(
    () =>
      knowledgeSources
        .filter(
          (s) =>
            (s.agentId === agent.id || s.agentId === 'all' || !s.agentId) &&
            typeof s.content === 'string' &&
            s.content.trim().length > 0
        )
        .map((s) => ({
          sourceName: s.sourceName,
          sourceType: s.sourceType,
          content: s.content || '',
        })),
    [knowledgeSources, agent.id]
  );

  const bottomOffset = Math.max(8, isMobileViewport ? mobileBottom : desktopBottom);
  const horizontalOffset = Math.max(
    8,
    isMobileViewport ? mobileHorizontal : desktopHorizontal
  );
  const renderedIconPx = isMobileViewport
    ? Math.min(72, Math.max(44, iconSizePx))
    : iconSizePx;

  const windowBottomOffset = bottomOffset + renderedIconPx + 14;

  return (
    <>
      <motion.div
        initial={false}
        animate={
          open
            ? { opacity: 1, y: 0, scale: 1, visibility: 'visible' as const }
            : {
                opacity: 0,
                y: 12,
                scale: 0.96,
                transitionEnd: { visibility: 'hidden' as const },
              }
        }
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        role="dialog"
        aria-label={`${agent.name} chatbot`}
        aria-hidden={!open}
        dir={rtl ? 'rtl' : 'ltr'}
        style={{
          bottom: `${windowBottomOffset}px`,
          [isLeft ? 'left' : 'right']: `${horizontalOffset}px`,
          height: expanded
            ? `calc(100vh - ${windowBottomOffset + 24}px)`
            : `${heightPercent}vh`,
          maxHeight: `calc(100vh - ${windowBottomOffset + 20}px)`,
        }}
        className={`fixed z-[60] flex flex-col overflow-hidden rounded-2xl border shadow-[0_24px_56px_-12px_rgba(15,23,42,0.24)] transition-[width,height] duration-200 ${
          open ? 'pointer-events-auto' : 'pointer-events-none'
        } ${
          expanded
            ? 'w-[calc(100vw-2rem)] sm:w-[520px]'
            : 'w-[calc(100vw-2rem)] sm:w-[395px]'
        } ${
          isDark
            ? 'border-gray-800 bg-gray-900'
            : 'border-gray-200 bg-white'
        }`}
      >
        <ChatbotPanel
          agent={agent}
          expanded={expanded}
          onToggleExpand={() => setExpanded((prev) => !prev)}
          onClose={() => setOpen(false)}
          fallbackInteractContext={{
            agentConfig: {
              name: agent.name,
              businessName: agent.businessName,
              personality: agent.personality,
              customInstructions: agent.customInstructions,
              language: agent.language,
              websiteUrl: agent.websiteUrl,
            },
            knowledgeItems: relevantKnowledgeItems,
          }}
        />
      </motion.div>

      {/* Tooltip Bubble Above Launcher */}
      {!open && !hideTooltip && !tooltipDismissed && (
        <div
          style={{
            bottom: `${bottomOffset + renderedIconPx + 10}px`,
            [isLeft ? 'left' : 'right']: `${horizontalOffset}px`,
          }}
          className={`fixed z-[60] flex max-w-[260px] items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-medium shadow-lg ${
            isDark
              ? 'border-gray-700 bg-gray-800 text-gray-100'
              : 'border-gray-200 bg-white text-gray-800'
          }`}
        >
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="min-w-0 truncate text-left hover:opacity-80"
          >
            {tooltipText}
          </button>
          <button
            type="button"
            onClick={() => setTooltipDismissed(true)}
            aria-label="Dismiss tooltip"
            className={`shrink-0 rounded p-0.5 ${
              isDark
                ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'
            }`}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Custom Configured Floating Launcher Button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label={open ? `Close ${agent.name}` : `Open ${agent.name}`}
        title={open ? `Close ${agent.name}` : `Chat with ${agent.name}`}
        style={{
          bottom: `${bottomOffset}px`,
          [isLeft ? 'left' : 'right']: `${horizontalOffset}px`,
          width: `${renderedIconPx}px`,
          height: `${renderedIconPx}px`,
        }}
        className={`group fixed z-[60] flex items-center justify-center transition-transform duration-150 hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
          iconShape === 'CIRCLE' ? 'rounded-full' : 'rounded-2xl'
        }`}
      >
        <span className="relative flex h-full w-full items-center justify-center">
          <div
            style={{
              backgroundColor:
                iconBgTransparent && !open ? 'transparent' : iconBgColor,
              color: textColor,
            }}
            className={`flex h-full w-full items-center justify-center transition-colors ${
              iconShape === 'CIRCLE' ? 'rounded-full' : 'rounded-2xl'
            } ${iconBgTransparent && !open ? '' : 'shadow-lg'}`}
          >
            <div className="flex items-center justify-center">
              {open ? (
                <X className="h-5 w-5" strokeWidth={2.2} />
              ) : (
                <BrandMark
                  className={
                    renderedIconPx >= 96
                      ? 'h-12 w-12'
                      : renderedIconPx >= 72
                        ? 'h-9 w-9'
                        : 'h-6 w-6'
                  }
                />
              )}
            </div>
          </div>
        </span>
      </button>
    </>
  );
}
