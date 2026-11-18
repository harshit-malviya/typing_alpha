import { KeyTelemetryDelta } from './typingEngine';

/**
 * Standard Keybr-inspired frequency order of English letters:
 * Starts with the 6 most common letters (e, n, i, t, r, l)
 * and unlocks subsequent letters one by one as the user masters the active key.
 */
export const ADAPTIVE_LETTER_ORDER: string[] = [
  'e', 'n', 'i', 't', 'r', 'l',
  's', 'a', 'u', 'o', 'd', 'y',
  'c', 'h', 'g', 'm', 'p', 'b',
  'k', 'v', 'w', 'f', 'z', 'x',
  'q', 'j',
];

export const INITIAL_UNLOCKED_COUNT = 6;

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u', 'y']);

// Curated real English word dictionary for natural adaptive practice
const REAL_WORD_BANK: string[] = [
  'let', 'ten', 'net', 'tin', 'tie', 'ire', 'lit', 'nit', 'ret', 'lin', 'nil', 'til',
  'line', 'tire', 'rent', 'lent', 'tern', 'rite', 'tile', 'lint', 'riel', 'tier', 'rein',
  'enter', 'inter', 'inlet', 'liner', 'liter', 'inert', 'trine', 'tiler', 'relit',
  'star', 'stare', 'rate', 'tear', 'near', 'earn', 'learn', 'seat', 'east', 'rest',
  'satin', 'train', 'stain', 'saint', 'strain', 'listen', 'silent', 'tinsel', 'enlist',
  'round', 'sound', 'found', 'ground', 'under', 'trend', 'stand', 'stone', 'notes', 'toned',
  'radio', 'drain', 'trade', 'tread', 'ouder', 'aloud', 'daily', 'early', 'relay', 'layer',
  'delay', 'ready', 'steady', 'today', 'style', 'story', 'royal', 'loyal', 'cloud', 'clear',
  'clean', 'close', 'scale', 'score', 'trace', 'crate', 'react', 'chart', 'heart', 'earth',
  'share', 'shore', 'short', 'north', 'south', 'other', 'their', 'there', 'three', 'thing',
  'night', 'light', 'right', 'sight', 'might', 'great', 'green', 'grain', 'grand', 'grade',
  'smart', 'small', 'smile', 'frame', 'flame', 'claim', 'prime', 'print', 'point', 'plant',
  'plane', 'plate', 'place', 'space', 'spare', 'spark', 'speak', 'break', 'bread', 'brand',
  'brain', 'bring', 'block', 'black', 'blank', 'began', 'begin', 'table', 'cable', 'noble',
  'value', 'vital', 'valid', 'visit', 'voice', 'water', 'world', 'write', 'power', 'lower',
  'tower', 'crowd', 'crown', 'first', 'field', 'final', 'focus', 'force', 'front', 'fresh',
  'prize', 'zone', 'dozen', 'extra', 'exact', 'index', 'pixel', 'equal', 'quiet', 'quick',
  'quote', 'quest', 'major', 'joint', 'judge', 'juice', 'enjoy',
];

export interface KeyConfidence {
  letter: string;
  unlocked: boolean;
  wpm: number;
  accuracy: number;
  confidence: number; // 0 to 100+
  samples: number;
}

export function computeKeyConfidence(
  letter: string,
  unlocked: boolean,
  stats?: KeyTelemetryDelta,
  targetWpm: number = 32
): KeyConfidence {
  if (!unlocked || !stats || stats.hits + stats.misses === 0) {
    return {
      letter,
      unlocked,
      wpm: 0,
      accuracy: 100,
      confidence: 0,
      samples: 0,
    };
  }

  const total = stats.hits + stats.misses;
  const accuracy = (stats.hits / total) * 100;
  const avgLatencyMs =
    stats.latencySamples > 0 ? stats.totalLatencyMs / stats.latencySamples : 380;
  // 1 word = 5 chars => WPM = 60000 / (avgLatencyMs * 5) = 12000 / avgLatencyMs
  const wpm = Math.min(140, Math.round(12000 / Math.max(85, avgLatencyMs)));

  const sampleFactor = Math.min(1, total / 18);
  const speedRatio = Math.min(1.15, wpm / targetWpm);
  const accPenalty = accuracy >= 94 ? 1 : Math.max(0.25, (accuracy - 70) / 24);

  const confidence = Math.min(100, Math.round(speedRatio * accPenalty * sampleFactor * 100));

  return {
    letter,
    unlocked,
    wpm,
    accuracy: Math.round(accuracy * 10) / 10,
    confidence,
    samples: total,
  };
}

