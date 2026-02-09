import { useState, useRef, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { PINNED_GOALS_COUNT } from '../utils/constants';

export function PinnedGoalsEditor({ scope }) {
  const { settings, updatePinnedGoals } = useApp();
  const pinned = (settings.pinnedGoals || {})[scope.id] || [];
  const [editingIndex, setEditingIndex] = useState(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (editingIndex !== null && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingIndex]);

  const handleClick = (index) => {
    setEditValue(pinned[index] || '');
    setEditingIndex(index);
  };

  const handleSave = () => {
    if (editingIndex === null) return;
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== pinned[editingIndex]) {
      const updated = [...pinned];
      updated[editingIndex] = trimmed;
      updatePinnedGoals(scope.id, updated);
    }
    setEditingIndex(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditingIndex(null);
    }
  };

  // Ensure we always show PINNED_GOALS_COUNT slots
  const slots = Array.from({ length: PINNED_GOALS_COUNT }, (_, i) => pinned[i] || '');

  return (
    <div className="pinned-goals-editor">
      <div className="pinned-goals-scope-name" style={{ color: `#${scope.color}` }}>
        {scope.name}
      </div>
      <div className="pinned-goals-list">
        {slots.map((goal, i) => (
          <div key={i}>
            {editingIndex === i ? (
              <input
                ref={inputRef}
                type="text"
                className="pinned-goal-input"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
              />
            ) : (
              <div className="pinned-goal-text" onClick={() => handleClick(i)}>
                {goal || '(empty)'}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default PinnedGoalsEditor;
