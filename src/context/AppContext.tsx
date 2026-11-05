import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { computeStreaks, getLevelInfo } from '../engine/scoring';
import {
  deleteResultById,
  getBadges,
  getKeyStats,
  getPersonalBests,
  getResults,
  getSettings,
  getStreakDates,
  getXp,
  resetAllData,
  saveCompletedTest,
  saveSettings,
} from '../engine/storage';
import type {
  BigramStatsMap,
  KeyStatsMap,
  LevelInfo,
  PersonalBestEntry,
  TestResult,
  ThemeMode,
  UserSettings,
} from '../engine/types';

interface AppContextValue {
  settings: UserSettings;
  updateSettings: (partial: Partial<UserSettings>) => void;
  cycleTheme: () => void;
  results: TestResult[];
  keyStats: KeyStatsMap;
  currentStreak: number;
  longestStreak: number;
  streakDates: string[];
  levelInfo: LevelInfo;
  badges: string[];
  personalBests: Record<string, PersonalBestEntry>;
  lastResult: TestResult | null;
  setLastResult: (res: TestResult | null) => void;
  recordTestResult: (result: TestResult, bigramDeltas?: BigramStatsMap) => TestResult;
  deleteResult: (id: string) => void;
  refreshFromStorage: () => void;
  wipeAllData: () => void;
  isArenaFocused: boolean;
  setIsArenaFocused: (focused: boolean) => void;
  isFocusMode: boolean;
  setIsFocusMode: (active: boolean) => void;
  isShortcutsOpen: boolean;
  setIsShortcutsOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function applyThemeToDOM(theme: ThemeMode, reduceMotion: boolean): void {
  if (typeof document === 'undefined') return;
  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  const root = document.documentElement;
  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  if (reduceMotion) {
    root.classList.add('reduce-motion');
  } else {
    root.classList.remove('reduce-motion');
  }

  const metaTheme = document.getElementById('meta-theme-color');
  if (metaTheme) {
    metaTheme.setAttribute('content', isDark ? '#14110D' : '#F2EDE4');
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettingsState] = useState<UserSettings>(() => getSettings());
  const [results, setResults] = useState<TestResult[]>(() => getResults());
  const [keyStats, setKeyStats] = useState<KeyStatsMap>(() => getKeyStats());
  const [streakDates, setStreakDates] = useState<string[]>(() => getStreakDates());
  const [xp, setXp] = useState<number>(() => getXp());
  const [badges, setBadges] = useState<string[]>(() => getBadges());
  const [personalBests, setPersonalBests] = useState<Record<string, PersonalBestEntry>>(() =>
    getPersonalBests()
  );
  const [lastResult, setLastResult] = useState<TestResult | null>(() => {
    const initial = getResults();
    return initial.length > 0 ? initial[0] : null;
  });

  const [isArenaFocused, setIsArenaFocused] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  const refreshFromStorage = useCallback(() => {
    const s = getSettings();
    const r = getResults();
    setSettingsState(s);
    setResults(r);
    setKeyStats(getKeyStats());
    setStreakDates(getStreakDates());
    setXp(getXp());
    setBadges(getBadges());
    setPersonalBests(getPersonalBests());
    if (r.length > 0) {
      setLastResult(r[0]);
    }
    applyThemeToDOM(s.theme, s.reduceMotion);
  }, []);

  useEffect(() => {
    applyThemeToDOM(settings.theme, settings.reduceMotion);
    if (settings.theme === 'system' && typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyThemeToDOM('system', settings.reduceMotion);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
    return undefined;
  }, [settings.theme, settings.reduceMotion]);

  const updateSettings = useCallback((partial: Partial<UserSettings>) => {
    const next = saveSettings(partial);
    setSettingsState(next);
    applyThemeToDOM(next.theme, next.reduceMotion);
  }, []);

  const cycleTheme = useCallback(() => {
    const order: ThemeMode[] = ['light', 'dark', 'system'];
    const nextTheme = order[(order.indexOf(settings.theme) + 1) % order.length];
    updateSettings({ theme: nextTheme });
  }, [settings.theme, updateSettings]);

  const recordTestResult = useCallback(
    (result: TestResult, bigramDeltas?: BigramStatsMap): TestResult => {
      const enriched = saveCompletedTest(result, bigramDeltas);
      setLastResult(enriched);
      setResults(getResults());
      setKeyStats(getKeyStats());
      setStreakDates(getStreakDates());
      setXp(getXp());
      setBadges(getBadges());
      setPersonalBests(getPersonalBests());
      return enriched;
    },
    []
  );

  const deleteResult = useCallback((id: string) => {
    const updated = deleteResultById(id);
    setResults(updated);
  }, []);

  const wipeAllData = useCallback(() => {
    resetAllData();
    const freshSettings = getSettings();
    setSettingsState(freshSettings);
    setResults([]);
    setKeyStats({});
    setStreakDates([]);
    setXp(0);
    setBadges([]);
    setPersonalBests({});
    setLastResult(null);
    applyThemeToDOM(freshSettings.theme, freshSettings.reduceMotion);
  }, []);

  const { currentStreak, longestStreak } = computeStreaks(streakDates);
  const levelInfo = getLevelInfo(xp);

  return (
    <AppContext.Provider
      value={{
        settings,
        updateSettings,
        cycleTheme,
        results,
        keyStats,
        currentStreak,
        longestStreak,
        streakDates,
        levelInfo,
        badges,
        personalBests,
        lastResult,
        setLastResult,
        recordTestResult,
        deleteResult,
        refreshFromStorage,
        wipeAllData,
        isArenaFocused,
        setIsArenaFocused,
        isFocusMode,
        setIsFocusMode,
        isShortcutsOpen,
        setIsShortcutsOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within AppProvider');
  }
  return ctx;
}
