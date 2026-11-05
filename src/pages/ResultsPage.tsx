import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Award, BarChart2, Play, RotateCcw, X } from 'lucide-react';
import { CATEGORIES } from '../data/content';
import { BADGE_DEFINITIONS } from '../engine/scoring';
import { QwertyHeatmap } from '../components/QwertyHeatmap';
import { ShareCardCanvas } from '../components/ShareCardCanvas';
import { useApp } from '../context/AppContext';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

export const ResultsPage: React.FC = () => {
  useDocumentMeta('Test Results', 'Detailed typing test results, WPM chart, and slow-key latency breakdown.');

  const navigate = useNavigate();
  const { lastResult, keyStats, levelInfo } = useApp();
  const [displayWpm, setDisplayWpm] = useState(0);
  const [heatmapScope, setHeatmapScope] = useState<'test' | 'all'>('test');
  const [hoveredSecond, setHoveredSecond] = useState<number | null>(null);
  const [showLevelModal, setShowLevelModal] = useState(false);

  useEffect(() => {
    if (!lastResult) return;
    if (lastResult.leveledUpTo) {
      setShowLevelModal(true);
    }

    const prefersReduced =
      document.documentElement.classList.contains('reduce-motion') ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      setDisplayWpm(lastResult.netWpm);
      return;
    }

    const target = lastResult.netWpm;
    const durationMs = 900;
    const start = performance.now();

    let rafId = 0;
    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayWpm(Math.round(target * eased));
      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      }
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [lastResult]);

  // Tab shortcut to try again
  useEffect(() => {
    if (!lastResult) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        navigate(
          `/practice?category=${lastResult.category}&time=${lastResult.duration}&level=${lastResult.level}`
        );
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lastResult, navigate]);

  const unlockedBadgesMeta = useMemo(() => {
    if (!lastResult?.newlyUnlockedBadges) return [];
    return BADGE_DEFINITIONS.filter((b) =>
      lastResult.newlyUnlockedBadges!.includes(b.id)
    );
  }, [lastResult]);

  if (!lastResult) {
    return <Navigate to="/practice" replace />;
  }

  const categoryMeta =
    CATEGORIES.find((c) => c.slug === lastResult.category) ?? CATEGORIES[0];

  // SVG WPM Chart coordinates
  const samples =
    lastResult.perSecond.length > 0
      ? lastResult.perSecond
      : [{ second: 1, netWpm: lastResult.netWpm, rawWpm: lastResult.rawWpm, errorsInSecond: 0 }];

  const chartW = 860;
  const chartH = 220;
  const padL = 44;
  const padR = 24;
  const padT = 20;
  const padB = 34;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;

  const maxWpm = Math.max(60, ...samples.map((s) => Math.max(s.netWpm, s.rawWpm))) + 10;

  const getX = (idx: number) =>
    samples.length <= 1
      ? padL + plotW / 2
      : padL + (idx / (samples.length - 1)) * plotW;

  const getY = (wpm: number) =>
    padT + plotH - (Math.min(maxWpm, Math.max(0, wpm)) / maxWpm) * plotH;

  const linePath = samples
    .map((s, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx).toFixed(1)} ${getY(s.netWpm).toFixed(1)}`)
    .join(' ');

  const hoveredSample =
    hoveredSecond !== null
      ? samples.find((s) => s.second === hoveredSecond) ?? null
      : null;

  const accuracyRadius = 32;
  const accuracyCircumference = 2 * Math.PI * accuracyRadius;
  const accuracyOffset =
    accuracyCircumference * (1 - Math.max(0, Math.min(100, lastResult.accuracy)) / 100);

  return (
    <div className="max-w-[1040px] mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* Screen reader polite announcement of final score */}
      <div className="sr-only" aria-live="polite">
        Test finished. {lastResult.netWpm} words per minute with {lastResult.accuracy} percent accuracy on {categoryMeta.name}.
      </div>

      {/* HERO RESULT CARD */}
      <section className="paper-card p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-[var(--line)]">
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono-code text-[var(--text-muted)]">
            <span className="uppercase text-[var(--ink)] font-semibold">
              {categoryMeta.name}
            </span>
            <span aria-hidden="true">·</span>
            <span className="capitalize">{lastResult.level}</span>
            <span aria-hidden="true">·</span>
            <span>{lastResult.duration}s test</span>
            <span aria-hidden="true">·</span>
            <span>+{lastResult.xpEarned} XP</span>
          </div>

          {lastResult.isPersonalBest && (
            <div className="keycap px-3 py-1 text-xs font-semibold text-[var(--accent-ink)] border-[var(--accent)]">
              <span>NEW PERSONAL BEST</span>
              {lastResult.previousBestWpm !== null &&
                lastResult.previousBestWpm !== undefined && (
                  <span className="text-[var(--text-muted)] font-normal">
                    (prev {lastResult.previousBestWpm} WPM)
                  </span>
                )}
            </div>
          )}
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Big Stamp WPM Hero */}
          <div className="lg:col-span-5 flex items-center gap-6">
            <div className="relative inline-flex flex-col">
              <motion.div
                initial={{ scale: 0.7, opacity: 0.85 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="pointer-events-none absolute inset-0 rounded-full border-2 border-[var(--accent)]"
                aria-hidden="true"
              />
              <span className="mono-label text-[var(--text-muted)]">NET WPM</span>
              <motion.div
                initial={{ scale: 1.35 }}
                animate={{ scale: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 320,
                  damping: 18,
                  duration: 0.5,
                }}
                className="font-display font-extrabold text-7xl sm:text-8xl tracking-tight text-[var(--ink)] tabular-nums leading-none mt-1"
              >
                {displayWpm}
              </motion.div>
              <span className="mt-2 text-xs font-mono-code text-[var(--accent-ink)] font-semibold">
                Backspace Score: {lastResult.backspaceScore}
              </span>
            </div>

            {/* Accuracy SVG Ring */}
            <div className="flex items-center gap-3 pl-4 border-l border-[var(--line)]">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                  <circle
                    cx="40"
                    cy="40"
                    r={accuracyRadius}
                    fill="none"
                    stroke="var(--line)"
                    strokeWidth="6"
                  />
                  <motion.circle
                    cx="40"
                    cy="40"
                    r={accuracyRadius}
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="6"
                    strokeLinecap="butt"
                    strokeDasharray={accuracyCircumference}
                    initial={{ strokeDashoffset: accuracyCircumference }}
                    animate={{ strokeDashoffset: accuracyOffset }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </svg>
                <span className="absolute font-mono-code font-semibold text-base tabular-nums text-[var(--ink)]">
                  {lastResult.accuracy}%
                </span>
              </div>
              <div>
                <span className="mono-label text-[var(--text-muted)] block">ACCURACY</span>
                <span className="text-xs text-[var(--text-muted)]">
                  {lastResult.characters.incorrect === 0
                    ? 'Zero errors'
                    : `${lastResult.characters.incorrect} incorrect`}
                </span>
              </div>
            </div>
          </div>

          {/* Secondary metrics breakdown */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3.5 border border-[var(--line)] rounded-[6px] bg-[var(--paper)]">
              <span className="mono-label text-[var(--text-muted)] block">RAW WPM</span>
              <span className="font-display font-bold text-2xl tabular-nums mt-1 block">
                {lastResult.rawWpm}
              </span>
            </div>

            <div className="p-3.5 border border-[var(--line)] rounded-[6px] bg-[var(--paper)]">
              <span className="mono-label text-[var(--text-muted)] block">CONSISTENCY</span>
              <span className="font-display font-bold text-2xl tabular-nums mt-1 block">
                {lastResult.consistency}%
              </span>
            </div>

            <div className="p-3.5 border border-[var(--line)] rounded-[6px] bg-[var(--paper)]">
              <span className="mono-label text-[var(--text-muted)] block">CHARACTERS</span>
              <span
                className="font-mono-code font-semibold text-sm tabular-nums mt-2 block"
                title="Correct / Incorrect / Extra / Missed"
              >
                {lastResult.characters.correct} / {lastResult.characters.incorrect} /{' '}
                {lastResult.characters.extra} / {lastResult.characters.missed}
              </span>
              <span className="text-[11px] font-mono-code text-[var(--text-muted)]">
                cor / err / ext / mis
              </span>
            </div>

            <div className="p-3.5 border border-[var(--line)] rounded-[6px] bg-[var(--paper)]">
              <span className="mono-label text-[var(--text-muted)] block">TIME</span>
              <span className="font-display font-bold text-2xl tabular-nums mt-1 block">
                {lastResult.elapsedSeconds}s
              </span>
            </div>
          </div>
        </div>

        {/* Unlocked Badges strip if any */}
        {unlockedBadgesMeta.length > 0 && (
          <div className="mt-6 pt-5 border-t border-[var(--line)] flex flex-wrap items-center gap-3">
            <span className="mono-label text-[var(--accent-ink)] flex items-center gap-1.5">
              <Award className="w-4 h-4" />
              Badge unlocked:
            </span>
            {unlockedBadgesMeta.map((b) => (
              <span key={b.id} className="keycap px-3 py-1 text-xs font-semibold">
                <span>[{b.glyph}]</span>
                <span>{b.name}</span>
              </span>
            ))}
          </div>
        )}

        {/* Primary Action Bar */}
        <div className="mt-8 pt-6 border-t border-[var(--line)] flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to={`/practice?category=${lastResult.category}&time=${lastResult.duration}&level=${lastResult.level}`}
              className="keycap-accent px-5 py-2.5 text-xs uppercase tracking-wider"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Try again (Tab)</span>
            </Link>
            <Link to="/practice" className="keycap px-4 py-2.5 text-xs font-medium">
              <Play className="w-3.5 h-3.5" />
              <span>New test</span>
            </Link>
            <Link to="/progress" className="keycap px-4 py-2.5 text-xs font-medium">
              <BarChart2 className="w-3.5 h-3.5" />
              <span>View progress</span>
            </Link>
          </div>
        </div>
      </section>

      {/* WPM PER SECOND SVG LINE CHART */}
      <section className="paper-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <span className="mono-label text-[var(--text-muted)] block">PACE & ERRORS</span>
            <h2 className="h3-display mt-0.5">WPM per second</h2>
          </div>
          <div className="text-xs font-mono-code text-[var(--text-muted)] min-h-[20px]">
            {hoveredSample ? (
              <span className="text-[var(--ink)] font-semibold">
                Second {hoveredSample.second}s · {hoveredSample.netWpm} WPM (raw{' '}
                {hoveredSample.rawWpm}) · {hoveredSample.errorsInSecond} errors
              </span>
            ) : (
              <span>Hover chart for second-by-second pace · Vermilion baseline ticks mark errors</span>
            )}
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${chartW} ${chartH}`}
            className="w-full h-auto block font-mono-code select-none"
            role="img"
            aria-label="WPM per second line chart"
          >
            {/* Horizontal grid lines */}
            {[0, 0.5, 1].map((ratio) => {
              const val = Math.round(maxWpm * ratio);
              const y = getY(val);
              return (
                <g key={ratio}>
                  <line
                    x1={padL}
                    y1={y}
                    x2={chartW - padR}
                    y2={y}
                    stroke="var(--line)"
                    strokeDasharray={ratio === 0 ? undefined : '4 4'}
                    strokeWidth="1"
                  />
                  <text
                    x={padL - 8}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="10"
                    fill="var(--text-muted)"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Animated WPM line */}
            <motion.path
              d={linePath}
              fill="none"
              stroke="var(--ink)"
              strokeWidth="2.5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />

            {/* Data points and error baseline ticks */}
            {samples.map((s, idx) => {
              const cx = getX(idx);
              const cy = getY(s.netWpm);
              return (
                <g
                  key={s.second}
                  onMouseEnter={() => setHoveredSecond(s.second)}
                  onMouseLeave={() => setHoveredSecond(null)}
                  className="cursor-pointer"
                >
                  {/* Invisible wider hover column */}
                  <rect
                    x={cx - 10}
                    y={padT}
                    width={20}
                    height={plotH}
                    fill="transparent"
                  />
                  <circle
                    cx={cx}
                    cy={cy}
                    r={hoveredSecond === s.second ? 5 : 3}
                    fill={hoveredSecond === s.second ? 'var(--accent)' : 'var(--ink)'}
                  />
                  {/* Error tick on baseline */}
                  {s.errorsInSecond > 0 && (
                    <line
                      x1={cx}
                      y1={padT + plotH - 8}
                      x2={cx}
                      y2={padT + plotH + 6}
                      stroke="var(--accent)"
                      strokeWidth="3"
                    />
                  )}
                  {(idx === 0 ||
                    idx === samples.length - 1 ||
                    idx % Math.max(1, Math.floor(samples.length / 6)) === 0) && (
                    <text
                      x={cx}
                      y={chartH - 8}
                      textAnchor="middle"
                      fontSize="10"
                      fill="var(--text-muted)"
                    >
                      {s.second}s
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </section>

      {/* SLOW KEYS PANEL */}
      <section className="paper-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div>
            <span className="mono-label text-[var(--text-muted)] block">KEYSTROKE TELEMETRY</span>
            <h2 className="h3-display mt-0.5">Slow keys heatmap</h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div
              className="inline-flex items-center gap-1 p-0.5 border border-[var(--line)] rounded-[4px] bg-[var(--paper)]"
              role="group"
              aria-label="Heatmap scope"
            >
              <button
                type="button"
                onClick={() => setHeatmapScope('test')}
                className={`px-3 py-1 text-xs font-mono-code rounded-[2px] ${
                  heatmapScope === 'test'
                    ? 'bg-[var(--ink)] text-[var(--paper)] font-semibold'
                    : 'text-[var(--text-muted)] hover:text-[var(--ink)]'
                }`}
              >
                This test
              </button>
              <button
                type="button"
                onClick={() => setHeatmapScope('all')}
                className={`px-3 py-1 text-xs font-mono-code rounded-[2px] ${
                  heatmapScope === 'all'
                    ? 'bg-[var(--ink)] text-[var(--paper)] font-semibold'
                    : 'text-[var(--text-muted)] hover:text-[var(--ink)]'
                }`}
              >
                All time
              </button>
            </div>

            <Link
              to="/practice?category=weak-keys"
              className="keycap-accent px-4 py-1.5 text-xs uppercase tracking-wider"
            >
              Practice these keys
            </Link>
          </div>
        </div>

        <QwertyHeatmap
          mode="heatmap"
          keyStats={heatmapScope === 'test' ? lastResult.testKeyStats : keyStats}
          minSamples={heatmapScope === 'test' ? 1 : 3}
        />
      </section>

      {/* SHARE CARD (1200x630 Canvas) */}
      <ShareCardCanvas result={lastResult} levelInfo={levelInfo} />

      {/* LEVEL-UP MODAL when threshold crossed */}
      {showLevelModal && lastResult.leveledUpTo && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="level-up-title"
          onClick={() => setShowLevelModal(false)}
        >
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="paper-card max-w-md w-full p-6 text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowLevelModal(false)}
                aria-label="Close level up modal"
                className="keycap p-1.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <motion.div
              initial={{ y: 16 }}
              animate={{ y: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 16 }}
              className="keycap-accent w-16 h-16 mx-auto text-xl font-display font-extrabold"
            >
              L{lastResult.leveledUpTo.level}
            </motion.div>
            <div>
              <span className="mono-label text-[var(--accent-ink)]">LEVEL UP</span>
              <h3 id="level-up-title" className="h2-display mt-1">
                {lastResult.leveledUpTo.title} Developer
              </h3>
              <p className="text-sm text-[var(--text-muted)] mt-2">
                You reached Level {lastResult.leveledUpTo.level} with {levelInfo.xp} total XP.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowLevelModal(false)}
              className="keycap-accent w-full py-2.5 text-xs uppercase tracking-wider justify-center"
            >
              Continue
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};
