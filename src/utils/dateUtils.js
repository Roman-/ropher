import { SECS_IN_MINUTE, MINS_IN_HOUR, MS_IN_SECOND } from './constants';

/**
 * Format seconds to human readable string (e.g., "1:23" or "1:23:45")
 */
export function formatTime(totalSeconds, showHours = false) {
  const isNegative = totalSeconds < 0;
  totalSeconds = Math.abs(Math.floor(totalSeconds));

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n) => n.toString().padStart(2, '0');

  let result;
  if (hours > 0 || showHours) {
    result = `${hours}:${pad(minutes)}:${pad(seconds)}`;
  } else {
    result = `${minutes}:${pad(seconds)}`;
  }

  return isNegative ? `-${result}` : result;
}

/**
 * Format milliseconds to human readable string (e.g., "2h 15m")
 */
export function msToHumanString(ms) {
  const totalMinutes = Math.floor(ms / MS_IN_SECOND / SECS_IN_MINUTE);
  const hours = Math.floor(totalMinutes / MINS_IN_HOUR);
  const minutes = totalMinutes % MINS_IN_HOUR;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Get current time as HH:MM string
 */
export function getCurrentHHMM() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Get start of today (midnight)
 */
export function getStartOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * Get cutoff date for 2-day cleanup (start of day before yesterday)
 */
export function getCleanupCutoff() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 2);
  cutoff.setHours(0, 0, 0, 0);
  return cutoff;
}

/**
 * Check if a date is today
 */
export function isToday(date) {
  const today = new Date();
  const d = new Date(date);
  return d.getFullYear() === today.getFullYear() &&
         d.getMonth() === today.getMonth() &&
         d.getDate() === today.getDate();
}

/**
 * Convert hour to percentage position in timeline
 */
export function hourToPercent(hour, startHour, endHour) {
  const dayDuration = endHour - startHour;
  return ((hour - startHour) / dayDuration) * 100;
}

/**
 * Convert time entry to relative position/height for timeline
 */
export function timeToRelative(start, end, startHour, endHour) {
  const dayDuration = endHour - startHour;

  const startDate = new Date(start);
  const endDate = new Date(end);

  // If end is before day start, don't show
  if (endDate.getHours() < startHour) {
    return { top: 0, height: 0 };
  }

  // Clamp start to day start
  if (startDate.getHours() < startHour) {
    startDate.setHours(startHour, 0, 0, 0);
  }

  const startHours = startDate.getHours() + startDate.getMinutes() / MINS_IN_HOUR;
  const durationMs = endDate - startDate;
  const durationHours = durationMs / MS_IN_SECOND / SECS_IN_MINUTE / MINS_IN_HOUR;

  const topPercent = ((startHours - startHour) / dayDuration) * 100;
  const heightPercent = (durationHours / dayDuration) * 100;

  return {
    top: Math.max(0, topPercent),
    height: Math.max(0, heightPercent),
  };
}

/**
 * Generate UUID v4
 */
export function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
