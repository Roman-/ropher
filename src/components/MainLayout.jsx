import { Clock } from './Clock';
import { TaskBar } from './TaskBar';
import { Timeline } from './Timeline';
import { TimeSummary } from './TimeSummary';
import { QuoteDisplay } from './QuoteDisplay';

export function MainLayout() {
  return (
    <div className="main-layout">
      <div className="main-content">
        {/* Left column - empty for now, can add weekday/jotdowns later */}
        <div className="left-column">
          {/* Placeholder */}
        </div>

        {/* Center column - task buttons and clock */}
        <div className="center-column">
          <TaskBar />
          <Clock />
        </div>

        {/* Right column - timeline and summary */}
        <div className="right-column">
          <Timeline />
          <TimeSummary />
        </div>
      </div>

      {/* Bottom status bar with quotes */}
      <div className="status-bar">
        <QuoteDisplay />
      </div>
    </div>
  );
}

export default MainLayout;
