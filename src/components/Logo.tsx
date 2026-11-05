import React, { useState } from 'react';

/**
 * SWAP LOGO ASSETS HERE IN ONE PLACE:
 * Both variants use the exact supplied logo images from /public/assets/aistudio/.
 * If the image ever fails to load, it falls back cleanly to the Bricolage Grotesque
 * ExtraBold wordmark with a solid vermilion block cursor after the final "e".
 */
export const FULL_LOGO_SRC = '/assets/aistudio/Screenshot_2026-11-05_212357_5f8c6a1e.png';
export const ICON_LOGO_SRC = '/assets/aistudio/Screenshot_2026-11-05_212537_f6c8df18.png';

export interface LogoProps {
  variant?: 'full' | 'icon';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ variant = 'full', className = '' }) => {
  const [imgFailed, setImgFailed] = useState(false);

  if (variant === 'icon') {
    if (!imgFailed) {
      return (
        <span className={`inline-flex items-center shrink-0 select-none ${className}`}>
          <img
            src={ICON_LOGO_SRC}
            alt="Backspace"
            onError={() => setImgFailed(true)}
            referrerPolicy="no-referrer"
            className="h-8 w-8 rounded-[6px] object-contain block"
          />
        </span>
      );
    }

    return (
      <span
        className={`inline-flex items-center justify-center h-8 w-8 rounded-[6px] bg-[#1B1A17] text-[#F2EDE4] font-display font-extrabold text-lg select-none shrink-0 ${className}`}
        aria-label="Backspace"
      >
        <span className="text-[#FF5B1F] mr-[-2px] text-xs">←</span>B
      </span>
    );
  }

  // variant === 'full'
  if (!imgFailed) {
    return (
      <span
        className={`inline-flex items-center overflow-hidden rounded-[4px] h-9 sm:h-10 w-[148px] sm:w-[168px] shrink-0 select-none ${className}`}
      >
        <img
          src={FULL_LOGO_SRC}
          alt="Backspace"
          onError={() => setImgFailed(true)}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover scale-[1.32] block"
        />
      </span>
    );
  }

  // Temporary / fallback text wordmark in Bricolage Grotesque ExtraBold with solid vermilion block cursor
  return (
    <span
      className={`inline-flex items-center font-display font-extrabold text-2xl tracking-[-0.03em] text-[var(--ink)] select-none whitespace-nowrap shrink-0 ${className}`}
    >
      <span className="text-[var(--accent)] mr-0.5 font-mono-code text-lg leading-none" aria-hidden="true">
        ←
      </span>
      Backspace
      <span
        className="inline-block w-[0.28em] h-[0.82em] bg-[var(--accent)] ml-0.5 rounded-[1px]"
        aria-hidden="true"
      />
    </span>
  );
};
