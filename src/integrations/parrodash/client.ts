import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Uses the EXISTING ParroDash Supabase project. Never put a service-role key
 * in Vite variables: every VITE_ variable is publicly bundled for browsers.
 *
 * Deliberately lazy: the AI Studio design still renders without configuration.
 */
let browserClient: SupabaseClient | null = null;

export function getParroDashClient(): SupabaseClient {
  if (browserClient) return browserClient;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const publishableKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !publishableKey) {
    throw new Error('ParroDash integration is not configured: missing public Supabase URL or anon key');
  }
  browserClient = createClient(url, publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return browserClient;
}

export function isParroDashConfigured(): boolean {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
}
