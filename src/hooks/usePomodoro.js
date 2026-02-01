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
  const [currentScope, setCurrentScope] = useState(null);
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
    if (!isActive || !currentScope) return;

    const state = {
      scopeId: currentScope.id,
      goal: currentGoal,
      startTime: startTimeRef.current,
      msRemaining,
      launchedTime,
      totalWorkMs,
      isPlaying,
      intervalIndex,
    };
    localStorage.setItem(STORAGE_KEYS.POMODORO, JSON.stringify(state));
  }, [isActive, currentScope, currentGoal, msRemaining, launchedTime, totalWorkMs, isPlaying, intervalIndex]);

  // Clear saved pomodoro state
  const clearPomodoroState = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.POMODORO);
  }, []);

  // Start a new pomodoro
  const startPomodoro = useCallback((scope, goal) => {
    setIsActive(true);
    setIsPlaying(true);
    setCurrentScope(scope);
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
  }, [saveSettings]);

  // Toggle play/pause
  const togglePlayPause = useCallback(() => {
    // Don't pause if overdue
    if (getMsLeft() <= 0) return;
    const msPassed = getMsPassed(); // Capture first before any ref mutations

    if (isPlaying) {
      // Pausing - record the entry
      if (currentScope && startTimeRef.current) {
        addEntry(currentScope.id, startTimeRef.current, Date.now());
        setTotalWorkMs((prev) => prev + msPassed);
      }
      // Update msRemaining to reflect time spent
      setMsRemaining((prev) => prev - msPassed);
    }

    // Reset start time for next segment
    startTimeRef.current = Date.now();
    setIsPlaying((prev) => !prev);
  }, [isPlaying, currentScope, addEntry, getMsPassed, getMsLeft]);

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
    const newMs = POMODORO_INTERVALS[index] * MS_IN_MINUTE;
    const msPassed = getMsPassed(); // Capture first before any ref mutations

    if (isPlaying && currentScope && startTimeRef.current) {
      // Record the work done in the current segment before changing
      addEntry(currentScope.id, startTimeRef.current, Date.now());
      setTotalWorkMs((prev) => prev + msPassed);
    }

    // Start a fresh segment with the new interval
    startTimeRef.current = Date.now();
    setMsRemaining(newMs);
  }, [isPlaying, currentScope, addEntry, getMsPassed]);

  // Finish the pomodoro
  const finishPomodoro = useCallback(() => {
    // Record final entry if still playing
    if (isPlaying && currentScope && startTimeRef.current) {
      addEntry(currentScope.id, startTimeRef.current, Date.now());
    }

    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Reset state
    setIsActive(false);
    setIsPlaying(false);
    setCurrentScope(null);
    setCurrentGoal('');
    setMsRemaining(0);
    setLaunchedTime(null);
    setTotalWorkMs(0);
    startTimeRef.current = null;

    // Clear saved state
    clearPomodoroState();
  }, [isPlaying, currentScope, addEntry, clearPomodoroState]);

  // Check for unsaved pomodoro on mount
  const recoverPomodoro = useCallback((scopes) => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.POMODORO);
      if (!saved) return false;

      const state = JSON.parse(saved);
      const scope = scopes.find((s) => s.id === state.scopeId);

      if (!scope || !state.startTime) {
        clearPomodoroState();
        return false;
      }

      // Restore state
      setIsActive(true);
      setIsPlaying(state.isPlaying);
      setCurrentScope(scope);
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
    currentScope,
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
