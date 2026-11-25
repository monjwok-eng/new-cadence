'use client';

import React from 'react';
import { Phone } from 'lucide-react';

export function CadenceVoiceOrb({
  state = 'idle',
  onStartCall,
  size = 200,
}: {
  state?: 'idle' | 'connecting' | 'listening' | 'speaking' | 'thinking';
  onStartCall?: () => void;
  size?: number;
}) {
  const isIdle = state === 'idle';
  const isSpeaking = state === 'speaking';
  const isListening = state === 'listening';
  const isConnecting = state === 'connecting';

  return (
    <div
      style={{ width: `${size}px`, height: `${size}px` }}
      className="relative flex items-center justify-center select-none"
    >
      {/* Outer ambient glow */}
      <div
        className={`absolute inset-0 rounded-full blur-xl transition-all duration-700 ${
          isSpeaking
            ? 'scale-110 opacity-70 bg-gradient-to-tr from-sky-400 via-emerald-300 to-blue-500 animate-pulse'
            : isListening
              ? 'scale-105 opacity-60 bg-gradient-to-br from-emerald-300 via-sky-400 to-indigo-500 animate-pulse'
              : isConnecting
                ? 'scale-100 opacity-50 bg-sky-400 animate-ping'
                : 'scale-95 opacity-30 bg-sky-300'
        }`}
      />

      {/* Main Gradient Sphere with realistic lighting */}
      <div
        onClick={isIdle ? onStartCall : undefined}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          background:
            'radial-gradient(circle at 35% 25%, #d9f99d 0%, #a7f3d0 18%, #38bdf8 45%, #0284c7 75%, #0369a1 100%)',
          boxShadow:
            'inset -10px -12px 28px rgba(2, 44, 95, 0.45), inset 8px 8px 16px rgba(255, 255, 255, 0.5), 0 16px 36px rgba(14, 165, 233, 0.28)',
        }}
        className={`relative flex items-center justify-center rounded-full overflow-hidden transition-transform duration-500 ${
          isIdle
            ? 'cursor-pointer hover:scale-105 active:scale-95'
            : isSpeaking
              ? 'animate-[cadence-orb-breathe_2.2s_ease-in-out_infinite]'
              : isListening
                ? 'animate-[cadence-orb-listening_1.8s_ease-in-out_infinite]'
                : isConnecting
                  ? 'animate-[pulse_1.5s_ease-in-out_infinite]'
                  : ''
        }`}
      >
        {/* Soft textured noise & light reflection sheen */}
        <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_28%_22%,rgba(255,255,255,0.7)_0%,rgba(255,255,255,0)_50%)]" />
        <div className="pointer-events-none absolute bottom-0 inset-x-0 h-1/2 bg-[radial-gradient(ellipse_at_bottom,rgba(3,105,161,0.35)_0%,transparent_70%)]" />

        {/* Center White Call Button in Idle state */}
        {isIdle && (
          <button
            type="button"
            onClick={onStartCall}
            aria-label="Start voice call"
            className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-[0_8px_20px_rgba(0,0,0,0.18)] transition-transform duration-200 group-hover:scale-110 active:scale-95"
          >
            <Phone className="h-6 w-6 text-neutral-900 fill-neutral-900 transition-transform duration-200 group-hover:rotate-12" />
          </button>
        )}
      </div>
    </div>
  );
}

export function CadenceOrbLauncherIcon({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <div
      style={{
        background:
          'radial-gradient(circle at 35% 25%, #d9f99d 0%, #a7f3d0 20%, #38bdf8 45%, #0284c7 78%, #0369a1 100%)',
        boxShadow:
          'inset -2px -3px 6px rgba(2, 44, 95, 0.45), inset 2px 2px 4px rgba(255, 255, 255, 0.6), 0 4px 12px rgba(14, 165, 233, 0.35)',
      }}
      className={`rounded-full relative flex items-center justify-center ${className}`}
    >
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_28%_22%,rgba(255,255,255,0.7)_0%,transparent_50%)]" />
    </div>
  );
}
