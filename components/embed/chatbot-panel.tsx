'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ExternalLink,
  Home,
  Maximize2,
  MessageSquare,
  Minimize2,
  RotateCw,
  Send,
  SquarePen,
  ThumbsDown,
  ThumbsUp,
  User,
  X,
} from 'lucide-react';
import { BrandMark } from '@/components/ui/brand-loader';
import {
  AgentPersonality,
  AgentStatus,
  ChatbotWidgetConfig,
  WidgetTheme,
} from '@/lib/types';

type ChatTab = 'home' | 'chat' | 'account';

interface ChatTurn {
  id: string;
  speaker: 'user' | 'agent';
  content: string;
  sources?: string[];
  feedback?: 'up' | 'down' | null;
}

export interface ChatbotPanelAgent {
  id: string;
  name: string;
  businessName: string;
  welcomeMessage?: string;
  accentColor?: string;
  widgetTheme?: WidgetTheme;
  status?: AgentStatus;
  widgetConfig?: ChatbotWidgetConfig;
}

export interface ChatbotFallbackContext {
  agentConfig: {
    name: string;
    businessName: string;
    personality: AgentPersonality | string;
    customInstructions: string;
    language: string;
    websiteUrl?: string;
  };
  knowledgeItems: { sourceName: string; sourceType: string; content: string }[];
}

