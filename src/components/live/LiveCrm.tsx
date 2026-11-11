import React, { useCallback, useEffect, useState, type FormEvent } from 'react';
import { BriefcaseBusiness, Plus, RefreshCw, X } from 'lucide-react';
import { getSupabaseClient } from '../../services/supabaseClient';
type Client={id:string;name:string;contact_email:string|null;phone:string|null;stage:string;notes:string|null;owner_id:string};
type Deal={id:string;client_id:string;title:string;stage:string;amount:number;currency:string;owner_id:string};
const field='min-h-10 w-full rounded-md border border-[#44444b] bg-[#101012] px-3 py-2 text-xs text-white';
const stages=['Lead','Contacted','Qualified','Proposal','Negotiation','Won','Lost'];
export function LiveCrm({userId}:{userId:string}){
 const client=getSupabaseClient();
 const [clients,setClients]=useState<Client[]>([]);
 const [deals,setDeals]=useState<Deal[]>([]);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const [editor,setEditor]=useState<'client'|'deal'|null>(null);
 const [form,setForm]=useState<Record<string,string>>({});
 const [stageEdit,setStageEdit]=useState('');
 const refresh=useCallback(async()=>{
  if(!client)return;
  setLoading(true);setError('');
  try{
   const {data:auth,error:authError}=await client.auth.getUser();
   if(authError||auth.user?.id!==userId)throw new Error('Session expired.');
   const [c,d]=await Promise.all([
    client.from('crm_clients').select('id,name,contact_email,phone,stage,notes,owner_id').order('created_at',{ascending:false}).limit(150),
    client.from('crm_deals').select('id,client_id,title,stage,amount,currency,owner_id').order('created_at',{ascending:false}).limit(150),
   ]);
   if(c.error)throw c.error;if(d.error)throw d.error;
   setClients(c.data||[]);setDeals(d.data||[]);
  }catch(cause){setError(cause instanceof Error?cause.message:'CRM unavailable for this role.');}
  finally{setLoading(false);}
 },[client,userId]);
 useEffect(()=>{void refresh()},[refresh]);
 async function add(event:FormEvent){
  event.preventDefault();if(!client||!editor)return;
  setBusy(true);setError('');setNotice('');
  try{
   const {data:auth,error:authError}=await client.auth.getUser();
   if(authError||auth.user?.id!==userId)throw new Error('Session expired.');
   if(editor==='client'){
    if(!form.name?.trim())return;
    const {error}=await client.from('crm_clients').insert({
      name:form.name.trim(),contact_email:form.email?.trim()||null,phone:form.phone?.trim()||null,
      stage:form.stage||'Lead',notes:form.notes?.trim()||'',owner_id:userId
    });
    if(error)throw error;
   }else{
    if(!form.client_id||!form.title?.trim()||!(Number(form.amount)>=0))throw new Error('Enter a client, deal title and valid amount.');
    const {error}=await client.from('crm_deals').insert({
      client_id:form.client_id,title:form.title.trim(),amount:Number(form.amount),currency:'BDT',
      stage:form.stage||'Lead',owner_id:userId
    });
    if(error)throw error;
   }
   setForm({});setEditor(null);await refresh();setNotice('Saved in Supabase.');
  }catch(cause){setError(cause instanceof Error?cause.message:'Save failed.');}
  finally{setBusy(false);}
 }
 async function updateStage(deal:Deal,next:string){
  if(!client)return;
  setBusy(true);setError('');setNotice('');
  try{
   const {error}=await client.from('crm_deals').update({stage:next}).eq('id',deal.id);
   if(error)throw error;
   await refresh();setNotice('Deal stage updated.');
  }catch(cause){setError(cause instanceof Error?cause.message:'Unable to update stage.');}
  finally{setBusy(false);}
 }
 const money=(n:number)=>'৳'+n.toLocaleString('en-BD',{maximumFractionDigits:0});
 const active=deals.filter(d=>!['won','lost'].includes(d.stage?.toLowerCase()));
 return <div className="h-full w-full overflow-y-auto bg-[#0D0D0F] text-white"><div className="mx-auto max-w-7xl space-y-5 px-4 py-7 sm:px-7">
   <header className="flex flex-wrap items-start justify-between gap-3">
    <div><p className="text-[10px] uppercase tracking-widest text-[#777780]">Revenue Operations · Supabase</p><h1 className="mt-2 text-2xl font-semibold">Client CRM</h1><p className="mt-2 text-xs text-[#A0A0A8]">Real clients and opportunities, restricted by account permissions.</p></div>
    <div className="flex flex-wrap gap-2"><button onClick={()=>void refresh()} disabled={loading||busy} className="rounded-md border border-[#44444b] px-3 py-2 text-xs"><RefreshCw className="h-4 w-4"/></button>
      <button onClick={()=>{setForm({});setEditor('client')}} className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-xs font-semibold text-black"><Plus className="h-4 w-4"/> New client</button>
      <button onClick={()=>{setForm({});setEditor('deal')}} disabled={!clients.length} className="inline-flex items-center gap-2 rounded-md border border-[#44444b] px-3 py-2 text-xs disabled:opacity-50"><Plus className="h-4 w-4"/> Add deal</button>
    </div>
   </header>
   {error&&<p role="alert" className="rounded border border-rose-900 p-3 text-xs text-rose-200">{error}</p>}
   {notice&&<p role="status" className="rounded border border-[#44444b] p-3 text-xs">{notice}</p>}
   {loading&&<p role="status" className="text-xs text-[#A0A0A8]">Loading records...</p>}
   <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[{name:'Clients',value:clients.length},{name:'Deals',value:deals.length},{name:'Open deals',value:active.length},{name:'Open pipeline',value:money(active.reduce((sum,d)=>sum+Number(d.amount||0),0))}].map(stat=><div key={stat.name} className="rounded-xl border border-[#303034] bg-[#171719] p-4"><p className="text-xs text-[#A0A0A8]">{stat.name}</p><p className="mt-3 text-2xl font-semibold">{stat.value}</p></div>)}</div>
   <div className="grid gap-4 lg:grid-cols-2"><section className="overflow-hidden rounded-xl border border-[#303034] bg-[#171719]"><div className="flex items-center gap-2 border-b border-[#303034] p-4"><BriefcaseBusiness className="h-4 w-4"/><h2 className="text-sm font-semibold">Clients</h2></div>
     <div className="divide-y divide-[#303034]">{clients.map(c=><div key={c.id} className="p-4"><p className="text-sm font-semibold">{c.name}</p><p className="mt-1 text-xs text-[#A0A0A8]">{c.contact_email||'No contact email'} · {c.stage}</p><p className="mt-1 text-[11px] text-[#777780]">{c.phone||c.notes||''}</p></div>)}{!clients.length&&<p className="p-5 text-xs text-[#777780]">No clients visible.</p>}</div>
   </section><section className="overflow-hidden rounded-xl border border-[#303034] bg-[#171719]"><div className="border-b border-[#303034] p-4 text-sm font-semibold">Deal pipeline</div>
     <div className="divide-y divide-[#303034]">{deals.map(d=><div key={d.id} className="flex flex-wrap items-center gap-3 p-4"><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{d.title}</p><p className="mt-1 text-xs text-[#A0A0A8]">{clients.find(c=>c.id===d.client_id)?.name||'Client'} · {money(Number(d.amount||0))}</p></div>
       <select value={d.stage} aria-label="Deal stage" disabled={busy} onChange={e=>void updateStage(d,e.target.value)} className="rounded-md border border-[#44444b] bg-[#101012] px-2 py-2 text-xs">{[...new Set([d.stage,...stages])].map(stage=><option key={stage}>{stage}</option>)}</select></div>)}{!deals.length&&<p className="p-5 text-xs text-[#777780]">No deals visible.</p>}</div>
   </section></div>
   {editor&&<div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-3"><form onSubmit={add} className="max-h-[90dvh] w-full max-w-lg space-y-4 overflow-y-auto rounded-xl border border-[#44444b] bg-[#171719] p-5"><div className="flex justify-between"><h2 className="text-lg font-semibold">Add {editor}</h2><button type="button" onClick={()=>setEditor(null)} aria-label="Close"><X className="h-5 w-5"/></button></div>
     {editor==='client'?<>
      <label className="block space-y-1 text-xs text-[#A0A0A8]">Client name<input required maxLength={180} className={field} value={form.name||''} onChange={e=>setForm(p=>({...p,name:e.target.value}))}/></label>
      <label className="block space-y-1 text-xs text-[#A0A0A8]">Contact email<input type="email" className={field} value={form.email||''} onChange={e=>setForm(p=>({...p,email:e.target.value}))}/></label>
      <label className="block space-y-1 text-xs text-[#A0A0A8]">Phone<input className={field} value={form.phone||''} onChange={e=>setForm(p=>({...p,phone:e.target.value}))}/></label>
      <label className="block space-y-1 text-xs text-[#A0A0A8]">Stage<select className={field} value={form.stage||'Lead'} onChange={e=>setForm(p=>({...p,stage:e.target.value}))}>{stages.map(s=><option key={s}>{s}</option>)}</select></label>
      <label className="block space-y-1 text-xs text-[#A0A0A8]">Notes<textarea rows={3} className={field} value={form.notes||''} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/></label>
     </>:<>
      <label className="block space-y-1 text-xs text-[#A0A0A8]">Client<select required className={field} value={form.client_id||''} onChange={e=>setForm(p=>({...p,client_id:e.target.value}))}><option value="">Select client</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label className="block space-y-1 text-xs text-[#A0A0A8]">Deal title<input required maxLength={180} className={field} value={form.title||''} onChange={e=>setForm(p=>({...p,title:e.target.value}))}/></label>
      <label className="block space-y-1 text-xs text-[#A0A0A8]">Amount (BDT)<input required min={0} step="0.01" type="number" className={field} value={form.amount||''} onChange={e=>setForm(p=>({...p,amount:e.target.value}))}/></label>
      <label className="block space-y-1 text-xs text-[#A0A0A8]">Stage<select className={field} value={form.stage||'Lead'} onChange={e=>setForm(p=>({...p,stage:e.target.value}))}>{stages.map(s=><option key={s}>{s}</option>)}</select></label>
     </>}
     <button disabled={busy} className="w-full rounded-md bg-white px-4 py-2.5 text-xs font-semibold text-black disabled:opacity-50">Save to Supabase</button>
   </form></div>}
 </div></div>;
}
