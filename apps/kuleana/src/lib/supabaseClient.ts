import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null | undefined;

export function isCloudSyncEnabled(): boolean {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
}

export function getHouseholdId(): string {
  return import.meta.env.VITE_HOUSEHOLD_ID?.trim() || 'kuleana';
}

export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;

  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    client = null;
    return null;
  }

  client = createClient(url, key);
  return client;
}
