import React, { useState, useEffect } from 'react';
import {
  Palette,
  X,
  Copy,
  Upload,
  Trash2,
  Save,
  PlusCircle,
  Check,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  BUILT_IN_THEMES,
  BuiltInThemeId,
  CustomThemeDef,
  PALETTE_FIELD_METADATA,
  ThemePalette,
  applyThemeToDom,
  resolvePaletteForThemeId,
  validateAndParseCustomThemeJson,
} from '../data/themeRegistry';

interface ThemeStudioModalProps {
  activeThemeId: string;
  customThemes: CustomThemeDef[];
  onSelectTheme: (themeId: string) => void;
  onSaveCustomTheme: (theme: CustomThemeDef, setAsActive?: boolean) => void;
  onDeleteCustomTheme: (themeId: string) => void;
  onClose: () => void;
}

export const ThemeStudioModal: React.FC<ThemeStudioModalProps> = ({
  activeThemeId,
  customThemes,
  onSelectTheme,
  onSaveCustomTheme,
  onDeleteCustomTheme,
  onClose,
}) => {
  const activeCustom = customThemes.find((t) => t.id === activeThemeId) || null;

  const [baseThemeId, setBaseThemeId] = useState<string>(
    activeCustom ? activeCustom.baseThemeId : activeThemeId
  );
  const [editingCustomId, setEditingCustomId] = useState<string | null>(
    activeCustom ? activeCustom.id : null
  );
  const [themeName, setThemeName] = useState<string>(() => {
    if (activeCustom) return activeCustom.name;
    const baseName =
      BUILT_IN_THEMES[activeThemeId as BuiltInThemeId]?.name || 'Dark Slate';
    return `${baseName} Remix`;
  });

  const [draftPalette, setDraftPalette] = useState<ThemePalette>(() =>
    resolvePaletteForThemeId(activeThemeId, customThemes)
  );

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showImportBox, setShowImportBox] = useState<boolean>(false);
  const [importJsonText, setImportJsonText] = useState<string>('');

  // Live preview the draftPalette on the real DOM while the modal is open!
  useEffect(() => {
    applyThemeToDom(activeThemeId, customThemes, draftPalette);
    return () => {
      // Restore committed theme on unmount
      applyThemeToDom(activeThemeId, customThemes, null);
    };
  }, [draftPalette, activeThemeId, customThemes]);

  const showNotice = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3200);
  };

  // Inherit colors from any Built-in or Custom theme
  const handleInheritFromTheme = (sourceThemeId: string) => {
    const inheritedPalette = resolvePaletteForThemeId(
      sourceThemeId,
      customThemes
    );
    setDraftPalette(inheritedPalette);

    const customMatch = customThemes.find((t) => t.id === sourceThemeId);
    if (customMatch) {
      setEditingCustomId(customMatch.id);
      setBaseThemeId(customMatch.baseThemeId);
      setThemeName(customMatch.name);
      showNotice(`Loaded custom theme "${customMatch.name}" for editing or cloning.`);
    } else {
      const builtInName =
        BUILT_IN_THEMES[sourceThemeId as BuiltInThemeId]?.name || 'Custom';
      setEditingCustomId(null);
      setBaseThemeId(sourceThemeId);
      setThemeName(`${builtInName} Remix`);
      showNotice(`Inherited base colors from "${builtInName}".`);
    }
  };

  const handleColorChange = (key: keyof ThemePalette, value: string) => {
    setDraftPalette((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Save as a brand-new named custom theme copy
  const handleSaveAsNewCopy = () => {
    const cleanName = themeName.trim() || 'My Custom Theme';
    const newTheme: CustomThemeDef = {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: cleanName,
      baseThemeId,
      palette: { ...draftPalette },
      createdAt: new Date().toISOString(),
    };
    onSaveCustomTheme(newTheme, true);
    setEditingCustomId(newTheme.id);
    showNotice(`Saved new theme "${cleanName}" and set it as active!`);
  };

  // Update the currently selected custom theme in-place
  const handleUpdateExisting = () => {
    if (!editingCustomId) return;
    const cleanName = themeName.trim() || 'My Custom Theme';
    const updated: CustomThemeDef = {
      id: editingCustomId,
      name: cleanName,
      baseThemeId,
      palette: { ...draftPalette },
      createdAt: new Date().toISOString(),
    };
    onSaveCustomTheme(updated, true);
    showNotice(`Updated theme "${cleanName}"!`);
  };

  const handleCopyThemeJson = async () => {
    const payload = {
      name: themeName.trim() || 'My Custom Theme',
      baseThemeId,
      palette: draftPalette,
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      showNotice('Theme JSON copied to clipboard!');
    } catch {
      showNotice('Could not copy to clipboard.');
    }
  };

  const handleImportThemeJson = () => {
    const parsed = validateAndParseCustomThemeJson(importJsonText);
    if (!parsed) {
      showNotice('Invalid Theme JSON format. Please check all 8 hex colors.');
      return;
    }
    const newTheme: CustomThemeDef = {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: parsed.name,
      baseThemeId: parsed.baseThemeId,
      palette: parsed.palette,
      createdAt: new Date().toISOString(),
    };
    onSaveCustomTheme(newTheme, true);
    setDraftPalette(newTheme.palette);
    setThemeName(newTheme.name);
    setEditingCustomId(newTheme.id);
    setShowImportBox(false);
    setImportJsonText('');
    showNotice(`Imported and activated theme "${newTheme.name}"!`);
  };

  return (
    <div
      className="theme-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Theme Studio & Customizer"
    >
      <div className="theme-modal-card">
        {/* Modal Header */}
        <div className="theme-modal-header">
          <div className="theme-modal-title-group">
            <div className="brand-logo" style={{ width: 34, height: 34 }}>
              <Palette size={18} />
            </div>
            <div>
              <h3>Theme Studio — Inherit & Customize</h3>
              <p className="section-sub">
                Start from any predefined theme, customize its 8 core colors with live preview, and save a new copy.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="control-chip"
            onClick={onClose}
            title="Close Theme Studio"
          >
            <X size={16} /> Close
          </button>
        </div>

        {/* Step 1: Inherit from Predefined Theme or Existing Custom Theme */}
        <div className="theme-studio-section">
          <div className="studio-step-label">
            1. INHERIT BASE COLORS FROM PREDEFINED THEME
          </div>
          <div className="preset-inheritance-row">
            {(Object.keys(BUILT_IN_THEMES) as BuiltInThemeId[]).map((tId) => {
              const def = BUILT_IN_THEMES[tId];
              const isSelectedBase = !editingCustomId && baseThemeId === tId;
              return (
                <button
                  key={tId}
                  type="button"
                  className={`preset-pill-btn ${
                    isSelectedBase ? 'preset-pill-active' : ''
                  }`}
                  onClick={() => handleInheritFromTheme(tId)}
                >
                  <span className="preset-swatches">
                    <i style={{ background: def.palette.bgPrimary }} />
                    <i style={{ background: def.palette.accentPrimary }} />
                    <i style={{ background: def.palette.textPrimary }} />
                  </span>
                  <span>{def.name}</span>
                </button>
              );
            })}
          </div>

          {customThemes.length > 0 && (
            <div className="saved-custom-themes-strip">
              <span className="studio-sub-label">Your Saved Custom Themes:</span>
              <div className="preset-inheritance-row">
                {customThemes.map((ct) => {
                  const isEditingThis = editingCustomId === ct.id;
                  return (
                    <button
                      key={ct.id}
                      type="button"
                      className={`preset-pill-btn ${
                        isEditingThis ? 'preset-pill-active' : ''
                      }`}
                      onClick={() => {
                        handleInheritFromTheme(ct.id);
                        onSelectTheme(ct.id);
                      }}
                    >
                      <span className="preset-swatches">
                        <i style={{ background: ct.palette.bgPrimary }} />
                        <i style={{ background: ct.palette.accentPrimary }} />
                        <i style={{ background: ct.palette.textPrimary }} />
                      </span>
                      <span>{ct.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Customize Smart 8-Color Palette */}
        <div className="theme-studio-section">
          <div className="studio-header-inline">
            <span className="studio-step-label">
              2. CUSTOMIZE 8 CORE COLORS (LIVE PREVIEW ACTIVE)
            </span>
            <button
              type="button"
              className="control-chip"
              onClick={() => handleInheritFromTheme(baseThemeId)}
              title="Reset colors back to the inherited base theme"
            >
              <RotateCcw size={13} /> Reset to Base ({BUILT_IN_THEMES[baseThemeId as BuiltInThemeId]?.name || 'Base'})
            </button>
          </div>

          <div className="palette-editor-grid">
            {PALETTE_FIELD_METADATA.map((field) => {
              const currentHex = draftPalette[field.key];
              return (
                <label key={field.key} className="palette-color-card">
                  <div className="color-card-top">
                    <span className="color-role-title">{field.label}</span>
                    <div className="color-picker-wrap">
                      <input
                        type="color"
                        value={
                          /^#[0-9a-fA-F]{6}$/.test(currentHex)
                            ? currentHex
                            : '#38bdf8'
                        }
                        onChange={(e) =>
                          handleColorChange(field.key, e.target.value)
                        }
                        className="native-color-input"
                      />
                      <input
                        type="text"
                        value={currentHex}
                        onChange={(e) =>
                          handleColorChange(field.key, e.target.value)
                        }
                        className="hex-text-input"
                        maxLength={7}
                      />
                    </div>
                  </div>
                  <span className="color-role-desc">{field.description}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Live Mini Sample Arena Preview */}
        <div
          className="theme-mini-preview-box"
          style={{
            background: draftPalette.bgSecondary,
            borderColor: draftPalette.accentPrimary,
          }}
        >
          <div className="mini-preview-header">
            <span style={{ color: draftPalette.accentPrimary, fontWeight: 800 }}>
              <Sparkles size={13} /> Live Typing Preview
            </span>
            <span
              className="mini-preview-keycap"
              style={{
                background: draftPalette.keycapBg,
                color: draftPalette.textPrimary,
                borderColor: draftPalette.accentPrimary,
              }}
            >
              F (Index)
            </span>
          </div>
          <div className="mini-preview-text">
            <span style={{ color: draftPalette.textPrimary }}>
              the quick brown{' '}
            </span>
            <span
              style={{
                background: draftPalette.accentRose,
                color: '#fff',
                padding: '0 4px',
                borderRadius: 4,
              }}
            >
              x
            </span>
            <span
              style={{
                borderLeft: `3px solid ${draftPalette.accentPrimary}`,
                color: draftPalette.textPrimary,
                paddingLeft: 2,
              }}
            >
              f
            </span>
            <span style={{ color: draftPalette.textMuted }}>
              ox jumps over the lazy dog.
            </span>
          </div>
        </div>

        {/* Status Toast */}
        {statusMessage && (
          <div className="theme-status-banner">
            <Check size={15} />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Optional Import Theme JSON Drawer */}
        {showImportBox && (
          <div className="theme-import-drawer">
            <textarea
              className="custom-textarea"
              placeholder='Paste Theme JSON here (e.g. {"name": "Ocean", "baseThemeId": "dark-slate", "palette": {...}})'
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              style={{ minHeight: 75 }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowImportBox(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleImportThemeJson}
              >
                Import & Save Theme
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Name & Save Copy Footer */}
        <div className="theme-modal-footer">
          <div className="theme-name-input-group">
            <label htmlFor="custom-theme-name-input" className="studio-step-label">
              3. NEW THEME NAME:
            </label>
            <input
              id="custom-theme-name-input"
              type="text"
              className="theme-name-input"
              value={themeName}
              onChange={(e) => setThemeName(e.target.value)}
              placeholder="e.g. Midnight Emerald"
              maxLength={36}
            />
          </div>

          <div className="theme-footer-buttons">
            <button
              type="button"
              className="control-chip"
              onClick={handleCopyThemeJson}
              title="Copy this theme's JSON to share or back up"
            >
              <Copy size={14} /> Copy JSON
            </button>

            <button
              type="button"
              className="control-chip"
              onClick={() => setShowImportBox(!showImportBox)}
              title="Import a theme from JSON"
            >
              <Upload size={14} /> Import JSON
            </button>

            {editingCustomId && (
              <>
                <button
                  type="button"
                  className="btn-danger-outline"
                  onClick={() => {
                    onDeleteCustomTheme(editingCustomId);
                    setEditingCustomId(null);
                    showNotice('Deleted custom theme.');
                  }}
                >
                  <Trash2 size={15} /> Delete
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleUpdateExisting}
                >
                  <Save size={15} /> Update "{themeName.slice(0, 16)}"
                </button>
              </>
            )}

            <button
              type="button"
              className="btn-primary"
              onClick={handleSaveAsNewCopy}
            >
              <PlusCircle size={16} /> Save as New Theme Copy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
