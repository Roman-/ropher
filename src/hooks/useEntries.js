import { useCallback, useEffect, useState } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { STORAGE_KEYS, MIN_TIME_TO_TRACK } from '../utils/constants';
import { getCleanupCutoff, isToday, generateId } from '../utils/dateUtils';

/**
 * Hook for managing time entries with automatic 2-day cleanup
 * Entry structure: { id, scopeId, start, end } - ISO UTC strings
 * @param {Array} scopes - Available scopes (passed from context for future configurability)
 */
export function useEntries(scopes) {
  const [entries, setEntries] = useLocalStorage(STORAGE_KEYS.ENTRIES, []);
  const [currentDay, setCurrentDay] = useState(() => new Date().toDateString());

  // Check every 10s if the day has changed (forces re-render of summaries after midnight)
  useEffect(() => {
    const id = setInterval(() => {
      const today = new Date().toDateString();
      if (today !== currentDay) setCurrentDay(today);
    }, 10_000);
    return () => clearInterval(id);
  }, [currentDay]);

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
  const addEntry = useCallback((scopeId, start, end) => {
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
      scopeId,
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
        const scope = scopes.find((s) => s.id === entry.scopeId);
        return {
          ...entry,
          scope,
          start: new Date(entry.start),
          end: new Date(entry.end),
          ms: new Date(entry.end) - new Date(entry.start),
        };
      });
  }, [entries, scopes, currentDay]); // eslint-disable-line react-hooks/exhaustive-deps

  // Get time spent per scope today
  const getTimeSpentByScope = useCallback(() => {
    const todaysEntries = getTodaysEntries();
    const timeByScope = {};

    // Initialize all scopes with 0
    scopes.forEach((scope) => {
      timeByScope[scope.id] = 0;
    });

    // Sum up time for each scope
    todaysEntries.forEach((entry) => {
      if (Object.prototype.hasOwnProperty.call(timeByScope, entry.scopeId)) {
        timeByScope[entry.scopeId] += entry.ms;
      }
    });

    return timeByScope;
  }, [getTodaysEntries, scopes]);

  // Delete an entry by id
  const deleteEntry = useCallback((id) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
  }, [setEntries]);

  return {
    entries,
    addEntry,
    deleteEntry,
    getTodaysEntries,
    getTimeSpentByScope,
  };
}

export default useEntries;
