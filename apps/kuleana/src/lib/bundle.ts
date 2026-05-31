import type { AppState } from '../types';

export interface StoredBundle {
  state: AppState;
  updatedAt: string;
}

export function createBundle(state: AppState, updatedAt = new Date().toISOString()): StoredBundle {
  return { state, updatedAt };
}

export function pickNewerBundle(a: StoredBundle | null, b: StoredBundle | null): StoredBundle | null {
  if (!a) return b;
  if (!b) return a;
  return Date.parse(a.updatedAt) >= Date.parse(b.updatedAt) ? a : b;
}
