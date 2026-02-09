import { useState, useRef, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { PINNED_GOALS_COUNT } from '../utils/constants';

export function GoalSetter() {
  const { selectedScope, startPomodoroWithGoal, cancelGoalSetter, getGoalsForScope } = useApp();
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

  if (!selectedScope) return null;

  const goals = getGoalsForScope(selectedScope.id);

  return (
    <div className="goal-setter">
      <h2 className="goal-title">
        Goal for this {selectedScope.name}
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

      <div className="goal-grid">
        {goals.map((g, i) => (
          <button
            key={`${i}-${g}`}
            className={`goal-grid-button ${i < PINNED_GOALS_COUNT ? 'pinned' : 'recent'}`}
            onClick={() => startPomodoroWithGoal(g)}
          >
            {g}
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
