import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, ExternalLink } from 'lucide-react';
import { GITHUB_URL } from '../hooks/useDocumentMeta';
import { useOnlineStatus } from '../hooks/usePWAInstall';
import { Logo } from './Logo';
import { OrnamentBand } from './OrnamentBand';

export const Footer: React.FC = () => {
  const isOnline = useOnlineStatus();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="mt-24 bg-[var(--paper)] border-t border-[var(--line)]">
      {/* Starts with the gold ornament band */}
      <OrnamentBand />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10">
          {/* Column 1: Logo + Devanagari line + Tagline + Made in India line */}
          <div className="lg:col-span-5 space-y-3">
            <Link to="/" className="inline-block" aria-label="Backspace Home">
              <Logo variant="full" />
            </Link>
            <div
              className="font-devanagari text-sm text-[var(--text-muted)] tracking-wide"
              lang="hi"
            >
              बैकस्पेस
            </div>
            <p className="font-display font-extrabold text-xl tracking-tight text-[var(--ink)] flex items-center gap-1.5">
              <span>Hit Backspace Less.</span>
              <span className="block-cursor" aria-hidden="true" />
            </p>
            <p className="text-sm text-[var(--text-muted)] max-w-sm">
              Designed and built in India for developers everywhere.
            </p>
          </div>

          {/* Column 2: Product */}
          <div className="lg:col-span-2 space-y-3">
            <h2 className="mono-label text-[var(--text-muted)]">Product</h2>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/practice" className="text-[var(--ink)] hover:underline">
                  Practice
                </Link>
              </li>
              <li>
                <Link to="/progress" className="text-[var(--ink)] hover:underline">
                  Progress
                </Link>
              </li>
              <li>
                <Link to="/leaderboard" className="text-[var(--ink)] hover:underline">
                  Leaderboard
                </Link>
              </li>
              <li>
                <Link to="/changelog" className="text-[var(--ink)] hover:underline">
                  Changelog
                </Link>
              </li>
              <li>
                <Link to="/settings" className="text-[var(--ink)] hover:underline">
                  Settings
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Company */}
          <div className="lg:col-span-3 space-y-3">
            <h2 className="mono-label text-[var(--text-muted)]">Company</h2>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about" className="text-[var(--ink)] hover:underline">
                  About
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-[var(--ink)] hover:underline">
                  Contact
                </Link>
              </li>
              <li>
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[var(--ink)] hover:underline"
                >
                  <span>GitHub</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal */}
          <div className="lg:col-span-2 space-y-3">
            <h2 className="mono-label text-[var(--text-muted)]">Legal</h2>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/privacy" className="text-[var(--ink)] hover:underline">
                  Privacy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-[var(--ink)] hover:underline">
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom row */}
        <div className="mt-12 pt-6 border-t border-[var(--line)] flex flex-wrap items-center justify-between gap-4 text-xs font-mono-code text-[var(--text-muted)]">
          <div className="flex flex-wrap items-center gap-4">
            <span>© 2026 Backspace</span>
            <span
              className="keycap px-2.5 py-1 text-xs font-mono-code"
              role="status"
              aria-live="polite"
            >
              <span
                className={`inline-block w-2 h-2 rounded-full ${
                  isOnline ? 'bg-[var(--success)]' : 'bg-[var(--text-muted)]'
                }`}
                aria-hidden="true"
              />
              <span>{isOnline ? 'Online' : 'Offline, still works'}</span>
            </span>
          </div>

          <button
            type="button"
            onClick={scrollToTop}
            className="keycap px-3 py-1.5 text-xs font-medium text-[var(--ink)]"
          >
            <ArrowUp className="w-3.5 h-3.5" />
            <span>Back to top</span>
          </button>
        </div>
      </div>
    </footer>
  );
};
