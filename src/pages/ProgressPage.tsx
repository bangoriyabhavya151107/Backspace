import React, { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpDown, Download, Trash2, Upload } from 'lucide-react';
import {
  CATEGORIES,
  type DifficultyLevel,
  type StandardCategorySlug,
  type TestDuration,
} from '../data/content';
import {
  BADGE_DEFINITIONS,
  formatLocalDateIso,
  rankErrorKeys,
  rankSlowKeys,
} from '../engine/scoring';
import { exportAllData, importAllData } from '../engine/storage';
import { QwertyHeatmap } from '../components/QwertyHeatmap';
import { useApp } from '../context/AppContext';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

type SortField = 'timestamp' | 'category' | 'duration' | 'level' | 'netWpm' | 'accuracy';

export const ProgressPage: React.FC = () => {
  useDocumentMeta(
    'Progress & Analytics',
    'Track your WPM over time, personal bests, 26-week practice calendar, slow keys, and developer level.'
  );

  const {
    results,
    keyStats,
    currentStreak,
    longestStreak,
    levelInfo,
    badges,
    personalBests,
    deleteResult,
    refreshFromStorage,
  } = useApp();

  const [pbFilterLevel, setPbFilterLevel] = useState<'all' | DifficultyLevel>('all');
  const [chartRange, setChartRange] = useState<'7d' | '30d' | 'all'>('30d');
  const [hoveredCalendarDay, setHoveredCalendarDay] = useState<{
    date: string;
    count: number;
  } | null>(null);
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortAsc, setSortAsc] = useState(false);
  const [importFeedback, setImportFeedback] = useState<{
    type: 'ok' | 'err';
    msg: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const totalPracticeSeconds = useMemo(
    () => results.reduce((acc, r) => acc + (r.elapsedSeconds || r.duration), 0),
    [results]
  );

  const formatDurationTotal = (secs: number): string => {
    if (secs < 60) return `${secs}s`;
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs}h ${remMins}m`;
  };

  // Daily average WPM over time
  const dailySeries = useMemo(() => {
    const now = Date.now();
    const cutoff =
      chartRange === '7d'
        ? now - 7 * 86400000
        : chartRange === '30d'
        ? now - 30 * 86400000
        : 0;

    const filtered = results.filter((r) => r.timestamp >= cutoff);
    const byDate = new Map<string, { sumWpm: number; count: number }>();

    for (const r of filtered) {
      const prev = byDate.get(r.dateIso) ?? { sumWpm: 0, count: 0 };
      prev.sumWpm += r.netWpm;
      prev.count += 1;
      byDate.set(r.dateIso, prev);
    }

    return Array.from(byDate.entries())
      .map(([dateIso, v]) => ({
        dateIso,
        avgWpm: Math.round(v.sumWpm / v.count),
        count: v.count,
      }))
      .sort((a, b) => a.dateIso.localeCompare(b.dateIso));
  }, [results, chartRange]);

  // 26-week (182-day) contribution heatmap
  const calendarWeeks = useMemo(() => {
    const countsByDate = new Map<string, number>();
    for (const r of results) {
      countsByDate.set(r.dateIso, (countsByDate.get(r.dateIso) ?? 0) + 1);
    }

    const weeks: Array<Array<{ dateIso: string; count: number }>> = [];
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    // Align end of 26-week grid to today
    const totalDays = 26 * 7;
    const startDate = new Date(today.getTime() - (totalDays - 1) * 86400000);

    let currentWeek: Array<{ dateIso: string; count: number }> = [];
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(startDate.getTime() + i * 86400000);
      const iso = formatLocalDateIso(d.getTime());
      currentWeek.push({
        dateIso: iso,
        count: countsByDate.get(iso) ?? 0,
      });
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) weeks.push(currentWeek);
    return weeks;
  }, [results]);

  const topSlowKeys = useMemo(() => rankSlowKeys(keyStats, 8, 10), [keyStats]);
  const topErrorKeys = useMemo(() => rankErrorKeys(keyStats, 8, 10), [keyStats]);

  const sortedHistory = useMemo(() => {
    const slice = results.slice(0, 50);
    return [...slice].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'timestamp') cmp = a.timestamp - b.timestamp;
      else if (sortField === 'category') cmp = a.category.localeCompare(b.category);
      else if (sortField === 'duration') cmp = a.duration - b.duration;
      else if (sortField === 'level') cmp = a.level.localeCompare(b.level);
      else if (sortField === 'netWpm') cmp = a.netWpm - b.netWpm;
      else if (sortField === 'accuracy') cmp = a.accuracy - b.accuracy;
      return sortAsc ? cmp : -cmp;
    });
  }, [results, sortField, sortAsc]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc((prev) => !prev);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const handleExportJson = () => {
    const json = exportAllData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backspace-backup-${formatLocalDateIso(Date.now())}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const contentStr = String(reader.result ?? '');
      const res = importAllData(contentStr);
      if (res.ok) {
        refreshFromStorage();
        setImportFeedback({ type: 'ok', msg: 'Backup imported successfully.' });
      } else {
        setImportFeedback({
          type: 'err',
          msg: res.error || 'Could not import JSON file.',
        });
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const standardCategories = CATEGORIES.filter(
    (c) => c.slug !== 'weak-keys'
  ) as Array<(typeof CATEGORIES)[number] & { slug: StandardCategorySlug }>;
  const durations: TestDuration[] = [30, 60, 120, 300];

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 space-y-12">
      {/* Page Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--line)] pb-6">
        <div>
          <span className="mono-label text-[var(--text-muted)] block">LOCAL TELEMETRY</span>
          <h1 className="h2-display mt-1">Your progress</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportJson}
            className="keycap px-3.5 py-2 text-xs font-medium"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="keycap px-3.5 py-2 text-xs font-medium"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import JSON</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={handleImportFile}
            className="sr-only"
            aria-label="Import JSON backup file"
          />
        </div>
      </div>

      {importFeedback && (
        <div
          role="status"
          className={`paper-card px-4 py-3 text-xs font-mono-code ${
            importFeedback.type === 'ok'
              ? 'text-[var(--success)] border-[var(--success)]'
              : 'text-[var(--error)] border-[var(--error)]'
          }`}
        >
          {importFeedback.msg}
        </div>
      )}

      {/* NEW-USER EMPTY STATE when no tests have been saved yet */}
      {results.length === 0 && (
        <section className="paper-card p-8 sm:p-12 text-center space-y-6">
          {/* Keycap-built illustration */}
          <div
            className="inline-flex flex-wrap items-center justify-center gap-2 mx-auto"
            aria-hidden="true"
          >
            {['$', 'g', 'i', 't', '↵'].map((k, idx) => (
              <span
                key={idx}
                className={
                  k === '↵'
                    ? 'keycap-accent px-3.5 py-2 text-base font-bold'
                    : 'keycap px-3.5 py-2 text-base font-bold'
                }
              >
                {k}
              </span>
            ))}
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="h3-display">No tests recorded on this device yet</h2>
            <p className="text-sm text-[var(--text-muted)]">
              Complete a single typing session of at least 5 seconds to unlock your WPM trend chart, slow-key latency heatmap, and personal bests matrix.
            </p>
          </div>
          <div>
            <Link
              to="/practice"
              className="keycap-accent px-6 py-3 text-xs uppercase tracking-wider"
            >
              Take your first test
            </Link>
          </div>
        </section>
      )}

      {/* 1. SUMMARY ROW: Level & Title with XP Bar, Streaks, Total Tests, Total Practice Time */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 paper-card p-6 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="mono-label text-[var(--text-muted)] block">DEVELOPER RANK</span>
              <h2 className="h3-display mt-1">
                {levelInfo.title}{' '}
                <span className="font-mono-code text-base font-normal text-[var(--text-muted)]">
                  · Level {levelInfo.level}
                </span>
              </h2>
            </div>
            <span className="keycap px-3 py-1 text-xs font-semibold tabular-nums">
              {levelInfo.xp} XP
            </span>
          </div>

          <div className="mt-6 space-y-2">
            <div className="w-full h-2.5 bg-[var(--paper)] border border-[var(--line)] rounded-[3px] overflow-hidden">
              <div
                className="h-full bg-[var(--accent)] transition-all duration-300"
                style={{ width: `${levelInfo.progressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs font-mono-code text-[var(--text-muted)] tabular-nums">
              <span>Level {levelInfo.level} ({levelInfo.currentLevelMinXp} XP)</span>
              <span>Next: {levelInfo.nextLevelMinXp} XP</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="paper-card p-5">
            <span className="mono-label text-[var(--text-muted)] block">CURRENT STREAK</span>
            <span className="font-display font-extrabold text-4xl tabular-nums mt-2 block">
              {currentStreak}
              <span className="text-base font-mono-code font-normal text-[var(--text-muted)] ml-1">
                d
              </span>
            </span>
          </div>

          <div className="paper-card p-5">
            <span className="mono-label text-[var(--text-muted)] block">LONGEST STREAK</span>
            <span className="font-display font-extrabold text-4xl tabular-nums mt-2 block">
              {longestStreak}
              <span className="text-base font-mono-code font-normal text-[var(--text-muted)] ml-1">
                d
              </span>
            </span>
          </div>

          <div className="paper-card p-5">
            <span className="mono-label text-[var(--text-muted)] block">TOTAL TESTS</span>
            <span className="font-display font-extrabold text-4xl tabular-nums mt-2 block">
              {results.length}
            </span>
          </div>

          <div className="paper-card p-5">
            <span className="mono-label text-[var(--text-muted)] block">PRACTICE TIME</span>
            <span className="font-display font-extrabold text-4xl tabular-nums mt-2 block">
              {formatDurationTotal(totalPracticeSeconds)}
            </span>
          </div>
        </div>
      </section>

      {/* 2. PERSONAL BESTS TABLE: Category x Duration with Difficulty Filter */}
      <section className="paper-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div>
            <span className="mono-label text-[var(--text-muted)] block">BENCHMARKS</span>
            <h2 className="h3-display mt-0.5">Personal bests</h2>
          </div>

          <div
            className="inline-flex items-center gap-1 p-0.5 border border-[var(--line)] rounded-[4px] bg-[var(--paper)]"
            role="group"
            aria-label="Difficulty filter for personal bests"
          >
            {(['all', 'easy', 'medium', 'hard'] as const).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setPbFilterLevel(lvl)}
                className={`px-3 py-1 text-xs font-mono-code capitalize rounded-[2px] ${
                  pbFilterLevel === lvl
                    ? 'bg-[var(--ink)] text-[var(--paper)] font-semibold'
                    : 'text-[var(--text-muted)] hover:text-[var(--ink)]'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--line)] text-xs font-mono-code text-[var(--text-muted)]">
                <th className="py-3 pr-4 font-medium">CATEGORY</th>
                {durations.map((d) => (
                  <th key={d} className="py-3 px-4 font-medium text-right">
                    {d} SECONDS
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)] text-sm">
              {standardCategories.map((cat) => (
                <tr key={cat.slug}>
                  <td className="py-3.5 pr-4 font-medium text-[var(--ink)]">
                    {cat.name}
                  </td>
                  {durations.map((dur) => {
                    const levelsToSearch: DifficultyLevel[] =
                      pbFilterLevel === 'all'
                        ? ['easy', 'medium', 'hard']
                        : [pbFilterLevel];

                    let best: { wpm: number; acc: number } | null = null;
                    for (const l of levelsToSearch) {
                      const entry = personalBests[`${cat.slug}|${dur}|${l}`];
                      if (entry && (!best || entry.bestWpm > best.wpm)) {
                        best = { wpm: entry.bestWpm, acc: entry.bestAccuracy };
                      }
                    }

                    return (
                      <td
                        key={dur}
                        className="py-3.5 px-4 text-right font-mono-code tabular-nums"
                      >
                        {best ? (
                          <div>
                            <span className="font-semibold text-[var(--ink)]">
                              {best.wpm} WPM
                            </span>
                            <span className="text-xs text-[var(--text-muted)] ml-1.5">
                              {best.acc}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-[var(--text-muted)] opacity-50">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. WPM OVER TIME CHART + 4. PRACTICE CALENDAR (26 WEEKS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* WPM Over Time */}
        <section className="lg:col-span-6 paper-card p-6 flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <span className="mono-label text-[var(--text-muted)] block">DAILY AVERAGE</span>
              <h2 className="h3-display mt-0.5">WPM over time</h2>
            </div>
            <div
              className="inline-flex items-center gap-1 p-0.5 border border-[var(--line)] rounded-[4px] bg-[var(--paper)]"
              role="group"
              aria-label="Chart date range"
            >
              {(['7d', '30d', 'all'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setChartRange(r)}
                  className={`px-2.5 py-1 text-xs font-mono-code rounded-[2px] uppercase ${
                    chartRange === r
                      ? 'bg-[var(--ink)] text-[var(--paper)] font-semibold'
                      : 'text-[var(--text-muted)] hover:text-[var(--ink)]'
                  }`}
                >
                  {r === '7d' ? '7 days' : r === '30d' ? '30 days' : 'All'}
                </button>
              ))}
            </div>
          </div>

          {dailySeries.length === 0 ? (
            <div className="h-44 flex items-center justify-center border border-dashed border-[var(--line)] rounded-[6px] text-xs font-mono-code text-[var(--text-muted)]">
              Complete a test to plot your daily WPM trend.
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <svg
                viewBox="0 0 500 180"
                className="w-full h-auto block font-mono-code"
                role="img"
                aria-label="Daily average WPM chart"
              >
                {(() => {
                  const maxVal = Math.max(60, ...dailySeries.map((d) => d.avgWpm)) + 10;
                  const pL = 36;
                  const pR = 16;
                  const pT = 16;
                  const pB = 28;
                  const pW = 500 - pL - pR;
                  const pH = 180 - pT - pB;

                  const getX = (i: number) =>
                    dailySeries.length <= 1
                      ? pL + pW / 2
                      : pL + (i / (dailySeries.length - 1)) * pW;
                  const getY = (val: number) =>
                    pT + pH - (Math.min(maxVal, val) / maxVal) * pH;

                  const dPath = dailySeries
                    .map(
                      (pt, idx) =>
                        `${idx === 0 ? 'M' : 'L'} ${getX(idx).toFixed(1)} ${getY(
                          pt.avgWpm
                        ).toFixed(1)}`
                    )
                    .join(' ');

                  return (
                    <>
                      {[0, 0.5, 1].map((ratio) => {
                        const v = Math.round(maxVal * ratio);
                        const y = getY(v);
                        return (
                          <g key={ratio}>
                            <line
                              x1={pL}
                              y1={y}
                              x2={500 - pR}
                              y2={y}
                              stroke="var(--line)"
                              strokeDasharray={ratio === 0 ? undefined : '4 4'}
                            />
                            <text
                              x={pL - 6}
                              y={y + 4}
                              textAnchor="end"
                              fontSize="10"
                              fill="var(--text-muted)"
                            >
                              {v}
                            </text>
                          </g>
                        );
                      })}
                      <path
                        d={dPath}
                        fill="none"
                        stroke="var(--ink)"
                        strokeWidth="2.5"
                      />
                      {dailySeries.map((pt, idx) => (
                        <g key={pt.dateIso}>
                          <circle
                            cx={getX(idx)}
                            cy={getY(pt.avgWpm)}
                            r={4}
                            fill="var(--accent)"
                          >
                            <title>
                              {pt.dateIso}: {pt.avgWpm} WPM ({pt.count} test
                              {pt.count === 1 ? '' : 's'})
                            </title>
                          </circle>
                          {(idx === 0 || idx === dailySeries.length - 1) && (
                            <text
                              x={getX(idx)}
                              y={172}
                              textAnchor={idx === 0 ? 'start' : 'end'}
                              fontSize="10"
                              fill="var(--text-muted)"
                            >
                              {pt.dateIso.slice(5)}
                            </text>
                          )}
                        </g>
                      ))}
                    </>
                  );
                })()}
              </svg>
            </div>
          )}
        </section>

        {/* Practice Calendar (Last 26 Weeks) */}
        <section className="lg:col-span-6 paper-card p-6 flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <span className="mono-label text-[var(--text-muted)] block">LAST 26 WEEKS</span>
              <h2 className="h3-display mt-0.5">Practice calendar</h2>
            </div>
            <div className="text-xs font-mono-code text-[var(--text-muted)] min-h-[20px]">
              {hoveredCalendarDay ? (
                <span className="text-[var(--ink)] font-semibold">
                  {hoveredCalendarDay.date} · {hoveredCalendarDay.count} test
                  {hoveredCalendarDay.count === 1 ? '' : 's'}
                </span>
              ) : (
                <span>Hover a square for daily test count</span>
              )}
            </div>
          </div>

          <div className="overflow-x-auto py-2">
            <div className="inline-flex gap-1.5 min-w-max">
              {calendarWeeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-1.5">
                  {week.map((day) => {
                    let bgStyle: React.CSSProperties = {
                      backgroundColor: 'var(--paper)',
                    };
                    if (day.count >= 5) {
                      bgStyle = { backgroundColor: 'var(--accent)' };
                    } else if (day.count >= 3) {
                      bgStyle = {
                        backgroundColor:
                          'color-mix(in srgb, var(--accent) 65%, var(--paper))',
                      };
                    } else if (day.count >= 1) {
                      bgStyle = {
                        backgroundColor:
                          'color-mix(in srgb, var(--accent) 32%, var(--paper))',
                      };
                    }

                    return (
                      <div
                        key={day.dateIso}
                        onMouseEnter={() =>
                          setHoveredCalendarDay({
                            date: day.dateIso,
                            count: day.count,
                          })
                        }
                        onMouseLeave={() => setHoveredCalendarDay(null)}
                        style={bgStyle}
                        className="w-3.5 h-3.5 rounded-[2px] border border-[var(--line)] transition-transform hover:scale-125"
                        title={`${day.dateIso}: ${day.count} tests`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs font-mono-code text-[var(--text-muted)]">
            <span>26 weeks ago</span>
            <div className="flex items-center gap-1.5">
              <span>Less</span>
              <span className="w-3 h-3 rounded-[2px] border border-[var(--line)] bg-[var(--paper)]" />
              <span
                className="w-3 h-3 rounded-[2px] border border-[var(--line)]"
                style={{
                  backgroundColor:
                    'color-mix(in srgb, var(--accent) 32%, var(--paper))',
                }}
              />
              <span
                className="w-3 h-3 rounded-[2px] border border-[var(--line)]"
                style={{
                  backgroundColor:
                    'color-mix(in srgb, var(--accent) 65%, var(--paper))',
                }}
              />
              <span className="w-3 h-3 rounded-[2px] border border-[var(--line)] bg-[var(--accent)]" />
              <span>More</span>
            </div>
          </div>
        </section>
      </div>

      {/* 5. SLOW KEYS HEATMAP + TOP 10 LISTS */}
      <section className="paper-card p-6 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="mono-label text-[var(--text-muted)] block">ALL-TIME DIAGNOSTICS</span>
            <h2 className="h3-display mt-0.5">Slow & error-prone keys</h2>
          </div>
          <Link
            to="/practice?category=weak-keys"
            className="keycap-accent px-4 py-1.5 text-xs uppercase tracking-wider"
          >
            Practice weak keys
          </Link>
        </div>

        <QwertyHeatmap mode="heatmap" keyStats={keyStats} minSamples={8} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[var(--line)]">
          {/* Top 10 Slow Keys */}
          <div>
            <h3 className="mono-label text-[var(--text-muted)] mb-3">
              TOP 10 SLOWEST KEYS (MIN 8 SAMPLES)
            </h3>
            {topSlowKeys.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">
                Type more characters (at least 8 samples per key) to rank your slowest keys.
              </p>
            ) : (
              <ol className="space-y-2">
                {topSlowKeys.map((item, idx) => (
                  <li
                    key={item.key}
                    className="flex items-center justify-between gap-3 px-3 py-2 border border-[var(--line)] rounded-[4px] bg-[var(--paper)] text-xs font-mono-code"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[var(--text-muted)] w-5 tabular-nums">
                        {String(idx + 1).padStart(2, '0')}.
                      </span>
                      <kbd className="keycap px-2 py-0.5 font-semibold text-sm">
                        {item.key}
                      </kbd>
                      <span className="text-[var(--text-muted)]">
                        {item.count} samples
                      </span>
                    </div>
                    <span className="font-semibold text-[var(--ink)] tabular-nums">
                      avg {item.avgLatencyMs} ms
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {/* Top 10 Error Keys */}
          <div>
            <h3 className="mono-label text-[var(--text-muted)] mb-3">
              TOP 10 ERROR-PRONE KEYS (MIN 8 SAMPLES)
            </h3>
            {topErrorKeys.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">
                No keys with 8+ samples and recorded errors yet.
              </p>
            ) : (
              <ol className="space-y-2">
                {topErrorKeys.map((item, idx) => (
                  <li
                    key={item.key}
                    className="flex items-center justify-between gap-3 px-3 py-2 border border-[var(--line)] rounded-[4px] bg-[var(--paper)] text-xs font-mono-code"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[var(--text-muted)] w-5 tabular-nums">
                        {String(idx + 1).padStart(2, '0')}.
                      </span>
                      <kbd className="keycap px-2 py-0.5 font-semibold text-sm">
                        {item.key}
                      </kbd>
                      <span className="text-[var(--text-muted)]">
                        {item.errors} / {item.count} missed
                      </span>
                    </div>
                    <span className="font-semibold text-[var(--error)] tabular-nums">
                      {item.errorRate}% error rate
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </section>

      {/* 6. BADGES GRID */}
      <section className="paper-card p-6">
        <div className="mb-5">
          <span className="mono-label text-[var(--text-muted)] block">MILESTONES</span>
          <h2 className="h3-display mt-0.5">
            Badges ({badges.length} / {BADGE_DEFINITIONS.length})
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {BADGE_DEFINITIONS.map((b) => {
            const earned = badges.includes(b.id);
            return (
              <div
                key={b.id}
                className={`p-4 rounded-[6px] border transition-colors ${
                  earned
                    ? 'bg-[var(--card)] border-[var(--ink)]'
                    : 'bg-[var(--paper)] border-dashed border-[var(--line)] opacity-65'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={
                      earned
                        ? 'keycap-accent px-2.5 py-0.5 text-xs'
                        : 'keycap px-2.5 py-0.5 text-xs text-[var(--text-muted)]'
                    }
                  >
                    {b.glyph}
                  </span>
                  <span className="mono-label text-[10px] text-[var(--text-muted)]">
                    {earned ? 'EARNED' : 'LOCKED'}
                  </span>
                </div>
                <h3 className="font-display font-bold text-base text-[var(--ink)]">
                  {b.name}
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-1">{b.requirement}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. HISTORY: Last 50 tests in a sortable table */}
      <section className="paper-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div>
            <span className="mono-label text-[var(--text-muted)] block">RECENT SESSIONS</span>
            <h2 className="h3-display mt-0.5">Test history (last 50)</h2>
          </div>
        </div>

        {sortedHistory.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] py-4">
            Your completed tests will appear here in a sortable log.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--line)] text-xs font-mono-code text-[var(--text-muted)]">
                  <th className="py-3 pr-4">
                    <button
                      type="button"
                      onClick={() => handleSort('timestamp')}
                      className="inline-flex items-center gap-1 hover:text-[var(--ink)]"
                    >
                      <span>DATE</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4">
                    <button
                      type="button"
                      onClick={() => handleSort('category')}
                      className="inline-flex items-center gap-1 hover:text-[var(--ink)]"
                    >
                      <span>CATEGORY</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4">
                    <button
                      type="button"
                      onClick={() => handleSort('duration')}
                      className="inline-flex items-center gap-1 hover:text-[var(--ink)]"
                    >
                      <span>DURATION</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4">
                    <button
                      type="button"
                      onClick={() => handleSort('level')}
                      className="inline-flex items-center gap-1 hover:text-[var(--ink)]"
                    >
                      <span>DIFFICULTY</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleSort('netWpm')}
                      className="inline-flex items-center gap-1 hover:text-[var(--ink)]"
                    >
                      <span>WPM</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleSort('accuracy')}
                      className="inline-flex items-center gap-1 hover:text-[var(--ink)]"
                    >
                      <span>ACCURACY</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 pl-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)] text-sm font-mono-code">
                {sortedHistory.map((item) => {
                  const catName =
                    CATEGORIES.find((c) => c.slug === item.category)?.name ??
                    item.category;
                  return (
                    <tr key={item.id}>
                      <td className="py-3 pr-4 text-xs text-[var(--text-muted)] tabular-nums">
                        {item.dateIso}
                      </td>
                      <td className="py-3 px-4 font-sans-body font-medium text-[var(--ink)]">
                        {catName}
                      </td>
                      <td className="py-3 px-4 tabular-nums">{item.duration}s</td>
                      <td className="py-3 px-4 capitalize text-xs">{item.level}</td>
                      <td className="py-3 px-4 text-right font-semibold tabular-nums">
                        {item.netWpm}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums">
                        {item.accuracy}%
                      </td>
                      <td className="py-3 pl-4 text-right">
                        <button
                          type="button"
                          onClick={() => deleteResult(item.id)}
                          aria-label={`Delete test result from ${item.dateIso} (${item.netWpm} WPM)`}
                          className="keycap px-2.5 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--error)]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
