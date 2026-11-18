import { CURRICULUM_MODULES, Lesson } from './curriculum';
import { COMMON_WORDS_EXTENDED, QUOTES_POOL } from './practicePools';
import { computeKeyConfidence } from '../engine/adaptiveGenerator';
import { KeyTelemetryDelta } from '../engine/typingEngine';

export type CalendarTrackId = '14-day' | '30-day' | '60-day';

export interface CalendarTrackMeta {
  id: CalendarTrackId;
  name: string;
  tagline: string;
  totalDays: number;
  dailyMinutes: number;
  badge: string;
}

export interface DailyWorkoutTask {
  id: string; // e.g. '30-day-D1-T1'
  taskIndex: 0 | 1 | 2;
  type: 'lesson' | 'adaptive' | 'benchmark';
  title: string;
  subtitle: string;
  fingerTip?: string;
  lessonId?: string;
  allowedKeys: string[];
  targetWpm: number;
  minAccuracy: number;
  durationLabel: string;
  resolveText: (keyStats: Record<string, KeyTelemetryDelta>) => string;
}

export interface CalendarDayPlan {
  trackId: CalendarTrackId;
  dayNumber: number;
  weekNumber: number;
  phaseTitle: string;
  title: string;
  summary: string;
  focusKeys: string[];
  cumulativeKeys: string[];
  estimatedMinutes: number;
  tasks: [DailyWorkoutTask, DailyWorkoutTask, DailyWorkoutTask];
}

export const CALENDAR_TRACKS: Record<CalendarTrackId, CalendarTrackMeta> = {
  '14-day': {
    id: '14-day',
    name: '14-Day Intensive Bootcamp',
    tagline: 'Fast-track full keyboard mastery in two focused weeks (~25 mins/day).',
    totalDays: 14,
    dailyMinutes: 25,
    badge: 'Fast Track',
  },
  '30-day': {
    id: '30-day',
    name: '30-Day Mastery Roadmap',
    tagline: 'Balanced day-by-day progression from Home Row to 45+ WPM fluency (~18 mins/day).',
    totalDays: 30,
    dailyMinutes: 18,
    badge: 'Recommended',
  },
  '60-day': {
    id: '60-day',
    name: '60-Day Gentle Habit Builder',
    tagline: 'Relaxed, bite-sized daily workouts with extra reinforcement days (~10 mins/day).',
    totalDays: 60,
    dailyMinutes: 10,
    badge: 'Relaxed Pace',
  },
};

const ALL_LESSONS: Lesson[] = CURRICULUM_MODULES.flatMap((m) => m.lessons);

// Curated word pool including short Home Row & Top Row words so early lessons have rich real words
const BEGINNER_AND_COMMON_WORDS: string[] = Array.from(
  new Set([
    'sad', 'dad', 'lad', 'fad', 'all', 'fall', 'falls', 'ask', 'asks', 'flask',
    'salad', 'lass', 'shall', 'hall', 'glad', 'flag', 'half', 'glass', 'flash',
    'dash', 'hash', 'had', 'has', 'jag', 'lag', 'sag', 'gag', 'add', 'adds',
    'see', 'fee', 'lie', 'die', 'file', 'life', 'side', 'like', 'slide', 'smile',
    'field', 'desk', 'she', 'he', 'his', 'is', 'if', 'ill', 'fill', 'skill',
    'silk', 'milk', 'kid', 'lid', 'rid', 'red', 'fed', 'led', 'fire', 'hire',
    'wire', 'tire', 'sure', 'rule', 'user', 'fur', 'jar', 'dark', 'rush', 'read',
    'dear', 'fear', 'hear', 'near', 'ear', 'are', 'era', 'tree', 'true', 'try',
    'yet', 'they', 'style', 'dirty', 'thirty', 'first', 'study', 'city', 'duty',
    'low', 'row', 'two', 'how', 'slow', 'word', 'work', 'world', 'write', 'power',
    'follow', 'top', 'pop', 'quit', 'quote', 'quite', 'keep', 'deep', 'sleep',
    'paper', 'people',
    ...COMMON_WORDS_EXTENDED,
  ])
);

