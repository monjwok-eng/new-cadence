'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Square,
  Volume2,
  VolumeX,
  Bot,
  AlertCircle,
  Radio,
  Send,
  Volume,
} from 'lucide-react';
import { useApp } from '@/components/providers/app-provider';
import { pickBrowserVoice } from '@/lib/voice-speech';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type SessionState = 'Idle' | 'Connecting' | 'Listening' | 'Thinking' | 'Speaking' | 'Ended' | 'Failed';

interface MessageItem {
  id: string;
  speaker: 'user' | 'agent';
  content: string;
  timestamp: string;
}

export function VoicePlayground({
  scopedAgentId,
  embedded = false,
}: {
  scopedAgentId?: string;
  embedded?: boolean;
} = {}) {
  const { activeWorkspace, agents, knowledgeSources, pushToast } = useApp();
  const [selectedAgentId, setSelectedAgentId] = useState<string>(scopedAgentId || '');
  const [sessionState, setSessionState] = useState<SessionState>('Idle');
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessionTimer, setSessionTimer] = useState<number>(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const isSpeakingRef = useRef<boolean>(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const activeAgentId = scopedAgentId || selectedAgentId || agents[0]?.id || '';
  const selectedAgent = agents.find((a) => a.id === activeAgentId) || agents[0];

  // Preload voices
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.getVoices();
        };
      }
    }
  }, []);

  // Session timer
  useEffect(() => {
    if (sessionState === 'Listening' || sessionState === 'Thinking' || sessionState === 'Speaking') {
      timerRef.current = setInterval(() => {
        setSessionTimer((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionState]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const speakText = (text: string, onComplete?: () => void) => {
    if (isVoiceMuted || !('speechSynthesis' in window)) {
      if (onComplete) onComplete();
      return;
    }
    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const match = pickBrowserVoice(voices, selectedAgent?.voiceId, selectedAgent?.language);
    if (match.voice) utterance.voice = match.voice;
    utterance.lang = match.lang;
    utterance.rate = match.rate;
    utterance.pitch = match.pitch;
    utterance.volume = 1.0;

    utterance.onstart = () => {
      setSessionState('Speaking');
      isSpeakingRef.current = true;
    };
    utterance.onend = () => {
      isSpeakingRef.current = false;
      setSessionState('Listening');
      if (onComplete) onComplete();
    };
    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      isSpeakingRef.current = false;
      setSessionState('Listening');
      if (onComplete) onComplete();
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (userText: string) => {
    if (!userText.trim() || !activeWorkspace || !selectedAgent) return;

    const userMsg: MessageItem = {
      id: `msg_${Date.now()}_u`,
      speaker: 'user',
      content: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setSessionState('Thinking');

    if (activeSessionId) {
      try {
        await setDoc(doc(db, `workspaces/${activeWorkspace.id}/conversation_messages`, userMsg.id), {
          id: userMsg.id,
          workspaceId: activeWorkspace.id,
          workspaceOwnerId: activeWorkspace.ownerId,
          memberUids: activeWorkspace.memberUids || [],
          sessionId: activeSessionId,
          agentId: selectedAgent.id,
          speaker: 'user',
          content: userText,
          timestamp: userMsg.timestamp,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        console.error('Failed to save user message:', err);
      }
    }

    try {
      const relevantKnowledge = knowledgeSources
        .filter(
          (s) =>
            (s.agentId === selectedAgent.id || s.agentId === 'all' || !s.agentId) &&
            typeof s.content === 'string' &&
            s.content.trim().length > 0
        )
        .map((s) => ({
          sourceName: s.sourceName,
          sourceType: s.sourceType,
          content: s.content || '',
        }));

      const res = await fetch('/api/voice/interact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: activeWorkspace.id,
          agentId: selectedAgent.id,
          sessionId: activeSessionId,
          userMessage: userText,
          conversationHistory: messages,
          agentConfig: {
            name: selectedAgent.name,
            businessName: selectedAgent.businessName,
            personality: selectedAgent.personality,
            customInstructions: selectedAgent.customInstructions,
            language: selectedAgent.language,
            websiteUrl: selectedAgent.websiteUrl,
          },
          knowledgeItems: relevantKnowledge,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to get agent response');

      const agentResponseText = data.responseText;

      const agentMsg: MessageItem = {
        id: `msg_${Date.now()}_a`,
        speaker: 'agent',
        content: agentResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };

      setMessages((prev) => [...prev, agentMsg]);

      if (activeSessionId) {
        try {
          await setDoc(doc(db, `workspaces/${activeWorkspace.id}/conversation_messages`, agentMsg.id), {
            id: agentMsg.id,
            workspaceId: activeWorkspace.id,
            workspaceOwnerId: activeWorkspace.ownerId,
            memberUids: activeWorkspace.memberUids || [],
            sessionId: activeSessionId,
            agentId: selectedAgent.id,
            speaker: 'agent',
            content: agentResponseText,
            timestamp: agentMsg.timestamp,
            createdAt: serverTimestamp(),
          });
        } catch (err) {
          console.error('Failed to save agent message:', err);
        }
      }

      speakText(agentResponseText);
    } catch (err) {
      console.error('Interact error:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Error communicating with agent.');
      setSessionState('Listening');
    }
  };

  const startSession = async () => {
    if (!activeWorkspace || !selectedAgent) return;
    setSessionState('Connecting');
    setErrorMessage(null);
    setSessionTimer(0);
    setMessages([]);

    const sessionId = `session_${Date.now()}`;
    setActiveSessionId(sessionId);

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      await setDoc(doc(db, `workspaces/${activeWorkspace.id}/voice_sessions`, sessionId), {
        id: sessionId,
        workspaceId: activeWorkspace.id,
        workspaceOwnerId: activeWorkspace.ownerId,
        memberUids: activeWorkspace.memberUids || [],
        agentId: selectedAgent.id,
        userId: 'current_user',
        provider: 'OpenAI Realtime / Gemini RAG',
        sessionStatus: 'active',
        startedAt: new Date().toISOString(),
        durationSeconds: 0,
        createdAt: serverTimestamp(),
      });

      setSessionState('Listening');

      const greeting = selectedAgent.welcomeMessage?.trim()
        ? selectedAgent.welcomeMessage.trim()
        : selectedAgent.customInstructions
          ? `Hello! I'm ${selectedAgent.name} from ${selectedAgent.businessName}. How can I help you today?`
          : `Hi there, welcome to ${selectedAgent.businessName}. How can I assist you today?`;

      const greetingMsg: MessageItem = {
        id: `msg_${Date.now()}_greeting`,
        speaker: 'agent',
        content: greeting,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };

      setMessages([greetingMsg]);
      speakText(greeting);

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition && !isMuted) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = selectedAgent.language || 'en-US';

        recognition.onresult = (event: any) => {
          if (isMuted || isSpeakingRef.current) return;
          const transcript = event.results[event.results.length - 1][0].transcript;
          if (transcript.trim()) {
            handleSendMessage(transcript.trim());
          }
        };

        recognition.onerror = (e: any) => {
          console.warn('Speech recognition notice:', e.error);
        };

        recognition.onend = () => {
          if (sessionState === 'Listening' && !isMuted) {
            try {
              recognition.start();
            } catch (err) {}
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      }

      pushToast({
        title: 'Voice Session Active',
        description: `Connected to ${selectedAgent.name} grounded in your website & document knowledge base.`,
      });
    } catch (err) {
      console.error('Failed to start voice session:', err);
      setSessionState('Failed');
      setErrorMessage(err instanceof Error ? err.message : 'Microphone access denied or connection failed.');
      pushToast({
        title: 'Session Failed',
        description: 'Unable to access microphone or start voice session.',
        variant: 'error',
      });
    }
  };

  const endSession = async () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSessionState('Ended');
    if (activeSessionId && activeWorkspace) {
      try {
        await setDoc(
          doc(db, `workspaces/${activeWorkspace.id}/voice_sessions`, activeSessionId),
          { sessionStatus: 'ended', endedAt: new Date().toISOString(), durationSeconds: sessionTimer },
          { merge: true }
        );
      } catch (err) {
        console.error('Failed to update session end:', err);
      }
    }
    setActiveSessionId(null);
    pushToast({
      title: 'Voice Session Ended',
      description: `Session duration: ${formatTimer(sessionTimer)}`,
    });
  };

  return (
    <div className="space-y-6">
      {!embedded && (
        <div className="border-b border-neutral-200 pb-6 dark:border-neutral-800">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            Voice Chat Test
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Speak directly with your website voice chatbot grounded in your crawled site pages and uploaded documents.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Chatbot & Controls */}
        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
            {scopedAgentId && selectedAgent ? (
              <div>
                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                  Active Voice Chatbot
                </p>
                <p className="mt-1 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {selectedAgent.name}
                </p>
                <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                  {selectedAgent.businessName} · {selectedAgent.voiceLabel}
                </p>
              </div>
            ) : (
              <>
                <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  Select Voice Chatbot
                </h2>
                <div className="mt-3 space-y-2">
                  {agents.map((agent) => (
                    <button
                      key={agent.id}
                      type="button"
                      disabled={sessionState !== 'Idle' && sessionState !== 'Ended' && sessionState !== 'Failed'}
                      onClick={() => setSelectedAgentId(agent.id)}
                      className={`flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition-all ${
                        activeAgentId === agent.id
                          ? 'border-indigo-600 bg-indigo-50/50 dark:border-indigo-500 dark:bg-indigo-950/30'
                          : 'border-neutral-200 hover:border-neutral-300 dark:border-neutral-800 dark:hover:border-neutral-700'
                      }`}
                    >
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-neutral-100">{agent.name}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {agent.websiteUrl || agent.businessName} · {agent.voiceLabel}
                        </p>
                      </div>
                      <Bot className={`h-5 w-5 ${activeAgentId === agent.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-neutral-400'}`} />
                    </button>
                  ))}
                </div>
              </>
            )}

            <div className={`${scopedAgentId ? 'mt-4 border-t border-neutral-200 pt-4 dark:border-neutral-800' : 'mt-6 border-t border-neutral-200 pt-5 dark:border-neutral-800'}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Status</span>
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                    sessionState === 'Listening'
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : sessionState === 'Speaking'
                        ? 'text-indigo-700 dark:text-indigo-400'
                        : sessionState === 'Thinking'
                          ? 'text-amber-700 dark:text-amber-400'
                          : sessionState === 'Connecting'
                            ? 'text-sky-700 dark:text-sky-400'
                            : 'text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  <Radio className="h-3.5 w-3.5" />
                  {sessionState}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                <span>Duration</span>
                <span className="font-mono font-medium text-neutral-900 tabular-nums dark:text-neutral-100">{formatTimer(sessionTimer)}</span>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                {sessionState === 'Idle' || sessionState === 'Ended' || sessionState === 'Failed' ? (
                  <button
                    type="button"
                    onClick={startSession}
                    disabled={!selectedAgent}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-50"
                  >
                    <Mic className="h-4 w-4" />
                    Start Voice Test
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={endSession}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-rose-700"
                  >
                    <Square className="h-4 w-4" />
                    End Session
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => speakText(`Hello! I am ${selectedAgent?.name || 'your AI voice chatbot'} from ${selectedAgent?.businessName || 'your business'}. Voice audio output is ready.`)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-400 dark:hover:bg-indigo-900/60"
                >
                  <Volume className="h-4 w-4" />
                  Test Chatbot Voice
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsMuted(!isMuted)}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
                      isMuted
                        ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-400'
                        : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800'
                    }`}
                  >
                    {isMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                    {isMuted ? 'Muted' : 'Mic On'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsVoiceMuted(!isVoiceMuted)}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
                      isVoiceMuted
                        ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-400'
                        : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800'
                    }`}
                  >
                    {isVoiceMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                    {isVoiceMuted ? 'Speaker Muted' : 'Speaker On'}
                  </button>
                </div>
              </div>

              {errorMessage && (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Waveform & Live Transcript */}
        <div className="flex flex-col rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900 lg:col-span-2">
          {/* Audio Visualizer Header */}
          <div className="flex flex-col items-center justify-center border-b border-neutral-200 bg-neutral-50/50 p-8 dark:border-neutral-800 dark:bg-neutral-950/30">
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-indigo-600/10 dark:bg-indigo-500/10">
              <div className={`absolute inset-0 rounded-full bg-indigo-500/20 animate-ping ${sessionState === 'Listening' || sessionState === 'Speaking' ? 'opacity-75' : 'opacity-0'}`} />
              <Bot className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
            </div>

            <div className="mt-4 flex items-center gap-1.5">
              {[40, 70, 30, 85, 60, 95, 45, 75, 20, 65].map((h, i) => (
                <span
                  key={i}
                  className={`w-1 rounded-full bg-indigo-600 dark:bg-indigo-400 transition-all duration-300 ${
                    sessionState === 'Listening' || sessionState === 'Speaking'
                      ? 'animate-pulse'
                      : 'opacity-30'
                  }`}
                  style={{
                    height: sessionState === 'Listening' || sessionState === 'Speaking' ? `${Math.max(12, h)}px` : '12px',
                  }}
                />
              ))}
            </div>

            <p className="mt-3 text-xs font-medium text-neutral-500 dark:text-neutral-400">
              {sessionState === 'Idle' && 'Click Start Voice Test to speak with your chatbot'}
              {sessionState === 'Connecting' && 'Requesting microphone and initializing voice chatbot...'}
              {sessionState === 'Listening' && 'Listening to your voice... Speak naturally.'}
              {sessionState === 'Thinking' && 'Retrieving website & document knowledge and generating response...'}
              {sessionState === 'Speaking' && 'Chatbot speaking response aloud...'}
              {sessionState === 'Ended' && 'Session ended. Review transcript below.'}
            </p>
          </div>

          {/* Transcript Feed */}
          <div className="flex-1 space-y-4 p-5 overflow-y-auto max-h-[400px]">
            {messages.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center text-center">
                <Radio className="h-8 w-8 text-neutral-300 dark:text-neutral-700" />
                <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                  Live conversation transcript will appear here.
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.speaker === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">
                      {msg.speaker === 'user' ? 'You' : selectedAgent?.name || 'Agent'}
                    </span>
                    <span>{msg.timestamp}</span>
                  </div>
                  <div
                    className={`mt-1 max-w-md rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.speaker === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-xs'
                        : 'bg-neutral-100 text-neutral-900 rounded-tl-xs dark:bg-neutral-800 dark:text-neutral-100'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Text Input Fallback Bar */}
          <div className="border-t border-neutral-200 p-4 dark:border-neutral-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (textInput.trim()) {
                  handleSendMessage(textInput.trim());
                  setTextInput('');
                }
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                disabled={sessionState === 'Idle' || sessionState === 'Ended'}
                placeholder={sessionState === 'Idle' ? 'Start a voice session to chat...' : 'Type a message or speak into your mic...'}
                className="flex-1 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={sessionState === 'Idle' || sessionState === 'Ended' || !textInput.trim()}
                aria-label="Send message"
                className="inline-flex items-center justify-center rounded-xl bg-indigo-600 p-2.5 text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
