import { useCallback, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { STORAGE_KEYS, MIN_TIME_TO_TRACK } from '../utils/constants';
import { getCleanupCutoff, isToday, generateId } from '../utils/dateUtils';

/**
 * Hook for managing time entries with automatic 2-day cleanup
 * Entry structure: { id, taskId, start, end } - ISO UTC strings
 * @param {Array} tasks - Available tasks (passed from context for future configurability)
 */
export function useEntries(tasks) {
  const [entries, setEntries] = useLocalStorage(STORAGE_KEYS.ENTRIES, []);

  // Cleanup entries older than 2 days on mount
  useEffect(() => {
    const cutoff = getCleanupCutoff();
    setEntries((prev) => {
      const filtered = prev.filter((entry) => new Date(entry.end) >= cutoff);
      if (filtered.length !== prev.length) {
        console.log(`Cleaned up ${prev.length - filtered.length} old entries`);
      }
      return filtered;
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Add a new entry
  const addEntry = useCallback((taskId, start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const duration = endDate - startDate;

    // Don't record entries shorter than minimum
    if (duration < MIN_TIME_TO_TRACK) {
      console.log(`Entry too short (${duration}ms), not recording`);
      return null;
    }

    const entry = {
      id: generateId(),
      taskId,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    };

    setEntries((prev) => [...prev, entry]);
    return entry;
  }, [setEntries]);

  // Get today's entries
  const getTodaysEntries = useCallback(() => {
    return entries.filter((entry) => isToday(entry.start) || isToday(entry.end))
      .map((entry) => {
        const task = tasks.find((t) => t.id === entry.taskId);
        return {
          ...entry,
          task,
          start: new Date(entry.start),
          end: new Date(entry.end),
          ms: new Date(entry.end) - new Date(entry.start),
        };
      });
  }, [entries]);

  // Get time spent per task today
  const getTimeSpentByTask = useCallback(() => {
    const todaysEntries = getTodaysEntries();
    const timeByTask = {};

    // Initialize all tasks with 0
    tasks.forEach((task) => {
      timeByTask[task.id] = 0;
    });

    // Sum up time for each task
    todaysEntries.forEach((entry) => {
      if (Object.prototype.hasOwnProperty.call(timeByTask, entry.taskId)) {
        timeByTask[entry.taskId] += entry.ms;
      }
    });

    return timeByTask;
  }, [getTodaysEntries]);

  // Delete an entry by id
  const deleteEntry = useCallback((id) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
  }, [setEntries]);

  return {
    entries,
    addEntry,
    deleteEntry,
    getTodaysEntries,
    getTimeSpentByTask,
  };
}

export default useEntries;
