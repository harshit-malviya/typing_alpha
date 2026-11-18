export type BuiltInThemeId =
  | 'dark-slate'
  | 'serika-dark'
  | 'cyberpunk-neon'
  | 'catppuccin-mocha'
  | 'light-paper';

export interface ThemePalette {
  bgPrimary: string;
  bgSecondary: string;
  textPrimary: string;
  textMuted: string;
  accentPrimary: string;
  accentEmerald: string;
  accentRose: string;
  keycapBg: string;
}

export interface CustomThemeDef {
  id: string;
  name: string;
  baseThemeId: string;
  palette: ThemePalette;
  createdAt: string;
}

export interface BuiltInThemeDef {
  id: BuiltInThemeId;
  name: string;
  palette: ThemePalette;
}

export const BUILT_IN_THEMES: Record<BuiltInThemeId, BuiltInThemeDef> = {
  'dark-slate': {
    id: 'dark-slate',
    name: 'Dark Slate',
    palette: {
      bgPrimary: '#0b1120',
      bgSecondary: '#111827',
      textPrimary: '#f8fafc',
      textMuted: '#475569',
      accentPrimary: '#38bdf8',
      accentEmerald: '#10b981',
      accentRose: '#f43f5e',
      keycapBg: '#1e293b',
    },
  },
  'serika-dark': {
    id: 'serika-dark',
    name: 'Serika Dark',
    palette: {
      bgPrimary: '#323437',
      bgSecondary: '#2c2e31',
      textPrimary: '#d1d0c5',
      textMuted: '#646669',
      accentPrimary: '#e2b714',
      accentEmerald: '#4ade80',
      accentRose: '#ca4754',
      keycapBg: '#26282b',
    },
  },
  'cyberpunk-neon': {
    id: 'cyberpunk-neon',
    name: 'Cyberpunk Neon',
    palette: {
      bgPrimary: '#090418',
      bgSecondary: '#12092b',
      textPrimary: '#f0abfc',
      textMuted: '#5b4b8a',
      accentPrimary: '#00f5d4',
      accentEmerald: '#00f5d4',
      accentRose: '#ff007f',
      keycapBg: '#160b36',
    },
  },
  'catppuccin-mocha': {
    id: 'catppuccin-mocha',
    name: 'Catppuccin Mocha',
    palette: {
      bgPrimary: '#1e1e2e',
      bgSecondary: '#181825',
      textPrimary: '#cdd6f4',
      textMuted: '#585b70',
      accentPrimary: '#cba6f7',
      accentEmerald: '#a6e3a1',
      accentRose: '#f38ba8',
      keycapBg: '#262738',
    },
  },
  'light-paper': {
    id: 'light-paper',
    name: 'Light Paper',
    palette: {
      bgPrimary: '#faf8f5',
      bgSecondary: '#f1ede6',
      textPrimary: '#1c1917',
      textMuted: '#a8a29e',
      accentPrimary: '#0284c7',
      accentEmerald: '#059669',
      accentRose: '#e11d48',
      keycapBg: '#ffffff',
    },
  },
};

export const PALETTE_FIELD_METADATA: {
  key: keyof ThemePalette;
  label: string;
  description: string;
}[] = [
  {
    key: 'bgPrimary',
    label: 'App Background',
    description: 'Main window and workspace canvas color',
  },
  {
    key: 'bgSecondary',
    label: 'Surface & Typing Box',
    description: 'Cards, sidebar, and typing arena background',
  },
  {
    key: 'textPrimary',
    label: 'Typed Text & Headings',
    description: 'Correctly typed characters and primary UI text',
  },
  {
    key: 'textMuted',
    label: 'Pending Reference Text',
    description: 'Untyped target characters waiting to be typed',
  },
  {
    key: 'accentPrimary',
    label: 'Caret & Primary Accent',
    description: 'Gliding cursor, active target keycap, and highlights',
  },
  {
    key: 'accentEmerald',
    label: 'Success & Progress',
    description: 'Completion badges, progress bars, and high accuracy',
  },
  {
    key: 'accentRose',
    label: 'Error & Mistake Highlight',
    description: 'Wrong keystrokes, error badges, and weak-key chips',
  },
  {
    key: 'keycapBg',
    label: 'Keycap Surface',
    description: 'Interactive on-screen keyboard key background',
  },
];

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleaned = hex.replace('#', '').trim();
  if (cleaned.length === 3) {
    const r = parseInt(cleaned[0] + cleaned[0], 16) || 0;
    const g = parseInt(cleaned[1] + cleaned[1], 16) || 0;
    const b = parseInt(cleaned[2] + cleaned[2], 16) || 0;
    return { r, g, b };
  }
  const r = parseInt(cleaned.slice(0, 2), 16) || 0;
  const g = parseInt(cleaned.slice(2, 4), 16) || 0;
  const b = parseInt(cleaned.slice(4, 6), 16) || 0;
  return { r, g, b };
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return (
    '#' +
    [clamp(r), clamp(g), clamp(b)]
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
  );
}

