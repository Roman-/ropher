import { useApp } from '../contexts/AppContext';
import { msToHumanString } from '../utils/dateUtils';

export function TimeSummary() {
  const { scopes, getTimeSpentByScope } = useApp();
  const timeByScope = getTimeSpentByScope();

  return (
    <div className="time-summary">
      {scopes.map((scope) => (
        <div
          key={scope.id}
          className="time-summary-box"
          style={{ borderBottomColor: `#${scope.color}aa` }}
        >
          {timeByScope[scope.id] > 0
            ? msToHumanString(timeByScope[scope.id])
            : '0'}
        </div>
      ))}
    </div>
  );
}

export default TimeSummary;
