import { Clock } from './Clock';
import { ScopeBar } from './ScopeBar';
import { Timeline } from './Timeline';
import { TimeSummary } from './TimeSummary';
import { QuoteDisplay } from './QuoteDisplay';
import { SettingsMenu } from './SettingsMenu';

export function MainLayout() {
  return (
    <div className="main-layout">
      <div className="main-content">
        {/* Left column - timeline and summary */}
        <div className="left-column">
          <Timeline />
          <TimeSummary />
        </div>

        {/* Center column - scope buttons and clock */}
        <div className="center-column">
          <ScopeBar />
          <Clock />
        </div>

        {/* Right column - settings */}
        <div className="right-column">
          <SettingsMenu />
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
