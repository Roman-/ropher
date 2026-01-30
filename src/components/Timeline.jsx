import { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import {
  DAY_START_HOUR,
  DAY_END_HOUR,
  MIN_TIME_TO_TRACK,
} from '../utils/constants';
import { timeToRelative, hourToPercent } from '../utils/dateUtils';

export function Timeline() {
  const { getTodaysEntries } = useApp();
  const [showFullDay, setShowFullDay] = useState(false);
  const [now, setNow] = useState(new Date());

  const startHour = showFullDay ? 0 : DAY_START_HOUR;
  const endHour = showFullDay ? 24 : DAY_END_HOUR;

  // Update current time marker
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const entries = getTodaysEntries();

  // Generate hour lines
  const hourLines = [];
  for (let hour = startHour + 1; hour < endHour; hour++) {
    const topPercent = hourToPercent(hour, startHour, endHour);
    hourLines.push(
      <div
        key={`line-${hour}`}
        className="hour-line"
        style={{ top: `${topPercent}%` }}
      />,
      <div
        key={`digit-${hour}`}
        className="hour-digit"
        style={{ top: `${topPercent}%` }}
      >
        {hour}
      </div>
    );
  }

  // Calculate now line position
  const nowHour = now.getHours() + now.getMinutes() / 60;
  const nowPercent = hourToPercent(nowHour, startHour, endHour);
  const showNowLine = nowPercent >= 0 && nowPercent <= 100;

  return (
    <div
      className="timeline-container"
      onClick={() => setShowFullDay(!showFullDay)}
    >
      {hourLines}

      {/* Entry rectangles */}
      {entries.map((entry) => {
        if (entry.ms < MIN_TIME_TO_TRACK) return null;

        const pos = timeToRelative(entry.start, entry.end, startHour, endHour);
        if (pos.height <= 0) return null;

        return (
          <div
            key={entry.id}
            className="entry-rect"
            style={{
              top: `${pos.top}%`,
              height: `${pos.height}%`,
              backgroundColor: `#${entry.task?.color || '666'}55`,
            }}
          />
        );
      })}

      {/* Now line */}
      {showNowLine && (
        <div
          className="now-line"
          style={{ top: `${nowPercent}%` }}
        />
      )}
    </div>
  );
}

export default Timeline;