function getPhaseTitle(dayNumber: number, totalDays: number): string {
  const progress = dayNumber / totalDays;
  if (progress <= 0.25) return 'Phase 1: Home Row & Top Row Foundation';
  if (progress <= 0.5) return 'Phase 2: Bottom Row & Full Alphabet Reach';
  if (progress <= 0.75) return 'Phase 3: Capitalization, Numbers & Symbols';
  return 'Phase 4: N-Gram Speed & Real-World Fluency';
}

/**
 * Collects every character introduced in lessons 0..maxLessonIdx (inclusive).
 * Ensures a beginner on Day X is ONLY ever asked to type keys taught up to Day X!
 */
function getCumulativeLearnedKeys(maxLessonIdx: number): string[] {
  const seen = new Set<string>();
  for (let i = 0; i <= maxLessonIdx && i < ALL_LESSONS.length; i++) {
    for (const k of ALL_LESSONS[i].focusKeys) {
      if (k !== ' ') seen.add(k);
    }
    for (const ch of ALL_LESSONS[i].text) {
      if (ch !== ' ' && ch !== '\n') seen.add(ch);
    }
  }
  return Array.from(seen);
}

/**
 * Generates an Adaptive Weak-Key Drill strictly constrained to `cumulativeKeys`
 * and heavily weighted toward `todayFocusKeys` + the user's weakest learned keys.
 */
function buildBeginnerSafeAdaptiveDrill(
  cumulativeKeys: string[],
  todayFocusKeys: string[],
  keyStats: Record<string, KeyTelemetryDelta>,
  wordCount: number
): string {
  const allowedSet = new Set(cumulativeKeys);
  const nonSpaceFocus = todayFocusKeys.filter((k) => k !== ' ');

  // Rank cumulative keys by lowest confidence so we prioritize weak/new keys
  const rankedKeys = [...cumulativeKeys].sort((a, b) => {
    const confA = computeKeyConfidence(a.toLowerCase(), true, keyStats[a.toLowerCase()]).confidence;
    const confB = computeKeyConfidence(b.toLowerCase(), true, keyStats[b.toLowerCase()]).confidence;
    return confA - confB;
  });

  const primaryWeakKeys = Array.from(
    new Set([...nonSpaceFocus, ...rankedKeys.slice(0, 4)])
  );

  // Find real English words that can be formed 100% from `allowedSet`
  const validRealWords = BEGINNER_AND_COMMON_WORDS.filter(
    (w) =>
      w.length >= 2 &&
      w.split('').every((ch) => allowedSet.has(ch))
  );

  const focusRealWords = validRealWords.filter((w) =>
    primaryWeakKeys.some((k) => w.includes(k.toLowerCase()))
  );

  const words: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    // If real words exist with the current learned keys (e.g. Day 4+), mix 65% real words + 35% key chords
    if (focusRealWords.length >= 4 && i % 3 !== 0) {
      words.push(focusRealWords[(i * 7 + 3) % focusRealWords.length]);
      continue;
    }

    // Otherwise generate rhythmic finger-chord patterns strictly from cumulativeKeys & primaryWeakKeys
    const chordLen = cumulativeKeys.length <= 4 ? 3 + (i % 2) : 4 + (i % 2);
    let chord = '';
    for (let c = 0; c < chordLen; c++) {
      const pool = c % 2 === 0 && primaryWeakKeys.length > 0 ? primaryWeakKeys : cumulativeKeys;
      const idx = (i * 5 + c * 3) % pool.length;
      chord += pool[idx];
    }
    words.push(chord);
  }

  return words.join(' ');
}

/**
 * Generates a Daily Fluency Benchmark strictly constrained to `cumulativeKeys`.
 */
