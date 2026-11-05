import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CATEGORIES } from '../data/content';
import { getNotifyEmail, saveNotifyEmail } from '../engine/storage';
import { OrnamentBand } from '../components/OrnamentBand';
import { useApp } from '../context/AppContext';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

const SAMPLE_ROWS = [
  { rank: 1, handle: 'arjun_k', category: 'Git', duration: '60s', wpm: 112, acc: 99, score: 110 },
  { rank: 2, handle: 'meera_sh', category: 'Symbols', duration: '60s', wpm: 98, acc: 98, score: 94 },
  { rank: 3, handle: 'dev_rishi', category: 'Terminal', duration: '60s', wpm: 95, acc: 97, score: 89 },
  { rank: 4, handle: 'priya_ts', category: 'Code (TS)', duration: '60s', wpm: 91, acc: 97, score: 86 },
  { rank: 5, handle: 'kabir_sql', category: 'SQL', duration: '60s', wpm: 88, acc: 96, score: 81 },
];

export const LeaderboardPage: React.FC = () => {
  useDocumentMeta(
    'Leaderboard',
    'Leaderboards are coming to Backspace. Compete by category and duration with accuracy-weighted scores.'
  );

  const { results } = useApp();
  const [email, setEmail] = useState(() => getNotifyEmail());
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const personalTop10 = useMemo(() => {
    return [...results]
      .sort((a, b) => b.backspaceScore - a.backspaceScore || b.netWpm - a.netWpm)
      .slice(0, 10);
  }, [results]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Enter a valid email address.');
      setSaved(false);
      return;
    }
    setError(null);
    saveNotifyEmail(trimmed);
    setSaved(true);
  };

  return (
    <div className="max-w-[1040px] mx-auto px-4 sm:px-6 py-10 space-y-12">
      <OrnamentBand />

      {/* Header + Notify-me form */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-4">
          <span className="mono-label text-[var(--accent-ink)] block">COMING SOON</span>
          <h1 className="h2-display">Leaderboards are coming.</h1>
          <p className="text-lg text-[var(--text-muted)] max-w-xl">
            Compete by category and duration, with accuracy-weighted scores.
          </p>
        </div>

        <div className="lg:col-span-5 paper-card p-6 space-y-4">
          <h2 className="h3-display">Get notified when global ranks launch</h2>
          <p className="text-xs font-mono-code text-[var(--text-muted)]">
            Stored locally in your browser until opt-in accounts ship.
          </p>

          <form onSubmit={handleSubmit} noValidate className="space-y-3">
            <div>
              <label htmlFor="notify-email" className="mono-label text-[var(--ink)] block mb-1.5">
                Email address
              </label>
              <input
                id="notify-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setSaved(false);
                }}
                placeholder="you@domain.com"
                className="w-full px-3.5 py-2 border border-[var(--line)] rounded-[4px] bg-[var(--paper)] font-mono-code text-sm text-[var(--ink)]"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'notify-email-error' : undefined}
              />
              {error && (
                <p
                  id="notify-email-error"
                  role="alert"
                  className="mt-1.5 text-xs font-mono-code text-[var(--error)]"
                >
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="keycap-accent w-full py-2.5 text-xs uppercase tracking-wider justify-center"
            >
              Notify me
            </button>

            {saved && (
              <p
                role="status"
                className="text-xs font-mono-code text-[var(--success)] pt-1"
              >
                Saved on this device. We will wire this up soon.
              </p>
            )}
          </form>
        </div>
      </section>

      {/* REAL LOCAL-ONLY PERSONAL TOP 10 */}
      <section className="paper-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div>
            <span className="mono-label text-[var(--text-muted)] block">THIS DEVICE</span>
            <h2 className="h3-display mt-0.5">Your personal top 10</h2>
          </div>
          <Link to="/practice" className="keycap px-4 py-1.5 text-xs font-medium">
            Set a new record
          </Link>
        </div>

        {personalTop10.length === 0 ? (
          <div className="py-8 text-center space-y-3 border border-dashed border-[var(--line)] rounded-[6px]">
            <p className="text-sm text-[var(--text-muted)]">
              No saved tests on this device yet. Finish a test to rank your top 10 sessions.
            </p>
            <Link
              to="/practice"
              className="keycap-accent px-4 py-2 text-xs uppercase tracking-wider"
            >
              Start typing
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--line)] text-xs font-mono-code text-[var(--text-muted)]">
                  <th className="py-3 pr-4">RANK</th>
                  <th className="py-3 px-4">DATE</th>
                  <th className="py-3 px-4">CATEGORY</th>
                  <th className="py-3 px-4">DURATION</th>
                  <th className="py-3 px-4 text-right">WPM</th>
                  <th className="py-3 px-4 text-right">ACCURACY</th>
                  <th className="py-3 pl-4 text-right">BACKSPACE SCORE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)] text-sm font-mono-code">
                {personalTop10.map((r, idx) => {
                  const catName =
                    CATEGORIES.find((c) => c.slug === r.category)?.name ?? r.category;
                  return (
                    <tr key={r.id}>
                      <td className="py-3 pr-4 font-semibold tabular-nums">
                        #{idx + 1}
                      </td>
                      <td className="py-3 px-4 text-xs text-[var(--text-muted)] tabular-nums">
                        {r.dateIso}
                      </td>
                      <td className="py-3 px-4 font-sans-body font-medium text-[var(--ink)]">
                        {catName}{' '}
                        <span className="text-xs font-mono-code text-[var(--text-muted)] capitalize">
                          ({r.level})
                        </span>
                      </td>
                      <td className="py-3 px-4 tabular-nums">{r.duration}s</td>
                      <td className="py-3 px-4 text-right font-semibold tabular-nums">
                        {r.netWpm}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums">
                        {r.accuracy}%
                      </td>
                      <td className="py-3 pl-4 text-right font-semibold text-[var(--accent-ink)] tabular-nums">
                        {r.backspaceScore}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* PREVIEW OF FUTURE GLOBAL UI WITH DIM ROWS CLEARLY LABELLED "SAMPLE" */}
      <section className="paper-card p-6 opacity-75">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div>
            <span className="mono-label text-[var(--text-muted)] block">
              FUTURE GLOBAL BOARD PREVIEW
            </span>
            <h2 className="h3-display mt-0.5">Global leaderboard preview</h2>
          </div>
          <span className="keycap px-3 py-1 text-xs font-mono-code font-semibold">
            SAMPLE PREVIEW
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--line)] text-xs font-mono-code text-[var(--text-muted)]">
                <th className="py-3 pr-4">RANK</th>
                <th className="py-3 px-4">DEVELOPER</th>
                <th className="py-3 px-4">MODE</th>
                <th className="py-3 px-4 text-right">WPM</th>
                <th className="py-3 px-4 text-right">ACCURACY</th>
                <th className="py-3 pl-4 text-right">SCORE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)] text-sm font-mono-code text-[var(--text-muted)]">
              {SAMPLE_ROWS.map((row) => (
                <tr key={row.rank}>
                  <td className="py-3 pr-4 tabular-nums">#{row.rank}</td>
                  <td className="py-3 px-4 flex items-center gap-2">
                    <span>{row.handle}</span>
                    <span className="px-1.5 py-0.5 text-[10px] border border-[var(--line)] rounded-[2px] uppercase">
                      SAMPLE
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {row.category} · {row.duration}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums">{row.wpm}</td>
                  <td className="py-3 px-4 text-right tabular-nums">{row.acc}%</td>
                  <td className="py-3 pl-4 text-right tabular-nums">{row.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
