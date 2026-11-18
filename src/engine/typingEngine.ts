export type ErrorMode = 'stop-on-error' | 'type-through';

export interface KeyTelemetryDelta {
  hits: number;
  misses: number;
  totalLatencyMs: number;
  latencySamples: number;
}

export interface TimelinePoint {
  second: number;
  wpm: number;
  rawWpm: number;
  accuracy: number;
}

export interface TypingState {
  targetText: string;
  cursorIndex: number;
  typedChars: (string | null)[];
  hadErrorAt: boolean[];
  blockedErrorChar: string | null;
  totalKeystrokes: number;
  correctKeystrokes: number;
  errorKeystrokes: number;
  startTimeMs: number | null;
  endTimeMs: number | null;
  lastKeystrokeMs: number | null;
  keyStatsDelta: Record<string, KeyTelemetryDelta>;
  isCompleted: boolean;
}

export interface TypingMetrics {
  netWpm: number;
  rawWpm: number;
  accuracy: number;
  elapsedSeconds: number;
  correctChars: number;
  uncorrectedErrors: number;
  totalKeystrokes: number;
  errorKeystrokes: number;
  stars: 0 | 1 | 2 | 3;
}

export function createInitialTypingState(targetText: string): TypingState {
  const normalized = targetText.replace(/\r\n/g, '\n');
  return {
    targetText: normalized,
    cursorIndex: 0,
    typedChars: new Array(normalized.length).fill(null),
    hadErrorAt: new Array(normalized.length).fill(false),
    blockedErrorChar: null,
    totalKeystrokes: 0,
    correctKeystrokes: 0,
    errorKeystrokes: 0,
    startTimeMs: null,
    endTimeMs: null,
    lastKeystrokeMs: null,
    keyStatsDelta: {},
    isCompleted: normalized.length === 0,
  };
}

function recordKeyTelemetry(
  deltaMap: Record<string, KeyTelemetryDelta>,
  expectedChar: string,
  isHit: boolean,
  latencyMs: number | null
): Record<string, KeyTelemetryDelta> {
  const key = expectedChar.toLowerCase();
  const prev = deltaMap[key] || {
    hits: 0,
    misses: 0,
    totalLatencyMs: 0,
    latencySamples: 0,
  };

  const validLatency =
    latencyMs !== null && latencyMs >= 20 && latencyMs <= 4000 ? latencyMs : null;

  return {
    ...deltaMap,
    [key]: {
      hits: prev.hits + (isHit ? 1 : 0),
      misses: prev.misses + (isHit ? 0 : 1),
      totalLatencyMs: prev.totalLatencyMs + (isHit && validLatency ? validLatency : 0),
      latencySamples: prev.latencySamples + (isHit && validLatency ? 1 : 0),
    },
  };
}

