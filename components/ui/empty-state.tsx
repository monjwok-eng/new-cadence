import React from 'react';

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[10px] border border-dashed border-[#e5e2dc] bg-[#faf8f5] px-6 py-14 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-[8px] border border-[#e8e5df] bg-white text-[#4a4540]">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 font-display text-[15px] font-semibold tracking-[-0.015em] text-[#14110f]">
        {title}
      </h3>
      <p className="mt-1.5 max-w-sm text-[13.5px] font-light leading-relaxed text-[#59544e]">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 inline-flex items-center justify-center rounded-[6px] bg-[#14110f] px-4 py-2 text-[13.5px] font-medium text-white transition-colors hover:bg-[#2d2622] whitespace-nowrap shrink-0"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
