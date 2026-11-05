import React, { Suspense, lazy, useEffect, useRef } from 'react';
import {
  BrowserRouter,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { motion } from 'motion/react';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { ShortcutsModal } from './components/ShortcutsModal';
import { AppProvider, useApp } from './context/AppContext';
import { LandingPage } from './pages/LandingPage';
import { PracticePage } from './pages/PracticePage';
import { ResultsPage } from './pages/ResultsPage';

const ProgressPage = lazy(() =>
  import('./pages/ProgressPage').then((m) => ({ default: m.ProgressPage }))
);
const LeaderboardPage = lazy(() =>
  import('./pages/LeaderboardPage').then((m) => ({ default: m.LeaderboardPage }))
);
const SettingsPage = lazy(() =>
  import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);
const AboutPage = lazy(() =>
  import('./pages/AboutPage').then((m) => ({ default: m.AboutPage }))
);
const ContactPage = lazy(() =>
  import('./pages/ContactPage').then((m) => ({ default: m.ContactPage }))
);
const PrivacyPage = lazy(() =>
  import('./pages/PrivacyPage').then((m) => ({ default: m.PrivacyPage }))
);
const TermsPage = lazy(() =>
  import('./pages/TermsPage').then((m) => ({ default: m.TermsPage }))
);
const ChangelogPage = lazy(() =>
  import('./pages/ChangelogPage').then((m) => ({ default: m.ChangelogPage }))
);
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
);

const BlockCursorLoader: React.FC = () => (
  <div
    className="min-h-[50vh] flex items-center justify-center"
    role="status"
    aria-label="Loading page"
  >
    <span className="block-cursor text-4xl" />
  </div>
);

const AppShell: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    isArenaFocused,
    cycleTheme,
    setIsShortcutsOpen,
  } = useApp();

  const lastGTimeRef = useRef<number>(0);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Global hotkeys (never active while typing arena or form inputs are focused)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isArenaFocused) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      const now = performance.now();

      if (e.key === 'g' || e.key === 'G') {
        lastGTimeRef.current = now;
        return;
      }

      if (now - lastGTimeRef.current < 900) {
        if (e.key === 'p' || e.key === 'P') {
          e.preventDefault();
          lastGTimeRef.current = 0;
          navigate('/practice');
          return;
        }
        if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          lastGTimeRef.current = 0;
          navigate('/progress');
          return;
        }
      }

      if (e.key === '?') {
        e.preventDefault();
        setIsShortcutsOpen(true);
        return;
      }

      if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        cycleTheme();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isArenaFocused, navigate, cycleTheme, setIsShortcutsOpen]);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--paper)] text-[var(--ink)]">
      {/* Skip-to-content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 keycap-accent px-4 py-2 text-xs uppercase"
      >
        Skip to content
      </a>

      <Header />

      {/* Route transition: 180ms fade plus 8px upward slide on enter, no exit animation */}
      <main id="main-content" className="flex-1" tabIndex={-1}>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          <Suspense fallback={<BlockCursorLoader />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/practice" element={<PracticePage />} />
              <Route path="/results" element={<ResultsPage />} />
              <Route path="/progress" element={<ProgressPage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/changelog" element={<ChangelogPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </motion.div>
      </main>

      <Footer />
      <ShortcutsModal />
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppShell />
      </AppProvider>
    </BrowserRouter>
  );
}