function buildBeginnerSafeBenchmark(
  cumulativeKeys: string[],
  todayFocusKeys: string[],
  lessonIdx: number,
  wordCount: number,
  dayNumber: number
): string {
  const allowedSet = new Set(cumulativeKeys);

  // Once the full alphabet + basic punctuation + capitals are unlocked (Lesson 18+), we can use real Quotes if all chars are allowed
  if (lessonIdx >= 17) {
    const quote = QUOTES_POOL[(dayNumber - 1) % QUOTES_POOL.length];
    const quoteAllAllowed = quote.text
      .split('')
      .every((ch) => ch === ' ' || allowedSet.has(ch));
    if (quoteAllAllowed) {
      return quote.text;
    }
  }

  const validRealWords = BEGINNER_AND_COMMON_WORDS.filter(
    (w) => w.length >= 2 && w.split('').every((ch) => allowedSet.has(ch))
  );

  // If we have at least 6 real words (e.g. Day 4+ once 'a, s, d, f, j, k, l' are learned), build a real-word fluency test!
  if (validRealWords.length >= 6) {
    const result: string[] = [];
    const hasSemicolon = allowedSet.has(';');
    const hasPeriod = allowedSet.has('.');
    const hasComma = allowedSet.has(',');

    for (let i = 0; i < wordCount; i++) {
      let word = validRealWords[(i * 11 + dayNumber * 3) % validRealWords.length];
      if (i > 0 && word === result[i - 1]) {
        word = validRealWords[(i * 11 + dayNumber * 3 + 1) % validRealWords.length];
      }
      if (i % 5 === 4) {
        if (hasPeriod) word += '.';
        else if (hasComma) word += ',';
        else if (hasSemicolon) word += ';';
      }
      result.push(word);
    }
    return result.join(' ');
  }

  // For Days 1–3 (before vowels 'a' or 'e' are unlocked), build an alternating-hand fluency rhythm test using ONLY learned keys!
  const nonSpaceKeys = cumulativeKeys.filter((k) => k !== ' ');
  const focus = todayFocusKeys.filter((k) => k !== ' ');
  const patterns: string[] = [];

  for (let i = 0; i < wordCount; i++) {
    const len = 3 + (i % 2);
    let token = '';
    for (let j = 0; j < len; j++) {
      const source = j === 0 && focus.length > 0 ? focus : nonSpaceKeys;
      token += source[(i + j * 2) % source.length];
    }
    patterns.push(token);
  }

  return patterns.join(' ');
}

