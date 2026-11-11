import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowUpRight, Database, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import { authMode, getSupabaseClient } from '../../services/supabaseClient';
import { DemoBusinessModule } from './DemoBusinessModule';

/** Lists only explicitly selected columns. Row visibility and authorization are enforced by Supabase RLS. */
export type BusinessModule = 'attendance' | 'leave' | 'payroll' | 'announcements' | 'approvals' | 'invoices' | 'messages' | 'notifications' | 'holidays' | 'resources' | 'notes' | 'submissions';

type Config = {
  title: string; subtitle: string; table: string; select: string; columns: {key: string; label: string}[];
  sort: string; hint: string;
};
export const BUSINESS_MODULES: Record<BusinessModule, Config> = {
  attendance: { title: 'Attendance', subtitle: 'Clock-in history and recorded working sessions', table: 'attendance',
    select:'id,user_id,clock_in,clock_out,notes', sort:'clock_in',
    columns:[{key:'clock_in',label:'Clock in'},{key:'clock_out',label:'Clock out'},{key:'notes',label:'Notes'}],
    hint:'Clock-in and clock-out actions require verified employee identity and attendance policies.' },
  leave: { title: 'Leave management', subtitle: 'Leave requests, decisions and time away', table: 'leave_requests',
    select:'id,user_id,kind,start_date,end_date,status,reason,created_at', sort:'created_at',
    columns:[{key:'kind',label:'Type'},{key:'start_date',label:'Start'},{key:'end_date',label:'End'},{key:'status',label:'Status'},{key:'reason',label:'Reason'}],
    hint:'Leave submission and approval require role-specific server validation.' },
  payroll: { title: 'Payroll', subtitle: 'Role-restricted payroll records', table:'payroll_records',
    select:'id,user_id,period,currency,base_pay,allowances,deductions,created_at', sort:'created_at',
    columns:[{key:'period',label:'Period'},{key:'currency',label:'Currency'},{key:'base_pay',label:'Base'},{key:'allowances',label:'Allowances'},{key:'deductions',label:'Deductions'}],
    hint:'Payroll is confidential. The database must enforce employee and management boundaries.' },
  announcements: { title:'Announcements', subtitle:'Company notices and published communications', table:'announcements',
    select:'id,title,body,created_at', sort:'created_at',
    columns:[{key:'title',label:'Announcement'},{key:'body',label:'Message'},{key:'created_at',label:'Published'}],
    hint:'Publishing announcements requires authorized staff permissions.' },
  approvals: { title:'Approvals', subtitle:'Pending and completed internal decisions', table:'approval_queue',
    select:'id,type,title,status,created_at,decision_note', sort:'created_at',
    columns:[{key:'title',label:'Request'},{key:'type',label:'Type'},{key:'status',label:'Status'},{key:'created_at',label:'Created'},{key:'decision_note',label:'Decision'}],
    hint:'Approval actions are intentionally unavailable until staging role-negative tests pass.' },
  invoices: { title:'Finance & invoices', subtitle:'Billing records and payment status', table:'finance_invoices',
    select:'id,invoice_number,title,currency,total,status,issue_date,due_date', sort:'issue_date',
    columns:[{key:'invoice_number',label:'Invoice'},{key:'title',label:'Title'},{key:'total',label:'Total'},{key:'currency',label:'Currency'},{key:'status',label:'Status'},{key:'due_date',label:'Due'}],
    hint:'Invoice creation, sharing and payments need audited server-side validation.' },
  messages: { title:'Team messaging', subtitle:'Messages in channels you are authorized to see', table:'team_group_messages',
    select:'id,group_id,body,created_at', sort:'created_at',
    columns:[{key:'group_id',label:'Group'},{key:'body',label:'Message'},{key:'created_at',label:'Sent'}],
    hint:'This is a read-only message history, not a replacement for authorized group chat.' },
  notifications: { title:'Notifications', subtitle:'Personal updates and workspace alerts', table:'notifications',
    select:'id,title,body,created_at,read_at', sort:'created_at',
    columns:[{key:'title',label:'Notification'},{key:'body',label:'Message'},{key:'created_at',label:'Received'},{key:'read_at',label:'Read'}],
    hint:'Only notifications visible through the signed-in user\'s policies are displayed.' },
  holidays: { title:'Company holidays', subtitle:'Holidays and publication approval status', table:'company_holidays',
    select:'id,name,start_on,end_on,status,origin', sort:'start_on',
    columns:[{key:'name',label:'Holiday'},{key:'start_on',label:'Start'},{key:'end_on',label:'End'},{key:'status',label:'Status'},{key:'origin',label:'Source'}],
    hint:'Holiday publication requires founder/co-founder approval policies.' },
  resources: { title:'Employee resources', subtitle:'Useful internal links for approved staff', table:'employee_resource_links',
    select:'id,title,category,description,url,enabled', sort:'title',
    columns:[{key:'title',label:'Resource'},{key:'category',label:'Category'},{key:'description',label:'Description'},{key:'url',label:'Link'}],
    hint:'Only links permitted by workspace row-level policies are shown.' },
  notes: { title:'Notes', subtitle:'Private notes and retained knowledge', table:'notes',
    select:'id,title,body,created_at', sort:'created_at',
    columns:[{key:'title',label:'Note'},{key:'body',label:'Content'},{key:'created_at',label:'Created'}],
    hint:'Notes are owner-sensitive. Data access is controlled by database policies.' },
  submissions: { title:'Task submissions', subtitle:'Submitted deliverables and review states', table:'task_submissions',
    select:'id,task_id,work_url,status,message,created_at', sort:'created_at',
    columns:[{key:'task_id',label:'Task'},{key:'work_url',label:'Work link'},{key:'status',label:'Status'},{key:'message',label:'Notes'},{key:'created_at',label:'Submitted'}],
    hint:'Submitting work and reviewing deliverables requires task-specific permissions.' },
};

