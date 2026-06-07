import type { AppState, Week } from '../types';
import { getNextWeekRange } from './week';

function isEmptyFollowUpWeek(currentWeek: Week, closedWeek: Week): boolean {
  const nextWeek = getNextWeekRange(closedWeek.startDate, closedWeek.endDate);
  const isNextWeek =
    currentWeek.startDate === nextWeek.startDate &&
    currentWeek.endDate === nextWeek.endDate;
  const isLegacySameWeek =
    currentWeek.startDate === closedWeek.startDate &&
    currentWeek.endDate === closedWeek.endDate;

  return isNextWeek || isLegacySameWeek;
}

/** Closed week shown on the board after close-out while the new week is still empty. */
export function findReopenableWeek(state: AppState): Week | null {
  if (state.currentWeek.claims.length > 0) return null;

  const lastClosed = state.pastWeeks[0];
  if (!lastClosed?.closed || lastClosed.claims.length === 0) return null;
  if (!isEmptyFollowUpWeek(state.currentWeek, lastClosed)) return null;

  return lastClosed;
}

export function canRestoreWeek(week: Week, state: AppState): boolean {
  const reopenable = findReopenableWeek(state);
  return reopenable?.id === week.id;
}
