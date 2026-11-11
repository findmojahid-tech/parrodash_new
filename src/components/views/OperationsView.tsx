import React, { useCallback, useEffect, useState } from 'react';
import { BriefcaseBusiness, CalendarClock, RefreshCw, ShieldCheck, UserRoundCheck, Users } from 'lucide-react';
import { authMode, getSupabaseClient } from '../../services/supabaseClient';
import { DemoCrmView } from './DemoCrmView';
import { TEAM_MEMBERS } from '../../data/initialData';

type Profile = { id: string; full_name: string | null; role: string; department: string | null; title: string | null; email: string | null; active: boolean };
type Client = { id: string; name: string; contact_email: string | null; stage: string; notes: string | null };
type Deal = { id: string; title: string; stage: string; amount: number | null; currency: string | null; client_id: string };
type Leave = { id: string; user_id: string; start_date: string; end_date: string; status: string; kind: string };
type Attendance = { id: string; user_id: string; clock_in: string; clock_out: string | null };
type Props = { module: 'people' | 'crm' };

const panel = 'rounded-xl border border-[#303034] bg-[#171719]';
const fmt = (v: number, currency: string) => new Intl.NumberFormat('en', { style:'currency', currency: ['BDT','USD','EUR','GBP'].includes(currency) ? currency : 'BDT', maximumFractionDigits: 0 }).format(v);