function mixHex(hexA: string, hexB: string, weightB: number): string {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const w = Math.max(0, Math.min(1, weightB));
  return rgbToHex(
    a.r * (1 - w) + b.r * w,
    a.g * (1 - w) + b.g * w,
    a.b * (1 - w) + b.b * w
  );
}

function rgbaString(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Computes all 15 CSS custom properties from the Smart 8-Color Palette
 * so borders, elevated surfaces, secondary text, and glows automatically match!
 */
export function deriveCssVariablesFromPalette(
  palette: ThemePalette
): Record<string, string> {
  const bgElevated = mixHex(palette.bgSecondary, palette.textPrimary, 0.08);
  const textSecondary = mixHex(palette.textPrimary, palette.textMuted, 0.45);
  const keycapBorder = mixHex(palette.keycapBg, palette.textPrimary, 0.16);
  const accentAmber = mixHex(palette.accentPrimary, '#f59e0b', 0.65);

  return {
    '--bg-primary': palette.bgPrimary,
    '--bg-secondary': palette.bgSecondary,
    '--bg-elevated': bgElevated,
    '--bg-glass': rgbaString(palette.bgSecondary, 0.82),
    '--text-primary': palette.textPrimary,
    '--text-secondary': textSecondary,
    '--text-muted': palette.textMuted,
    '--accent-primary': palette.accentPrimary,
    '--accent-glow': rgbaString(palette.accentPrimary, 0.26),
    '--accent-emerald': palette.accentEmerald,
    '--accent-amber': accentAmber,
    '--accent-rose': palette.accentRose,
    '--border-subtle': rgbaString(palette.textPrimary, 0.14),
    '--keycap-bg': palette.keycapBg,
    '--keycap-border': keycapBorder,
  };
}

export function resolvePaletteForThemeId(
  themeId: string,
  customThemes: CustomThemeDef[]
): ThemePalette {
  if (themeId in BUILT_IN_THEMES) {
    return { ...BUILT_IN_THEMES[themeId as BuiltInThemeId].palette };
  }
  const found = customThemes.find((t) => t.id === themeId);
  if (found) {
    return { ...found.palette };
  }
  return { ...BUILT_IN_THEMES['dark-slate'].palette };
}

export function applyThemeToDom(
  activeThemeId: string,
  customThemes: CustomThemeDef[],
  livePreviewPalette?: ThemePalette | null
): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  const paletteToApply =
    livePreviewPalette ?? resolvePaletteForThemeId(activeThemeId, customThemes);

  // Set data-theme for built-in reference
  if (!livePreviewPalette && activeThemeId in BUILT_IN_THEMES) {
    root.setAttribute('data-theme', activeThemeId);
  } else {
    root.setAttribute('data-theme', 'custom');
  }

  const vars = deriveCssVariablesFromPalette(paletteToApply);
  for (const [prop, val] of Object.entries(vars)) {
    root.style.setProperty(prop, val);
  }
}

export function validateAndParseCustomThemeJson(
  rawJson: string
): Omit<CustomThemeDef, 'id' | 'createdAt'> | null {
  try {
    const obj = JSON.parse(rawJson);
    if (!obj || typeof obj !== 'object') return null;
    const name = typeof obj.name === 'string' && obj.name.trim() ? obj.name.trim() : 'Imported Theme';
    const baseThemeId = typeof obj.baseThemeId === 'string' ? obj.baseThemeId : 'dark-slate';
    const p = obj.palette;
    if (!p || typeof p !== 'object') return null;

    const requiredKeys: (keyof ThemePalette)[] = [
      'bgPrimary',
      'bgSecondary',
      'textPrimary',
      'textMuted',
      'accentPrimary',
      'accentEmerald',
      'accentRose',
      'keycapBg',
    ];

    for (const k of requiredKeys) {
      if (typeof p[k] !== 'string' || !/^#[0-9a-fA-F]{3,6}$/.test(p[k].trim())) {
        return null;
      }
    }

    return {
      name: name.slice(0, 40),
      baseThemeId,
      palette: {
        bgPrimary: p.bgPrimary.trim(),
        bgSecondary: p.bgSecondary.trim(),
        textPrimary: p.textPrimary.trim(),
        textMuted: p.textMuted.trim(),
        accentPrimary: p.accentPrimary.trim(),
        accentEmerald: p.accentEmerald.trim(),
        accentRose: p.accentRose.trim(),
        keycapBg: p.keycapBg.trim(),
      },
    };
  } catch {
    return null;
  }
}
