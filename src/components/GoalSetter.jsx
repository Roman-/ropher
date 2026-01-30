import { useState, useRef, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { DEFAULT_GOALS } from '../utils/constants';

export function GoalSetter() {
  const { selectedTask, settings, startPomodoroWithGoal, cancelGoalSetter } = useApp();
  const [goal, setGoal] = useState('');
  const inputRef = useRef(null);

  // Focus input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = () => {
    if (goal.trim()) {
      startPomodoroWithGoal(goal.trim());
    } else {
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  // Build goal hints - include last goal if different from defaults
  const goalHints = [...DEFAULT_GOALS];
  if (settings.lastGoal && !DEFAULT_GOALS.includes(settings.lastGoal)) {
    goalHints.unshift(settings.lastGoal);
  }

  if (!selectedTask) return null;

  return (
    <div className="goal-setter">
      <h2 className="goal-title">
        Intention for this {selectedTask.name}
      </h2>

      <input
        ref={inputRef}
        type="text"
        className="goal-input"
        placeholder="Enter your goal..."
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        onKeyPress={handleKeyPress}
      />

      <div className="goal-hints">
        {goalHints.map((hint, i) => (
          <button
            key={i}
            className="goal-hint-button"
            onClick={() => startPomodoroWithGoal(hint)}
          >
            {hint}
          </button>
        ))}
      </div>

      <div className="goal-actions">
        <button
          className="goal-action-button goal-cancel"
          onClick={cancelGoalSetter}
        >
          back
        </button>
        <button
          className="goal-action-button goal-go"
          onClick={handleSubmit}
        >
          GO
        </button>
      </div>
    </div>
  );
}

export default GoalSetter;
