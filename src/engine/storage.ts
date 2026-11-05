import {
  computeStreaks,
  evaluateBadges,
  formatLocalDateIso,
  getLevelInfo,
} from './scoring';
import type {
  BigramStatsMap,
  KeyStatsMap,
  PersonalBestEntry,
  TestResult,
  UserSettings,
} from './types';

export const STORAGE_NAMESPACE = 'backspace:v1:';
export const SCHEMA_VERSION = 1;
export const MAX_SAVED_RESULTS = 500;

interface VersionedEnvelope<T> {
  schemaVersion: number;
  data: T;
}

// In-memory fallback store if localStorage is blocked or throws
const memoryStore = new Map<string, string>();

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'light',
  fontSize: 28,
  lineSpacing: 'normal',
  caretStyle: 'block',
  keyboardOverlay: false,
  soundEnabled: false,
  soundVolume: 60,
  stopOnError: false,
  reduceMotion: false,
  lastCategory: 'git',
  lastDuration: 60,
  lastLevel: 'medium',
  lastLanguage: 'js',
};

function readKey<T>(key: string, fallback: T): T {
  const fullKey = `${STORAGE_NAMESPACE}${key}`;
  try {
    const raw =
      typeof window !== 'undefined' && window.localStorage
        ? window.localStorage.getItem(fullKey)
        : memoryStore.get(fullKey) ?? null;
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as VersionedEnvelope<T> | T;
    if (
      parsed &&
      typeof parsed === 'object' &&
      'schemaVersion' in parsed &&
      'data' in parsed
    ) {
      return (parsed as VersionedEnvelope<T>).data;
    }
    return parsed as T;
  } catch {
    const mem = memoryStore.get(fullKey);
    if (mem) {
      try {
        return (JSON.parse(mem) as VersionedEnvelope<T>).data;
      } catch {
        return fallback;
      }
    }
    return fallback;
  }
}

function writeKey<T>(key: string, data: T): void {
  const fullKey = `${STORAGE_NAMESPACE}${key}`;
  const payload = JSON.stringify({
    schemaVersion: SCHEMA_VERSION,
    data,
  } satisfies VersionedEnvelope<T>);

  memoryStore.set(fullKey, payload);
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(fullKey, payload);
    }
  } catch {
    // Fallback already stored in memoryStore
  }
}

export function getSettings(): UserSettings {
  const saved = readKey<Partial<UserSettings>>('settings', {});
  return { ...DEFAULT_SETTINGS, ...saved };
}

export function saveSettings(partial: Partial<UserSettings>): UserSettings {
  const updated = { ...getSettings(), ...partial };
  writeKey('settings', updated);
  return updated;
}

export function getResults(): TestResult[] {
  return readKey<TestResult[]>('results', []);
}

export function getKeyStats(): KeyStatsMap {
  return readKey<KeyStatsMap>('keyStats', {});
}

export function getBigramStats(): BigramStatsMap {
  return readKey<BigramStatsMap>('bigramStats', {});
}

export function getStreakDates(): string[] {
  return readKey<string[]>('streakDates', []);
}

export function getXp(): number {
  return readKey<number>('xp', 0);
}

export function getBadges(): string[] {
  return readKey<string[]>('badges', []);
}

export function getPersonalBests(): Record<string, PersonalBestEntry> {
  return readKey<Record<string, PersonalBestEntry>>('personalBests', {});
}

export function getNotifyEmail(): string {
  return readKey<string>('notifyEmail', '');
}

export function saveNotifyEmail(email: string): void {
  writeKey('notifyEmail', email);
}

