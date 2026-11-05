import React from 'react';
import { Link } from 'react-router-dom';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

interface ChangelogEntry {
  version: string;
  title: string;
  date: string;
  status: 'shipped' | 'planned';
  items: string[];
}

const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  {
    version: 'v1.0.0',
    title: 'First release',
    date: 'November 5, 2026',
    status: 'shipped',
    items: [
      'Zero-latency plain TypeScript typing engine with memoised 4-line viewport and instant caret positioning.',
      'Seven developer modes: Git, Terminal, Docker, PostgreSQL, Code (JavaScript/TypeScript & Python), AI Prompts, and pure Symbols.',
      'Per-key millisecond latency and error rate tracking across a full on-screen QWERTY heatmap.',
      'Adaptive "My weak keys" mode that weights all command banks by your slowest and most error-prone characters.',
      '1200×630 Canvas shareable result card on warm paper with the gold ornament band.',
      '26-week practice calendar, personal bests matrix, XP developer ladder (Intern to Principal), and 11 milestone badges.',
      '100% offline-first storage under the backspace:v1: localStorage namespace with JSON export, import, and reset.',
    ],
  },
  {
    version: 'Coming next',
    title: 'v1.1 & v1.2 planned items',
    date: 'In development',
    status: 'planned',
    items: [
      'Global accuracy-weighted leaderboards by category and duration.',
      'Opt-in GitHub authentication and encrypted cross-device history sync.',
      'Bigram (two-character sequence) latency drills for awkward symbol chords like =>, !==, and |.',
      'Self-hosted font subsetting and a standalone terminal (TUI) package.',
    ],
  },
];

export const ChangelogPage: React.FC = () => {
  useDocumentMeta('Changelog', 'Release history and upcoming features for Backspace.');

  return (
    <div className="max-w-[880px] mx-auto px-4 sm:px-6 py-12 space-y-10">
      <div className="border-b border-[var(--line)] pb-6">
        <span className="mono-label text-[var(--text-muted)] block">RELEASE LOG</span>
        <h1 className="h2-display mt-1">Changelog</h1>
      </div>

      <div className="relative pl-6 sm:pl-10 border-l-2 border-[var(--line)] space-y-10">
        {CHANGELOG_ENTRIES.map((entry) => (
          <article key={entry.version} className="relative paper-card p-6 sm:p-8 space-y-4">
            <span
              className={`absolute -left-[31px] sm:-left-[47px] w-4 h-4 rounded-[3px] border border-[var(--ink)] ${
                entry.status === 'shipped' ? 'bg-[var(--accent)]' : 'bg-[var(--card)]'
              }`}
              aria-hidden="true"
            />
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--line)]">
              <div className="flex items-center gap-3">
                <span
                  className={
                    entry.status === 'shipped'
                      ? 'keycap-accent px-2.5 py-0.5 text-xs'
                      : 'keycap px-2.5 py-0.5 text-xs text-[var(--text-muted)]'
                  }
                >
                  {entry.version}
                </span>
                <h2 className="h3-display">{entry.title}</h2>
              </div>
              <span className="mono-label text-[var(--text-muted)]">{entry.date}</span>
            </div>

            <ul className="space-y-2.5 text-sm text-[var(--ink)]">
              {entry.items.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="font-mono-code text-[var(--accent-ink)] mt-0.5 select-none">
                    ·
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <div className="pt-4">
        <Link to="/practice" className="keycap-accent px-5 py-2.5 text-xs uppercase tracking-wider">
          Start typing
        </Link>
      </div>
    </div>
  );
};