export function processKeystroke(
  state: TypingState,
  pressedKey: string,
  errorMode: ErrorMode,
  nowMs: number = Date.now()
): { nextState: TypingState; outcome: 'correct' | 'error' | 'backspace' | 'ignored' } {
  if (state.isCompleted || state.targetText.length === 0) {
    return { nextState: state, outcome: 'ignored' };
  }

  // Handle Backspace
  if (pressedKey === 'Backspace') {
    if (state.blockedErrorChar !== null) {
      return {
        nextState: {
          ...state,
          blockedErrorChar: null,
        },
        outcome: 'backspace',
      };
    }

    if (errorMode === 'type-through' && state.cursorIndex > 0) {
      const prevIdx = state.cursorIndex - 1;
      const nextTyped = [...state.typedChars];
      nextTyped[prevIdx] = null;
      return {
        nextState: {
          ...state,
          cursorIndex: prevIdx,
          typedChars: nextTyped,
          lastKeystrokeMs: nowMs,
        },
        outcome: 'backspace',
      };
    }
    return { nextState: state, outcome: 'ignored' };
  }

  // Normalize Enter to '\n'
  const inputChar = pressedKey === 'Enter' ? '\n' : pressedKey;

  // Ignore non-printable keys
  if (inputChar.length !== 1) {
    return { nextState: state, outcome: 'ignored' };
  }

  const startTimeMs = state.startTimeMs ?? nowMs;
  const latencyMs = state.lastKeystrokeMs !== null ? nowMs - state.lastKeystrokeMs : null;
  const expectedChar = state.targetText[state.cursorIndex];
  const isCorrect = inputChar === expectedChar;

  const updatedTelemetry = recordKeyTelemetry(
    state.keyStatsDelta,
    expectedChar,
    isCorrect,
    latencyMs
  );

  if (isCorrect) {
    const nextTyped = [...state.typedChars];
    nextTyped[state.cursorIndex] = inputChar;
    const nextCursor = state.cursorIndex + 1;
    const isCompleted = nextCursor >= state.targetText.length;

    return {
      nextState: {
        ...state,
        cursorIndex: nextCursor,
        typedChars: nextTyped,
        blockedErrorChar: null,
        totalKeystrokes: state.totalKeystrokes + 1,
        correctKeystrokes: state.correctKeystrokes + 1,
        startTimeMs,
        endTimeMs: isCompleted ? nowMs : null,
        lastKeystrokeMs: nowMs,
        keyStatsDelta: updatedTelemetry,
        isCompleted,
      },
      outcome: 'correct',
    };
  }

  // Incorrect keystroke
  const nextHadError = [...state.hadErrorAt];
  nextHadError[state.cursorIndex] = true;

  if (errorMode === 'stop-on-error') {
    return {
      nextState: {
        ...state,
        hadErrorAt: nextHadError,
        blockedErrorChar: inputChar,
        totalKeystrokes: state.totalKeystrokes + 1,
        errorKeystrokes: state.errorKeystrokes + 1,
        startTimeMs,
        lastKeystrokeMs: nowMs,
        keyStatsDelta: updatedTelemetry,
      },
      outcome: 'error',
    };
  }

  // Type-through mode: advance cursor and record wrong character
  const nextTyped = [...state.typedChars];
  nextTyped[state.cursorIndex] = inputChar;
  const nextCursor = state.cursorIndex + 1;
  const isCompleted = nextCursor >= state.targetText.length;

  return {
    nextState: {
      ...state,
      cursorIndex: nextCursor,
      typedChars: nextTyped,
      hadErrorAt: nextHadError,
      blockedErrorChar: null,
      totalKeystrokes: state.totalKeystrokes + 1,
      errorKeystrokes: state.errorKeystrokes + 1,
      startTimeMs,
      endTimeMs: isCompleted ? nowMs : null,
      lastKeystrokeMs: nowMs,
      keyStatsDelta: updatedTelemetry,
      isCompleted,
    },
    outcome: 'error',
  };
}

export function calculateMetrics(
  state: TypingState,
  nowMs: number = Date.now(),
  targetWpm: number = 25,
  minAccuracy: number = 92
): TypingMetrics {
  if (state.startTimeMs === null || state.totalKeystrokes === 0) {
    return {
      netWpm: 0,
      rawWpm: 0,
      accuracy: 100,
      elapsedSeconds: 0,
      correctChars: 0,
      uncorrectedErrors: 0,
      totalKeystrokes: 0,
      errorKeystrokes: 0,
      stars: 0,
    };
  }

  const effectiveEnd = state.endTimeMs ?? nowMs;
  const elapsedMs = Math.max(500, effectiveEnd - state.startTimeMs);
  const elapsedSeconds = elapsedMs / 1000;
  const elapsedMinutes = elapsedSeconds / 60;

  let correctChars = 0;
  let uncorrectedErrors = 0;
  for (let i = 0; i < state.cursorIndex; i++) {
    if (state.typedChars[i] === state.targetText[i]) {
      correctChars++;
    } else if (state.typedChars[i] !== null) {
      uncorrectedErrors++;
    }
  }

  const rawWpm = Math.round(state.totalKeystrokes / 5 / elapsedMinutes);
  const netWpmFloat = (correctChars / 5 - uncorrectedErrors) / elapsedMinutes;
  const netWpm = Math.max(0, Math.round(netWpmFloat));
  const accuracy =
    state.totalKeystrokes > 0
      ? Math.round((state.correctKeystrokes / state.totalKeystrokes) * 1000) / 10
      : 100;

  let stars: 0 | 1 | 2 | 3 = 0;
  if (state.isCompleted || state.cursorIndex >= 15) {
    if (netWpm >= targetWpm * 1.25 && accuracy >= Math.min(98, minAccuracy + 4)) {
      stars = 3;
    } else if (netWpm >= targetWpm && accuracy >= minAccuracy) {
      stars = 2;
    } else if (accuracy >= Math.max(80, minAccuracy - 8)) {
      stars = 1;
    }
  }

  return {
    netWpm,
    rawWpm,
    accuracy,
    elapsedSeconds: Math.round(elapsedSeconds * 10) / 10,
    correctChars,
    uncorrectedErrors,
    totalKeystrokes: state.totalKeystrokes,
    errorKeystrokes: state.errorKeystrokes,
    stars,
  };
}
