import { useEffect, useState, type FormEvent } from 'react';
import { authMode, getSupabaseClient } from '../../services/supabaseClient';

type JoinState = 'checking' | 'ready' | 'invalid' | 'submitted' | 'unconfigured';

function getToken(): string | null {
  const hash = new URLSearchParams(window.location.hash.slice(1));
  const token = hash.get('pd_join');
  return token && /^[a-f0-9]{64}$/.test(token) ? token : null;
}

export function isEmployeeJoinRoute(): boolean {
  return new URLSearchParams(window.location.hash.slice(1)).has('pd_join');
}

/**
 * Public employee joining screen for the existing employee-join Edge Function.
 * The Edge Function MUST explicitly allow this staging origin before activation.
 * Tokens are only passed in the HTTPS function request body, never query strings.
 */
export function EmployeeJoin() {
  const client = getSupabaseClient();
  const token = getToken();
  const [state, setState] = useState<JoinState>(client && token ? 'checking' : client ? 'invalid' : 'unconfigured');
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!client || !token) return;
    let active = true;
    client.functions.invoke('employee-join', { body: { action: 'check', token } })
      .then(({ data, error }) => {
        if (!active) return;
        if (error || data?.error || !data?.ok) {
          setState('invalid');
          setMessage('This joining link is unavailable, expired, or not enabled for this domain.');
        } else setState('ready');
      })
      .catch(() => {
        if (active) { setState('invalid'); setMessage('Unable to verify this joining link.'); }
      });
    return () => { active = false; };
  }, [client, token]);

  async function register(event: FormEvent) {
    event.preventDefault();
    if (!client || !token || state !== 'ready') return;
    if (name.trim().length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
        password.length < 10 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      setMessage('Enter your full name, valid email, and a 10+ character password containing letters and numbers.');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      const { data, error } = await client.functions.invoke('employee-join', {
        body: { action: 'register', token, name: name.trim(), email: email.trim(), password },
      });
      if (error || data?.error || !data?.ok || !data?.pending) {
        throw new Error(data?.error || error?.message || 'Unable to register. Please contact HR.');
      }
      setPassword('');
      setState('submitted');
      // Remove the one-time invite from browser history after successful registration.
      window.history.replaceState(null, '', window.location.pathname);
      setMessage('Registration received. Founder/HR approval is required before workspace access.');
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Registration is unavailable.');
    } finally {
      setBusy(false);
    }
  }

  const inputClass = 'w-full min-h-11 rounded-lg bg-[#101115] border border-slate-600 px-3 py-2.5 text-slate-100 outline-offset-2 focus-visible:outline-2 focus-visible:outline-white';
  return (
    <main className="min-h-screen bg-[#0f1115] text-slate-100 flex items-center justify-center p-4">
      <section className="w-full max-w-md bg-[#17191e] border border-slate-700/60 rounded-xl p-7 space-y-5">
        <header className="space-y-2">
          <div className="text-xs uppercase tracking-widest text-slate-400">ParroDash · Employees</div>
          <h1 className="text-2xl font-semibold">Join the workspace</h1>
          <p className="text-sm text-slate-400">Register using your team's invitation. Workspace access is granted only after Founder/HR approval.</p>
        </header>
        {state === 'unconfigured' && <p role="alert" className="text-sm text-amber-200">Employee registration is not enabled in this development environment. The approved UI remains in demo mode until staging Supabase settings are configured.</p>}
        {state === 'checking' && <p role="status" className="text-sm text-slate-300">Checking your invitation...</p>}
        {state === 'invalid' && <p role="alert" className="text-sm text-amber-200">{message || 'Invalid employee joining link.'}</p>}
        {state === 'ready' && (
          <form onSubmit={register} className="space-y-4">
            <label className="block space-y-1.5"><span className="text-xs text-slate-300">Full name</span><input className={inputClass} autoComplete="name" maxLength={90} required value={name} onChange={e => setName(e.target.value)} /></label>
            <label className="block space-y-1.5"><span className="text-xs text-slate-300">Work email</span><input className={inputClass} type="email" autoComplete="email" maxLength={254} required value={email} onChange={e => setEmail(e.target.value)} /></label>
            <label className="block space-y-1.5"><span className="text-xs text-slate-300">Password</span><input className={inputClass} type="password" autoComplete="new-password" minLength={10} maxLength={72} required value={password} onChange={e => setPassword(e.target.value)} /><span className="text-xs text-slate-500">10+ characters, including a letter and a number</span></label>
            <button type="submit" disabled={busy} className="w-full min-h-11 rounded-lg bg-white text-black font-semibold disabled:opacity-50">{busy ? 'Registering...' : 'Request employee access'}</button>
          </form>
        )}
        {state === 'submitted' && <p role="status" className="text-sm text-slate-100">{message}</p>}
        {state === 'ready' && message && <p role="alert" className="text-sm text-amber-200">{message}</p>}
        <a href={window.location.pathname} className="inline-block text-xs underline text-slate-300 hover:text-white">Back to sign in</a>
      </section>
    </main>
  );
}