export function ChatbotPanel({
  agent,
  hostDomain,
  sourcePageUrl,
  expanded = false,
  onToggleExpand,
  onClose,
  fallbackInteractContext,
  className = '',
}: {
  agent: ChatbotPanelAgent;
  hostDomain?: string;
  sourcePageUrl?: string;
  expanded?: boolean;
  onToggleExpand?: () => void;
  onClose?: () => void;
  fallbackInteractContext?: ChatbotFallbackContext;
  className?: string;
}) {
  const cfg = agent.widgetConfig;

  const primaryColor = cfg?.brandColor?.trim() || agent.accentColor || '#000000';
  const textColor = cfg?.brandTextColor?.trim() || '#FFFFFF';
  const resolvedLinkColor = cfg?.linkColor?.trim() || primaryColor;
  const isDark = Boolean(cfg?.enableDarkMode || agent.widgetTheme === 'dark');
  const fontSizePx =
    typeof cfg?.fontSize === 'number' && Number.isFinite(cfg.fontSize) && cfg.fontSize > 0
      ? Math.min(22, Math.max(12, cfg.fontSize))
      : 14;

  const welcomeMessage =
    agent.welcomeMessage?.trim() || 'Hello! How can I assist you today?';
  const placeholderText = cfg?.placeholderText?.trim() || 'Ask me anything...';
  const externalLinkUrl = cfg?.externalLinkUrl?.trim() || '';
  const disclaimerText = cfg?.disclaimerText?.trim() || '';

  const hideSources = Boolean(cfg?.hideSources);
  const hideFeedbackButtons = Boolean(cfg?.hideFeedbackButtons);
  const hideBottomNavigation = Boolean(cfg?.hideBottomNavigation);
  const showMessagesTabForAnonymous = Boolean(cfg?.showMessagesTabForAnonymous);
  const hideRefreshButton = Boolean(cfg?.hideRefreshButton);
  const hideExpandButton = Boolean(cfg?.hideExpandButton);
  const hideHomePage = Boolean(cfg?.hideHomePage);
  const rtl = Boolean(cfg?.rtl);
  const stayOnHomeIfNoThread = Boolean(cfg?.stayOnHomeIfNoThread);
  const requireTermsAcceptance = Boolean(cfg?.requireTermsAcceptance);

  const [activeTab, setActiveTab] = useState<ChatTab>(() =>
    !hideHomePage && stayOnHomeIfNoThread ? 'home' : 'chat'
  );
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState(
    () => `wsess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  );
  const [messages, setMessages] = useState<ChatTurn[]>(() => [
    {
      id: 'welcome',
      speaker: 'agent',
      content: welcomeMessage,
    },
  ]);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const turnCounterRef = useRef(0);

  const resolvedTab: ChatTab = hideHomePage && activeTab === 'home' ? 'chat' : activeTab;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending, resolvedTab]);

  const handleResetChat = () => {
    setMessages([{ id: 'welcome', speaker: 'agent', content: welcomeMessage }]);
    setInputValue('');
    setNotice(null);
    setTermsAccepted(false);
    setSessionId(`wsess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
    setActiveTab(!hideHomePage && stayOnHomeIfNoThread ? 'home' : 'chat');
  };

  const handleFeedback = (msgId: string, vote: 'up' | 'down') => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId ? { ...m, feedback: m.feedback === vote ? null : vote } : m
      )
    );
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanText = inputValue.trim();
    if (!cleanText || sending) return;
    if (requireTermsAcceptance && !termsAccepted) return;

    setNotice(null);
    turnCounterRef.current += 1;
    const userTurn: ChatTurn = {
      id: `u_${turnCounterRef.current}`,
      speaker: 'user',
      content: cleanText,
    };

    const nextHistory = [...messages, userTurn];
    setMessages(nextHistory);
    setInputValue('');
    setSending(true);

    try {
      const useFallbackEndpoint =
        Boolean(fallbackInteractContext) && agent.status !== 'Active';

      const res = useFallbackEndpoint && fallbackInteractContext
        ? await fetch('/api/voice/interact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              agentId: agent.id,
              userMessage: cleanText,
              conversationHistory: nextHistory.map((m) => ({
                speaker: m.speaker,
                content: m.content,
              })),
              agentConfig: fallbackInteractContext.agentConfig,
              knowledgeItems: fallbackInteractContext.knowledgeItems,
            }),
          })
        : await fetch(`/api/widget/${encodeURIComponent(agent.id)}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId,
              host:
                hostDomain ||
                (typeof window !== 'undefined' ? window.location.hostname : ''),
              pageUrl:
                sourcePageUrl ||
                (typeof window !== 'undefined' ? window.location.href : ''),
              userMessage: cleanText,
              conversationHistory: nextHistory.map((m) => ({
                speaker: m.speaker,
                content: m.content,
              })),
            }),
          });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Unable to get a response right now.');
      }

      turnCounterRef.current += 1;
      setMessages((prev) => [
        ...prev,
        {
          id: `a_${turnCounterRef.current}`,
          speaker: 'agent',
          content:
            data.responseText ||
            `Thanks for reaching out to ${agent.businessName}. How can I help further?`,
          sources: Array.isArray(data.sourcesUsed) ? data.sourcesUsed : undefined,
          feedback: null,
        },
      ]);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Unable to send message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      dir={rtl ? 'rtl' : 'ltr'}
      style={{ fontSize: `${fontSizePx}px` }}
      className={`flex h-full w-full flex-col overflow-hidden ${
        isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'
      } ${className}`}
    >
      {/* Header */}
      <div
        className="flex shrink-0 items-center justify-between gap-2 px-4 py-3"
        style={{
          backgroundColor: primaryColor,
          color: textColor,
        }}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          {!hideHomePage ? (
            <button
              type="button"
              onClick={() =>
                setActiveTab((prev) => (prev === 'home' ? 'chat' : 'home'))
              }
              title={resolvedTab === 'home' ? 'Go to chat' : 'Back to home'}
              className="rounded-lg p-1 opacity-85 transition-opacity hover:bg-white/15 hover:opacity-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleResetChat}
              title="Start new conversation"
              className="rounded-lg p-1 opacity-85 transition-opacity hover:bg-white/15 hover:opacity-100"
            >
              <SquarePen className="h-4 w-4" />
            </button>
          )}

          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 p-1">
            <BrandMark className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight">
              {agent.name}
            </p>
            <p className="text-[11px] opacity-80">Online</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {externalLinkUrl && (
            <a
              href={
                externalLinkUrl.startsWith('http')
                  ? externalLinkUrl
                  : `https://${externalLinkUrl}`
              }
              target="_blank"
              rel="noopener noreferrer"
              title="Open external link"
              className="rounded-lg p-1.5 opacity-85 transition-opacity hover:bg-white/15 hover:opacity-100"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
          {!hideRefreshButton && (
            <button
              type="button"
              onClick={handleResetChat}
              title="Refresh chat"
              className="rounded-lg p-1.5 opacity-85 transition-opacity hover:bg-white/15 hover:opacity-100"
            >
              <RotateCw className="h-4 w-4" />
            </button>
          )}
          {!hideExpandButton && onToggleExpand && (
            <button
              type="button"
              onClick={onToggleExpand}
              title={expanded ? 'Collapse' : 'Expand'}
              className="hidden rounded-lg p-1.5 opacity-85 transition-opacity hover:bg-white/15 hover:opacity-100 sm:inline-flex"
            >
              {expanded ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close chatbot"
              className="rounded-lg p-1.5 opacity-85 transition-opacity hover:bg-white/15 hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto p-4">
        {resolvedTab === 'home' && !hideHomePage && (
          <div className="space-y-4">
            <div
              className={`rounded-2xl border p-4 ${
                isDark
                  ? 'border-gray-800 bg-gray-800/70'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <p className="text-base font-semibold">Welcome to {agent.name}</p>
              <p
                className={`mt-1.5 text-sm leading-relaxed ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                {welcomeMessage}
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('chat')}
                style={{
                  backgroundColor: primaryColor,
                  color: textColor,
                }}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-xs transition-opacity hover:opacity-90"
              >
                <Send className="h-4 w-4" />
                Send us a message
              </button>
            </div>

            {externalLinkUrl && (
              <a
                href={
                  externalLinkUrl.startsWith('http')
                    ? externalLinkUrl
                    : `https://${externalLinkUrl}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className={`block rounded-xl border px-3.5 py-2.5 text-xs ${
                  isDark
                    ? 'border-gray-800 bg-gray-800/40 text-gray-300'
                    : 'border-gray-200 bg-white text-gray-600'
                }`}
              >
                Helpful link:{' '}
                <span
                  style={{ color: resolvedLinkColor }}
                  className="font-medium underline"
                >
                  {externalLinkUrl}
                </span>
              </a>
            )}
          </div>
        )}

        {resolvedTab === 'account' && (
          <div className="space-y-3">
            <div
              className={`rounded-2xl border p-4 ${
                isDark
                  ? 'border-gray-800 bg-gray-800/70'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <p className="text-sm font-semibold">Visitor Details</p>
              <p
                className={`mt-1 text-xs ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                {showMessagesTabForAnonymous
                  ? 'Anonymous visitors can view their conversation history in the Messages tab.'
                  : 'Visitors can share their email during chat to persist conversation history.'}
              </p>
            </div>
          </div>
        )}

        {resolvedTab === 'chat' && (
          <div className="space-y-3.5">
            {messages.map((msg) => {
              const isUser = msg.speaker === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    style={
                      isUser
                        ? {
                            backgroundColor: primaryColor,
                            color: textColor,
                            fontSize: `${fontSizePx}px`,
                          }
                        : {
                            fontSize: `${fontSizePx}px`,
                          }
                    }
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? 'rounded-br-sm'
                        : isDark
                          ? 'rounded-bl-sm bg-gray-800 text-gray-100'
                          : 'rounded-bl-sm bg-gray-100 text-gray-900'
                    }`}
                  >
                    {msg.content}
                  </div>

                  {!isUser && !hideSources && msg.sources && msg.sources.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      {msg.sources.map((src) => (
                        <span
                          key={src}
                          style={{ color: resolvedLinkColor }}
                          className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${
                            isDark
                              ? 'border-gray-700 bg-gray-800'
                              : 'border-gray-200 bg-white'
                          }`}
                        >
                          Source: {src}
                        </span>
                      ))}
                    </div>
                  )}

                  {!isUser && !hideFeedbackButtons && (
                    <div className="mt-1.5 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleFeedback(msg.id, 'up')}
                        aria-label="Helpful"
                        className={`rounded p-1 transition-colors ${
                          msg.feedback === 'up'
                            ? 'text-green-600'
                            : isDark
                              ? 'text-gray-500 hover:text-gray-300'
                              : 'text-gray-400 hover:text-gray-700'
                        }`}
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFeedback(msg.id, 'down')}
                        aria-label="Not helpful"
                        className={`rounded p-1 transition-colors ${
                          msg.feedback === 'down'
                            ? 'text-red-500'
                            : isDark
                              ? 'text-gray-500 hover:text-gray-300'
                              : 'text-gray-400 hover:text-gray-700'
                        }`}
                      >
                        <ThumbsDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {sending && (
              <div className="flex items-start">
                <div
                  className={`rounded-2xl rounded-bl-sm px-3.5 py-2 text-xs animate-pulse ${
                    isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  Thinking...
                </div>
              </div>
            )}

            {notice && (
              <div className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">
                {notice}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Input + Terms + Disclaimer + Watermark */}
      {resolvedTab === 'chat' && (
        <div
          className={`shrink-0 border-t px-3.5 py-3 ${
            isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'
          }`}
        >
          {requireTermsAcceptance && (
            <label
              className={`mb-2.5 flex cursor-pointer items-center gap-2 text-xs ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}
            >
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
              />
              <span>
                I accept the{' '}
                <span
                  style={{ color: resolvedLinkColor }}
                  className="underline"
                >
                  terms and conditions
                </span>{' '}
                to start chatting.
              </span>
            </label>
          )}

          <form
            onSubmit={handleSendMessage}
            className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 ${
              isDark
                ? 'border-gray-700 bg-gray-800'
                : 'border-gray-300 bg-gray-50'
            }`}
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={sending || (requireTermsAcceptance && !termsAccepted)}
              placeholder={placeholderText}
              className={`min-w-0 flex-1 bg-transparent text-sm focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
                isDark
                  ? 'text-white placeholder:text-gray-400'
                  : 'text-gray-900 placeholder:text-gray-400'
              }`}
            />
            <button
              type="submit"
              disabled={
                sending ||
                !inputValue.trim() ||
                (requireTermsAcceptance && !termsAccepted)
              }
              style={{
                backgroundColor: primaryColor,
                color: textColor,
              }}
              aria-label="Send message"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>

          {disclaimerText && (
            <p
              className={`mt-2 text-center text-[11px] leading-snug ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              {disclaimerText}
            </p>
          )}

          <p
            className={`mt-2 text-center text-[11px] ${
              isDark ? 'text-gray-500' : 'text-gray-400'
            }`}
          >
            Powered by <span className="font-semibold">Cadence</span>
          </p>
        </div>
      )}

      {/* Bottom Navigation */}
      {!hideBottomNavigation && (
        <div
          className={`grid shrink-0 grid-cols-3 border-t text-xs font-medium ${
            isDark
              ? 'border-gray-800 bg-gray-950 text-gray-400'
              : 'border-gray-200 bg-gray-50 text-gray-500'
          }`}
        >
          {!hideHomePage ? (
            <button
              type="button"
              onClick={() => setActiveTab('home')}
              style={
                resolvedTab === 'home' ? { color: resolvedLinkColor } : undefined
              }
              className="flex flex-col items-center justify-center gap-1 py-2 transition-colors"
            >
              <Home className="h-4 w-4" />
              <span>Home</span>
            </button>
          ) : (
            <div />
          )}
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            style={
              resolvedTab === 'chat' ? { color: resolvedLinkColor } : undefined
            }
            className="flex flex-col items-center justify-center gap-1 py-2 transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Messages</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('account')}
            style={
              resolvedTab === 'account' ? { color: resolvedLinkColor } : undefined
            }
            className="flex flex-col items-center justify-center gap-1 py-2 transition-colors"
          >
            <User className="h-4 w-4" />
            <span>Account</span>
          </button>
        </div>
      )}
    </div>
  );
}
