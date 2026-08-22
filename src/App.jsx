import { AppProvider, useApp } from './contexts/AppContext';
import { MainLayout } from './components/MainLayout';
import { GoalSetter } from './components/GoalSetter';
import { PomodoroView } from './components/PomodoroView';
import { SettingsView } from './components/SettingsView';
import { ReminderOverlay } from './components/ReminderOverlay';
import './App.css';

function AppContent() {
  const { view } = useApp();

  return (
    <div id="app">
      {view === 'main' && <MainLayout />}
      {view === 'goalSetter' && <GoalSetter />}
      {view === 'pomodoro' && <PomodoroView />}
      {view === 'settings' && <SettingsView />}

      {/* Reminder window sits on top of every view */}
      <ReminderOverlay />
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
