# Build, Testing & Windows `.exe` Packaging Guide

This guide explains the technical architecture of **TypingAlpha** and how to run tests, regenerate application icons, and build the Windows `.exe` installer and portable packages from source.

---

## 1. Prerequisites
- **Node.js**: `v18+` (tested with `v24.14.1`)
- **npm**: `v9+` (tested with `v11.11.0`)
- **OS**: Windows 10 or Windows 11 (x64)

---

## 2. Project Directory Structure

```text
typing_alpha/
├── build/                      # Generated multi-size Windows icon.ico & icon.png
├── dist/                       # Compiled Vite production web bundle
├── docs/                       # User & Developer documentation guides (guide_*.md)
├── electron/
│   ├── main.cjs                # Electron main process, native window, %APPDATA% IPC storage
│   └── preload.cjs             # Context-isolated window.electronAPI bridge
├── public/
│   ├── icon.svg                # Vector 3D Mechanical Keycap ('α') icon
│   └── icon.png                # 256x256 PNG icon
├── release/                    # Packaged Windows .exe outputs (Setup & Portable)
├── scripts/
│   └── generate-icon.mjs       # Zero-dependency Node script that builds icon.ico & icon.png
├── src/
│   ├── components/             # TypingArena, VisualKeyboard, HandGuide, LearningCalendarView, AnalyticsView
│   ├── data/                   # curriculum.ts, learningCalendar.ts, keyboardLayouts.ts, practicePools.ts
│   ├── engine/                 # typingEngine.ts, adaptiveGenerator.ts, soundEngine.ts + Vitest unit tests
│   ├── store/                  # useProgressStore.ts (Dual %APPDATA% + localStorage persistence)
│   └── styles/                 # themes.css (5 themes, smooth gliding caret, custom scrollbars)
├── package.json
├── Start-TypingAlpha.bat       # 1-click local Windows launcher
└── vite.config.ts
```

---

## 3. Essential NPM Scripts

```powershell
# 1. Install dependencies
npm install

# 2. Run automated unit tests (Vitest)
npm test

# 3. Start Vite + Electron in live-reload development mode
npm run electron:dev

# 4. Build TypeScript & Vite production bundle into dist/
npm run build

# 5. Launch the built Electron desktop app immediately
npm run electron:start

# 6. Regenerate custom Windows .ico and .png icons in build/ and public/
npm run icon:gen

# 7. Package Windows Setup Installer (.exe) and Portable (.exe) into release/
npm run electron:dist
```

---

## 4. Windows `.exe` Output Artifacts

Running `npm run electron:dist` executes `scripts/generate-icon.mjs`, compiles the TypeScript/Vite bundle, and invokes `electron-builder` to produce:

1. **`release/TypingAlpha-Setup-1.0.0.exe`**:
   - NSIS Windows Setup Wizard (`oneClick: false`, `allowToChangeInstallationDirectory: true`).
   - Creates **Desktop** and **Start Menu** shortcuts with the custom `α` keycap icon and includes an uninstaller.
2. **`release/TypingAlpha-Portable-1.0.0.exe`**:
   - Standalone single-file portable executable that runs without installation.
3. **`release/win-unpacked/TypingAlpha.exe`**:
   - Unpacked Windows application binary for instant inspection or execution.
