import { createContext, useContext, useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useEntries } from '../hooks/useEntries';
import { usePomodoro } from '../hooks/usePomodoro';
import { DEFAULT_SCOPES, DEFAULT_GOALS, STORAGE_KEYS, CLOCK_SIZES, SCOPE_LIMITS, PRESET_COLORS, PINNED_GOALS_COUNT, MAX_RECENT_GOALS } from '../utils/constants';

const AppContext = createContext(null);

// Check for saved pomodoro session on initial load (computed once at module load)
const INITIAL_STATE = (() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.POMODORO);
    if (saved) {
      const state = JSON.parse(saved);
      if (state.scopeId && state.startTime) {
        return { view: 'pomodoro', scopeId: state.scopeId };
      }
    }
  } catch {
    // Ignore errors
  }
  return { view: 'main', scopeId: null };
})();

// Validate scopes array - returns valid scopes or DEFAULT_SCOPES
function validateScopes(scopes) {
  if (!Array.isArray(scopes)) return DEFAULT_SCOPES;
  if (scopes.length < SCOPE_LIMITS.MIN || scopes.length > SCOPE_LIMITS.MAX) return DEFAULT_SCOPES;

  const validScopes = scopes.filter(s =>
    s && typeof s.id === 'number' &&
    typeof s.name === 'string' && s.name.trim() &&
    typeof s.color === 'string' && /^[0-9a-fA-F]{6}$/.test(s.color)
  );

  if (validScopes.length < SCOPE_LIMITS.MIN) return DEFAULT_SCOPES;
  return validScopes;
}

