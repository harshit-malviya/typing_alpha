import React, { useState, useMemo } from 'react';
import {
  Calendar,
  BookOpen,
  Cpu,
  Gauge,
  Quote,
  FileText,
  BarChart3,
  Flame,
  Star,
  Volume2,
  Palette,
  Keyboard as KeyboardIcon,
  Sparkles,
  FolderOpen,
  RefreshCw,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import { CURRICULUM_MODULES } from './data/curriculum';
import {
  ADAPTIVE_LETTER_ORDER,
  computeKeyConfidence,
  generateAdaptiveDrill,
} from './engine/adaptiveGenerator';
import {
  QUOTES_POOL,
  CODE_SNIPPETS_POOL,
  generateWordTestText,
} from './data/practicePools';
import {
  CalendarDayPlan,
  generateTrackSchedule,
} from './data/learningCalendar';
import { KEYBOARD_LAYOUTS, KeyboardLayoutId } from './data/keyboardLayouts';
import { SoundProfile } from './engine/soundEngine';
import {
  useProgressStore,
  calculateLevelFromXp,
  ThemeId,
  CaretStyle,
} from './store/useProgressStore';
import { TypingArena } from './components/TypingArena';
import { AnalyticsView } from './components/AnalyticsView';
import { LearningCalendarView } from './components/LearningCalendarView';
import { ThemeStudioModal } from './components/ThemeStudioModal';
import { BUILT_IN_THEMES } from './data/themeRegistry';

type NavTab =
  | 'calendar'
  | 'course'
  | 'adaptive'
  | 'speed'
  | 'quotes'
  | 'custom'
  | 'analytics';

export function App() {
  const {
    data,
    storagePath,
    updateSettings,
    setCalendarTrack,
    recordCompletedSession,
    setAdaptiveUnlockedCount,
    saveCustomText,
    saveCustomTheme,
    deleteCustomTheme,
    importProgressJson,
    resetAllProgress,
  } = useProgressStore();

  const [activeTab, setActiveTab] = useState<NavTab>('calendar');
  const [isActivelyTyping, setIsActivelyTyping] = useState<boolean>(false);
  const [showThemeStudio, setShowThemeStudio] = useState<boolean>(false);

  // Guided Daily Calendar Workout Playlist state
  const [activeCalendarWorkout, setActiveCalendarWorkout] = useState<{
    dayPlan: CalendarDayPlan;
    taskIndex: 0 | 1 | 2;
  } | null>(null);

  // Course Mode state
  const [selectedModuleId, setSelectedModuleId] = useState<string>(
    CURRICULUM_MODULES[0].id
  );
  const [selectedLessonId, setSelectedLessonId] = useState<string>(
    CURRICULUM_MODULES[0].lessons[0].id
  );

  // Adaptive Mode state
  const [adaptiveCapitals, setAdaptiveCapitals] = useState<boolean>(false);
  const [adaptivePunctuation, setAdaptivePunctuation] = useState<boolean>(false);
  const [adaptiveSeed, setAdaptiveSeed] = useState<number>(0);

  // Speed Test state
  const [speedTestType, setSpeedTestType] = useState<'words' | 'timed'>('words');
  const [speedWordCount, setSpeedWordCount] = useState<number>(25);
  const [speedTimeSec, setSpeedTimeSec] = useState<number>(30);
  const [speedPool, setSpeedPool] = useState<
    'top200' | 'top1000' | 'bigrams' | 'trigrams' | 'alternating'
  >('top200');
  const [speedPunctuation, setSpeedPunctuation] = useState<boolean>(false);
  const [speedNumbers, setSpeedNumbers] = useState<boolean>(false);
  const [speedSeed, setSpeedSeed] = useState<number>(0);

  // Quotes & Code state
  const [realWorldSubMode, setRealWorldSubMode] = useState<'quotes' | 'code'>('quotes');
  const [quoteIdx, setQuoteIdx] = useState<number>(0);
  const [codeIdx, setCodeIdx] = useState<number>(0);

  // Custom Text state
  const [customDraft, setCustomDraft] = useState<string>(data.customTextSaved);
  const [showCustomEditor, setShowCustomEditor] = useState<boolean>(false);

  const levelInfo = calculateLevelFromXp(data.xp);

  // Active Calendar Track Info for Sidebar badge
  const currentTrackSchedule = useMemo(
    () => generateTrackSchedule(data.calendar.activeTrack),
    [data.calendar.activeTrack]
  );
  const completedTrackDays =
    data.calendar.completedDaysByTrack[data.calendar.activeTrack] || {};
  const nextCalendarDayNumber = useMemo(() => {
    for (const d of currentTrackSchedule) {
      if (!completedTrackDays[d.dayNumber]) return d.dayNumber;
    }
    return currentTrackSchedule.length;
  }, [currentTrackSchedule, completedTrackDays]);

  // Active Course Module & Lesson
  const currentModule =
    CURRICULUM_MODULES.find((m) => m.id === selectedModuleId) ||
    CURRICULUM_MODULES[0];
  const currentLesson =
    currentModule.lessons.find((l) => l.id === selectedLessonId) ||
    currentModule.lessons[0];

  const allLessonsFlat = useMemo(
    () => CURRICULUM_MODULES.flatMap((m) => m.lessons),
    []
  );

  const handleAdvanceToNextLesson = () => {
    const idx = allLessonsFlat.findIndex((l) => l.id === currentLesson.id);
    if (idx >= 0 && idx + 1 < allLessonsFlat.length) {
      const nextLesson = allLessonsFlat[idx + 1];
      setSelectedModuleId(nextLesson.moduleId);
      setSelectedLessonId(nextLesson.id);
    }
  };

  // Adaptive Drill generation
  const adaptiveDrill = useMemo(
    () =>
      generateAdaptiveDrill(
        data.adaptiveUnlockedCount,
        data.keyStats,
        22,
        adaptiveCapitals,
        adaptivePunctuation
      ),
    [
      data.adaptiveUnlockedCount,
      data.keyStats,
      adaptiveCapitals,
      adaptivePunctuation,
      adaptiveSeed,
    ]
  );

  // Speed Test text generation
  const speedText = useMemo(
    () =>
      generateWordTestText(
        speedTestType === 'timed' ? 90 : speedWordCount,
        speedPool,
        speedPunctuation,
        speedNumbers
      ),
    [
      speedTestType,
      speedWordCount,
      speedPool,
      speedPunctuation,
      speedNumbers,
      speedSeed,
    ]
  );

  const handleOpenLocalTxtFile = async () => {
    if (window.electronAPI) {
      const res = await window.electronAPI.openTextFile();
      if (res && res.content.trim()) {
        const cleaned = res.content.trim().slice(0, 1500);
        setCustomDraft(cleaned);
        saveCustomText(cleaned);
      }
    }
  };

  const zenClass =
    data.settings.zenFocusMode && isActivelyTyping ? 'zen-dimmed' : '';

  return (
    <div className="app-shell">
      {/* Left Navigation Sidebar */}
      <aside className={`app-sidebar ${zenClass}`}>
        <div className="brand-header">
          <div className="brand-logo">α</div>
          <div>
            <div className="brand-title">TypingAlpha</div>
            <div className="brand-tag">Free & Open Source</div>
          </div>
        </div>

        <nav className="nav-menu" aria-label="Primary Modes">
          <button
            type="button"
            className={`nav-item ${activeTab === 'calendar' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('calendar');
              setActiveCalendarWorkout(null);
            }}
          >
            <Calendar size={18} />
            <span>Learning Calendar</span>
            <span className="nav-day-pill">Day {nextCalendarDayNumber}</span>
          </button>

          <button
            type="button"
            className={`nav-item ${activeTab === 'course' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('course');
              setActiveCalendarWorkout(null);
            }}
          >
            <BookOpen size={18} />
            <span>Touch-Typing Course</span>
          </button>

          <button
            type="button"
            className={`nav-item ${activeTab === 'adaptive' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('adaptive');
              setActiveCalendarWorkout(null);
            }}
          >
            <Cpu size={18} />
            <span>Adaptive Weak-Keys</span>
          </button>

          <button
            type="button"
            className={`nav-item ${activeTab === 'speed' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('speed');
              setActiveCalendarWorkout(null);
            }}
          >
            <Gauge size={18} />
            <span>Speed & N-Gram Tests</span>
          </button>

          <button
            type="button"
            className={`nav-item ${activeTab === 'quotes' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('quotes');
              setActiveCalendarWorkout(null);
            }}
          >
            <Quote size={18} />
            <span>Quotes & Code</span>
          </button>

          <button
            type="button"
            className={`nav-item ${activeTab === 'custom' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('custom');
              setActiveCalendarWorkout(null);
            }}
          >
            <FileText size={18} />
            <span>Custom Text Studio</span>
          </button>

          <button
            type="button"
            className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('analytics');
              setActiveCalendarWorkout(null);
            }}
          >
            <BarChart3 size={18} />
            <span>Analytics & Heatmap</span>
          </button>
        </nav>

        {/* Gamified Level & Streak Footer */}
        <div className="sidebar-profile-card">
          <div className="profile-top-row">
            <span>Level {levelInfo.level} Typist</span>
            <span className="streak-badge" title="Daily Practice Streak">
              <Flame size={15} /> {data.streakDays}d
            </span>
          </div>
          <div className="xp-bar-track">
            <div
              className="xp-bar-fill"
              style={{ width: `${levelInfo.progressPercent}%` }}
            />
          </div>
          <div className="xp-caption">
            {levelInfo.currentLevelXp} / {levelInfo.nextLevelXp} XP ·{' '}
            {Object.keys(data.lessons).length}/{allLessonsFlat.length} Lessons
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="app-main">
        {/* Top Utility & Customization Bar */}
        <header className={`top-utility-bar ${zenClass}`}>
          <div className="utility-group">
            <label className="utility-select-label" title="Keyboard Layout">
              <KeyboardIcon size={14} />
              <span>Layout:</span>
              <select
                className="utility-select"
                value={data.settings.layout}
                onChange={(e) =>
                  updateSettings({ layout: e.target.value as KeyboardLayoutId })
                }
              >
                {Object.entries(KEYBOARD_LAYOUTS).map(([id, meta]) => (
                  <option key={id} value={id}>
                    {meta.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="utility-select-label" title="Mechanical Key Sound">
              <Volume2 size={14} />
              <span>Switch Sound:</span>
              <select
                className="utility-select"
                value={data.settings.soundProfile}
                onChange={(e) =>
                  updateSettings({
                    soundProfile: e.target.value as SoundProfile,
                  })
                }
              >
                <option value="mx-blue">Cherry MX Blue (Clicky)</option>
                <option value="mx-brown">Cherry MX Brown (Tactile)</option>
                <option value="mx-red">Cherry MX Red (Linear Thock)</option>
                <option value="typewriter">Vintage Typewriter</option>
                <option value="muted">Muted (Silent)</option>
              </select>
            </label>
          </div>

          <div className="utility-group">
            <label className="utility-select-label" title="Caret Cursor Style">
              <span>Caret:</span>
              <select
                className="utility-select"
                value={data.settings.caretStyle}
                onChange={(e) =>
                  updateSettings({ caretStyle: e.target.value as CaretStyle })
                }
              >
                <option value="line">Smooth Line (|)</option>
                <option value="block">Solid Block (█)</option>
                <option value="underline">Underline (_)</option>
              </select>
            </label>

            <label className="utility-select-label" title="Color Theme">
              <Palette size={14} />
              <span>Theme:</span>
              <select
                className="utility-select"
                value={data.settings.theme}
                onChange={(e) =>
                  updateSettings({ theme: e.target.value as ThemeId })
                }
              >
                <optgroup label="Predefined Themes">
                  {Object.values(BUILT_IN_THEMES).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </optgroup>
                {data.customThemes.length > 0 && (
                  <optgroup label="My Custom Themes">
                    {data.customThemes.map((ct) => (
                      <option key={ct.id} value={ct.id}>
                        ★ {ct.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </label>

            <button
              type="button"
              className={`control-chip ${showThemeStudio ? 'chip-active' : ''}`}
              onClick={() => setShowThemeStudio(true)}
              title="Open Theme Studio to inherit & customize a theme"
            >
              <Palette size={14} /> Customize Theme
            </button>

            <button
              type="button"
              className={`control-chip ${
                data.settings.zenFocusMode ? 'chip-active' : ''
              }`}
              onClick={() =>
                updateSettings({ zenFocusMode: !data.settings.zenFocusMode })
              }
              title="Automatically dim sidebar and top bar while typing"
            >
              <Sparkles size={14} /> Zen Focus
            </button>
          </div>
        </header>

        {showThemeStudio && (
          <ThemeStudioModal
            activeThemeId={data.settings.theme}
            customThemes={data.customThemes}
            onSelectTheme={(themeId) => updateSettings({ theme: themeId })}
            onSaveCustomTheme={saveCustomTheme}
            onDeleteCustomTheme={deleteCustomTheme}
            onClose={() => setShowThemeStudio(false)}
          />
        )}

        {/* Active View Content */}
        <div className="content-container">
          {/* 0. LEARNING CALENDAR & GUIDED DAILY WORKOUT PLAYLIST */}
          {activeTab === 'calendar' && (
            <>
              {!activeCalendarWorkout ? (
                <LearningCalendarView
                  data={data}
                  onSelectTrack={setCalendarTrack}
                  onStartDayWorkout={(dayPlan, startTaskIndex) =>
                    setActiveCalendarWorkout({
                      dayPlan,
                      taskIndex: startTaskIndex,
                    })
                  }
                />
              ) : (
                (() => {
                  const { dayPlan, taskIndex } = activeCalendarWorkout;
                  const activeTask = dayPlan.tasks[taskIndex];
                  const trackTasksDone =
                    data.calendar.completedTasksByTrack[dayPlan.trackId] || {};
                  const resolvedText = activeTask.resolveText(data.keyStats);

                  const isLastTaskOfDay = taskIndex === 2;

                  const handleAdvancePlaylist = () => {
                    if (taskIndex < 2) {
                      setActiveCalendarWorkout({
                        dayPlan,
                        taskIndex: (taskIndex + 1) as 0 | 1 | 2,
                      });
                    } else {
                      // Finished all 3 tasks of the day! Return to calendar view
                      setActiveCalendarWorkout(null);
                    }
                  };

                  return (
                    <>
                      {/* Guided Daily Workout Stepper Banner */}
                      <div className="guided-workout-banner">
                        <div className="guided-banner-left">
                          <button
                            type="button"
                            className="control-chip"
                            onClick={() => setActiveCalendarWorkout(null)}
                          >
                            <ArrowLeft size={15} /> Back to Calendar
                          </button>
                          <div>
                            <div className="guided-day-kicker">
                              DAY {dayPlan.dayNumber} GUIDED WORKOUT · STEP{' '}
                              {taskIndex + 1} OF 3
                            </div>
                            <h3 className="guided-day-title">{dayPlan.title}</h3>
                          </div>
                        </div>

                        <div className="guided-stepper-pills">
                          {dayPlan.tasks.map((t, idx) => {
                            const done = Boolean(trackTasksDone[t.id]);
                            const current = idx === taskIndex;
                            return (
                              <button
                                key={t.id}
                                type="button"
                                className={[
                                  'stepper-pill',
                                  current ? 'stepper-pill-active' : '',
                                  done ? 'stepper-pill-done' : '',
                                ]
                                  .filter(Boolean)
                                  .join(' ')}
                                onClick={() =>
                                  setActiveCalendarWorkout({
                                    dayPlan,
                                    taskIndex: idx as 0 | 1 | 2,
                                  })
                                }
                              >
                                {done ? (
                                  <CheckCircle2 size={14} />
                                ) : (
                                  <span className="stepper-num">{idx + 1}</span>
                                )}
                                <span>
                                  {idx === 0
                                    ? 'Core Lesson'
                                    : idx === 1
                                    ? 'Weak-Keys'
                                    : 'Benchmark'}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <TypingArena
                        mode={
                          activeTask.type === 'lesson'
                            ? 'course'
                            : activeTask.type === 'adaptive'
                            ? 'adaptive'
                            : 'speed'
                        }
                        title={activeTask.title}
                        subtitle={activeTask.subtitle}
                        fingerTip={activeTask.fingerTip}
                        targetText={resolvedText}
                        targetWpm={activeTask.targetWpm}
                        minAccuracy={activeTask.minAccuracy}
                        errorMode={data.settings.courseErrorMode}
                        onToggleErrorMode={(next) =>
                          updateSettings({ courseErrorMode: next })
                        }
                        layoutId={data.settings.layout}
                        caretStyle={data.settings.caretStyle}
                        showVisualKeyboard={data.settings.showVisualKeyboard}
                        showHandGuide={data.settings.showHandGuide}
                        showFingerColors={data.settings.showFingerColors}
                        onToggleVisualKeyboard={() =>
                          updateSettings({
                            showVisualKeyboard:
                              !data.settings.showVisualKeyboard,
                          })
                        }
                        onToggleHandGuide={() =>
                          updateSettings({
                            showHandGuide: !data.settings.showHandGuide,
                          })
                        }
                        keyStats={data.keyStats}
                        onComplete={(res) =>
                          recordCompletedSession({
                            mode:
                              activeTask.type === 'lesson'
                                ? 'course'
                                : activeTask.type === 'adaptive'
                                ? 'adaptive'
                                : 'speed',
                            label: `Day ${dayPlan.dayNumber} · ${activeTask.title}`,
                            lessonId: activeTask.lessonId,
                            calendarTaskInfo: {
                              trackId: dayPlan.trackId,
                              dayNumber: dayPlan.dayNumber,
                              taskId: activeTask.id,
                              allDayTaskIds: [
                                dayPlan.tasks[0].id,
                                dayPlan.tasks[1].id,
                                dayPlan.tasks[2].id,
                              ],
                            },
                            ...res,
                          })
                        }
                        onNextOrRegenerate={handleAdvancePlaylist}
                        nextButtonLabel={
                          isLastTaskOfDay
                            ? `Finish Day ${dayPlan.dayNumber} & Return to Calendar`
                            : `Continue to Step ${taskIndex + 2} of 3`
                        }
                        onActiveTypingChange={setIsActivelyTyping}
                      />
                    </>
                  );
                })()
              )}
            </>
          )}

          {/* 1. STRUCTURED TOUCH-TYPING COURSE */}
          {activeTab === 'course' && (
            <>
              <div className="course-selector-bar">
                <div className="module-tabs">
                  {CURRICULUM_MODULES.map((mod) => (
                    <button
                      key={mod.id}
                      type="button"
                      className={`module-tab-btn ${
                        mod.id === currentModule.id ? 'active' : ''
                      }`}
                      onClick={() => {
                        setSelectedModuleId(mod.id);
                        setSelectedLessonId(mod.lessons[0].id);
                      }}
                    >
                      {mod.title}
                    </button>
                  ))}
                </div>

                <div className="lesson-pills-row">
                  {currentModule.lessons.map((lesson) => {
                    const rec = data.lessons[lesson.id];
                    const stars = rec?.stars || 0;
                    return (
                      <button
                        key={lesson.id}
                        type="button"
                        className={`lesson-pill-btn ${
                          lesson.id === currentLesson.id ? 'active' : ''
                        }`}
                        onClick={() => setSelectedLessonId(lesson.id)}
                      >
                        <span>
                          {lesson.number}. {lesson.title}
                        </span>
                        {stars > 0 && (
                          <span className="mini-stars">
                            {Array.from({ length: stars }).map((_, idx) => (
                              <Star key={idx} size={11} fill="currentColor" />
                            ))}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <TypingArena
                mode="course"
                title={`Lesson ${currentLesson.number}: ${currentLesson.title}`}
                subtitle={currentLesson.subtitle}
                fingerTip={currentLesson.fingerTip}
                targetText={currentLesson.text}
                targetWpm={currentLesson.targetWpm}
                minAccuracy={currentLesson.minAccuracy}
                errorMode={data.settings.courseErrorMode}
                onToggleErrorMode={(next) =>
                  updateSettings({ courseErrorMode: next })
                }
                layoutId={data.settings.layout}
                caretStyle={data.settings.caretStyle}
                showVisualKeyboard={data.settings.showVisualKeyboard}
                showHandGuide={data.settings.showHandGuide}
                showFingerColors={data.settings.showFingerColors}
                onToggleVisualKeyboard={() =>
                  updateSettings({
                    showVisualKeyboard: !data.settings.showVisualKeyboard,
                  })
                }
                onToggleHandGuide={() =>
                  updateSettings({
                    showHandGuide: !data.settings.showHandGuide,
                  })
                }
                keyStats={data.keyStats}
                onComplete={(res) =>
                  recordCompletedSession({
                    mode: 'course',
                    label: `Lesson ${currentLesson.number}: ${currentLesson.title}`,
                    lessonId: currentLesson.id,
                    ...res,
                  })
                }
                onNextOrRegenerate={handleAdvanceToNextLesson}
                nextButtonLabel="Next Lesson"
                onActiveTypingChange={setIsActivelyTyping}
              />
            </>
          )}

          {/* 2. ADAPTIVE WEAK-KEY PRACTICE (KEYBR STYLE) */}
          {activeTab === 'adaptive' && (
            <>
              <div className="adaptive-status-card">
                <div className="adaptive-header-row">
                  <div>
                    <h3>
                      Adaptive Weak-Key Generator (Unlocked{' '}
                      {data.adaptiveUnlockedCount} / 26 Letters)
                    </h3>
                    <p className="section-sub">
                      Focuses automatically on your slowest or least accurate unlocked key:{' '}
                      <strong>
                        "{adaptiveDrill.focusLetter.toUpperCase()}"
                      </strong>
                      . Reach ≥80% confidence to unlock the next letter automatically, or adjust manually.
                    </p>
                  </div>

                  <div className="utility-group">
                    <button
                      type="button"
                      className="control-chip"
                      onClick={() =>
                        setAdaptiveUnlockedCount(data.adaptiveUnlockedCount - 1)
                      }
                    >
                      -1 Key
                    </button>
                    <button
                      type="button"
                      className="control-chip"
                      onClick={() =>
                        setAdaptiveUnlockedCount(data.adaptiveUnlockedCount + 1)
                      }
                    >
                      +1 Key
                    </button>
                    <button
                      type="button"
                      className="control-chip"
                      onClick={() => setAdaptiveUnlockedCount(26)}
                    >
                      Unlock All 26
                    </button>
                    <button
                      type="button"
                      className={`control-chip ${
                        adaptiveCapitals ? 'chip-active' : ''
                      }`}
                      onClick={() => setAdaptiveCapitals(!adaptiveCapitals)}
                    >
                      Capitals
                    </button>
                    <button
                      type="button"
                      className={`control-chip ${
                        adaptivePunctuation ? 'chip-active' : ''
                      }`}
                      onClick={() =>
                        setAdaptivePunctuation(!adaptivePunctuation)
                      }
                    >
                      Punctuation
                    </button>
                  </div>
                </div>

                <div className="adaptive-alphabet-strip">
                  {ADAPTIVE_LETTER_ORDER.map((letter, idx) => {
                    const isUnlocked = idx < data.adaptiveUnlockedCount;
                    const conf = computeKeyConfidence(
                      letter,
                      isUnlocked,
                      data.keyStats[letter]
                    );
                    const isFocus = letter === adaptiveDrill.focusLetter;
                    return (
                      <div
                        key={letter}
                        className={[
                          'adaptive-letter-box',
                          isUnlocked ? 'unlocked' : 'locked',
                          isFocus ? 'focus-key' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        title={
                          isUnlocked
                            ? `${letter.toUpperCase()}: ${conf.confidence}% confidence (${conf.wpm} WPM, ${conf.accuracy}% acc)`
                            : `${letter.toUpperCase()} (Locked)`
                        }
                      >
                        <span className="adaptive-char">
                          {letter.toUpperCase()}
                        </span>
                        {isUnlocked && (
                          <span
                            className="adaptive-conf-bar"
                            style={{ width: `${conf.confidence}%` }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <TypingArena
                mode="adaptive"
                title={`Adaptive Target: Key "${adaptiveDrill.focusLetter.toUpperCase()}"`}
                subtitle="Algorithmically generated words weighted toward your weakest unlocked keys."
                targetText={adaptiveDrill.text}
                targetWpm={32}
                minAccuracy={94}
                errorMode={data.settings.courseErrorMode}
                onToggleErrorMode={(next) =>
                  updateSettings({ courseErrorMode: next })
                }
                layoutId={data.settings.layout}
                caretStyle={data.settings.caretStyle}
                showVisualKeyboard={data.settings.showVisualKeyboard}
                showHandGuide={data.settings.showHandGuide}
                showFingerColors={data.settings.showFingerColors}
                onToggleVisualKeyboard={() =>
                  updateSettings({
                    showVisualKeyboard: !data.settings.showVisualKeyboard,
                  })
                }
                onToggleHandGuide={() =>
                  updateSettings({
                    showHandGuide: !data.settings.showHandGuide,
                  })
                }
                keyStats={data.keyStats}
                onComplete={(res) =>
                  recordCompletedSession({
                    mode: 'adaptive',
                    label: `Adaptive Drill (Focus "${adaptiveDrill.focusLetter.toUpperCase()}")`,
                    ...res,
                  })
                }
                onNextOrRegenerate={() => setAdaptiveSeed((s) => s + 1)}
                nextButtonLabel="Generate Next Adaptive Set"
                onActiveTypingChange={setIsActivelyTyping}
              />
            </>
          )}

          {/* 3. SPEED & N-GRAM TESTS (MONKEYTYPE STYLE) */}
          {activeTab === 'speed' && (
            <>
              <div className="mode-toolbar-card">
                <div className="segmented-tabs">
                  <button
                    type="button"
                    className={`seg-btn ${
                      speedTestType === 'words' ? 'seg-active' : ''
                    }`}
                    onClick={() => setSpeedTestType('words')}
                  >
                    Word Count
                  </button>
                  <button
                    type="button"
                    className={`seg-btn ${
                      speedTestType === 'timed' ? 'seg-active' : ''
                    }`}
                    onClick={() => setSpeedTestType('timed')}
                  >
                    Timed Test
                  </button>
                </div>

                {speedTestType === 'words' ? (
                  <div className="segmented-tabs">
                    {[15, 25, 50, 100].map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        className={`seg-btn ${
                          speedWordCount === cnt ? 'seg-active' : ''
                        }`}
                        onClick={() => setSpeedWordCount(cnt)}
                      >
                        {cnt} Words
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="segmented-tabs">
                    {[15, 30, 60, 120].map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        className={`seg-btn ${
                          speedTimeSec === sec ? 'seg-active' : ''
                        }`}
                        onClick={() => setSpeedTimeSec(sec)}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>
                )}

                <div className="segmented-tabs">
                  {(
                    [
                      ['top200', 'English 200'],
                      ['top1000', 'English 1000'],
                      ['bigrams', 'Top Bigrams'],
                      ['trigrams', 'Top Trigrams'],
                      ['alternating', 'Alternating Hands'],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      className={`seg-btn ${
                        speedPool === id ? 'seg-active' : ''
                      }`}
                      onClick={() => setSpeedPool(id)}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="utility-group">
                  <button
                    type="button"
                    className={`control-chip ${
                      speedPunctuation ? 'chip-active' : ''
                    }`}
                    onClick={() => setSpeedPunctuation(!speedPunctuation)}
                  >
                    @ Punctuation
                  </button>
                  <button
                    type="button"
                    className={`control-chip ${
                      speedNumbers ? 'chip-active' : ''
                    }`}
                    onClick={() => setSpeedNumbers(!speedNumbers)}
                  >
                    # Numbers
                  </button>
                  <button
                    type="button"
                    className="control-chip"
                    onClick={() => setSpeedSeed((s) => s + 1)}
                  >
                    <RefreshCw size={14} /> Shuffle Words
                  </button>
                </div>
              </div>

              <TypingArena
                mode="speed"
                title={
                  speedTestType === 'timed'
                    ? `${speedTimeSec}s Timed Speed Test`
                    : `${speedWordCount}-Word Speed Test`
                }
                subtitle={`Word Pool: ${speedPool.toUpperCase()}`}
                targetText={speedText}
                targetWpm={40}
                minAccuracy={95}
                timeLimitSeconds={
                  speedTestType === 'timed' ? speedTimeSec : null
                }
                errorMode={data.settings.practiceErrorMode}
                onToggleErrorMode={(next) =>
                  updateSettings({ practiceErrorMode: next })
                }
                layoutId={data.settings.layout}
                caretStyle={data.settings.caretStyle}
                showVisualKeyboard={data.settings.showVisualKeyboard}
                showHandGuide={data.settings.showHandGuide}
                showFingerColors={data.settings.showFingerColors}
                onToggleVisualKeyboard={() =>
                  updateSettings({
                    showVisualKeyboard: !data.settings.showVisualKeyboard,
                  })
                }
                onToggleHandGuide={() =>
                  updateSettings({
                    showHandGuide: !data.settings.showHandGuide,
                  })
                }
                keyStats={data.keyStats}
                onComplete={(res) =>
                  recordCompletedSession({
                    mode: 'speed',
                    label: `Speed Test (${speedPool})`,
                    ...res,
                  })
                }
                onNextOrRegenerate={() => setSpeedSeed((s) => s + 1)}
                nextButtonLabel="New Speed Test"
                onActiveTypingChange={setIsActivelyTyping}
              />
            </>
          )}

          {/* 4. QUOTES, LITERATURE & CODE SNIPPETS */}
          {activeTab === 'quotes' && (
            <>
              <div className="mode-toolbar-card">
                <div className="segmented-tabs">
                  <button
                    type="button"
                    className={`seg-btn ${
                      realWorldSubMode === 'quotes' ? 'seg-active' : ''
                    }`}
                    onClick={() => setRealWorldSubMode('quotes')}
                  >
                    Famous Quotes & Books ({QUOTES_POOL.length})
                  </button>
                  <button
                    type="button"
                    className={`seg-btn ${
                      realWorldSubMode === 'code' ? 'seg-active' : ''
                    }`}
                    onClick={() => setRealWorldSubMode('code')}
                  >
                    Programming Code Snippets ({CODE_SNIPPETS_POOL.length})
                  </button>
                </div>

                {realWorldSubMode === 'quotes' ? (
                  <div className="segmented-tabs">
                    {QUOTES_POOL.map((q, idx) => (
                      <button
                        key={q.id}
                        type="button"
                        className={`seg-btn ${
                          quoteIdx === idx ? 'seg-active' : ''
                        }`}
                        onClick={() => setQuoteIdx(idx)}
                      >
                        {q.author}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="segmented-tabs">
                    {CODE_SNIPPETS_POOL.map((c, idx) => (
                      <button
                        key={c.id}
                        type="button"
                        className={`seg-btn ${
                          codeIdx === idx ? 'seg-active' : ''
                        }`}
                        onClick={() => setCodeIdx(idx)}
                      >
                        {c.language}: {c.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {realWorldSubMode === 'quotes' ? (
                <TypingArena
                  mode="quotes"
                  title={`${QUOTES_POOL[quoteIdx].author} — ${QUOTES_POOL[quoteIdx].source}`}
                  subtitle="Real-world capitalization, punctuation, and sentence rhythm."
                  targetText={QUOTES_POOL[quoteIdx].text}
                  targetWpm={38}
                  minAccuracy={95}
                  errorMode={data.settings.practiceErrorMode}
                  onToggleErrorMode={(next) =>
                    updateSettings({ practiceErrorMode: next })
                  }
                  layoutId={data.settings.layout}
                  caretStyle={data.settings.caretStyle}
                  showVisualKeyboard={data.settings.showVisualKeyboard}
                  showHandGuide={data.settings.showHandGuide}
                  showFingerColors={data.settings.showFingerColors}
                  onToggleVisualKeyboard={() =>
                    updateSettings({
                      showVisualKeyboard: !data.settings.showVisualKeyboard,
                    })
                  }
                  onToggleHandGuide={() =>
                    updateSettings({
                      showHandGuide: !data.settings.showHandGuide,
                    })
                  }
                  keyStats={data.keyStats}
                  onComplete={(res) =>
                    recordCompletedSession({
                      mode: 'quotes',
                      label: `Quote: ${QUOTES_POOL[quoteIdx].author}`,
                      ...res,
                    })
                  }
                  onNextOrRegenerate={() =>
                    setQuoteIdx((i) => (i + 1) % QUOTES_POOL.length)
                  }
                  nextButtonLabel="Next Quote"
                  onActiveTypingChange={setIsActivelyTyping}
                />
              ) : (
                <TypingArena
                  mode="code"
                  title={`${CODE_SNIPPETS_POOL[codeIdx].language}: ${CODE_SNIPPETS_POOL[codeIdx].title}`}
                  subtitle="Practice brackets, colons, operators, and indentation."
                  targetText={CODE_SNIPPETS_POOL[codeIdx].code}
                  targetWpm={30}
                  minAccuracy={94}
                  errorMode={data.settings.practiceErrorMode}
                  onToggleErrorMode={(next) =>
                    updateSettings({ practiceErrorMode: next })
                  }
                  layoutId={data.settings.layout}
                  caretStyle={data.settings.caretStyle}
                  showVisualKeyboard={data.settings.showVisualKeyboard}
                  showHandGuide={data.settings.showHandGuide}
                  showFingerColors={data.settings.showFingerColors}
                  onToggleVisualKeyboard={() =>
                    updateSettings({
                      showVisualKeyboard: !data.settings.showVisualKeyboard,
                    })
                  }
                  onToggleHandGuide={() =>
                    updateSettings({
                      showHandGuide: !data.settings.showHandGuide,
                    })
                  }
                  keyStats={data.keyStats}
                  onComplete={(res) =>
                    recordCompletedSession({
                      mode: 'code',
                      label: `Code: ${CODE_SNIPPETS_POOL[codeIdx].language}`,
                      ...res,
                    })
                  }
                  onNextOrRegenerate={() =>
                    setCodeIdx((i) => (i + 1) % CODE_SNIPPETS_POOL.length)
                  }
                  nextButtonLabel="Next Code Snippet"
                  onActiveTypingChange={setIsActivelyTyping}
                />
              )}
            </>
          )}

          {/* 5. CUSTOM TEXT STUDIO */}
          {activeTab === 'custom' && (
            <>
              <div className="mode-toolbar-card">
                <div>
                  <h3>Custom Text Studio</h3>
                  <p className="section-sub">
                    Paste your own study notes, book chapters, or load a local <code>.txt</code> file to practice.
                  </p>
                </div>

                <div className="utility-group">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowCustomEditor(!showCustomEditor)}
                  >
                    {showCustomEditor ? 'Hide Text Editor' : 'Edit Custom Text'}
                  </button>
                  {window.electronAPI && (
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={handleOpenLocalTxtFile}
                    >
                      <FolderOpen size={16} /> Load Local .TXT File
                    </button>
                  )}
                </div>

                {showCustomEditor && (
                  <div
                    style={{
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <textarea
                      className="custom-textarea"
                      value={customDraft}
                      onChange={(e) => setCustomDraft(e.target.value)}
                      placeholder="Paste or type your custom practice text here..."
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => {
                          if (customDraft.trim()) {
                            saveCustomText(customDraft.trim());
                            setShowCustomEditor(false);
                          }
                        }}
                      >
                        Apply & Save Custom Text
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <TypingArena
                mode="custom"
                title="Custom Text Practice"
                subtitle="Saved automatically to your local profile."
                targetText={data.customTextSaved}
                targetWpm={35}
                minAccuracy={94}
                errorMode={data.settings.practiceErrorMode}
                onToggleErrorMode={(next) =>
                  updateSettings({ practiceErrorMode: next })
                }
                layoutId={data.settings.layout}
                caretStyle={data.settings.caretStyle}
                showVisualKeyboard={data.settings.showVisualKeyboard}
                showHandGuide={data.settings.showHandGuide}
                showFingerColors={data.settings.showFingerColors}
                onToggleVisualKeyboard={() =>
                  updateSettings({
                    showVisualKeyboard: !data.settings.showVisualKeyboard,
                  })
                }
                onToggleHandGuide={() =>
                  updateSettings({
                    showHandGuide: !data.settings.showHandGuide,
                  })
                }
                keyStats={data.keyStats}
                onComplete={(res) =>
                  recordCompletedSession({
                    mode: 'custom',
                    label: 'Custom Text Drill',
                    ...res,
                  })
                }
                onActiveTypingChange={setIsActivelyTyping}
              />
            </>
          )}

          {/* 6. ANALYTICS & PER-KEY HEATMAP HUB */}
          {activeTab === 'analytics' && (
            <AnalyticsView
              data={data}
              storagePath={storagePath}
              onImportJson={importProgressJson}
              onResetProgress={resetAllProgress}
              onPracticeWeakKeys={() => setActiveTab('adaptive')}
            />
          )}
        </div>
      </main>
    </div>
  );
}
export default App;
