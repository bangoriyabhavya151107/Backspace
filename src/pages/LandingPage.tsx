import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, RotateCcw } from 'lucide-react';
import { CATEGORIES, getCategoryLineCount } from '../data/content';
import { LADDER_TIERS } from '../engine/scoring';
import { TypingEngine } from '../engine/typingEngine';
import { LotusCornerOrnament, OrnamentBand } from '../components/OrnamentBand';
import { useApp } from '../context/AppContext';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

const MARQUEE_ITEMS = [
  'git',
  'grep',
  'docker',
  'kubectl',
  'SELECT',
  'async/await',
  'regex',
  '=>',
  '!==',
  '&&',
  'pipes',
  'JSON',
  'Python',
  'TypeScript',
  'prompts',
];

const FAQ_ITEMS = [
  {
    q: 'Is Backspace free?',
    a: 'Yes, free in v1. Every category, symbol drill, slow-key heatmap, and shareable result card is unlocked with no paywalls.',
  },
  {
    q: 'Do I need an account?',
    a: 'No, your data lives in your browser. Start typing immediately without signing up or verifying an email.',
  },
  {
    q: 'Does it work offline?',
    a: 'Yes, once loaded. The application shell and full command bank are cached locally so you can practice on flights, trains, or offline terminals.',
  },
  {
    q: 'Where does my data go?',
    a: 'Nowhere. It stays on your device, and you can export or delete it in Settings at any time.',
  },
  {
    q: 'How is WPM calculated?',
    a: 'Correct characters divided by 5, divided by minutes elapsed since your first keystroke. Pressing Enter to commit a completed line counts as one character.',
  },
  {
    q: 'What are slow keys?',
    a: 'Keys where your average time between keystrokes is highest, or where you make the most mistakes across at least 8 recorded samples.',
  },
  {
    q: 'Can I practice on my phone?',
    a: 'It works best with a physical keyboard. Mobile visitors can explore analytics or attach an external keyboard to run tests.',
  },
];

const MINI_TARGET = 'git commit -m "ship it"';

