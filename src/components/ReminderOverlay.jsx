import { useApp } from '../contexts/AppContext';

/**
 * Full screen reminder window, laid over the home screen whenever a pending
 * reminder is waiting there. Postpone puts it off until the next time the
 * home screen comes up; nothing is scheduled by the clock.
 */
export function ReminderOverlay() {
  const {
    activeReminder,
    completeReminder,
    postponeReminder,
    openReminderSettings,
  } = useApp();

  if (!activeReminder) return null;

  return (
    <div className="reminder-overlay">
      <div className="reminder-window">
        <div className="reminder-text">{activeReminder.text}</div>

        <div className="reminder-actions">
          <button
            className="reminder-button reminder-done"
            onClick={() => completeReminder(activeReminder.id)}
          >
            Done
          </button>
          <button
            className="reminder-button reminder-postpone"
            onClick={() => postponeReminder(activeReminder.id)}
          >
            Postpone
          </button>
        </div>

        <button
          className="reminder-settings-link"
          onClick={() => openReminderSettings(activeReminder.id)}
        >
          Settings...
        </button>
      </div>
    </div>
  );
}

export default ReminderOverlay;
