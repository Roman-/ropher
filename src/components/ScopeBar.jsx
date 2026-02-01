import { useApp } from '../contexts/AppContext';

export function ScopeBar() {
  const { scopes, selectScope } = useApp();

  return (
    <div className="scope-bar">
      {scopes.map((scope) => (
        <button
          key={scope.id}
          className="scope-button"
          onClick={() => selectScope(scope)}
          style={{
            backgroundColor: `#${scope.color}22`,
            borderColor: `#${scope.color}`,
          }}
        >
          {scope.name}
        </button>
      ))}
    </div>
  );
}

export default ScopeBar;
