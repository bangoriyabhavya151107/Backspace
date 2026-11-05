import { getAllBankLines } from '../data/content';
import type {
  BadgeDefinition,
  CharacterCounts,
  DeveloperTitle,
  KeyStatsMap,
  KeystrokeEvent,
  LevelInfo,
  PerSecondSample,
  RankedKeyStat,
  TestResult,
} from './types';

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'first-test',
    name: 'First Test',
    requirement: 'Complete your first practice test.',
    glyph: '01',
  },
  {
    id: '10-tests',
    name: '10 Tests',
    requirement: 'Complete 10 practice tests.',
    glyph: '10',
  },
  {
    id: '100-tests',
    name: '100 Tests',
    requirement: 'Complete 100 practice tests.',
    glyph: '100',
  },
  {
    id: '7-day-streak',
    name: '7-Day Streak',
    requirement: 'Practice 7 consecutive days (30s+ test per day).',
    glyph: '7d',
  },
  {
    id: '30-day-streak',
    name: '30-Day Streak',
    requirement: 'Practice 30 consecutive days (30s+ test per day).',
    glyph: '30d',
  },
  {
    id: '50-wpm',
    name: '50 WPM',
    requirement: 'Reach 50+ WPM with at least 95% accuracy.',
    glyph: '50w',
  },
  {
    id: '80-wpm',
    name: '80 WPM',
    requirement: 'Reach 80+ WPM with at least 95% accuracy.',
    glyph: '80w',
  },
  {
    id: 'flawless',
    name: 'Flawless',
    requirement: 'Finish a test of 30s or longer with 100% accuracy.',
    glyph: '100%',
  },
  {
    id: 'symbol-slayer',
    name: 'Symbol Slayer',
    requirement: 'Score 40+ WPM with 95%+ accuracy in Symbols mode.',
    glyph: '{!=}',
  },
  {
    id: 'marathoner',
    name: 'Marathoner',
    requirement: 'Complete a full 300-second test.',
    glyph: '300s',
  },
  {
    id: 'night-owl',
    name: 'Night Owl',
    requirement: 'Complete a test between 00:00 and 04:00 local time.',
    glyph: '02:00',
  },
];

export const LADDER_TIERS: Array<{
  title: DeveloperTitle;
  levels: string;
  targetWpm: number;
  targetAccuracy: number;
  badgeLabel: string;
  description: string;
}> = [
  {
    title: 'Intern',
    levels: 'Levels 1–2',
    targetWpm: 30,
    targetAccuracy: 90,
    badgeLabel: 'L1',
    description: 'Finding home row on brackets, flags, and pipes.',
  },
  {
    title: 'Junior',
    levels: 'Levels 3–4',
    targetWpm: 45,
    targetAccuracy: 93,
    badgeLabel: 'L3',
    description: 'Clean git workflows and standard shell flags without looking down.',
  },
  {
    title: 'Mid',
    levels: 'Levels 5–7',
    targetWpm: 60,
    targetAccuracy: 95,
    badgeLabel: 'L5',
    description: 'Smooth arrow functions, SQL joins, and chained CLI commands.',
  },
  {
    title: 'Senior',
    levels: 'Levels 8–11',
    targetWpm: 75,
    targetAccuracy: 96,
    badgeLabel: 'L8',
    description: 'High-density symbol chains, rebases, and regex without hesitation.',
  },
  {
    title: 'Staff',
    levels: 'Levels 12–17',
    targetWpm: 90,
    targetAccuracy: 97,
    badgeLabel: 'L12',
    description: 'Effortless command-line fluency across every stack and tool.',
  },
  {
    title: 'Principal',
    levels: 'Level 18+',
    targetWpm: 105,
    targetAccuracy: 98,
    badgeLabel: 'L18',
    description: 'Zero wasted keystrokes. You hit Backspace almost never.',
  },
];

export function calculateBackspaceScore(netWpm: number, accuracy: number): number {
  const accRatio = Math.max(0, Math.min(1, accuracy / 100));
  return Math.round(netWpm * accRatio * accRatio);
}

export function calculateConsistency(samples: PerSecondSample[]): number {
  if (samples.length < 2) return 100;
  const values = samples.map((s) => s.netWpm);
  const mean = values.reduce((acc, v) => acc + v, 0) / values.length;
  if (mean <= 0) return 0;
  const variance =
    values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const cv = (stdDev / mean) * 100;
  return Math.round(Math.max(0, Math.min(100, 100 - cv)));
}

export function computeCharacterCounts(
  targetLines: string[],
  typedLines: string[],
  activeLineIndex: number
): CharacterCounts {
  let correct = 0;
  let incorrect = 0;
  let extra = 0;
  let missed = 0;

  for (let i = 0; i <= activeLineIndex && i < targetLines.length; i++) {
    const target = targetLines[i];
    const typed = typedLines[i] ?? '';
    const isCommitted = i < activeLineIndex;

    const minLen = Math.min(target.length, typed.length);
    for (let c = 0; c < minLen; c++) {
      if (typed[c] === target[c]) {
        correct++;
      } else {
        incorrect++;
      }
    }

    if (typed.length > target.length) {
      extra += typed.length - target.length;
    }

    if (isCommitted) {
      if (typed.length < target.length) {
        missed += target.length - typed.length;
      }
      // Pressing Enter to commit a completed line counts as 1 correct character
      if (typed.length >= target.length) {
        correct += 1;
      }
    }
  }

  return { correct, incorrect, extra, missed };
}

