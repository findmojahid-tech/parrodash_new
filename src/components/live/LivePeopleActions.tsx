import React, { useCallback, useEffect, useState, type FormEvent } from 'react';
import { CalendarCheck, Clock3, RefreshCw, ShieldCheck } from 'lucide-react';
import { getSupabaseClient } from '../../services/supabaseClient';

type Attendance={id:string; user_id:string; clock_in:string; clock_out:string|null; notes:string|null};
type Leave={id:string;user_id:string;kind:string;start_date:string;end_date:string;reason:string;status:string;created_at:string};
const shell='rounded-xl border border-[#303034] bg-[#171719]';
const field='min-h-10 w-full rounded-md border border-[#44444b] bg-[#101012] px-3 py-2 text-xs text-white';
export function LivePeopleActions({userId,mode}:{userId:string;mode:'attendance'|'leave'}) {
  const client=getSupabaseClient();
  const [attendance,setAttendance]=useState<Attendance[]>([]);
  const [leaves,setLeaves]=useState<Leave[]>([]);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [message,setMessage]=useState('');
  const [kind,setKind]=useState('annual');
  const [start,setStart]=useState('');
  const [end,setEnd]=useState('');
  const [reason,setReason]=useState('');
  const refresh=useCallback(async()=>{
    if(!client)return;
    setLoading(true);setError('');
    try{
      const {data:who,error:authError}=await client.auth.getUser();
      if(authError||who.user?.id!==userId)throw new Error('Your session is no longer valid.');
      if(mode==='attendance'){
        const {data,error:issue}=await client.from('attendance').select('id,user_id,clock_in,clock_out,notes').eq('user_id',userId).order('clock_in',{ascending:false}).limit(150);
        if(issue)throw issue;setAttendance(data||[]);
      }else{
        const {data,error:issue}=await client.from('leave_requests').select('id,user_id,kind,start_date,end_date,reason,status,created_at').eq('user_id',userId).order('created_at',{ascending:false}).limit(150);
        if(issue)throw issue;setLeaves(data||[]);
      }
    }catch(cause){setError(cause instanceof Error?cause.message:'Cannot load records.');}
    finally{setLoading(false);}
  },[client,mode,userId]);
  useEffect(()=>{void refresh()},[refresh]);
  const openShift=attendance.find(s=>!s.clock_out);
  async function clock(){
    if(!client)return;
    setBusy(true);setError('');setMessage('');
    try{
      const {data:who,error:authError}=await client.auth.getUser();
      if(authError||who.user?.id!==userId)throw new Error('Session expired.');
      const {error:issue}=await client.rpc(openShift?'clock_out_now':'clock_in_now');
      if(issue)throw issue;
      await refresh();
      setMessage(openShift?'Clock out recorded in Supabase.':'Clock in recorded in Supabase.');
    }catch(cause){setError(cause instanceof Error?cause.message:'Unable to record attendance.');}
    finally{setBusy(false);}
  }
  async function requestLeave(event:FormEvent){
    event.preventDefault();
    if(!client||!reason.trim()||!start||!end)return;
    if(start>end){setError('End date cannot be earlier than the start date.');return;}
    setBusy(true);setError('');setMessage('');
    try{
      const {data:who,error:authError}=await client.auth.getUser();
      if(authError||who.user?.id!==userId)throw new Error('Session expired.');
      const {error:issue}=await client.from('leave_requests').insert({
        user_id:userId,kind,start_date:start,end_date:end,reason:reason.trim(),status:'pending'
      });
      if(issue)throw issue;
      setReason('');setStart('');setEnd('');
      await refresh();setMessage('Leave request submitted. Approval is required.');
    }catch(cause){setError(cause instanceof Error?cause.message:'Unable to submit leave request.');}
    finally{setBusy(false);}
  }
  return <div className="h-full w-full overflow-y-auto bg-[#0D0D0F] text-white">
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-7 sm:px-7">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#777780]"><ShieldCheck className="h-3.5 w-3.5"/> Authorized Supabase workspace</p>
        <h1 className="mt-2 text-2xl font-semibold">{mode==='attendance'?'Attendance':'Leave management'}</h1>
        <p className="mt-2 text-xs text-[#A0A0A8]">{mode==='attendance'?'Clock-in / clock-out records for your signed-in account.':'Submit leave applications and track management decisions.'}</p></div>
        <button aria-label="Refresh records" onClick={()=>void refresh()} disabled={loading} className="inline-flex items-center gap-2 rounded border border-[#44444b] px-3 py-2 text-xs disabled:opacity-50"><RefreshCw className="h-4 w-4"/> Refresh</button>
      </header>
      {error&&<p role="alert" className="rounded border border-rose-900 p-3 text-xs text-rose-200">{error}</p>}
      {message&&<p role="status" className="rounded border border-[#44444b] p-3 text-xs">{message}</p>}
      {mode==='attendance'?<>
        <section className={shell+' flex flex-wrap items-center justify-between gap-4 p-5'}>
          <div><p className="text-xs text-[#A0A0A8]">Your current shift</p><p className="mt-2 flex items-center gap-2 text-lg font-semibold"><Clock3 className="h-5 w-5"/>{openShift?'Clocked in':'Not clocked in'}</p>
          {openShift&&<p className="mt-1 text-xs text-[#777780]">Started {new Date(openShift.clock_in).toLocaleString()}</p>}</div>
          <button disabled={busy||loading} onClick={()=>void clock()} className="rounded-md bg-white px-4 py-2.5 text-xs font-semibold text-black disabled:opacity-50">{busy?'Saving...':openShift?'Clock out':'Clock in'}</button>
        </section>
        <section className={shell+' overflow-hidden'}><div className="border-b border-[#303034] p-4 text-sm font-semibold">Attendance history</div>
          <div className="divide-y divide-[#303034]">{attendance.map(a=><div key={a.id} className="grid gap-2 p-4 text-xs sm:grid-cols-3"><span>In: {new Date(a.clock_in).toLocaleString()}</span><span className="text-[#A0A0A8]">Out: {a.clock_out?new Date(a.clock_out).toLocaleString():'Active'}</span><span className="truncate text-[#777780]">{a.notes||'—'}</span></div>)}{!attendance.length&&!loading&&<p className="p-4 text-xs text-[#777780]">No attendance entries yet.</p>}</div>
        </section>
      </>:<>
        <form onSubmit={requestLeave} className={shell+' space-y-4 p-5'}>
          <h2 className="flex items-center gap-2 text-sm font-semibold"><CalendarCheck className="h-4 w-4"/> Request leave</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block space-y-1 text-xs text-[#A0A0A8]">Type<select className={field} value={kind} onChange={e=>setKind(e.target.value)}><option value="annual">Annual</option><option value="sick">Sick</option><option value="emergency">Emergency</option><option value="unpaid">Unpaid</option></select></label>
            <label className="block space-y-1 text-xs text-[#A0A0A8]">From<input required type="date" className={field} value={start} onChange={e=>setStart(e.target.value)}/></label>
            <label className="block space-y-1 text-xs text-[#A0A0A8]">To<input required type="date" className={field} value={end} onChange={e=>setEnd(e.target.value)}/></label>
          </div>
          <label className="block space-y-1 text-xs text-[#A0A0A8]">Reason<textarea required rows={3} maxLength={1500} className={field} value={reason} onChange={e=>setReason(e.target.value)}/></label>
          <button disabled={busy||loading} className="rounded-md bg-white px-4 py-2.5 text-xs font-semibold text-black disabled:opacity-50">{busy?'Submitting...':'Submit leave request'}</button>
        </form>
        <section className={shell+' overflow-hidden'}><div className="border-b border-[#303034] p-4 text-sm font-semibold">My leave requests</div>
        <div className="divide-y divide-[#303034]">{leaves.map(l=><div key={l.id} className="flex flex-wrap items-center justify-between gap-2 p-4"><div className="text-xs"><p className="font-semibold">{l.kind} leave</p><p className="mt-1 text-[#777780]">{l.start_date} — {l.end_date}</p><p className="mt-1 text-[#A0A0A8]">{l.reason}</p></div><span className="rounded border border-[#44444b] px-2 py-1 text-xs capitalize">{l.status}</span></div>)}{!leaves.length&&!loading&&<p className="p-4 text-xs text-[#777780]">No leave applications yet.</p>}</div>
        </section>
      </>}
    </div>
  </div>;
}
