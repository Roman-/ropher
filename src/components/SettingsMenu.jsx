import { useState, useEffect, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { CLOCK_SIZES } from '../utils/constants';

const SIZE_LABELS = ['S', 'M', 'L'];

export function SettingsMenu() {
  const {
    isFullscreen,
    toggleFullscreen,
    settings,
    setClockSizeIndex,
    setView,
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="settings-menu-container" ref={containerRef}>
      <button
        className="settings-button"
        onClick={() => setIsOpen(!isOpen)}
        title="Settings"
      >
        &#9881;
      </button>

      {isOpen && (
        <div className="settings-dropdown">
          {/* Fullscreen toggle */}
          <div className="settings-row">
            <span className="settings-label">Fullscreen</span>
            <div className="settings-toggle-group">
              <button
                className={`settings-toggle ${!isFullscreen ? 'active' : ''}`}
                onClick={toggleFullscreen}
              >
                OFF
              </button>
              <button
                className={`settings-toggle ${isFullscreen ? 'active' : ''}`}
                onClick={toggleFullscreen}
              >
                ON
              </button>
            </div>
          </div>

          {/* Clock size selector */}
          <div className="settings-row">
            <span className="settings-label">Clock Size</span>
            <div className="settings-size-group">
              {SIZE_LABELS.map((label, idx) => (
                <button
                  key={label}
                  className={`settings-size-button ${settings.clockSizeIndex === idx ? 'active' : ''}`}
                  onClick={() => setClockSizeIndex(idx)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Manage Scopes link */}
          <div
            className="settings-link"
            onClick={() => { setView('settings'); setIsOpen(false); }}
          >
            Settings →
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsMenu;
