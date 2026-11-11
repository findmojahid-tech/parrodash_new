import { useCallback, useEffect, useState } from 'react';
import { Copy, Link2, RotateCcw, ShieldCheck, X } from 'lucide-react';
import { getSupabaseClient } from '../../services/supabaseClient';

type EmployeeLink = { id: string; label: string; created_at: string; expires_at: string; revoked_at: string | null };
type ManagerRole = 'founder' | 'cofounder' | 'ceo' | 'hr';

/** Optional management widget. All actions are independently authorized by the Edge Function. */
export function EmployeeInviteManager({ userId }: { userId: string }) {
  const client = getSupabaseClient();
  const [authorized, setAuthorized] = useState(false);
  const [opened, setOpened] = useState(false);
  const [links, setLinks] = useState<EmployeeLink[]>([]);
  const [freshUrl, setFreshUrl] = useState('');
  const [label, setLabel] = useState('TPARRO employee registration');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!client) return;
    let mounted = true;
    client.from('profiles').select('role,active,registration_status,onboarded_at').eq('id', userId).maybeSingle()
      .then(({data, error}) => {
        const roles: ManagerRole[] = ['founder', 'cofounder', 'ceo', 'hr'];
        if (mounted) setAuthorized(!error && !!data && roles.includes(data.role as ManagerRole) &&
          data.active === true && data.registration_status === 'approved' && !!data.onboarded_at);
      }).catch(() => { if (mounted) setAuthorized(false); });
    return () => { mounted = false; };
  }, [client, userId]);

  const invoke = useCallback(async (action: string, additional: Record<string, unknown> = {}) => {
    if (!client) throw new Error('Employee registration is not configured.');
    const { data: auth, error: authError } = await client.auth.getUser();
    if (authError || auth.user?.id !== userId) throw new Error('Session expired. Sign in again.');
    const { data, error } = await client.functions.invoke('employee-join', {
      body: { action, ...additional },
    });
    if (error || data?.error || !data?.ok) throw new Error(data?.error || error?.message || 'Employee invitation service is unavailable.');
    return data;
  }, [client, userId]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await invoke('list');
      setLinks(Array.isArray(data.links) ? data.links : []);
      setMessage('');
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Unable to load invitations.');
    } finally { setLoading(false); }
  }, [invoke]);

  if (!authorized) return null;

  async function generate() {
    setLoading(true);
    setFreshUrl('');
    setMessage('');
    try {
      const data = await invoke('create', { label: label.trim() });
      // The existing Edge Function creates links for the original portal.
      // Preserve the signed token in the URL, but route it to THIS staging app.
      const legacy = new URL(String(data.url));
      const token = new URLSearchParams(legacy.hash.slice(1)).get('pd_join');
      if (!token || !/^[a-f0-9]{64}$/.test(token)) throw new Error('Signup link format not supported in this application.');
      const local = new URL(window.location.pathname, window.location.origin);
      local.hash = 'pd_join=' + token;
      setFreshUrl(local.toString());
      setMessage('Link created. Copy it now; the raw token is not stored here. Registration requires this staging origin to be allowed by the Edge Function.');
      await refresh();
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : 'Unable to create link.'); }
    finally { setLoading(false); }
  }

  async function revoke(id: string) {
    if (!window.confirm('Revoke this employee signup link? Existing pending applications are unaffected.')) return;
    setLoading(true); setFreshUrl('');
    try {
      await invoke('revoke', { id });
      await refresh();
      setMessage('Link revoked. New registrations using it are no longer accepted.');
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : 'Unable to revoke link.'); }
    finally { setLoading(false); }
  }

  return (
    <>
      <button type="button" title="Manage employee invitations" onClick={() => { setOpened(true); void refresh(); }}
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-[#17191e] px-3 py-2.5 text-xs font-medium text-slate-100 shadow-xl hover:bg-[#23252c] focus-visible:outline-2 focus-visible:outline-white">
        <Link2 className="w-4 h-4" /> Employee Invites
      </button>
      {opened && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3" onMouseDown={event => { if (event.target === event.currentTarget) setOpened(false); }}>
        <section role="dialog" aria-modal="true" aria-label="Employee invitations" className="flex max-h-[90dvh] w-full max-w-xl flex-col gap-4 overflow-y-auto rounded-xl border border-slate-700 bg-[#17191e] p-5 text-slate-100 shadow-2xl">
          <div className="flex items-center justify-between gap-3">
            <div><h2 className="text-lg font-semibold">Employee invitations</h2><p className="text-xs text-slate-400">One link can be reused until revoked or expired. Approval is required.</p></div>
            <button aria-label="Close invitations" onClick={() => setOpened(false)} className="rounded-md p-2 hover:bg-white/10"><X className="h-4 w-4" /></button>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <label className="min-w-0 flex-1 text-xs text-slate-300">Link label<input value={label} maxLength={100} onChange={e => setLabel(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-600 bg-[#0f1115] px-3 py-2 text-sm" /></label>
            <button disabled={loading || !label.trim()} onClick={()=>void generate()} className="rounded-md bg-white px-3 py-2 text-xs font-semibold text-black disabled:opacity-50">Generate link</button>
            <button aria-label="Refresh invitations" title="Refresh invitations" disabled={loading} onClick={()=>void refresh()} className="rounded-md border border-slate-600 p-2"><RotateCcw className="h-4 w-4" /></button>
          </div>
          {freshUrl && <div className="space-y-2 rounded-md border border-slate-600 p-3">
            <p className="text-xs text-slate-300">Copy this unique link before closing:</p>
            <input readOnly aria-label="New employee join link" value={freshUrl} className="w-full min-w-0 rounded-md bg-[#0f1115] px-2 py-2 text-xs text-slate-200" />
            <button className="inline-flex items-center gap-2 rounded-md border border-slate-600 px-3 py-2 text-xs" onClick={()=>{void navigator.clipboard.writeText(freshUrl).then(()=>setMessage('Link copied.')).catch(()=>setMessage('Clipboard unavailable. Select the link above to copy it.'));}}><Copy className="h-3.5 w-3.5" /> Copy link</button>
          </div>}
          {message && <p role="status" className="text-xs text-amber-200">{message}</p>}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Created links</h3>
            {loading && <p className="text-xs text-slate-400">Loading...</p>}
            {!loading && links.length === 0 && <p className="text-xs text-slate-400">No links available.</p>}
            {links.map(link => {
              const active = !link.revoked_at && Date.parse(link.expires_at) > Date.now();
              return <div key={link.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-700/80 bg-[#111318] p-3">
                <div className="min-w-0"><div className="truncate text-sm font-medium">{link.label}</div><div className="mt-1 flex items-center gap-2 text-xs text-slate-400"><ShieldCheck className="h-3.5 w-3.5" /> {active ? 'Active' : link.revoked_at ? 'Revoked' : 'Expired'} · Expires {new Date(link.expires_at).toLocaleDateString()}</div></div>
                {active && <button disabled={loading} onClick={()=>void revoke(link.id)} className="rounded-md border border-slate-600 px-3 py-1.5 text-xs hover:bg-white/10">Revoke</button>}
              </div>;
            })}
          </div>
        </section>
      </div>}
    </>
  );
}
