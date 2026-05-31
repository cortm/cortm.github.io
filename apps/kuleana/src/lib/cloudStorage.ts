import type { StoredBundle } from './bundle';
import { getHouseholdId, getSupabase } from './supabaseClient';

interface HouseholdRow {
  household_id: string;
  state: StoredBundle['state'];
  updated_at: string;
}

export async function loadRemoteBundle(): Promise<StoredBundle | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('household_states')
    .select('state, updated_at')
    .eq('household_id', getHouseholdId())
    .maybeSingle();

  if (error || !data) return null;

  const row = data as Pick<HouseholdRow, 'state' | 'updated_at'>;
  if (!row.state?.currentWeek || !row.state?.gigs) return null;

  return {
    state: row.state,
    updatedAt: row.updated_at,
  };
}

export async function saveRemoteBundle(bundle: StoredBundle): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const { error } = await supabase.from('household_states').upsert(
    {
      household_id: getHouseholdId(),
      state: bundle.state,
      updated_at: bundle.updatedAt,
    },
    { onConflict: 'household_id' },
  );

  if (error) throw error;
}
