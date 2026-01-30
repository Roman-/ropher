import { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { getCurrentHHMM } from '../utils/dateUtils';

export function Clock() {
  const { cycleClockSize, getClockSize } = useApp();
  const [time, setTime] = useState(getCurrentHHMM());

  // Update clock every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getCurrentHHMM());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const fontSize = `${getClockSize()}vw`;

  return (
    <div
      className="clock"
      onClick={cycleClockSize}
      style={{ fontSize }}
    >
      {time}
    </div>
  );
}

export default Clock;