export const OperationsView: React.FC<Props> = ({ module }) => {
  const client = getSupabaseClient();
  const demo = authMode === 'demo';
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!client) return;
    setLoading(true); setError('');
    try {
      const {error: identityError, data: identity} = await client.auth.getUser();
      if (identityError || !identity.user) throw new Error('Sign in again to view workspace information.');
      if (module === 'people') {
        const [a,b,c] = await Promise.all([
          client.from('profiles').select('id,full_name,role,department,title,email,active').limit(150),
          client.from('leave_requests').select('id,user_id,start_date,end_date,status,kind').order('created_at', {ascending:false}).limit(80),
          client.from('attendance').select('id,user_id,clock_in,clock_out').order('clock_in', {ascending:false}).limit(80),
        ]);
        if (a.error || b.error || c.error) throw new Error('Your role cannot access some People records. Review staging RLS.');
        setProfiles(a.data || []); setLeaves(b.data || []); setAttendance(c.data || []);
      } else {
        const [a,b] = await Promise.all([
          client.from('crm_clients').select('id,name,contact_email,stage,notes').order('created_at', {ascending:false}).limit(100),
          client.from('crm_deals').select('id,title,stage,amount,currency,client_id').order('created_at', {ascending:false}).limit(100),
        ]);
        if (a.error || b.error) throw new Error('Your role cannot access Client CRM records. Review staging RLS.');
        setClients(a.data || []); setDeals(b.data || []);
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to load workspace records.'); }
    finally { setLoading(false); }
  }, [client, module]);
  useEffect(() => { void refresh(); }, [refresh]);
  const people = demo ? TEAM_MEMBERS.map(p=>({ id:p.id, full_name:p.name, role:p.role, email:p.email, title:p.role, department:'Demo team', active:true })) : profiles;
  const isPeople = module === 'people';
  if (demo && module === 'crm') return <DemoCrmView />;
  return <div className="h-full w-full overflow-y-auto bg-[#0D0D0F] text-white">
    <div className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-[#777780]">{isPeople ? 'People operations' : 'Revenue operations'} <span className="rounded border border-[#303034] px-1.5 py-0.5">{demo ? 'DEMO' : 'SUPABASE'}</span></div>
          <h2 className="text-2xl font-semibold">{isPeople ? 'HR & People' : 'Client CRM'}</h2>
          <p className="mt-1 text-xs text-[#A0A0A8]">{isPeople ? 'Team directory, leave requests and attendance.' : 'Your client relationships and opportunity pipeline.'}</p>
        </div>
        {!demo && <button type="button" disabled={loading} onClick={()=>void refresh()} className="flex items-center gap-2 rounded-md border border-[#303034] bg-[#171719] px-3 py-2 text-xs text-white disabled:opacity-50"><RefreshCw className="h-3.5 w-3.5"/>Refresh</button>}
      </div>
      {demo && <div className="rounded-lg border border-[#44444b] bg-[#171719] px-4 py-3 text-xs text-[#A0A0A8]"><strong className="text-white">Preview mode.</strong> This page shows a clearly labelled sample team. Real HR and CRM records require the isolated Supabase staging connection and approved role access.</div>}
      {loading && <p role="status" className="text-xs text-[#A0A0A8]">Loading permitted records…</p>}
      {error && <p role="alert" className="rounded-lg border border-[#783d3d] bg-[#2a1719] px-4 py-3 text-xs text-rose-200">{error}</p>}
      {isPeople ? <>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[{label:'Team members',value:people.length,Icon:Users},
            {label:'Active accounts',value:people.filter(x=>x.active).length,Icon:UserRoundCheck},
            {label:'Pending leave',value:leaves.filter(x=>x.status==='pending').length,Icon:CalendarClock},
            {label:'Clocked in',value:attendance.filter(x=>!x.clock_out).length,Icon:ShieldCheck}]
            .map(({label,value,Icon})=><div key={label} className={panel+' p-4'}><div className="flex justify-between text-xs text-[#A0A0A8]"><span>{label}</span><Icon className="h-4 w-4"/></div><p className="mt-4 text-3xl font-semibold">{value}</p></div>)}
        </div>
        <div className={panel+' overflow-hidden'}>
          <div className="border-b border-[#303034] px-4 py-4"><h3 className="text-sm font-semibold">Team directory</h3><p className="mt-1 text-[11px] text-[#777780]">Employee role and contact overview</p></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[540px] text-left text-xs">
            <thead className="bg-[#121214] text-[10px] uppercase tracking-wider text-[#777780]"><tr><th className="px-4 py-3 font-medium">Employee</th><th className="px-4 py-3 font-medium">Role</th><th className="px-4 py-3 font-medium">Department</th><th className="px-4 py-3 font-medium">Status</th></tr></thead>
            <tbody className="divide-y divide-[#303034]">{people.map(p=><tr key={p.id} className="hover:bg-white/[0.025]">
              <td className="px-4 py-3"><div className="font-medium text-white">{p.full_name || 'Employee'}</div><div className="mt-0.5 text-[11px] text-[#777780]">{p.email || 'Private email'}</div></td>
              <td className="px-4 py-3 text-[#A0A0A8]">{p.role}</td><td className="px-4 py-3 text-[#A0A0A8]">{p.department || '—'}</td>
              <td className="px-4 py-3"><span className="rounded border border-[#3e3e44] px-2 py-1 text-[#dedee0]">{p.active ? 'Active' : 'Inactive'}</span></td>
            </tr>)}</tbody>
          </table>{people.length===0 && <p className="p-4 text-xs text-[#777780]">No employee records are visible.</p>}</div>
        </div>
      </> : <>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {[{label:'Clients',value:clients.length},{label:'Open opportunities',value:deals.filter(d=>!['won','lost','closed'].includes(d.stage?.toLowerCase())).length},{label:'Tracked deals',value:deals.length}]
            .map(x=><div key={x.label} className={panel+' p-4'}><p className="text-xs text-[#A0A0A8]">{x.label}</p><p className="mt-4 text-3xl font-semibold">{x.value}</p></div>)}
        </div>
        <section className={panel+' overflow-hidden'}>
          <div className="flex items-center gap-2 border-b border-[#303034] px-4 py-4"><BriefcaseBusiness className="h-4 w-4 text-[#A0A0A8]"/><h3 className="text-sm font-semibold">Client pipeline</h3></div>
          {demo && <p className="px-4 py-6 text-xs text-[#A0A0A8]">No fictional CRM records are shown. Connect authorized staging Supabase to view your real clients and deals.</p>}
          {!demo && <div className="divide-y divide-[#303034]">{clients.map(c=><div key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"><div><p className="text-xs font-semibold">{c.name}</p><p className="mt-1 text-[11px] text-[#777780]">{c.contact_email || 'No email'}</p></div><span className="rounded border border-[#303034] px-2 py-1 text-[10px] text-[#A0A0A8]">{c.stage || 'Unspecified stage'}</span></div>)}{clients.length===0 && <p className="p-4 text-xs text-[#777780]">No clients visible.</p>}</div>}
        </section>
        {!demo && <section className={panel+' overflow-hidden'}><div className="border-b border-[#303034] p-4 text-sm font-semibold">Deals</div><div className="divide-y divide-[#303034]">{deals.map(d=><div key={d.id} className="flex items-center justify-between gap-2 p-4 text-xs"><div><p className="font-medium">{d.title}</p><p className="mt-1 text-[#777780]">{d.stage}</p></div><span className="text-[#A0A0A8]">{fmt(Number(d.amount || 0),d.currency || 'BDT')}</span></div>)}{deals.length===0 && <p className="p-4 text-xs text-[#777780]">No deals visible.</p>}</div></section>}
      </>}
    </div>
  </div>;
};
