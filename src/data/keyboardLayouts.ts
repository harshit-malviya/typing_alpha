export type FingerId =
  | 'left-pinky'
  | 'left-ring'
  | 'left-middle'
  | 'left-index'
  | 'thumbs'
  | 'right-index'
  | 'right-middle'
  | 'right-ring'
  | 'right-pinky';

export type KeyboardLayoutId = 'qwerty-us' | 'qwerty-uk' | 'dvorak' | 'colemak';

export interface KeyCapDef {
  id: string;
  normal: string;
  shift?: string;
  label?: string;
  width?: number; // 1 = standard 1u key
  finger: FingerId;
  hand: 'left' | 'right' | 'both';
  isHomeBump?: boolean;
}

export const FINGER_METADATA: Record<
  FingerId,
  { label: string; shortLabel: string; colorVar: string; hand: 'left' | 'right' | 'both' }
> = {
  'left-pinky': {
    label: 'Left Pinky Finger',
    shortLabel: 'L-Pinky',
    colorVar: 'var(--finger-pinky)',
    hand: 'left',
  },
  'left-ring': {
    label: 'Left Ring Finger',
    shortLabel: 'L-Ring',
    colorVar: 'var(--finger-ring)',
    hand: 'left',
  },
  'left-middle': {
    label: 'Left Middle Finger',
    shortLabel: 'L-Middle',
    colorVar: 'var(--finger-middle)',
    hand: 'left',
  },
  'left-index': {
    label: 'Left Index Finger',
    shortLabel: 'L-Index',
    colorVar: 'var(--finger-index-left)',
    hand: 'left',
  },
  thumbs: {
    label: 'Thumbs (Spacebar)',
    shortLabel: 'Thumb',
    colorVar: 'var(--finger-thumb)',
    hand: 'both',
  },
  'right-index': {
    label: 'Right Index Finger',
    shortLabel: 'R-Index',
    colorVar: 'var(--finger-index-right)',
    hand: 'right',
  },
  'right-middle': {
    label: 'Right Middle Finger',
    shortLabel: 'R-Middle',
    colorVar: 'var(--finger-middle)',
    hand: 'right',
  },
  'right-ring': {
    label: 'Right Ring Finger',
    shortLabel: 'R-Ring',
    colorVar: 'var(--finger-ring)',
    hand: 'right',
  },
  'right-pinky': {
    label: 'Right Pinky Finger',
    shortLabel: 'R-Pinky',
    colorVar: 'var(--finger-pinky)',
    hand: 'right',
  },
};

const NUMBER_ROW_US: KeyCapDef[] = [
  { id: 'backquote', normal: '`', shift: '~', finger: 'left-pinky', hand: 'left' },
  { id: '1', normal: '1', shift: '!', finger: 'left-pinky', hand: 'left' },
  { id: '2', normal: '2', shift: '@', finger: 'left-ring', hand: 'left' },
  { id: '3', normal: '3', shift: '#', finger: 'left-middle', hand: 'left' },
  { id: '4', normal: '4', shift: '$', finger: 'left-index', hand: 'left' },
  { id: '5', normal: '5', shift: '%', finger: 'left-index', hand: 'left' },
  { id: '6', normal: '6', shift: '^', finger: 'right-index', hand: 'right' },
  { id: '7', normal: '7', shift: '&', finger: 'right-index', hand: 'right' },
  { id: '8', normal: '8', shift: '*', finger: 'right-middle', hand: 'right' },
  { id: '9', normal: '9', shift: '(', finger: 'right-ring', hand: 'right' },
  { id: '0', normal: '0', shift: ')', finger: 'right-pinky', hand: 'right' },
  { id: 'minus', normal: '-', shift: '_', finger: 'right-pinky', hand: 'right' },
  { id: 'equal', normal: '=', shift: '+', finger: 'right-pinky', hand: 'right' },
  { id: 'backspace', normal: 'Backspace', label: '⌫ Back', width: 2, finger: 'right-pinky', hand: 'right' },
];

