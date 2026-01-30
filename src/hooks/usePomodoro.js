import { useState, useCallback, useRef, useEffect } from 'react';
import {
  POMODORO_INTERVALS,
  DEFAULT_INTERVAL_INDEX,
  MS_IN_MINUTE,
  UPDATE_TIMER_INTERVAL,
  DING_MIN_PAUSE_MS,
  STORAGE_KEYS,
} from '../utils/constants';
import gongSound from '../assets/sounds/gong.mp3';

/**
 * Hook for managing Pomodoro timer logic
 */
export function usePomodoro(addEntry, saveSettings) {
  // Timer state
  const [isActive, setIsActive] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [currentGoal, setCurrentGoal] = useState('');
  const [intervalIndex, setIntervalIndex] = useState(DEFAULT_INTERVAL_INDEX);
  const [msRemaining, setMsRemaining] = useState(0);
  const [launchedTime, setLaunchedTime] = useState(null);
  const [totalWorkMs, setTotalWorkMs] = useState(0);

  // Refs for timer calculations
  const startTimeRef = useRef(null);
  const timerRef = useRef(null);
  const audioRef = useRef(null);
  const lastDingRef = useRef(0);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio(gongSound);
    audioRef.current.preload = 'auto';
  }, []);

  // Play ding sound with minimum pause
  const playDing = useCallback(() => {
    const now = Date.now();
    if (now - lastDingRef.current < DING_MIN_PAUSE_MS) {
      return;
    }
    lastDingRef.current = now;

    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.volume = 1;
      audioRef.current.play().catch(() => {});
    }
  }, []);

  // Calculate ms passed since startTime
  const getMsPassed = useCallback(() => {
    if (!startTimeRef.current) return 0;
    return Date.now() - startTimeRef.current;
  }, []);

  // Get current ms left
  const getMsLeft = useCallback(() => {
    if (!isPlaying) return msRemaining;
    return msRemaining - getMsPassed();
  }, [isPlaying, msRemaining, getMsPassed]);

  // Get total session time (since pomodoro was launched)
  const getSessionTime = useCallback(() => {
    if (!launchedTime) return 0;
    return Date.now() - launchedTime;
  }, [launchedTime]);

  // Check if timer is overdue
  const isOverdue = useCallback(() => {
    return getMsLeft() <= 0;
  }, [getMsLeft]);

  // Save pomodoro state for recovery
  const savePomodoroState = useCallback(() => {
    if (!isActive || !currentTask) return;

    const state = {
      taskId: currentTask.id,
      goal: currentGoal,
      startTime: startTimeRef.current,
      msRemaining,
      launchedTime,
      totalWorkMs,
      isPlaying,
      intervalIndex,
    };
    localStorage.setItem(STORAGE_KEYS.POMODORO, JSON.stringify(state));
  }, [isActive, currentTask, currentGoal, msRemaining, launchedTime, totalWorkMs, isPlaying, intervalIndex]);

  // Clear saved pomodoro state
  const clearPomodoroState = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.POMODORO);
  }, []);

  // Start a new pomodoro
  const startPomodoro = useCallback((task, goal) => {
    setIsActive(true);
    setIsPlaying(true);
    setCurrentTask(task);
    setCurrentGoal(goal);
    setIntervalIndex(DEFAULT_INTERVAL_INDEX);
    setMsRemaining(POMODORO_INTERVALS[DEFAULT_INTERVAL_INDEX] * MS_IN_MINUTE);
    setLaunchedTime(Date.now());
    setTotalWorkMs(0);
    startTimeRef.current = Date.now();

    // Save last goal for next time
    if (goal && saveSettings) {
      saveSettings((prev) => ({ ...prev, lastGoal: goal }));
    }

    // Request fullscreen
    if (document.fullscreenEnabled && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }, [saveSettings]);

  // Toggle play/pause
  const togglePlayPause = useCallback(() => {
    // Don't pause if overdue
    if (getMsLeft() <= 0) return;

    if (isPlaying) {
      // Pausing - record the entry
      if (currentTask && startTimeRef.current) {
        addEntry(currentTask.id, startTimeRef.current, Date.now());
        setTotalWorkMs((prev) => prev + getMsPassed());
      }
      // Update msRemaining to reflect time spent
      setMsRemaining((prev) => prev - getMsPassed());
    }

    // Reset start time for next segment
    startTimeRef.current = Date.now();
    setIsPlaying((prev) => !prev);
  }, [isPlaying, currentTask, addEntry, getMsPassed, getMsLeft]);

  // Add time to the timer
  const addTime = useCallback((ms) => {
    setMsRemaining((prev) => {
      // If overdue, first fix the deficit
      const msLeft = isPlaying ? prev - getMsPassed() : prev;
      if (msLeft < 0) {
        return prev + (-msLeft) + ms;
      }
      return prev + ms;
    });
  }, [isPlaying, getMsPassed]);

  // Change interval preset
  const changeInterval = useCallback((index) => {
    setIntervalIndex(index);
    setMsRemaining(POMODORO_INTERVALS[index] * MS_IN_MINUTE + getMsPassed());
  }, [getMsPassed]);

  // Finish the pomodoro
  const finishPomodoro = useCallback(() => {
    // Record final entry if still playing
    if (isPlaying && currentTask && startTimeRef.current) {
      addEntry(currentTask.id, startTimeRef.current, Date.now());
    }

    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Reset state
    setIsActive(false);
    setIsPlaying(false);
    setCurrentTask(null);
    setCurrentGoal('');
    setMsRemaining(0);
    setLaunchedTime(null);
    setTotalWorkMs(0);
    startTimeRef.current = null;

    // Clear saved state
    clearPomodoroState();

    // Exit fullscreen
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }, [isPlaying, currentTask, addEntry, clearPomodoroState]);

  // Check for unsaved pomodoro on mount
  const recoverPomodoro = useCallback((tasks) => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.POMODORO);
      if (!saved) return false;

      const state = JSON.parse(saved);
      const task = tasks.find((t) => t.id === state.taskId);

      if (!task || !state.startTime) {
        clearPomodoroState();
        return false;
      }

      // Restore state
      setIsActive(true);
      setIsPlaying(state.isPlaying);
      setCurrentTask(task);
      setCurrentGoal(state.goal || '');
      setIntervalIndex(state.intervalIndex || DEFAULT_INTERVAL_INDEX);
      setMsRemaining(state.msRemaining);
      setLaunchedTime(state.launchedTime);
      setTotalWorkMs(state.totalWorkMs);
      startTimeRef.current = state.isPlaying ? state.startTime : Date.now();

      return true;
    } catch (e) {
      console.error('Error recovering pomodoro:', e);
      clearPomodoroState();
      return false;
    }
  }, [clearPomodoroState]);

  // Timer tick effect - save state periodically
  useEffect(() => {
    if (isActive && isPlaying) {
      const interval = setInterval(() => {
        savePomodoroState();
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isActive, isPlaying, savePomodoroState]);

  return {
    // State
    isActive,
    isPlaying,
    currentTask,
    currentGoal,
    intervalIndex,
    msRemaining,
    launchedTime,
    totalWorkMs,

    // Computed
    getMsLeft,
    getMsPassed,
    getSessionTime,
    isOverdue,

    // Actions
    startPomodoro,
    togglePlayPause,
    addTime,
    changeInterval,
    finishPomodoro,
    recoverPomodoro,
    playDing,
  };
}

export default usePomodoro;
