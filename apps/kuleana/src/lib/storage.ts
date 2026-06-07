import type { AppState, Week } from '../types';
import { backfillClaimMemberId, enrichFamilyPreviousNames } from './family';
import { buildGigSnapshotsForClaims } from './gigSnapshots';
import { createSeedState } from '../data/seed';
import {
  ACTIVE_WEEK_END,
  ACTIVE_WEEK_START,
  createWeekId,
  getActiveWeekBounds,
  getNextWeekRange,
} from './week';
import { createBundle, pickBestBundle, type StoredBundle } from './bundle';
import { isCloudSyncEnabled } from './supabaseClient';
import { loadRemoteBundle, saveRemoteBundle } from './cloudStorage';

const STORAGE_KEY = 'kuleana-app-state';
const BUNDLE_KEY = 'kuleana-app-bundle';
const LEGACY_STORAGE_KEY = 'kuliana-app-state';

function createCurrentWeek(claims: Week['claims'] = []): Week {
  const { start } = getActiveWeekBounds();
  return {
    id: createWeekId(start),
    startDate: ACTIVE_WEEK_START,
    endDate: ACTIVE_WEEK_END,
    closed: false,
    claims,
  };
}

export function createWeekAfterClosed(closedWeek: Week, claims: Week['claims'] = []): Week {
  const { startDate, endDate } = getNextWeekRange(closedWeek.startDate, closedWeek.endDate);
  const start = new Date(`${startDate}T12:00:00`);
  return {
    id: createWeekId(start),
    startDate,
    endDate,
    closed: false,
    claims,
  };
}

function normalizeCurrentWeek(state: AppState): AppState {
  const { currentWeek } = state;

  if (currentWeek.closed) {
    return {
      ...state,
      currentWeek: createCurrentWeek(currentWeek.claims),
    };
  }

  const lastClosed = state.pastWeeks[0];
  const isLegacyClosedOut =
    lastClosed?.closed &&
    currentWeek.claims.length === 0 &&
    currentWeek.startDate === lastClosed.startDate &&
    currentWeek.endDate === lastClosed.endDate;

  if (isLegacyClosedOut) {
    return {
      ...state,
      currentWeek: createWeekAfterClosed(lastClosed),
    };
  }

  return state;
}

function migrateWeekClaims(week: Week, state: AppState): Week {
  return {
    ...week,
    claims: week.claims.map((claim) => backfillClaimMemberId(claim, state.familyMembers)),
  };
}

function migrateWeek(week: Week, state: AppState): Week {
  const withClaims = migrateWeekClaims(week, state);
  if (withClaims.claims.length === 0) return withClaims;

  const fromGigs = buildGigSnapshotsForClaims(withClaims.claims, state.gigs);
  const gigSnapshots = { ...fromGigs, ...withClaims.gigSnapshots };

  if (Object.keys(gigSnapshots).length === 0) return withClaims;

  return { ...withClaims, gigSnapshots };
}

function normalizeState(state: AppState): AppState {
  const normalizedWeek = normalizeCurrentWeek(state);
  const weeklyGoal =
    typeof normalizedWeek.weeklyGoal === 'number' && Number.isFinite(normalizedWeek.weeklyGoal)
      ? Math.max(1, Math.round(normalizedWeek.weeklyGoal))
      : 10;

  const withGoal = {
    ...normalizedWeek,
    weeklyGoal,
  };

  const withAliases = enrichFamilyPreviousNames(withGoal);

  return {
    ...withAliases,
    currentWeek: migrateWeek(withAliases.currentWeek, withAliases),
    pastWeeks: withAliases.pastWeeks.map((week) => migrateWeek(week, withAliases)),
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

function parseAppState(raw: string): AppState | null {
  try {
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed.currentWeek || !parsed.gigs) return null;
    return parsed;
  } catch {
    return null;
  }
}

function loadLocalBundle(): StoredBundle | null {
  try {
    const bundleRaw = localStorage.getItem(BUNDLE_KEY);
    if (bundleRaw) {
      const bundle = JSON.parse(bundleRaw) as StoredBundle;
      if (bundle.state?.currentWeek && bundle.state?.gigs && bundle.updatedAt) {
        return bundle;
      }
    }

    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      raw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (raw) {
        localStorage.setItem(STORAGE_KEY, raw);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      }
    }
    if (!raw) return null;

    const state = parseAppState(raw);
    if (!state) return null;
    return createBundle(state);
  } catch {
    return null;
  }
}

function saveLocalBundle(bundle: StoredBundle): void {
  localStorage.setItem(BUNDLE_KEY, JSON.stringify(bundle));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bundle.state));
}

export async function loadPersistedBundle(): Promise<StoredBundle> {
  const local = loadLocalBundle();
  let remote: StoredBundle | null = null;

  if (isCloudSyncEnabled()) {
    try {
      remote = await loadRemoteBundle();
    } catch {
      remote = null;
    }
  }

  const picked = pickBestBundle(local, remote) ?? createBundle(createInitialState());
  const merged = createBundle(normalizeState(picked.state), picked.updatedAt);
  saveLocalBundle(merged);

  if (isCloudSyncEnabled() && remote === null && local !== null) {
    try {
      await saveRemoteBundle(merged);
    } catch {
      // local data still available
    }
  }

  return merged;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let pendingBundle: StoredBundle | null = null;

export function persistBundle(bundle: StoredBundle): void {
  saveLocalBundle(bundle);
  pendingBundle = bundle;

  if (!isCloudSyncEnabled()) return;

  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const toSave = pendingBundle;
    pendingBundle = null;
    if (!toSave) return;
    void saveRemoteBundle(toSave).catch(() => {
      // keep local copy; sync retries on next edit
    });
  }, 400);
}

export function resetState(): AppState {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(BUNDLE_KEY);
  localStorage.removeItem(LEGACY_STORAGE_KEY);
  return createInitialState();
}

export { createCurrentWeek };
