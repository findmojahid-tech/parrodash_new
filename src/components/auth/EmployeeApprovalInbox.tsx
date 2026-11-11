import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, ClipboardCheck, RefreshCcw, X } from 'lucide-react';
import { getSupabaseClient } from '../../services/supabaseClient';

type PendingApplicant = {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string | null;
  signup_method: string | null;
  registration_status: string | null;
};

const permittedRoles = new Set(['founder', 'cofounder', 'ceo', 'hr']);

/**
 * Employee registration approvals. The SQL RPC remains the source of truth for
 * authorization, review state, audit events, and notifications.
 */
export function EmployeeApprovalInbox({ userId }: { userId: string }) {
  const client = getSupabaseClient();
  const [authorized, setAuthorized] = useState(false);
  const [open, setOpen] = useState(false);
  const [applicants, setApplicants] = useState<PendingApplicant[]>([]);
  const [selected, setSelected] = useState<PendingApplicant | null>(null);
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!client) return;
    let active = true;
    (async () => {
      const { data, error } = await client.from('profiles')
        .select('role,active,registration_status,onboarded_at')
        .eq('id', userId).maybeSingle();
      if (active) setAuthorized(!error && !!data && permittedRoles.has(String(data.role)) &&
        data.active === true && data.registration_status === 'approved' && !!data.onboarded_at);
    })().catch(() => { if (active) setAuthorized(false); });
    return () => { active = false; };
  }, [client, userId]);

  const refresh = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    try {
      const { data: identity, error: identityError } = await client.auth.getUser();
      if (identityError || identity.user?.id !== userId) throw new Error('Your session is no longer valid.');
      const { data, error } = await client.from('profiles')
        .select('id,full_name,email,created_at,signup_method,registration_status')
        .eq('role', 'employee')
        .eq('signup_method', 'self')
        .eq('registration_status', 'pending')
        .eq('active', false)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw new Error('Cannot load pending registrations. Check staging RLS permissions.');
      setApplicants(data || []);
      setMessage('');
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Unable to load approvals.');
    } finally { setLoading(false); }
  }, [client, userId]);

  async function decide(approve: boolean) {
    if (!client || !selected || (approve && !verified)) return;
    if (!window.confirm(approve ? 'Confirm identity was verified outside ParroDash and approve this account?' : 'Reject this employee registration?')) return;
    setLoading(true); setMessage('');
    try {
      const { data: identity, error: identityError } = await client.auth.getUser();
      if (identityError || identity.user?.id !== userId) throw new Error('Session expired.');
      const { data, error } = await client.rpc('review_registration', {
        p_user_id: selected.id, p_approve: approve, p_verified_identity: approve && verified,
      });
      if (error || data !== (approve ? 'approved' : 'rejected')) {
        throw new Error(error?.message || 'Registration could not be reviewed.');
      }
      setSelected(null);
      setVerified(false);
      await refresh();
      setMessage(approve ? 'Registration approved and recorded.' : 'Registration rejected and recorded.');
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Review action failed.');
    } finally { setLoading(false); }
  }

  if (!authorized) return null;

  return <>
    <button type="button" onClick={() => { setOpen(true); void refresh(); }}
      className="fixed bottom-16 right-5 z-40 inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-[#17191e] px-3 py-2.5 text-xs font-medium text-slate-100 shadow-xl hover:bg-[#23252c] focus-visible:outline-2 focus-visible:outline-white">
      <ClipboardCheck className="h-4 w-4" /> Approval Inbox
    </button>
    {open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3"
      onMouseDown={event => { if (event.target === event.currentTarget) setOpen(false); }}>
      <section role="dialog" aria-modal="true" aria-label="Employee approval inbox"
        className="flex max-h-[90dvh] w-full max-w-xl flex-col gap-4 overflow-y-auto rounded-xl border border-slate-700 bg-[#17191e] p-5 text-slate-100 shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <div><h2 className="text-lg font-semibold">Employee approvals</h2>
            <p className="text-xs text-slate-400">Review pending registrations. Verify identity before approving access.</p></div>
          <button type="button" aria-label="Close approval inbox" onClick={() => setOpen(false)}
            className="rounded-md p-2 hover:bg-white/10"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">{applicants.length} pending registration{applicants.length === 1 ? '' : 's'}</span>
          <button type="button" disabled={loading} onClick={() => void refresh()}
            className="inline-flex items-center gap-2 rounded-md border border-slate-600 px-3 py-2 text-xs disabled:opacity-50">
            <RefreshCcw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
        {loading && <p role="status" className="text-xs text-slate-300">Updating approvals...</p>}
        {!loading && applicants.length === 0 && !message &&
          <p className="rounded-lg border border-slate-700 p-4 text-sm text-slate-400">No pending applications.</p>}
        <div className="space-y-2">
          {applicants.map(person => <div key={person.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-slate-700 bg-[#101115] p-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{person.full_name || 'Unnamed applicant'}</p>
              <p className="truncate text-xs text-slate-400">{person.email || 'Email unavailable'}</p>
            </div>
            <button type="button" onClick={() => { setSelected(person); setVerified(false); }}
              className="shrink-0 rounded-md border border-slate-500 px-3 py-2 text-xs hover:bg-white/10">Review</button>
          </div>)}
        </div>
        {selected && <div className="space-y-3 rounded-lg border border-slate-500 p-4">
          <div className="flex items-start justify-between gap-3">
            <div><h3 className="text-sm font-semibold">{selected.full_name || 'Employee registration'}</h3>
              <p className="text-xs text-slate-400">{selected.email || selected.id}</p></div>
            <button type="button" aria-label="Cancel review" onClick={() => { setSelected(null); setVerified(false); }}>
              <X className="h-4 w-4" /></button>
          </div>
          <p className="text-xs text-slate-400">Confirm employment identity using your organization's independent verification process. Email ownership alone does not prove employment.</p>
          <label className="flex items-start gap-2 text-xs text-slate-200">
            <input type="checkbox" className="mt-0.5" checked={verified} onChange={e => setVerified(e.target.checked)} />
            I verified the applicant's identity outside ParroDash and am authorized to approve them.
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={loading || !verified} onClick={() => void decide(true)}
              className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-xs font-semibold text-black disabled:opacity-40">
              <CheckCircle2 className="h-4 w-4" /> Approve
            </button>
            <button type="button" disabled={loading} onClick={() => void decide(false)}
              className="rounded-md border border-rose-500/50 px-3 py-2 text-xs text-rose-200 disabled:opacity-40">Reject</button>
          </div>
        </div>}
        {message && <p role="status" className="text-xs text-amber-200">{message}</p>}
      </section>
    </div>}
  </>;
}
