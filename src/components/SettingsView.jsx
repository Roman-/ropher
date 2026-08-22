import { useEffect, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { ScopeEditorItem } from './ScopeEditorItem';
import { PinnedGoalsEditor } from './PinnedGoalsEditor';
import { ReminderEditorItem } from './ReminderEditorItem';
import { SCOPE_LIMITS, MAX_REMINDERS } from '../utils/constants';

export function SettingsView() {
  const {
    scopes,
    addScope,
    resetScopes,
    setView,
    reminders,
    addReminder,
    settingsFocus,
    clearSettingsFocus,
  } = useApp();

  const remindersRef = useRef(null);
  const highlightReminders = settingsFocus === 'reminders';

  // Scroll to the reminders section when opened from a reminder window,
  // then drop the focus so the highlight only plays once
  useEffect(() => {
    if (!highlightReminders) return;

    remindersRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const timer = setTimeout(() => clearSettingsFocus(), 1500);
    return () => clearTimeout(timer);
  }, [highlightReminders, clearSettingsFocus]);

  const canAddScope = scopes.length < SCOPE_LIMITS.MAX;
  const canAddReminder = reminders.length < MAX_REMINDERS;

  const handleBack = () => {
    setView('main');
  };

  return (
    <div className="settings-view">
      <div className="settings-header">
        <h1 className="settings-title">Settings</h1>
      </div>

      <div className="settings-content">
        <section className="settings-section">
          <h2 className="settings-section-title">Scopes</h2>
          <div className="scope-editor-list">
            {scopes.map((scope, index) => (
              <ScopeEditorItem
                key={scope.id}
                scope={scope}
                index={index}
                totalScopes={scopes.length}
              />
            ))}
          </div>
          <button
            className="scope-add-button"
            onClick={addScope}
            disabled={!canAddScope}
            title={canAddScope ? 'Add new scope' : `Maximum ${SCOPE_LIMITS.MAX} scopes allowed`}
          >
            + Add Scope
          </button>
        </section>

        <section className="settings-section">
          <h2 className="settings-section-title">Pinned Goals</h2>
          {scopes.map((scope) => (
            <PinnedGoalsEditor key={scope.id} scope={scope} />
          ))}
        </section>

        <section
          className={`settings-section ${highlightReminders ? 'highlight' : ''}`}
          ref={remindersRef}
        >
          <h2 className="settings-section-title">Reminders</h2>
          {reminders.length === 0 ? (
            <div className="reminders-empty">
              No reminders. A reminder pops up when you turn the display back on.
            </div>
          ) : (
            <div className="reminder-editor-list">
              {reminders.map((reminder) => (
                <ReminderEditorItem key={reminder.id} reminder={reminder} />
              ))}
            </div>
          )}
          <button
            className="scope-add-button"
            onClick={addReminder}
            disabled={!canAddReminder}
            title={canAddReminder ? 'Add new reminder' : `Maximum ${MAX_REMINDERS} reminders allowed`}
          >
            + Add Reminder
          </button>
        </section>
      </div>

      <div className="settings-footer">
        <button
          className="settings-footer-button settings-back-button"
          onClick={handleBack}
        >
          Back
        </button>
        <button
          className="settings-footer-button settings-reset-button"
          onClick={resetScopes}
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  );
}

export default SettingsView;
