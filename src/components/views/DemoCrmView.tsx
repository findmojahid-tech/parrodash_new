import React, { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ArrowUpRight, BriefcaseBusiness, Plus, Search, Trash2, X } from 'lucide-react';

type Client = { id:string; name:string; email:string; phone:string; stage:string; notes:string; createdAt:string };
type Deal = { id:string; clientId:string; title:string; amount:number; stage:string; createdAt:string };
type DemoCrm = { clients:Client[]; deals:Deal[] };
const KEY='parrodash_demo_crm_v2';
function load():DemoCrm { try {const d=JSON.parse(localStorage.getItem(KEY)||'{}');return {clients:Array.isArray(d.clients)?d.clients:[],deals:Array.isArray(d.deals)?d.deals:[]};}catch{return {clients:[],deals:[]};} }
const field='w-full min-h-10 rounded-md border border-[#44444b] bg-[#101012] px-3 py-2 text-xs text-white outline-none focus:border-white';
const stages=['Lead','Contacted','Qualified','Proposal','Negotiation','Won','Lost'];
export const DemoCrmView:React.FC = ()=>{
 const [data,setData]=useState<DemoCrm>(load);
 const [dialog,setDialog]=useState<'client'|'deal'|null>(null);
 const [form,setForm]=useState<Record<string,string>>({});
 const [filter,setFilter]=useState('');
 const [warning,setWarning]=useState('');
 useEffect(()=>{try{localStorage.setItem(KEY,JSON.stringify(data));}catch{setWarning('Unable to save in this browser.');}},[data]);
 const selected=useMemo(()=>data.clients.filter(c=>(c.name+' '+c.email+' '+c.stage).toLowerCase().includes(filter.toLowerCase())),[data.clients,filter]);
 const active=data.deals.filter(d=>d.stage!=='Won'&&d.stage!=='Lost');
 const amount=active.reduce((sum,d)=>sum+d.amount,0);
 const money=(n:number)=>'৳'+n.toLocaleString('en-BD',{maximumFractionDigits:0});
 function add(e:FormEvent){e.preventDefault();const id=crypto.randomUUID();const createdAt=new Date().toISOString();
   if(dialog==='client'){
     if(!form.name?.trim())return;
     setData(prev=>({...prev,clients:[{id,name:form.name.trim(),email:(form.email||'').trim(),phone:(form.phone||'').trim(),stage:form.stage||'Lead',notes:(form.notes||'').trim(),createdAt},...prev.clients]}));
   }else if(dialog==='deal'){
     if(!form.clientId||!form.title?.trim()||!Number.isFinite(Number(form.amount))||Number(form.amount)<0)return;
     setData(prev=>({...prev,deals:[{id,clientId:form.clientId,title:form.title.trim(),amount:Number(form.amount),stage:form.stage||'Lead',createdAt},...prev.deals]}));
   }
   setForm({});setDialog(null);
 }
 function removeClient(id:string){if(!confirm('Delete this local demo client and associated deals?'))return;setData(d=>({...d,clients:d.clients.filter(c=>c.id!==id),deals:d.deals.filter(x=>x.clientId!==id)}));}
 function removeDeal(id:string){setData(d=>({...d,deals:d.deals.filter(x=>x.id!==id)}));}
 const status=(id:string,stage:string)=>setData(d=>({...d,deals:d.deals.map(x=>x.id===id?{...x,stage}:x)}));
 return <div className="h-full w-full overflow-y-auto bg-[#0D0D0F] text-white"><div className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-7">
  <header className="flex flex-wrap items-center justify-between gap-3"><div><p className="mb-2 text-[10px] uppercase tracking-widest text-[#777780]">CRM workspace · browser-only demo</p><h1 className="text-2xl font-semibold">Clients & deals</h1><p className="mt-2 text-xs text-[#A0A0A8]">Create clients, manage your pipeline, and track estimated revenue.</p></div>
    <div className="flex gap-2"><button onClick={()=>{setForm({});setDialog('client');}} className="inline-flex items-center gap-2 rounded-md border border-[#45454b] px-3 py-2 text-xs"><Plus className="h-4 w-4"/> New client</button><button onClick={()=>{setForm({});setDialog('deal');}} disabled={!data.clients.length} className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-xs font-semibold text-black disabled:opacity-40"><Plus className="h-4 w-4"/> Add deal</button></div>
  </header>
  <div className="rounded-lg border border-[#45454b] bg-[#171719] p-3 text-xs text-[#A0A0A8]">This is an interactive local demo. Clients and deals persist in this browser only; no Supabase production records are changed.</div>
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[{name:'Clients',value:data.clients.length},{name:'All deals',value:data.deals.length},{name:'Open deals',value:active.length},{name:'Open pipeline',value:money(amount)}].map(v=><div className="rounded-xl border border-[#303034] bg-[#171719] p-4" key={v.name}><p className="text-xs text-[#A0A0A8]">{v.name}</p><p className="mt-4 text-2xl font-semibold">{v.value}</p></div>)}</div>
  {warning&&<p role="alert" className="text-xs text-rose-200">{warning}</p>}
  <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
   <section className="overflow-hidden rounded-xl border border-[#303034] bg-[#171719]">
     <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#303034] p-4"><h2 className="text-sm font-semibold">Client directory</h2><label className="flex items-center gap-2 rounded-md border border-[#44444b] bg-[#101012] px-2 py-1.5 text-[#777780]"><Search className="h-3.5 w-3.5"/><input placeholder="Filter clients" aria-label="Filter clients" className="max-w-36 bg-transparent text-xs text-white outline-none" value={filter} onChange={e=>setFilter(e.target.value)}/></label></div>
     <div className="divide-y divide-[#303034]">{selected.map(c=><div key={c.id} className="flex items-start justify-between gap-3 p-4"><div className="min-w-0"><p className="truncate text-sm font-medium">{c.name}</p><p className="mt-1 truncate text-xs text-[#777780]">{c.email||'No email'} · {c.stage}</p><p className="mt-1 truncate text-[11px] text-[#777780]">{c.phone||c.notes||''}</p></div><button title="Delete client" aria-label="Delete client" onClick={()=>removeClient(c.id)} className="text-[#777780] hover:text-rose-300"><Trash2 className="h-4 w-4"/></button></div>)}{!selected.length&&<p className="p-5 text-xs text-[#777780]">No clients yet. Add your first demo client.</p>}</div>
   </section>
   <section className="overflow-hidden rounded-xl border border-[#303034] bg-[#171719]">
     <div className="border-b border-[#303034] p-4"><h2 className="text-sm font-semibold">Deal pipeline</h2><p className="mt-1 text-[11px] text-[#777780]">Move deal status as it progresses</p></div>
     <div className="divide-y divide-[#303034]">{data.deals.map(d=><div key={d.id} className="flex flex-wrap items-center gap-3 p-4"><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{d.title}</p><p className="mt-1 truncate text-xs text-[#777780]">{data.clients.find(c=>c.id===d.clientId)?.name||'Client'} · {money(d.amount)}</p></div><select aria-label="Deal status" value={d.stage} onChange={e=>status(d.id,e.target.value)} className="rounded border border-[#44444b] bg-[#101012] px-2 py-1.5 text-xs">{stages.map(s=><option key={s}>{s}</option>)}</select><button title="Delete deal" aria-label="Delete deal" onClick={()=>removeDeal(d.id)} className="text-[#777780] hover:text-rose-300"><Trash2 className="h-4 w-4"/></button></div>)}{!data.deals.length&&<p className="p-5 text-xs text-[#777780]">Add a client first, then create a deal.</p>}</div>
   </section>
  </div>
  {dialog&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3" onMouseDown={e=>{if(e.target===e.currentTarget)setDialog(null);}}><form onSubmit={add} className="w-full max-w-lg space-y-4 rounded-xl border border-[#44444b] bg-[#171719] p-5"><div className="flex justify-between"><div><h2 className="text-lg font-semibold">New {dialog}</h2><p className="text-xs text-[#777780]">Browser demo · not shared with other users</p></div><button type="button" onClick={()=>setDialog(null)} aria-label="Close form"><X className="h-5 w-5"/></button></div>
    {dialog==='client'?<>
      {([['name','Client name'],['email','Email'],['phone','Phone'],['notes','Notes']] as const).map(([key,label])=><label key={key} className="block space-y-1"><span className="text-xs text-[#A0A0A8]">{label}</span><input required={key==='name'} type={key==='email'?'email':'text'} maxLength={250} className={field} value={form[key]||''} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))}/></label>)}
      <label className="block space-y-1 text-xs text-[#A0A0A8]">Pipeline stage<select className={field} value={form.stage||'Lead'} onChange={e=>setForm(p=>({...p,stage:e.target.value}))}>{stages.map(s=><option key={s}>{s}</option>)}</select></label>
    </>:<>
      <label className="block space-y-1 text-xs text-[#A0A0A8]">Client<select required className={field} value={form.clientId||''} onChange={e=>setForm(p=>({...p,clientId:e.target.value}))}><option value="">Select client</option>{data.clients.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</select></label>
      <label className="block space-y-1 text-xs text-[#A0A0A8]">Deal title<input required maxLength={200} className={field} value={form.title||''} onChange={e=>setForm(p=>({...p,title:e.target.value}))}/></label>
      <label className="block space-y-1 text-xs text-[#A0A0A8]">Amount (BDT)<input required type="number" min="0" step="0.01" className={field} value={form.amount||''} onChange={e=>setForm(p=>({...p,amount:e.target.value}))}/></label>
      <label className="block space-y-1 text-xs text-[#A0A0A8]">Stage<select className={field} value={form.stage||'Lead'} onChange={e=>setForm(p=>({...p,stage:e.target.value}))}>{stages.map(s=><option key={s}>{s}</option>)}</select></label>
    </>}
    <button type="submit" className="w-full rounded-md bg-white px-4 py-2.5 text-xs font-semibold text-black">Save {dialog}</button>
  </form></div>}
 </div></div>;
};