export function calculateLiveMetrics(
  targetLines: string[],
  typedLines: string[],
  activeLineIndex: number,
  keystrokes: KeystrokeEvent[],
  elapsedMs: number
): {
  netWpm: number;
  rawWpm: number;
  accuracy: number;
  correctChars: number;
  errors: number;
} {
  const minutes = Math.max(elapsedMs / 60000, 1 / 600); // guard against divide-by-zero in first 100ms
  const counts = computeCharacterCounts(targetLines, typedLines, activeLineIndex);
  const totalKeystrokes = keystrokes.length;
  const correctKeystrokes = keystrokes.filter((k) => k.correct).length;
  const errorKeystrokes = totalKeystrokes - correctKeystrokes;

  if (totalKeystrokes === 0 || elapsedMs <= 0) {
    return {
      netWpm: 0,
      rawWpm: 0,
      accuracy: 100,
      correctChars: 0,
      errors: 0,
    };
  }

  const netWpm = Math.round(counts.correct / 5 / minutes);
  const rawWpm = Math.round(totalKeystrokes / 5 / minutes);
  const accuracy = Math.round((correctKeystrokes / totalKeystrokes) * 100);

  return {
    netWpm: Math.max(0, netWpm),
    rawWpm: Math.max(0, rawWpm),
    accuracy: Math.max(0, Math.min(100, accuracy)),
    correctChars: counts.correct,
    errors: errorKeystrokes,
  };
}

export function getTitleForLevel(level: number): DeveloperTitle {
  if (level <= 2) return 'Intern';
  if (level <= 4) return 'Junior';
  if (level <= 7) return 'Mid';
  if (level <= 11) return 'Senior';
  if (level <= 17) return 'Staff';
  return 'Principal';
}

export function getLevelInfo(xp: number): LevelInfo {
  const safeXp = Math.max(0, Math.floor(xp));
  // Level = floor(sqrt(XP / 50)) + 1
  const level = Math.floor(Math.sqrt(safeXp / 50)) + 1;
  const title = getTitleForLevel(level);
  const currentLevelMinXp = Math.pow(level - 1, 2) * 50;
  const nextLevelMinXp = Math.pow(level, 2) * 50;
  const span = Math.max(1, nextLevelMinXp - currentLevelMinXp);
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round(((safeXp - currentLevelMinXp) / span) * 100))
  );

  return {
    level,
    title,
    xp: safeXp,
    currentLevelMinXp,
    nextLevelMinXp,
    progressPercent,
  };
}

export function calculateXpForTest(backspaceScore: number): number {
  return Math.round(backspaceScore / 2) + 10;
}

