import { AppProvider, useApp } from './contexts/AppContext';
import { MainLayout } from './components/MainLayout';
import { GoalSetter } from './components/GoalSetter';
import { PomodoroView } from './components/PomodoroView';
import './App.css';

function AppContent() {
  const { view } = useApp();

  return (
    <div id="app">
      {view === 'main' && <MainLayout />}
      {view === 'goalSetter' && <GoalSetter />}
      {view === 'pomodoro' && <PomodoroView />}
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
