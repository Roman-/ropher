import { AppProvider, useApp } from './contexts/AppContext';
import { MainLayout } from './components/MainLayout';
import { GoalSetter } from './components/GoalSetter';
import { PomodoroView } from './components/PomodoroView';
import { SettingsView } from './components/SettingsView';
import './App.css';

function AppContent() {
  const { view } = useApp();

  return (
    <div id="app">
      {view === 'main' && <MainLayout />}
      {view === 'goalSetter' && <GoalSetter />}
      {view === 'pomodoro' && <PomodoroView />}
      {view === 'settings' && <SettingsView />}
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
