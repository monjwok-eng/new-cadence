'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  MessageSquare,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Send,
  UserPlus,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { BrandMark } from '@/components/ui/brand-loader';
import { CadenceVoiceOrb } from '@/components/embed/cadence-orb';
import { pickBrowserVoice } from '@/lib/voice-speech';
import { WidgetTheme } from '@/lib/types';

export interface WidgetPopupConfig {
  id: string;
  name: string;
  businessName: string;
  voiceId: string;
  voiceLabel: string;
  language: string;
  welcomeMessage: string;
  accentColor: string;
  widgetTheme: WidgetTheme;
  launcherLabel?: string;
  leadCaptureEnabled: boolean;
  status?: 'Active' | 'Draft' | 'Inactive';
}

interface ChatTurn {
  id: string;
  speaker: 'user' | 'agent';
  content: string;
  sources?: string[];
}

interface SpeechRecLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

export function VoiceWidgetPopup({
  widget,
  hostDomain = '',
  sourcePageUrl = '',
  onClose,
  fallbackInteractContext,
}: {
  widget: WidgetPopupConfig;
  hostDomain?: string;
  sourcePageUrl?: string;
  onClose?: () => void;
  fallbackInteractContext?: {
    agentConfig: {
      name: string;
      businessName: string;
      personality: string;
      customInstructions: string;
      language: string;
      websiteUrl?: string;
    };
    knowledgeItems: { sourceName: string; sourceType: string; content: string }[];
  };
}) {
  const voiceConsentKey = `cadence_voice_consent_${widget.id}`;
  const [hasAgreed, setHasAgreed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        return window.sessionStorage.getItem(voiceConsentKey) === 'true';
      } catch {
        return false;
      }
    }
    return false;
  });

  const [callActive, setCallActive] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [leadDrawerOpen, setLeadDrawerOpen] = useState(false);
  const [showAgreementModal, setShowAgreementModal] = useState(false);

  const [sessionId] = useState(
    () => `wsess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  );
  const [messages, setMessages] = useState<ChatTurn[]>(() => [
    {
      id: 'welcome',
      speaker: 'agent',
      content:
        widget.welcomeMessage?.trim() ||
        `Hi! Ask me anything about ${widget.businessName}.`,
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [voiceState, setVoiceState] = useState<'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking'>(
    'idle'
  );
  const [speakerMuted, setSpeakerMuted] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Lead capture form state
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadNotes, setLeadNotes] = useState('');
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<SpeechRecLike | null>(null);
  const speakerMutedRef = useRef(speakerMuted);
  const micMutedRef = useRef(micMuted);
  const turnCounterRef = useRef(0);

  useEffect(() => {
    speakerMutedRef.current = speakerMuted;
  }, [speakerMuted]);

  useEffect(() => {
    micMutedRef.current = micMuted;
  }, [micMuted]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, voiceState, showTranscript, leadDrawerOpen]);

  const handleCloseClick = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setCallActive(false);
    setVoiceState('idle');

    if (onClose) {
      onClose();
    } else if (typeof window !== 'undefined' && window.parent !== window) {
      window.parent.postMessage(
        { type: 'cadence-widget-close', agentId: widget.id },
        '*'
      );
    }
  };

  const handleOrbPress = () => {
    if (!hasAgreed) {
      setShowAgreementModal(true);
      return;
    }
    startCall();
  };

  const handleAgreeTerms = () => {
    setHasAgreed(true);
    setShowAgreementModal(false);
    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.setItem(voiceConsentKey, 'true');
      } catch {}
    }
    startCall();
  };

  const handleCancelTerms = () => {
    setShowAgreementModal(false);
  };

  const speakResponse = (text: string) => {
    if (
      speakerMutedRef.current ||
      typeof window === 'undefined' ||
      !('speechSynthesis' in window)
    ) {
      setVoiceState(callActive ? 'listening' : 'idle');
      return;
    }
    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const match = pickBrowserVoice(voices, widget.voiceId, widget.language);
      if (match.voice) utterance.voice = match.voice;
      utterance.lang = match.lang;
      utterance.pitch = match.pitch;
      utterance.rate = match.rate;
      utterance.onstart = () => setVoiceState('speaking');
      utterance.onend = () => {
        if (callActive && !micMutedRef.current) {
          startListening();
        } else {
          setVoiceState('idle');
        }
      };
      utterance.onerror = () => {
        if (callActive && !micMutedRef.current) {
          startListening();
        } else {
          setVoiceState('idle');
        }
      };
      window.speechSynthesis.speak(utterance);
    } catch {
      setVoiceState(callActive ? 'listening' : 'idle');
    }
  };

  const startListening = () => {
    if (typeof window === 'undefined') return;
    const win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecLike;
      webkitSpeechRecognition?: new () => SpeechRecLike;
    };
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRec) {
      setVoiceState('idle');
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }

      const recognition = new SpeechRec();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = widget.language?.toLowerCase().includes('spanish')
        ? 'es-ES'
        : widget.language?.toLowerCase().includes('uk')
          ? 'en-GB'
          : 'en-US';

      recognition.onresult = (event) => {
        const idx = event.results.length - 1;
        const spoken = event.results[idx]?.[0]?.transcript?.trim();
        if (spoken) {
          sendMessage(spoken);
        } else if (callActive) {
          setVoiceState('listening');
        } else {
          setVoiceState('idle');
        }
      };

      recognition.onerror = () => {
        if (callActive) {
          setVoiceState('listening');
        } else {
          setVoiceState('idle');
        }
      };

      recognition.onend = () => {
        if (callActive && voiceState === 'listening' && !micMutedRef.current) {
          try {
            recognition.start();
          } catch {}
        }
      };

      recognitionRef.current = recognition;
      setVoiceState('listening');
      recognition.start();
    } catch {
      setVoiceState('idle');
    }
  };

  const startCall = async () => {
    setCallActive(true);
    setVoiceState('connecting');
    setNotice(null);

    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
      }
    } catch {
      setNotice('Microphone access was denied. You can still message the assistant below.');
    }

    // Play welcome greeting speech
    const welcome =
      widget.welcomeMessage?.trim() ||
      `Hi! How can I help you with ${widget.businessName} today?`;
    
    setTimeout(() => {
      speakResponse(welcome);
    }, 700);
  };

  const endCall = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setCallActive(false);
    setVoiceState('idle');
  };

  const sendMessage = async (rawText: string) => {
    const cleanText = rawText.trim();
    if (!cleanText || voiceState === 'thinking') return;

    if (!hasAgreed) {
      setShowAgreementModal(true);
      return;
    }

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
    setVoiceState('thinking');

    try {
      const useFallbackDraftEndpoint =
        widget.status && widget.status !== 'Active' && Boolean(fallbackInteractContext);

      const res = useFallbackDraftEndpoint
        ? await fetch('/api/voice/interact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              agentId: widget.id,
              userMessage: cleanText,
              conversationHistory: nextHistory.map((m) => ({
                speaker: m.speaker,
                content: m.content,
              })),
              agentConfig: fallbackInteractContext?.agentConfig,
              knowledgeItems: fallbackInteractContext?.knowledgeItems,
            }),
          })
        : await fetch(`/api/widget/${encodeURIComponent(widget.id)}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId,
              host:
                hostDomain ||
                (typeof window !== 'undefined' ? window.location.hostname : ''),
              userMessage: cleanText,
              conversationHistory: nextHistory.map((m) => ({
                speaker: m.speaker,
                content: m.content,
              })),
            }),
          });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Unable to reach conversational agent.');
      }

      const replyText =
        data.responseText ||
        `Thanks for contacting ${widget.businessName}. How can I assist you further?`;

      turnCounterRef.current += 1;
      const agentTurnId = `a_${turnCounterRef.current}`;
      setMessages((prev) => [
        ...prev,
        {
          id: agentTurnId,
          speaker: 'agent',
          content: replyText,
          sources: Array.isArray(data.sourcesUsed) ? data.sourcesUsed : undefined,
        },
      ]);

      speakResponse(replyText);
    } catch (err) {
      setVoiceState(callActive ? 'listening' : 'idle');
      setNotice(err instanceof Error ? err.message : 'Unable to send message.');
    }
  };

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName.trim() || !leadEmail.trim() || leadSubmitting) return;
    setLeadSubmitting(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/widget/${encodeURIComponent(widget.id)}/lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorName: leadName.trim(),
          visitorEmail: leadEmail.trim(),
          visitorPhone: leadPhone.trim(),
          inquirySummary:
            leadNotes.trim() ||
            messages
              .filter((m) => m.speaker === 'user')
              .map((m) => m.content)
              .slice(-2)
              .join(' | ') ||
            'Requested follow-up from website voice widget',
          sourcePageUrl:
            sourcePageUrl ||
            (typeof window !== 'undefined' ? window.location.href : ''),
          host:
            hostDomain ||
            (typeof window !== 'undefined' ? window.location.hostname : ''),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not submit details.');
      setLeadSubmitted(true);
      setLeadDrawerOpen(false);
      turnCounterRef.current += 1;
      const leadMsgId = `lead_ok_${turnCounterRef.current}`;
      setMessages((prev) => [
        ...prev,
        {
          id: leadMsgId,
          speaker: 'agent',
          content: `Thank you, ${leadName.trim()}! Our team at ${widget.businessName} has received your details and will follow up shortly.`,
        },
      ]);
      speakResponse(`Thank you, ${leadName.trim()}! Our team will follow up with you shortly.`);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Unable to send contact details.');
    } finally {
      setLeadSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // MAIN WIDGET VIEW
  // -------------------------------------------------------------
  return (
    <div className="relative flex h-full w-full flex-col justify-between overflow-hidden bg-white text-neutral-900">
      {/* Top Header Bar */}
      <div className="relative flex shrink-0 items-center justify-between px-5 pt-4 pb-1">
        {callActive || showTranscript ? (
          <button
            type="button"
            onClick={() => setShowTranscript((prev) => !prev)}
            aria-label="Toggle transcript"
            className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
              showTranscript
                ? 'bg-neutral-900 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
          </button>
        ) : (
          <div className="w-9" />
        )}

        {/* Centered Chatbot Title / Language */}
        <div className="inline-flex max-w-[190px] items-center gap-1.5 rounded-full border border-neutral-200/90 bg-white px-3.5 py-1.5 text-xs font-medium text-neutral-800 shadow-xs">
          <span className="truncate font-display font-semibold text-neutral-900">
            {widget.name}
          </span>
          <span className="text-neutral-300" aria-hidden="true">
            ·
          </span>
          <span className="shrink-0 text-neutral-500">
            {widget.language || 'English'}
          </span>
          <ChevronDown className="h-3 w-3 shrink-0 text-neutral-400" />
        </div>

        {/* Right Action: Minimize / Close button */}
        <div className="flex items-center gap-2">
          {widget.leadCaptureEnabled && !leadSubmitted && callActive && (
            <button
              type="button"
              onClick={() => {
                setLeadDrawerOpen((o) => !o);
                setShowTranscript(true);
              }}
              className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-200"
            >
              <UserPlus className="mr-1 inline h-3 w-3" />
              Contact
            </button>
          )}

          <button
            type="button"
            onClick={handleCloseClick}
            aria-label="Close chatbot"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 transition-colors hover:bg-neutral-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Center Area: Animated Orb or Transcript Drawer */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-4">
        {showTranscript ? (
          /* Transcript / Chat turns view */
          <div
            ref={scrollRef}
            className="h-full w-full space-y-3 overflow-y-auto px-1 py-2 text-xs"
          >
            {leadDrawerOpen ? (
              <form
                onSubmit={handleSubmitLead}
                className="space-y-3 rounded-2xl border border-neutral-200 bg-neutral-50/70 p-4"
              >
                <div>
                  <p className="text-xs font-semibold text-neutral-900">Request follow-up</p>
                  <p className="mt-0.5 text-[11px] text-neutral-500">
                    Leave your contact details for {widget.businessName}.
                  </p>
                </div>
                <input
                  type="text"
                  required
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  placeholder="Your name *"
                  className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs focus:outline-none"
                />
                <input
                  type="email"
                  required
                  value={leadEmail}
                  onChange={(e) => setLeadEmail(e.target.value)}
                  placeholder="Email address *"
                  className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs focus:outline-none"
                />
                <input
                  type="tel"
                  value={leadPhone}
                  onChange={(e) => setLeadPhone(e.target.value)}
                  placeholder="Phone number (optional)"
                  className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs focus:outline-none"
                />
                <textarea
                  rows={2}
                  value={leadNotes}
                  onChange={(e) => setLeadNotes(e.target.value)}
                  placeholder="How can we help?"
                  className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setLeadDrawerOpen(false)}
                    className="flex-1 rounded-lg border border-neutral-200 bg-white py-2 text-xs font-medium text-neutral-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={leadSubmitting}
                    className="flex-1 rounded-lg bg-black py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {leadSubmitting ? 'Sending...' : 'Submit'}
                  </button>
                </div>
              </form>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${
                    m.speaker === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 leading-relaxed ${
                      m.speaker === 'user'
                        ? 'bg-neutral-900 text-white rounded-tr-xs'
                        : 'bg-neutral-100 text-neutral-800 rounded-tl-xs'
                    }`}
                  >
                    {m.content}
                  </div>
                  {m.sources && m.sources.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {m.sources.map((s) => (
                        <span
                          key={s}
                          className="inline-flex items-center gap-1 rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-500"
                        >
                          <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}

            {voiceState === 'thinking' && (
              <div className="flex items-start">
                <div className="rounded-2xl rounded-tl-xs bg-neutral-100 px-4 py-2 text-xs text-neutral-500 animate-pulse">
                  Thinking...
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Orb Center View */
          <div className="flex flex-col items-center justify-center text-center">
            <CadenceVoiceOrb
              state={voiceState}
              onStartCall={handleOrbPress}
              size={184}
            />

            {/* Subtitle / Status Text */}
            <div className="mt-6 min-h-[44px]">
              {voiceState === 'connecting' ? (
                <p className="text-sm font-medium text-neutral-500 animate-pulse">
                  Connecting...
                </p>
              ) : voiceState === 'speaking' ? (
                <p className="text-sm font-medium text-sky-600">
                  Speaking...
                </p>
              ) : voiceState === 'listening' ? (
                <p className="text-sm font-medium text-sky-600 animate-pulse">
                  Listening to you...
                </p>
              ) : voiceState === 'thinking' ? (
                <p className="text-sm font-medium text-neutral-500 animate-pulse">
                  Thinking...
                </p>
              ) : (
                <p className="max-w-[270px] text-[13.5px] leading-relaxed text-neutral-500 font-normal">
                  Discover the capabilities of Conversational Agents powered by Cadence
                </p>
              )}
            </div>
          </div>
        )}

        {notice && (
          <div className="absolute bottom-1 inset-x-6 rounded-lg bg-rose-50 px-3 py-2 text-center text-xs text-rose-600">
            {notice}
          </div>
        )}
      </div>

      {/* Bottom Controls Bar */}
      <div className="shrink-0 p-4 pt-1">
        <div className="flex items-center gap-2.5">
          {/* Rounded Pill Text Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!hasAgreed) {
                setShowAgreementModal(true);
                return;
              }
              sendMessage(inputValue);
            }}
            className="flex flex-1 items-center rounded-full border border-neutral-200/90 bg-white px-4 py-3 shadow-xs transition-colors focus-within:border-neutral-400"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Or send a message..."
              className="w-full bg-transparent text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || voiceState === 'thinking'}
              aria-label="Send message"
              className="ml-2 text-neutral-400 transition-colors hover:text-neutral-800 disabled:opacity-30"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

          {/* Call Control Button - ONLY shown when call is active/connecting */}
          {callActive && (
            <button
              type="button"
              onClick={endCall}
              aria-label="End voice call"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black text-white shadow-md transition-transform hover:scale-105 active:scale-95"
            >
              <PhoneOff className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Powered by Cadence footer */}
        <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[11px] text-neutral-400">
          <span>Powered by</span>
          <BrandMark className="h-3.5 w-4 text-neutral-700" />
          <span className="font-display font-semibold tracking-tight text-neutral-800">
            Cadence
          </span>
        </div>
      </div>

      {/* AGREEMENT MODAL OVERLAY (Triggered when user presses the orb or attempts interaction before agreeing) */}
      {showAgreementModal && (
        <div className="absolute inset-0 z-50 flex flex-col justify-between bg-white p-7 text-neutral-900 select-none animate-in fade-in duration-200">
          <div>
            <h2 className="text-[17px] font-semibold leading-snug text-neutral-900">
              By clicking &apos;I agree&apos; and using this service, you are confirming:
            </h2>

            <ul className="mt-6 space-y-4 text-[13.5px] leading-relaxed text-neutral-600">
              <li className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-400" />
                <span>You are over the age of 18</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-400" />
                <span>You acknowledge you are engaging with an AI service</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-400" />
                <span>You consent to being recorded to provide the conversational service</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-400" />
                <span>
                  You acknowledge our Privacy Policy, available at{' '}
                  <a
                    href="/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline cursor-pointer font-medium text-neutral-900"
                  >
                    cadence.ai/privacy-policy
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-400" />
                <span>
                  You consent to the sharing of your data with third-parties as may be necessary to provide this service to you
                </span>
              </li>
            </ul>
          </div>

          <div className="mt-8 flex items-center gap-3">
            <button
              type="button"
              onClick={handleCancelTerms}
              className="flex-1 rounded-full border border-neutral-300 bg-white py-3 text-sm font-semibold text-neutral-900 transition-colors hover:bg-neutral-50 active:scale-[0.98]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAgreeTerms}
              className="flex-1 rounded-full bg-black py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
            >
              I agree
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
