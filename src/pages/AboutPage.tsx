import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { Logo } from '../components/Logo';
import { LotusCornerOrnament, OrnamentBand } from '../components/OrnamentBand';
import { GITHUB_URL, useDocumentMeta } from '../hooks/useDocumentMeta';

export const AboutPage: React.FC = () => {
  useDocumentMeta(
    'About',
    'Built for the keys developers actually press. Learn why Backspace exists, how scoring works, and what is on the roadmap.'
  );

  return (
    <div className="max-w-[880px] mx-auto px-4 sm:px-6 py-12 space-y-16">
      {/* Editorial Hero */}
      <header className="space-y-4 border-b border-[var(--line)] pb-10">
        <span className="mono-label text-[var(--text-muted)] block">MANIFESTO & FORMULA</span>
        <h1 className="h2-display">
          Built for the keys developers actually press.
        </h1>
        <p className="text-lg text-[var(--text-muted)] leading-relaxed">
          Typing practice for the characters developers actually type.
        </p>
      </header>

      {/* 1. Why Backspace */}
      <section className="space-y-4">
        <span className="mono-label text-[var(--accent-ink)] block">01 · WHY BACKSPACE</span>
        <h2 className="h3-display">Prose does not train your pinky finger.</h2>
        <div className="space-y-4 text-[var(--ink)] leading-relaxed">
          <p>
            Most typing tests measure how fast you can type 200 common English words in lowercase without punctuation. That feels fast, but it has very little to do with a developer's day.
          </p>
          <p>
            In a terminal or code editor, every line is dense with flags, pipes, curly braces, fat arrows, SQL clauses, and quotes: <code className="font-mono-code text-sm px-1.5 py-0.5 bg-[var(--card)] border border-[var(--line)] rounded-[3px]">{'{ } [ ] ( ) => !== && || | ~ $ @ # \\ / --'}</code>. Nobody trains those reaches, so your right pinky hesitates and hits Backspace over and over.
          </p>
        </div>
      </section>

      {/* 2. What makes it different */}
      <section className="space-y-5">
        <span className="mono-label text-[var(--accent-ink)] block">02 · WHAT MAKES IT DIFFERENT</span>
        <h2 className="h3-display">Five deliberate choices.</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              title: 'Symbols first',
              body: 'A dedicated Symbols mode plus real syntax across Git, Terminal, Docker, PostgreSQL, JS/TS, Python, and AI Prompts.',
            },
            {
              title: 'Real commands',
              body: 'Every line is syntactically valid and practical—no random word salads or invented CLI flags.',
            },
            {
              title: 'Slow-key analytics',
              body: 'Millisecond latency and error rate are tracked per character so you can see your slowest keys on a full QWERTY heatmap.',
            },
            {
              title: 'Offline & private',
              body: 'No account in v1. Everything runs in your browser and stays in local storage on your device.',
            },
          ].map((card) => (
            <div key={card.title} className="paper-card p-5 space-y-2">
              <h3 className="font-display font-bold text-lg">{card.title}</h3>
              <p className="text-sm text-[var(--text-muted)]">{card.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. The Name */}
      <section className="paper-card relative p-6 sm:p-8 space-y-3">
        <LotusCornerOrnament position="top-right" />
        <span className="mono-label text-[var(--text-muted)] block">03 · THE NAME</span>
        <h2 className="h3-display">Why it is called Backspace.</h2>
        <p className="text-[var(--ink)] leading-relaxed">
          Backspace is the key developers press most when typing symbols and flags at speed. Our goal is simple: train the exact reaches that trip you up so you press it less.
        </p>
      </section>

      {/* 4. Made in India */}
      <section className="space-y-6">
        <OrnamentBand />
        <div className="paper-card relative p-6 sm:p-8 space-y-3">
          <LotusCornerOrnament position="bottom-right" />
          <div className="flex flex-col items-start gap-1">
            <Logo variant="full" />
            <span className="font-devanagari text-lg text-[var(--gold)] font-bold" lang="hi">
              बैकस्पेस
            </span>
          </div>
          <h2 className="h3-display pt-1">Made in India</h2>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            Designed and built in India for developers everywhere. Inspired by warm tactile print manuals and sharp terminal typography, built to work reliably on any connection—online or offline.
          </p>
        </div>
      </section>

      {/* 5. How scoring works */}
      <section className="space-y-4">
        <span className="mono-label text-[var(--accent-ink)] block">05 · HOW SCORING WORKS</span>
        <h2 className="h3-display">Transparent math, no black boxes.</h2>
        <div className="paper-card p-6 space-y-4 font-mono-code text-xs sm:text-sm">
          <div className="pb-3 border-b border-[var(--line)]">
            <strong className="text-[var(--ink)] block">Net WPM</strong>
            <span className="text-[var(--text-muted)]">
              (correctChars / 5) / minutes — where a completed line's Enter counts as 1 correct character.
            </span>
          </div>
          <div className="pb-3 border-b border-[var(--line)]">
            <strong className="text-[var(--ink)] block">Raw WPM</strong>
            <span className="text-[var(--text-muted)]">
              (all typed characters / 5) / minutes elapsed since the first keystroke.
            </span>
          </div>
          <div className="pb-3 border-b border-[var(--line)]">
            <strong className="text-[var(--ink)] block">Accuracy %</strong>
            <span className="text-[var(--text-muted)]">
              (correct keystrokes / total keystrokes) × 100. Corrected mistakes still count as errors.
            </span>
          </div>
          <div className="pb-3 border-b border-[var(--line)]">
            <strong className="text-[var(--ink)] block">Consistency %</strong>
            <span className="text-[var(--text-muted)]">
              100 − coefficient of variation of per-second WPM, clamped between 0 and 100.
            </span>
          </div>
          <div className="pb-3 border-b border-[var(--line)]">
            <strong className="text-[var(--ink)] block">Backspace Score</strong>
            <span className="text-[var(--text-muted)]">
              round(netWPM × (accuracy / 100)²) — rewards clean accuracy alongside raw speed.
            </span>
          </div>
          <div>
            <strong className="text-[var(--ink)] block">XP & Developer Level</strong>
            <span className="text-[var(--text-muted)]">
              XP per completed test = round(backspaceScore / 2) + 10. Level = floor(sqrt(XP / 50)) + 1.
            </span>
          </div>
        </div>
      </section>

      {/* 6. Roadmap */}
      <section className="space-y-5">
        <span className="mono-label text-[var(--accent-ink)] block">06 · ROADMAP</span>
        <h2 className="h3-display">Where we are going next.</h2>
        <div className="pl-6 border-l-2 border-[var(--line)] space-y-6">
          <div className="relative paper-card p-5">
            <span className="mono-label text-[var(--accent-ink)]">NOW · V1.0</span>
            <h3 className="font-display font-bold text-lg mt-1">
              Offline-first core engine & per-key diagnostics
            </h3>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Seven developer categories, adaptive weak-key mode, QWERTY heatmaps, local progress history, and canvas share cards.
            </p>
          </div>

          <div className="relative paper-card p-5">
            <span className="mono-label text-[var(--text-muted)]">NEXT</span>
            <h3 className="font-display font-bold text-lg mt-1">
              GitHub login, synced history, and global leaderboards
            </h3>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Opt-in cloud sync across machines and accuracy-weighted leaderboards by category and duration.
            </p>
          </div>

          <div className="relative paper-card p-5">
            <span className="mono-label text-[var(--text-muted)]">LATER</span>
            <h3 className="font-display font-bold text-lg mt-1">
              Shortcut trainers, Vim motions, and a terminal CLI edition
            </h3>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Dedicated drills for Vim motions, IDE keybindings, and an installable TUI package you can run directly in your shell.
            </p>
          </div>
        </div>
      </section>

      {/* Footer CTAs */}
      <section className="pt-6 border-t border-[var(--line)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/contact" className="keycap-accent px-5 py-2.5 text-xs uppercase tracking-wider">
            Contact us
          </Link>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="keycap px-4 py-2.5 text-xs font-medium"
          >
            <span>GitHub</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
        <Link to="/practice" className="keycap px-4 py-2.5 text-xs font-medium">
          Back to Practice
        </Link>
      </section>
    </div>
  );
};
