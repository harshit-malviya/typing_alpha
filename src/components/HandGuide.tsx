import React from 'react';
import { FINGER_METADATA, FingerId, TargetKeyGuide } from '../data/keyboardLayouts';

interface HandGuideProps {
  targetGuide: TargetKeyGuide | null;
  expectedChar: string | null;
}

interface FingerShape {
  id: FingerId;
  label: string;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  rotate?: number;
}

const LEFT_HAND_FINGERS: FingerShape[] = [
  { id: 'left-pinky', label: 'Pinky', cx: 28, cy: 58, rx: 9, ry: 26, rotate: -10 },
  { id: 'left-ring', label: 'Ring', cx: 52, cy: 42, rx: 10, ry: 33, rotate: -4 },
  { id: 'left-middle', label: 'Middle', cx: 78, cy: 35, rx: 10.5, ry: 36, rotate: 0 },
  { id: 'left-index', label: 'Index', cx: 104, cy: 44, rx: 10.5, ry: 32, rotate: 5 },
  { id: 'thumbs', label: 'Thumb', cx: 134, cy: 84, rx: 11, ry: 23, rotate: 34 },
];

const RIGHT_HAND_FINGERS: FingerShape[] = [
  { id: 'thumbs', label: 'Thumb', cx: 26, cy: 84, rx: 11, ry: 23, rotate: -34 },
  { id: 'right-index', label: 'Index', cx: 56, cy: 44, rx: 10.5, ry: 32, rotate: -5 },
  { id: 'right-middle', label: 'Middle', cx: 82, cy: 35, rx: 10.5, ry: 36, rotate: 0 },
  { id: 'right-ring', label: 'Ring', cx: 108, cy: 42, rx: 10, ry: 33, rotate: 4 },
  { id: 'right-pinky', label: 'Pinky', cx: 132, cy: 58, rx: 9, ry: 26, rotate: 10 },
];

export const HandGuide: React.FC<HandGuideProps> = ({ targetGuide, expectedChar }) => {
  const activeFinger = targetGuide?.keyCap.finger ?? null;
  const shiftFinger = targetGuide?.shiftFinger ?? null;

  const primaryMeta = activeFinger ? FINGER_METADATA[activeFinger] : null;
  const shiftMeta = shiftFinger ? FINGER_METADATA[shiftFinger] : null;

  const formattedChar =
    expectedChar === ' '
      ? 'Spacebar'
      : expectedChar === '\n'
      ? 'Enter ↵'
      : expectedChar
      ? `"${expectedChar}"`
      : 'Done';

  return (
    <div className="hand-guide-card" aria-label="Visual Hand and Finger Placement Guide">
      <div className="hand-svg-pair">
        {/* Left Hand SVG */}
        <div className="hand-column">
          <svg viewBox="0 0 160 145" className="hand-svg">
            {/* Left Palm */}
            <path
              d="M 24 85 Q 24 132 76 135 Q 124 132 125 82 Q 112 64 74 64 Q 36 64 24 85 Z"
              className="hand-palm"
            />
            {LEFT_HAND_FINGERS.map((f) => {
              const isPrimary =
                activeFinger === f.id &&
                (f.id !== 'thumbs' || targetGuide?.keyCap.id === 'space');
              const isShift = shiftFinger === f.id;
              const active = isPrimary || isShift;
              const meta = FINGER_METADATA[f.id];

              return (
                <g
                  key={f.id}
                  transform={`rotate(${f.rotate || 0} ${f.cx} ${f.cy})`}
                  className={active ? 'finger-node-active' : 'finger-node'}
                >
                  <ellipse
                    cx={f.cx}
                    cy={f.cy}
                    rx={f.rx}
                    ry={f.ry}
                    style={{
                      fill: active ? meta.colorVar : undefined,
                    }}
                    className="finger-shape"
                  />
                  {active && (
                    <circle
                      cx={f.cx}
                      cy={f.cy - f.ry + 11}
                      r={5}
                      className="finger-tip-pulse"
                    />
                  )}
                </g>
              );
            })}
            <text x="74" y="114" textAnchor="middle" className="hand-label-svg">
              LEFT HAND
            </text>
          </svg>
        </div>

        {/* Center Instruction Callout */}
        <div className="hand-callout">
          <div className="callout-badge">NEXT KEY</div>
          <div className="callout-char">{formattedChar}</div>
          {primaryMeta ? (
            <div className="callout-finger-instructions">
              <span
                className="callout-pill"
                style={{ borderColor: primaryMeta.colorVar, color: primaryMeta.colorVar }}
              >
                {primaryMeta.label}
              </span>
              {shiftMeta && (
                <>
                  <span className="callout-plus">+</span>
                  <span
                    className="callout-pill"
                    style={{ borderColor: shiftMeta.colorVar, color: shiftMeta.colorVar }}
                  >
                    Hold {shiftMeta.shortLabel} (Shift)
                  </span>
                </>
              )}
            </div>
          ) : (
            <div className="callout-sub">Ready to type</div>
          )}
        </div>

        {/* Right Hand SVG */}
        <div className="hand-column">
          <svg viewBox="0 0 160 145" className="hand-svg">
            {/* Right Palm */}
            <path
              d="M 35 82 Q 36 132 84 135 Q 136 132 136 85 Q 124 64 86 64 Q 48 64 35 82 Z"
              className="hand-palm"
            />
            {RIGHT_HAND_FINGERS.map((f) => {
              const isPrimary =
                activeFinger === f.id &&
                (f.id !== 'thumbs' || targetGuide?.keyCap.id === 'space');
              const isShift = shiftFinger === f.id;
              const active = isPrimary || isShift;
              const meta = FINGER_METADATA[f.id];

              return (
                <g
                  key={f.id}
                  transform={`rotate(${f.rotate || 0} ${f.cx} ${f.cy})`}
                  className={active ? 'finger-node-active' : 'finger-node'}
                >
                  <ellipse
                    cx={f.cx}
                    cy={f.cy}
                    rx={f.rx}
                    ry={f.ry}
                    style={{
                      fill: active ? meta.colorVar : undefined,
                    }}
                    className="finger-shape"
                  />
                  {active && (
                    <circle
                      cx={f.cx}
                      cy={f.cy - f.ry + 11}
                      r={5}
                      className="finger-tip-pulse"
                    />
                  )}
                </g>
              );
            })}
            <text x="86" y="114" textAnchor="middle" className="hand-label-svg">
              RIGHT HAND
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
};
