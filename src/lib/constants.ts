// Shared constants for time slots - used by both client hooks and server API routes

export const TIME_SLOTS = [
  { index: 1, label: '12:00 PM', hour: 12 },
  { index: 2, label: '02:00 PM', hour: 14 },
  { index: 3, label: '04:00 PM', hour: 16 },
  { index: 4, label: '06:00 PM', hour: 18 },
  { index: 5, label: '08:00 PM', hour: 20 },
  { index: 6, label: '10:00 PM', hour: 22 },
] as const;

export type TimeSlotIndex = 1 | 2 | 3 | 4 | 5 | 6;

export const SLOT_KEYS = [
  { index: 1, key: 'slot1' },
  { index: 2, key: 'slot2' },
  { index: 3, key: 'slot3' },
  { index: 4, key: 'slot4' },
  { index: 5, key: 'slot5' },
  { index: 6, key: 'slot6' },
] as const;

export const MONTH_NAMES: Record<number, string> = {
  1: 'January',
  2: 'February',
  3: 'March',
  4: 'April',
  5: 'May',
  6: 'June',
  7: 'July',
  8: 'August',
  9: 'September',
  10: 'October',
  11: 'November',
  12: 'December',
};
