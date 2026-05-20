/**
 * IST (Indian Standard Time) Date Utility
 *
 * ALL date calculations on this site MUST use IST (Asia/Calcutta, UTC+5:30).
 * The server runs in UTC, but the target audience is in India.
 * Without this, "today" will be wrong when IST is ahead of UTC.
 *
 * Usage:
 *   import { getISTDate, getISTDay, getISTMonth, getISTYear } from '@/lib/ist-date';
 *   const today = getISTDay();     // e.g., 21
 *   const month = getISTMonth();   // e.g., 5 (May)
 *   const year = getISTYear();     // e.g., 2025
 *   const date = getISTDate();     // full Date object in IST
 */

const IST_TZ = 'Asia/Calcutta';

/** Get a Date object representing the current IST date/time */
export function getISTDate(): Date {
  const now = new Date();
  // Convert to IST string then back to Date
  const istStr = now.toLocaleString('en-US', { timeZone: IST_TZ });
  return new Date(istStr);
}

/** Get current day (1-31) in IST */
export function getISTDay(): number {
  return getISTDate().getDate();
}

/** Get current month (1-12) in IST */
export function getISTMonth(): number {
  return getISTDate().getMonth() + 1;
}

/** Get current year in IST */
export function getISTYear(): number {
  return getISTDate().getFullYear();
}

/** Get current hour (0-23) in IST */
export function getISTHour(): number {
  return getISTDate().getHours();
}

/** Get formatted date string YYYY-MM-DD in IST */
export function getISTDateString(): string {
  const d = getISTDate();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${d.getFullYear()}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Client-side: Get IST date info using the browser's Intl API.
 * This avoids any server/client timezone mismatch.
 */
export function getClientISTDate(): { day: number; month: number; year: number; hour: number; minute: number; second: number } {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = { timeZone: IST_TZ };

  const day = parseInt(
    new Intl.DateTimeFormat('en-US', { ...options, day: 'numeric' }).format(now),
    10
  );
  const month = parseInt(
    new Intl.DateTimeFormat('en-US', { ...options, month: 'numeric' }).format(now),
    10
  );
  const year = parseInt(
    new Intl.DateTimeFormat('en-US', { ...options, year: 'numeric' }).format(now),
    10
  );
  const hour = parseInt(
    new Intl.DateTimeFormat('en-US', { ...options, hour: 'numeric', hour12: false }).format(now),
    10
  );
  const minute = parseInt(
    new Intl.DateTimeFormat('en-US', { ...options, minute: 'numeric' }).format(now),
    10
  );
  const second = parseInt(
    new Intl.DateTimeFormat('en-US', { ...options, second: 'numeric' }).format(now),
    10
  );

  return { day, month, year, hour, minute, second };
}

/** Get days in a given month/year */
export function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}
