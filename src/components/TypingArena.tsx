import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  RotateCcw,
  Star,
  Award,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Eye,
  Keyboard,
  Hand,
  Timer,
} from 'lucide-react';
import {
  createInitialTypingState,
  processKeystroke,
  calculateMetrics,
  ErrorMode,
  KeyTelemetryDelta,
} from '../engine/typingEngine';
import { soundEngine } from '../engine/soundEngine';
import {
  KeyboardLayoutId,
  resolveCharToKeyGuide,
} from '../data/keyboardLayouts';
import { CaretStyle } from '../store/useProgressStore';
import { VisualKeyboard } from './VisualKeyboard';
import { HandGuide } from './HandGuide';

interface TypingArenaProps {
  mode: 'course' | 'adaptive' | 'speed' | 'quotes' | 'code' | 'custom';
  title: string;
  subtitle?: string;
  fingerTip?: string;
  targetText: string;
  targetWpm?: number;
  minAccuracy?: number;
  errorMode: ErrorMode;
  onToggleErrorMode: (next: ErrorMode) => void;
  layoutId: KeyboardLayoutId;
  caretStyle: CaretStyle;
  showVisualKeyboard: boolean;
  showHandGuide: boolean;
  showFingerColors: boolean;
  onToggleVisualKeyboard: () => void;
  onToggleHandGuide: () => void;
  timeLimitSeconds?: number | null; // For timed speed tests (15, 30, 60, 120)
  keyStats?: Record<string, KeyTelemetryDelta>;
  onComplete: (result: {
    netWpm: number;
    rawWpm: number;
    accuracy: number;
    durationSec: number;
    stars: 0 | 1 | 2 | 3;
    keyStatsDelta: Record<string, KeyTelemetryDelta>;
  }) => { newlyUnlockedLetter: string | null; xpGained: number };
  onNextOrRegenerate?: () => void;
  nextButtonLabel?: string;
  onActiveTypingChange?: (isTyping: boolean) => void;
}

