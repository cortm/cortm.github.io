import type { AppState, Week } from '../types';
import { createSeedState } from '../data/seed';
import { createWeekId, getWeekBounds, toDateKey } from './week';

const STORAGE_KEY = 'kuleana-app-state';
const LEGACY_STORAGE_KEY = 'kuliana-app-state';

function createCurrentWeek(): Week {
  const { start, end } = getWeekBounds();
  return {
    id: createWeekId(start),
    startDate: toDateKey(start),
    endDate: toDateKey(end),
    closed: false,
    claims: [],
  };
}

export function createInitialState(): AppState {
  const seed = createSeedState();
  return {
    ...seed,
    currentWeek: createCurrentWeek(),
    pastWeeks: [],
  };
}

export function loadState(): AppState {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      raw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (raw) {
        localStorage.setItem(STORAGE_KEY, raw);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      }
    }
    if (!raw) return createInitialState();

    const parsed = JSON.parse(raw) as AppState;
    if (!parsed.currentWeek || !parsed.gigs) return createInitialState();

    return parsed;
  } catch {
    return createInitialState();
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetState(): AppState {
  localStorage.removeItem(STORAGE_KEY);
  return createInitialState();
}

export { createCurrentWeek };
