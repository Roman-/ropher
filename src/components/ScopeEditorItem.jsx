import { useState, useRef, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { PRESET_COLORS, SCOPE_LIMITS } from '../utils/constants';

export function ScopeEditorItem({ scope, index, totalScopes }) {
  const { updateScope, removeScope, reorderScopes } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(scope.name);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const inputRef = useRef(null);
  const colorPickerRef = useRef(null);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Close color picker when clicking outside
  useEffect(() => {
    if (!showColorPicker) return;

    const handleClickOutside = (e) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target)) {
        setShowColorPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showColorPicker]);

  const handleNameClick = () => {
    setEditName(scope.name);
    setIsEditing(true);
  };

  const handleNameBlur = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== scope.name) {
      updateScope(scope.id, { name: trimmed });
    } else {
      setEditName(scope.name);
    }
    setIsEditing(false);
  };

  const handleNameKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleNameBlur();
    } else if (e.key === 'Escape') {
      setEditName(scope.name);
      setIsEditing(false);
    }
  };

  const handleColorSelect = (color) => {
    updateScope(scope.id, { color });
    setShowColorPicker(false);
  };

  const handleMoveUp = () => {
    if (index > 0) {
      reorderScopes(index, index - 1);
    }
  };

  const handleMoveDown = () => {
    if (index < totalScopes - 1) {
      reorderScopes(index, index + 1);
    }
  };

  const canDelete = totalScopes > SCOPE_LIMITS.MIN;

  return (
    <div className="scope-editor-item">
      <div className="scope-color-container" ref={colorPickerRef}>
        <button
          className="scope-color-button"
          style={{ backgroundColor: `#${scope.color}` }}
          onClick={() => setShowColorPicker(!showColorPicker)}
          title="Change color"
        />
        {showColorPicker && (
          <div className="scope-color-picker">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                className={`scope-color-swatch ${color === scope.color ? 'active' : ''}`}
                style={{ backgroundColor: `#${color}` }}
                onClick={() => handleColorSelect(color)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="scope-name-container">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            className="scope-name-input"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={handleNameKeyDown}
          />
        ) : (
          <span className="scope-name" onClick={handleNameClick}>
            {scope.name}
          </span>
        )}
      </div>

      <div className="scope-actions">
        <button
          className="scope-action-btn"
          onClick={handleMoveUp}
          disabled={index === 0}
          title="Move up"
        >
          ↑
        </button>
        <button
          className="scope-action-btn"
          onClick={handleMoveDown}
          disabled={index === totalScopes - 1}
          title="Move down"
        >
          ↓
        </button>
        <button
          className="scope-action-btn scope-delete-btn"
          onClick={() => removeScope(scope.id)}
          disabled={!canDelete}
          title={canDelete ? 'Delete scope' : `Minimum ${SCOPE_LIMITS.MIN} scopes required`}
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default ScopeEditorItem;
