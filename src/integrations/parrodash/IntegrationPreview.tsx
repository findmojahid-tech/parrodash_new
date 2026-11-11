import React, { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getParroDashClient, isParroDashConfigured } from './client';
import { parroDashAuth } from './auth';

type Profile = { id: string; full_name: string | null; role: string; active: boolean; registration_status: string | null };
type Project = { id: string; name: string; status: string | null; description: string | null };
type Task = { id: string; title: string; status: string; priority: string | null; project_id: string | null; due_date: string | null };

function SignIn({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setNotice(''); setBusy(true);
    try {
      await parroDashAuth.signIn(email.trim(), password);
      onSuccess();
    } catch (err) { setError(err instanceof Error ? err.message : 'Sign in failed'); }
    finally { setBusy(false); }
  }
  async function reset() {
    setError(''); setNotice('');
    if (!email.trim()) { setError('Enter your email address first.'); return; }
    const origin = window.location.origin;
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      setError('Password recovery requires an approved public deployment URL.'); return;
    }
    setBusy(true);
    try {
      await parroDashAuth.resetPassword(email.trim(), origin + '/integration-preview');
      setNotice('If the address is registered, a recovery email will be sent.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Recovery request failed'); }
    finally { setBusy(false); }
  }
  return <div className="min-h-screen bg-[#0f1115] text-slate-100 flex items-center justify-center p-5">
    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#171a20] p-8 shadow-xl">
      <div className="text-xs tracking-[.22em] uppercase text-slate-400 mb-4">Oarkie · Integration preview</div>
      <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
      <p className="text-sm text-slate-400 mt-2 mb-7">Sign in with your existing ParroDash account.</p>
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm text-slate-300">Email<input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-2 w-full rounded-lg bg-[#101217] border border-white/15 p-3 text-white outline-none focus:border-white/60"/></label>
        <label className="block text-sm text-slate-300">Password<input required type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 w-full rounded-lg bg-[#101217] border border-white/15 p-3 text-white outline-none focus:border-white/60"/></label>
        {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
        {notice && <p role="status" className="text-sm text-slate-300">{notice}</p>}
        <button disabled={busy} type="submit" className="w-full rounded-lg bg-white text-black font-semibold p-3 hover:bg-slate-200 disabled:opacity-50">{busy?'Signing in...':'Sign in'}</button>
      </form>
      <button type="button" disabled={busy} onClick={reset} className="mt-5 text-sm text-slate-400 hover:text-white">Forgot password?</button>
    </div>
  </div>;
}

export function ParroDashIntegrationPreview() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!isParroDashConfigured()) { setLoading(false); return; }
    let alive = true;
    parroDashAuth.getSession().then(s => { if (alive) setSession(s); })
      .catch(e => { if (alive) setError(e.message); })
      .finally(() => { if (alive) setLoading(false); });
    const subscription = parroDashAuth.onAuthStateChange((_event, s) => { if (alive) setSession(s); });
    return () => { alive = false; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!session?.user.id) { setProfile(null); setProjects([]); setTasks([]); return; }
    let alive = true;
    setLoading(true); setError('');
    const db = getParroDashClient();
    (async () => {
      const p = await db.from('profiles').select('id,full_name,role,active,registration_status').eq('id', session.user.id).maybeSingle();
      if (p.error) throw p.error;
      if (!p.data || p.data.active !== true || (p.data.registration_status && p.data.registration_status !== 'approved')) {
        if (alive) setProfile(p.data ?? null);
        return;
      }
      const [pr, ts] = await Promise.all([
        db.from('projects').select('id,name,status,description').order('created_at', {ascending:false}).limit(100),
        db.from('tasks').select('id,title,status,priority,project_id,due_date').order('created_at', {ascending:false}).limit(200),
      ]);
      if (pr.error) throw pr.error;
      if (ts.error) throw ts.error;
      if (alive) { setProfile(p.data); setProjects(pr.data || []); setTasks(ts.data || []); }
    })().catch(e => { if(alive) setError(e.message || 'Unable to load workspace'); })
      .finally(() => { if(alive) setLoading(false); });
    return () => { alive = false; };
  }, [session?.user.id, reloadKey]);

  if (!isParroDashConfigured()) return <main className="min-h-screen bg-[#0f1115] text-white p-10"><h1 className="text-2xl font-semibold">Oarkie integration setup needed</h1><p className="mt-4 text-slate-400">Configure the existing ParroDash Supabase URL and public anon key in Vercel environment settings. The design preview remains available at /.</p></main>;
  if (loading) return <main role="status" className="min-h-screen bg-[#0f1115] text-slate-200 p-10">Loading secure workspace…</main>;
  if (!session) return <SignIn onSuccess={()=>setReloadKey(v=>v+1)}/>;
  const approved = profile?.active === true && (!profile.registration_status || profile.registration_status === 'approved');
  return <main className="min-h-screen bg-[#0f1115] text-white">
    <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between gap-4">
      <div><div className="text-xl font-bold">Oarkie</div><div className="text-xs text-slate-400">Connected workspace · read-only integration preview</div></div>
      <button onClick={()=>parroDashAuth.signOut().catch(e=>setError(e.message))} className="border border-white/20 rounded-lg py-2 px-3 text-sm hover:bg-white/10">Sign out</button>
    </header>
    <section className="max-w-6xl mx-auto p-6 space-y-6">
      {error && <div role="alert" className="rounded-lg border border-red-500/40 p-4 text-red-300">{error}<button onClick={()=>setReloadKey(v=>v+1)} className="ml-4 underline">Retry</button></div>}
      {!approved ? <div className="border border-white/10 rounded-xl p-6"><h1 className="text-xl font-semibold">Access pending</h1><p className="text-slate-400 mt-2">Your account must be active and approved in ParroDash before opening company data.</p></div> : <>
        <div><h1 className="text-2xl font-semibold">Welcome, {profile?.full_name || session.user.email}</h1><p className="text-slate-400 mt-1">Projects and tasks from existing ParroDash Supabase, subject to its RLS policies.</p></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="border border-white/10 bg-[#171a20] rounded-xl p-5"><div className="text-sm text-slate-400">Visible projects</div><div className="text-3xl font-semibold mt-2">{projects.length}</div></div>
          <div className="border border-white/10 bg-[#171a20] rounded-xl p-5"><div className="text-sm text-slate-400">Visible tasks</div><div className="text-3xl font-semibold mt-2">{tasks.length}</div></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <section className="border border-white/10 bg-[#171a20] rounded-xl p-5"><h2 className="font-semibold mb-4">Projects</h2>{projects.length?projects.map(p=><div key={p.id} className="border-t border-white/10 py-3"><div className="font-medium">{p.name}</div><div className="text-xs text-slate-400">{p.status||'No status'}</div></div>):<p className="text-slate-400 text-sm">No projects available for your account.</p>}</section>
          <section className="border border-white/10 bg-[#171a20] rounded-xl p-5"><h2 className="font-semibold mb-4">Tasks</h2>{tasks.length?tasks.map(t=><div key={t.id} className="border-t border-white/10 py-3"><div className="font-medium">{t.title}</div><div className="text-xs text-slate-400">{t.status} · {t.priority||'Normal'}{t.due_date?' · '+t.due_date:''}</div></div>):<p className="text-slate-400 text-sm">No tasks available for your account.</p>}</section>
        </div>
      </>}
    </section>
  </main>;
}
