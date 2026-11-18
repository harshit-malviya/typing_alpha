# Offline Data Persistence, Privacy & Backup Guide

**TypingAlpha** is 100% offline and privacy-first: there are no accounts, no cloud servers, no telemetry tracking, and no subscriptions. All of your typing statistics and learning progress remain on your own computer.

---

## 1. Where Your Progress Is Stored on Windows

TypingAlpha uses a **dual-layer local persistence architecture** so your data is safe across restarts, updates, or browser cache resets:

1. **Primary Native Windows Disk File (`%APPDATA%`)**:
   - Whenever you run the Windows desktop app (installed, portable, or via `npm run electron:start`), every completed drill, lesson star, calendar task, and setting change is atomically written to:
     ```text
     C:\Users\<YourUsername>\AppData\Roaming\typing-alpha\user-progress.json
     ```
   - Atomic writes use a temporary file (`user-progress.json.tmp`) before renaming so your save file can never be corrupted if your PC loses power mid-save.
2. **Browser `localStorage` Mirror**:
   - Also mirrors your state to `localStorage` under the key `typing_alpha_progress_v1` so your progress is available if you run `npm run dev` in a web browser.

---

## 2. What Data Is Saved Automatically

- **Learning Calendar Progress**: Active study track (`14-day`, `30-day`, `60-day`), completed daily workout steps (`Task 1`, `Task 2`, `Task 3`), completed days, and your real-date `dailyActivityLog`.
- **Course Progress**: Best WPM, Best Accuracy, 1–3 Star ratings (`★`), and attempt counts for all 24 lessons.
- **Adaptive Weak-Key Telemetry**: Per-key hit counts, miss counts, and keystroke transition latency (`ms`) used to compute your per-key heatmap and adaptive letter unlocks.
- **Gamification & History**: Total XP, Typist Level, Daily Streak (`🔥`), Total Time Typed, and your last 120 session logs.
- **UI & Audio Preferences**: Active Theme, Keyboard Layout (`US QWERTY`, `UK QWERTY`, `Dvorak`, `Colemak`), Caret style, Mechanical Switch sound profile, Error handling mode (`Stop on Error` vs. `Type Through`), and saved Custom Text.

---

## 3. Backing Up or Moving Your Progress to Another PC

1. Open **TypingAlpha** and click **Analytics & Heatmap** in the left sidebar.
2. Scroll down to the **Offline Data Persistence & Backup** card on the bottom right:
   - Click **Export Progress Backup (.json)** to save a timestamped `typing-alpha-backup-YYYY-MM-DD.json` file anywhere on your computer.
   - Click **Import Progress Backup (.json)** to restore a backup file at any time.
   - Click **Reset All Progress** (with confirmation) if you ever want to start fresh from Level 1 / Day 1.
