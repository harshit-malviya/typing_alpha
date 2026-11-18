import React, { useState, useRef } from 'react';
import {
  Flame,
  Trophy,
  Clock,
  Target,
  Download,
  Upload,
  Trash2,
  HardDrive,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import {
  UserProgressData,
  calculateLevelFromXp,
} from '../store/useProgressStore';
import { VisualKeyboard } from './VisualKeyboard';

interface AnalyticsViewProps {
  data: UserProgressData;
  storagePath: string;
  onImportJson: (raw: string) => boolean;
  onResetProgress: () => void;
  onPracticeWeakKeys: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  data,
  storagePath,
  onImportJson,
  onResetProgress,
  onPracticeWeakKeys,
}) => {
  const [heatmapMode, setHeatmapMode] = useState<'accuracy' | 'speed'>('accuracy');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const levelInfo = calculateLevelFromXp(data.xp);
  const totalMinutes = Math.round(data.totalSecondsTyped / 60);

  const recentSessions = [...data.history].slice(0, 20).reverse();
  const avgWpm =
    data.history.length > 0
      ? Math.round(
          data.history.reduce((acc, s) => acc + s.netWpm, 0) / data.history.length
        )
      : 0;
  const bestWpm =
    data.history.length > 0
      ? Math.max(...data.history.map((s) => s.netWpm))
      : 0;

  // Compute weakest keys list
  const keySummaries = Object.entries(data.keyStats)
    .filter(([, st]) => st.hits + st.misses >= 3)
    .map(([key, st]) => {
      const total = st.hits + st.misses;
      const accuracy = Math.round((st.hits / total) * 100);
      const avgMs =
        st.latencySamples > 0 ? Math.round(st.totalLatencyMs / st.latencySamples) : 350;
      const wpm = Math.min(135, Math.round(12000 / Math.max(85, avgMs)));
      return { key, accuracy, wpm, total };
    })
    .sort((a, b) => a.accuracy - b.accuracy || a.wpm - b.wpm);

  const weakestKeys = keySummaries.slice(0, 6);

  const handleExportBackup = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `typing-alpha-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const ok = onImportJson(String(reader.result));
      setImportStatus(
        ok ? 'Progress backup restored successfully!' : 'Invalid backup JSON file.'
      );
      setTimeout(() => setImportStatus(null), 4000);
    };
    reader.readAsText(file);
  };

  return (
    <div className="analytics-view">
      {/* Top KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrap kpi-amber">
            <Trophy size={22} />
          </div>
          <div>
            <div className="kpi-value">
              Level {levelInfo.level} ({data.xp} XP)
            </div>
            <div className="kpi-label">
              {levelInfo.currentLevelXp} / {levelInfo.nextLevelXp} XP to next level
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap kpi-rose">
            <Flame size={22} />
          </div>
          <div>
            <div className="kpi-value">{data.streakDays} Day Streak</div>
            <div className="kpi-label">
              {data.totalSessionsCompleted} total sessions completed
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap kpi-emerald">
            <Target size={22} />
          </div>
          <div>
            <div className="kpi-value">
              {bestWpm} WPM Best / {avgWpm} Avg
            </div>
            <div className="kpi-label">All-time net typing speed</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap kpi-blue">
            <Clock size={22} />
          </div>
          <div>
            <div className="kpi-value">{totalMinutes} mins</div>
            <div className="kpi-label">Total focused practice time</div>
          </div>
        </div>
      </div>

      {/* Interactive Per-Key Keyboard Heatmap */}
      <div className="analytics-section-card">
        <div className="section-header-row">
          <div>
            <h3>Per-Key Keyboard Heatmap</h3>
            <p className="section-sub">
              Inspect your accuracy percentage or keystroke transition speed (WPM) for every individual key.
            </p>
          </div>
          <div className="segmented-tabs">
            <button
              type="button"
              className={`seg-btn ${heatmapMode === 'accuracy' ? 'seg-active' : ''}`}
              onClick={() => setHeatmapMode('accuracy')}
            >
              Accuracy % Heatmap
            </button>
            <button
              type="button"
              className={`seg-btn ${heatmapMode === 'speed' ? 'seg-active' : ''}`}
              onClick={() => setHeatmapMode('speed')}
            >
              Speed (WPM) Heatmap
            </button>
          </div>
        </div>

        <VisualKeyboard
          layoutId={data.settings.layout}
          targetGuide={null}
          lastErrorChar={null}
          showFingerColors={false}
          heatmapMode={heatmapMode}
          keyStats={data.keyStats}
        />

        {weakestKeys.length > 0 ? (
          <div className="weak-keys-strip">
            <div className="weak-keys-list">
              <span className="weak-label">Keys needing practice:</span>
              {weakestKeys.map((item) => (
                <span key={item.key} className="weak-key-chip">
                  <strong>{item.key === ' ' ? 'Space' : item.key.toUpperCase()}</strong> ·{' '}
                  {item.accuracy}% · {item.wpm} WPM
                </span>
              ))}
            </div>
            <button
              type="button"
              className="btn-primary"
              onClick={onPracticeWeakKeys}
            >
              <Zap size={16} /> Practice Weakest Keys Now
            </button>
          </div>
        ) : (
          <p className="empty-hint">
            Complete a few lessons or speed tests to populate per-key accuracy and speed metrics.
          </p>
        )}
      </div>

      {/* Historical WPM & Accuracy Trend Chart */}
      <div className="analytics-section-card">
        <h3>WPM & Accuracy Progression (Last {recentSessions.length} Sessions)</h3>
        {recentSessions.length >= 2 ? (
          <div className="trend-chart-container">
            <svg viewBox="0 0 700 210" className="trend-svg">
              {[0, 0.25, 0.5, 0.75, 1].map((t, idx) => (
                <line
                  key={idx}
                  x1={40}
                  y1={20 + t * 160}
                  x2={670}
                  y2={20 + t * 160}
                  stroke="var(--border-subtle)"
                  strokeDasharray="4 4"
                />
              ))}
              {(() => {
                const maxWpm = Math.max(60, ...recentSessions.map((s) => s.netWpm));
                const pointsWpm = recentSessions
                  .map((s, i) => {
                    const x =
                      40 + (i / Math.max(1, recentSessions.length - 1)) * 630;
                    const y = 180 - (s.netWpm / maxWpm) * 155;
                    return `${x},${y}`;
                  })
                  .join(' ');

                const pointsAcc = recentSessions
                  .map((s, i) => {
                    const x =
                      40 + (i / Math.max(1, recentSessions.length - 1)) * 630;
                    const y = 180 - (s.accuracy / 100) * 155;
                    return `${x},${y}`;
                  })
                  .join(' ');

                return (
                  <>
                    <polyline
                      fill="none"
                      stroke="var(--accent-primary)"
                      strokeWidth="3"
                      points={pointsWpm}
                    />
                    <polyline
                      fill="none"
                      stroke="var(--accent-emerald)"
                      strokeWidth="2.5"
                      strokeDasharray="5 3"
                      points={pointsAcc}
                    />
                    {recentSessions.map((s, i) => {
                      const x =
                        40 + (i / Math.max(1, recentSessions.length - 1)) * 630;
                      const y = 180 - (s.netWpm / maxWpm) * 155;
                      return (
                        <circle
                          key={s.id}
                          cx={x}
                          cy={y}
                          r={4.5}
                          fill="var(--accent-primary)"
                        >
                          <title>
                            {s.label}: {s.netWpm} WPM ({s.accuracy}%)
                          </title>
                        </circle>
                      );
                    })}
                  </>
                );
              })()}
            </svg>
            <div className="chart-legend">
              <span>
                <i
                  className="legend-dot"
                  style={{ background: 'var(--accent-primary)' }}
                />{' '}
                Net WPM (Solid Line)
              </span>
              <span>
                <i
                  className="legend-dot"
                  style={{ background: 'var(--accent-emerald)' }}
                />{' '}
                Accuracy % (Dashed Line)
              </span>
            </div>
          </div>
        ) : (
          <p className="empty-hint">
            Complete at least 2 typing sessions to view your WPM and Accuracy progression chart.
          </p>
        )}
      </div>

      {/* Session History & Persistent Backup Controls */}
      <div className="analytics-bottom-split">
        <div className="analytics-section-card">
          <h3>Recent Session Log</h3>
          {data.history.length === 0 ? (
            <p className="empty-hint">No sessions recorded yet.</p>
          ) : (
            <div className="history-table-wrap">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Drill / Mode</th>
                    <th>Net WPM</th>
                    <th>Accuracy</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {data.history.slice(0, 12).map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.label}</strong>
                        <span className="history-mode-tag">{item.mode}</span>
                      </td>
                      <td>{item.netWpm} WPM</td>
                      <td>{item.accuracy}%</td>
                      <td>{item.durationSec}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="analytics-section-card">
          <h3>Offline Data Persistence & Backup</h3>
          <p className="section-sub">
            Your progress is automatically saved offline after every session.
          </p>
          <div className="storage-path-box">
            <HardDrive size={16} />
            <code>{storagePath}</code>
          </div>

          {importStatus && (
            <div className="import-alert">
              <CheckCircle2 size={16} /> {importStatus}
            </div>
          )}

          <div className="backup-actions-col">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleExportBackup}
            >
              <Download size={16} /> Export Progress Backup (.json)
            </button>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={16} /> Import Progress Backup (.json)
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />

            {!confirmReset ? (
              <button
                type="button"
                className="btn-danger-outline"
                onClick={() => setConfirmReset(true)}
              >
                <Trash2 size={16} /> Reset All Progress
              </button>
            ) : (
              <div className="confirm-reset-row">
                <span>Are you sure?</span>
                <button
                  type="button"
                  className="btn-danger-solid"
                  onClick={() => {
                    onResetProgress();
                    setConfirmReset(false);
                  }}
                >
                  Yes, Wipe Data
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setConfirmReset(false)}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