export function saveCompletedTest(
  result: TestResult,
  bigramDeltas: BigramStatsMap = {}
): TestResult {
  const results = getResults();
  const keyStats = getKeyStats();
  const bigramStats = getBigramStats();
  const streakDates = getStreakDates();
  const personalBests = getPersonalBests();
  const oldXp = getXp();
  const oldLevelInfo = getLevelInfo(oldXp);
  const existingBadges = getBadges();

  // 1. Update per-key stats
  for (const [k, delta] of Object.entries(result.testKeyStats)) {
    if (!keyStats[k]) {
      keyStats[k] = { count: 0, totalLatencyMs: 0, errors: 0 };
    }
    keyStats[k].count += delta.count;
    keyStats[k].totalLatencyMs += delta.totalLatencyMs;
    keyStats[k].errors += delta.errors;
  }

  // 2. Update bigram stats
  for (const [bg, delta] of Object.entries(bigramDeltas)) {
    if (!bigramStats[bg]) {
      bigramStats[bg] = { count: 0, totalLatencyMs: 0, errors: 0 };
    }
    bigramStats[bg].count += delta.count;
    bigramStats[bg].totalLatencyMs += delta.totalLatencyMs;
    bigramStats[bg].errors += delta.errors;
  }

  // 3. Personal best check keyed by "category|time|level"
  const pbKey = `${result.category}|${result.duration}|${result.level}`;
  const prevPb = personalBests[pbKey];
  let isPersonalBest = false;
  let previousBestWpm: number | null = null;
  let previousBestScore: number | null = null;

  if (!prevPb) {
    isPersonalBest = true;
    personalBests[pbKey] = {
      key: pbKey,
      category: result.category,
      duration: result.duration,
      level: result.level,
      bestWpm: result.netWpm,
      bestAccuracy: result.accuracy,
      bestBackspaceScore: result.backspaceScore,
      timestamp: result.timestamp,
    };
  } else if (
    result.backspaceScore > prevPb.bestBackspaceScore ||
    (result.backspaceScore === prevPb.bestBackspaceScore &&
      result.netWpm > prevPb.bestWpm)
  ) {
    isPersonalBest = true;
    previousBestWpm = prevPb.bestWpm;
    previousBestScore = prevPb.bestBackspaceScore;
    personalBests[pbKey] = {
      key: pbKey,
      category: result.category,
      duration: result.duration,
      level: result.level,
      bestWpm: Math.max(result.netWpm, prevPb.bestWpm),
      bestAccuracy:
        result.netWpm >= prevPb.bestWpm ? result.accuracy : prevPb.bestAccuracy,
      bestBackspaceScore: result.backspaceScore,
      timestamp: result.timestamp,
    };
  }

  // 4. Streak dates: a day counts if at least one test of 30 seconds or longer was completed
  if (result.elapsedSeconds >= 28 && result.duration >= 30) {
    if (!streakDates.includes(result.dateIso)) {
      streakDates.push(result.dateIso);
    }
  }

  const { currentStreak, longestStreak } = computeStreaks(
    streakDates,
    formatLocalDateIso(result.timestamp)
  );

  // 5. XP & Level up check
  const newXp = oldXp + result.xpEarned;
  const newLevelInfo = getLevelInfo(newXp);
  const leveledUpTo =
    newLevelInfo.level > oldLevelInfo.level
      ? { level: newLevelInfo.level, title: newLevelInfo.title }
      : null;

  // 6. Badges check
  const allResultsCount = results.length + 1;
  const newlyUnlockedBadges = evaluateBadges(
    result,
    allResultsCount,
    currentStreak,
    longestStreak,
    existingBadges
  );
  const updatedBadges = Array.from(
    new Set([...existingBadges, ...newlyUnlockedBadges])
  );

  const enrichedResult: TestResult = {
    ...result,
    isPersonalBest,
    previousBestWpm,
    previousBestScore,
    leveledUpTo,
    newlyUnlockedBadges,
  };

  const updatedResults = [enrichedResult, ...results].slice(0, MAX_SAVED_RESULTS);

  writeKey('results', updatedResults);
  writeKey('keyStats', keyStats);
  writeKey('bigramStats', bigramStats);
  writeKey('streakDates', streakDates);
  writeKey('personalBests', personalBests);
  writeKey('xp', newXp);
  writeKey('badges', updatedBadges);

  return enrichedResult;
}

export function deleteResultById(id: string): TestResult[] {
  const current = getResults();
  const filtered = current.filter((r) => r.id !== id);
  writeKey('results', filtered);
  return filtered;
}

export interface ExportDataPayload {
  schemaVersion: number;
  exportedAt: string;
  settings: UserSettings;
  results: TestResult[];
  keyStats: KeyStatsMap;
  bigramStats: BigramStatsMap;
  streakDates: string[];
  xp: number;
  badges: string[];
  personalBests: Record<string, PersonalBestEntry>;
}

export function exportAllData(): string {
  const payload: ExportDataPayload = {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    settings: getSettings(),
    results: getResults(),
    keyStats: getKeyStats(),
    bigramStats: getBigramStats(),
    streakDates: getStreakDates(),
    xp: getXp(),
    badges: getBadges(),
    personalBests: getPersonalBests(),
  };
  return JSON.stringify(payload, null, 2);
}

export function importAllData(jsonString: string): { ok: boolean; error?: string } {
  try {
    const parsed = JSON.parse(jsonString) as Partial<ExportDataPayload>;
    if (!parsed || typeof parsed !== 'object') {
      return { ok: false, error: 'Invalid JSON structure.' };
    }
    if (!Array.isArray(parsed.results)) {
      return { ok: false, error: 'Missing results array in backup file.' };
    }

    if (parsed.settings) saveSettings(parsed.settings);
    writeKey('results', parsed.results.slice(0, MAX_SAVED_RESULTS));
    if (parsed.keyStats) writeKey('keyStats', parsed.keyStats);
    if (parsed.bigramStats) writeKey('bigramStats', parsed.bigramStats);
    if (Array.isArray(parsed.streakDates)) writeKey('streakDates', parsed.streakDates);
    if (typeof parsed.xp === 'number') writeKey('xp', parsed.xp);
    if (Array.isArray(parsed.badges)) writeKey('badges', parsed.badges);
    if (parsed.personalBests) writeKey('personalBests', parsed.personalBests);

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not parse JSON file.',
    };
  }
}

export function resetAllData(): void {
  const keys = [
    'settings',
    'results',
    'keyStats',
    'bigramStats',
    'streakDates',
    'xp',
    'badges',
    'personalBests',
    'notifyEmail',
  ];
  for (const key of keys) {
    const fullKey = `${STORAGE_NAMESPACE}${key}`;
    memoryStore.delete(fullKey);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(fullKey);
      }
    } catch {
      // ignore
    }
  }
}

export function getStorageBytesUsed(): number {
  let bytes = 0;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith(STORAGE_NAMESPACE)) {
          const val = window.localStorage.getItem(k) ?? '';
          bytes += (k.length + val.length) * 2;
        }
      }
      return bytes;
    }
  } catch {
    // fallback
  }
  for (const [k, v] of memoryStore.entries()) {
    bytes += (k.length + v.length) * 2;
  }
  return bytes;
}
