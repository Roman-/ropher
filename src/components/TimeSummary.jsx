import { useApp } from '../contexts/AppContext';
import { msToHumanString } from '../utils/dateUtils';

export function TimeSummary() {
  const { tasks, getTimeSpentByTask } = useApp();
  const timeByTask = getTimeSpentByTask();

  return (
    <div className="time-summary">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="time-summary-box"
          style={{ borderBottomColor: `#${task.color}aa` }}
        >
          {timeByTask[task.id] > 0
            ? msToHumanString(timeByTask[task.id])
            : '0'}
        </div>
      ))}
    </div>
  );
}

export default TimeSummary;
