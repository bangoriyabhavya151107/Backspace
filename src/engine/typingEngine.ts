import {
  calculateBackspaceScore,
  calculateConsistency,
  calculateLiveMetrics,
  calculateXpForTest,
  computeCharacterCounts,
  formatLocalDateIso,
  shuffleArray,
} from './scoring';
import type {
  BigramStatsMap,
  KeyStatsMap,
  KeystrokeEvent,
  ModeConfig,
  PerSecondSample,
  TestResult,
} from './types';

export type EngineStatus = 'ready' | 'running' | 'finished' | 'cancelled';

export interface EngineSnapshot {
  status: EngineStatus;
  targetLines: string[];
  typedLines: string[];
  activeLineIndex: number;
  caretCol: number;
  elapsedMs: number;
  timeLeftSeconds: number;
  netWpm: number;
  rawWpm: number;
  accuracy: number;
  errors: number;
}

const IGNORED_KEYS = new Set([
  'Shift',
  'Control',
  'Alt',
  'Meta',
  'CapsLock',
  'NumLock',
  'ScrollLock',
  'ContextMenu',
  'Dead',
  'Process',
  'Unidentified',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Home',
  'End',
  'PageUp',
  'PageDown',
  'Insert',
  'Delete',
  'F1',
  'F2',
  'F3',
  'F4',
  'F5',
  'F6',
  'F7',
  'F8',
  'F9',
  'F10',
  'F11',
  'F12',
]);

export class TypingEngine {
  private bank: string[];
  private shuffledQueue: string[] = [];
  private config: ModeConfig;
  private status: EngineStatus = 'ready';
  private targetLines: string[] = [];
  private typedLines: string[] = [];
  private activeLineIndex = 0;
  private keystrokes: KeystrokeEvent[] = [];
  private perSecondSamples: PerSecondSample[] = [];
  private startPerfTime: number | null = null;
  private endPerfTime: number | null = null;
  private lastKeystrokePerfTime: number | null = null;
  private lastSampledSecond = 0;

  constructor(bank: string[], config: ModeConfig) {
    this.bank = bank.length > 0 ? [...bank] : ['git status'];
    this.config = config;
    this.reset(this.bank, config);
  }

  public reset(newBank?: string[], newConfig?: ModeConfig): void {
    if (newBank && newBank.length > 0) {
      this.bank = [...newBank];
    }
    if (newConfig) {
      this.config = newConfig;
    }
    this.status = 'ready';
    this.shuffledQueue = [];
    this.targetLines = [];
    this.typedLines = [];
    this.activeLineIndex = 0;
    this.keystrokes = [];
    this.perSecondSamples = [];
    this.startPerfTime = null;
    this.endPerfTime = null;
    this.lastKeystrokePerfTime = null;
    this.lastSampledSecond = 0;

    // Seed initial 12 lines so 4-line viewport always has lookahead
    this.ensureLinesAhead(12);
  }

  private ensureLinesAhead(minRemaining: number): void {
    while (this.targetLines.length - this.activeLineIndex < minRemaining) {
      if (this.shuffledQueue.length === 0) {
        this.shuffledQueue = shuffleArray(this.bank);
        // Prevent immediate consecutive duplicate across shuffle boundaries
        const lastTarget = this.targetLines[this.targetLines.length - 1];
        if (
          this.shuffledQueue.length > 1 &&
          lastTarget &&
          this.shuffledQueue[0] === lastTarget
        ) {
          const first = this.shuffledQueue.shift()!;
          this.shuffledQueue.push(first);
        }
      }
      const nextLine = this.shuffledQueue.shift()!;
      this.targetLines.push(nextLine);
      this.typedLines.push('');
    }
  }

  public getStatus(): EngineStatus {
    return this.status;
  }

  public getConfig(): ModeConfig {
    return this.config;
  }

  public getNextExpectedChar(): string {
    const target = this.targetLines[this.activeLineIndex] ?? '';
    const typed = this.typedLines[this.activeLineIndex] ?? '';
    if (typed.length < target.length) {
      return target[typed.length];
    }
    return 'Enter';
  }

