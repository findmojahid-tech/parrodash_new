import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const authMode = import.meta.env.VITE_PARRO_AUTH_MODE === 'supabase' ? 'supabase' : 'demo';

let instance: SupabaseClient | null = null;

/** This client uses ONLY the browser-safe publishable key, never a service-role key. */
export function getSupabaseClient(): SupabaseClient | null {
  if (authMode !== 'supabase') return null;
  if (instance) return instance;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  instance = createClient(url, key, {
    auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
  });
  return instance;
}

export type MembershipState = 'approved' | 'pending' | 'blocked';

/**
 * Check application membership after authentication. This is ONLY a UI gate;
 * existing Supabase RLS must enforce all reads and writes independently.
 * Any database/query failure denies access rather than assuming approval.
 */
export async function getMembershipState(client: SupabaseClient, userId: string): Promise<MembershipState> {
  const { data, error } = await client
    .from('profiles')
    .select('id,active,onboarded_at,registration_status')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw new Error('Unable to verify workspace access. Please try again.');
  if (!data) return 'pending';
  if (data.registration_status === 'pending') return 'pending';
  if (data.registration_status === 'rejected' || data.active === false) return 'blocked';
  if (data.active === true && data.onboarded_at && data.registration_status === 'approved') return 'approved';
  return 'pending';
}
