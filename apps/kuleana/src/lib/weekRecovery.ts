import type { AppState, Week } from '../types';

/** Week closed early for the same date range as the open board week. */
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
