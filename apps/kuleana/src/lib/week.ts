/** Active household week shown on the board (Mon–Sun). */
export const ACTIVE_WEEK_START = '2026-06-01';
export const ACTIVE_WEEK_END = '2026-06-07';

export function getWeekBounds(date = new Date()): { start: Date; end: Date } {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const start = new Date(d);
  start.setDate(d.getDate() + diffToMonday);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return { start, end };
}

export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function createWeekId(start: Date): string {
  return `week-${toDateKey(start)}`;
}

export function getActiveWeekBounds(): { start: Date; end: Date } {
  return {
    start: new Date(`${ACTIVE_WEEK_START}T12:00:00`),
    end: new Date(`${ACTIVE_WEEK_END}T12:00:00`),
  };
}

export function formatWeekRange(startDate: string, endDate: string): string {
  const start = new Date(startDate + 'T12:00:00');
  const end = new Date(endDate + 'T12:00:00');

  const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = end.toLocaleDateString('en-US', { month: 'short' });

  if (startMonth === endMonth) {
    return `Week of ${startMonth} ${start.getDate()}–${end.getDate()}`;
  }

  return `Week of ${startMonth} ${start.getDate()} – ${endMonth} ${end.getDate()}`;
}

/** Compact range for inline copy, e.g. "Jun 1-7". */
export function formatWeekDatesInline(startDate: string, endDate: string): string {
  const start = new Date(startDate + 'T12:00:00');
  const end = new Date(endDate + 'T12:00:00');

  const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = end.toLocaleDateString('en-US', { month: 'short' });

  if (startMonth === endMonth) {
    return `${startMonth} ${start.getDate()}-${end.getDate()}`;
  }

  return `${startMonth} ${start.getDate()} – ${endMonth} ${end.getDate()}`;
}

export function dateKeyPlusDays(dateKey: string, days: number): string {
  const date = new Date(dateKey + 'T12:00:00');
  date.setDate(date.getDate() + days);
  return toLocalDateKey(date);
}

export function getNextWeekRange(
  startDate: string,
  endDate: string,
): { startDate: string; endDate: string } {
  void startDate;
  const nextStart = dateKeyPlusDays(endDate, 1);
  return {
    startDate: nextStart,
    endDate: dateKeyPlusDays(nextStart, 6),
  };
}

export function toLocalDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Close out is allowed on the Sunday that ends the active board week. */
export function canCloseOutWeekOnDate(weekEndDate: string, date = new Date()): boolean {
  return toLocalDateKey(date) === weekEndDate;
}

export function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