  /**
   * Processes a keystroke and returns whether the active line / test state changed.
   */
  public handleKeyDown(
    key: string,
    nowPerf: number = performance.now(),
    modifiers?: { ctrlKey?: boolean; metaKey?: boolean; altKey?: boolean; isComposing?: boolean }
  ): {
    consumed: boolean;
    startedNow: boolean;
    lineCommitted: boolean;
    finishedNow: boolean;
    wasCorrect?: boolean;
  } {
    if (modifiers?.isComposing) {
      return { consumed: false, startedNow: false, lineCommitted: false, finishedNow: false };
    }
    if (modifiers?.ctrlKey || modifiers?.metaKey || modifiers?.altKey) {
      return { consumed: false, startedNow: false, lineCommitted: false, finishedNow: false };
    }
    if (this.status === 'finished' || this.status === 'cancelled') {
      return { consumed: false, startedNow: false, lineCommitted: false, finishedNow: false };
    }
    if (IGNORED_KEYS.has(key)) {
      return { consumed: false, startedNow: false, lineCommitted: false, finishedNow: false };
    }

    if (key === 'Escape') {
      this.status = 'cancelled';
      return { consumed: true, startedNow: false, lineCommitted: false, finishedNow: false };
    }

    const currentTarget = this.targetLines[this.activeLineIndex] ?? '';
    const currentTyped = this.typedLines[this.activeLineIndex] ?? '';

    if (key === 'Backspace') {
      if (currentTyped.length > 0) {
        this.typedLines[this.activeLineIndex] = currentTyped.slice(0, -1);
      }
      return { consumed: true, startedNow: false, lineCommitted: false, finishedNow: false };
    }

    // Only accept single printable characters or Enter
    if (key !== 'Enter' && key.length !== 1) {
      return { consumed: false, startedNow: false, lineCommitted: false, finishedNow: false };
    }

    let startedNow = false;
    if (this.status === 'ready') {
      this.status = 'running';
      this.startPerfTime = nowPerf;
      startedNow = true;
    }

    // Check if timer already expired
    const elapsedMs = this.startPerfTime !== null ? Math.max(0, nowPerf - this.startPerfTime) : 0;
    if (elapsedMs >= this.config.duration * 1000) {
      this.finish(nowPerf);
      return { consumed: true, startedNow, lineCommitted: false, finishedNow: true };
    }

    const rawLatency =
      this.lastKeystrokePerfTime !== null ? Math.max(0, nowPerf - this.lastKeystrokePerfTime) : 0;
    // Ignore gaps over 2000ms per specification
    const latencyMs = rawLatency > 2000 ? 0 : Math.round(rawLatency);
    this.lastKeystrokePerfTime = nowPerf;

    if (key === 'Enter') {
      // Enter commits the line when at or past the end of the line
      if (currentTyped.length >= currentTarget.length) {
        const isCleanCommit = currentTyped === currentTarget;
        this.keystrokes.push({
          t: nowPerf,
          expected: '\n',
          typed: '\n',
          correct: isCleanCommit,
          latencyMs,
        });
        this.activeLineIndex++;
        this.ensureLinesAhead(10);
        return {
          consumed: true,
          startedNow,
          lineCommitted: true,
          finishedNow: false,
          wasCorrect: isCleanCommit,
        };
      } else {
        // Pressing Enter before finishing the line is ignored unless they typed at least 1 char
        return { consumed: true, startedNow, lineCommitted: false, finishedNow: false };
      }
    }

    // Printable character
    const caretCol = currentTyped.length;
    const expectedChar =
      caretCol < currentTarget.length ? currentTarget[caretCol] : '';
    const isCorrect = expectedChar !== '' && key === expectedChar;

    this.keystrokes.push({
      t: nowPerf,
      expected: expectedChar || key,
      typed: key,
      correct: isCorrect,
      latencyMs,
    });

    // If stopOnError is enabled and character is wrong, do not advance caret
    if (this.config.stopOnError && !isCorrect) {
      return {
        consumed: true,
        startedNow,
        lineCommitted: false,
        finishedNow: false,
        wasCorrect: false,
      };
    }

    // Cap extra characters at 16 beyond line length to prevent layout overflow
    if (currentTyped.length < currentTarget.length + 16) {
      this.typedLines[this.activeLineIndex] = currentTyped + key;
    }

    return {
      consumed: true,
      startedNow,
      lineCommitted: false,
      finishedNow: false,
      wasCorrect: isCorrect,
    };
  }

  /**
   * Called on a periodic interval (e.g. 250ms) to record per-second samples and check timer completion.
   */
  public tick(nowPerf: number = performance.now()): { finishedNow: boolean } {
    if (this.status !== 'running' || this.startPerfTime === null) {
      return { finishedNow: false };
    }

    const elapsedMs = Math.max(0, nowPerf - this.startPerfTime);
    const currentWholeSecond = Math.floor(elapsedMs / 1000);

    while (
      this.lastSampledSecond < currentWholeSecond &&
      this.lastSampledSecond < this.config.duration
    ) {
      this.lastSampledSecond++;
      const sampleSecond = this.lastSampledSecond;
      const sampleEndPerf = this.startPerfTime + sampleSecond * 1000;
      const sampleStartPerf = sampleEndPerf - 1000;

      const strokesUpToNow = this.keystrokes.filter((k) => k.t <= sampleEndPerf);
      const strokesInSecond = this.keystrokes.filter(
        (k) => k.t > sampleStartPerf && k.t <= sampleEndPerf
      );
      const errorsInSecond = strokesInSecond.filter((k) => !k.correct).length;

      const live = calculateLiveMetrics(
        this.targetLines,
        this.typedLines,
        this.activeLineIndex,
        strokesUpToNow,
        sampleSecond * 1000
      );

      this.perSecondSamples.push({
        second: sampleSecond,
        netWpm: live.netWpm,
        rawWpm: live.rawWpm,
        errorsInSecond,
      });
    }

    if (elapsedMs >= this.config.duration * 1000) {
      this.finish(this.startPerfTime + this.config.duration * 1000);
      return { finishedNow: true };
    }

    return { finishedNow: false };
  }

