import React, { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

export const NotFoundPage: React.FC = () => {
  useDocumentMeta('404 Not Found', 'The requested page could not be found.');

  const navigate = useNavigate();
  const location = useLocation();
  const targetCmd = `cd ${location.pathname || '/this-page'}`;
  const [typedLength, setTypedLength] = useState(targetCmd.length);

  const handleGoBack = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  }, [navigate]);

  // Self-typing terminal command on load
  useEffect(() => {
    const prefersReduced =
      document.documentElement.classList.contains('reduce-motion') ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      setTypedLength(targetCmd.length);
      return;
    }

    setTypedLength(0);
    const id = window.setInterval(() => {
      setTypedLength((c) => {
        if (c >= targetCmd.length) {
          window.clearInterval(id);
          return c;
        }
        return c + 1;
      });
    }, 45);

    return () => window.clearInterval(id);
  }, [targetCmd]);

  // On this page only, pressing the Backspace key also goes back
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Backspace' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        handleGoBack();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleGoBack]);

  const isDoneTyping = typedLength >= targetCmd.length;

  return (
    <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-20 text-center space-y-8">
      <h1 className="hero-display text-[var(--ink)]">404</h1>

      <div className="paper-card p-6 text-left font-mono-code text-sm sm:text-base space-y-2 max-w-lg mx-auto">
        <div>
          <span className="text-[var(--text-muted)] mr-2">$</span>
          <span className="text-[var(--ink)]">{targetCmd.slice(0, typedLength)}</span>
          {!isDoneTyping && <span className="block-cursor ml-0.5" />}
        </div>
        {isDoneTyping && (
          <div className="text-[var(--error)]">
            bash: cd: {location.pathname || '/this-page'}: No such file or directory
            <span className="block-cursor ml-1.5" />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <button
          type="button"
          onClick={handleGoBack}
          className="keycap-accent px-6 py-3 text-xs uppercase tracking-wider"
        >
          <span>← Hit Backspace</span>
        </button>
        <Link to="/practice" className="keycap px-5 py-3 text-xs font-medium">
          Go to Practice
        </Link>
      </div>

      <p className="text-xs font-mono-code text-[var(--text-muted)]">
        Tip: Press your physical <kbd className="keycap px-1.5 py-0.5 text-[11px]">Backspace</kbd> key on this page to go back.
      </p>
    </div>
  );
};
