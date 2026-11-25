'use client';

import React from 'react';
import { motion } from 'motion/react';

export function BrandMark({ className = 'h-7 w-8' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M5 12.5C5 6.5 11 3.5 19.5 3.5C24.5 3.5 27.5 6 27.5 9.2C27.5 12.1 24.2 13.8 19.5 13.8C14.2 13.8 10.2 12.2 6.2 14.2C5.4 14.6 5 13.8 5 12.5Z"
        fill="currentColor"
      />
      <path
        d="M27 15.5C27 21.5 21 24.5 12.5 24.5C7.5 24.5 4.5 22 4.5 18.8C4.5 15.9 7.8 14.2 12.5 14.2C17.8 14.2 21.8 15.8 25.8 13.8C26.6 13.4 27 14.2 27 15.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function BrandLoader({
  themeAware = false,
  sizeClassName = 'h-10 w-12',
}: {
  themeAware?: boolean;
  sizeClassName?: string;
}) {
  return (
    <div
      role="status"
      aria-label="Loading Cadence"
      className={`flex min-h-screen items-center justify-center ${
        themeAware
          ? 'bg-neutral-50 text-[#14110f] dark:bg-neutral-950 dark:text-white'
          : 'bg-white text-[#14110f]'
      }`}
    >
      <motion.div
        animate={{ opacity: [0.4, 1, 0.4], scale: [0.95, 1.04, 0.95] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        className="flex items-center justify-center"
      >
        <BrandMark className={sizeClassName} />
      </motion.div>
    </div>
  );
}