export function evaluateAdaptiveUnlock(
  currentUnlockedCount: number,
  keyStats: Record<string, KeyTelemetryDelta>,
  targetWpm: number = 32
): { nextUnlockedCount: number; newlyUnlockedLetter: string | null } {
  const clamped = Math.max(
    INITIAL_UNLOCKED_COUNT,
    Math.min(ADAPTIVE_LETTER_ORDER.length, currentUnlockedCount)
  );

  if (clamped >= ADAPTIVE_LETTER_ORDER.length) {
    return { nextUnlockedCount: clamped, newlyUnlockedLetter: null };
  }

  const unlockedLetters = ADAPTIVE_LETTER_ORDER.slice(0, clamped);
  const confidences = unlockedLetters.map((l) =>
    computeKeyConfidence(l, true, keyStats[l], targetWpm)
  );

  // Unlock next letter if the latest unlocked letter has confidence >= 80
  // and average confidence across unlocked keys is >= 75
  const latestKey = confidences[confidences.length - 1];
  const avgConfidence =
    confidences.reduce((sum, item) => sum + item.confidence, 0) / confidences.length;

  if (latestKey.confidence >= 80 && avgConfidence >= 72) {
    const nextIdx = clamped;
    return {
      nextUnlockedCount: clamped + 1,
      newlyUnlockedLetter: ADAPTIVE_LETTER_ORDER[nextIdx],
    };
  }

  return { nextUnlockedCount: clamped, newlyUnlockedLetter: null };
}

/**
 * Generates an adaptive practice text of `wordCount` words focusing heavily
 * on the weakest unlocked letter (and newly unlocked letter) using both real words
 * and pronounceable phonetic pseudo-words.
 */
export function generateAdaptiveDrill(
  unlockedCount: number,
  keyStats: Record<string, KeyTelemetryDelta>,
  wordCount: number = 22,
  includeCapitalization: boolean = false,
  includePunctuation: boolean = false,
  targetWpm: number = 32
): { text: string; focusLetter: string; unlockedLetters: string[] } {
  const count = Math.max(
    INITIAL_UNLOCKED_COUNT,
    Math.min(ADAPTIVE_LETTER_ORDER.length, unlockedCount)
  );
  const unlockedLetters = ADAPTIVE_LETTER_ORDER.slice(0, count);
  const unlockedSet = new Set(unlockedLetters);

  // Determine weakest letter among unlocked letters (lowest confidence)
  const confidences = unlockedLetters.map((l) =>
    computeKeyConfidence(l, true, keyStats[l], targetWpm)
  );
  confidences.sort((a, b) => a.confidence - b.confidence);
  const focusLetter = confidences[0]?.letter || unlockedLetters[unlockedLetters.length - 1];
  const secondaryFocus = confidences[1]?.letter || unlockedLetters[0];

  // Filter real words that only use unlocked letters and contain the focus or secondary focus letter
  const matchingFocusRealWords = REAL_WORD_BANK.filter(
    (w) =>
      w.includes(focusLetter) &&
      w.split('').every((ch) => unlockedSet.has(ch))
  );
  const matchingGeneralRealWords = REAL_WORD_BANK.filter((w) =>
    w.split('').every((ch) => unlockedSet.has(ch))
  );

  const unlockedVowels = unlockedLetters.filter((l) => VOWELS.has(l));
  const unlockedConsonants = unlockedLetters.filter((l) => !VOWELS.has(l));

  const buildPhoneticWord = (mustContain: string): string => {
    const len = 3 + Math.floor(Math.random() * 4); // 3 to 6 letters
    const chars: string[] = [];
    const targetPos = Math.floor(Math.random() * len);

    for (let i = 0; i < len; i++) {
      if (i === targetPos) {
        chars.push(mustContain);
        continue;
      }
      const prevChar = i > 0 ? chars[i - 1] : null;
      const wantVowel = prevChar ? !VOWELS.has(prevChar) : Math.random() < 0.35;
      const pool =
        wantVowel && unlockedVowels.length > 0
          ? unlockedVowels
          : unlockedConsonants.length > 0
          ? unlockedConsonants
          : unlockedLetters;
      chars.push(pool[Math.floor(Math.random() * pool.length)]);
    }
    return chars.join('');
  };

  const words: string[] = [];
  const punctMarks = [',', '.', ';', '!'];

  for (let i = 0; i < wordCount; i++) {
    const target = i % 3 === 2 ? secondaryFocus : focusLetter;
    let chosenWord = '';

    if (matchingFocusRealWords.length > 0 && Math.random() < 0.65) {
      chosenWord =
        matchingFocusRealWords[Math.floor(Math.random() * matchingFocusRealWords.length)];
    } else if (matchingGeneralRealWords.length > 0 && Math.random() < 0.35) {
      chosenWord =
        matchingGeneralRealWords[Math.floor(Math.random() * matchingGeneralRealWords.length)];
    } else {
      chosenWord = buildPhoneticWord(target);
    }

    if (includeCapitalization && (i === 0 || Math.random() < 0.18)) {
      chosenWord = chosenWord.charAt(0).toUpperCase() + chosenWord.slice(1);
    }

    if (includePunctuation && i > 0 && i % 5 === 4) {
      chosenWord += punctMarks[Math.floor(Math.random() * punctMarks.length)];
    }

    words.push(chosenWord);
  }

  return {
    text: words.join(' '),
    focusLetter,
    unlockedLetters,
  };
}
