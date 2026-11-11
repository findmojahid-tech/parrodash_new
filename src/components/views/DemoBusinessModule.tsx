import React, { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Check, CheckCircle2, Clock3, Download, MessageSquareText, Plus, Search, Trash2, X } from 'lucide-react';
import type { BusinessModule } from './BusinessModuleView';

type RecordValue = string | number | boolean | null;
type SandboxRecord = { id: string; created_at: string; [field: string]: RecordValue };
type DemoStore = Partial<Record<BusinessModule, SandboxRecord[]>>;
type Field = { key: string; label: string; type?: 'date' | 'datetime-local' | 'number' | 'url' | 'textarea' | 'select'; options?: string[]; required?: boolean };
type ModuleConfig = { title: string; caption: string; fields: Field[]; columns: string[]; action: string };
const KEY = 'parrodash_product_demo_operations_v3';
const config: Record<BusinessModule, ModuleConfig> = {
  attendance: { title:'Attendance', caption:'Track clock-ins, time spent and working sessions.', fields:[],columns:['clock_in','clock_out','notes'],action:'Clock in' },
  leave: { title:'Leave requests', caption:'Request time off and follow approval status.',fields:[{key:'kind',label:'Leave type',type:'select',options:['Annual','Sick','Emergency','Unpaid'],required:true},{key:'start_date',label:'Start date',type:'date',required:true},{key:'end_date',label:'End date',type:'date',required:true},{key:'reason',label:'Reason',type:'textarea',required:true}],columns:['kind','start_date','end_date','status','reason'],action:'Request leave' },
  payroll: { title:'Payroll', caption:'Build a local example of a payroll record without processing money.',fields:[{key:'period',label:'Pay period',required:true},{key:'base_pay',label:'Base pay (BDT)',type:'number',required:true},{key:'allowances',label:'Allowances (BDT)',type:'number'},{key:'deductions',label:'Deductions (BDT)',type:'number'}],columns:['period','base_pay','allowances','deductions','net_pay'],action:'Add demo payslip' },
  announcements: { title:'Announcements',caption:'Compose team announcements in your demo workspace.',fields:[{key:'title',label:'Announcement title',required:true},{key:'body',label:'Message',type:'textarea',required:true}],columns:['title','body','created_at'],action:'Publish demo announcement' },
  approvals: { title:'Approvals',caption:'Review internal requests and record demo decisions.',fields:[{key:'title',label:'Request title',required:true},{key:'type',label:'Approval type',type:'select',options:['Project','Resource','Budget','General'],required:true},{key:'reason',label:'Request details',type:'textarea',required:true}],columns:['title','type','status','reason'],action:'Submit for approval' },
  invoices: { title:'Invoices',caption:'Create local draft invoices. No invoice is sent or charged.',fields:[{key:'invoice_number',label:'Invoice number',required:true},{key:'title',label:'Client / work',required:true},{key:'amount',label:'Amount (BDT)',type:'number',required:true},{key:'due_date',label:'Due date',type:'date',required:true}],columns:['invoice_number','title','amount','due_date','status'],action:'Create draft invoice' },
  messages: { title:'Team messages',caption:'Demo group discussion board with saved conversation history.',fields:[{key:'group',label:'Channel',type:'select',options:['General','Design','Development','HR'],required:true},{key:'body',label:'Message',type:'textarea',required:true}],columns:['group','body','created_at'],action:'Send message' },
  notifications: { title:'Notifications',caption:'Track your local notifications and mark them as read.',fields:[],columns:['title','body','created_at','status'],action:'Mark all as read' },
  holidays: { title:'Company holidays',caption:'Draft holidays and practice publishing approvals locally.',fields:[{key:'name',label:'Holiday name',required:true},{key:'start_on',label:'Starts',type:'date',required:true},{key:'end_on',label:'Ends',type:'date',required:true}],columns:['name','start_on','end_on','status'],action:'Add holiday draft' },
  resources: { title:'Employee resources',caption:'Keep shared resource links inside the browser demo.',fields:[{key:'title',label:'Resource title',required:true},{key:'category',label:'Category',type:'select',options:['Policy','Training','HR','Design','Other']},{key:'url',label:'Link',type:'url',required:true}],columns:['title','category','url'],action:'Add resource' },
  notes: { title:'Notes',caption:'Write and organize notes, stored locally in this browser.',fields:[{key:'title',label:'Note title',required:true},{key:'body',label:'Content',type:'textarea',required:true}],columns:['title','body','created_at'],action:'Save note' },
  submissions: { title:'Task submissions',caption:'Practice submitting deliverables for review in the demo.',fields:[{key:'task_title',label:'Task name',required:true},{key:'work_url',label:'Work URL',type:'url',required:true},{key:'message',label:'Submission notes',type:'textarea'}],columns:['task_title','work_url','status','message'],action:'Submit work' },
};

