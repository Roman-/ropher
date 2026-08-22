import { useState, useRef, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { REMINDER_FREQUENCIES } from '../utils/constants';

export function ReminderEditorItem({ reminder }) {
  const { updateReminder, removeReminder, showReminderNow } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(reminder.text);
  const inputRef = useRef(null);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleTextClick = () => {
    setEditText(reminder.text);
    setIsEditing(true);
  };

  const handleTextBlur = () => {
    const trimmed = editText.trim();
    if (trimmed && trimmed !== reminder.text) {
      updateReminder(reminder.id, { text: trimmed });
    } else {
      setEditText(reminder.text);
    }
    setIsEditing(false);
  };

  const handleTextKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleTextBlur();
    } else if (e.key === 'Escape') {
      setEditText(reminder.text);
      setIsEditing(false);
    }
  };

  return (
    <div className="reminder-editor-item">
      <div className="reminder-editor-row">
        <button
          className={`reminder-enabled-toggle ${reminder.enabled ? 'active' : ''}`}
          onClick={() => updateReminder(reminder.id, { enabled: !reminder.enabled })}
        >
          {reminder.enabled ? 'ON' : 'OFF'}
        </button>

        <div className="reminder-text-container">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              className="reminder-text-input"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onBlur={handleTextBlur}
              onKeyDown={handleTextKeyDown}
            />
          ) : (
            <span className="reminder-editor-text" onClick={handleTextClick}>
              {reminder.text}
            </span>
          )}
        </div>
      </div>

      <div className="reminder-editor-row reminder-freq-row">
        <span className="reminder-freq-label">Show</span>
        {REMINDER_FREQUENCIES.map((freq) => (
          <button
            key={freq.id}
            className={`reminder-freq-button ${reminder.frequency === freq.id ? 'active' : ''}`}
            onClick={() => updateReminder(reminder.id, { frequency: freq.id })}
          >
            {freq.label}
          </button>
        ))}
      </div>

      <div className="reminder-editor-row reminder-editor-footer">
        <span className="reminder-editor-note">
          {reminder.postponed ? 'Postponed - shows when the pomodoro timer ends' : ''}
        </span>
        <button
          className="reminder-test-button"
          onClick={() => showReminderNow(reminder.id)}
        >
          Test
        </button>
        <button
          className="reminder-delete-button"
          onClick={() => removeReminder(reminder.id)}
        >
          Delete forever
        </button>
      </div>
    </div>
  );
}

export default ReminderEditorItem;