  public finish(nowPerf: number = performance.now()): void {
    if (this.status === 'finished' || this.status === 'cancelled') return;
    if (this.startPerfTime === null) {
      this.status = 'cancelled';
      return;
    }
    this.endPerfTime = nowPerf;
    this.status = 'finished';

    // Ensure at least one per-second sample exists
    if (this.perSecondSamples.length === 0) {
      const elapsedMs = Math.max(1000, nowPerf - this.startPerfTime);
      const live = calculateLiveMetrics(
        this.targetLines,
        this.typedLines,
        this.activeLineIndex,
        this.keystrokes,
        elapsedMs
      );
      this.perSecondSamples.push({
        second: 1,
        netWpm: live.netWpm,
        rawWpm: live.rawWpm,
        errorsInSecond: this.keystrokes.filter((k) => !k.correct).length,
      });
    }
  }

  public getSnapshot(nowPerf: number = performance.now()): EngineSnapshot {
    const elapsedMs =
      this.startPerfTime !== null
        ? Math.min(
            this.config.duration * 1000,
            Math.max(0, (this.endPerfTime ?? nowPerf) - this.startPerfTime)
          )
        : 0;

    const timeLeftSeconds = Math.max(
      0,
      Math.ceil((this.config.duration * 1000 - elapsedMs) / 1000)
    );

    const live = calculateLiveMetrics(
      this.targetLines,
      this.typedLines,
      this.activeLineIndex,
      this.keystrokes,
      elapsedMs
    );

    const currentTyped = this.typedLines[this.activeLineIndex] ?? '';

    return {
      status: this.status,
      targetLines: this.targetLines,
      typedLines: this.typedLines,
      activeLineIndex: this.activeLineIndex,
      caretCol: currentTyped.length,
      elapsedMs,
      timeLeftSeconds,
      netWpm: live.netWpm,
      rawWpm: live.rawWpm,
      accuracy: live.accuracy,
      errors: live.errors,
    };
  }

  public buildResult(nowTimestamp: number = Date.now()): {
    result: TestResult;
    shouldSave: boolean;
    bigramDeltas: BigramStatsMap;
  } {
    const elapsedMs =
      this.startPerfTime !== null && this.endPerfTime !== null
        ? Math.max(0, this.endPerfTime - this.startPerfTime)
        : 0;
    const elapsedSeconds = Math.round(elapsedMs / 1000);

    const live = calculateLiveMetrics(
      this.targetLines,
      this.typedLines,
      this.activeLineIndex,
      this.keystrokes,
      elapsedMs
    );

    const characters = computeCharacterCounts(
      this.targetLines,
      this.typedLines,
      this.activeLineIndex
    );

    const consistency = calculateConsistency(this.perSecondSamples);
    const backspaceScore = calculateBackspaceScore(live.netWpm, live.accuracy);
    const xpEarned = calculateXpForTest(backspaceScore);

    const testKeyStats: KeyStatsMap = {};
    const bigramDeltas: BigramStatsMap = {};

    for (let i = 0; i < this.keystrokes.length; i++) {
      const stroke = this.keystrokes[i];
      const expected = stroke.expected;
      if (!expected || expected === '\n') continue;

      if (!testKeyStats[expected]) {
        testKeyStats[expected] = { count: 0, totalLatencyMs: 0, errors: 0 };
      }
      testKeyStats[expected].count += 1;
      testKeyStats[expected].totalLatencyMs += stroke.latencyMs;
      if (!stroke.correct) {
        testKeyStats[expected].errors += 1;
      }

      if (i > 0) {
        const prevExpected = this.keystrokes[i - 1].expected;
        if (prevExpected && prevExpected !== '\n' && stroke.latencyMs > 0) {
          const bg = `${prevExpected}${expected}`;
          if (!bigramDeltas[bg]) {
            bigramDeltas[bg] = { count: 0, totalLatencyMs: 0, errors: 0 };
          }
          bigramDeltas[bg].count += 1;
          bigramDeltas[bg].totalLatencyMs += stroke.latencyMs;
          if (!stroke.correct) {
            bigramDeltas[bg].errors += 1;
          }
        }
      }
    }

    // Spec: A test is saved only if at least 5 seconds were typed and at least 10 characters.
    const totalTypedChars = this.keystrokes.length;
    const shouldSave =
      this.status === 'finished' && elapsedSeconds >= 5 && totalTypedChars >= 10;

    const result: TestResult = {
      id: `test_${nowTimestamp}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: nowTimestamp,
      dateIso: formatLocalDateIso(nowTimestamp),
      category: this.config.category,
      duration: this.config.duration,
      elapsedSeconds,
      level: this.config.level,
      language: this.config.language,
      netWpm: live.netWpm,
      rawWpm: live.rawWpm,
      accuracy: live.accuracy,
      consistency,
      backspaceScore,
      characters,
      perSecond: [...this.perSecondSamples],
      testKeyStats,
      xpEarned,
    };

    return { result, shouldSave, bigramDeltas };
  }
}