export const LandingPage: React.FC = () => {
  useDocumentMeta(
    'Backspace – Typing Practice for Developers',
    'Typing practice for the characters developers actually type. Practice git, terminal, Docker, SQL, code and AI prompts. Hit Backspace Less.'
  );

  const { setIsArenaFocused } = useApp();

  // 1. Hero headline self-typing with deliberate mistake:
  // Types "Hit Backspas", hesitates 300ms, deletes "s", then types "ce Less."
  const [typedHeadline, setTypedHeadline] = useState('Hit Backspace Less.');
  const [showMistakeBackspaceTag, setShowMistakeBackspaceTag] = useState(false);

  useEffect(() => {
    const prefersReduced =
      document.documentElement.classList.contains('reduce-motion') ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      setTypedHeadline('Hit Backspace Less.');
      return;
    }

    const frames: Array<{ text: string; delay: number; bsTag?: boolean }> = [
      { text: 'H', delay: 55 },
      { text: 'Hi', delay: 55 },
      { text: 'Hit', delay: 60 },
      { text: 'Hit ', delay: 55 },
      { text: 'Hit B', delay: 65 },
      { text: 'Hit Ba', delay: 55 },
      { text: 'Hit Bac', delay: 55 },
      { text: 'Hit Back', delay: 55 },
      { text: 'Hit Backs', delay: 60 },
      { text: 'Hit Backsp', delay: 60 },
      { text: 'Hit Backspa', delay: 65 },
      { text: 'Hit Backspas', delay: 300 }, // hesitate 300ms on human mistake "s"
      { text: 'Hit Backspa', delay: 140, bsTag: true }, // visible backspace
      { text: 'Hit Backspac', delay: 65 },
      { text: 'Hit Backspace', delay: 65 },
      { text: 'Hit Backspace ', delay: 60 },
      { text: 'Hit Backspace L', delay: 60 },
      { text: 'Hit Backspace Le', delay: 55 },
      { text: 'Hit Backspace Les', delay: 55 },
      { text: 'Hit Backspace Less', delay: 55 },
      { text: 'Hit Backspace Less.', delay: 0 },
    ];

    setTypedHeadline('');
    const timers: number[] = [];
    let cumulative = 180;

    frames.forEach((frame) => {
      const id = window.setTimeout(() => {
        setTypedHeadline(frame.text);
        setShowMistakeBackspaceTag(Boolean(frame.bsTag));
      }, cumulative);
      timers.push(id);
      cumulative += frame.delay;
    });

    return () => timers.forEach((id) => window.clearTimeout(id));
  }, []);

  // 2. Hero Live Mini Test using the real TypingEngine
  const miniEngineRef = useRef<TypingEngine | null>(null);
  if (!miniEngineRef.current) {
    miniEngineRef.current = new TypingEngine([MINI_TARGET], {
      category: 'git',
      duration: 60,
      level: 'easy',
    });
  }

  const miniInputRef = useRef<HTMLInputElement | null>(null);
  const [miniTick, setMiniTick] = useState(0);
  const [miniCompleted, setMiniCompleted] = useState(false);

  useEffect(() => {
    // Autofocus on desktop viewports (>= 1024px)
    if (window.innerWidth >= 1024) {
      miniInputRef.current?.focus({ preventScroll: true });
    }
    return () => setIsArenaFocused(false);
  }, [setIsArenaFocused]);

  const restartMiniTest = () => {
    miniEngineRef.current?.reset([MINI_TARGET], {
      category: 'git',
      duration: 60,
      level: 'easy',
    });
    setMiniCompleted(false);
    setMiniTick((n) => n + 1);
    miniInputRef.current?.focus({ preventScroll: true });
  };

  const handleMiniKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const engine = miniEngineRef.current;
    if (!engine) return;

    if (e.key === 'Tab') {
      e.preventDefault();
      restartMiniTest();
      return;
    }

    if (miniCompleted) return;

    const res = engine.handleKeyDown(e.key, performance.now(), {
      ctrlKey: e.ctrlKey,
      metaKey: e.metaKey,
      altKey: e.altKey,
      isComposing: e.nativeEvent.isComposing,
    });

    if (res.consumed) {
      e.preventDefault();
      const snap = engine.getSnapshot(performance.now());
      const currentTyped = snap.typedLines[0] ?? '';
      if (res.lineCommitted || currentTyped === MINI_TARGET) {
        engine.finish(performance.now());
        setMiniCompleted(true);
      }
      setMiniTick((n) => n + 1);
    }
  };

  const miniSnap = miniEngineRef.current.getSnapshot();
  void miniTick;
  const miniTyped = miniSnap.typedLines[0] ?? '';

  // 3. Scroll-driven / interactive 3-step Story section
  const [activeStoryStep, setActiveStoryStep] = useState<0 | 1 | 2>(0);
  const storyStepRefs = [
    useRef<HTMLDivElement | null>(null),
    useRef<HTMLDivElement | null>(null),
    useRef<HTMLDivElement | null>(null),
  ];

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const observers: IntersectionObserver[] = [];

    storyStepRefs.forEach((ref, idx) => {
      if (!ref.current) return;
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveStoryStep(idx as 0 | 1 | 2);
            }
          });
        },
        { threshold: 0.55 }
      );
      obs.observe(ref.current);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  // 4. Bento interactive states
  const [terminalHover, setTerminalHover] = useState(false);
  const [terminalIdx, setTerminalIdx] = useState(0);
  const terminalLines = [
    'git rebase -i HEAD~3',
    'docker compose -f prod.yml up -d',
    "SELECT * FROM events WHERE payload->>'type' = 'click';",
  ];

  useEffect(() => {
    if (terminalHover) return;
    const id = window.setInterval(() => {
      setTerminalIdx((i) => (i + 1) % terminalLines.length);
    }, 2400);
    return () => window.clearInterval(id);
  }, [terminalHover, terminalLines.length]);

  const [hoveredGlyph, setHoveredGlyph] = useState<{
    glyph: string;
    ms: number;
  } | null>(null);

  const [hoveredMiniKey, setHoveredMiniKey] = useState<{
    k: string;
    ms: number;
    err: number;
  } | null>(null);

  const [hoveredTimerPill, setHoveredTimerPill] = useState<number | null>(null);
  const [scrambleActive, setScrambleActive] = useState(false);
  const [tiltTransform, setTiltTransform] = useState('perspective(800px) rotateX(0deg) rotateY(0deg)');

  // 5. Modes hover typewriter effect
  const [hoveredModeSlug, setHoveredModeSlug] = useState<string | null>(null);
  const [modeTypedCount, setModeTypedCount] = useState(0);

  useEffect(() => {
    if (!hoveredModeSlug) {
      setModeTypedCount(0);
      return;
    }
    setModeTypedCount(0);
    const id = window.setInterval(() => {
      setModeTypedCount((c) => c + 1);
    }, 35);
    return () => window.clearInterval(id);
  }, [hoveredModeSlug]);

  // 9. FAQ open index
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const sevenCategories = CATEGORIES.filter((c) => c.slug !== 'weak-keys');

  return (
    <div className="overflow-hidden">
      {/* ============================================================
          SECTION 1: HERO
          ============================================================ */}
      <section className="relative pt-10 pb-20 sm:pt-16 sm:pb-24 border-b border-[var(--line)]">
        {/* Huge, very faint (4% opacity) block-cursor shape bleeding off the right edge */}
        <div
          className="pointer-events-none select-none absolute top-8 right-[-60px] w-[220px] sm:w-[320px] h-[440px] sm:h-[560px] bg-[var(--ink)] opacity-[0.04] rounded-[4px]"
          aria-hidden="true"
        />

        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left column */}
            <div className="lg:col-span-7 space-y-6">
              <div className="mono-label text-[var(--text-muted)]">
                TYPING PRACTICE FOR DEVELOPERS
              </div>

              <h1 className="hero-display text-[var(--ink)] min-h-[1.9em] sm:min-h-[1.95em]">
                {/* Screen readers read full headline once */}
                <span className="sr-only">Hit Backspace Less.</span>
                <span aria-hidden="true">
                  {typedHeadline}
                  {showMistakeBackspaceTag && (
                    <span className="inline-flex items-center px-1.5 py-0.5 ml-1 text-xs font-mono-code bg-[var(--card)] border border-[var(--line)] rounded-[3px] text-[var(--accent-ink)] align-middle">
                      ⌫
                    </span>
                  )}
                  <span className="block-cursor ml-1.5" />
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-[var(--ink)] max-w-xl leading-relaxed">
                Practice git, terminal, Docker, SQL, code and AI prompts. Find the keys that slow you down and fix them.
              </p>

              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <Link
                  to="/practice"
                  className="keycap-accent px-6 py-3.5 text-sm uppercase tracking-wider"
                >
                  Start typing, it's free
                </Link>
                <a
                  href="#how-it-works"
                  className="keycap px-5 py-3.5 text-sm font-medium"
                >
                  See how it works
                </a>
              </div>

              {/* Three mono microfacts */}
              <div className="pt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-mono-code text-[var(--text-muted)]">
                <span>No account</span>
                <span aria-hidden="true">·</span>
                <span>Works offline</span>
                <span aria-hidden="true">·</span>
                <span>Your data stays on your device</span>
              </div>
            </div>

            {/* Right column: LIVE MINI TEST CARD */}
            <div className="lg:col-span-5">
              <div
                onClick={() => miniInputRef.current?.focus()}
                className="paper-card relative p-6 sm:p-7 cursor-text"
              >
                <LotusCornerOrnament position="top-right" />

                <div className="flex items-center justify-between gap-2 pb-4 border-b border-[var(--line)]">
                  <div className="flex items-center gap-2">
                    <span className="mono-label text-[var(--text-muted)]">
                      LIVE MINI TEST
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono-code">
                    <span>
                      WPM{' '}
                      <strong className="text-[var(--ink)] tabular-nums">
                        {miniSnap.status === 'ready' ? 0 : miniSnap.netWpm}
                      </strong>
                    </span>
                    <span>
                      ACC{' '}
                      <strong className="text-[var(--ink)] tabular-nums">
                        {miniSnap.status === 'ready' ? '100%' : `${miniSnap.accuracy}%`}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Hidden input for live mini test */}
                <input
                  ref={miniInputRef}
                  type="text"
                  value=""
                  onChange={() => {}}
                  onKeyDown={handleMiniKeyDown}
                  onFocus={() => setIsArenaFocused(true)}
                  onBlur={() => setIsArenaFocused(false)}
                  onPaste={(e) => e.preventDefault()}
                  aria-label='Live mini typing test: type git commit -m "ship it"'
                  className="sr-only"
                />

                <div className="my-6 p-4 rounded-[6px] border border-[var(--line)] bg-[var(--paper)] font-mono-code text-lg sm:text-xl leading-relaxed select-none">
                  <span className="text-[var(--text-muted)] mr-2.5 select-none">$</span>
                  {MINI_TARGET.split('').map((ch, idx) => {
                    const isTyped = idx < miniTyped.length;
                    const isCorrect = isTyped && miniTyped[idx] === ch;
                    const isCaret = !miniCompleted && idx === miniTyped.length;

                    let cls = 'text-[var(--untyped)]';
                    if (isTyped) {
                      cls = isCorrect
                        ? 'text-[var(--ink)]'
                        : 'text-[var(--error)] underline decoration-2 underline-offset-4';
                    }

                    return (
                      <span
                        key={idx}
                        className={`${cls} ${
                          isCaret
                            ? miniSnap.status === 'ready'
                              ? 'caret-block-blink'
                              : 'bg-[var(--accent)] text-[#1B1A17] rounded-[1px]'
                            : ''
                        }`}
                      >
                        {ch}
                      </span>
                    );
                  })}
                </div>

                {miniCompleted ? (
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-sm font-medium text-[var(--ink)]">
                      Nice. Now try a full 60-second test.
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          restartMiniTest();
                        }}
                        className="keycap px-2.5 py-1.5 text-xs"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                      <Link
                        to="/practice?category=git&time=60&level=medium"
                        onClick={(e) => e.stopPropagation()}
                        className="keycap-accent px-4 py-1.5 text-xs uppercase tracking-wider"
                      >
                        Start 60s test
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2 text-xs font-mono-code text-[var(--text-muted)]">
                    <span>Type the git command above to test your fingers</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        restartMiniTest();
                      }}
                      className="inline-flex items-center gap-1 hover:text-[var(--ink)]"
                    >
                      <kbd className="keycap px-1.5 py-0.5 text-[11px]">Tab</kbd>
                      <span>restart</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 2: MARQUEE OF KEYCAP CHIPS
          ============================================================ */}
      <section
        aria-label="Supported developer syntax and tools"
        className="marquee-container py-5 border-b border-[var(--line)] bg-[var(--card)] overflow-hidden"
      >
        <div className="marquee-track flex items-center gap-4 px-4">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, idx) => (
            <React.Fragment key={`${item}-${idx}`}>
              <span className="keycap px-3 py-1 text-xs font-medium">{item}</span>
              <span
                className="text-[var(--gold)] text-xs select-none"
                aria-hidden="true"
              >
                ◆
              </span>
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* ============================================================
          SECTION 3: THE STORY (3 steps)
          ============================================================ */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-20 sm:py-28">
        <div className="max-w-2xl mb-12">
          <span className="mono-label text-[var(--text-muted)] block">THE PROBLEM</span>
          <h2 className="h2-display mt-2">
            You type symbols all day. Nobody trains them.
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left: 3 Story Steps */}
          <div className="lg:col-span-5 space-y-6">
            {[
              {
                step: '01',
                title: 'Prose tests flatter your WPM',
                desc: 'On standard English words, your fingers stay on home row and cruise at 78 WPM.',
                sample: 'the quick brown fox jumps over the lazy dog',
                wpm: 78,
              },
              {
                step: '02',
                title: 'Real code & flags break your rhythm',
                desc: 'Add pipes, brackets, quotes, and flags—your pinky hesitates, WPM drops to 41, and Backspace takes over.',
                sample: 'find . -name "*.tmp" | xargs -0 rm -f',
                wpm: 41,
              },
              {
                step: '03',
                title: 'Backspace finds these keys and drills them',
                desc: 'Every keystroke logs millisecond latency so adaptive drills target your exact weak symbols.',
                sample: 'Targeted drill: { } | ~ $ - " =',
                wpm: 68,
              },
            ].map((item, idx) => {
              const isActive = activeStoryStep === idx;
              return (
                <div
                  key={item.step}
                  ref={storyStepRefs[idx]}
                  onClick={() => setActiveStoryStep(idx as 0 | 1 | 2)}
                  className={`paper-card p-6 cursor-pointer transition-colors ${
                    isActive
                      ? 'border-[var(--ink)] bg-[var(--card)]'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="mono-label text-[var(--accent-ink)]">
                      STEP {item.step}
                    </span>
                    <span className="keycap px-2.5 py-0.5 text-xs font-semibold tabular-nums">
                      {item.wpm} WPM
                    </span>
                  </div>
                  <h3 className="h3-display">{item.title}</h3>
                  <p className="text-sm text-[var(--text-muted)] mt-2">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Right: Interactive / Scroll-reactive Visualizer Card */}
          <div className="lg:col-span-7 lg:sticky lg:top-24 paper-card p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--line)]">
              <span className="mono-label text-[var(--text-muted)]">
                STEP 0{activeStoryStep + 1} SIMULATION
              </span>
              <div className="flex items-baseline gap-2">
                <span className="mono-label text-[var(--text-muted)]">SPEED</span>
                <span className="font-display font-extrabold text-4xl tabular-nums text-[var(--ink)]">
                  {activeStoryStep === 0 ? 78 : activeStoryStep === 1 ? 41 : 68}
                </span>
                <span className="mono-label text-[var(--text-muted)]">WPM</span>
              </div>
            </div>

            {activeStoryStep === 0 && (
              <div className="space-y-4 py-4">
                <div className="p-5 rounded-[6px] border border-[var(--line)] bg-[var(--paper)] font-mono-code text-xl">
                  the quick brown fox jumps over the lazy dog
                  <span className="block-cursor ml-1" />
                </div>
                <p className="text-xs font-mono-code text-[var(--text-muted)]">
                  0 symbols · 0 Shift chords · Smooth 78 WPM
                </p>
              </div>
            )}

            {activeStoryStep === 1 && (
              <div className="space-y-4 py-4">
                <div className="p-5 rounded-[6px] border border-[var(--line)] bg-[var(--paper)] font-mono-code text-xl leading-relaxed">
                  <span>$ find . </span>
                  <span className="underline decoration-[var(--accent)] decoration-2 underline-offset-4">
                    -
                  </span>
                  <span>name </span>
                  <span className="underline decoration-[var(--accent)] decoration-2 underline-offset-4">
                    "*
                  </span>
                  <span>.tmp</span>
                  <span className="underline decoration-[var(--accent)] decoration-2 underline-offset-4">
                    "
                  </span>
                  <span> </span>
                  <span className="underline decoration-[var(--accent)] decoration-2 underline-offset-4">
                    |
                  </span>
                  <span> xargs </span>
                  <span className="underline decoration-[var(--accent)] decoration-2 underline-offset-4">
                    -0
                  </span>
                  <span> rm </span>
                  <span className="underline decoration-[var(--accent)] decoration-2 underline-offset-4">
                    -f
                  </span>
                  <span className="block-cursor ml-1" />
                </div>
                <p className="text-xs font-mono-code text-[var(--accent-ink)]">
                  Vermilion underlines mark 240ms+ symbol hesitations · WPM drops to 41
                </p>
              </div>
            )}

            {activeStoryStep === 2 && (
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-7 gap-2 font-mono-code text-center">
                  {[
                    { k: '{', slow: true },
                    { k: '}', slow: true },
                    { k: '|', slow: true },
                    { k: '~', slow: true },
                    { k: '$', slow: false },
                    { k: '-', slow: true },
                    { k: '=', slow: false },
                    { k: '[', slow: false },
                    { k: ']', slow: false },
                    { k: '(', slow: false },
                    { k: ')', slow: false },
                    { k: '!', slow: true },
                    { k: '&', slow: true },
                    { k: '"', slow: true },
                  ].map((item) => (
                    <div
                      key={item.k}
                      className={`keycap py-2.5 text-sm font-semibold ${
                        item.slow
                          ? 'bg-[var(--accent)] text-[#1B1A17] border-[var(--ink)]'
                          : ''
                      }`}
                    >
                      {item.k}
                    </div>
                  ))}
                </div>
                <p className="text-sm font-medium text-[var(--ink)] pt-2">
                  Backspace finds these keys and drills them.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 4: ASYMMETRIC BENTO FEATURES (8 cards)
          ============================================================ */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16 border-t border-[var(--line)]">
        <div className="max-w-2xl mb-12">
          <span className="mono-label text-[var(--text-muted)] block">INSTRUMENTATION</span>
          <h2 className="h2-display mt-2">
            Crafted for terminal and editor fluency.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* a. Real commands, not prose (7 cols) */}
          <div
            onMouseEnter={() => setTerminalHover(true)}
            onMouseLeave={() => setTerminalHover(false)}
            className="md:col-span-7 paper-card p-6 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="mono-label text-[var(--text-muted)]">
                  01 · REAL COMMANDS, NOT PROSE
                </span>
                <span className="text-xs font-mono-code text-[var(--text-muted)]">
                  {terminalHover ? 'Paused · Symbols highlighted' : 'Hover to inspect symbols'}
                </span>
              </div>
              <h3 className="h3-display mt-2">Real commands, not prose</h3>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Every line in our bank is valid Git, Bash, Docker, PostgreSQL, TypeScript, Python, or prompt engineering syntax.
              </p>
            </div>

            <div className="mt-6 p-4 rounded-[6px] border border-[var(--line)] bg-[var(--paper)] font-mono-code text-base">
              <span className="text-[var(--text-muted)] mr-2">$</span>
              {terminalLines[terminalIdx].split('').map((ch, i) => {
                const isSym = /[^a-zA-Z0-9\s]/.test(ch);
                return (
                  <span
                    key={i}
                    className={
                      terminalHover && isSym
                        ? 'bg-[var(--accent)] text-[#1B1A17] px-0.5 rounded-[2px] font-semibold'
                        : 'text-[var(--ink)]'
                    }
                  >
                    {ch}
                  </span>
                );
              })}
            </div>
          </div>

          {/* b. Symbol drills (5 cols) */}
          <div className="md:col-span-5 paper-card p-6 flex flex-col justify-between">
            <div>
              <span className="mono-label text-[var(--text-muted)] block">
                02 · DEDICATED DRILL MODE
              </span>
              <h3 className="h3-display mt-2">Symbol drills</h3>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Train brackets, fat arrows, strict inequality, bitwise operators, and shell expansions directly.
              </p>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex flex-wrap gap-2">
                {[
                  { g: '{ }', ms: 192 },
                  { g: '=>', ms: 178 },
                  { g: '!==', ms: 224 },
                  { g: '|', ms: 205 },
                  { g: '~', ms: 240 },
                ].map((item) => (
                  <button
                    key={item.g}
                    type="button"
                    onMouseEnter={() =>
                      setHoveredGlyph({ glyph: item.g, ms: item.ms })
                    }
                    onMouseLeave={() => setHoveredGlyph(null)}
                    className="keycap px-3.5 py-2.5 text-base font-bold hover:translate-y-[2px] hover:border-b"
                  >
                    {item.g}
                  </button>
                ))}
              </div>
              <div className="text-xs font-mono-code text-[var(--text-muted)] min-h-[18px]">
                {hoveredGlyph
                  ? `Glyph "${hoveredGlyph.glyph}" · sample latency ${hoveredGlyph.ms} ms`
                  : 'Hover a keycap glyph to test tactile response'}
              </div>
            </div>
          </div>

          {/* c. Slow-key heatmap (5 cols) */}
          <div className="md:col-span-5 paper-card p-6 flex flex-col justify-between">
            <div>
              <span className="mono-label text-[var(--text-muted)] block">
                03 · PER-KEY ANALYTICS
              </span>
              <h3 className="h3-display mt-2">Slow-key heatmap</h3>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Pinpoint the exact keys where your fingers hesitate or slip.
              </p>
            </div>

            <div className="mt-5 space-y-2.5">
              <div className="grid grid-cols-5 gap-2 font-mono-code">
                {[
                  { k: '[', ms: 168, err: 4 },
                  { k: ']', ms: 184, err: 6 },
                  { k: '{', ms: 214, err: 9 },
                  { k: '}', ms: 228, err: 11 },
                  { k: '|', ms: 202, err: 7 },
                ].map((item) => (
                  <button
                    key={item.k}
                    type="button"
                    onMouseEnter={() => setHoveredMiniKey(item)}
                    onMouseLeave={() => setHoveredMiniKey(null)}
                    style={{
                      backgroundColor:
                        item.ms > 200
                          ? 'color-mix(in srgb, var(--accent) 45%, var(--card))'
                          : 'color-mix(in srgb, var(--accent) 22%, var(--card))',
                    }}
                    className="keycap py-2 text-sm font-semibold"
                  >
                    {item.k}
                  </button>
                ))}
              </div>
              <div className="text-xs font-mono-code text-[var(--ink)] min-h-[18px]">
                {hoveredMiniKey
                  ? `Key "${hoveredMiniKey.k}": avg ${hoveredMiniKey.ms} ms, ${hoveredMiniKey.err}% errors`
                  : 'avg 214 ms, 9% errors (hover keys above)'}
              </div>
            </div>
          </div>

          {/* d. 30 / 60 / 120 / 300 seconds (4 cols) */}
          <div className="md:col-span-4 paper-card p-6 flex flex-col justify-between">
            <div>
              <span className="mono-label text-[var(--text-muted)] block">
                04 · PACED SESSIONS
              </span>
              <h3 className="h3-display mt-2">30 / 60 / 120 / 300 seconds</h3>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Quick warmups or five-minute endurance sprints.
              </p>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              {[30, 60, 120, 300].map((sec) => {
                const isHov = hoveredTimerPill === sec;
                return (
                  <button
                    key={sec}
                    type="button"
                    onMouseEnter={() => setHoveredTimerPill(sec)}
                    onMouseLeave={() => setHoveredTimerPill(null)}
                    className="keycap px-3 py-2 text-xs font-semibold"
                  >
                    <svg className="w-3.5 h-3.5 -rotate-90" viewBox="0 0 16 16">
                      <circle
                        cx="8"
                        cy="8"
                        r="6"
                        fill="none"
                        stroke="var(--line)"
                        strokeWidth="2"
                      />
                      <circle
                        cx="8"
                        cy="8"
                        r="6"
                        fill="none"
                        stroke="var(--accent)"
                        strokeWidth="2"
                        strokeDasharray="37.7"
                        strokeDashoffset={isHov ? '28' : '0'}
                        className="transition-all duration-500"
                      />
                    </svg>
                    <span>{sec}s</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* e. Easy, Medium, Hard (3 cols) */}
          <div
            onMouseEnter={() => setScrambleActive(true)}
            onMouseLeave={() => setScrambleActive(false)}
            className="md:col-span-3 paper-card p-6 flex flex-col justify-between"
          >
            <div>
              <span className="mono-label text-[var(--text-muted)] block">
                05 · COMPLEXITY
              </span>
              <h3 className="h3-display mt-2">Easy, Medium, Hard</h3>
            </div>

            <div className="mt-4 space-y-2 text-xs font-mono-code">
              <div className="p-2 border border-[var(--line)] rounded-[3px] bg-[var(--paper)] truncate">
                {scrambleActive ? 'git status' : 'git status'}
              </div>
              <div className="p-2 border border-[var(--line)] rounded-[3px] bg-[var(--paper)] truncate">
                {scrambleActive
                  ? 'git commit --amend'
                  : 'git diff --staged'}
              </div>
              <div className="p-2 border border-[var(--ink)] rounded-[3px] bg-[var(--paper)] truncate font-semibold">
                {scrambleActive
                  ? 'git rebase -i HEAD~3'
                  : 'git push --force-with-lease'}
              </div>
            </div>
          </div>

          {/* f. Offline-first and private (4 cols) */}
          <div className="md:col-span-4 paper-card p-6 flex flex-col justify-between">
            <div>
              <span className="mono-label text-[var(--text-muted)] block">
                06 · ZERO SERVERS
              </span>
              <h3 className="h3-display mt-2">Offline-first and private</h3>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Everything stays on your device.
              </p>
            </div>

            {/* Laptop outline made of CSS lines + "no wifi" mono label */}
            <div className="mt-6 flex items-center justify-between gap-4">
              <div className="flex flex-col items-center" aria-hidden="true">
                <div className="w-24 h-14 border-2 border-[var(--ink)] rounded-t-[4px] flex items-center justify-center bg-[var(--paper)]">
                  <span className="font-mono-code text-[10px] text-[var(--accent-ink)] font-semibold">
                    LOCAL ONLY
                  </span>
                </div>
                <div className="w-32 h-2 border-2 border-t-0 border-[var(--ink)] rounded-b-[3px]" />
              </div>
              <span className="keycap px-2.5 py-1 text-xs font-mono-code">
                no wifi
              </span>
            </div>
          </div>

          {/* g. Shareable result cards (4 cols, tilts toward cursor max 4 deg) */}
          <div
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = (e.clientX - rect.left) / rect.width - 0.5;
              const y = (e.clientY - rect.top) / rect.height - 0.5;
              const rotY = (x * 8).toFixed(2);
              const rotX = (-y * 8).toFixed(2);
              setTiltTransform(
                `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg)`
              );
            }}
            onMouseLeave={() =>
              setTiltTransform('perspective(800px) rotateX(0deg) rotateY(0deg)')
            }
            className="md:col-span-4 paper-card p-6 flex flex-col justify-between"
          >
            <div>
              <span className="mono-label text-[var(--text-muted)] block">
                07 · CANVAS EXPORT
              </span>
              <h3 className="h3-display mt-2">Shareable result cards</h3>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                1200×630 PNG rendered locally on paper with the gold ornament band.
              </p>
            </div>

            <div
              style={{ transform: tiltTransform }}
              className="mt-5 p-3.5 rounded-[6px] border border-[var(--ink)] bg-[var(--paper)] transition-transform duration-100 ease-out"
            >
              <div className="flex items-center justify-between text-[11px] font-mono-code text-[var(--text-muted)]">
                <span>← Backspace</span>
                <span>GIT · 60S</span>
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="font-display font-extrabold text-3xl">84 WPM</span>
                <span className="font-mono-code text-xs text-[var(--accent-ink)] font-semibold">
                  98% ACC
                </span>
              </div>
            </div>
          </div>

          {/* h. Streaks, levels and badges (4 cols) */}
          <div className="md:col-span-4 paper-card p-6 flex flex-col justify-between">
            <div>
              <span className="mono-label text-[var(--text-muted)] block">
                08 · PROGRESSION
              </span>
              <h3 className="h3-display mt-2">Streaks, levels and badges</h3>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Climb the engineering ladder from Intern to Principal.
              </p>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-1.5 font-mono-code text-xs">
              {['Intern', 'Junior', 'Mid', 'Senior', 'Staff', 'Principal'].map(
                (t, idx) => (
                  <span
                    key={t}
                    className={`keycap px-2 py-1 text-[11px] ${
                      idx === 5
                        ? 'bg-[var(--accent)] text-[#1B1A17] border-[var(--ink)] font-semibold'
                        : ''
                    }`}
                  >
                    {t}
                  </span>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 5: MODES (7 category cards)
          ============================================================ */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16 border-t border-[var(--line)]">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
          <div>
            <span className="mono-label text-[var(--text-muted)] block">PRACTICE TRACKS</span>
            <h2 className="h2-display mt-2">Seven developer modes.</h2>
          </div>
          <Link to="/practice" className="keycap px-4 py-2 text-xs font-medium">
            Open full arena
          </Link>
        </div>

        <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible">
          {sevenCategories.map((cat) => {
            const count = getCategoryLineCount(cat.slug);
            const isHovered = hoveredModeSlug === cat.slug;
            const displayedSample = isHovered
              ? cat.sampleLine.slice(0, modeTypedCount)
              : cat.sampleLine;

            return (
              <Link
                key={cat.slug}
                to={`/practice?category=${cat.slug}`}
                onMouseEnter={() => setHoveredModeSlug(cat.slug)}
                onMouseLeave={() => setHoveredModeSlug(null)}
                className="snap-start shrink-0 w-[280px] sm:w-auto paper-card p-6 flex flex-col justify-between hover:border-[var(--ink)] transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="keycap px-2.5 py-1 text-xs font-semibold">
                      {cat.keycapLabel}
                    </span>
                    <span className="mono-label text-[var(--text-muted)]">
                      {count} LINES
                    </span>
                  </div>
                  <h3 className="h3-display">{cat.name}</h3>
                  <p className="text-sm text-[var(--text-muted)] mt-1">
                    {cat.description}
                  </p>
                </div>

                <div className="mt-6 p-3 rounded-[4px] border border-[var(--line)] bg-[var(--paper)] font-mono-code text-xs text-[var(--ink)] truncate">
                  {cat.promptPrefix && (
                    <span className="text-[var(--text-muted)] mr-1.5">
                      {cat.promptPrefix}
                    </span>
                  )}
                  <span>{displayedSample}</span>
                  {isHovered && <span className="block-cursor ml-0.5" />}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ============================================================
          SECTION 6: HOW IT WORKS (1, 2, 3)
          ============================================================ */}
      <section
        id="how-it-works"
        className="max-w-[1200px] mx-auto px-4 sm:px-6 py-20 border-t border-[var(--line)]"
      >
        <div className="max-w-2xl mb-12">
          <span className="mono-label text-[var(--text-muted)] block">THREE STEPS</span>
          <h2 className="h2-display mt-2">How it works.</h2>
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Connecting horizontal line on desktop */}
          <div
            className="hidden md:block absolute top-8 left-[16%] right-[16%] h-[1px] bg-[var(--line)]"
            aria-hidden="true"
          />

          {[
            {
              num: '1',
              title: 'Pick a mode',
              body: 'Choose Git, Terminal, Docker, SQL, Code, AI Prompts, or pure Symbols, and set your timer from 30 to 300 seconds.',
            },
            {
              num: '2',
              title: 'Type',
              body: 'Commit each line with Enter. The engine logs per-character millisecond latency and error rates without ever blocking input.',
            },
            {
              num: '3',
              title: 'Fix your slow keys',
              body: 'Inspect your QWERTY heatmap after the test and launch adaptive drills built from your slowest characters.',
            },
          ].map((step) => (
            <div key={step.num} className="relative paper-card p-6 space-y-4">
              <div className="keycap-accent w-12 h-12 text-xl font-display font-extrabold">
                {step.num}
              </div>
              <h3 className="h3-display">{step.title}</h3>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================
          SECTION 7: THE LADDER
          ============================================================ */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-20 border-t border-[var(--line)]">
        <div className="max-w-2xl mb-12">
          <span className="mono-label text-[var(--text-muted)] block">RANK PROGRESSION</span>
          <h2 className="h2-display mt-2">The developer ladder.</h2>
          <p className="text-sm text-[var(--text-muted)] mt-2">
            Every completed session awards XP weighted by your Backspace Score: WPM multiplied by accuracy squared.
          </p>
        </div>

        <div className="relative pl-6 sm:pl-10 border-l-2 border-[var(--accent)] space-y-6">
          {LADDER_TIERS.map((tier) => (
            <div
              key={tier.title}
              className="relative paper-card p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4"
            >
              <span
                className="absolute -left-[31px] sm:-left-[47px] w-4 h-4 rounded-[3px] bg-[var(--accent)] border border-[var(--ink)]"
                aria-hidden="true"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="keycap px-2 py-0.5 text-xs font-semibold">
                    {tier.badgeLabel}
                  </span>
                  <h3 className="h3-display">{tier.title}</h3>
                  <span className="text-xs font-mono-code text-[var(--text-muted)]">
                    ({tier.levels})
                  </span>
                </div>
                <p className="text-sm text-[var(--text-muted)]">
                  {tier.description}
                </p>
              </div>

              <div className="flex items-center gap-3 font-mono-code text-xs">
                <span className="keycap px-3 py-1.5">
                  Target: <strong>{tier.targetWpm}+ WPM</strong>
                </span>
                <span className="keycap px-3 py-1.5">
                  <strong>{tier.targetAccuracy}%+</strong> ACC
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================
          SECTION 8: ORNAMENT BAND DIVIDER + MADE IN INDIA STATEMENT
          ============================================================ */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <OrnamentBand />
      </div>

      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16">
        <div className="paper-card relative p-8 sm:p-10 max-w-3xl mx-auto text-center space-y-3">
          <LotusCornerOrnament position="top-left" />
          <LotusCornerOrnament position="bottom-right" />
          <div
            className="font-devanagari text-2xl text-[var(--gold)] font-bold"
            lang="hi"
          >
            बैकस्पेस
          </div>
          <h2 className="h3-display">
            Designed and built in India for developers everywhere.
          </h2>
          <p className="text-base text-[var(--text-muted)]">
            Developers type faster when the practice looks like their work.
          </p>
        </div>
      </section>

      {/* ============================================================
          SECTION 9: FAQ ACCORDION
          ============================================================ */}
      <section className="max-w-[880px] mx-auto px-4 sm:px-6 py-16 border-t border-[var(--line)]">
        <div className="mb-10">
          <span className="mono-label text-[var(--text-muted)] block">COMMON QUESTIONS</span>
          <h2 className="h2-display mt-2">Frequently asked questions.</h2>
        </div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={item.q} className="paper-card overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 font-display font-bold text-lg text-[var(--ink)]"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18 }}
                    >
                      <div className="px-6 pb-5 pt-1 text-sm text-[var(--text-muted)] border-t border-[var(--line)]">
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* ============================================================
          SECTION 10: FINAL CTA
          ============================================================ */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-20 border-t border-[var(--line)] text-center space-y-8">
        <h2 className="hero-display text-[var(--ink)]">
          Hit Backspace Less.
          <span className="block-cursor ml-2" aria-hidden="true" />
        </h2>

        <div>
          <Link
            to="/practice"
            className="keycap-accent px-8 py-4 text-sm uppercase tracking-wider"
          >
            Start typing
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-mono-code text-[var(--text-muted)]">
          <span>No account</span>
          <span aria-hidden="true">·</span>
          <span>Works offline</span>
          <span aria-hidden="true">·</span>
          <span>Your data stays on your device</span>
        </div>
      </section>
    </div>
  );
};
