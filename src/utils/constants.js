// Time constants
export const MS_IN_SECOND = 1000;
export const SECS_IN_MINUTE = 60;
export const MINS_IN_HOUR = 60;
export const MS_IN_MINUTE = SECS_IN_MINUTE * MS_IN_SECOND;

// Pomodoro settings
export const POMODORO_INTERVALS = [5, 15, 30, 35, 45]; // minutes
export const DEFAULT_INTERVAL_INDEX = 4; // 45 min
export const MIN_TIME_TO_TRACK = 60 * MS_IN_SECOND; // 1 minute minimum
export const UPDATE_TIMER_INTERVAL = 100; // ms for timer updates
export const DING_MIN_PAUSE_MS = 5 * MS_IN_SECOND; // 5 seconds between dings

// Timeline settings
export const DAY_START_HOUR = 8;
export const DAY_END_HOUR = 24;

// Clock font sizes (vw units)
export const CLOCK_SIZES = [32, 48, 64]; // normal, large, huge

// Tasks (hardcoded - no backend)
export const TASKS = [
  { id: 1, name: 'Work', color: '4a90d9' },
  { id: 2, name: 'PMD', color: '7cb342' },
];

// Default goals for goal setter
export const DEFAULT_GOALS = ['≈', 'Clear main', 'Define goal'];

// Motivational quotes (hardcoded)
export const QUOTES = [
  'The secret of getting ahead is getting started.',
  'Focus on being productive instead of busy.',
  'Do the hard jobs first. The easy jobs will take care of themselves.',
  'Action is the foundational key to all success.',
  'Either you run the day or the day runs you.',
  'The way to get started is to quit talking and begin doing.',
  'Don\'t watch the clock; do what it does. Keep going.',
  'Productivity is never an accident.',
  'Start where you are. Use what you have. Do what you can.',
  'The only way to do great work is to love what you do.',
  'Time is what we want most, but what we use worst.',
  'Your future is created by what you do today.',
  'Small daily improvements lead to stunning results.',
  'Work hard in silence, let your success be your noise.',
  'Dreams don\'t work unless you do.',
];

// localStorage keys
export const STORAGE_KEYS = {
  ENTRIES: 'ropher_entries',
  SETTINGS: 'ropher_settings',
  POMODORO: 'ropher_pomodoro',
};
