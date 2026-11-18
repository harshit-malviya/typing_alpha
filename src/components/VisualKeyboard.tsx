import React from 'react';
import {
  KEYBOARD_LAYOUTS,
  KeyboardLayoutId,
  FINGER_METADATA,
  TargetKeyGuide,
} from '../data/keyboardLayouts';
import { KeyTelemetryDelta } from '../engine/typingEngine';

interface VisualKeyboardProps {
  layoutId: KeyboardLayoutId;
  targetGuide: TargetKeyGuide | null;
  lastErrorChar: string | null;
  showFingerColors: boolean;
  heatmapMode?: 'off' | 'accuracy' | 'speed';
  keyStats?: Record<string, KeyTelemetryDelta>;
}

function getHeatmapBadge(
  keyChar: string,
  mode: 'off' | 'accuracy' | 'speed',
  keyStats?: Record<string, KeyTelemetryDelta>
): { bg: string; subLabel: string | null } {
  if (mode === 'off' || !keyStats) return { bg: '', subLabel: null };
  const stat = keyStats[keyChar.toLowerCase()];
  if (!stat || stat.hits + stat.misses < 2) {
    return { bg: '', subLabel: null };
  }

  const total = stat.hits + stat.misses;
  const acc = Math.round((stat.hits / total) * 100);
  const avgMs =
    stat.latencySamples > 0 ? Math.round(stat.totalLatencyMs / stat.latencySamples) : null;

  if (mode === 'accuracy') {
    if (acc >= 96) {
      return { bg: 'rgba(16, 185, 129, 0.28)', subLabel: `${acc}%` };
    }
    if (acc >= 88) {
      return { bg: 'rgba(245, 158, 11, 0.30)', subLabel: `${acc}%` };
    }
    return { bg: 'rgba(239, 68, 68, 0.38)', subLabel: `${acc}%` };
  }

  if (mode === 'speed' && avgMs !== null) {
    const wpm = Math.min(130, Math.round(12000 / Math.max(85, avgMs)));
    if (wpm >= 45) {
      return { bg: 'rgba(16, 185, 129, 0.28)', subLabel: `${wpm}w` };
    }
    if (wpm >= 28) {
      return { bg: 'rgba(59, 130, 246, 0.28)', subLabel: `${wpm}w` };
    }
    return { bg: 'rgba(244, 63, 94, 0.34)', subLabel: `${wpm}w` };
  }

  return { bg: '', subLabel: null };
}

export const VisualKeyboard: React.FC<VisualKeyboardProps> = ({
  layoutId,
  targetGuide,
  lastErrorChar,
  showFingerColors,
  heatmapMode = 'off',
  keyStats,
}) => {
  const layout = KEYBOARD_LAYOUTS[layoutId] || KEYBOARD_LAYOUTS['qwerty-us'];

  return (
    <div className="visual-keyboard-card" aria-label="Interactive On-Screen Keyboard">
      <div className="keyboard-rows">
        {layout.rows.map((row, rIdx) => (
          <div key={rIdx} className="keyboard-row">
            {row.map((keyCap) => {
              const isTargetKey = targetGuide?.keyCap.id === keyCap.id;
              const isShiftTarget =
                targetGuide?.needsShift && targetGuide.shiftKeyId === keyCap.id;
              const isErrorKey =
                lastErrorChar !== null &&
                (keyCap.normal.toLowerCase() === lastErrorChar.toLowerCase() ||
                  keyCap.shift?.toLowerCase() === lastErrorChar.toLowerCase());

              const fingerMeta = FINGER_METADATA[keyCap.finger];
              const heat = getHeatmapBadge(keyCap.normal, heatmapMode, keyStats);

              const widthFlex = keyCap.width ?? 1;
              const displayMain = keyCap.label ?? keyCap.normal.toUpperCase();

              return (
                <div
                  key={keyCap.id}
                  className={[
                    'keycap',
                    isTargetKey ? 'keycap-target' : '',
                    isShiftTarget ? 'keycap-shift-target' : '',
                    isErrorKey ? 'keycap-error' : '',
                    showFingerColors ? 'keycap-finger-colored' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  style={
                    {
                      flex: `${widthFlex} 1 0%`,
                      '--key-finger-color': fingerMeta.colorVar,
                      backgroundColor: heat.bg || undefined,
                    } as React.CSSProperties
                  }
                  title={`${displayMain} — ${fingerMeta.label}`}
                >
                  {keyCap.shift && keyCap.shift.toLowerCase() !== keyCap.normal.toLowerCase() && (
                    <span className="keycap-shift-label">{keyCap.shift}</span>
                  )}
                  <span className="keycap-main-label">{displayMain}</span>
                  {heat.subLabel && <span className="keycap-heat-badge">{heat.subLabel}</span>}
                  {keyCap.isHomeBump && <span className="keycap-home-bump" />}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Finger Color Legend */}
      {showFingerColors && (
        <div className="finger-legend-bar">
          {(
            [
              ['Pinky', 'var(--finger-pinky)'],
              ['Ring', 'var(--finger-ring)'],
              ['Middle', 'var(--finger-middle)'],
              ['L-Index', 'var(--finger-index-left)'],
              ['Thumbs (Space)', 'var(--finger-thumb)'],
              ['R-Index', 'var(--finger-index-right)'],
            ] as const
          ).map(([name, color]) => (
            <div key={name} className="finger-legend-item">
              <span className="finger-dot" style={{ background: color }} />
              <span>{name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
