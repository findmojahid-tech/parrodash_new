import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { authMode, getMembershipState, getSupabaseClient, type MembershipState } from '../../services/supabaseClient';

type Status = 'loading' | 'signed_out' | 'password_recovery' | MembershipState | 'configuration_error';

export function AuthGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>(() => authMode === 'demo' ? 'approved' : 'loading');
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<'login' | 'recovery'>('login');
  const [newPassword, setNewPassword] = useState('');
  const latestCheck = useRef(0);
  const recoveryActive = useRef(false);

  const client = getSupabaseClient();

  const verify = useCallback(async (current: User | null) => {
    const request = ++latestCheck.current;
    setUser(current);
    if (!current || !client) {
      recoveryActive.current = false;
      setStatus(client ? 'signed_out' : 'configuration_error');
      return;
    }
    if (recoveryActive.current) { setStatus('password_recovery'); return; }
    setStatus('loading');
    try {
      const membership = await getMembershipState(client, current.id);
      if (request !== latestCheck.current || recoveryActive.current) return;
      setStatus(membership);
      setError('');
    } catch (cause) {
      if (request !== latestCheck.current || recoveryActive.current) return;
      setStatus('blocked');
      setError(cause instanceof Error ? cause.message : 'Access verification failed.');
    }
  }, [client]);

  useEffect(() => {

  if (authMode === 'demo') return;
    if (!client) { setStatus('configuration_error'); return; }
    let active = true;
    client.auth.getUser().then(({ data, error: authError }) => {
      if (!active) return;
      if (authError) { void verify(null); return; }
      void verify(data.user);
    }).catch(() => { if (active) void verify(null); });
    const { data: listener } = client.auth.onAuthStateChange((event, session) => {
      // Keep the recovery screen active until the password is explicitly updated.
      if (event === 'PASSWORD_RECOVERY') {
        recoveryActive.current = true;
        ++latestCheck.current;
        setUser(session?.user ?? null);
        setStatus('password_recovery');
        return;
      }
      // Avoid database operations inside the auth callback.
      Promise.resolve().then(() => { if (active) void verify(session?.user ?? null); });
    });
    const recheck = () => {
      if (!recoveryActive.current) {
        void client.auth.getUser().then(({data}) => { if (active) void verify(data.user); })
          .catch(() => { if (active) void verify(null); });
      }
    };
    window.addEventListener('focus', recheck);
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') recheck();
    }, 60000);
    return () => {
      active = false;
      ++latestCheck.current;
      listener.subscription.unsubscribe();
      window.removeEventListener('focus', recheck);
      window.clearInterval(timer);
    };
  }, [client, verify]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!client) return;
    setBusy(true);
    setError('');
    try {
      if (view === 'recovery') {
        const redirectTo = new URL(window.location.pathname, window.location.origin).toString();
        const { error: issue } = await client.auth.resetPasswordForEmail(email, { redirectTo });
        if (issue) throw issue;
        setError('If the address is registered, a recovery email has been sent.');
      } else {
        const { error: issue } = await client.auth.signInWithPassword({ email, password });
        if (issue) throw issue;
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The request failed.');
    } finally {
      setBusy(false);
    }
  }

  async function updatePassword(event: FormEvent) {
    event.preventDefault();
    if (!client || newPassword.length < 10 || !/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setError('Use at least 10 characters, including a letter and a number.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const { error: updateError } = await client.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;
      recoveryActive.current = false;
      setNewPassword('');
      window.history.replaceState(null, '', window.location.pathname);
      const { data, error: authError } = await client.auth.getUser();
      if (authError) throw authError;
      await verify(data.user);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to reset password.');
    } finally {
      setBusy(false);
    }
  }


  if (authMode === 'demo') return <>{children}</>;
  if (status === 'approved') return <>{children}</>;

  return (
    <main className="min-h-screen bg-[#0f1115] text-slate-100 flex items-center justify-center p-4">
      <section className="w-full max-w-md bg-[#17191e] border border-slate-700/60 rounded-xl p-7 space-y-5" aria-live="polite">
        <div className="space-y-1">
          <div className="text-xs uppercase tracking-widest text-slate-400">ParroDash Workspace</div>
          <h1 className="text-2xl font-semibold">{status === 'signed_out' ? (view === 'login' ? 'Sign in' : 'Reset password') : status === 'password_recovery' ? 'Create a new password' : 'Workspace access'}</h1>
        </div>
        {status === 'loading' && <p className="text-slate-400">Checking your session and workspace approval...</p>}
        {status === 'configuration_error' && <p role="alert" className="text-amber-300">Supabase mode is enabled, but the public project URL or publishable key is missing. No demo access is granted in this mode.</p>}
        {status === 'pending' && <p className="text-slate-300">Your account is waiting for Founder or HR approval. You cannot access workspace data yet.</p>}
        {status === 'blocked' && <p className="text-slate-300">Workspace access is not available for this account. Contact an administrator.</p>}
        {status === 'password_recovery' && (
          <form onSubmit={updatePassword} className="space-y-4">
            <p className="text-sm text-slate-300">Choose a new password to complete account recovery.</p>
            <label className="block space-y-1.5"><span className="text-xs text-slate-300">New password</span><input type="password" autoComplete="new-password" minLength={10} required value={newPassword} onChange={event => setNewPassword(event.target.value)} className="w-full bg-[#101115] border border-slate-600 rounded-lg px-3 py-2.5" /></label>
            <button disabled={busy} type="submit" className="w-full bg-white text-black font-semibold rounded-lg px-3 py-2.5 disabled:opacity-50">{busy ? 'Updating...' : 'Update password'}</button>
          </form>
        )}
        {status === 'signed_out' && (
          <form onSubmit={submit} className="space-y-4">
            <label className="block space-y-1.5"><span className="text-xs text-slate-300">Email</span><input className="w-full bg-[#101115] border border-slate-600 rounded-lg px-3 py-2.5" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} /></label>
            {view === 'login' && <label className="block space-y-1.5"><span className="text-xs text-slate-300">Password</span><input className="w-full bg-[#101115] border border-slate-600 rounded-lg px-3 py-2.5" type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} /></label>}
            <button disabled={busy} type="submit" className="w-full bg-white text-black font-semibold rounded-lg px-3 py-2.5 disabled:opacity-50">{busy ? 'Working...' : view === 'login' ? 'Sign in' : 'Email reset link'}</button>
            <button type="button" onClick={()=>{setError('');setView(view === 'login' ? 'recovery' : 'login')}} className="text-xs text-slate-300 underline">{view === 'login' ? 'Forgot password?' : 'Back to sign in'}</button>
          </form>
        )}
        {error && <p role="status" className="text-xs text-amber-200">{error}</p>}
        {client && status !== 'signed_out' && status !== 'loading' && <button className="border border-slate-600 rounded-lg px-3 py-2 text-xs" onClick={()=>void client.auth.signOut()}>Sign out</button>}
        {status === 'pending' && <button className="border border-slate-600 rounded-lg px-3 py-2 text-xs" onClick={()=>void verify(user)}>Check approval again</button>}
      </section>
    </main>
  );
}
