import React, { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Bell, FileText, MessageCircle, Plus, RefreshCw, Send, X } from 'lucide-react';
import { getSupabaseClient } from '../../services/supabaseClient';

type Mode='notes'|'announcements'|'messages'|'notifications';
type Note={id:string;title:string;body:string;created_at:string};
type Announcement={id:string;title:string;body:string;created_at:string};
type Notice={id:string;title:string;body:string;created_at:string;read_at:string|null};
type Group={id:string;name:string};
type Message={id:string;group_id:string;sender_id:string;body:string;created_at:string};
const field='min-h-10 w-full rounded-md border border-[#44444b] bg-[#101012] px-3 py-2 text-xs text-white';
const box='rounded-xl border border-[#303034] bg-[#171719]';
export function LiveCollaboration({userId,mode}:{userId:string;mode:Mode}){
 const client=getSupabaseClient();
 const [notes,setNotes]=useState<Note[]>([]);
 const [announcements,setAnnouncements]=useState<Announcement[]>([]);
 const [notices,setNotices]=useState<Notice[]>([]);
 const [messages,setMessages]=useState<Message[]>([]);
 const [groups,setGroups]=useState<Group[]>([]);
 const [groupId,setGroupId]=useState('');
 const [title,setTitle]=useState('');
 const [body,setBody]=useState('');
 const [newMessage,setNewMessage]=useState('');
 const [composer,setComposer]=useState(false);
 const [busy,setBusy]=useState(false);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [success,setSuccess]=useState('');
 const [role,setRole]=useState('employee');
 const manager=['founder','cofounder','ceo','admin','hr'].includes(role);
 const reload=useCallback(async()=>{
  if(!client)return;setLoading(true);setError('');
  try{
   const {data:auth,error:authError}=await client.auth.getUser();
   if(authError||auth.user?.id!==userId)throw new Error('Session expired.');
   const {data:profile,error:profileError}=await client.from('profiles').select('role').eq('id',userId).single();
   if(profileError)throw profileError;
   setRole(String(profile?.role||'employee'));
   if(mode==='notes'){
     const {data,error}=await client.from('notes').select('id,title,body,created_at').eq('owner_id',userId).order('created_at',{ascending:false}).limit(100);
     if(error)throw error;setNotes(data||[]);
   }
   if(mode==='announcements'){
     const {data,error}=await client.from('announcements').select('id,title,body,created_at').order('created_at',{ascending:false}).limit(100);
     if(error)throw error;setAnnouncements(data||[]);
   }
   if(mode==='notifications'){
     const {data,error}=await client.from('notifications').select('id,title,body,created_at,read_at').eq('user_id',userId).order('created_at',{ascending:false}).limit(100);
     if(error)throw error;setNotices(data||[]);
   }
   if(mode==='messages'){
     const {data:available,error:groupError}=await client.from('team_groups').select('id,name').order('created_at',{ascending:false}).limit(100);
     if(groupError)throw groupError;setGroups(available||[]);
     const activeGroup=groupId&&available?.some(g=>g.id===groupId)?groupId:(available?.[0]?.id||'');
     if(activeGroup!==groupId)setGroupId(activeGroup);
     if(activeGroup){
       const {data:threads,error:threadError}=await client.from('team_group_messages').select('id,group_id,sender_id,body,created_at').eq('group_id',activeGroup).order('created_at',{ascending:true}).limit(150);
       if(threadError)throw threadError;setMessages(threads||[]);
     }else setMessages([]);
   }
  }catch(cause){setError(cause instanceof Error?cause.message:'Unable to load records.');}
  finally{setLoading(false);}
 },[client,groupId,mode,userId]);
 useEffect(()=>{void reload()},[reload]);
 async function save(e:FormEvent){
  e.preventDefault();if(!client||!title.trim()||!body.trim())return;
  setBusy(true);setError('');setSuccess('');
  try{
   const {data:who,error:authError}=await client.auth.getUser();
   if(authError||who.user?.id!==userId)throw new Error('Session expired.');
   if(mode==='notes'){
     const {error}=await client.from('notes').insert({title:title.trim(),body:body.trim(),owner_id:userId});
     if(error)throw error;
   }else if(mode==='announcements'){
     const {error}=await client.from('announcements').insert({title:title.trim(),body:body.trim(),created_by:userId});
     if(error)throw error;
   }
   setTitle('');setBody('');setComposer(false);await reload();setSuccess('Saved to Supabase.');
  }catch(cause){setError(cause instanceof Error?cause.message:'Unable to save.');}
  finally{setBusy(false);}
 }
 async function send(e:FormEvent){
  e.preventDefault();if(!client||!groupId||!newMessage.trim())return;
  setBusy(true);setError('');setSuccess('');
  try{
   const {data:who,error:authError}=await client.auth.getUser();
   if(authError||who.user?.id!==userId)throw new Error('Session expired.');
   const {error}=await client.from('team_group_messages').insert({group_id:groupId,sender_id:userId,body:newMessage.trim()});
   if(error)throw error;
   setNewMessage('');await reload();
  }catch(cause){setError(cause instanceof Error?cause.message:'Unable to send message.');}
  finally{setBusy(false);}
 }
 async function removeNote(id:string){
  if(!client||!window.confirm('Delete this note permanently?'))return;
  setBusy(true);setError('');
  try{const {error}=await client.from('notes').delete().eq('id',id).eq('owner_id',userId);if(error)throw error;await reload();}
  catch(cause){setError(cause instanceof Error?cause.message:'Delete failed.');}
  finally{setBusy(false);}
 }
 async function markRead(id:string){
  if(!client)return;setBusy(true);setError('');
  try{const {error}=await client.from('notifications').update({read_at:new Date().toISOString()}).eq('id',id).eq('user_id',userId);if(error)throw error;await reload();}
  catch(cause){setError(cause instanceof Error?cause.message:'Unable to mark notification.');}
  finally{setBusy(false);}
 }
 const titles={notes:'My notes',announcements:'Announcements',notifications:'Notifications',messages:'Team messaging'};
 const icons={notes:FileText,announcements:Bell,notifications:Bell,messages:MessageCircle};
 const Icon=icons[mode];
 return <div className="h-full w-full overflow-y-auto bg-[#0D0D0F] text-white"><div className="mx-auto max-w-6xl space-y-5 px-4 py-7 sm:px-7">
  <header className="flex flex-wrap items-start justify-between gap-3">
   <div><p className="text-[10px] uppercase tracking-widest text-[#777780]">Authenticated workspace · Supabase</p><h1 className="mt-2 flex items-center gap-2 text-2xl font-semibold"><Icon className="h-6 w-6"/>{titles[mode]}</h1><p className="mt-2 text-xs text-[#A0A0A8]">Records accessible through your own account permissions.</p></div>
   <div className="flex gap-2"><button type="button" onClick={()=>void reload()} disabled={busy||loading} className="rounded border border-[#44444b] p-2"><RefreshCw className="h-4 w-4"/></button>
   {(mode==='notes'||mode==='announcements'&&manager)&&<button onClick={()=>{setComposer(true);setError('')}} className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-xs font-semibold text-black"><Plus className="h-4 w-4"/> Add {mode==='notes'?'note':'announcement'}</button>}</div>
  </header>
  {error&&<p role="alert" className="rounded border border-rose-900 p-3 text-xs text-rose-200">{error}</p>}
  {success&&<p role="status" className="rounded border border-[#44444b] p-3 text-xs">{success}</p>}
  {mode==='messages'&&<section className={box+' p-4'}><label className="block space-y-2 text-xs text-[#A0A0A8]">Your groups<select value={groupId} onChange={e=>setGroupId(e.target.value)} className={field}><option value="">Choose group</option>{groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select></label></section>}
  {mode==='messages'&&<section className={box+' overflow-hidden'}>
    <div className="max-h-[55dvh] min-h-[200px] space-y-3 overflow-y-auto p-4">{messages.map(m=><div key={m.id} className={'max-w-[90%] rounded-md border border-[#303034] bg-[#101012] p-3 text-xs '+(m.sender_id===userId?'ml-auto':'')}>
       <p className="whitespace-pre-wrap break-words">{m.body}</p><p className="mt-2 text-[10px] text-[#777780]">{m.sender_id===userId?'You':'Team member'} · {new Date(m.created_at).toLocaleString()}</p>
     </div>)}{!messages.length&&<p className="text-xs text-[#777780]">{groups.length?'No messages in this group.':'You are not a member of a visible group.'}</p>}</div>
    <form onSubmit={send} className="flex items-center gap-2 border-t border-[#303034] p-3"><input required maxLength={3000} className={field} placeholder="Write a message..." value={newMessage} onChange={e=>setNewMessage(e.target.value)} disabled={!groupId||busy}/><button disabled={!groupId||busy||!newMessage.trim()} className="rounded-md bg-white px-3 py-2.5 text-black disabled:opacity-50"><Send className="h-4 w-4"/></button></form>
  </section>}
  {mode!=='messages'&&<section className={box+' overflow-hidden'}><div className="border-b border-[#303034] p-4 text-sm font-semibold">{mode==='notes'?'Private notes':mode==='announcements'?'Company notices':'Your alerts'}</div>
    <div className="divide-y divide-[#303034]">{(mode==='notes'?notes:mode==='announcements'?announcements:notices).map(row=><div key={row.id} className="flex items-start justify-between gap-3 p-4">
      <div className="min-w-0 flex-1"><p className="text-sm font-medium">{row.title}</p><p className="mt-2 whitespace-pre-wrap break-words text-xs text-[#A0A0A8]">{row.body}</p><p className="mt-2 text-[10px] text-[#777780]">{new Date(row.created_at).toLocaleString()}</p></div>
      {mode==='notes'&&<button disabled={busy} aria-label="Delete note" onClick={()=>void removeNote(row.id)} className="rounded border border-[#44444b] px-2 py-1 text-[11px]">Delete</button>}
      {mode==='notifications'&&'read_at' in row&&!row.read_at&&<button disabled={busy} onClick={()=>void markRead(row.id)} className="rounded border border-[#44444b] px-2 py-1 text-[11px]">Mark read</button>}
    </div>)}{mode==='notes'&&!notes.length||mode==='announcements'&&!announcements.length||mode==='notifications'&&!notices.length?<p className="p-6 text-xs text-[#777780]">No records visible.</p>:null}</div></section>}
  {composer&&<div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-3"><form onSubmit={save} className="w-full max-w-lg space-y-4 rounded-xl border border-[#44444b] bg-[#171719] p-5">
    <div className="flex justify-between"><h2 className="text-lg font-semibold">New {mode==='notes'?'note':'announcement'}</h2><button type="button" aria-label="Close" onClick={()=>setComposer(false)}><X className="h-5 w-5"/></button></div>
    <label className="block space-y-1 text-xs text-[#A0A0A8]">Title<input required maxLength={160} value={title} onChange={e=>setTitle(e.target.value)} className={field}/></label>
    <label className="block space-y-1 text-xs text-[#A0A0A8]">Content<textarea required rows={5} maxLength={10000} value={body} onChange={e=>setBody(e.target.value)} className={field}/></label>
    <button disabled={busy} className="w-full rounded-md bg-white px-4 py-2.5 text-xs font-semibold text-black disabled:opacity-50">Save to Supabase</button>
  </form></div>}
 </div></div>;
}
