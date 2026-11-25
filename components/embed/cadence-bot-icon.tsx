import React from 'react';

export function CadenceBotFaceIcon({
  className = 'h-7 w-7',
  eyeStroke = '#2563eb',
}: {
  className?: string;
  eyeStroke?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="13.5" cy="7.5" r="2.2" fill="currentColor" />
      <circle cx="22.5" cy="7.5" r="2.2" fill="currentColor" />
      <rect x="12.6" y="8.5" width="1.8" height="3.2" rx="0.9" fill="currentColor" />
      <rect x="21.6" y="8.5" width="1.8" height="3.2" rx="0.9" fill="currentColor" />
      <rect x="5" y="16" width="2.8" height="6.2" rx="1.4" fill="currentColor" />
      <rect x="28.2" y="16" width="2.8" height="6.2" rx="1.4" fill="currentColor" />
      <path
        d="M9 15C9 12.2386 11.2386 10 14 10H22C24.7614 10 27 12.2386 27 15V22C27 24.7614 24.7614 27 22 27H16L11.5 30.8C10.9 31.3 10 30.88 10 30.1V26.6C9.37 25.7 9 24.6 9 23.4V15Z"
        fill="currentColor"
      />
      <path
        d="M13 17.3C13.4 16.3 14.3 15.8 15.1 15.8C15.9 15.8 16.8 16.3 17.2 17.3"
        stroke={eyeStroke}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M18.8 17.3C19.2 16.3 20.1 15.8 20.9 15.8C21.7 15.8 22.6 16.3 23 17.3"
        stroke={eyeStroke}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M13.5 21.4C15.1 23 20.9 23 22.5 21.4"
        stroke={eyeStroke}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