export function AppProvider({ children }) {
  // Settings (persisted)
  const [settings, setSettings] = useLocalStorage(STORAGE_KEYS.SETTINGS, {
    clockSizeIndex: 1, // default to large (index 1)
    lastGoal: '',
    scopes: DEFAULT_SCOPES,
  });

  // Derive validated scopes from settings
  const scopes = useMemo(() => validateScopes(settings.scopes), [settings.scopes]);

  // Migrate: initialize pinnedGoals and recentGoals if absent
  useEffect(() => {
    if (!settings.pinnedGoals) {
      setSettings((prev) => {
        if (prev.pinnedGoals) return prev; // already migrated (race check)
        const currentScopes = validateScopes(prev.scopes);
        const pinnedGoals = {};
        const recentGoals = {};
        for (const s of currentScopes) {
          pinnedGoals[s.id] = [...DEFAULT_GOALS];
          recentGoals[s.id] = [];
        }
        // Seed first scope's recents with lastGoal if it exists and isn't pinned
        if (prev.lastGoal && currentScopes.length > 0) {
          const firstId = currentScopes[0].id;
          if (!pinnedGoals[firstId].includes(prev.lastGoal)) {
            recentGoals[firstId] = [prev.lastGoal];
          }
        }
        return { ...prev, pinnedGoals, recentGoals };
      });
    }
  }, [settings.pinnedGoals, setSettings]);

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

  // Goal functions
  const addRecentGoal = useCallback((scopeId, goal) => {
    setSettings((prev) => {
      const pinned = (prev.pinnedGoals || {})[scopeId] || [];
      if (pinned.includes(goal)) return prev; // don't add pinned goals to recents
      const oldRecents = (prev.recentGoals || {})[scopeId] || [];
      const deduped = [goal, ...oldRecents.filter(g => g !== goal)].slice(0, MAX_RECENT_GOALS);
      return {
        ...prev,
        recentGoals: { ...prev.recentGoals, [scopeId]: deduped },
      };
    });
  }, [setSettings]);

  const updatePinnedGoals = useCallback((scopeId, pinnedArray) => {
    setSettings((prev) => {
      const capped = pinnedArray.slice(0, PINNED_GOALS_COUNT);
      // Remove newly-pinned goals from recents
      const oldRecents = (prev.recentGoals || {})[scopeId] || [];
      const filteredRecents = oldRecents.filter(g => !capped.includes(g));
      return {
        ...prev,
        pinnedGoals: { ...prev.pinnedGoals, [scopeId]: capped },
        recentGoals: { ...prev.recentGoals, [scopeId]: filteredRecents },
      };
    });
  }, [setSettings]);

  const getGoalsForScope = useCallback((scopeId) => {
    const pinned = (settings.pinnedGoals || {})[scopeId] || DEFAULT_GOALS;
    const recent = (settings.recentGoals || {})[scopeId] || [];
    return [...pinned, ...recent].slice(0, PINNED_GOALS_COUNT + MAX_RECENT_GOALS);
  }, [settings.pinnedGoals, settings.recentGoals]);

  // Scope CRUD functions
  const updateScope = useCallback((id, updates) => {
    setSettings((prev) => ({
      ...prev,
      scopes: (prev.scopes || DEFAULT_SCOPES).map(s =>
        s.id === id ? { ...s, ...updates } : s
      ),
    }));
  }, [setSettings]);

  const addScope = useCallback(() => {
    setSettings((prev) => {
      const currentScopes = prev.scopes || DEFAULT_SCOPES;
      if (currentScopes.length >= SCOPE_LIMITS.MAX) return prev;

      const maxId = Math.max(...currentScopes.map(s => s.id), 0);
      const newId = maxId + 1;
      const usedColors = new Set(currentScopes.map(s => s.color));
      const availableColor = PRESET_COLORS.find(c => !usedColors.has(c)) || PRESET_COLORS[0];

      return {
        ...prev,
        scopes: [...currentScopes, { id: newId, name: 'New', color: availableColor }],
        pinnedGoals: { ...prev.pinnedGoals, [newId]: [...DEFAULT_GOALS] },
        recentGoals: { ...prev.recentGoals, [newId]: [] },
      };
    });
  }, [setSettings]);

  const removeScope = useCallback((id) => {
    setSettings((prev) => {
      const currentScopes = prev.scopes || DEFAULT_SCOPES;
      if (currentScopes.length <= SCOPE_LIMITS.MIN) return prev;
      const { [id]: _p, ...restPinned } = prev.pinnedGoals || {};
      const { [id]: _r, ...restRecent } = prev.recentGoals || {};
      return {
        ...prev,
        scopes: currentScopes.filter(s => s.id !== id),
        pinnedGoals: restPinned,
        recentGoals: restRecent,
      };
    });
  }, [setSettings]);

  const reorderScopes = useCallback((fromIndex, toIndex) => {
    setSettings((prev) => {
      const currentScopes = [...(prev.scopes || DEFAULT_SCOPES)];
      if (fromIndex < 0 || fromIndex >= currentScopes.length) return prev;
      if (toIndex < 0 || toIndex >= currentScopes.length) return prev;

      const [moved] = currentScopes.splice(fromIndex, 1);
      currentScopes.splice(toIndex, 0, moved);

      return { ...prev, scopes: currentScopes };
    });
  }, [setSettings]);

  const resetScopes = useCallback(() => {
    setSettings((prev) => {
      const pinnedGoals = {};
      const recentGoals = {};
      for (const s of DEFAULT_SCOPES) {
        pinnedGoals[s.id] = [...DEFAULT_GOALS];
        recentGoals[s.id] = [];
      }
      return { ...prev, scopes: DEFAULT_SCOPES, pinnedGoals, recentGoals };
    });
  }, [setSettings]);

  // Entries management - pass scopes for future configurability
  const entriesApi = useEntries(scopes);

  // Pomodoro management
  const pomodoroApi = usePomodoro(entriesApi.addEntry, setSettings);

  // Current view state - initialized based on recovery check
  const [view, setView] = useState(INITIAL_STATE.view);
  const [selectedScope, setSelectedScope] = useState(() => {
    if (INITIAL_STATE.scopeId) {
      return scopes.find(s => s.id === INITIAL_STATE.scopeId) || null;
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

  // Select scope and go to goal setter
  const selectScope = (scope) => {
    setSelectedScope(scope);
    setView('goalSetter');
  };

  // Start pomodoro with goal
  const startPomodoroWithGoal = (goal) => {
    if (!selectedScope) return;
    addRecentGoal(selectedScope.id, goal);
    pomodoroApi.startPomodoro(selectedScope, goal);
    setView('pomodoro');
  };

  // Cancel goal setter and go back
  const cancelGoalSetter = () => {
    setSelectedScope(null);
    setView('main');
  };

  // Finish pomodoro and return to main
  const finishAndReturn = () => {
    pomodoroApi.finishPomodoro();
    setSelectedScope(null);
    setView('main');
  };

  // Recover pomodoro session on mount - only recover timer state, view is set above
  const recoveryDone = useRef(false);
  useEffect(() => {
    if (!recoveryDone.current && INITIAL_STATE.view === 'pomodoro') {
      pomodoroApi.recoverPomodoro(scopes);
      recoveryDone.current = true;
    }
  }, [pomodoroApi, scopes]);

  const value = {
    // Scopes (now configurable)
    scopes,
    updateScope,
    addScope,
    removeScope,
    reorderScopes,
    resetScopes,

    // Goals
    addRecentGoal,
    updatePinnedGoals,
    getGoalsForScope,

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
    selectedScope,
    selectScope,
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
