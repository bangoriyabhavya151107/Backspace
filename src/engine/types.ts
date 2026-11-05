import type { CategorySlug, CodeLanguage, DifficultyLevel, TestDuration } from '../data/content';

export interface KeystrokeEvent {
  t: number; // performance.now() timestamp
  expected: string; // expected character (or '\n' for Enter at end of line)
  typed: string; // actual character typed
  correct: boolean;
  latencyMs: number; // elapsed ms since previous keystroke (0 for first key)
}

export interface PerSecondSample {
  second: number; // 1, 2, 3...
  netWpm: number;
  rawWpm: number;
  errorsInSecond: number;
}

export interface KeyStatEntry {
  count: number;
  totalLatencyMs: number;
  errors: number;
}

export type KeyStatsMap = Record<string, KeyStatEntry>;
export type BigramStatsMap = Record<string, KeyStatEntry>;

export interface ModeConfig {
  category: CategorySlug;
  duration: TestDuration;
  level: DifficultyLevel;
  language?: CodeLanguage;
  stopOnError?: boolean;
  drillKeys?: string[];
}

export interface CharacterCounts {
  correct: number;
  incorrect: number;
  extra: number;
  missed: number;
}

export interface TestResult {
  id: string;
  timestamp: number; // Date.now()
  dateIso: string; // YYYY-MM-DD in local time
  category: CategorySlug;
  duration: TestDuration;
  elapsedSeconds: number;
  level: DifficultyLevel;
  language?: CodeLanguage;
  netWpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  backspaceScore: number;
  characters: CharacterCounts;
  perSecond: PerSecondSample[];
  testKeyStats: KeyStatsMap;
  isPersonalBest?: boolean;
  previousBestWpm?: number | null;
  previousBestScore?: number | null;
  xpEarned: number;
  leveledUpTo?: {
    level: number;
    title: string;
  } | null;
  newlyUnlockedBadges?: string[];
}

export interface PersonalBestEntry {
  key: string; // "category|duration|level"
  category: CategorySlug;
  duration: TestDuration;
  level: DifficultyLevel;
  bestWpm: number;
  bestAccuracy: number;
  bestBackspaceScore: number;
  timestamp: number;
}

export type ThemeMode = 'light' | 'dark' | 'system';
export type CaretStyle = 'block' | 'underline' | 'bar';
export type LineSpacingOption = 'compact' | 'normal' | 'relaxed';

export interface UserSettings {
  theme: ThemeMode;
  fontSize: number; // 20 - 36px, default 28
  lineSpacing: LineSpacingOption;
  caretStyle: CaretStyle;
  keyboardOverlay: boolean;
  soundEnabled: boolean;
  soundVolume: number; // 0 - 100
  stopOnError: boolean;
  reduceMotion: boolean;
  lastCategory: CategorySlug;
  lastDuration: TestDuration;
  lastLevel: DifficultyLevel;
  lastLanguage: CodeLanguage;
}

export type DeveloperTitle =
  | 'Intern'
  | 'Junior'
  | 'Mid'
  | 'Senior'
  | 'Staff'
  | 'Principal';

export interface LevelInfo {
  level: number;
  title: DeveloperTitle;
  xp: number;
  currentLevelMinXp: number;
  nextLevelMinXp: number;
  progressPercent: number;
}

export interface BadgeDefinition {
  id: string;
  name: string;
  requirement: string;
  glyph: string;
}

export interface RankedKeyStat {
  key: string;
  count: number;
  avgLatencyMs: number;
  errorRate: number; // 0 - 100
  errors: number;
}
