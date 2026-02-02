import { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { POMODORO_INTERVALS, MS_IN_MINUTE, SECS_IN_MINUTE } from '../utils/constants';
import { formatTime } from '../utils/dateUtils';
import { SettingsMenu } from './SettingsMenu';

export function PomodoroView() {
  const {
    currentScope,
    currentGoal,
    isPlaying,
    intervalIndex,
    getMsLeft,
    getSessionTime,
    isOverdue,
    togglePlayPause,
    addTime,
    changeInterval,
    finishAndReturn,
    playDing,
  } = useApp();

  const [tick, forceUpdate] = useState(0);

  // Update display every 100ms
  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate((n) => n + 1);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Play ding when timer expires - using ref to avoid setState in effect
  // Include tick in deps so effect runs on each timer tick
  const prevOverdueRef = useRef(false);
  useEffect(() => {
    const overdue = isOverdue();
    if (overdue && !prevOverdueRef.current) {
      playDing();
    }
    prevOverdueRef.current = overdue;
  }, [tick, isOverdue, playDing]);

  const msLeft = getMsLeft();
  const sessionSeconds = getSessionTime() / 1000;
  const overdue = isOverdue();

  // Determine background color
  const getBgColor = useCallback(() => {
    if (overdue) return '#ffffff';
    return `#${currentScope?.color || '666'}22`;
  }, [overdue, currentScope]);

  const getTextColor = useCallback(() => {
    return overdue ? '#000000' : '#ffffff';
  }, [overdue]);

  // Format time display (condensed: show "5m" when >= 1 min, "0:45" when < 1 min)
  const timeDisplay = formatTime(msLeft / 1000, false, true);

  // Session time warning (> 55 minutes)
  // Purpose: Make the user aware they've spent significantly more time than planned.
  // This highlights the tendency to underestimate session duration and encourages
  // better time awareness and estimation in future sessions.
  const sessionWarning = sessionSeconds >= 55 * SECS_IN_MINUTE;

  return (
    <div
      className="pomodoro-view"
      style={{ backgroundColor: getBgColor(), color: getTextColor() }}
    >
      {/* Top row - Duration presets and settings */}
      <div className="pmd-top">
        <div className="pmd-intervals">
          {POMODORO_INTERVALS.map((interval, idx) => (
            <button
              key={interval}
              className={`pmd-interval-button ${idx === intervalIndex ? 'active' : ''}`}
              onClick={() => changeInterval(idx)}
            >
              {interval}
            </button>
          ))}
        </div>
        <SettingsMenu />
      </div>

      {/* Center - goal and time */}
      <div className="pmd-center" onClick={finishAndReturn}>
        {!overdue ? (
          <>
            <span className="pmd-goal">{currentGoal}</span>
            <span className="pmd-time">
              {timeDisplay}
              {!isPlaying && ' ▮▮'}
            </span>
          </>
        ) : (
          <span className="pmd-time-up">
            time is up
            <br />
            click to finish
          </span>
        )}
      </div>

      {/* Bottom row - controls */}
      <div className="pmd-bottom">
        <div className={`pmd-session-time ${sessionWarning ? 'warning' : ''} ${overdue ? 'overdue' : ''}`}>
          {formatTime(sessionSeconds, true)}
        </div>

        <div className="pmd-controls">
          <button
            className="pmd-control-button"
            onClick={togglePlayPause}
          >
            {isPlaying ? '▮▮' : '▶'}
          </button>
          <button
            className="pmd-control-button"
            onClick={() => addTime(1 * MS_IN_MINUTE)}
          >
            +1
          </button>
          <button
            className="pmd-control-button"
            onClick={() => addTime(5 * MS_IN_MINUTE)}
          >
            +5
          </button>
        </div>
      </div>
    </div>
  );
}

export default PomodoroView;
