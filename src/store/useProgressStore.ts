import { useState, useEffect, useCallback } from 'react';
import { ErrorMode, KeyTelemetryDelta } from '../engine/typingEngine';
import { SoundProfile, soundEngine } from '../engine/soundEngine';
import { KeyboardLayoutId } from '../data/keyboardLayouts';
import { INITIAL_UNLOCKED_COUNT, evaluateAdaptiveUnlock } from '../engine/adaptiveGenerator';

export type ThemeId =
  | 'dark-slate'
  | 'serika-dark'
  | 'cyberpunk-neon'
  | 'catppuccin-mocha'
  | 'light-paper';

export type CaretStyle = 'line' | 'block' | 'underline';

export interface LessonProgressRecord {
  lessonId: string;
  stars: 0 | 1 | 2 | 3;
  bestWpm: number;
  bestAccuracy: number;
  attempts: number;
  lastCompletedAt: string;
}

export interface SessionHistoryItem {
  id: string;
  timestamp: string;
  mode: 'course' | 'adaptive' | 'speed' | 'quotes' | 'code' | 'custom';
  label: string;
  netWpm: number;
  rawWpm: number;
  accuracy: number;
  durationSec: number;
  stars?: 0 | 1 | 2 | 3;
}

export interface UserSettings {
  theme: ThemeId;
  layout: KeyboardLayoutId;
  caretStyle: CaretStyle;
  soundProfile: SoundProfile;
  soundVolume: number;
  courseErrorMode: ErrorMode;
  practiceErrorMode: ErrorMode;
  showVisualKeyboard: boolean;
  showHandGuide: boolean;
  showFingerColors: boolean;
  zenFocusMode: boolean;
}

export interface UserProgressData {
  version: number;
  xp: number;
  streakDays: number;
  lastActiveDate: string | null;
  totalSecondsTyped: number;
  totalSessionsCompleted: number;
  adaptiveUnlockedCount: number;
  lessons: Record<string, LessonProgressRecord>;
  keyStats: Record<string, KeyTelemetryDelta>;
  history: SessionHistoryItem[];
  customTextSaved: string;
  settings: UserSettings;
}

declare global {
  interface Window {
    electronAPI?: {
      isElectron: boolean;
      loadProgress: () => Promise<UserProgressData | null>;
      saveProgress: (data: UserProgressData) => Promise<{ ok: boolean; path?: string }>;
      getStoragePath: () => Promise<string>;
      openTextFile: () => Promise<{ name: string; content: string } | null>;
    };
  }
}

const LOCAL_STORAGE_KEY = 'typing_alpha_progress_v1';

export const DEFAULT_PROGRESS_DATA: UserProgressData = {
  version: 1,
  xp: 0,
  streakDays: 0,
  lastActiveDate: null,
  totalSecondsTyped: 0,
  totalSessionsCompleted: 0,
  adaptiveUnlockedCount: INITIAL_UNLOCKED_COUNT,
  lessons: {},
  keyStats: {},
  history: [],
  customTextSaved:
    'Paste any English paragraph, study notes, or book excerpt here to practice typing it with real-time finger guidance and WPM tracking.',
  settings: {
    theme: 'dark-slate',
    layout: 'qwerty-us',
    caretStyle: 'line',
    soundProfile: 'mx-blue',
    soundVolume: 0.65,
    courseErrorMode: 'stop-on-error',
    practiceErrorMode: 'type-through',
    showVisualKeyboard: true,
    showHandGuide: true,
    showFingerColors: true,
    zenFocusMode: false,
  },
};

function mergeWithDefaults(partial: Partial<UserProgressData> | null): UserProgressData {
  if (!partial || typeof partial !== 'object') return DEFAULT_PROGRESS_DATA;
  return {
    ...DEFAULT_PROGRESS_DATA,
    ...partial,
    settings: {
      ...DEFAULT_PROGRESS_DATA.settings,
      ...(partial.settings || {}),
    },
    lessons: partial.lessons || {},
    keyStats: partial.keyStats || {},
    history: Array.isArray(partial.history) ? partial.history : [],
  };
}

function getTodayDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;
}

function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

export function calculateLevelFromXp(xp: number): {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPercent: number;
} {
  // Every level requires 250 * level XP
  let level = 1;
  let remaining = Math.max(0, xp);
  let needed = 250;

  while (remaining >= needed) {
    remaining -= needed;
    level++;
    needed = 250 + (level - 1) * 100;
  }

  return {
    level,
    currentLevelXp: remaining,
    nextLevelXp: needed,
    progressPercent: Math.min(100, Math.round((remaining / needed) * 100)),
  };
}

export function useProgressStore() {
  const [data, setData] = useState<UserProgressData>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        return mergeWithDefaults(JSON.parse(raw));
      }
    } catch {
      // ignore parse errors
    }
    return DEFAULT_PROGRESS_DATA;
  });

  const [storagePath, setStoragePath] = useState<string>('Browser LocalStorage');
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Load from native Windows disk (%APPDATA%) if running inside Electron
  useEffect(() => {
    let mounted = true;
    async function initFromDisk() {
      if (window.electronAPI) {
        try {
          const [diskData, pathStr] = await Promise.all([
            window.electronAPI.loadProgress(),
            window.electronAPI.getStoragePath(),
          ]);
          if (mounted) {
            if (pathStr) setStoragePath(pathStr);
            if (diskData) {
              const merged = mergeWithDefaults(diskData);
              setData(merged);
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
            }
          }
        } catch {
          // fallback to localStorage
        }
      }
      if (mounted) setIsLoaded(true);
    }
    initFromDisk();
    return () => {
      mounted = false;
    };
  }, []);

  // Sync audio & theme settings whenever data.settings changes
  useEffect(() => {
    soundEngine.setProfile(data.settings.soundProfile);
    soundEngine.setVolume(data.settings.soundVolume);
    document.documentElement.setAttribute('data-theme', data.settings.theme);
  }, [data.settings.soundProfile, data.settings.soundVolume, data.settings.theme]);

  const persist = useCallback((nextData: UserProgressData) => {
    setData(nextData);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(nextData));
    } catch {
      // ignore quota errors
    }
    if (window.electronAPI) {
      window.electronAPI.saveProgress(nextData).catch(() => {});
    }
  }, []);

  const updateSettings = useCallback(
    (patch: Partial<UserSettings>) => {
      setData((prev) => {
        const next: UserProgressData = {
          ...prev,
          settings: {
            ...prev.settings,
            ...patch,
          },
        };
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next));
        } catch {}
        if (window.electronAPI) {
          window.electronAPI.saveProgress(next).catch(() => {});
        }
        return next;
      });
    },
    []
  );

  const recordCompletedSession = useCallback(
    (params: {
      mode: SessionHistoryItem['mode'];
      label: string;
      lessonId?: string;
      netWpm: number;
      rawWpm: number;
      accuracy: number;
      durationSec: number;
      stars: 0 | 1 | 2 | 3;
      keyStatsDelta: Record<string, KeyTelemetryDelta>;
    }): { newlyUnlockedLetter: string | null; xpGained: number } => {
      let newlyUnlocked: string | null = null;
      const xpGained =
        Math.round(params.netWpm * 1.5) +
        params.stars * 25 +
        (params.accuracy >= 96 ? 20 : 5);

      setData((prev) => {
        // Merge per-key telemetry
        const mergedKeyStats: Record<string, KeyTelemetryDelta> = { ...prev.keyStats };
        for (const [k, delta] of Object.entries(params.keyStatsDelta)) {
          const existing = mergedKeyStats[k] || {
            hits: 0,
            misses: 0,
            totalLatencyMs: 0,
            latencySamples: 0,
          };
          mergedKeyStats[k] = {
            hits: existing.hits + delta.hits,
            misses: existing.misses + delta.misses,
            totalLatencyMs: existing.totalLatencyMs + delta.totalLatencyMs,
            latencySamples: existing.latencySamples + delta.latencySamples,
          };
        }

        // Update streak
        const today = getTodayDateString();
        const yesterday = getYesterdayDateString();
        let nextStreak = prev.streakDays;
        if (prev.lastActiveDate !== today) {
          if (prev.lastActiveDate === yesterday) {
            nextStreak = prev.streakDays + 1;
          } else {
            nextStreak = 1;
          }
        }

        // Update lesson record if course mode
        const nextLessons = { ...prev.lessons };
        if (params.lessonId) {
          const existingLesson = nextLessons[params.lessonId];
          nextLessons[params.lessonId] = {
            lessonId: params.lessonId,
            stars: Math.max(existingLesson?.stars || 0, params.stars) as 0 | 1 | 2 | 3,
            bestWpm: Math.max(existingLesson?.bestWpm || 0, params.netWpm),
            bestAccuracy: Math.max(existingLesson?.bestAccuracy || 0, params.accuracy),
            attempts: (existingLesson?.attempts || 0) + 1,
            lastCompletedAt: new Date().toISOString(),
          };
        }

        // Check adaptive unlock if in adaptive mode
        let nextUnlockedCount = prev.adaptiveUnlockedCount;
        if (params.mode === 'adaptive') {
          const evalRes = evaluateAdaptiveUnlock(prev.adaptiveUnlockedCount, mergedKeyStats);
          nextUnlockedCount = evalRes.nextUnlockedCount;
          newlyUnlocked = evalRes.newlyUnlockedLetter;
        }

        const sessionItem: SessionHistoryItem = {
          id: `sess-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: new Date().toISOString(),
          mode: params.mode,
          label: params.label,
          netWpm: params.netWpm,
          rawWpm: params.rawWpm,
          accuracy: params.accuracy,
          durationSec: Math.round(params.durationSec),
          stars: params.stars,
        };

        const next: UserProgressData = {
          ...prev,
          xp: prev.xp + xpGained,
          streakDays: nextStreak,
          lastActiveDate: today,
          totalSecondsTyped: prev.totalSecondsTyped + Math.round(params.durationSec),
          totalSessionsCompleted: prev.totalSessionsCompleted + 1,
          adaptiveUnlockedCount: nextUnlockedCount,
          lessons: nextLessons,
          keyStats: mergedKeyStats,
          history: [sessionItem, ...prev.history].slice(0, 120),
        };

        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next));
        } catch {}
        if (window.electronAPI) {
          window.electronAPI.saveProgress(next).catch(() => {});
        }
        return next;
      });

      return { newlyUnlockedLetter: newlyUnlocked, xpGained };
    },
    []
  );

  const setAdaptiveUnlockedCount = useCallback(
    (count: number) => {
      persist({
        ...data,
        adaptiveUnlockedCount: Math.max(6, Math.min(26, count)),
      });
    },
    [data, persist]
  );

  const saveCustomText = useCallback(
    (text: string) => {
      persist({
        ...data,
        customTextSaved: text,
      });
    },
    [data, persist]
  );

  const importProgressJson = useCallback(
    (rawJson: string): boolean => {
      try {
        const parsed = JSON.parse(rawJson);
        const merged = mergeWithDefaults(parsed);
        persist(merged);
        return true;
      } catch {
        return false;
      }
    },
    [persist]
  );

  const resetAllProgress = useCallback(() => {
    persist(DEFAULT_PROGRESS_DATA);
  }, [persist]);

  return {
    data,
    isLoaded,
    storagePath,
    updateSettings,
    recordCompletedSession,
    setAdaptiveUnlockedCount,
    saveCustomText,
    importProgressJson,
    resetAllProgress,
  };
}