export function formatLocalDateIso(timestamp: number): string {
  const d = new Date(timestamp);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function computeStreaks(
  streakDates: string[],
  todayIso: string = formatLocalDateIso(Date.now())
): { currentStreak: number; longestStreak: number } {
  if (streakDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const uniqueSorted = Array.from(new Set(streakDates)).sort();

  const toDayNumber = (iso: string): number => {
    const [y, m, d] = iso.split('-').map(Number);
    return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
  };

  const dayNums = uniqueSorted.map(toDayNumber);
  let longest = 1;
  let currentRun = 1;

  for (let i = 1; i < dayNums.length; i++) {
    if (dayNums[i] === dayNums[i - 1] + 1) {
      currentRun++;
      if (currentRun > longest) longest = currentRun;
    } else if (dayNums[i] !== dayNums[i - 1]) {
      currentRun = 1;
    }
  }

  const todayNum = toDayNumber(todayIso);
  const lastDayNum = dayNums[dayNums.length - 1];

  // Streak is active if the user practiced today or yesterday
  if (todayNum - lastDayNum > 1) {
    return { currentStreak: 0, longestStreak: longest };
  }

  let activeStreak = 1;
  for (let i = dayNums.length - 1; i > 0; i--) {
    if (dayNums[i] === dayNums[i - 1] + 1) {
      activeStreak++;
    } else {
      break;
    }
  }

  return { currentStreak: activeStreak, longestStreak: Math.max(longest, activeStreak) };
}

export function rankSlowKeys(
  keyStats: KeyStatsMap,
  minSamples = 8,
  limit = 10
): RankedKeyStat[] {
  const list: RankedKeyStat[] = [];
  for (const [key, entry] of Object.entries(keyStats)) {
    if (key === '\n' || key === ' ') continue;
    if (entry.count >= minSamples) {
      const avgLatencyMs = Math.round(entry.totalLatencyMs / entry.count);
      const errorRate = Math.round((entry.errors / entry.count) * 100);
      list.push({
        key,
        count: entry.count,
        avgLatencyMs,
        errorRate,
        errors: entry.errors,
      });
    }
  }
  return list.sort((a, b) => b.avgLatencyMs - a.avgLatencyMs).slice(0, limit);
}

export function rankErrorKeys(
  keyStats: KeyStatsMap,
  minSamples = 8,
  limit = 10
): RankedKeyStat[] {
  const list: RankedKeyStat[] = [];
  for (const [key, entry] of Object.entries(keyStats)) {
    if (key === '\n' || key === ' ') continue;
    if (entry.count >= minSamples && entry.errors > 0) {
      const avgLatencyMs = Math.round(entry.totalLatencyMs / entry.count);
      const errorRate = Math.round((entry.errors / entry.count) * 100);
      list.push({
        key,
        count: entry.count,
        avgLatencyMs,
        errorRate,
        errors: entry.errors,
      });
    }
  }
  return list
    .sort((a, b) => b.errorRate - a.errorRate || b.errors - a.errors)
    .slice(0, limit);
}

export function buildAdaptiveLines(
  keyStats: KeyStatsMap,
  focusKeys?: string[]
): string[] {
  const allLines = getAllBankLines();
  const entries = Object.entries(keyStats).filter(
    ([k, v]) => k !== '\n' && k !== ' ' && v.count >= 3
  );

  let maxLat = 1;
  let maxErrRate = 0.01;
  const charWeights: Record<string, number> = {};

  for (const [, v] of entries) {
    const avgLat = v.totalLatencyMs / v.count;
    const errRate = v.errors / v.count;
    if (avgLat > maxLat) maxLat = avgLat;
    if (errRate > maxErrRate) maxErrRate = errRate;
  }

  for (const [k, v] of entries) {
    const normSlow = (v.totalLatencyMs / v.count) / maxLat;
    const normErr = (v.errors / v.count) / maxErrRate;
    charWeights[k] = normSlow + normErr * 1.25;
  }

  if (focusKeys && focusKeys.length > 0) {
    for (const fk of focusKeys) {
      charWeights[fk] = (charWeights[fk] ?? 1) + 3.5;
    }
  }

  const scored = allLines.map((line) => {
    let score = 0;
    for (const ch of line) {
      score += charWeights[ch] ?? 0.05;
    }
    return { line, score: score / Math.max(10, line.length) };
  });

  scored.sort((a, b) => b.score - a.score);

  const topCount = Math.max(8, Math.floor(scored.length * 0.35));
  const highScoring = scored.slice(0, topCount).map((s) => s.line);
  const generalPool = scored.slice(topCount).map((s) => s.line);

  // Mix 80% high-scoring lines + 20% general lines so practice is not repetitive
  const mixed: string[] = [];
  const shuffledHigh = shuffleArray(highScoring);
  const shuffledGen = shuffleArray(generalPool);

  let genIdx = 0;
  for (let i = 0; i < shuffledHigh.length; i++) {
    mixed.push(shuffledHigh[i]);
    if ((i + 1) % 4 === 0 && genIdx < shuffledGen.length) {
      mixed.push(shuffledGen[genIdx++]);
    }
  }

  return mixed.length > 0 ? mixed : shuffleArray(allLines);
}

export function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

export function evaluateBadges(
  latestResult: TestResult,
  allResultsCount: number,
  currentStreak: number,
  longestStreak: number,
  existingBadges: string[]
): string[] {
  const unlocked = new Set(existingBadges);
  const newlyUnlocked: string[] = [];

  const grant = (id: string) => {
    if (!unlocked.has(id)) {
      unlocked.add(id);
      newlyUnlocked.push(id);
    }
  };

  if (allResultsCount >= 1) grant('first-test');
  if (allResultsCount >= 10) grant('10-tests');
  if (allResultsCount >= 100) grant('100-tests');
  if (currentStreak >= 7 || longestStreak >= 7) grant('7-day-streak');
  if (currentStreak >= 30 || longestStreak >= 30) grant('30-day-streak');

  if (latestResult.netWpm >= 50 && latestResult.accuracy >= 95) {
    grant('50-wpm');
  }
  if (latestResult.netWpm >= 80 && latestResult.accuracy >= 95) {
    grant('80-wpm');
  }
  if (latestResult.accuracy === 100 && latestResult.elapsedSeconds >= 30) {
    grant('flawless');
  }
  if (
    latestResult.category === 'symbols' &&
    latestResult.netWpm >= 40 &&
    latestResult.accuracy >= 95
  ) {
    grant('symbol-slayer');
  }
  if (latestResult.duration === 300 && latestResult.elapsedSeconds >= 295) {
    grant('marathoner');
  }

  const localHour = new Date(latestResult.timestamp).getHours();
  if (localHour >= 0 && localHour < 4) {
    grant('night-owl');
  }

  return newlyUnlocked;
}
