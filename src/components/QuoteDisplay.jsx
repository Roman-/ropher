import { useState, useEffect, useMemo } from 'react';
import { QUOTES } from '../utils/constants';

// Shuffle array using Fisher-Yates
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function QuoteDisplay() {
  const shuffledQuotes = useMemo(() => shuffle(QUOTES), []);
  const [index, setIndex] = useState(0);

  // Rotate quotes every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % shuffledQuotes.length);
    }, 30000);
    return () => clearInterval(interval);
  }, [shuffledQuotes.length]);

  return (
    <div className="quote-display">
      {shuffledQuotes[index]}
    </div>
  );
}

export default QuoteDisplay;
