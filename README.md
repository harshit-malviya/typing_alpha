# TypingAlpha — Free & Open-Source English Touch-Typing Trainer for Windows

**TypingAlpha** is a 100% free, offline, open-source touch-typing learning and speed mastery desktop application for Windows built with **Electron, React, TypeScript, and Vite**.

## Key Features
- **Structured 6-Module Touch-Typing Course (24 Guided Lessons)**: Progress step-by-step from Home Row anchors (`F & J`, `D & K`, `S & L`, `A & ;`, `G & H`) to Top Row, Bottom Row, Opposite-Hand `Shift` Capitalization, Numbers & Symbols, and N-Gram Fluency.
- **Adaptive Weak-Key Practice (Keybr-style)**: Starts with the 6 most common letters (`E N I T R L`) and algorithmically generates pronounceable and real words targeting your slowest or least accurate keys, unlocking new letters as your confidence reaches ≥80%.
- **Speed & N-Gram Tests (Monkeytype-style)**: Timed (`15s`, `30s`, `60s`, `120s`) and Word Count (`15`, `25`, `50`, `100`) tests across Top 200/1000 English words, Top Bigrams, Top Trigrams, and Alternating-Hand words.
- **Quotes, Literature & Code Snippets**: Practice real-world punctuation with famous quotes or programming syntax in `Python`, `TypeScript`, `C++`, and `Rust`.
- **Custom Text Studio**: Paste any text or load a local `.txt` file to practice.
- **Visual & Audio Learning Aids**:
  - Interactive On-Screen Keyboard (`US QWERTY`, `UK QWERTY`, `Dvorak`, `Colemak`) with color-coded finger zones and opposite-hand `Shift` highlighting.
  - Dual-Hand SVG Finger Guide showing the exact finger to use for every keystroke.
  - Zero-dependency Web Audio API Mechanical Switch Synthesizer (`Cherry MX Blue`, `MX Brown`, `MX Red`, `Vintage Typewriter`).
- **Permanent Offline Data Persistence**: Automatically saves all lesson stars, XP, level, daily streak, session history, and per-key heatmap statistics to `%APPDATA%\typing-alpha\user-progress.json` (plus `localStorage` fallback and 1-click JSON Export/Import backup).

## Quick Start

```bash
# Install dependencies
npm install

# Run unit tests
npm test

# Build production bundle
npm run build

# Launch the native Windows Electron desktop app
npm run electron:start

# Or run in development mode (Vite + Electron)
npm run electron:dev
```
