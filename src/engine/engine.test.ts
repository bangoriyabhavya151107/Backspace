import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateBackspaceScore,
  calculateConsistency,
  computeCharacterCounts,
  computeStreaks,
  getLevelInfo,
  rankErrorKeys,
  rankSlowKeys,
} from './scoring';
import { TypingEngine } from './typingEngine';
import {
  resetAllData,
  saveCompletedTest,
  getResults,
  getPersonalBests,
  getXp,
  getBadges,
} from './storage';

test('calculateBackspaceScore computes round(netWPM * (accuracy/100)^2)', () => {
  assert.equal(calculateBackspaceScore(80, 100), 80);
  assert.equal(calculateBackspaceScore(100, 90), 81);
  assert.equal(calculateBackspaceScore(60, 50), 15);
});

test('calculateConsistency clamps between 0 and 100', () => {
  const steady = [
    { second: 1, netWpm: 70, rawWpm: 70, errorsInSecond: 0 },
    { second: 2, netWpm: 70, rawWpm: 70, errorsInSecond: 0 },
    { second: 3, netWpm: 70, rawWpm: 70, errorsInSecond: 0 },
  ];
  assert.equal(calculateConsistency(steady), 100);

  const varied = [
    { second: 1, netWpm: 50, rawWpm: 50, errorsInSecond: 0 },
    { second: 2, netWpm: 70, rawWpm: 70, errorsInSecond: 0 },
    { second: 3, netWpm: 60, rawWpm: 60, errorsInSecond: 0 },
  ];
  const cons = calculateConsistency(varied);
  assert.ok(cons > 80 && cons < 100);
});

test('computeCharacterCounts counts committed Enter as 1 correct char', () => {
  const targets = ['git status', 'git add .'];
  const typed = ['git status', 'git a'];
  const counts = computeCharacterCounts(targets, typed, 1);
  // Line 0: 10 chars + 1 Enter = 11; Line 1: 5 chars = 5 => total 16
  assert.equal(counts.correct, 16);
  assert.equal(counts.incorrect, 0);
  assert.equal(counts.extra, 0);
});

test('getLevelInfo computes levels and titles accurately', () => {
  assert.equal(getLevelInfo(0).level, 1);
  assert.equal(getLevelInfo(0).title, 'Intern');
  assert.equal(getLevelInfo(200).level, 3);
  assert.equal(getLevelInfo(200).title, 'Junior');
  assert.equal(getLevelInfo(800).level, 5);
  assert.equal(getLevelInfo(800).title, 'Mid');
});

test('computeStreaks tracks consecutive and longest streaks', () => {
  const dates = ['2026-11-01', '2026-11-02', '2026-11-04', '2026-11-05'];
  const res = computeStreaks(dates, '2026-11-05');
  assert.equal(res.currentStreak, 2);
  assert.equal(res.longestStreak, 2);
});

test('rankSlowKeys and rankErrorKeys enforce minimum 8 samples', () => {
  const stats = {
    '{': { count: 10, totalLatencyMs: 2400, errors: 2 },
    '}': { count: 5, totalLatencyMs: 3000, errors: 4 },
    '|': { count: 8, totalLatencyMs: 1600, errors: 0 },
  };
  const slow = rankSlowKeys(stats, 8, 5);
  assert.equal(slow.length, 2);
  assert.equal(slow[0].key, '{');
  assert.equal(slow[0].avgLatencyMs, 240);

  const errs = rankErrorKeys(stats, 8, 5);
  assert.equal(errs.length, 1);
  assert.equal(errs[0].key, '{');
  assert.equal(errs[0].errorRate, 20);
});

test('TypingEngine processes keystrokes, backspace, line commits, and result building', () => {
  const engine = new TypingEngine(['ls -la'], {
    category: 'terminal',
    duration: 30,
    level: 'easy',
  });

  assert.equal(engine.getStatus(), 'ready');

  const line = 'ls -la';
  let t = 1000;
  for (const ch of line) {
    t += 120;
    engine.handleKeyDown(ch, t);
  }
  assert.equal(engine.getStatus(), 'running');
  assert.equal(engine.getSnapshot(t).caretCol, 6);

  // Commit line with Enter
  t += 100;
  const commitRes = engine.handleKeyDown('Enter', t);
  assert.equal(commitRes.lineCommitted, true);
  assert.equal(engine.getSnapshot(t).activeLineIndex, 1);

  // Type a few more chars and advance beyond 5 seconds so test qualifies to be saved
  for (const ch of 'ls -la') {
    t += 900;
    engine.handleKeyDown(ch, t);
  }

  engine.finish(t + 1000);
  const { result, shouldSave } = engine.buildResult(Date.now());
  assert.equal(shouldSave, true);
  assert.equal(result.accuracy, 100);
  assert.ok(result.netWpm > 0);

  resetAllData();
  const saved = saveCompletedTest(result);
  assert.equal(saved.isPersonalBest, true);
  assert.equal(getResults().length, 1);
  assert.ok(getXp() > 0);
  assert.ok(getBadges().includes('first-test'));
  assert.ok(getPersonalBests()['terminal|30|easy']);
});
