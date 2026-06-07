import type { AppState, Week } from '../types';

/** Most recent closed week that matches the open board week and can be restored. */
export function findReopenableWeek(state: AppState): Week | null {
  if (state.currentWeek.claims.length > 0) return null;

  const lastClosed = state.pastWeeks[0];
  if (!lastClosed?.closed || lastClosed.claims.length === 0) return null;
  if (
    lastClosed.startDate !== state.currentWeek.startDate ||
    lastClosed.endDate !== state.currentWeek.endDate
  ) {
    return null;
  }

  return lastClosed;
}

export function canRestoreWeek(week: Week, state: AppState): boolean {
  const reopenable = findReopenableWeek(state);
  return reopenable?.id === week.id;
}
