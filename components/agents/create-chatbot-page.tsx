'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  ChevronLeft,
  CirclePlay,
  ExternalLink,
  Home,
  Lock,
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
import { useApp } from '@/components/providers/app-provider';
import { BrandMark } from '@/components/ui/brand-loader';
import { VOICE_OPTIONS } from '@/lib/demo-data';

type AutoOpenMode = 'DONT_OPEN' | 'ALWAYS_OPEN_WITH_DELAY';
type IconSizeOption =
  | 'SMALL'
  | 'MEDIUM'
  | 'LARGE'
  | 'XL'
  | '2XL'
  | '3XL'
  | '4XL'
  | '5XL';
type IconPositionOption = 'RIGHT' | 'LEFT';
type IconShapeOption = 'CIRCLE' | 'SQUARE';
type PreviewTab = 'home' | 'chat' | 'account';

interface DemoMessage {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  source?: string;
  feedback?: 'up' | 'down' | null;
}

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

function toHexForPicker(value: string, fallback: string): string {
  const trimmed = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed;
  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    const r = trimmed[1];
    const g = trimmed[2];
    const b = trimmed[3];
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return fallback;
}

function SettingToggle({
  id,
  name,
  title,
  description,
  checked,
  onChange,
  disabled = false,
}: {
  id: string;
  name: string;
  title: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={`flex items-start justify-between gap-6 ${
        disabled ? 'cursor-not-allowed opacity-75' : ''
      }`}
    >
      <label
        htmlFor={id}
        className={`min-w-0 flex-1 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <p className="text-base font-medium text-gray-900">{title}</p>
        <p className="mt-1 text-sm font-normal text-gray-600">{description}</p>
      </label>
      <div className="relative shrink-0">
        <input
          id={id}
          name={name}
          type="checkbox"
          form="create-chatbot-form"
          aria-label={title}
          disabled={disabled}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only opacity-0 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <label
          htmlFor={id}
          className={`relative flex h-5 w-9 items-center rounded-full px-0.5 transition-colors before:h-4 before:w-4 before:rounded-full before:bg-white before:shadow before:transition-transform before:duration-300 peer-checked:bg-green-500 peer-checked:before:translate-x-full peer-focus-visible:outline peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gray-400 peer-checked:peer-focus-visible:outline-green-500 ${
            disabled ? 'cursor-not-allowed bg-gray-400' : 'cursor-pointer bg-gray-400'
          }`}
        >
          <span className="sr-only">{title}</span>
        </label>
      </div>
    </div>
  );
}

export function CreateChatbotPage() {
  const router = useRouter();
  const { activeWorkspace, addAgent, pushToast } = useApp();

  // Content section state
  const [chatbotName, setChatbotName] = useState('');
  const [tooltip, setTooltip] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [placeholderText, setPlaceholderText] = useState('');

  // Chat Interface section state
  const [brandColor, setBrandColor] = useState('');
  const [brandTextColor, setBrandTextColor] = useState('');
  const [iconBackgroundColor, setIconBackgroundColor] = useState('');
  const [iconBackgroundTransparent, setIconBackgroundTransparent] = useState(false);
  const [linkColor, setLinkColor] = useState('');
  const [fontSize, setFontSize] = useState('');
  const [height, setHeight] = useState('');
  const [externalLinkUrl, setExternalLinkUrl] = useState('');

  // Toggles & Disclaimer
  const [hideSources, setHideSources] = useState(false);
  const [hideTooltip, setHideTooltip] = useState(false);
  const [hideFeedbackButtons, setHideFeedbackButtons] = useState(false);
  const [hideBottomNavigation, setHideBottomNavigation] = useState(false);
  const [showMessagesTabForAnonymous, setShowMessagesTabForAnonymous] = useState(false);
  const [hideRefreshButton, setHideRefreshButton] = useState(false);
  const [hideExpandButton, setHideExpandButton] = useState(false);
  const [hideHomePage, setHideHomePage] = useState(false);
  const [rtl, setRtl] = useState(false);
  const [stayOnHomeIfNoThread, setStayOnHomeIfNoThread] = useState(false);
  const [requireTermsAcceptance, setRequireTermsAcceptance] = useState(false);
  const [disclaimerText, setDisclaimerText] = useState('');
  const [enableDarkMode, setEnableDarkMode] = useState(false);

  // Auto Open Chat Window section state
  const [autoOpenChatWindowInDesktop, setAutoOpenChatWindowInDesktop] =
    useState<AutoOpenMode>('DONT_OPEN');
  const [autoOpenChatWindowDelayInDesktop, setAutoOpenChatWindowDelayInDesktop] =
    useState('5');
  const [autoOpenChatWindowInMobile, setAutoOpenChatWindowInMobile] =
    useState<AutoOpenMode>('DONT_OPEN');
  const [autoOpenChatWindowDelayInMobile, setAutoOpenChatWindowDelayInMobile] =
    useState('5');

  // Chat Icon section state
  const [distanceFromBottom, setDistanceFromBottom] = useState('16');
  const [distanceFromBottomInMobile, setDistanceFromBottomInMobile] = useState('');
  const [horizontalDistance, setHorizontalDistance] = useState('16');
  const [horizontalDistanceInMobile, setHorizontalDistanceInMobile] = useState('');
  const [iconSize, setIconSize] = useState<IconSizeOption>('SMALL');
  const [iconPosition, setIconPosition] = useState<IconPositionOption>('RIGHT');
  const [iconShape, setIconShape] = useState<IconShapeOption>('CIRCLE');

  // Submission & modal state
  const [submitting, setSubmitting] = useState(false);
  const [nameError, setNameError] = useState('');
  const [tutorialOpen, setTutorialOpen] = useState(false);

  // Demo Chatbot interactive preview state
  const [previewTab, setPreviewTab] = useState<PreviewTab>('chat');
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [demoInput, setDemoInput] = useState('');
  const [demoMessages, setDemoMessages] = useState<DemoMessage[]>([]);

  const resolvedPrimaryColor = brandColor.trim() || '#000000';
  const resolvedTextColor = brandTextColor.trim() || '#FFFFFF';
  const resolvedIconBgColor = iconBackgroundColor.trim() || resolvedPrimaryColor;
  const resolvedLinkColor = linkColor.trim() || resolvedPrimaryColor;
  const resolvedBotName = chatbotName.trim() || 'My Company Chatbot';
  const resolvedWelcomeMessage =
    welcomeMessage.trim() || 'Hello! How can I assist you today?';
  const resolvedTooltip = tooltip.trim() || resolvedWelcomeMessage;
  const resolvedPlaceholder = placeholderText.trim() || 'Ask me anything...';
  const resolvedFontSize = useMemo(() => {
    const parsed = Number(fontSize);
    if (!Number.isFinite(parsed) || parsed <= 0) return 14;
    return Math.min(22, Math.max(12, parsed));
  }, [fontSize]);
  const resolvedHeightPercent = useMemo(() => {
    const parsed = Number(height);
    if (!Number.isFinite(parsed) || parsed <= 0) return 85;
    return Math.min(100, Math.max(40, parsed));
  }, [height]);
  const resolvedLauncherPx = ICON_SIZE_PIXELS[iconSize];
  const previewIconPx = Math.min(72, Math.max(40, Math.round(resolvedLauncherPx * 0.65)));

  const activePreviewTab: PreviewTab = hideHomePage
    ? previewTab === 'home'
      ? 'chat'
      : previewTab
    : stayOnHomeIfNoThread && demoMessages.length === 0 && previewTab === 'chat'
      ? 'home'
      : previewTab;

  const displayedMessages: DemoMessage[] = useMemo(() => {
    const initial: DemoMessage = {
      id: 'welcome',
      role: 'assistant',
      text: resolvedWelcomeMessage,
      source: 'Getting Started Guide',
      feedback: null,
    };
    return [initial, ...demoMessages];
  }, [resolvedWelcomeMessage, demoMessages]);

  const handleResetDemo = () => {
    setDemoMessages([]);
    setDemoInput('');
    setTermsAccepted(false);
    setPreviewTab(hideHomePage || !stayOnHomeIfNoThread ? 'chat' : 'home');
  };

  const handleSendDemoMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const text = demoInput.trim();
    if (!text) return;
    if (requireTermsAcceptance && !termsAccepted) return;

    const userMsg: DemoMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      text,
    };
    const botReply: DemoMessage = {
      id: `a_${Date.now() + 1}`,
      role: 'assistant',
      text: `Thanks for asking! Once created, ${resolvedBotName} will answer using your website pages, uploaded documents, and custom instructions.`,
      source: 'Website Knowledge Base',
      feedback: null,
    };
    setDemoMessages((prev) => [...prev, userMsg, botReply]);
    setDemoInput('');
  };

  const handleFeedback = (msgId: string, vote: 'up' | 'down') => {
    setDemoMessages((prev) =>
      prev.map((m) =>
        m.id === msgId ? { ...m, feedback: m.feedback === vote ? null : vote } : m
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const cleanName = chatbotName.trim();
    if (!cleanName) {
      setNameError('Chatbot Name is required.');
      document.getElementById('chatbotName')?.focus();
      return;
    }
    setNameError('');

    const defaultVoice = VOICE_OPTIONS[0];
    const voiceLabel = `${defaultVoice.name} · ${defaultVoice.gender} · ${defaultVoice.language}`;
    const workspaceLabel = activeWorkspace?.name?.trim() || cleanName;
    const cleanWebsiteUrl = externalLinkUrl.trim();
    const safeDescription =
      tooltip.trim() ||
      welcomeMessage.trim() ||
      `AI website chatbot for ${workspaceLabel}`;

    setSubmitting(true);
    try {
      const newAgentId = await addAgent({
        name: cleanName,
        businessName: workspaceLabel,
        description: safeDescription.slice(0, 1000),
        websiteUrl: cleanWebsiteUrl,
        welcomeMessage: resolvedWelcomeMessage.slice(0, 500),
        status: 'Active',
        personality: 'Friendly',
        customInstructions:
          'Greet website visitors politely, answer questions accurately using indexed knowledge, and invite them to leave their contact details if follow-up is needed.',
        voiceId: defaultVoice.id,
        voiceLabel,
        language: defaultVoice.language,
        accentColor: resolvedPrimaryColor.slice(0, 20),
        widgetPosition: iconPosition === 'LEFT' ? 'bottom-left' : 'bottom-right',
        widgetTheme: enableDarkMode ? 'dark' : 'light',
        launcherLabel: 'Chat with us',
        leadCaptureEnabled: true,
        widgetConfig: {
          tooltip: tooltip.trim() || undefined,
          placeholderText: placeholderText.trim() || undefined,
          brandColor: brandColor.trim() || '#000000',
          brandTextColor: brandTextColor.trim() || '#FFFFFF',
          iconBackgroundColor: iconBackgroundColor.trim() || undefined,
          iconBackgroundTransparent,
          linkColor: linkColor.trim() || undefined,
          fontSize: Number.isFinite(Number(fontSize)) && Number(fontSize) > 0 ? Number(fontSize) : 16,
          height: Number.isFinite(Number(height)) && Number(height) > 0 ? Number(height) : 85,
          externalLinkUrl: cleanWebsiteUrl || undefined,
          hideSources,
          hideTooltip,
          hideFeedbackButtons,
          hideBottomNavigation,
          showMessagesTabForAnonymous,
          hideRefreshButton,
          hideExpandButton,
          hideHomePage,
          rtl,
          stayOnHomeIfNoThread,
          requireTermsAcceptance,
          disclaimerText: disclaimerText.trim() || undefined,
          enableDarkMode,
          autoOpenChatWindowInDesktop,
          autoOpenChatWindowDelayInDesktop: Number(autoOpenChatWindowDelayInDesktop) || 5,
          autoOpenChatWindowInMobile,
          autoOpenChatWindowDelayInMobile: Number(autoOpenChatWindowDelayInMobile) || 5,
          distanceFromBottom: Number(distanceFromBottom) || 16,
          distanceFromBottomInMobile: distanceFromBottomInMobile.trim()
            ? Number(distanceFromBottomInMobile)
            : undefined,
          horizontalDistance: Number(horizontalDistance) || 16,
          horizontalDistanceInMobile: horizontalDistanceInMobile.trim()
            ? Number(horizontalDistanceInMobile)
            : undefined,
          iconSize,
          iconPosition,
          iconShape,
        },
      });

      pushToast({
        title: 'Chatbot created',
        description: `${cleanName} is ready to configure and embed.`,
        variant: 'success',
      });
      router.push(`/agents/${newAgentId}`);
    } catch (err) {
      pushToast({
        title: 'Unable to create chatbot',
        description:
          err instanceof Error ? err.message : 'Check your connection and try again.',
        variant: 'error',
      });
      setSubmitting(false);
    }
  };

  const inputBaseClass =
    'block w-full rounded-xl border-0 bg-white px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 transition-all duration-150 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-600 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-50 sm:text-sm sm:leading-6 caret-blue-600';

  const selectBaseClass =
    'block w-full rounded-xl border-0 bg-white px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6';

  const textareaBaseClass =
    'block w-full resize-y rounded-xl border-0 bg-white px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 transition-all duration-150 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm sm:leading-6 caret-blue-600';

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <div className="mt-4 flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <div className="inline-flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">Create New Chatbot</h1>
              <button
                type="button"
                onClick={() => setTutorialOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1.5 text-sm font-semibold text-blue-700 ring-1 ring-inset ring-blue-200 transition-all duration-150 hover:bg-blue-700 hover:text-white hover:ring-blue-700"
              >
                <CirclePlay className="-ml-0.5 h-5 w-5" />
                Watch Video Tutorial
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-xs transition-colors hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              form="create-chatbot-form"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Creating...' : 'Create Chatbot'}
            </button>
          </div>
        </div>
      </div>

      <hr className="border-gray-200" />

      <form id="create-chatbot-form" onSubmit={handleSubmit} noValidate />

      <fieldset className="flex w-full min-w-0 flex-col gap-8 overflow-hidden xl:flex-row xl:items-start xl:gap-12 xl:overflow-visible">
        {/* Left Settings Form */}
        <div className="min-w-0 flex-1 space-y-8 pb-8">
          {/* 1. Content */}
          <div>
            <h2 className="text-xl font-bold text-gray-900">Content</h2>
            <p className="mt-1 text-sm font-normal text-gray-600">
              Change the text related things in the chatbot.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-y-6">
              <div>
                <div className="flex justify-between">
                  <label
                    htmlFor="chatbotName"
                    className="block text-sm font-medium leading-6 text-gray-900 after:ml-0.5 after:text-red-500 after:content-['*']"
                  >
                    Chatbot Name
                  </label>
                </div>
                <div className="mt-2">
                  <div className="relative">
                    <input
                      id="chatbotName"
                      name="chatbotName"
                      aria-label="Chatbot Name"
                      required
                      type="text"
                      placeholder="My Company Chatbot"
                      form="create-chatbot-form"
                      value={chatbotName}
                      onChange={(e) => {
                        setChatbotName(e.target.value);
                        if (nameError) setNameError('');
                      }}
                      className={`${inputBaseClass} ${
                        nameError ? 'ring-red-500 focus:ring-red-600' : ''
                      }`}
                    />
                  </div>
                </div>
                {nameError && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">{nameError}</p>
                )}
              </div>

              <div>
                <div className="flex justify-between">
                  <label
                    htmlFor="tooltip"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    Tooltip
                  </label>
                </div>
                <div className="mt-2">
                  <textarea
                    id="tooltip"
                    name="tooltip"
                    aria-label="Tooltip"
                    rows={3}
                    placeholder="Hello! How can I assist you today?"
                    form="create-chatbot-form"
                    value={tooltip}
                    onChange={(e) => setTooltip(e.target.value)}
                    className={textareaBaseClass}
                  />
                </div>
                <p className="mt-3 text-sm leading-6 text-gray-600">
                  This tooltip will be shown on the top of chatbot icon. If not set,
                  welcome message will be shown as tooltip.
                </p>
              </div>

              <div>
                <div className="flex justify-between">
                  <label
                    htmlFor="welcomeMessage"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    Welcome Message
                  </label>
                </div>
                <div className="mt-2">
                  <textarea
                    id="welcomeMessage"
                    name="welcomeMessage"
                    aria-label="Welcome Message"
                    rows={3}
                    placeholder="Hello! How can I assist you today?"
                    form="create-chatbot-form"
                    value={welcomeMessage}
                    onChange={(e) => setWelcomeMessage(e.target.value)}
                    className={textareaBaseClass}
                  />
                </div>
                <p className="mt-3 text-sm leading-6 text-gray-600">
                  The first message that the users will see in the chatbot.
                </p>
              </div>

              <div>
                <div className="flex justify-between">
                  <label
                    htmlFor="placeholderText"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    Input Placeholder Text
                  </label>
                </div>
                <div className="mt-2">
                  <div className="relative">
                    <input
                      id="placeholderText"
                      name="placeholderText"
                      aria-label="Input Placeholder Text"
                      type="text"
                      placeholder="Ask me anything..."
                      form="create-chatbot-form"
                      value={placeholderText}
                      onChange={(e) => setPlaceholderText(e.target.value)}
                      className={inputBaseClass}
                    />
                  </div>
                </div>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Placeholder text that users see before they type their question in the
                  chat.
                </p>
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* 2. Chat Interface */}
          <div>
            <h2 className="text-xl font-bold text-gray-900">Chat Interface</h2>
            <p className="mt-1 text-sm font-normal text-gray-600">
              This will be applied when embedded on a website.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-y-6">
              {/* Primary Color */}
              <div>
                <div className="flex justify-between">
                  <label
                    htmlFor="brandColor"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    Primary Color
                  </label>
                </div>
                <div className="mt-2">
                  <div className="relative">
                    <input
                      id="brandColor"
                      name="brandColor"
                      aria-label="Primary Color"
                      type="text"
                      placeholder="#000000"
                      form="create-chatbot-form"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className={`${inputBaseClass} pr-12`}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <label className="relative block h-6 w-6 cursor-pointer overflow-hidden rounded-lg ring-1 ring-gray-200">
                        <span
                          className="block h-full w-full"
                          style={{ backgroundColor: resolvedPrimaryColor }}
                        />
                        <input
                          type="color"
                          aria-label="Pick Primary Color"
                          value={toHexForPicker(brandColor, '#000000')}
                          onChange={(e) => setBrandColor(e.target.value)}
                          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Text Color */}
              <div>
                <div className="flex justify-between">
                  <label
                    htmlFor="brandTextColor"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    Text Color
                  </label>
                </div>
                <div className="mt-2">
                  <div className="relative">
                    <input
                      id="brandTextColor"
                      name="brandTextColor"
                      aria-label="Text Color"
                      type="text"
                      placeholder="#FFFFFF"
                      form="create-chatbot-form"
                      value={brandTextColor}
                      onChange={(e) => setBrandTextColor(e.target.value)}
                      className={`${inputBaseClass} pr-12`}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <label className="relative block h-6 w-6 cursor-pointer overflow-hidden rounded-lg ring-1 ring-gray-200">
                        <span
                          className="block h-full w-full"
                          style={{ backgroundColor: resolvedTextColor }}
                        />
                        <input
                          type="color"
                          aria-label="Pick Text Color"
                          value={toHexForPicker(brandTextColor, '#ffffff')}
                          onChange={(e) => setBrandTextColor(e.target.value)}
                          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Icon Background Color */}
              <div>
                <div className="flex justify-between">
                  <label
                    htmlFor="iconBackgroundColor"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    Icon Background Color
                  </label>
                </div>
                <div className="mt-2">
                  <div className="relative">
                    <input
                      id="iconBackgroundColor"
                      name="iconBackgroundColor"
                      aria-label="Icon Background Color"
                      type="text"
                      placeholder="Leave empty to use primary color"
                      form="create-chatbot-form"
                      value={iconBackgroundColor}
                      onChange={(e) => setIconBackgroundColor(e.target.value)}
                      className={`${inputBaseClass} pr-12`}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <label className="relative block h-6 w-6 cursor-pointer overflow-hidden rounded-lg ring-1 ring-gray-200">
                        <span
                          className="block h-full w-full"
                          style={{ backgroundColor: resolvedIconBgColor }}
                        />
                        <input
                          type="color"
                          aria-label="Pick Icon Background Color"
                          value={toHexForPicker(iconBackgroundColor, toHexForPicker(brandColor, '#000000'))}
                          onChange={(e) => setIconBackgroundColor(e.target.value)}
                          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <SettingToggle
                id="iconBackgroundTransparent"
                name="iconBackgroundTransparent"
                title="Transparent Icon Background"
                description="Show no background and no shadow behind the bot icon (useful for transparent PNG icons)"
                checked={iconBackgroundTransparent}
                onChange={setIconBackgroundTransparent}
              />

              {/* Link Color */}
              <div>
                <div className="flex justify-between">
                  <label
                    htmlFor="linkColor"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    Link Color
                  </label>
                </div>
                <div className="mt-2">
                  <div className="relative">
                    <input
                      id="linkColor"
                      name="linkColor"
                      aria-label="Link Color"
                      type="text"
                      placeholder="Leave empty to use primary color"
                      form="create-chatbot-form"
                      value={linkColor}
                      onChange={(e) => setLinkColor(e.target.value)}
                      className={`${inputBaseClass} pr-12`}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <label className="relative block h-6 w-6 cursor-pointer overflow-hidden rounded-lg ring-1 ring-gray-200">
                        <span
                          className="block h-full w-full"
                          style={{ backgroundColor: resolvedLinkColor }}
                        />
                        <input
                          type="color"
                          aria-label="Pick Link Color"
                          value={toHexForPicker(linkColor, toHexForPicker(brandColor, '#000000'))}
                          onChange={(e) => setLinkColor(e.target.value)}
                          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Font Size & Chat Height */}
              <div className="mt-2 grid grid-cols-1 items-end gap-x-5 gap-y-6 sm:grid-cols-2">
                <div>
                  <div className="flex justify-between">
                    <label
                      htmlFor="fontSize"
                      className="block text-sm font-medium leading-6 text-gray-900"
                    >
                      Font Size (in px)
                    </label>
                  </div>
                  <div className="mt-2">
                    <input
                      id="fontSize"
                      name="fontSize"
                      aria-label="Font Size (in px)"
                      type="number"
                      placeholder="16"
                      form="create-chatbot-form"
                      value={fontSize}
                      onChange={(e) => setFontSize(e.target.value)}
                      className={inputBaseClass}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between">
                    <label
                      htmlFor="height"
                      className="block text-sm font-medium leading-6 text-gray-900"
                    >
                      Chat Height (in %)
                    </label>
                  </div>
                  <div className="mt-2">
                    <input
                      id="height"
                      name="height"
                      aria-label="Chat Height (in %)"
                      type="number"
                      min={1}
                      max={100}
                      placeholder="85"
                      form="create-chatbot-form"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className={inputBaseClass}
                    />
                  </div>
                </div>
              </div>

              {/* External Link URL */}
              <div>
                <div className="flex justify-between">
                  <label
                    htmlFor="externalLinkUrl"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    External Link URL
                  </label>
                </div>
                <div className="mt-2">
                  <input
                    id="externalLinkUrl"
                    name="externalLinkUrl"
                    aria-label="External Link URL"
                    type="url"
                    placeholder="https://mywebsite.com"
                    form="create-chatbot-form"
                    value={externalLinkUrl}
                    onChange={(e) => setExternalLinkUrl(e.target.value)}
                    className={inputBaseClass}
                  />
                </div>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  When set, an external link icon will appear in the chat widget header.
                  Clicking it opens this URL in a new tab.
                </p>
              </div>

              {/* Watermark Settings (Locked Add-on) */}
              <p className="flex items-start gap-2 text-sm text-gray-700">
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
                <span>
                  Watermark settings need the Remove &lsquo;Powered by Cadence&rsquo;
                  add-on on the chatbot owner&rsquo;s account. The chatbot owner can add
                  it on the{' '}
                  <Link
                    href="/pricing"
                    className="rounded font-medium text-blue-700 underline underline-offset-2 hover:text-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    Billing page
                  </Link>
                  .
                </span>
              </p>

              <div>
                <div className="flex justify-between">
                  <label
                    htmlFor="watermarkText"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    Watermark Text
                  </label>
                </div>
                <div className="mt-2">
                  <input
                    id="watermarkText"
                    name="watermarkText"
                    aria-label="Watermark Text"
                    type="text"
                    placeholder="Powered by Cadence"
                    form="create-chatbot-form"
                    disabled
                    value=""
                    readOnly
                    className={inputBaseClass}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between">
                  <label
                    htmlFor="watermarkLink"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    Watermark Link
                  </label>
                </div>
                <div className="mt-2">
                  <input
                    id="watermarkLink"
                    name="watermarkLink"
                    aria-label="Watermark Link"
                    type="url"
                    placeholder="https://cadence.ai"
                    form="create-chatbot-form"
                    disabled
                    value=""
                    readOnly
                    className={inputBaseClass}
                  />
                </div>
              </div>

              <SettingToggle
                id="hideWatermark"
                name="hideWatermark"
                title="Hide Powered By (Cadence Branding)"
                description="Do not show the Cadence watermark."
                checked={false}
                onChange={() => {}}
                disabled
              />

              <SettingToggle
                id="hideSources"
                name="hideSources"
                title="Hide Sources"
                description="Hide the sources from where the response got generated from."
                checked={hideSources}
                onChange={setHideSources}
              />

              <SettingToggle
                id="hideTooltip"
                name="hideTooltip"
                title="Hide Tooltip"
                description="Turn this on if you do not want to show the tooltip on chat icon."
                checked={hideTooltip}
                onChange={setHideTooltip}
              />

              <SettingToggle
                id="hideFeedbackButtons"
                name="hideFeedbackButtons"
                title="Hide Feedback Buttons"
                description="Turn this on if you do not want to show the thumbs up and thumbs down buttons."
                checked={hideFeedbackButtons}
                onChange={setHideFeedbackButtons}
              />

              <SettingToggle
                id="hideBottomNavigation"
                name="hideBottomNavigation"
                title="Hide Bottom Navigation"
                description="Turn this on to hide the bottom navigation (Home, Messages, Account tabs) in the chat widget."
                checked={hideBottomNavigation}
                onChange={setHideBottomNavigation}
              />

              <SettingToggle
                id="showMessagesTabForAnonymous"
                name="showMessagesTabForAnonymous"
                title="Show Chat History for Anonymous Users"
                description="Allow users who haven't provided their email to view their conversation history in the Messages tab."
                checked={showMessagesTabForAnonymous}
                onChange={setShowMessagesTabForAnonymous}
              />

              <SettingToggle
                id="hideRefreshButton"
                name="hideRefreshButton"
                title="Hide Refresh Button"
                description="Turn this on to hide the refresh button in the chat widget header."
                checked={hideRefreshButton}
                onChange={setHideRefreshButton}
              />

              <SettingToggle
                id="hideExpandButton"
                name="hideExpandButton"
                title="Hide Expand Button"
                description="Turn this on to hide the expand button in the chat widget header."
                checked={hideExpandButton}
                onChange={setHideExpandButton}
              />

              <SettingToggle
                id="hideHomePage"
                name="hideHomePage"
                title="Hide Home Page"
                description="Turn this on to hide the home page. The back button will be replaced with a button to start a new conversation."
                checked={hideHomePage}
                onChange={setHideHomePage}
              />

              <SettingToggle
                id="rtl"
                name="rtl"
                title="RTL Mode"
                description="Turn this on if you want your chatbot to be in rtl mode."
                checked={rtl}
                onChange={setRtl}
              />

              <SettingToggle
                id="stayOnHomeIfNoThread"
                name="stayOnHomeIfNoThread"
                title="Stay on Home Page (No Auto-Redirect)"
                description="When enabled, users will stay on the home page when there's no existing conversation, instead of automatically creating a new conversation and redirecting."
                checked={stayOnHomeIfNoThread}
                onChange={(next) => {
                  setStayOnHomeIfNoThread(next);
                  if (next && !hideHomePage && demoMessages.length === 0) {
                    setPreviewTab('home');
                  }
                }}
              />

              <SettingToggle
                id="requireTermsAcceptance"
                name="requireTermsAcceptance"
                title="Require Terms Acceptance"
                description="When enabled, users must check a checkbox agreeing to your terms before they can start a conversation."
                checked={requireTermsAcceptance}
                onChange={setRequireTermsAcceptance}
              />

              <div>
                <div className="flex justify-between">
                  <label
                    htmlFor="disclaimerText"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    Disclaimer Text (Markdown)
                  </label>
                </div>
                <div className="mt-2">
                  <textarea
                    id="disclaimerText"
                    name="disclaimerText"
                    aria-label="Disclaimer Text (Markdown)"
                    rows={3}
                    placeholder="This AI is continuously learning. Please verify any information provided."
                    form="create-chatbot-form"
                    value={disclaimerText}
                    onChange={(e) => setDisclaimerText(e.target.value)}
                    className={textareaBaseClass}
                  />
                </div>
                <p className="mt-3 text-sm leading-6 text-gray-600">
                  Optional text shown below the message input. Always visible, no checkbox
                  required. Supports markdown.
                </p>
              </div>

              <SettingToggle
                id="enableDarkMode"
                name="enableDarkMode"
                title="Enable Dark Mode"
                description="Turn this on to enable dark mode for the chat widget. This will apply dark theme colors to the entire chat interface."
                checked={enableDarkMode}
                onChange={setEnableDarkMode}
              />
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* 3. Auto Open Chat Window */}
          <div>
            <h2 className="text-xl font-bold text-gray-900">Auto Open Chat Window</h2>
            <p className="mt-1 text-sm font-normal text-gray-600">
              Customize the behaviour of automatically opening the chat window when the
              page loads.
            </p>

            <div className="mt-6 grid grid-cols-1 items-end gap-x-5 gap-y-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="autoOpenChatWindowInDesktop"
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  Open chat window (In desktop)
                </label>
                <div className="mt-2">
                  <select
                    id="autoOpenChatWindowInDesktop"
                    name="autoOpenChatWindowInDesktop"
                    form="create-chatbot-form"
                    value={autoOpenChatWindowInDesktop}
                    onChange={(e) =>
                      setAutoOpenChatWindowInDesktop(e.target.value as AutoOpenMode)
                    }
                    className={selectBaseClass}
                  >
                    <option value="DONT_OPEN">Don&apos;t open automatically</option>
                    <option value="ALWAYS_OPEN_WITH_DELAY">
                      Always open automatically (after delay)
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between">
                  <label
                    htmlFor="autoOpenChatWindowDelayInDesktop"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    Delay to open chat window (In desktop) (In seconds)
                  </label>
                </div>
                <div className="mt-2">
                  <input
                    id="autoOpenChatWindowDelayInDesktop"
                    name="autoOpenChatWindowDelayInDesktop"
                    aria-label="Delay to open chat window (In desktop) (In seconds)"
                    type="number"
                    min={0}
                    placeholder="5"
                    form="create-chatbot-form"
                    disabled={autoOpenChatWindowInDesktop === 'DONT_OPEN'}
                    value={autoOpenChatWindowDelayInDesktop}
                    onChange={(e) => setAutoOpenChatWindowDelayInDesktop(e.target.value)}
                    className={inputBaseClass}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="autoOpenChatWindowInMobile"
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  Open chat window (In mobile)
                </label>
                <div className="mt-2">
                  <select
                    id="autoOpenChatWindowInMobile"
                    name="autoOpenChatWindowInMobile"
                    form="create-chatbot-form"
                    value={autoOpenChatWindowInMobile}
                    onChange={(e) =>
                      setAutoOpenChatWindowInMobile(e.target.value as AutoOpenMode)
                    }
                    className={selectBaseClass}
                  >
                    <option value="DONT_OPEN">Don&apos;t open automatically</option>
                    <option value="ALWAYS_OPEN_WITH_DELAY">
                      Always open automatically (after delay)
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between">
                  <label
                    htmlFor="autoOpenChatWindowDelayInMobile"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    Delay to open chat window (In mobile) (In seconds)
                  </label>
                </div>
                <div className="mt-2">
                  <input
                    id="autoOpenChatWindowDelayInMobile"
                    name="autoOpenChatWindowDelayInMobile"
                    aria-label="Delay to open chat window (In mobile) (In seconds)"
                    type="number"
                    min={0}
                    placeholder="5"
                    form="create-chatbot-form"
                    disabled={autoOpenChatWindowInMobile === 'DONT_OPEN'}
                    value={autoOpenChatWindowDelayInMobile}
                    onChange={(e) => setAutoOpenChatWindowDelayInMobile(e.target.value)}
                    className={inputBaseClass}
                  />
                </div>
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* 4. Chat Icon */}
          <div>
            <h2 className="text-xl font-bold text-gray-900">Chat Icon</h2>
            <p className="mt-1 text-sm font-normal text-gray-600">
              Customize the position and size of the chat icon.
            </p>

            <div className="mt-6 grid grid-cols-1 items-end gap-x-5 gap-y-6 sm:grid-cols-2">
              <div>
                <div className="flex justify-between">
                  <label
                    htmlFor="distanceFromBottom"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    Distance from Bottom (in px)
                  </label>
                </div>
                <div className="mt-2">
                  <input
                    id="distanceFromBottom"
                    name="distanceFromBottom"
                    aria-label="Distance from Bottom (in px)"
                    type="number"
                    placeholder="16"
                    form="create-chatbot-form"
                    value={distanceFromBottom}
                    onChange={(e) => setDistanceFromBottom(e.target.value)}
                    className={inputBaseClass}
                  />
                </div>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Distance from bottom of screen on desktop
                </p>
              </div>

              <div>
                <div className="flex justify-between">
                  <label
                    htmlFor="distanceFromBottomInMobile"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    Distance from Bottom on Mobile (in px)
                  </label>
                </div>
                <div className="mt-2">
                  <input
                    id="distanceFromBottomInMobile"
                    name="distanceFromBottomInMobile"
                    aria-label="Distance from Bottom on Mobile (in px)"
                    type="number"
                    placeholder="16"
                    form="create-chatbot-form"
                    value={distanceFromBottomInMobile}
                    onChange={(e) => setDistanceFromBottomInMobile(e.target.value)}
                    className={inputBaseClass}
                  />
                </div>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Defaults to desktop value if empty
                </p>
              </div>

              <div>
                <div className="flex justify-between">
                  <label
                    htmlFor="horizontalDistance"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    Horizontal Distance (in px)
                  </label>
                </div>
                <div className="mt-2">
                  <input
                    id="horizontalDistance"
                    name="horizontalDistance"
                    aria-label="Horizontal Distance (in px)"
                    type="number"
                    placeholder="16"
                    form="create-chatbot-form"
                    value={horizontalDistance}
                    onChange={(e) => setHorizontalDistance(e.target.value)}
                    className={inputBaseClass}
                  />
                </div>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Distance from left/right edge on desktop
                </p>
              </div>

              <div>
                <div className="flex justify-between">
                  <label
                    htmlFor="horizontalDistanceInMobile"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    Horizontal Distance on Mobile (in px)
                  </label>
                </div>
                <div className="mt-2">
                  <input
                    id="horizontalDistanceInMobile"
                    name="horizontalDistanceInMobile"
                    aria-label="Horizontal Distance on Mobile (in px)"
                    type="number"
                    placeholder="16"
                    form="create-chatbot-form"
                    value={horizontalDistanceInMobile}
                    onChange={(e) => setHorizontalDistanceInMobile(e.target.value)}
                    className={inputBaseClass}
                  />
                </div>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Defaults to desktop value if empty
                </p>
              </div>

              <div>
                <label
                  htmlFor="iconSize"
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  Chat Icon Size
                </label>
                <div className="mt-2">
                  <select
                    id="iconSize"
                    name="iconSize"
                    form="create-chatbot-form"
                    value={iconSize}
                    onChange={(e) => setIconSize(e.target.value as IconSizeOption)}
                    className={selectBaseClass}
                  >
                    <option value="SMALL">Small (48x48 px)</option>
                    <option value="MEDIUM">Medium (56x56 px)</option>
                    <option value="LARGE">Large (64x64 px)</option>
                    <option value="XL">XL (72x72 px)</option>
                    <option value="2XL">2XL (80x80 px)</option>
                    <option value="3XL">3XL (96x96 px)</option>
                    <option value="4XL">4XL (128x128 px)</option>
                    <option value="5XL">5XL (156x156 px)</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="iconPosition"
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  Position
                </label>
                <div className="mt-2">
                  <select
                    id="iconPosition"
                    name="iconPosition"
                    form="create-chatbot-form"
                    value={iconPosition}
                    onChange={(e) =>
                      setIconPosition(e.target.value as IconPositionOption)
                    }
                    className={selectBaseClass}
                  >
                    <option value="RIGHT">Bottom - Right</option>
                    <option value="LEFT">Bottom - Left</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="iconShape"
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  Icon Shape
                </label>
                <div className="mt-2">
                  <select
                    id="iconShape"
                    name="iconShape"
                    form="create-chatbot-form"
                    value={iconShape}
                    onChange={(e) => setIconShape(e.target.value as IconShapeOption)}
                    className={selectBaseClass}
                  >
                    <option value="CIRCLE">Circle</option>
                    <option value="SQUARE">Square</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Bottom Submit Bar */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-xs transition-colors hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              form="create-chatbot-form"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Creating Chatbot...' : 'Create Chatbot'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Right Sticky Demo Chatbot Preview */}
        <div className="w-full overflow-hidden rounded-xl bg-gray-100 p-4 sm:p-6 xl:sticky xl:top-8 xl:max-w-md xl:self-start 2xl:max-w-lg">
          <p className="text-sm font-semibold text-gray-500">Demo Chatbot</p>

          <div className="mt-6">
            <div
              className="flex w-full flex-col justify-between gap-4"
              style={{ height: '85vh', maxHeight: '720px' }}
            >
              {/* Simulated Embedded Chat Window */}
              <div
                dir={rtl ? 'rtl' : 'ltr'}
                style={{
                  height: `${resolvedHeightPercent}%`,
                  fontSize: `${resolvedFontSize}px`,
                }}
                className={`flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border shadow-xl transition-all duration-200 ${
                  enableDarkMode
                    ? 'border-gray-800 bg-gray-900 text-gray-100'
                    : 'border-gray-200 bg-white text-gray-900'
                }`}
              >
                {/* Widget Header */}
                <div
                  className="flex shrink-0 items-center justify-between gap-2 px-4 py-3"
                  style={{
                    backgroundColor: resolvedPrimaryColor,
                    color: resolvedTextColor,
                  }}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    {!hideHomePage ? (
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewTab((prev) => (prev === 'home' ? 'chat' : 'home'))
                        }
                        title={activePreviewTab === 'home' ? 'Go to chat' : 'Back to home'}
                        className="rounded-lg p-1 opacity-85 transition-opacity hover:bg-white/15 hover:opacity-100"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResetDemo}
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
                        {resolvedBotName}
                      </p>
                      <p className="text-[11px] opacity-80">Online</p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    {externalLinkUrl.trim() && (
                      <a
                        href={
                          externalLinkUrl.trim().startsWith('http')
                            ? externalLinkUrl.trim()
                            : `https://${externalLinkUrl.trim()}`
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
                        onClick={handleResetDemo}
                        title="Refresh chat"
                        className="rounded-lg p-1.5 opacity-85 transition-opacity hover:bg-white/15 hover:opacity-100"
                      >
                        <RotateCw className="h-4 w-4" />
                      </button>
                    )}
                    {!hideExpandButton && (
                      <button
                        type="button"
                        onClick={() => setPreviewExpanded((prev) => !prev)}
                        title={previewExpanded ? 'Collapse preview' : 'Expand preview'}
                        className="rounded-lg p-1.5 opacity-85 transition-opacity hover:bg-white/15 hover:opacity-100"
                      >
                        {previewExpanded ? (
                          <Minimize2 className="h-4 w-4" />
                        ) : (
                          <Maximize2 className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Widget Main Content */}
                <div className="min-h-0 flex-1 overflow-y-auto p-4">
                  {activePreviewTab === 'home' && !hideHomePage && (
                    <div className="space-y-4">
                      <div
                        className={`rounded-2xl border p-4 ${
                          enableDarkMode
                            ? 'border-gray-800 bg-gray-800/70'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <p className="text-base font-semibold">
                          Welcome to {resolvedBotName}
                        </p>
                        <p
                          className={`mt-1.5 text-sm leading-relaxed ${
                            enableDarkMode ? 'text-gray-300' : 'text-gray-600'
                          }`}
                        >
                          {resolvedWelcomeMessage}
                        </p>
                        <button
                          type="button"
                          onClick={() => setPreviewTab('chat')}
                          style={{
                            backgroundColor: resolvedPrimaryColor,
                            color: resolvedTextColor,
                          }}
                          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-xs transition-opacity hover:opacity-90"
                        >
                          <Send className="h-4 w-4" />
                          Send us a message
                        </button>
                      </div>

                      {externalLinkUrl.trim() && (
                        <div
                          className={`rounded-xl border px-3.5 py-2.5 text-xs ${
                            enableDarkMode
                              ? 'border-gray-800 bg-gray-800/40 text-gray-300'
                              : 'border-gray-200 bg-white text-gray-600'
                          }`}
                        >
                          Helpful link:{' '}
                          <span
                            style={{ color: resolvedLinkColor }}
                            className="font-medium underline"
                          >
                            {externalLinkUrl.trim()}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {activePreviewTab === 'account' && (
                    <div className="space-y-3">
                      <div
                        className={`rounded-2xl border p-4 ${
                          enableDarkMode
                            ? 'border-gray-800 bg-gray-800/70'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <p className="text-sm font-semibold">Visitor Details</p>
                        <p
                          className={`mt-1 text-xs ${
                            enableDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}
                        >
                          {showMessagesTabForAnonymous
                            ? 'Anonymous users can view their past conversations in the Messages tab.'
                            : 'Visitors can share their email to persist conversation history.'}
                        </p>
                      </div>
                    </div>
                  )}

                  {activePreviewTab === 'chat' && (
                    <div className="space-y-3.5">
                      {displayedMessages.map((msg) => {
                        const isUser = msg.role === 'user';
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${
                              isUser ? 'items-end' : 'items-start'
                            }`}
                          >
                            <div
                              style={
                                isUser
                                  ? {
                                      backgroundColor: resolvedPrimaryColor,
                                      color: resolvedTextColor,
                                      fontSize: `${resolvedFontSize}px`,
                                    }
                                  : {
                                      fontSize: `${resolvedFontSize}px`,
                                    }
                              }
                              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                                isUser
                                  ? 'rounded-br-sm'
                                  : enableDarkMode
                                    ? 'rounded-bl-sm bg-gray-800 text-gray-100'
                                    : 'rounded-bl-sm bg-gray-100 text-gray-900'
                              }`}
                            >
                              {msg.text}
                              {!isUser && msg.id === 'welcome' && externalLinkUrl.trim() && (
                                <p className="mt-1.5 text-xs">
                                  <span
                                    style={{ color: resolvedLinkColor }}
                                    className="underline"
                                  >
                                    Visit resource
                                  </span>
                                </p>
                              )}
                            </div>

                            {!isUser && !hideSources && msg.source && (
                              <div className="mt-1.5 flex items-center gap-1.5">
                                <span
                                  style={{ color: resolvedLinkColor }}
                                  className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${
                                    enableDarkMode
                                      ? 'border-gray-700 bg-gray-800'
                                      : 'border-gray-200 bg-white'
                                  }`}
                                >
                                  Source: {msg.source}
                                </span>
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
                                      : enableDarkMode
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
                                      : enableDarkMode
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
                    </div>
                  )}
                </div>

                {/* Chat Input + Terms + Disclaimer + Watermark */}
                {activePreviewTab === 'chat' && (
                  <div
                    className={`shrink-0 border-t px-3.5 py-3 ${
                      enableDarkMode
                        ? 'border-gray-800 bg-gray-900'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    {requireTermsAcceptance && (
                      <label
                        className={`mb-2.5 flex cursor-pointer items-center gap-2 text-xs ${
                          enableDarkMode ? 'text-gray-300' : 'text-gray-600'
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
                      onSubmit={handleSendDemoMessage}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 ${
                        enableDarkMode
                          ? 'border-gray-700 bg-gray-800'
                          : 'border-gray-300 bg-gray-50'
                      }`}
                    >
                      <input
                        type="text"
                        value={demoInput}
                        onChange={(e) => setDemoInput(e.target.value)}
                        disabled={requireTermsAcceptance && !termsAccepted}
                        placeholder={resolvedPlaceholder}
                        className={`min-w-0 flex-1 bg-transparent text-sm focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
                          enableDarkMode
                            ? 'text-white placeholder:text-gray-400'
                            : 'text-gray-900 placeholder:text-gray-400'
                        }`}
                      />
                      <button
                        type="submit"
                        disabled={
                          !demoInput.trim() ||
                          (requireTermsAcceptance && !termsAccepted)
                        }
                        style={{
                          backgroundColor: resolvedPrimaryColor,
                          color: resolvedTextColor,
                        }}
                        aria-label="Send message"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </button>
                    </form>

                    {disclaimerText.trim() && (
                      <p
                        className={`mt-2 text-center text-[11px] leading-snug ${
                          enableDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}
                      >
                        {disclaimerText.trim()}
                      </p>
                    )}

                    <p
                      className={`mt-2 text-center text-[11px] ${
                        enableDarkMode ? 'text-gray-500' : 'text-gray-400'
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
                      enableDarkMode
                        ? 'border-gray-800 bg-gray-950 text-gray-400'
                        : 'border-gray-200 bg-gray-50 text-gray-500'
                    }`}
                  >
                    {!hideHomePage ? (
                      <button
                        type="button"
                        onClick={() => setPreviewTab('home')}
                        style={
                          activePreviewTab === 'home'
                            ? { color: resolvedLinkColor }
                            : undefined
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
                      onClick={() => setPreviewTab('chat')}
                      style={
                        activePreviewTab === 'chat'
                          ? { color: resolvedLinkColor }
                          : undefined
                      }
                      className="flex flex-col items-center justify-center gap-1 py-2 transition-colors"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>Messages</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTab('account')}
                      style={
                        activePreviewTab === 'account'
                          ? { color: resolvedLinkColor }
                          : undefined
                      }
                      className="flex flex-col items-center justify-center gap-1 py-2 transition-colors"
                    >
                      <User className="h-4 w-4" />
                      <span>Account</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Launcher Tooltip & Floating Chat Icon Preview */}
              <div
                className={`flex shrink-0 items-end gap-3 ${
                  iconPosition === 'LEFT' ? 'justify-start' : 'justify-end'
                }`}
              >
                {!hideTooltip && iconPosition === 'RIGHT' && (
                  <div className="max-w-[230px] truncate rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-800 shadow-sm">
                    {resolvedTooltip}
                  </div>
                )}

                <div
                  title={`Icon size: ${resolvedLauncherPx}x${resolvedLauncherPx}px (${iconShape.toLowerCase()})`}
                  style={{
                    width: `${previewIconPx}px`,
                    height: `${previewIconPx}px`,
                    backgroundColor: iconBackgroundTransparent
                      ? 'transparent'
                      : resolvedIconBgColor,
                  }}
                  className={`flex shrink-0 items-center justify-center transition-all ${
                    iconShape === 'CIRCLE' ? 'rounded-full' : 'rounded-2xl'
                  } ${iconBackgroundTransparent ? '' : 'shadow-lg'}`}
                >
                  <BrandMark className="h-6 w-6" />
                </div>

                {!hideTooltip && iconPosition === 'LEFT' && (
                  <div className="max-w-[230px] truncate rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-800 shadow-sm">
                    {resolvedTooltip}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </fieldset>

      {/* Video Tutorial Modal */}
      {tutorialOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-chatbot-tutorial-title"
          onClick={() => setTutorialOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="create-chatbot-tutorial-title"
                  className="text-lg font-semibold text-gray-900"
                >
                  How to create &amp; customize your chatbot
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Configure appearance, auto-open behavior, and launcher positioning before
                  embedding.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTutorialOpen(false)}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close tutorial"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <ol className="mt-5 space-y-3.5">
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 font-mono text-xs font-semibold text-blue-600">
                  1
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Set Content &amp; Greeting
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Name your chatbot, add a launcher tooltip, and customize the welcome
                    message and input placeholder.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 font-mono text-xs font-semibold text-blue-600">
                  2
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Style the Chat Interface
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Pick your brand colors, dark mode, sources visibility, and launcher
                    placement while testing live in the Demo Chatbot panel.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 font-mono text-xs font-semibold text-blue-600">
                  3
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Train &amp; Embed
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Click Create Chatbot to open your chatbot workspace, upload website or
                    file knowledge sources, and copy the embed snippet.
                  </p>
                </div>
              </li>
            </ol>

            <div className="mt-6 flex justify-end border-t border-gray-200 pt-4">
              <button
                type="button"
                onClick={() => setTutorialOpen(false)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
