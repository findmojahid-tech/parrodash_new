import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { getParroDashClient } from './client';

/**
 * Thin typed adapter over existing Supabase Auth identities.
 * Employee approval and company roles must be checked using existing
 * database/RLS rules; never infer authorization from email or local storage.
 */
export const parroDashAuth = {
  async getSession(): Promise<Session | null> {
    const { data, error } = await getParroDashClient().auth.getSession();
    if (error) throw error;
    return data.session;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await getParroDashClient().auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signUp(email: string, password: string) {
    const { data, error } = await getParroDashClient().auth.signUp({ email, password });
    if (error) throw error;
    return data;
  },

  async resetPassword(email: string, redirectTo: string) {
    const { error } = await getParroDashClient().auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
  },

  async signOut() {
    const { error } = await getParroDashClient().auth.signOut();
    if (error) throw error;
  },

  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    return getParroDashClient().auth.onAuthStateChange(callback).data.subscription;
  },
};