const BOTTOM_SPACE_ROW: KeyCapDef[] = [
  { id: 'ctrl-l', normal: 'Ctrl', label: 'Ctrl', width: 1.5, finger: 'left-pinky', hand: 'left' },
  { id: 'alt-l', normal: 'Alt', label: 'Alt', width: 1.5, finger: 'left-pinky', hand: 'left' },
  { id: 'space', normal: ' ', label: 'Space', width: 9, finger: 'thumbs', hand: 'both' },
  { id: 'alt-r', normal: 'Alt', label: 'Alt', width: 1.5, finger: 'right-pinky', hand: 'right' },
  { id: 'ctrl-r', normal: 'Ctrl', label: 'Ctrl', width: 1.5, finger: 'right-pinky', hand: 'right' },
];

export const KEYBOARD_LAYOUTS: Record<
  KeyboardLayoutId,
  { name: string; description: string; rows: KeyCapDef[][] }
> = {
  'qwerty-us': {
    name: 'US QWERTY',
    description: 'Standard American English layout',
    rows: [
      NUMBER_ROW_US,
      [
        { id: 'tab', normal: '\t', label: 'Tab ⇥', width: 1.5, finger: 'left-pinky', hand: 'left' },
        { id: 'q', normal: 'q', shift: 'Q', finger: 'left-pinky', hand: 'left' },
        { id: 'w', normal: 'w', shift: 'W', finger: 'left-ring', hand: 'left' },
        { id: 'e', normal: 'e', shift: 'E', finger: 'left-middle', hand: 'left' },
        { id: 'r', normal: 'r', shift: 'R', finger: 'left-index', hand: 'left' },
        { id: 't', normal: 't', shift: 'T', finger: 'left-index', hand: 'left' },
        { id: 'y', normal: 'y', shift: 'Y', finger: 'right-index', hand: 'right' },
        { id: 'u', normal: 'u', shift: 'U', finger: 'right-index', hand: 'right' },
        { id: 'i', normal: 'i', shift: 'I', finger: 'right-middle', hand: 'right' },
        { id: 'o', normal: 'o', shift: 'O', finger: 'right-ring', hand: 'right' },
        { id: 'p', normal: 'p', shift: 'P', finger: 'right-pinky', hand: 'right' },
        { id: 'bracket-l', normal: '[', shift: '{', finger: 'right-pinky', hand: 'right' },
        { id: 'bracket-r', normal: ']', shift: '}', finger: 'right-pinky', hand: 'right' },
        { id: 'backslash', normal: '\\', shift: '|', width: 1.5, finger: 'right-pinky', hand: 'right' },
      ],
      [
        { id: 'caps', normal: 'CapsLock', label: 'Caps', width: 1.8, finger: 'left-pinky', hand: 'left' },
        { id: 'a', normal: 'a', shift: 'A', finger: 'left-pinky', hand: 'left' },
        { id: 's', normal: 's', shift: 'S', finger: 'left-ring', hand: 'left' },
        { id: 'd', normal: 'd', shift: 'D', finger: 'left-middle', hand: 'left' },
        { id: 'f', normal: 'f', shift: 'F', finger: 'left-index', hand: 'left', isHomeBump: true },
        { id: 'g', normal: 'g', shift: 'G', finger: 'left-index', hand: 'left' },
        { id: 'h', normal: 'h', shift: 'H', finger: 'right-index', hand: 'right' },
        { id: 'j', normal: 'j', shift: 'J', finger: 'right-index', hand: 'right', isHomeBump: true },
        { id: 'k', normal: 'k', shift: 'K', finger: 'right-middle', hand: 'right' },
        { id: 'l', normal: 'l', shift: 'L', finger: 'right-ring', hand: 'right' },
        { id: 'semicolon', normal: ';', shift: ':', finger: 'right-pinky', hand: 'right' },
        { id: 'quote', normal: "'", shift: '"', finger: 'right-pinky', hand: 'right' },
        { id: 'enter', normal: '\n', label: 'Enter ↵', width: 2.2, finger: 'right-pinky', hand: 'right' },
      ],
      [
        { id: 'shift-l', normal: 'ShiftLeft', label: '⇧ Shift', width: 2.4, finger: 'left-pinky', hand: 'left' },
        { id: 'z', normal: 'z', shift: 'Z', finger: 'left-pinky', hand: 'left' },
        { id: 'x', normal: 'x', shift: 'X', finger: 'left-ring', hand: 'left' },
        { id: 'c', normal: 'c', shift: 'C', finger: 'left-middle', hand: 'left' },
        { id: 'v', normal: 'v', shift: 'V', finger: 'left-index', hand: 'left' },
        { id: 'b', normal: 'b', shift: 'B', finger: 'left-index', hand: 'left' },
        { id: 'n', normal: 'n', shift: 'N', finger: 'right-index', hand: 'right' },
        { id: 'm', normal: 'm', shift: 'M', finger: 'right-index', hand: 'right' },
        { id: 'comma', normal: ',', shift: '<', finger: 'right-middle', hand: 'right' },
        { id: 'period', normal: '.', shift: '>', finger: 'right-ring', hand: 'right' },
        { id: 'slash', normal: '/', shift: '?', finger: 'right-pinky', hand: 'right' },
        { id: 'shift-r', normal: 'ShiftRight', label: '⇧ Shift', width: 2.6, finger: 'right-pinky', hand: 'right' },
      ],
      BOTTOM_SPACE_ROW,
    ],
  },
  'qwerty-uk': {
    name: 'UK QWERTY',
    description: 'British English layout with £ and @/" swap',
    rows: [
      [
        { id: 'backquote', normal: '`', shift: '¬', finger: 'left-pinky', hand: 'left' },
        { id: '1', normal: '1', shift: '!', finger: 'left-pinky', hand: 'left' },
        { id: '2', normal: '2', shift: '"', finger: 'left-ring', hand: 'left' },
        { id: '3', normal: '3', shift: '£', finger: 'left-middle', hand: 'left' },
        ...NUMBER_ROW_US.slice(4),
      ],
      [
        { id: 'tab', normal: '\t', label: 'Tab ⇥', width: 1.5, finger: 'left-pinky', hand: 'left' },
        { id: 'q', normal: 'q', shift: 'Q', finger: 'left-pinky', hand: 'left' },
        { id: 'w', normal: 'w', shift: 'W', finger: 'left-ring', hand: 'left' },
        { id: 'e', normal: 'e', shift: 'E', finger: 'left-middle', hand: 'left' },
        { id: 'r', normal: 'r', shift: 'R', finger: 'left-index', hand: 'left' },
        { id: 't', normal: 't', shift: 'T', finger: 'left-index', hand: 'left' },
        { id: 'y', normal: 'y', shift: 'Y', finger: 'right-index', hand: 'right' },
        { id: 'u', normal: 'u', shift: 'U', finger: 'right-index', hand: 'right' },
        { id: 'i', normal: 'i', shift: 'I', finger: 'right-middle', hand: 'right' },
        { id: 'o', normal: 'o', shift: 'O', finger: 'right-ring', hand: 'right' },
        { id: 'p', normal: 'p', shift: 'P', finger: 'right-pinky', hand: 'right' },
        { id: 'bracket-l', normal: '[', shift: '{', finger: 'right-pinky', hand: 'right' },
        { id: 'bracket-r', normal: ']', shift: '}', finger: 'right-pinky', hand: 'right' },
        { id: 'backslash', normal: '#', shift: '~', width: 1.5, finger: 'right-pinky', hand: 'right' },
      ],
      [
        { id: 'caps', normal: 'CapsLock', label: 'Caps', width: 1.8, finger: 'left-pinky', hand: 'left' },
        { id: 'a', normal: 'a', shift: 'A', finger: 'left-pinky', hand: 'left' },
        { id: 's', normal: 's', shift: 'S', finger: 'left-ring', hand: 'left' },
        { id: 'd', normal: 'd', shift: 'D', finger: 'left-middle', hand: 'left' },
        { id: 'f', normal: 'f', shift: 'F', finger: 'left-index', hand: 'left', isHomeBump: true },
        { id: 'g', normal: 'g', shift: 'G', finger: 'left-index', hand: 'left' },
        { id: 'h', normal: 'h', shift: 'H', finger: 'right-index', hand: 'right' },
        { id: 'j', normal: 'j', shift: 'J', finger: 'right-index', hand: 'right', isHomeBump: true },
        { id: 'k', normal: 'k', shift: 'K', finger: 'right-middle', hand: 'right' },
        { id: 'l', normal: 'l', shift: 'L', finger: 'right-ring', hand: 'right' },
        { id: 'semicolon', normal: ';', shift: ':', finger: 'right-pinky', hand: 'right' },
        { id: 'quote', normal: "'", shift: '@', finger: 'right-pinky', hand: 'right' },
        { id: 'enter', normal: '\n', label: 'Enter ↵', width: 2.2, finger: 'right-pinky', hand: 'right' },
      ],
      [
        { id: 'shift-l', normal: 'ShiftLeft', label: '⇧ Shift', width: 2.4, finger: 'left-pinky', hand: 'left' },
        { id: 'z', normal: 'z', shift: 'Z', finger: 'left-pinky', hand: 'left' },
        { id: 'x', normal: 'x', shift: 'X', finger: 'left-ring', hand: 'left' },
        { id: 'c', normal: 'c', shift: 'C', finger: 'left-middle', hand: 'left' },
        { id: 'v', normal: 'v', shift: 'V', finger: 'left-index', hand: 'left' },
        { id: 'b', normal: 'b', shift: 'B', finger: 'left-index', hand: 'left' },
        { id: 'n', normal: 'n', shift: 'N', finger: 'right-index', hand: 'right' },
        { id: 'm', normal: 'm', shift: 'M', finger: 'right-index', hand: 'right' },
        { id: 'comma', normal: ',', shift: '<', finger: 'right-middle', hand: 'right' },
        { id: 'period', normal: '.', shift: '>', finger: 'right-ring', hand: 'right' },
        { id: 'slash', normal: '/', shift: '?', finger: 'right-pinky', hand: 'right' },
        { id: 'shift-r', normal: 'ShiftRight', label: '⇧ Shift', width: 2.6, finger: 'right-pinky', hand: 'right' },
      ],
      BOTTOM_SPACE_ROW,
    ],
  },
  dvorak: {
    name: 'Dvorak',
    description: 'Ergonomic alternating-hand vowel/consonant layout',
    rows: [
      NUMBER_ROW_US,
      [
        { id: 'tab', normal: '\t', label: 'Tab ⇥', width: 1.5, finger: 'left-pinky', hand: 'left' },
        { id: 'quote', normal: "'", shift: '"', finger: 'left-pinky', hand: 'left' },
        { id: 'comma', normal: ',', shift: '<', finger: 'left-ring', hand: 'left' },
        { id: 'period', normal: '.', shift: '>', finger: 'left-middle', hand: 'left' },
        { id: 'p', normal: 'p', shift: 'P', finger: 'left-index', hand: 'left' },
        { id: 'y', normal: 'y', shift: 'Y', finger: 'left-index', hand: 'left' },
        { id: 'f', normal: 'f', shift: 'F', finger: 'right-index', hand: 'right' },
        { id: 'g', normal: 'g', shift: 'G', finger: 'right-index', hand: 'right' },
        { id: 'c', normal: 'c', shift: 'C', finger: 'right-middle', hand: 'right' },
        { id: 'r', normal: 'r', shift: 'R', finger: 'right-ring', hand: 'right' },
        { id: 'l', normal: 'l', shift: 'L', finger: 'right-pinky', hand: 'right' },
        { id: 'slash', normal: '/', shift: '?', finger: 'right-pinky', hand: 'right' },
        { id: 'equal', normal: '=', shift: '+', finger: 'right-pinky', hand: 'right' },
        { id: 'backslash', normal: '\\', shift: '|', width: 1.5, finger: 'right-pinky', hand: 'right' },
      ],
      [
        { id: 'caps', normal: 'CapsLock', label: 'Caps', width: 1.8, finger: 'left-pinky', hand: 'left' },
        { id: 'a', normal: 'a', shift: 'A', finger: 'left-pinky', hand: 'left' },
        { id: 'o', normal: 'o', shift: 'O', finger: 'left-ring', hand: 'left' },
        { id: 'e', normal: 'e', shift: 'E', finger: 'left-middle', hand: 'left' },
        { id: 'u', normal: 'u', shift: 'U', finger: 'left-index', hand: 'left', isHomeBump: true },
        { id: 'i', normal: 'i', shift: 'I', finger: 'left-index', hand: 'left' },
        { id: 'd', normal: 'd', shift: 'D', finger: 'right-index', hand: 'right' },
        { id: 'h', normal: 'h', shift: 'H', finger: 'right-index', hand: 'right', isHomeBump: true },
        { id: 't', normal: 't', shift: 'T', finger: 'right-middle', hand: 'right' },
        { id: 'n', normal: 'n', shift: 'N', finger: 'right-ring', hand: 'right' },
        { id: 's', normal: 's', shift: 'S', finger: 'right-pinky', hand: 'right' },
        { id: 'minus', normal: '-', shift: '_', finger: 'right-pinky', hand: 'right' },
        { id: 'enter', normal: '\n', label: 'Enter ↵', width: 2.2, finger: 'right-pinky', hand: 'right' },
      ],
      [
        { id: 'shift-l', normal: 'ShiftLeft', label: '⇧ Shift', width: 2.4, finger: 'left-pinky', hand: 'left' },
        { id: 'semicolon', normal: ';', shift: ':', finger: 'left-pinky', hand: 'left' },
        { id: 'q', normal: 'q', shift: 'Q', finger: 'left-ring', hand: 'left' },
        { id: 'j', normal: 'j', shift: 'J', finger: 'left-middle', hand: 'left' },
        { id: 'k', normal: 'k', shift: 'K', finger: 'left-index', hand: 'left' },
        { id: 'x', normal: 'x', shift: 'X', finger: 'left-index', hand: 'left' },
        { id: 'b', normal: 'b', shift: 'B', finger: 'right-index', hand: 'right' },
        { id: 'm', normal: 'm', shift: 'M', finger: 'right-index', hand: 'right' },
        { id: 'w', normal: 'w', shift: 'W', finger: 'right-middle', hand: 'right' },
        { id: 'v', normal: 'v', shift: 'V', finger: 'right-ring', hand: 'right' },
        { id: 'z', normal: 'z', shift: 'Z', finger: 'right-pinky', hand: 'right' },
        { id: 'shift-r', normal: 'ShiftRight', label: '⇧ Shift', width: 2.6, finger: 'right-pinky', hand: 'right' },
      ],
      BOTTOM_SPACE_ROW,
    ],
  },
  colemak: {
    name: 'Colemak',
    description: 'Modern ergonomic layout preserving QWERTY shortcuts',
    rows: [
      NUMBER_ROW_US,
      [
        { id: 'tab', normal: '\t', label: 'Tab ⇥', width: 1.5, finger: 'left-pinky', hand: 'left' },
        { id: 'q', normal: 'q', shift: 'Q', finger: 'left-pinky', hand: 'left' },
        { id: 'w', normal: 'w', shift: 'W', finger: 'left-ring', hand: 'left' },
        { id: 'f', normal: 'f', shift: 'F', finger: 'left-middle', hand: 'left' },
        { id: 'p', normal: 'p', shift: 'P', finger: 'left-index', hand: 'left' },
        { id: 'g', normal: 'g', shift: 'G', finger: 'left-index', hand: 'left' },
        { id: 'j', normal: 'j', shift: 'J', finger: 'right-index', hand: 'right' },
        { id: 'l', normal: 'l', shift: 'L', finger: 'right-index', hand: 'right' },
        { id: 'u', normal: 'u', shift: 'U', finger: 'right-middle', hand: 'right' },
        { id: 'y', normal: 'y', shift: 'Y', finger: 'right-ring', hand: 'right' },
        { id: 'semicolon', normal: ';', shift: ':', finger: 'right-pinky', hand: 'right' },
        { id: 'bracket-l', normal: '[', shift: '{', finger: 'right-pinky', hand: 'right' },
        { id: 'bracket-r', normal: ']', shift: '}', finger: 'right-pinky', hand: 'right' },
        { id: 'backslash', normal: '\\', shift: '|', width: 1.5, finger: 'right-pinky', hand: 'right' },
      ],
      [
        { id: 'caps', normal: 'CapsLock', label: 'Caps', width: 1.8, finger: 'left-pinky', hand: 'left' },
        { id: 'a', normal: 'a', shift: 'A', finger: 'left-pinky', hand: 'left' },
        { id: 'r', normal: 'r', shift: 'R', finger: 'left-ring', hand: 'left' },
        { id: 's', normal: 's', shift: 'S', finger: 'left-middle', hand: 'left' },
        { id: 't', normal: 't', shift: 'T', finger: 'left-index', hand: 'left', isHomeBump: true },
        { id: 'd', normal: 'd', shift: 'D', finger: 'left-index', hand: 'left' },
        { id: 'h', normal: 'h', shift: 'H', finger: 'right-index', hand: 'right' },
        { id: 'n', normal: 'n', shift: 'N', finger: 'right-index', hand: 'right', isHomeBump: true },
        { id: 'e', normal: 'e', shift: 'E', finger: 'right-middle', hand: 'right' },
        { id: 'i', normal: 'i', shift: 'I', finger: 'right-ring', hand: 'right' },
        { id: 'o', normal: 'o', shift: 'O', finger: 'right-pinky', hand: 'right' },
        { id: 'quote', normal: "'", shift: '"', finger: 'right-pinky', hand: 'right' },
        { id: 'enter', normal: '\n', label: 'Enter ↵', width: 2.2, finger: 'right-pinky', hand: 'right' },
      ],
      [
        { id: 'shift-l', normal: 'ShiftLeft', label: '⇧ Shift', width: 2.4, finger: 'left-pinky', hand: 'left' },
        { id: 'z', normal: 'z', shift: 'Z', finger: 'left-pinky', hand: 'left' },
        { id: 'x', normal: 'x', shift: 'X', finger: 'left-ring', hand: 'left' },
        { id: 'c', normal: 'c', shift: 'C', finger: 'left-middle', hand: 'left' },
        { id: 'v', normal: 'v', shift: 'V', finger: 'left-index', hand: 'left' },
        { id: 'b', normal: 'b', shift: 'B', finger: 'left-index', hand: 'left' },
        { id: 'k', normal: 'k', shift: 'K', finger: 'right-index', hand: 'right' },
        { id: 'm', normal: 'm', shift: 'M', finger: 'right-index', hand: 'right' },
        { id: 'comma', normal: ',', shift: '<', finger: 'right-middle', hand: 'right' },
        { id: 'period', normal: '.', shift: '>', finger: 'right-ring', hand: 'right' },
        { id: 'slash', normal: '/', shift: '?', finger: 'right-pinky', hand: 'right' },
        { id: 'shift-r', normal: 'ShiftRight', label: '⇧ Shift', width: 2.6, finger: 'right-pinky', hand: 'right' },
      ],
      BOTTOM_SPACE_ROW,
    ],
  },
};

export interface TargetKeyGuide {
  keyCap: KeyCapDef;
  needsShift: boolean;
  shiftKeyId: 'shift-l' | 'shift-r' | null;
  shiftFinger: FingerId | null;
}

export function resolveCharToKeyGuide(
  expectedChar: string | null,
  layoutId: KeyboardLayoutId = 'qwerty-us'
): TargetKeyGuide | null {
  if (!expectedChar) return null;
  const layout = KEYBOARD_LAYOUTS[layoutId] || KEYBOARD_LAYOUTS['qwerty-us'];

  for (const row of layout.rows) {
    for (const keyCap of row) {
      if (keyCap.normal === expectedChar) {
        return {
          keyCap,
          needsShift: false,
          shiftKeyId: null,
          shiftFinger: null,
        };
      }
      if (keyCap.shift === expectedChar) {
        // Opposite hand presses Shift!
        const useLeftShift = keyCap.hand === 'right';
        return {
          keyCap,
          needsShift: true,
          shiftKeyId: useLeftShift ? 'shift-l' : 'shift-r',
          shiftFinger: useLeftShift ? 'left-pinky' : 'right-pinky',
        };
      }
    }
  }
  return null;
}