function readStore(): DemoStore {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || '{}') as DemoStore;
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return value;
  } catch { return {}; }
}
const input = 'min-h-10 w-full rounded-md border border-[#3a3a40] bg-[#101012] px-3 py-2 text-xs text-white outline-none focus:border-white';
function validLink(url: string) {
  try { const parsed = new URL(url); return parsed.protocol === 'https:' || parsed.protocol === 'http:'; } catch { return false; }
}
function show(value: RecordValue, key: string) {
  if (value === null || value === undefined || value === '') return '—';
  const str = String(value);
  if ((key === 'url' || key === 'work_url') && validLink(str)) return <a href={str} target="_blank" rel="noopener noreferrer" className="block max-w-48 truncate text-white underline underline-offset-2">{str}</a>;
  if (key === 'created_at' || key === 'clock_in' || key === 'clock_out') return new Date(str).toLocaleString();
  if (key === 'status') return <span className="rounded border border-[#45454b] bg-[#252529] px-2 py-1 text-white">{str}</span>;
  return <span className="block max-w-72 truncate" title={str}>{str}</span>;
}

export function DemoBusinessModule({module}: {module: BusinessModule}) {
  const cfg = config[module];
  const [store,setStore] = useState<DemoStore>(readStore);
  const [composer,setComposer] = useState(false);
  const [fields,setFields] = useState<Record<string,string>>({});
  const [filter,setFilter] = useState('');
  const [error,setError] = useState('');
  const [notice,setNotice] = useState('');
  const items = useMemo(() => store[module] || [],[store,module]);
  const filtered = items.filter(item=>cfg.columns.some(key=>String(item[key] ?? '').toLowerCase().includes(filter.toLowerCase())));
  const openShift = module === 'attendance' ? items.find(x=>!x.clock_out) : null;
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(store)); } catch { setError('Browser storage is full or unavailable.'); }
  },[store]);
  const mutate = (handler:(rows:SandboxRecord[])=>SandboxRecord[]) => setStore(prev=>({...prev,[module]:handler(prev[module] || [])}));
  const insert = (values:Record<string,RecordValue>) => {
    const record:SandboxRecord = {id:crypto.randomUUID(),created_at:new Date().toISOString(),...values};
    mutate(rows=>[record,...rows]);
    setNotice('Saved to this browser demo. No live company records changed.');
    setError('');
    setComposer(false);
    setFields({});
  };
  function submit(event:FormEvent) {
    event.preventDefault();
    const data:Record<string,RecordValue> = {};
    for (const f of cfg.fields) {
      const val = (fields[f.key] || (f.type === 'select' ? f.options?.[0] : '') || '').trim();
      if (f.required && !val) {setError(f.label+' is required.');return;}
      if (f.type === 'url' && !validLink(val)) {setError('Enter a valid HTTPS or HTTP link.');return;}
      data[f.key] = f.type === 'number' ? Math.max(0,Number(val || 0)) : val;
    }
    if (module === 'leave' || module === 'holidays') {
      const start = String(data.start_date || data.start_on || '');
      const end = String(data.end_date || data.end_on || '');
      if (start > end) {setError('The end date must not be before the start date.');return;}
    }
    if (module === 'leave' || module === 'approvals' || module === 'submissions') data.status = 'Pending';
    if (module === 'holidays') data.status = 'Draft';
    if (module === 'invoices') data.status = 'Draft';
    if (module === 'payroll') data.net_pay = Number(data.base_pay || 0)+Number(data.allowances || 0)-Number(data.deductions || 0);
    insert(data);
  }
  function updateStatus(id:string,status:string) {
    mutate(rows=>rows.map(row=>row.id===id?{...row,status}:row));
    setNotice('Decision saved to your local demo.');
  }
  function remove(id:string) {
    mutate(rows=>rows.filter(row=>row.id!==id));
    setNotice('Item removed from this browser demo.');
  }
  function clock() {
    if(openShift){
      mutate(rows=>rows.map(row=>row.id===openShift.id?{...row,clock_out:new Date().toISOString()}:row));
      setNotice('Shift ended. Times saved locally.');
    }else insert({clock_in:new Date().toISOString(),clock_out:null,notes:'Demo work session'});
  }
  function markRead() {
    mutate(rows=>rows.map(row=>({...row,status:'Read'})));
    setNotice('All demo notifications marked as read.');
  }
  const count = items.length;
  const waiting = items.filter(item=>item.status==='Pending').length;
  const endText = module==='attendance' && openShift ? 'Clock out' : cfg.action;
  return <div className="h-full w-full overflow-y-auto bg-[#0D0D0F] text-white">
    <div className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-7">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2"><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-[#777780]">ParroDash / Live interactive demo <span className="ml-2 rounded border border-[#45454b] px-1.5 py-0.5">LOCAL ONLY</span></p><h1 className="text-2xl font-semibold">{cfg.title}</h1><p className="text-xs text-[#A0A0A8]">{cfg.caption}</p></div>
        <button onClick={()=> {setError('');setNotice('');if(module==='attendance')clock();else if(module==='notifications')markRead();else setComposer(true);}}
          className="inline-flex min-h-10 items-center gap-2 rounded-md bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-[#e5e5e5]">
          {module==='attendance'?<Clock3 className="h-4 w-4"/>:module==='notifications'?<CheckCircle2 className="h-4 w-4"/>:<Plus className="h-4 w-4"/>}{endText}
        </button>
      </header>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[#303034] bg-[#171719] p-4"><p className="text-xs text-[#A0A0A8]">Total {module==='messages'?'messages':'records'}</p><p className="mt-3 text-3xl font-semibold">{count}</p></div>
        <div className="rounded-xl border border-[#303034] bg-[#171719] p-4"><p className="text-xs text-[#A0A0A8]">{module==='attendance'?'Active shift':'Pending'}</p><p className="mt-3 text-3xl font-semibold">{module==='attendance'?(openShift?1:0):waiting}</p></div>
        <div className="col-span-2 rounded-xl border border-[#303034] bg-[#171719] p-4 sm:col-span-1"><p className="text-xs text-[#A0A0A8]">Storage</p><p className="mt-3 flex items-center gap-2 text-sm font-semibold"><Check className="h-4 w-4"/>Saved in browser</p></div>
      </div>
      <div className="rounded-lg border border-[#4B4B52] bg-[#171719] px-4 py-3 text-xs text-[#A0A0A8]"><strong className="text-white">Demo mode:</strong> All actions work locally in this browser. They are not shared with other users, do not trigger emails/payments and do not modify your Supabase production data.</div>
      {notice && <p role="status" className="rounded-md border border-[#44444a] px-3 py-2 text-xs text-white">{notice}</p>}
      {error && <p role="alert" className="rounded-md border border-rose-900 px-3 py-2 text-xs text-rose-200">{error}</p>}
      <div className="overflow-hidden rounded-xl border border-[#303034] bg-[#171719]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#303034] px-4 py-3">
          <div><h2 className="text-sm font-semibold">Activity & records</h2><p className="mt-1 text-[11px] text-[#777780]">Changes persist when you refresh this browser</p></div>
          <label className="flex items-center gap-2 rounded-md border border-[#303034] bg-[#0D0D0F] px-2 py-2 text-[#777780]"><Search className="h-3.5 w-3.5"/><input className="max-w-40 bg-transparent text-xs text-white outline-none" placeholder="Search records..." aria-label="Search records" type="search" value={filter} onChange={e=>setFilter(e.target.value)}/></label>
        </div>
        <div className="max-w-full overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-xs"><thead className="bg-[#121214] text-[10px] uppercase tracking-[.08em] text-[#777780]"><tr>{cfg.columns.map(k=><th scope="col" key={k} className="px-4 py-3 font-medium">{k.replaceAll('_',' ')}</th>)}<th className="px-4 py-3 font-medium">Actions</th></tr></thead>
          <tbody className="divide-y divide-[#303034]">{filtered.map(item=><tr key={item.id} className="hover:bg-white/[.025]">
            {cfg.columns.map(k=><td key={k} className="max-w-80 px-4 py-3 align-middle text-[#C7C7CC]">{show(item[k],k)}</td>)}
            <td className="whitespace-nowrap px-4 py-3">
              {((module==='approvals'||module==='leave'||module==='submissions')&&item.status==='Pending') && <><button onClick={()=>updateStatus(item.id,'Approved')} className="mr-2 rounded border border-[#45454b] px-2 py-1 hover:bg-white/10">Approve</button><button onClick={()=>updateStatus(item.id,'Rejected')} className="mr-2 rounded border border-[#45454b] px-2 py-1 hover:bg-white/10">Reject</button></>}
              {module==='holidays'&&item.status==='Draft'&& <button onClick={()=>updateStatus(item.id,'Published')} className="mr-2 rounded border border-[#45454b] px-2 py-1 hover:bg-white/10">Publish</button>}
              {module==='invoices'&&item.status==='Draft'&& <button onClick={()=>updateStatus(item.id,'Paid (demo)')} className="mr-2 rounded border border-[#45454b] px-2 py-1 hover:bg-white/10">Mark paid</button>}
              {module==='notifications'&&item.status!=='Read'&& <button onClick={()=>updateStatus(item.id,'Read')} className="mr-2 rounded border border-[#45454b] px-2 py-1 hover:bg-white/10">Read</button>}
              <button aria-label="Delete demo record" title="Delete demo record" onClick={()=>remove(item.id)} className="rounded p-1 text-[#777780] hover:text-white"><Trash2 className="h-4 w-4"/></button>
            </td>
          </tr>)}</tbody></table>
        </div>
        {filtered.length===0 && <div className="px-4 py-12 text-center"><div className="text-sm text-white">No records yet</div><p className="mt-2 text-xs text-[#777780]">Use “{endText}” to try this feature. Your changes will appear here.</p></div>}
      </div>
      {composer && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3" onMouseDown={e=>{if(e.target===e.currentTarget)setComposer(false);}}>
        <form onSubmit={submit} className="w-full max-w-lg space-y-4 rounded-xl border border-[#45454b] bg-[#171719] p-5 text-white shadow-2xl">
          <div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold">{cfg.action}</h2><p className="mt-1 text-[11px] text-[#A0A0A8]">Local demo only · no production changes</p></div><button type="button" aria-label="Close form" onClick={()=>setComposer(false)}><X className="h-5 w-5"/></button></div>
          {cfg.fields.map(field=><label key={field.key} className="block space-y-1.5"><span className="text-xs text-[#C7C7CC]">{field.label}</span>
            {field.type==='textarea'?<textarea required={field.required} rows={3} maxLength={2500} className={input} value={fields[field.key]||''} onChange={e=>setFields(p=>({...p,[field.key]:e.target.value}))}/>:
              field.type==='select'?<select required={field.required} className={input} value={fields[field.key]||field.options?.[0]||''} onChange={e=>setFields(p=>({...p,[field.key]:e.target.value}))}>{field.options?.map(o=><option key={o}>{o}</option>)}</select>:
              <input required={field.required} maxLength={field.type==='url'?1200:200} min={field.type==='number'?0:undefined} step={field.type==='number'?'0.01':undefined} type={field.type||'text'} className={input} value={fields[field.key]||''} onChange={e=>setFields(p=>({...p,[field.key]:e.target.value}))}/>}
          </label>)}
          {error&&<p role="alert" className="text-xs text-rose-200">{error}</p>}
          <div className="flex justify-end gap-2"><button type="button" onClick={()=>setComposer(false)} className="rounded-md border border-[#45454b] px-4 py-2 text-xs">Cancel</button><button type="submit" className="rounded-md bg-white px-4 py-2 text-xs font-semibold text-black">{cfg.action}</button></div>
        </form>
      </div>}
      {module==='messages' && <p className="flex items-center gap-2 text-xs text-[#777780]"><MessageSquareText className="h-4 w-4"/>Messages are saved only on this device, not delivered to team members.</p>}
      {module==='invoices' && <p className="flex items-center gap-2 text-xs text-[#777780]"><Download className="h-4 w-4"/>No real invoices or payment transactions are generated.</p>}
    </div>
  </div>;
}