function renderCell(value: unknown, key: string) {
  if (value === null || value === undefined || value === '') return <span className="text-[#66666f]">—</span>;
  const s = String(value);
  if (/^https?:\/\//.test(s) && (key === 'url' || key === 'work_url')) {
    try { const u = new URL(s); if (!['http:', 'https:'].includes(u.protocol)) return 'Unavailable link'; }
    catch { return 'Invalid link'; }
    return <a href={s} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-56 items-center gap-1 truncate text-white underline underline-offset-2">{s}<ArrowUpRight className="h-3.5 w-3.5 shrink-0"/></a>;
  }
  if (/(_at|_on|date|clock_in|clock_out)$/.test(key) && !Number.isNaN(Date.parse(s))) return new Date(s).toLocaleString();
  if (key === 'status') return <span className="rounded border border-[#45454b] bg-[#202023] px-2 py-1 text-[11px] text-white">{s.replaceAll('_',' ')}</span>;
  return <span title={s} className="block max-w-[24rem] truncate">{s}</span>;
}

export const BusinessModuleView: React.FC<{ module: BusinessModule }> = ({module}) => {
  const config = BUSINESS_MODULES[module];
  const client = getSupabaseClient();
  const demo = authMode === 'demo';
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    if (!client) return;
    setBusy(true);
    setError('');
    try {
      const {data:auth, error:authError} = await client.auth.getUser();
      if (authError || !auth.user) throw new Error('Sign in is required for this workspace module.');
      const {data,error:queryError} = await client.from(config.table).select(config.select)
        .order(config.sort,{ascending:false}).limit(100);
      if (queryError) throw new Error('Records are not accessible to this account. Check permissions or staging availability.');
      setRows(Array.isArray(data) ? data as unknown as Record<string,unknown>[] : []);
    } catch (cause) {
      setRows([]);
      setError(cause instanceof Error ? cause.message : 'This module is unavailable.');
    } finally { setBusy(false); }
  }, [client,config]);
  useEffect(()=>{if(!demo)void load();},[demo,load]);
  const filtered = useMemo(()=>rows.filter(row=>config.columns.some(({key})=>String(row[key]??'').toLowerCase().includes(search.toLowerCase()))),[rows,search,config]);
  if (demo) return <DemoBusinessModule module={module} />;
  return <div className="h-full w-full overflow-y-auto bg-[#0D0D0F] text-white">
    <div className="mx-auto max-w-7xl space-y-5 px-4 py-7 sm:px-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><div className="mb-2 inline-flex items-center gap-2 text-[10px] uppercase tracking-[.16em] text-[#777780]"><Database className="h-3.5 w-3.5"/> Workspace module <span className="rounded border border-[#303034] px-1.5 py-0.5">{demo?'DEMO':'SUPABASE'}</span></div>
          <h1 className="text-2xl font-semibold tracking-tight">{config.title}</h1><p className="mt-2 text-xs text-[#A0A0A8]">{config.subtitle}</p></div>
        {!demo && <button onClick={()=>void load()} disabled={busy} className="flex items-center gap-2 rounded-md border border-[#303034] bg-[#171719] px-3 py-2 text-xs text-white disabled:opacity-50"><RefreshCw className="h-3.5 w-3.5"/> Refresh</button>}
      </div>
      {demo && <div role="status" className="rounded-lg border border-[#45454b] bg-[#171719] p-4 text-xs leading-relaxed text-[#A0A0A8]"><ShieldCheck className="mb-2 h-4 w-4 text-white"/><strong className="text-white">Not connected to a live workspace.</strong> This module exists in the original ParroDash backend, but the public preview is using local demo mode. Real records are deliberately not simulated. Connect an isolated Supabase staging instance to test it safely.</div>}
      {error && <div role="alert" className="flex gap-2 rounded-lg border border-rose-900 bg-[#211315] p-4 text-xs text-rose-200"><AlertCircle className="h-4 w-4 shrink-0"/>{error}</div>}
      {!demo && <label className="flex max-w-sm items-center gap-2 rounded-md border border-[#303034] bg-[#171719] px-3 py-2 text-[#777780]"><Search className="h-4 w-4"/><input type="search" aria-label="Search module records" placeholder="Filter visible records..." value={search} onChange={event=>setSearch(event.target.value)} className="w-full bg-transparent text-xs text-white outline-none placeholder:text-[#777780]"/></label>}
      <div className="overflow-hidden rounded-xl border border-[#303034] bg-[#171719]">
        <div className="flex items-center justify-between border-b border-[#303034] px-4 py-3"><h2 className="text-sm font-semibold">Records</h2><span className="text-[11px] text-[#777780]">{demo?'Staging required':busy?'Loading…':filtered.length+' visible'}</span></div>
        <div className="max-w-full overflow-x-auto"><table className="w-full min-w-[600px] text-left text-xs">
          <thead className="bg-[#121214] text-[10px] uppercase tracking-wider text-[#777780]"><tr>{config.columns.map(c=><th key={c.key} scope="col" className="px-4 py-3 font-medium">{c.label}</th>)}</tr></thead>
          <tbody className="divide-y divide-[#303034]">{!demo && filtered.map((row,i)=><tr key={String(row.id ?? i)} className="hover:bg-white/[.025]">{config.columns.map(c=><td key={c.key} className="max-w-[24rem] px-4 py-3 align-top text-[#C7C7CC]">{renderCell(row[c.key],c.key)}</td>)}</tr>)}</tbody>
        </table></div>
        {(demo || (!busy && filtered.length===0)) && <div className="px-4 py-10 text-center text-xs text-[#777780]">{demo?'Live records unavailable in demo mode':error?'Unable to display records':'No records visible with your account permissions'}</div>}
      </div>
      <p className="text-[11px] leading-relaxed text-[#777780]">{config.hint} This view is read-only until authenticated end-to-end workflows are verified.</p>
    </div>
  </div>;
};