export const TypingArena: React.FC<TypingArenaProps> = ({
  mode,
  title,
  subtitle,
  fingerTip,
  targetText,
  targetWpm = 28,
  minAccuracy = 93,
  errorMode,
  onToggleErrorMode,
  layoutId,
  caretStyle,
  showVisualKeyboard,
  showHandGuide,
  showFingerColors,
  onToggleVisualKeyboard,
  onToggleHandGuide,
  timeLimitSeconds = null,
  keyStats,
  onComplete,
  onNextOrRegenerate,
  nextButtonLabel = 'Next Drill',
  onActiveTypingChange,
}) => {
  const [typingState, setTypingState] = useState(() =>
    createInitialTypingState(targetText)
  );
  const [nowTick, setNowTick] = useState<number>(() => Date.now());
  const [lastErrorChar, setLastErrorChar] = useState<string | null>(null);
  const [sessionReward, setSessionReward] = useState<{
    newlyUnlockedLetter: string | null;
    xpGained: number;
  } | null>(null);
  const [isTimedOut, setIsTimedOut] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeCharRef = useRef<HTMLSpanElement | null>(null);
  const completedDispatchedRef = useRef<boolean>(false);

  // Reset whenever targetText changes
  useEffect(() => {
    setTypingState(createInitialTypingState(targetText));
    setLastErrorChar(null);
    setSessionReward(null);
    setIsTimedOut(false);
    completedDispatchedRef.current = false;
    onActiveTypingChange?.(false);
    containerRef.current?.focus();
  }, [targetText]);

  const isFinished = typingState.isCompleted || isTimedOut;

  // Live 200ms timer for WPM / countdown updates while actively typing
  useEffect(() => {
    if (typingState.startTimeMs === null || isFinished) return;

    const interval = setInterval(() => {
      const now = Date.now();
      setNowTick(now);
      if (timeLimitSeconds && typingState.startTimeMs) {
        const elapsedSec = (now - typingState.startTimeMs) / 1000;
        if (elapsedSec >= timeLimitSeconds) {
          setIsTimedOut(true);
        }
      }
    }, 150);

    return () => clearInterval(interval);
  }, [typingState.startTimeMs, isFinished, timeLimitSeconds]);

  // Keep active character scrolled smoothly into view for multi-line texts
  useEffect(() => {
    if (activeCharRef.current) {
      activeCharRef.current.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [typingState.cursorIndex]);

  const metrics = useMemo(
    () => calculateMetrics(typingState, nowTick, targetWpm, minAccuracy),
    [typingState, nowTick, targetWpm, minAccuracy]
  );

  // Dispatch completion callback once when finished
  useEffect(() => {
    if (isFinished && !completedDispatchedRef.current && typingState.totalKeystrokes > 0) {
      completedDispatchedRef.current = true;
      onActiveTypingChange?.(false);
      soundEngine.playVictory(metrics.stars);
      const reward = onComplete({
        netWpm: metrics.netWpm,
        rawWpm: metrics.rawWpm,
        accuracy: metrics.accuracy,
        durationSec: metrics.elapsedSeconds,
        stars: metrics.stars,
        keyStatsDelta: typingState.keyStatsDelta,
      });
      setSessionReward(reward);
    }
  }, [isFinished, typingState, metrics, onComplete, onActiveTypingChange]);

  const handleRestart = () => {
    setTypingState(createInitialTypingState(targetText));
    setLastErrorChar(null);
    setSessionReward(null);
    setIsTimedOut(false);
    completedDispatchedRef.current = false;
    onActiveTypingChange?.(false);
    containerRef.current?.focus();
  };

  // Global keydown listener while TypingArena is mounted
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not intercept if user is typing inside an input or textarea (e.g., Custom Text editor)
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        onActiveTypingChange?.(false);
        handleRestart();
        return;
      }

      // If session is finished, Enter triggers Next or Restart
      if (isFinished) {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (onNextOrRegenerate) {
            onNextOrRegenerate();
          } else {
            handleRestart();
          }
        }
        return;
      }

      if (e.ctrlKey || e.altKey || e.metaKey) {
        return;
      }

      if (
        e.key === 'Shift' ||
        e.key === 'CapsLock' ||
        e.key === 'Tab' ||
        e.key.startsWith('Arrow') ||
        e.key.startsWith('F')
      ) {
        return;
      }

      if (e.key === ' ' || e.key === 'Backspace' || e.key === 'Enter' || e.key.length === 1) {
        e.preventDefault();
        const now = Date.now();
        setNowTick(now);
        const { nextState, outcome } = processKeystroke(
          typingState,
          e.key,
          errorMode,
          now
        );

        if (outcome !== 'ignored') {
          setTypingState(nextState);
          onActiveTypingChange?.(!nextState.isCompleted);
        }

        if (outcome === 'correct' || outcome === 'backspace') {
          soundEngine.playKeyPress();
          setLastErrorChar(null);
        } else if (outcome === 'error') {
          soundEngine.playError();
          setLastErrorChar(e.key);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [typingState, errorMode, isFinished, onNextOrRegenerate, onActiveTypingChange]);

  const expectedChar =
    !isFinished && typingState.cursorIndex < typingState.targetText.length
      ? typingState.targetText[typingState.cursorIndex]
      : null;

  const targetGuide = useMemo(
    () => resolveCharToKeyGuide(expectedChar, layoutId),
    [expectedChar, layoutId]
  );

  const progressPercent =
    typingState.targetText.length > 0
      ? Math.round((typingState.cursorIndex / typingState.targetText.length) * 100)
      : 0;

  const remainingSeconds =
    timeLimitSeconds !== null
      ? Math.max(
          0,
          Math.ceil(
            timeLimitSeconds -
              (typingState.startTimeMs ? (nowTick - typingState.startTimeMs) / 1000 : 0)
          )
        )
      : null;

  return (
    <div className="typing-arena-wrapper" ref={containerRef} tabIndex={-1}>
      {/* Arena Header & Live Metrics Bar */}
      <div className="arena-top-bar">
        <div className="arena-title-group">
          <h2 className="arena-title">{title}</h2>
          {subtitle && <p className="arena-subtitle">{subtitle}</p>}
        </div>

        <div className="arena-live-metrics">
          {remainingSeconds !== null && (
            <div className="metric-pill metric-pill-timer">
              <Timer size={15} />
              <span className="metric-value">{remainingSeconds}s</span>
              <span className="metric-label">Time Left</span>
            </div>
          )}
          <div className="metric-pill">
            <span className="metric-value">{metrics.netWpm}</span>
            <span className="metric-label">WPM (Goal {targetWpm})</span>
          </div>
          <div className="metric-pill">
            <span className="metric-value">{metrics.accuracy}%</span>
            <span className="metric-label">Accuracy (Goal {minAccuracy}%)</span>
          </div>
          <div className="metric-pill">
            <span className="metric-value">{progressPercent}%</span>
            <span className="metric-label">Progress</span>
          </div>
        </div>

        {/* Quick Mode & Aid Toggles */}
        <div className="arena-quick-controls">
          <button
            type="button"
            className={`control-chip ${
              errorMode === 'stop-on-error' ? 'chip-active' : ''
            }`}
            onClick={() =>
              onToggleErrorMode(
                errorMode === 'stop-on-error' ? 'type-through' : 'stop-on-error'
              )
            }
            title="Switch between Stop-on-Error (guided) and Type-Through + Backspace"
          >
            {errorMode === 'stop-on-error' ? (
              <>
                <ShieldCheck size={15} /> Stop on Error
              </>
            ) : (
              <>
                <AlertCircle size={15} /> Type Through
              </>
            )}
          </button>

          <button
            type="button"
            className={`control-chip ${showVisualKeyboard ? 'chip-active' : ''}`}
            onClick={onToggleVisualKeyboard}
            title="Toggle Interactive On-Screen Keyboard"
          >
            <Keyboard size={15} /> Keyboard
          </button>

          <button
            type="button"
            className={`control-chip ${showHandGuide ? 'chip-active' : ''}`}
            onClick={onToggleHandGuide}
            title="Toggle Visual Hand & Finger Guide"
          >
            <Hand size={15} /> Hands
          </button>

          <button
            type="button"
            className="control-chip"
            onClick={handleRestart}
            title="Restart Drill (Esc)"
          >
            <RotateCcw size={15} /> Restart
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="arena-progress-track">
        <div
          className="arena-progress-fill"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Ergonomic / Finger Tip Banner */}
      {fingerTip && (
        <div className="finger-tip-banner">
          <Eye size={16} className="tip-icon" />
          <span>
            <strong>Coach Tip:</strong> {fingerTip}
          </span>
        </div>
      )}

      {/* Main Text Display Box */}
      <div
        className={`typing-text-box caret-style-${caretStyle} ${
          mode === 'code' ? 'code-font-box' : ''
        }`}
      >
        {typingState.targetText.split('').map((char, idx) => {
          const isCurrent = idx === typingState.cursorIndex && !isFinished;
          const isTyped = idx < typingState.cursorIndex;
          const typedChar = typingState.typedChars[idx];
          const isCorrect = isTyped && typedChar === char;
          const isWrong = isTyped && typedChar !== char;
          const hadPastMistake = isCorrect && typingState.hadErrorAt[idx];
          const isBlockedError = isCurrent && typingState.blockedErrorChar !== null;

          let statusClass = 'char-pending';
          if (isCorrect) {
            statusClass = hadPastMistake ? 'char-corrected' : 'char-correct';
          } else if (isWrong) {
            statusClass = 'char-wrong';
          }
          if (isCurrent) {
            statusClass += ' char-current';
          }
          if (isBlockedError) {
            statusClass += ' char-blocked-error';
          }

          if (char === '\n') {
            return (
              <React.Fragment key={idx}>
                <span
                  ref={isCurrent ? activeCharRef : undefined}
                  className={`typing-char char-newline ${statusClass}`}
                >
                  ↵
                </span>
                <br />
              </React.Fragment>
            );
          }

          return (
            <span
              key={idx}
              ref={isCurrent ? activeCharRef : undefined}
              className={`typing-char ${statusClass}`}
            >
              {char === ' ' ? (isWrong ? '␣' : '\u00A0') : char}
            </span>
          );
        })}
      </div>

      {/* Post-Session Results Overlay Card */}
      {isFinished && (
        <div className="session-complete-card" role="region" aria-label="Session Results">
          <div className="complete-header">
            <div className="stars-row">
              {[1, 2, 3].map((s) => (
                <Star
                  key={s}
                  size={28}
                  className={
                    metrics.stars >= s ? 'star-earned' : 'star-unearned'
                  }
                  fill={metrics.stars >= s ? 'currentColor' : 'none'}
                />
              ))}
            </div>
            <h3>
              {metrics.stars === 3
                ? 'Outstanding Mastery!'
                : metrics.stars === 2
                ? 'Target Reached! Great Job!'
                : 'Drill Complete — Keep Practicing!'}
            </h3>
            {sessionReward && (
              <div className="xp-badge">
                <Award size={16} /> +{sessionReward.xpGained} XP Earned
              </div>
            )}
          </div>

          {sessionReward?.newlyUnlockedLetter && (
            <div className="unlock-banner">
              <Sparkles size={18} />
              <span>
                New Adaptive Key Unlocked:{' '}
                <strong>"{sessionReward.newlyUnlockedLetter.toUpperCase()}"</strong>!
              </span>
            </div>
          )}

          <div className="complete-stats-grid">
            <div className="complete-stat-box">
              <span className="stat-big">{metrics.netWpm}</span>
              <span className="stat-caption">Net WPM</span>
            </div>
            <div className="complete-stat-box">
              <span className="stat-big">{metrics.accuracy}%</span>
              <span className="stat-caption">Accuracy</span>
            </div>
            <div className="complete-stat-box">
              <span className="stat-big">{metrics.rawWpm}</span>
              <span className="stat-caption">Raw WPM</span>
            </div>
            <div className="complete-stat-box">
              <span className="stat-big">{metrics.elapsedSeconds}s</span>
              <span className="stat-caption">Time</span>
            </div>
          </div>

          <div className="complete-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleRestart}
            >
              <RotateCcw size={16} /> Practice Again (Esc)
            </button>
            {onNextOrRegenerate && (
              <button
                type="button"
                className="btn-primary"
                onClick={onNextOrRegenerate}
              >
                {nextButtonLabel} (Enter) <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Visual Aids: Interactive Keyboard + Dual SVG Hand Guide */}
      <div className="visual-aids-grid">
        {showVisualKeyboard && (
          <VisualKeyboard
            layoutId={layoutId}
            targetGuide={targetGuide}
            lastErrorChar={lastErrorChar}
            showFingerColors={showFingerColors}
            heatmapMode="off"
            keyStats={keyStats}
          />
        )}
        {showHandGuide && (
          <HandGuide
            targetGuide={targetGuide}
            expectedChar={expectedChar}
          />
        )}
      </div>
    </div>
  );
};
