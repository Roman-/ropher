import { useApp } from '../contexts/AppContext';

export function TaskBar() {
  const { tasks, selectTask } = useApp();

  return (
    <div className="task-bar">
      {tasks.map((task) => (
        <button
          key={task.id}
          className="task-button"
          onClick={() => selectTask(task)}
          style={{
            backgroundColor: `#${task.color}22`,
            borderColor: `#${task.color}`,
          }}
        >
          {task.name}
        </button>
      ))}
    </div>
  );
}

export default TaskBar;
