import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Keyboard, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import {
  CATEGORIES,
  getCategoryLines,
  type CategorySlug,
  type CodeLanguage,
  type DifficultyLevel,
  type StandardCategorySlug,
  type TestDuration,
} from '../data/content';
import { buildAdaptiveLines, rankSlowKeys } from '../engine/scoring';
import { playKeySound } from '../engine/sound';
import { TypingEngine } from '../engine/typingEngine';
import type { CaretStyle } from '../engine/types';
import { QwertyHeatmap } from '../components/QwertyHeatmap';
import { useApp } from '../context/AppContext';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

interface TypingLineProps {
  lineNumber: number;
  promptPrefix: string;
  target: string;
  typed: string;
  isActive: boolean;
  isCommitted: boolean;
  caretStyle: CaretStyle;
  isReadyState: boolean;
}

const TypingLine: React.FC<TypingLineProps> = memo(
  ({
    lineNumber,
    promptPrefix,
    target,
    typed,
    isActive,
    isCommitted,
    caretStyle,
    isReadyState,
  }) => {
    const chars = target.split('');
    const extraChars =
      typed.length > target.length ? typed.slice(target.length).split('') : [];
    const isAtLineEnd = isActive && typed.length >= target.length;

    const getCaretClass = () => {
      if (caretStyle === 'underline') {
        return 'border-b-[3px] border-[var(--accent)]';
      }
      if (caretStyle === 'bar') {
        return 'border-l-[3px] border-[var(--accent)]';
      }
      // block cursor: blinks background only in ready state so expected character stays visible
      if (isReadyState) {
        return 'caret-block-blink';
      }
      return 'bg-[var(--accent)] text-[#1B1A17] rounded-[1px]';
    };

    return (
      <div
        className={`flex items-baseline gap-3 py-1 px-2 rounded-[4px] transition-opacity duration-100 ${
          isCommitted ? 'opacity-45' : isActive ? 'opacity-100' : 'opacity-75'
        }`}
      >
        {/* Muted line-number gutter */}
        <span
          className="w-7 shrink-0 text-right select-none text-xs font-mono-code text-[var(--text-muted)] tabular-nums"
          aria-hidden="true"
        >
          {String(lineNumber).padStart(2, '0')}
        </span>

        {/* Muted prompt prefix (not typed) */}
        {promptPrefix && (
          <span
            className="shrink-0 select-none font-mono-code text-[var(--text-muted)] opacity-75"
            aria-hidden="true"
          >
            {promptPrefix}
          </span>
        )}

        {/* Character spans */}
        <div className="flex-1 font-mono-code break-all whitespace-pre-wrap">
          {chars.map((expectedChar, idx) => {
            const isTyped = idx < typed.length;
            const actualChar = isTyped ? typed[idx] : null;
            const isCorrect = isTyped && actualChar === expectedChar;
            const isCaretHere = isActive && idx === typed.length;

            let colorClass = 'text-[var(--untyped)]';
            if (isTyped) {
              colorClass = isCorrect
                ? 'text-[var(--ink)]'
                : 'text-[var(--error)] underline decoration-[var(--error)] decoration-2 underline-offset-4';
            }

            return (
              <span
                key={idx}
                className={`relative inline ${colorClass} ${
                  isCaretHere ? getCaretClass() : ''
                }`}
              >
                {expectedChar}
              </span>
            );
          })}

          {/* Extra typed characters beyond end of target line */}
          {extraChars.map((extra, idx) => (
            <span
              key={`extra-${idx}`}
              className="text-[var(--error)] underline decoration-[var(--error)] decoration-2 underline-offset-4 bg-[var(--error)]/10"
            >
              {extra}
            </span>
          ))}

          {/* End-of-line Enter prompt & caret when user has typed all characters on the line */}
          {isAtLineEnd && (
            <span
              className={`inline-flex items-center px-1 ml-0.5 text-[0.75em] font-mono-code rounded-[2px] ${getCaretClass()}`}
              title="Press Enter to commit line"
            >
              ↵
            </span>
          )}
        </div>
      </div>
    );
  }
);

TypingLine.displayName = 'TypingLine';

