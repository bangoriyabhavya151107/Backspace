import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Flame, Laptop, Menu, Moon, Sun, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Logo } from './Logo';

export const Header: React.FC = () => {
  const {
    settings,
    cycleTheme,
    results,
    currentStreak,
    isFocusMode,
    setIsShortcutsOpen,
  } = useApp();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const themeLabel =
    settings.theme === 'light'
      ? 'Light theme (click for Dark)'
      : settings.theme === 'dark'
      ? 'Dark theme (click for System)'
      : 'System theme (click for Light)';

  const ThemeIcon =
    settings.theme === 'light' ? Sun : settings.theme === 'dark' ? Moon : Laptop;

  const hasCompletedAnyTest = results.length > 0;

  return (
    <>
      <header
        className={`sticky top-0 z-40 h-16 bg-[var(--paper)] transition-colors duration-150 ${
          scrolled ? 'border-b border-[var(--line)]' : 'border-b border-transparent'
        }`}
      >
        <div className="max-w-[1200px] mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-6">
          {/* Left: Logo */}
          <Link
            to="/"
            className="inline-flex items-center shrink-0 rounded-[3px]"
            aria-label="Backspace Home"
          >
            <Logo variant="full" />
          </Link>

          {/* Center: Desktop Nav (fades to 25% opacity during active typing test) */}
          <nav
            aria-label="Primary navigation"
            className={`hidden md:flex items-center gap-7 transition-opacity duration-200 ${
              isFocusMode ? 'opacity-25 pointer-events-none' : 'opacity-100'
            }`}
          >
            <NavLink
              to="/practice"
              className={({ isActive }) =>
                `text-sm font-medium py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'border-[var(--accent)] text-[var(--ink)] font-semibold'
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--ink)]'
                }`
              }
            >
              Practice
            </NavLink>

            <NavLink
              to="/progress"
              className={({ isActive }) =>
                `text-sm font-medium py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'border-[var(--accent)] text-[var(--ink)] font-semibold'
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--ink)]'
                }`
              }
            >
              Progress
            </NavLink>

            <NavLink
              to="/leaderboard"
              className={({ isActive }) =>
                `inline-flex items-center gap-1.5 text-sm font-medium py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'border-[var(--accent)] text-[var(--ink)] font-semibold'
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--ink)]'
                }`
              }
            >
              <span>Leaderboard</span>
              <span className="keycap px-1.5 py-0.2 text-[10px] leading-tight uppercase tracking-wider text-[var(--text-muted)]">
                SOON
              </span>
            </NavLink>

            <NavLink
              to="/about"
              className={({ isActive }) =>
                `text-sm font-medium py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'border-[var(--accent)] text-[var(--ink)] font-semibold'
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--ink)]'
                }`
              }
            >
              About
            </NavLink>

            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `text-sm font-medium py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'border-[var(--accent)] text-[var(--ink)] font-semibold'
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--ink)]'
                }`
              }
            >
              Settings
            </NavLink>
          </nav>

          {/* Far Right: Streak chip (hidden until first completed test), Theme toggle, Start typing button */}
          <div
            className={`hidden md:flex items-center gap-2.5 shrink-0 transition-opacity duration-200 ${
              isFocusMode ? 'opacity-25 pointer-events-none' : 'opacity-100'
            }`}
          >
            {hasCompletedAnyTest && (
              <Link
                to="/progress"
                title={`Current daily streak: ${currentStreak} day${currentStreak === 1 ? '' : 's'}`}
                className="keycap px-2.5 py-1 text-xs font-medium text-[var(--ink)]"
              >
                <Flame className="w-3.5 h-3.5 text-[var(--accent-ink)]" />
                <span className="tabular-nums">{currentStreak}</span>
              </Link>
            )}

            <button
              type="button"
              onClick={() => setIsShortcutsOpen(true)}
              title="Keyboard shortcuts (?)"
              aria-label="Keyboard shortcuts"
              className="keycap px-2.5 py-1 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--ink)]"
            >
              ?
            </button>

            <button
              type="button"
              onClick={cycleTheme}
              title={themeLabel}
              aria-label={themeLabel}
              className="keycap px-2.5 py-1.5 text-xs font-medium"
            >
              <ThemeIcon className="w-3.5 h-3.5" />
              <span className="capitalize">{settings.theme}</span>
            </button>

            <Link
              to="/practice"
              className="keycap-accent px-4 py-1.5 text-xs uppercase tracking-wider"
            >
              Start typing
            </Link>
          </div>

          {/* Mobile Menu Trigger */}
          <div className="flex md:hidden items-center gap-2">
            {hasCompletedAnyTest && (
              <Link
                to="/progress"
                className="keycap px-2 py-1 text-xs font-medium"
                aria-label={`Current streak ${currentStreak} days`}
              >
                <Flame className="w-3.5 h-3.5 text-[var(--accent-ink)]" />
                <span className="tabular-nums">{currentStreak}</span>
              </Link>
            )}
            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              className="keycap p-2"
            >
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Full-height Mobile Drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 top-16 z-50 bg-[var(--paper)] border-t border-[var(--line)] flex flex-col justify-between p-6 md:hidden overflow-y-auto"
          role="dialog"
          aria-label="Mobile navigation menu"
        >
          <nav className="flex flex-col gap-5">
            <NavLink
              to="/practice"
              className={({ isActive }) =>
                `font-display text-3xl font-extrabold tracking-tight ${
                  isActive ? 'text-[var(--accent-ink)] underline' : 'text-[var(--ink)]'
                }`
              }
            >
              Practice
            </NavLink>
            <NavLink
              to="/progress"
              className={({ isActive }) =>
                `font-display text-3xl font-extrabold tracking-tight ${
                  isActive ? 'text-[var(--accent-ink)] underline' : 'text-[var(--ink)]'
                }`
              }
            >
              Progress
            </NavLink>
            <NavLink
              to="/leaderboard"
              className={({ isActive }) =>
                `inline-flex items-center gap-3 font-display text-3xl font-extrabold tracking-tight ${
                  isActive ? 'text-[var(--accent-ink)] underline' : 'text-[var(--ink)]'
                }`
              }
            >
              <span>Leaderboard</span>
              <span className="keycap px-2 py-0.5 text-xs font-mono-code">SOON</span>
            </NavLink>
            <NavLink
              to="/about"
              className={({ isActive }) =>
                `font-display text-3xl font-extrabold tracking-tight ${
                  isActive ? 'text-[var(--accent-ink)] underline' : 'text-[var(--ink)]'
                }`
              }
            >
              About
            </NavLink>
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `font-display text-3xl font-extrabold tracking-tight ${
                  isActive ? 'text-[var(--accent-ink)] underline' : 'text-[var(--ink)]'
                }`
              }
            >
              Settings
            </NavLink>
          </nav>

          <div className="pt-6 border-t border-[var(--line)] flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={cycleTheme}
                className="keycap px-3.5 py-2 text-xs font-medium flex-1 justify-center"
              >
                <ThemeIcon className="w-4 h-4" />
                <span>Theme: {settings.theme}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  setIsShortcutsOpen(true);
                }}
                className="keycap px-3.5 py-2 text-xs font-medium"
              >
                Shortcuts (?)
              </button>
            </div>
            <Link
              to="/practice"
              className="keycap-accent w-full py-3 text-sm uppercase tracking-wider justify-center"
            >
              Start typing
            </Link>
          </div>
        </div>
      )}
    </>
  );
};
