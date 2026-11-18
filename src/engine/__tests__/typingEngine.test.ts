import { describe, it, expect } from 'vitest';
import {
  createInitialTypingState,
  processKeystroke,
  calculateMetrics,
} from '../typingEngine';
import {
  generateAdaptiveDrill,
  computeKeyConfidence,
  evaluateAdaptiveUnlock,
  INITIAL_UNLOCKED_COUNT,
} from '../adaptiveGenerator';

describe('typingEngine', () => {
  it('advances cursor on correct keystrokes and completes at the end of targetText', () => {
    let state = createInitialTypingState('cat');
    const t0 = 1000;

    let res = processKeystroke(state, 'c', 'stop-on-error', t0);
    expect(res.outcome).toBe('correct');
    expect(res.nextState.cursorIndex).toBe(1);

    res = processKeystroke(res.nextState, 'a', 'stop-on-error', t0 + 200);
    expect(res.nextState.cursorIndex).toBe(2);

    res = processKeystroke(res.nextState, 't', 'stop-on-error', t0 + 400);
    expect(res.nextState.isCompleted).toBe(true);
    expect(res.nextState.cursorIndex).toBe(3);

    const metrics = calculateMetrics(res.nextState, t0 + 400);
    expect(metrics.accuracy).toBe(100);
    expect(metrics.netWpm).toBeGreaterThan(0);
  });

  it('blocks cursor movement on wrong key in stop-on-error mode until right key is pressed', () => {
    let state = createInitialTypingState('fj');
    const t0 = 1000;

    const wrong = processKeystroke(state, 'k', 'stop-on-error', t0);
    expect(wrong.outcome).toBe('error');
    expect(wrong.nextState.cursorIndex).toBe(0);
    expect(wrong.nextState.blockedErrorChar).toBe('k');

    const right = processKeystroke(wrong.nextState, 'f', 'stop-on-error', t0 + 250);
    expect(right.outcome).toBe('correct');
    expect(right.nextState.cursorIndex).toBe(1);
    expect(right.nextState.blockedErrorChar).toBeNull();
    expect(right.nextState.keyStatsDelta['f'].hits).toBe(1);
    expect(right.nextState.keyStatsDelta['f'].misses).toBe(1);
  });

  it('advances cursor on wrong key in type-through mode and allows Backspace correction', () => {
    let state = createInitialTypingState('ab');
    const t0 = 1000;

    const wrong = processKeystroke(state, 'z', 'type-through', t0);
    expect(wrong.outcome).toBe('error');
    expect(wrong.nextState.cursorIndex).toBe(1);
    expect(wrong.nextState.typedChars[0]).toBe('z');

    const back = processKeystroke(wrong.nextState, 'Backspace', 'type-through', t0 + 150);
    expect(back.outcome).toBe('backspace');
    expect(back.nextState.cursorIndex).toBe(0);
    expect(back.nextState.typedChars[0]).toBeNull();
  });
});

describe('adaptiveGenerator', () => {
  it('generates words containing only unlocked letters and targets the focus key', () => {
    const drill = generateAdaptiveDrill(INITIAL_UNLOCKED_COUNT, {}, 15);
    expect(drill.unlockedLetters).toHaveLength(INITIAL_UNLOCKED_COUNT);
    expect(drill.text.split(' ')).toHaveLength(15);

    const allowed = new Set([...drill.unlockedLetters, ' ']);
    for (const ch of drill.text) {
      expect(allowed.has(ch)).toBe(true);
    }
  });

  it('unlocks the next letter when all current unlocked keys have high confidence', () => {
    const highStats = {
      e: { hits: 30, misses: 0, totalLatencyMs: 6000, latencySamples: 30 },
      n: { hits: 30, misses: 0, totalLatencyMs: 6000, latencySamples: 30 },
      i: { hits: 30, misses: 0, totalLatencyMs: 6000, latencySamples: 30 },
      t: { hits: 30, misses: 0, totalLatencyMs: 6000, latencySamples: 30 },
      r: { hits: 30, misses: 0, totalLatencyMs: 6000, latencySamples: 30 },
      l: { hits: 30, misses: 0, totalLatencyMs: 6000, latencySamples: 30 },
    };

    const conf = computeKeyConfidence('l', true, highStats.l, 32);
    expect(conf.confidence).toBeGreaterThanOrEqual(80);

    const unlockRes = evaluateAdaptiveUnlock(6, highStats, 32);
    expect(unlockRes.nextUnlockedCount).toBe(7);
    expect(unlockRes.newlyUnlockedLetter).toBe('s');
  });
});


import { generateTrackSchedule } from '../../data/learningCalendar';

describe('learningCalendar', () => {
  it('generates complete 14-day, 30-day, and 60-day study schedules where every task ONLY uses keys taught up to that day', () => {
    const t14 = generateTrackSchedule('14-day');
    const t30 = generateTrackSchedule('30-day');
    const t60 = generateTrackSchedule('60-day');

    expect(t14).toHaveLength(14);
    expect(t30).toHaveLength(30);
    expect(t60).toHaveLength(60);

    // Day 1 of 30-day track teaches F & J only: verify Task 1, Task 2, and Task 3 ONLY contain 'f', 'j', and ' '
    const day1 = t30[0];
    expect(day1.cumulativeKeys).toEqual(['f', 'j']);
    for (const task of day1.tasks) {
      const text = task.resolveText({});
      expect(text.length).toBeGreaterThan(15);
      for (const ch of text) {
        expect(['f', 'j', ' '].includes(ch)).toBe(true);
      }
    }

    // Verify across all 30 days that no task ever asks for a key outside that day's cumulativeKeys
    for (const dayPlan of t30) {
      expect(dayPlan.tasks).toHaveLength(3);
      const allowed = new Set([...dayPlan.cumulativeKeys, ' ', '\n']);
      for (const task of dayPlan.tasks) {
        const text = task.resolveText({});
        expect(text.length).toBeGreaterThan(10);
        for (const ch of text) {
          expect(allowed.has(ch)).toBe(true);
        }
      }
    }
  });
});
