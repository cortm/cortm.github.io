import type { AppState, Week } from '../types';
import { createSeedState } from '../data/seed';
import { createWeekId, getWeekBounds, toDateKey } from './week';
import { createBundle, pickNewerBundle, type StoredBundle } from './bundle';
import { isCloudSyncEnabled } from './supabaseClient';
import { loadRemoteBundle, saveRemoteBundle } from './cloudStorage';

const STORAGE_KEY = 'kuleana-app-state';
const BUNDLE_KEY = 'kuleana-app-bundle';
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

  const merged = pickNewerBundle(local, remote) ?? createBundle(createInitialState());
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
