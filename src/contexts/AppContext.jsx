import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useEntries } from '../hooks/useEntries';
import { usePomodoro } from '../hooks/usePomodoro';
import { DEFAULT_TASKS, STORAGE_KEYS, CLOCK_SIZES } from '../utils/constants';

const AppContext = createContext(null);

// Check for saved pomodoro session on initial load (computed once at module load)
const INITIAL_STATE = (() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.POMODORO);
    if (saved) {
      const state = JSON.parse(saved);
      if (state.taskId && state.startTime) {
        return { view: 'pomodoro', taskId: state.taskId };
      }
    }
  } catch {
    // Ignore errors
  }
  return { view: 'main', taskId: null };
})();

export function AppProvider({ children }) {
  // Settings (persisted)
  const [settings, setSettings] = useLocalStorage(STORAGE_KEYS.SETTINGS, {
    clockSizeIndex: 1, // default to large (index 1)
    lastGoal: '',
  });

  // Fullscreen state (synced with document.fullscreenElement)
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);

  // Sync fullscreen state when user presses Escape or uses browser controls
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Toggle fullscreen manually
  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else if (document.fullscreenEnabled) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }, []);

  // Set clock size directly by index
  const setClockSizeIndex = useCallback((index) => {
    if (index >= 0 && index < CLOCK_SIZES.length) {
      setSettings((prev) => ({ ...prev, clockSizeIndex: index }));
    }
  }, [setSettings]);

  // Entries management - pass tasks for future configurability
  const entriesApi = useEntries(DEFAULT_TASKS);

  // Pomodoro management
  const pomodoroApi = usePomodoro(entriesApi.addEntry, setSettings);

  // Current view state - initialized based on recovery check
  const [view, setView] = useState(INITIAL_STATE.view);
  const [selectedTask, setSelectedTask] = useState(() => {
    if (INITIAL_STATE.taskId) {
      return DEFAULT_TASKS.find(t => t.id === INITIAL_STATE.taskId) || null;
    }
    return null;
  });

  // Clock size cycling
  const cycleClockSize = () => {
    setSettings((prev) => ({
      ...prev,
      clockSizeIndex: (prev.clockSizeIndex + 1) % CLOCK_SIZES.length,
    }));
  };

  // Get current clock size in vw
  const getClockSize = () => CLOCK_SIZES[settings.clockSizeIndex];

  // Select task and go to goal setter
  const selectTask = (task) => {
    setSelectedTask(task);
    setView('goalSetter');
  };

  // Start pomodoro with goal
  const startPomodoroWithGoal = (goal) => {
    if (!selectedTask) return;
    pomodoroApi.startPomodoro(selectedTask, goal);
    setView('pomodoro');
  };

  // Cancel goal setter and go back
  const cancelGoalSetter = () => {
    setSelectedTask(null);
    setView('main');
  };

  // Finish pomodoro and return to main
  const finishAndReturn = () => {
    pomodoroApi.finishPomodoro();
    setSelectedTask(null);
    setView('main');
  };

  // Recover pomodoro session on mount - only recover timer state, view is set above
  const recoveryDone = useRef(false);
  useEffect(() => {
    if (!recoveryDone.current && INITIAL_STATE.view === 'pomodoro') {
      pomodoroApi.recoverPomodoro(DEFAULT_TASKS);
      recoveryDone.current = true;
    }
  }, [pomodoroApi]);

  const value = {
    // Static data
    tasks: DEFAULT_TASKS,

    // Settings
    settings,
    setSettings,
    cycleClockSize,
    getClockSize,
    setClockSizeIndex,

    // Fullscreen
    isFullscreen,
    toggleFullscreen,

    // Entries
    ...entriesApi,

    // Pomodoro
    ...pomodoroApi,

    // View management
    view,
    setView,
    selectedTask,
    selectTask,
    startPomodoroWithGoal,
    cancelGoalSetter,
    finishAndReturn,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

export default AppContext;
