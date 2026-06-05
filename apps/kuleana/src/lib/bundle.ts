import type { AppState } from '../types';

export interface StoredBundle {
  state: AppState;
  updatedAt: string;
}

export function createBundle(state: AppState, updatedAt = new Date().toISOString()): StoredBundle {
  return { state, updatedAt };
}

export function countClaimHistory(state: AppState): number {
  const past = state.pastWeeks.reduce((total, week) => total + week.claims.length, 0);
  return state.currentWeek.claims.length + past;
}

export function pickNewerBundle(a: StoredBundle | null, b: StoredBundle | null): StoredBundle | null {
  if (!a) return b;
  if (!b) return a;
  return Date.parse(a.updatedAt) >= Date.parse(b.updatedAt) ? a : b;
}

/** Prefer bundles that still have claim history when one side was wiped. */
export function pickBestBundle(a: StoredBundle | null, b: StoredBundle | null): StoredBundle | null {
  if (!a) return b;
  if (!b) return a;

  const aClaims = countClaimHistory(a.state);
  const bClaims = countClaimHistory(b.state);

  if (aClaims > 0 && bClaims === 0) return a;
  if (bClaims > 0 && aClaims === 0) return b;

  return pickNewerBundle(a, b);
}
