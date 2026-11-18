import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Play,
  Sparkles,
  Clock,
  Target,
  ChevronLeft,
  ChevronRight,
  Flame,
  Award,
  Layers,
} from 'lucide-react';
import {
  CALENDAR_TRACKS,
  CalendarTrackId,
  CalendarDayPlan,
  generateTrackSchedule,
} from '../data/learningCalendar';
import { UserProgressData, getTodayDateString } from '../store/useProgressStore';

interface LearningCalendarViewProps {
  data: UserProgressData;
  onSelectTrack: (trackId: CalendarTrackId) => void;
  onStartDayWorkout: (dayPlan: CalendarDayPlan, startTaskIndex: 0 | 1 | 2) => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const LearningCalendarView: React.FC<LearningCalendarViewProps> = ({
  data,
  onSelectTrack,
  onStartDayWorkout,
}) => {
  const activeTrack = data.calendar.activeTrack;
  const trackMeta = CALENDAR_TRACKS[activeTrack];
  const schedule = useMemo(() => generateTrackSchedule(activeTrack), [activeTrack]);

  const completedTasks = data.calendar.completedTasksByTrack[activeTrack] || {};
  const completedDays = data.calendar.completedDaysByTrack[activeTrack] || {};

  // Find the first uncompleted day as the recommended "Current Day"
  const currentRecommendedDayNumber = useMemo(() => {
    for (const dayPlan of schedule) {
      if (!completedDays[dayPlan.dayNumber]) {
        return dayPlan.dayNumber;
      }
    }
    return schedule.length;
  }, [schedule, completedDays]);

  const [selectedDayNum, setSelectedDayNum] = useState<number>(
    currentRecommendedDayNumber
  );
  const [viewSubMode, setViewSubMode] = useState<'roadmap' | 'monthly'>('roadmap');

  // Monthly Activity Calendar state
  const now = new Date();
  const [calYear, setCalYear] = useState<number>(now.getFullYear());
  const [calMonth, setCalMonth] = useState<number>(now.getMonth()); // 0-indexed
  const [selectedDateStr, setSelectedDateStr] = useState<string>(getTodayDateString());

  const selectedDayPlan =
    schedule.find((d) => d.dayNumber === selectedDayNum) ||
    schedule[currentRecommendedDayNumber - 1] ||
    schedule[0];

  const completedDaysCount = Object.keys(completedDays).length;
  const trackProgressPercent = Math.round(
    (completedDaysCount / trackMeta.totalDays) * 100
  );

  // Group schedule days by phaseTitle for clean roadmap presentation
  const phases = useMemo(() => {
    const map = new Map<string, CalendarDayPlan[]>();
    for (const d of schedule) {
      const list = map.get(d.phaseTitle) || [];
      list.push(d);
      map.set(d.phaseTitle, list);
    }
    return Array.from(map.entries());
  }, [schedule]);

  // Build monthly calendar cells
  const monthlyCells = useMemo(() => {
    const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const cells: { dateStr: string | null; dayOfMonth: number | null }[] = [];

    for (let i = 0; i < firstDayOfWeek; i++) {
      cells.push({ dateStr: null, dayOfMonth: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(
        d
      ).padStart(2, '0')}`;
      cells.push({ dateStr, dayOfMonth: d });
    }
    return cells;
  }, [calYear, calMonth]);

  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalYear((y) => y - 1);
      setCalMonth(11);
    } else {
      setCalMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalYear((y) => y + 1);
      setCalMonth(0);
    } else {
      setCalMonth((m) => m + 1);
    }
  };

  // Find first unfinished task index for the selected day
  const getNextTaskIndexForDay = (dayPlan: CalendarDayPlan): 0 | 1 | 2 => {
    if (!completedTasks[dayPlan.tasks[0].id]) return 0;
    if (!completedTasks[dayPlan.tasks[1].id]) return 1;
    if (!completedTasks[dayPlan.tasks[2].id]) return 2;
    return 0;
  };

  const selectedDateActivity = data.calendar.dailyActivityLog[selectedDateStr];

  return (
    <div className="calendar-hub-wrapper">
      {/* Top Track Selector & Overall Progress Banner */}
      <div className="calendar-hero-card">
        <div className="calendar-hero-top">
          <div>
            <div className="hero-eyebrow">
              <Sparkles size={14} /> STRUCTURED DAY-BY-DAY STUDY SCHEDULE
            </div>
            <h2 className="hero-title">{trackMeta.name}</h2>
            <p className="section-sub">{trackMeta.tagline}</p>
          </div>

          {/* Study Track Switcher */}
          <div className="segmented-tabs">
            {(Object.keys(CALENDAR_TRACKS) as CalendarTrackId[]).map((tId) => {
              const meta = CALENDAR_TRACKS[tId];
              return (
                <button
                  key={tId}
                  type="button"
                  className={`seg-btn ${activeTrack === tId ? 'seg-active' : ''}`}
                  onClick={() => {
                    onSelectTrack(tId);
                    setSelectedDayNum(1);
                  }}
                >
                  {meta.totalDays} Days ({meta.dailyMinutes}m/day)
                </button>
              );
            })}
          </div>
        </div>

        {/* Track Progress Bar & Quick Resume Action */}
        <div className="calendar-hero-progress-row">
          <div className="hero-progress-stats">
            <span>
              <strong>
                {completedDaysCount} / {trackMeta.totalDays} Days
              </strong>{' '}
              Completed ({trackProgressPercent}%)
            </span>
            <span className="hero-Recommended-pill">
              Up Next: Day {currentRecommendedDayNumber}
            </span>
          </div>
          <div className="arena-progress-track">
            <div
              className="arena-progress-fill"
              style={{ width: `${trackProgressPercent}%` }}
            />
          </div>
        </div>

        <div className="calendar-view-subtabs-row">
          <div className="segmented-tabs">
            <button
              type="button"
              className={`seg-btn ${viewSubMode === 'roadmap' ? 'seg-active' : ''}`}
              onClick={() => setViewSubMode('roadmap')}
            >
              <Layers size={14} /> Day-by-Day Roadmap (Day 1 – {trackMeta.totalDays})
            </button>
            <button
              type="button"
              className={`seg-btn ${viewSubMode === 'monthly' ? 'seg-active' : ''}`}
              onClick={() => setViewSubMode('monthly')}
            >
              <CalendarIcon size={14} /> Monthly Activity Calendar
            </button>
          </div>

          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              const recPlan =
                schedule[currentRecommendedDayNumber - 1] || schedule[0];
              onStartDayWorkout(recPlan, getNextTaskIndexForDay(recPlan));
            }}
          >
            <Play size={16} /> Start Day {currentRecommendedDayNumber} Workout
          </button>
        </div>
      </div>

      {/* Main Split Layout: Left = Calendar Grid, Right = Selected Day Workout Inspector */}
      <div className="calendar-main-split">
        {/* LEFT COLUMN: Roadmap Grid OR Monthly Real-Date Calendar */}
        <div className="calendar-left-panel">
          {viewSubMode === 'roadmap' ? (
            <div className="roadmap-phases-list">
              {phases.map(([phaseName, phaseDays]) => (
                <div key={phaseName} className="roadmap-phase-card">
                  <div className="phase-header">
                    <h3>{phaseName}</h3>
                    <span className="phase-count-badge">
                      {
                        phaseDays.filter((d) => Boolean(completedDays[d.dayNumber]))
                          .length
                      }{' '}
                      / {phaseDays.length} Days Done
                    </span>
                  </div>

                  <div className="roadmap-days-grid">
                    {phaseDays.map((dayPlan) => {
                      const isDayDone = Boolean(completedDays[dayPlan.dayNumber]);
                      const isCurrentRec =
                        dayPlan.dayNumber === currentRecommendedDayNumber;
                      const isSelected =
                        dayPlan.dayNumber === selectedDayPlan.dayNumber;
                      const tasksDoneCount = dayPlan.tasks.filter((t) =>
                        Boolean(completedTasks[t.id])
                      ).length;

                      return (
                        <button
                          key={dayPlan.dayNumber}
                          type="button"
                          className={[
                            'day-tile-card',
                            isDayDone ? 'day-tile-done' : '',
                            isCurrentRec ? 'day-tile-current' : '',
                            isSelected ? 'day-tile-selected' : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          onClick={() => setSelectedDayNum(dayPlan.dayNumber)}
                        >
                          <div className="day-tile-top">
                            <span className="day-number-badge">
                              Day {dayPlan.dayNumber}
                            </span>
                            {isDayDone ? (
                              <CheckCircle2
                                size={16}
                                className="day-check-icon"
                              />
                            ) : isCurrentRec ? (
                              <span className="today-tag">TODAY</span>
                            ) : (
                              <span className="day-mins-tag">
                                {dayPlan.estimatedMinutes}m
                              </span>
                            )}
                          </div>

                          <div className="day-tile-title">{dayPlan.title}</div>

                          <div className="day-tile-keys">
                            {dayPlan.focusKeys.slice(0, 5).map((k, idx) => (
                              <span key={idx} className="mini-key-pill">
                                {k === ' ' ? '␣' : k.toUpperCase()}
                              </span>
                            ))}
                          </div>

                          {/* 3-Step Task Progress Dots */}
                          <div className="day-task-dots-row">
                            {[0, 1, 2].map((idx) => {
                              const done = Boolean(
                                completedTasks[dayPlan.tasks[idx].id]
                              );
                              return (
                                <span
                                  key={idx}
                                  className={`task-dot ${
                                    done ? 'task-dot-done' : ''
                                  }`}
                                />
                              );
                            })}
                            <span className="task-dots-label">
                              {tasksDoneCount}/3 Tasks
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* REAL-DATE MONTHLY ACTIVITY CALENDAR */
            <div className="monthly-calendar-card">
              <div className="monthly-header">
                <h3>
                  {MONTH_NAMES[calMonth]} {calYear}
                </h3>
                <div className="utility-group">
                  <button
                    type="button"
                    className="control-chip"
                    onClick={handlePrevMonth}
                  >
                    <ChevronLeft size={16} /> Prev
                  </button>
                  <button
                    type="button"
                    className="control-chip"
                    onClick={() => {
                      const d = new Date();
                      setCalYear(d.getFullYear());
                      setCalMonth(d.getMonth());
                      setSelectedDateStr(getTodayDateString());
                    }}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    className="control-chip"
                    onClick={handleNextMonth}
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              <div className="monthly-weekday-grid">
                {WEEKDAY_LABELS.map((w) => (
                  <div key={w} className="weekday-cell">
                    {w}
                  </div>
                ))}
              </div>

              <div className="monthly-days-grid">
                {monthlyCells.map((cell, idx) => {
                  if (!cell.dateStr || cell.dayOfMonth === null) {
                    return <div key={`empty-${idx}`} className="month-cell-empty" />;
                  }
                  const act = data.calendar.dailyActivityLog[cell.dateStr];
                  const isToday = cell.dateStr === getTodayDateString();
                  const isSel = cell.dateStr === selectedDateStr;
                  const hasPractice = Boolean(act && act.sessions > 0);

                  return (
                    <button
                      key={cell.dateStr}
                      type="button"
                      className={[
                        'month-date-cell',
                        hasPractice ? 'month-cell-practiced' : '',
                        isToday ? 'month-cell-today' : '',
                        isSel ? 'month-cell-selected' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => setSelectedDateStr(cell.dateStr!)}
                    >
                      <div className="month-cell-top">
                        <span className="month-day-num">{cell.dayOfMonth}</span>
                        {hasPractice && <Flame size={14} className="cell-flame" />}
                      </div>
                      {act ? (
                        <div className="month-cell-meta">
                          <span>{Math.max(1, Math.round(act.secondsTyped / 60))}m</span>
                          <span>{act.bestWpm} WPM</span>
                        </div>
                      ) : (
                        <div className="month-cell-idle">—</div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Selected Date Summary Strip */}
              <div className="selected-date-summary">
                <div>
                  <strong>Activity on {selectedDateStr}:</strong>{' '}
                  {selectedDateActivity ? (
                    <span>
                      {selectedDateActivity.sessions} sessions ·{' '}
                      {Math.max(1, Math.round(selectedDateActivity.secondsTyped / 60))}{' '}
                      mins typed · Best Speed: {selectedDateActivity.bestWpm} WPM ·{' '}
                      {selectedDateActivity.tasksCompleted} calendar tasks finished
                    </span>
                  ) : (
                    <span>No sessions recorded on this date yet.</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Selected Day 3-Task Workout Inspector */}
        <aside className="calendar-day-inspector">
          <div className="inspector-header">
            <div className="inspector-badge-row">
              <span className="day-number-badge">
                DAY {selectedDayPlan.dayNumber} OF {trackMeta.totalDays}
              </span>
              <span className="inspector-week-tag">
                Week {selectedDayPlan.weekNumber} · ~{selectedDayPlan.estimatedMinutes} mins
              </span>
            </div>
            <h3>{selectedDayPlan.title}</h3>
            <p className="section-sub">{selectedDayPlan.summary}</p>
          </div>

          <div className="inspector-tasks-list">
            {selectedDayPlan.tasks.map((task, idx) => {
              const isTaskDone = Boolean(completedTasks[task.id]);
              return (
                <div
                  key={task.id}
                  className={`inspector-task-card ${
                    isTaskDone ? 'inspector-task-done' : ''
                  }`}
                >
                  <div className="task-card-top">
                    <span className="task-step-badge">
                      STEP {idx + 1} · {task.type.toUpperCase()}
                    </span>
                    <span className="task-duration-tag">
                      <Clock size={12} /> {task.durationLabel}
                    </span>
                  </div>

                  <div className="task-card-title">{task.title}</div>
                  <p className="task-card-sub">{task.subtitle}</p>

                  <div className="task-card-footer">
                    <span className="task-goal-pill">
                      <Target size={13} /> Goal: {task.targetWpm} WPM ·{' '}
                      {task.minAccuracy}% Acc
                    </span>

                    <button
                      type="button"
                      className={isTaskDone ? 'btn-secondary' : 'btn-primary'}
                      onClick={() =>
                        onStartDayWorkout(selectedDayPlan, task.taskIndex)
                      }
                    >
                      {isTaskDone ? (
                        <>
                          <CheckCircle2 size={15} /> Replay Task
                        </>
                      ) : (
                        <>
                          <Play size={15} /> Start Task {idx + 1}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="inspector-bonus-box">
            <Award size={18} />
            <span>
              Complete all 3 steps of Day {selectedDayPlan.dayNumber} to earn a{' '}
              <strong>+100 XP Daily Mastery Bonus</strong>!
            </span>
          </div>

          <button
            type="button"
            className="btn-primary inspector-start-all-btn"
            onClick={() =>
              onStartDayWorkout(
                selectedDayPlan,
                getNextTaskIndexForDay(selectedDayPlan)
              )
            }
          >
            <Play size={16} />{' '}
            {completedDays[selectedDayPlan.dayNumber]
              ? `Replay Full Day ${selectedDayPlan.dayNumber} Workout`
              : `Start Guided Day ${selectedDayPlan.dayNumber} Workout`}
          </button>
        </aside>
      </div>
    </div>
  );
};
