import { useApp } from '../contexts/AppContext';
import { ScopeEditorItem } from './ScopeEditorItem';
import { PinnedGoalsEditor } from './PinnedGoalsEditor';
import { SCOPE_LIMITS } from '../utils/constants';

export function SettingsView() {
  const { scopes, addScope, resetScopes, setView } = useApp();

  const canAddScope = scopes.length < SCOPE_LIMITS.MAX;

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
