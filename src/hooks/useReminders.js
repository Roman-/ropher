import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DEFAULT_REMINDER_TEXT,
  MAX_REMINDERS,
  WAKE_MIN_HIDDEN_MS,
  WAKE_HEARTBEAT_INTERVAL,
  WAKE_GAP_MS,
} from '../utils/constants';
import { isToday, generateId } from '../utils/dateUtils';

/**
 * Is this reminder waiting to be shown?
 * Nothing is ever scheduled - a reminder is simply pending until it is marked
 * done, and marking it done only settles it for the rest of the calendar day.
 */
export function isReminderPending(reminder) {
  if (!reminder || !reminder.enabled) return false;
  return !reminder.lastDoneAt || !isToday(reminder.lastDoneAt);
}

/**
 * Hook for managing reminders.
 *
 * A reminder window may only ever cover the home screen. Every arrival at the
 * home screen - clicking through from a finished pomodoro, backing out of the
 * goal setter or settings, starting the app, or the display waking up while
 * the home screen is already showing - is a fresh chance for a pending
 * reminder to pop up. "Postpone" only ends the current visit for that
 * reminder: it comes back on the next arrival, however much wall-clock time
 * has passed in between.
 */
export function useReminders(reminders, setSettings, isHome) {
  // Reminders answered or postponed during the current visit to the home
  // screen, so they stop asking until the next visit
  const [dismissed, setDismissed] = useState([]);

  // Reminder forced on screen by the Test button - shown even when not pending
  const [forcedId, setForcedId] = useState(null);

  const startVisit = useCallback(() => setDismissed([]), []);

  // Arriving at the home screen starts a new visit; leaving it drops any test.
  // Adjusted during render rather than in an effect so the window is already
  // correct on the first frame of the home screen.
  const [wasHome, setWasHome] = useState(isHome);
  if (wasHome !== isHome) {
    setWasHome(isHome);
    if (isHome) setDismissed([]);
    else setForcedId(null);
  }

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
        lastDoneAt: null,
      };
      return { ...prev, reminders: [...current, newReminder] };
    });
  }, [setSettings]);

  // Stop a reminder asking for the rest of this visit to the home screen
  const closeReminder = useCallback((id) => {
    setDismissed((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setForcedId((prev) => (prev === id ? null : prev));
  }, []);

  const removeReminder = useCallback((id) => {
    setSettings((prev) => ({
      ...prev,
      reminders: (prev.reminders || []).filter((r) => r.id !== id),
    }));
    closeReminder(id);
  }, [setSettings, closeReminder]);

  // One window at a time: the first reminder still asking on this visit
  const activeReminder = useMemo(() => {
    if (!isHome) return null;

    const forced = forcedId ? reminders.find((r) => r.id === forcedId) : null;
    if (forced) return forced;

    return reminders.find((r) => isReminderPending(r) && !dismissed.includes(r.id)) || null;
  }, [isHome, forcedId, reminders, dismissed]);

  // Reminder actions
  const completeReminder = useCallback((id) => {
    updateReminder(id, { lastDoneAt: Date.now() });
    closeReminder(id);
  }, [updateReminder, closeReminder]);

  // Postponing, and closing the window to jump to settings, are the same
  // thing: not now, ask again next time the home screen comes up
  const postponeReminder = closeReminder;

  // Show a reminder on the next render of the home screen (Test button)
  const testReminder = useCallback((id) => setForcedId(id), []);

  // Wake-up detection - the display coming back on starts a new visit, so a
  // reminder postponed before the screen went dark asks again
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
      if (hiddenFor >= WAKE_MIN_HIDDEN_MS) startVisit();
    };

    // Fallback: a sleeping device freezes timers, and not every device fires
    // visibilitychange when its display goes off - a big heartbeat gap means
    // we were asleep and are only running again because the display came back
    const heartbeat = setInterval(() => {
      const now = Date.now();
      const gap = now - lastTick;
      lastTick = now;
      if (gap >= WAKE_GAP_MS) startVisit();
    }, WAKE_HEARTBEAT_INTERVAL);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(heartbeat);
    };
  }, [startVisit]);

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
    testReminder,
  };
}

export default useReminders;
