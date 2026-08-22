import { useState, useEffect, useCallback, useRef } from 'react';
import {
  REMINDER_FREQUENCIES,
  DEFAULT_REMINDER_FREQUENCY,
  DEFAULT_REMINDER_TEXT,
  MAX_REMINDERS,
  MS_IN_HOUR,
  WAKE_MIN_HIDDEN_MS,
  WAKE_HEARTBEAT_INTERVAL,
  WAKE_GAP_MS,
} from '../utils/constants';
import { isToday, generateId } from '../utils/dateUtils';

// Look up a frequency preset, falling back to the first one
function getFrequency(id) {
  return REMINDER_FREQUENCIES.find((f) => f.id === id) || REMINDER_FREQUENCIES[0];
}

/**
 * Is this reminder allowed to pop up right now?
 * A reminder that was never shown is always due.
 */
export function isReminderDue(reminder, now = Date.now()) {
  if (!reminder || !reminder.enabled) return false;
  if (!reminder.lastShownAt) return true;

  const { hours } = getFrequency(reminder.frequency);
  if (hours === null) return !isToday(reminder.lastShownAt); // once per calendar day
  return now - reminder.lastShownAt >= hours * MS_IN_HOUR;
}

/**
 * Hook for managing reminders.
 *
 * A reminder pops up when the display is turned back on (the app becomes
 * visible again after being away, or timers were frozen while the device
 * slept). Postponing one re-arms it for the moment the pomodoro timer ends.
 */
export function useReminders(reminders, setSettings) {
  // Ids of reminders waiting to be shown, one window at a time
  const [queue, setQueue] = useState([]);

  // Wake detection runs outside React, so it reads reminders through a ref
  const remindersRef = useRef(reminders);
  useEffect(() => {
    remindersRef.current = reminders;
  }, [reminders]);

  const enqueue = useCallback((ids) => {
    if (!ids.length) return;
    setQueue((prev) => [...prev, ...ids.filter((id) => !prev.includes(id))]);
  }, []);

  const dequeue = useCallback((id) => {
    setQueue((prev) => prev.filter((q) => q !== id));
  }, []);

  // Reminder CRUD
  const updateReminder = useCallback((id, updates) => {
    setSettings((prev) => ({
      ...prev,
      reminders: (prev.reminders || []).map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
    }));
  }, [setSettings]);

  const addReminder = useCallback(() => {
    setSettings((prev) => {
      const current = prev.reminders || [];
      if (current.length >= MAX_REMINDERS) return prev;

      const newReminder = {
        id: generateId(),
        text: DEFAULT_REMINDER_TEXT,
        enabled: true,
        frequency: DEFAULT_REMINDER_FREQUENCY,
        lastShownAt: null,
        lastDoneAt: null,
        postponed: false,
      };
      return { ...prev, reminders: [...current, newReminder] };
    });
  }, [setSettings]);

  const removeReminder = useCallback((id) => {
    setSettings((prev) => ({
      ...prev,
      reminders: (prev.reminders || []).filter((r) => r.id !== id),
    }));
    dequeue(id);
  }, [setSettings, dequeue]);

  // Queue every reminder that is due - called when the display wakes up
  const checkDueReminders = useCallback(() => {
    const now = Date.now();
    enqueue(remindersRef.current.filter((r) => isReminderDue(r, now)).map((r) => r.id));
  }, [enqueue]);

  // Queue everything that was postponed - called when the pomodoro timer ends
  const showPostponedReminders = useCallback(() => {
    const postponed = remindersRef.current.filter((r) => r.enabled && r.postponed);
    if (!postponed.length) return;

    const shownIds = new Set(postponed.map((r) => r.id));
    enqueue(postponed.map((r) => r.id));
    setSettings((prev) => ({
      ...prev,
      reminders: (prev.reminders || []).map((r) =>
        shownIds.has(r.id) ? { ...r, postponed: false } : r
      ),
    }));
  }, [enqueue, setSettings]);

  // Show a single reminder right now (used by the Test button in settings)
  const showReminderNow = useCallback((id) => enqueue([id]), [enqueue]);

  // First queued reminder that still exists - deleted ones are skipped over
  const activeId = queue.find((id) => reminders.some((r) => r.id === id)) || null;
  const activeReminder = reminders.find((r) => r.id === activeId) || null;

  // Stamp the reminder once its window is actually on screen
  useEffect(() => {
    if (activeId) {
      updateReminder(activeId, { lastShownAt: Date.now() });
    }
  }, [activeId, updateReminder]);

  // Reminder actions
  const completeReminder = useCallback((id) => {
    updateReminder(id, { lastDoneAt: Date.now(), postponed: false });
    dequeue(id);
  }, [updateReminder, dequeue]);

  const postponeReminder = useCallback((id) => {
    updateReminder(id, { postponed: true });
    dequeue(id);
  }, [updateReminder, dequeue]);

  // Close the window without answering it (used when jumping to settings)
  const dismissReminder = useCallback((id) => dequeue(id), [dequeue]);

  // Wake-up detection
  useEffect(() => {
    let hiddenAt = document.visibilityState === 'hidden' ? Date.now() : null;
    let lastTick = Date.now();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now();
        return;
      }
      const hiddenFor = hiddenAt ? Date.now() - hiddenAt : 0;
      hiddenAt = null;
      lastTick = Date.now();
      if (hiddenFor >= WAKE_MIN_HIDDEN_MS) checkDueReminders();
    };

    // Fallback: a sleeping device freezes timers, and not every device fires
    // visibilitychange when its display goes off - a big heartbeat gap means
    // we were asleep and are only running again because the display came back
    const heartbeat = setInterval(() => {
      const now = Date.now();
      const gap = now - lastTick;
      lastTick = now;
      if (gap >= WAKE_GAP_MS) checkDueReminders();
    }, WAKE_HEARTBEAT_INTERVAL);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(heartbeat);
    };
  }, [checkDueReminders]);

  // Check on startup too - the page may have been reloaded while the display was off
  useEffect(() => {
    checkDueReminders();
  }, [checkDueReminders]);

  return {
    // State
    reminders,
    activeReminder,

    // CRUD
    addReminder,
    updateReminder,
    removeReminder,

    // Actions
    completeReminder,
    postponeReminder,
    dismissReminder,
    showReminderNow,
    showPostponedReminders,
  };
}

export default useReminders;
