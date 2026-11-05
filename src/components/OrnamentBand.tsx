import React, { useId } from 'react';

/**
 * The ORNAMENT BAND:
 * An original, seamlessly repeating inline-SVG pattern about 12px tall in --gold:
 * two hairline rules with small lotus shapes alternating with pointed-arch (ogee)
 * shapes between them, in even 1px linework.
 * Used ONLY in the footer, as a divider between some landing sections,
 * on the share card, and on the Leaderboard page.
 */
export const OrnamentBand: React.FC<{ className?: string }> = ({ className = '' }) => {
  const patternId = useId();

  return (
    <div
      className={`w-full overflow-hidden select-none ${className}`}
      aria-hidden="true"
      role="presentation"
    >
      <svg
        width="100%"
        height="14"
        viewBox="0 0 1200 14"
        preserveAspectRatio="none"
        className="block w-full h-[14px] text-[var(--gold)]"
      >
        <defs>
          <pattern
            id={patternId}
            x="0"
            y="0"
            width="48"
            height="14"
            patternUnits="userSpaceOnUse"
          >
            {/* Top and bottom hairline rules */}
            <line
              x1="0"
              y1="1"
              x2="48"
              y2="1"
              stroke="currentColor"
              strokeWidth="1"
            />
            <line
              x1="0"
              y1="13"
              x2="48"
              y2="13"
              stroke="currentColor"
              strokeWidth="1"
            />
            {/* Lotus motif centered at x=12 */}
            <path
              d="M12 3 C10 5.5, 10 8.5, 12 11 C14 8.5, 14 5.5, 12 3 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />
            <path
              d="M12 11 C8.5 10, 7 7.5, 8.5 5 C10 6.5, 11 8.5, 12 11 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />
            <path
              d="M12 11 C15.5 10, 17 7.5, 15.5 5 C14 6.5, 13 8.5, 12 11 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />
            {/* Pointed-arch (ogee) motif centered at x=36 */}
            <path
              d="M28 11 C31 11, 33.5 5.5, 36 3 C38.5 5.5, 41 11, 44 11"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />
            <circle cx="36" cy="8.5" r="1.2" fill="currentColor" />
          </pattern>
        </defs>
        <rect x="0" y="0" width="100%" height="14" fill={`url(#${patternId})`} />
      </svg>
    </div>
  );
};

/**
 * Subtle lotus-fan corner ornament for hero and About cards (strictly never near typing arena).
 */
export const LotusCornerOrnament: React.FC<{
  position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
  className?: string;
}> = ({ position = 'top-right', className = '' }) => {
  const posClasses = {
    'top-right': 'top-2 right-2 rotate-0',
    'bottom-right': 'bottom-2 right-2 rotate-90',
    'bottom-left': 'bottom-2 left-2 rotate-180',
    'top-left': 'top-2 left-2 -rotate-90',
  }[position];

  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 26 26"
      fill="none"
      aria-hidden="true"
      className={`pointer-events-none absolute text-[var(--gold)] opacity-60 ${posClasses} ${className}`}
    >
      <path
        d="M25 1V11C25 5.5 20.5 1 15 1H25Z"
        stroke="currentColor"
        strokeWidth="1"
      />
      <path
        d="M25 1C19 3 15 7 13 13"
        stroke="currentColor"
        strokeWidth="1"
      />
      <path
        d="M25 1C21 6 19 10 19 15"
        stroke="currentColor"
        strokeWidth="1"
      />
      <path
        d="M25 1C20 1 16 3 11 7"
        stroke="currentColor"
        strokeWidth="1"
      />
    </svg>
  );
};