const VALID_CATEGORIES: CategorySlug[] = [
  'git',
  'terminal',
  'docker',
  'sql',
  'code',
  'prompts',
  'symbols',
  'weak-keys',
];
const VALID_DURATIONS: TestDuration[] = [30, 60, 120, 300];
const VALID_LEVELS: DifficultyLevel[] = ['easy', 'medium', 'hard'];

export const PracticePage: React.FC = () => {
  useDocumentMeta(
    'Practice',
    'Practice typing git, terminal, Docker, SQL, code, AI prompts, and developer symbols.'
  );

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    settings,
    updateSettings,
    results,
    keyStats,
    recordTestResult,
    setLastResult,
    setIsArenaFocused,
    isFocusMode,
    setIsFocusMode,
  } = useApp();

  const canUseWeakKeys = results.length >= 5;

  // Read initial parameters from URL or persisted settings
  const rawCat = searchParams.get('category') as CategorySlug | null;
  const rawTime = Number(searchParams.get('time')) as TestDuration;
  const rawLevel = searchParams.get('level') as DifficultyLevel | null;
  const drillKeyParam = searchParams.get('drillKey');

  const category: CategorySlug =
    rawCat && VALID_CATEGORIES.includes(rawCat)
      ? rawCat === 'weak-keys' && !canUseWeakKeys && !drillKeyParam
        ? 'git'
        : rawCat
      : settings.lastCategory === 'weak-keys' && !canUseWeakKeys
      ? 'git'
      : settings.lastCategory;

  const duration: TestDuration = VALID_DURATIONS.includes(rawTime)
    ? rawTime
    : settings.lastDuration;

  const level: DifficultyLevel =
    rawLevel && VALID_LEVELS.includes(rawLevel) ? rawLevel : settings.lastLevel;

  const language: CodeLanguage = settings.lastLanguage || 'js';

  // Sync URL params on mount / change
  const updateModeParams = useCallback(
    (next: {
      category?: CategorySlug;
      duration?: TestDuration;
      level?: DifficultyLevel;
      language?: CodeLanguage;
      drillKey?: string | null;
    }) => {
      const c = next.category ?? category;
      const t = next.duration ?? duration;
      const l = next.level ?? level;
      const lang = next.language ?? language;

      updateSettings({
        lastCategory: c,
        lastDuration: t,
        lastLevel: l,
        lastLanguage: lang,
      });

      const params: Record<string, string> = {
        category: c,
        time: String(t),
        level: l,
      };
      if (next.drillKey) {
        params.drillKey = next.drillKey;
      }
      setSearchParams(params, { replace: true });
    },
    [category, duration, level, language, setSearchParams, updateSettings]
  );

  const activeBank = useMemo(() => {
    if (category === 'weak-keys' || drillKeyParam) {
      return buildAdaptiveLines(
        keyStats,
        drillKeyParam ? [drillKeyParam] : undefined
      );
    }
    return getCategoryLines(category as StandardCategorySlug, level, language);
  }, [category, level, language, keyStats, drillKeyParam]);

  const engineRef = useRef<TypingEngine | null>(null);
  if (!engineRef.current) {
    engineRef.current = new TypingEngine(activeBank, {
      category,
      duration,
      level,
      language,
      stopOnError: settings.stopOnError,
      drillKeys: drillKeyParam ? [drillKeyParam] : undefined,
    });
  }

  const [renderTick, setRenderTick] = useState(0);
  const [liveStats, setLiveStats] = useState({
    netWpm: 0,
    accuracy: 100,
    timeLeftSeconds: duration as number,
    errors: 0,
    elapsedMs: 0,
  });
  const [hasInputFocus, setHasInputFocus] = useState(true);
  const [windowFocused, setWindowFocused] = useState(true);

  const hiddenInputRef = useRef<HTMLInputElement | null>(null);

  const focusArenaInput = useCallback(() => {
    hiddenInputRef.current?.focus({ preventScroll: true });
    setHasInputFocus(true);
    setWindowFocused(true);
  }, []);

  const handleCompleteTest = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    setIsFocusMode(false);
    const { result, shouldSave, bigramDeltas } = engine.buildResult(Date.now());
    if (shouldSave) {
      recordTestResult(result, bigramDeltas);
    } else {
      setLastResult(result);
    }
    navigate('/results');
  }, [navigate, recordTestResult, setIsFocusMode, setLastResult]);

  const restartArena = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.reset(activeBank, {
      category,
      duration,
      level,
      language,
      stopOnError: settings.stopOnError,
      drillKeys: drillKeyParam ? [drillKeyParam] : undefined,
    });
    setIsFocusMode(false);
    setLiveStats({
      netWpm: 0,
      accuracy: 100,
      timeLeftSeconds: duration,
      errors: 0,
      elapsedMs: 0,
    });
    setRenderTick((n) => n + 1);
    focusArenaInput();
  }, [
    activeBank,
    category,
    drillKeyParam,
    duration,
    focusArenaInput,
    language,
    level,
     setIsFocusMode,
    settings.stopOnError,
  ]);

  // Reset engine whenever mode parameters change
  useEffect(() => {
    restartArena();
  }, [category, duration, level, language, drillKeyParam, settings.stopOnError, restartArena]);

  // Clean up focus mode on unmount
  useEffect(() => {
    return () => {
      setIsFocusMode(false);
      setIsArenaFocused(false);
    };
  }, [setIsArenaFocused, setIsFocusMode]);

  // Track window blur/focus mid-test
  useEffect(() => {
    const onBlur = () => setWindowFocused(false);
    const onFocus = () => setWindowFocused(true);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  // Update live stats every 250ms while running
  useEffect(() => {
    const interval = window.setInterval(() => {
      const engine = engineRef.current;
      if (!engine) return;
      if (engine.getStatus() !== 'running') return;

      const { finishedNow } = engine.tick(performance.now());
      const snap = engine.getSnapshot(performance.now());
      setLiveStats({
        netWpm: snap.netWpm,
        accuracy: snap.accuracy,
        timeLeftSeconds: snap.timeLeftSeconds,
        errors: snap.errors,
        elapsedMs: snap.elapsedMs,
      });

      if (finishedNow) {
        handleCompleteTest();
      }
    }, 200);

    return () => window.clearInterval(interval);
  }, [handleCompleteTest]);

  // Autofocus on mount for desktop
  useEffect(() => {
    focusArenaInput();
  }, [focusArenaInput]);

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const engine = engineRef.current;
    if (!engine) return;

    if (e.key === 'Tab') {
      e.preventDefault();
      restartArena();
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      restartArena();
      return;
    }

    const res = engine.handleKeyDown(e.key, performance.now(), {
      ctrlKey: e.ctrlKey,
      metaKey: e.metaKey,
      altKey: e.altKey,
      isComposing: e.nativeEvent.isComposing,
    });

    if (res.consumed) {
      e.preventDefault();
      if (res.startedNow) {
        setIsFocusMode(true);
      }
      if (settings.soundEnabled && res.wasCorrect !== undefined) {
        playKeySound(settings.soundVolume, !res.wasCorrect);
      }
      if (res.finishedNow) {
        handleCompleteTest();
        return;
      }
      const snap = engine.getSnapshot(performance.now());
      setLiveStats({
        netWpm: snap.netWpm,
        accuracy: snap.accuracy,
        timeLeftSeconds: snap.timeLeftSeconds,
        errors: snap.errors,
        elapsedMs: snap.elapsedMs,
      });
      setRenderTick((n) => n + 1);
    }
  };

  const engine = engineRef.current!;
  const snapshot = engine.getSnapshot();
  // Ensure renderTick is referenced so React updates active line spans immediately
  void renderTick;

  const categoryMeta =
    CATEGORIES.find((c) => c.slug === category) ?? CATEGORIES[0];

  // Viewport shows 4 lines at a time, scrolling up as lines complete
  const viewportStartIndex = Math.max(0, snapshot.activeLineIndex - 1);
  const visibleIndices = [
    viewportStartIndex,
    viewportStartIndex + 1,
    viewportStartIndex + 2,
    viewportStartIndex + 3,
  ];

  // Draining progress bar percentage (100% -> 0%)
  const remainingPct =
    snapshot.status === 'ready'
      ? 100
      : Math.max(
          0,
          Math.min(100, ((duration * 1000 - liveStats.elapsedMs) / (duration * 1000)) * 100)
        );

  const slowKeysList = useMemo(() => rankSlowKeys(keyStats, 8, 6), [keyStats]);

  const lineSpacingClass =
    settings.lineSpacing === 'compact'
      ? 'leading-[1.45]'
      : settings.lineSpacing === 'relaxed'
      ? 'leading-[1.95]'
      : 'leading-[1.7]';

  const isRunningBlur =
    snapshot.status === 'running' && (!hasInputFocus || !windowFocused);

  return (
    <div className="max-w-[1040px] mx-auto px-4 sm:px-6 py-8">
      {/* Touch device / small screen notice */}
      <div className="sm:hidden mb-4 paper-card px-3.5 py-2.5 text-xs font-mono-code text-[var(--text-muted)]">
        Backspace works best with a physical keyboard. You can still type below if a keyboard is attached.
      </div>

      {/* 1. MODE ROW (fades to 25% opacity during active typing test) */}
      <section
        aria-label="Practice configuration"
        className={`transition-opacity duration-200 space-y-3 pb-4 border-b border-[var(--line)] ${
          isFocusMode ? 'opacity-25' : 'opacity-100'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Category Tabs */}
          <div
            className="flex flex-wrap items-center gap-4"
            role="tablist"
            aria-label="Practice category"
          >
            {CATEGORIES.map((cat) => {
              const isWeakKeys = cat.slug === 'weak-keys';
              const isDisabled = isWeakKeys && !canUseWeakKeys && !drillKeyParam;
              const isActive = category === cat.slug;

              return (
                <button
                  key={cat.slug}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  disabled={isDisabled}
                  title={
                    isDisabled
                      ? 'Complete a few tests first (minimum 5 saved tests)'
                      : cat.description
                  }
                  onClick={() =>
                    updateModeParams({ category: cat.slug, drillKey: null })
                  }
                  className={`py-1.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'border-[var(--accent)] text-[var(--ink)] font-semibold'
                      : isDisabled
                      ? 'border-transparent text-[var(--text-muted)] opacity-45 cursor-not-allowed'
                      : 'border-transparent text-[var(--text-muted)] hover:text-[var(--ink)]'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>

          {/* Code language switch when Code is selected */}
          {category === 'code' && (
            <div
              className="inline-flex items-center gap-1 p-0.5 border border-[var(--line)] rounded-[4px] bg-[var(--card)]"
              role="group"
              aria-label="Programming language"
            >
              <button
                type="button"
                onClick={() => updateModeParams({ language: 'js' })}
                className={`px-2.5 py-1 text-xs font-mono-code rounded-[2px] transition-colors ${
                  language === 'js'
                    ? 'bg-[var(--ink)] text-[var(--paper)] font-semibold'
                    : 'text-[var(--text-muted)] hover:text-[var(--ink)]'
                }`}
              >
                JavaScript/TypeScript
              </button>
              <button
                type="button"
                onClick={() => updateModeParams({ language: 'python' })}
                className={`px-2.5 py-1 text-xs font-mono-code rounded-[2px] transition-colors ${
                  language === 'python'
                    ? 'bg-[var(--ink)] text-[var(--paper)] font-semibold'
                    : 'text-[var(--text-muted)] hover:text-[var(--ink)]'
                }`}
              >
                Python
              </button>
            </div>
          )}
        </div>

        {/* Second sub-row: Duration pills, Difficulty segmented control, Sound & Keyboard overlay toggles */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-4">
            {/* Duration pills */}
            <div
              className="inline-flex items-center gap-1.5"
              role="group"
              aria-label="Test duration"
            >
              {VALID_DURATIONS.map((sec) => {
                const active = duration === sec;
                return (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => updateModeParams({ duration: sec })}
                    className={`keycap px-2.5 py-1 text-xs tabular-nums ${
                      active
                        ? 'bg-[var(--ink)] text-[var(--paper)] border-[var(--ink)] font-semibold'
                        : 'text-[var(--text-muted)] hover:text-[var(--ink)]'
                    }`}
                  >
                    {sec}s
                  </button>
                );
              })}
            </div>

            {/* Difficulty segmented control */}
            <div
              className="inline-flex items-center gap-1 p-0.5 border border-[var(--line)] rounded-[4px] bg-[var(--card)]"
              role="group"
              aria-label="Difficulty level"
            >
              {VALID_LEVELS.map((lvl) => {
                const active = level === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => updateModeParams({ level: lvl })}
                    className={`px-2.5 py-1 text-xs font-mono-code capitalize rounded-[2px] transition-colors ${
                      active
                        ? 'bg-[var(--ink)] text-[var(--paper)] font-semibold'
                        : 'text-[var(--text-muted)] hover:text-[var(--ink)]'
                    }`}
                  >
                    {lvl}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Toggles: Sound and Keyboard overlay */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                updateSettings({ soundEnabled: !settings.soundEnabled })
              }
              aria-pressed={settings.soundEnabled}
              className={`keycap px-2.5 py-1 text-xs ${
                settings.soundEnabled
                  ? 'border-[var(--ink)] text-[var(--ink)] font-semibold'
                  : 'text-[var(--text-muted)]'
              }`}
            >
              {settings.soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-[var(--accent-ink)]" />
              ) : (
                <VolumeX className="w-3.5 h-3.5" />
              )}
              <span>Sound</span>
            </button>

            <button
              type="button"
              onClick={() =>
                updateSettings({ keyboardOverlay: !settings.keyboardOverlay })
              }
              aria-pressed={settings.keyboardOverlay}
              className={`keycap px-2.5 py-1 text-xs ${
                settings.keyboardOverlay
                  ? 'border-[var(--ink)] text-[var(--ink)] font-semibold'
                  : 'text-[var(--text-muted)]'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>Keyboard overlay</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. LIVE STATS ROW above the card, left-aligned */}
      <section
        aria-label="Live typing statistics"
        className="mt-6 mb-3 flex flex-wrap items-end justify-between gap-6"
      >
        <div className="flex flex-wrap items-baseline gap-8">
          <div>
            <span className="mono-label text-[var(--text-muted)] block">WPM</span>
            <span className="font-display font-extrabold text-5xl sm:text-6xl tracking-tight text-[var(--ink)] tabular-nums leading-none">
              {snapshot.status === 'ready' ? 0 : liveStats.netWpm}
            </span>
          </div>

          <div>
            <span className="mono-label text-[var(--text-muted)] block">ACCURACY</span>
            <span className="font-mono-code font-semibold text-2xl text-[var(--ink)] tabular-nums">
              {snapshot.status === 'ready' ? '0%' : `${liveStats.accuracy}%`}
            </span>
          </div>

          <div>
            <span className="mono-label text-[var(--text-muted)] block">TIME LEFT</span>
            <span className="font-mono-code font-semibold text-2xl text-[var(--ink)] tabular-nums">
              {snapshot.status === 'ready' ? `${duration}s` : `${liveStats.timeLeftSeconds}s`}
            </span>
          </div>

          <div>
            <span className="mono-label text-[var(--text-muted)] block">ERRORS</span>
            <span
              className={`font-mono-code font-semibold text-2xl tabular-nums ${
                liveStats.errors > 0 ? 'text-[var(--error)]' : 'text-[var(--ink)]'
              }`}
            >
              {snapshot.status === 'ready' ? 0 : liveStats.errors}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {drillKeyParam && (
            <span className="mono-label text-[var(--accent-ink)]">
              Drilling key: "{drillKeyParam}"
            </span>
          )}
          <button
            type="button"
            onClick={restartArena}
            className="keycap px-3 py-1.5 text-xs"
            title="Restart test (Tab)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restart</span>
          </button>
        </div>
      </section>

      {/* 3. TYPING CARD (hero of the screen) */}
      <div
        onClick={focusArenaInput}
        className="paper-card relative overflow-hidden cursor-text select-none"
      >
        {/* Thin vermilion progress line along top edge that drains with time */}
        <div className="w-full h-[3px] bg-[var(--line)] overflow-hidden" aria-hidden="true">
          <div
            className="h-full bg-[var(--accent)] transition-transform duration-150 ease-linear origin-left"
            style={{ transform: `scaleX(${remainingPct / 100})` }}
          />
        </div>

        {/* Hidden accessible input that captures all keystrokes */}
        <input
          ref={hiddenInputRef}
          type="text"
          value=""
          onChange={() => {}}
          onKeyDown={onInputKeyDown}
          onFocus={() => {
            setHasInputFocus(true);
            setIsArenaFocused(true);
          }}
          onBlur={() => {
            setHasInputFocus(false);
            setIsArenaFocused(false);
          }}
          onPaste={(e) => e.preventDefault()}
          onCut={(e) => e.preventDefault()}
          onDrop={(e) => e.preventDefault()}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          aria-label={`Typing practice arena for ${categoryMeta.name}. Type each line and press Enter at the end of the line. Press Tab to restart or Escape to exit.`}
          className="sr-only"
        />

        {/* 4-line viewport */}
        <div
          className={`p-5 sm:p-8 transition-opacity duration-150 ${lineSpacingClass} ${
            isRunningBlur ? 'opacity-30' : 'opacity-100'
          }`}
          style={{
            fontSize: `clamp(18px, 2.4vw, ${settings.fontSize}px)`,
          }}
        >
          {visibleIndices.map((lineIdx) => {
            const targetLine = snapshot.targetLines[lineIdx] ?? '';
            const typedLine = snapshot.typedLines[lineIdx] ?? '';
            return (
              <TypingLine
                key={lineIdx}
                lineNumber={lineIdx + 1}
                promptPrefix={categoryMeta.promptPrefix}
                target={targetLine}
                typed={typedLine}
                isActive={lineIdx === snapshot.activeLineIndex}
                isCommitted={lineIdx < snapshot.activeLineIndex}
                caretStyle={settings.caretStyle}
                isReadyState={snapshot.status === 'ready'}
              />
            );
          })}
        </div>

        {/* Ready state footer caption */}
        <div className="px-5 sm:px-8 py-3 border-t border-[var(--line)] flex flex-wrap items-center justify-between gap-2 text-xs font-mono-code text-[var(--text-muted)]">
          <span>
            {snapshot.status === 'ready'
              ? 'Start typing to begin.'
              : `Line ${snapshot.activeLineIndex + 1} · Press Enter at end of line`}
          </span>
          <span>
            {categoryMeta.name} · {level} · {duration}s
          </span>
        </div>

        {/* Dimmed overlay if window or arena loses focus mid-test */}
        {isRunningBlur && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--paper)]/75">
            <button
              type="button"
              onClick={focusArenaInput}
              className="keycap-accent px-5 py-2.5 text-sm"
            >
              Click to continue typing
            </button>
          </div>
        )}
      </div>

      {/* Optional On-Screen Keyboard Overlay */}
      {settings.keyboardOverlay && (
        <div className="mt-5 paper-card p-4">
          <QwertyHeatmap
            mode="live-overlay"
            nextExpectedChar={engine.getNextExpectedChar()}
          />
        </div>
      )}

      {/* 4. SLOW KEYS STRIP below the card */}
      <section
        aria-label="Your slow keys"
        className="mt-6 paper-card px-5 py-4 flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex flex-wrap items-center gap-3">
          <span className="mono-label text-[var(--text-muted)]">YOUR SLOW KEYS</span>
          {slowKeysList.length === 0 ? (
            <span className="text-sm text-[var(--text-muted)]">
              Finish one test to see your slow keys.
            </span>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {slowKeysList.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() =>
                    updateModeParams({
                      category: 'weak-keys',
                      drillKey: item.key,
                    })
                  }
                  title={`Click to start a weak-keys drill focusing on "${item.key}"`}
                  className="keycap px-2.5 py-1 text-xs"
                >
                  <span className="font-semibold text-[var(--ink)]">{item.key}</span>
                  <span className="text-[var(--text-muted)] tabular-nums">
                    {item.avgLatencyMs} ms
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {slowKeysList.length > 0 && (
          <span className="text-xs font-mono-code text-[var(--text-muted)]">
            Click a keycap to drill it
          </span>
        )}
      </section>

      {/* 5. SHORTCUT HINTS row of keycap chips */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-xs font-mono-code text-[var(--text-muted)]">
        <span className="inline-flex items-center gap-1.5">
          <kbd className="keycap px-2 py-0.5 text-xs">Tab</kbd>
          <span>restart</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <kbd className="keycap px-2 py-0.5 text-xs">Esc</kbd>
          <span>exit</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <kbd className="keycap px-2 py-0.5 text-xs">Enter</kbd>
          <span>next line</span>
        </span>
      </div>
    </div>
  );
};