export function generateTrackSchedule(trackId: CalendarTrackId): CalendarDayPlan[] {
  const meta = CALENDAR_TRACKS[trackId] || CALENDAR_TRACKS['30-day'];
  const totalDays = meta.totalDays;
  const days: CalendarDayPlan[] = [];

  for (let day = 1; day <= totalDays; day++) {
    const weekNumber = Math.ceil(day / 7);
    const phaseTitle = getPhaseTitle(day, totalDays);

    // Map day (1..totalDays) onto our 24 core curriculum lessons
    const normalizedRatio = (day - 1) / Math.max(1, totalDays - 1);
    const lessonIdx = Math.min(
      ALL_LESSONS.length - 1,
      Math.floor(normalizedRatio * ALL_LESSONS.length)
    );
    const primaryLesson = ALL_LESSONS[lessonIdx];

    // For 14-day track, combine adjacent lessons so all 24 lessons are covered smoothly
    const secondLessonIdx =
      trackId === '14-day' && lessonIdx + 1 < ALL_LESSONS.length
        ? lessonIdx + 1
        : null;
    const secondaryLesson =
      secondLessonIdx !== null && day % 2 === 0
        ? ALL_LESSONS[secondLessonIdx]
        : null;

    const effectiveMaxLessonIdx = secondaryLesson ? secondLessonIdx! : lessonIdx;
    const cumulativeKeys = getCumulativeLearnedKeys(effectiveMaxLessonIdx);
    const todayFocusKeys = secondaryLesson
      ? Array.from(new Set([...primaryLesson.focusKeys, ...secondaryLesson.focusKeys]))
      : primaryLesson.focusKeys;

    const isReviewDay = totalDays >= 30 && day % 5 === 0;

    const formattedFocusList = todayFocusKeys
      .filter((k) => k !== ' ')
      .slice(0, 6)
      .map((k) => k.toUpperCase())
      .join(', ');

    const formattedCumulativeCount = cumulativeKeys.length;

    const dayTitle = isReviewDay
      ? `Milestone Review: ${primaryLesson.title}`
      : secondaryLesson
      ? `${primaryLesson.title} + ${secondaryLesson.title}`
      : primaryLesson.title;

    const daySummary = isReviewDay
      ? `Consolidate the ${formattedCumulativeCount} keys learned so far (${formattedFocusList}) with zero unlearned keys.`
      : `${primaryLesson.subtitle} (Uses only the ${formattedCumulativeCount} keys taught up to Day ${day}).`;

    const lessonTargetWpm = primaryLesson.targetWpm;
    const lessonMinAcc = primaryLesson.minAccuracy;
    const drillWordCount = trackId === '60-day' ? 16 : 20;

    // Task 1: Core Lesson — Introduces today's target keys
    const task1: DailyWorkoutTask = {
      id: `${trackId}-D${day}-T1`,
      taskIndex: 0,
      type: 'lesson',
      title: `Task 1: New Key Lesson — ${primaryLesson.title}`,
      subtitle: primaryLesson.subtitle,
      fingerTip: primaryLesson.fingerTip,
      lessonId: primaryLesson.id,
      allowedKeys: cumulativeKeys,
      targetWpm: lessonTargetWpm,
      minAccuracy: lessonMinAcc,
      durationLabel: `${Math.round(meta.dailyMinutes * 0.4)} mins`,
      resolveText: () =>
        secondaryLesson
          ? `${primaryLesson.text} ${secondaryLesson.text}`
          : primaryLesson.text,
    };

    // Task 2: Adaptive Weak-Key Drill — Strictly uses ONLY cumulativeKeys learned up to today!
    const task2: DailyWorkoutTask = {
      id: `${trackId}-D${day}-T2`,
      taskIndex: 1,
      type: 'adaptive',
      title: `Task 2: Adaptive Weak-Key Drill (Only Your ${formattedCumulativeCount} Learned Keys)`,
      subtitle: `Targets your slowest keys among [${cumulativeKeys
        .slice(0, 10)
        .map((k) => k.toUpperCase())
        .join(' ')}${cumulativeKeys.length > 10 ? ' …' : ''}] — never asks for unlearned keys!`,
      fingerTip:
        'Focus on smooth accuracy — this drill adapts to whichever of today’s keys felt hardest in Task 1.',
      allowedKeys: cumulativeKeys,
      targetWpm: lessonTargetWpm,
      minAccuracy: lessonMinAcc,
      durationLabel: `${Math.round(meta.dailyMinutes * 0.35)} mins`,
      resolveText: (keyStats) =>
        buildBeginnerSafeAdaptiveDrill(
          cumulativeKeys,
          todayFocusKeys,
          keyStats,
          drillWordCount
        ),
    };

    // Task 3: Daily Fluency Check — Strictly uses ONLY cumulativeKeys learned up to today!
    const task3: DailyWorkoutTask = {
      id: `${trackId}-D${day}-T3`,
      taskIndex: 2,
      type: 'benchmark',
      title:
        effectiveMaxLessonIdx < 3
          ? `Task 3: Home-Row Rhythm Check (${formattedFocusList} Only)`
          : `Task 3: Daily Word Fluency Check (Using Learned Keys Only)`,
      subtitle:
        effectiveMaxLessonIdx < 3
          ? `Build steady alternating-hand speed using only the ${formattedCumulativeCount} anchor keys you learned.`
          : `Real words and phrases built 100% from the ${formattedCumulativeCount} keys you have mastered so far.`,
      fingerTip:
        'Keep your eyes on the screen and trust your fingers to find each learned key by feel.',
      allowedKeys: cumulativeKeys,
      targetWpm: Math.max(16, lessonTargetWpm + 2),
      minAccuracy: lessonMinAcc,
      durationLabel: `${Math.max(2, Math.round(meta.dailyMinutes * 0.25))} mins`,
      resolveText: () =>
        buildBeginnerSafeBenchmark(
          cumulativeKeys,
          todayFocusKeys,
          effectiveMaxLessonIdx,
          drillWordCount,
          day
        ),
    };

    days.push({
      trackId,
      dayNumber: day,
      weekNumber,
      phaseTitle,
      title: dayTitle,
      summary: daySummary,
      focusKeys: todayFocusKeys,
      cumulativeKeys,
      estimatedMinutes: meta.dailyMinutes,
      tasks: [task1, task2, task3],
    });
  }

  return days;
}
