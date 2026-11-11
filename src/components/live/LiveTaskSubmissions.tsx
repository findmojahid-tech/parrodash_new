import React, { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ArrowUpRight, ClipboardCheck, RefreshCw, Send } from 'lucide-react';
import { getSupabaseClient } from '../../services/supabaseClient';

type TaskOption = { id: string; title: string; status: string };
type Submission = {
  id: string; task_id: string; submitted_by: string; work_url: string;
  message: string; status: string; review_note: string; created_at: string;
};
const field = 'w-full rounded-md border border-[#44444b] bg-[#101012] px-3 py-2.5 text-sm text-white outline-none focus:border-white';
function safeHttpUrl(input: string): string | null {
  try {
    const url = new URL(input);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch { return null; }
}

/** Existing ParroDash task submissions. All insert/read authorization is enforced by Supabase RLS. */
export function LiveTaskSubmissions({ userId }: { userId: string }) {
  const client = getSupabaseClient();
  const [tasks, setTasks] = useState<TaskOption[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [taskId, setTaskId] = useState('');
  const [workUrl, setWorkUrl] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reviewNote, setReviewNote] = useState<Record<string,string>>({});

  const load = useCallback(async () => {
    if (!client) return;
    setLoading(true); setError('');
    try {
      const { data: auth, error: authError } = await client.auth.getUser();
      if (authError || auth.user?.id !== userId) throw new Error('Your session has expired.');
      // RLS limits both datasets; the current user can only submit to their assignments.
      const [taskResult, assigneeResult, submissionResult] = await Promise.all([
        client.from('tasks').select('id,title,status,assigned_to').neq('status','done').limit(300),
        client.from('task_assignees').select('task_id').eq('user_id',userId).limit(300),
        client.from('task_submissions').select('id,task_id,submitted_by,work_url,message,status,review_note,created_at')
          .order('created_at',{ascending:false}).limit(100),
      ]);
      if (taskResult.error) throw taskResult.error;
      if (assigneeResult.error) throw assigneeResult.error;
      if (submissionResult.error) throw submissionResult.error;
      const assigned = new Set((assigneeResult.data || []).map(x => x.task_id));
      const mine = (taskResult.data || []).filter(t => t.assigned_to === userId || assigned.has(t.id));
      setTasks(mine.map(t=>({id:t.id,title:t.title,status:t.status})));
      setTaskId(current => mine.some(t => t.id === current) ? current : (mine[0]?.id ?? ''));
      setSubmissions(submissionResult.data || []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load submissions.');
    } finally { setLoading(false); }
  }, [client,userId]);

  useEffect(()=>{void load();},[load]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!client || busy) return;
    const normalizedUrl = safeHttpUrl(workUrl.trim());
    if (!normalizedUrl) { setError('Enter a valid http or https work link.'); return; }
    if (!tasks.some(t=>t.id===taskId)) { setError('Choose an assigned, unfinished task.'); return; }
    setBusy(true); setError(''); setSuccess('');
    try {
      const { data: auth, error: authError } = await client.auth.getUser();
      if (authError || auth.user?.id !== userId) throw new Error('Your session expired.');
      const { error: insertError } = await client.from('task_submissions').insert({
        task_id:taskId, submitted_by:userId, work_url:normalizedUrl,
        message:message.trim(), status:'submitted',
      });
      if (insertError) throw insertError;
      setWorkUrl(''); setMessage('');
      await load();
      setSuccess('Work submitted successfully for review.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to submit work.');
    } finally { setBusy(false); }
  }

  async function review(id: string, accept: boolean) {
    if (!client || busy) return;
    const note = (reviewNote[id] || '').trim();
    if (!accept && note.length < 3) { setError('Give a reason when requesting changes.'); return; }
    setBusy(true); setError(''); setSuccess('');
    try {
      const { data: auth, error: authError } = await client.auth.getUser();
      if (authError || auth.user?.id !== userId) throw new Error('Session expired.');
      // Original ParroDash SECURITY DEFINER RPC validates reviewer role,
      // state transition, task status, notifications and audit events.
      const {error: reviewError} = await client.rpc('review_work_submission', {
        p_submission_id:id, p_accept:accept, p_note:note,
      });
      if (reviewError) throw reviewError;
      await load();
      setSuccess(accept ? 'Submission approved.' : 'Changes requested from the assignee.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not review submission.');
    } finally { setBusy(false); }
  }

  return <div className="h-full w-full overflow-y-auto bg-[#0D0D0F] text-white">
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-7 sm:px-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="text-[10px] uppercase tracking-widest text-[#777780]">Authorized workspace · Supabase</p>
          <h1 className="mt-2 flex items-center gap-2 text-2xl font-semibold"><ClipboardCheck className="h-6 w-6"/> Task submissions</h1>
          <p className="mt-2 text-xs text-[#A0A0A8]">Submit your deliverable links and follow the original ParroDash review workflow.</p></div>
        <button type="button" onClick={()=>void load()} disabled={busy||loading} className="inline-flex items-center gap-2 rounded border border-[#44444b] px-3 py-2 text-xs disabled:opacity-50"><RefreshCw className="h-4 w-4"/>Refresh</button>
      </div>
      {error && <div role="alert" className="rounded border border-rose-900 bg-[#211315] p-3 text-xs text-rose-200">{error}</div>}
      {success && <div role="status" className="rounded border border-[#44444b] bg-[#171719] p-3 text-xs">{success}</div>}
      <form onSubmit={submit} className="space-y-4 rounded-xl border border-[#303034] bg-[#171719] p-5">
        <h2 className="text-sm font-semibold">Submit a deliverable</h2>
        <label className="block space-y-2 text-xs text-[#A0A0A8]">Assigned task
          <select required value={taskId} onChange={e=>setTaskId(e.target.value)} className={field} disabled={loading||!tasks.length}>
            {!tasks.length && <option value="">No assigned unfinished tasks</option>}
            {tasks.map(t=><option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        </label>
        <label className="block space-y-2 text-xs text-[#A0A0A8]">Work link
          <input required type="url" maxLength={2000} value={workUrl} onChange={e=>setWorkUrl(e.target.value)}
            placeholder="https://drive.google.com/..." className={field}/>
        </label>
        <label className="block space-y-2 text-xs text-[#A0A0A8]">Submission notes (optional)
          <textarea maxLength={2000} rows={3} value={message} onChange={e=>setMessage(e.target.value)}
            placeholder="What did you complete?" className={field}/>
        </label>
        <button type="submit" disabled={busy||loading||!tasks.length||!workUrl.trim()}
          className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2.5 text-xs font-semibold text-black disabled:opacity-50">
          <Send className="h-4 w-4"/>{busy?'Submitting...':'Submit for review'}
        </button>
      </form>
      <section className="overflow-hidden rounded-xl border border-[#303034] bg-[#171719]">
        <div className="border-b border-[#303034] p-4 text-sm font-semibold">Submission history</div>
        {submissions.map(s=><div key={s.id} className="flex flex-wrap items-start justify-between gap-3 border-b border-[#303034] p-4 text-xs">
          <div className="min-w-0 flex-1 space-y-1">
            <p className="font-medium">{tasks.find(t=>t.id===s.task_id)?.title || 'Task deliverable'}</p>
            <a href={safeHttpUrl(s.work_url)||'#'} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center gap-1 break-all text-white underline">{s.work_url}<ArrowUpRight className="h-3 w-3 shrink-0"/></a>
            {s.message&&<p className="whitespace-pre-wrap text-[#A0A0A8]">{s.message}</p>}
            {s.review_note&&<p className="text-[#A0A0A8]">Review: {s.review_note}</p>}
            {s.status==='submitted' && s.submitted_by!==userId && <div className="mt-3 flex flex-wrap items-center gap-2">
              <input aria-label="Review note" maxLength={2000} value={reviewNote[s.id]||''} onChange={e=>setReviewNote(p=>({...p,[s.id]:e.target.value}))} placeholder="Review note (required for changes)" className={field}/>
              <button type="button" disabled={busy} onClick={()=>void review(s.id,true)} className="rounded-md bg-white px-3 py-2 text-xs font-semibold text-black disabled:opacity-50">Approve</button>
              <button type="button" disabled={busy} onClick={()=>void review(s.id,false)} className="rounded-md border border-[#44444b] px-3 py-2 text-xs text-white disabled:opacity-50">Request changes</button>
            </div>}
            <p className="text-[10px] text-[#777780]">{new Date(s.created_at).toLocaleString()}</p>
          </div><span className="rounded border border-[#44444b] px-2 py-1 capitalize">{s.status.replaceAll('_',' ')}</span>
        </div>)}
        {!submissions.length && !loading && <p className="p-5 text-xs text-[#777780]">No submissions visible to your account.</p>}
        {loading && <p role="status" className="p-5 text-xs text-[#777780]">Loading...</p>}
      </section>
    </div>
  </div>;
}
