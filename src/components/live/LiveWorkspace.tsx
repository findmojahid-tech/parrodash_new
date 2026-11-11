import React, { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Bell, BriefcaseBusiness, CalendarDays, CheckCircle2, ChevronRight, ClipboardCheck, Database, FileText, FolderKanban, LayoutDashboard, ListTodo, LogOut, Menu, MessageSquareText, Plus, RefreshCw, Search, ShieldCheck, Users, Wallet, X } from 'lucide-react';
import { getSupabaseClient } from '../../services/supabaseClient';
import { BusinessModuleView, type BusinessModule } from '../views/BusinessModuleView';
import { OperationsView } from '../views/OperationsView';
import { EmployeeInviteManager } from '../auth/EmployeeInviteManager';
import { EmployeeApprovalInbox } from '../auth/EmployeeApprovalInbox';

type LiveTask = {
  id: string; title: string; description: string; status: 'todo' | 'in_progress' | 'done';
  priority: string; due_date: string | null; project_id: string | null;
  assigned_to: string; created_at: string; resource_url: string | null; resource_label: string;
};
type Project = { id: string; name: string; description: string; status: string; created_at: string };
type Staff = { id: string; full_name: string | null; email: string | null; role: string };
type View = 'dashboard'|'projects'|'tasks'|'people'|'crm'|BusinessModule;
type SessionUser = { id: string; name: string; role: string };
const modules: {id: View; label: string; Icon: React.ComponentType<{className?:string}>; heading: string}[] = [
  {id:'dashboard',label:'Dashboard',Icon:LayoutDashboard,heading:'Core Workspace'},
  {id:'projects',label:'Projects',Icon:FolderKanban,heading:'Core Workspace'},
  {id:'tasks',label:'Tasks & Inbox',Icon:ListTodo,heading:'Core Workspace'},
  {id:'people',label:'HR & People',Icon:Users,heading:'People Operations'},
  {id:'attendance',label:'Attendance',Icon:CheckCircle2,heading:'People Operations'},
  {id:'leave',label:'Leave Management',Icon:CalendarDays,heading:'People Operations'},
  {id:'payroll',label:'Payroll',Icon:Wallet,heading:'People Operations'},
  {id:'crm',label:'Client CRM',Icon:BriefcaseBusiness,heading:'Business'},
  {id:'invoices',label:'Finance & Invoices',Icon:Wallet,heading:'Business'},
  {id:'approvals',label:'Approvals',Icon:ClipboardCheck,heading:'Business'},
  {id:'announcements',label:'Announcements',Icon:Bell,heading:'Collaboration'},
  {id:'messages',label:'Group Messages',Icon:MessageSquareText,heading:'Collaboration'},
  {id:'notifications',label:'Notifications',Icon:Bell,heading:'Collaboration'},
  {id:'holidays',label:'Company Holidays',Icon:CalendarDays,heading:'Calendar & Docs'},
  {id:'notes',label:'Notes',Icon:FileText,heading:'Calendar & Docs'},
  {id:'resources',label:'Employee Resources',Icon:FileText,heading:'Calendar & Docs'},
  {id:'submissions',label:'Task Submissions',Icon:ClipboardCheck,heading:'Calendar & Docs'},
];
const activeClass='bg-white text-black';
const inactiveClass='text-[#A0A0A8] hover:bg-[#252529] hover:text-white';
const inputClass='min-h-10 w-full rounded-md border border-[#44444b] bg-[#101012] px-3 py-2 text-xs text-white outline-none focus:border-white';
const stages: LiveTask['status'][]=['todo','in_progress','done'];
const stateLabels: Record<LiveTask['status'], string>={todo:'To Do',in_progress:'In Progress',done:'Done'};
const currencies=(n:number)=>n.toLocaleString('en-BD');
const uuid=(v:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

export function LiveWorkspace({userId}:{userId:string}) {
  const client=getSupabaseClient();
  const [view,setView]=useState<View>('dashboard');
  const [mobileOpen,setMobileOpen]=useState(false);
  const [sessionUser,setSessionUser]=useState<SessionUser>({id:userId,name:'Workspace member',role:'employee'});
  const [projects,setProjects]=useState<Project[]>([]);
  const [tasks,setTasks]=useState<LiveTask[]>([]);
  const [staff,setStaff]=useState<Staff[]>([]);
  const [loading,setLoading]=useState(true);
  const [working,setWorking]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [search,setSearch]=useState('');
  const [projectFilter,setProjectFilter]=useState('');
  const [newProjectOpen,setNewProjectOpen]=useState(false);
  const [newTaskOpen,setNewTaskOpen]=useState(false);
  const [projectName,setProjectName]=useState('');
  const [projectDescription,setProjectDescription]=useState('');
  const [taskTitle,setTaskTitle]=useState('');
  const [taskDescription,setTaskDescription]=useState('');
  const [taskAssignee,setTaskAssignee]=useState(userId);
  const [taskProject,setTaskProject]=useState('');
  const [taskPriority,setTaskPriority]=useState('Normal');
  const [taskDue,setTaskDue]=useState('');
  const [taskResource,setTaskResource]=useState('');
  const [taskResourceLabel,setTaskResourceLabel]=useState('');
  const [editing,setEditing]=useState<LiveTask|null>(null);
  const [editingTitle,setEditingTitle]=useState('');
  const [editingDescription,setEditingDescription]=useState('');
  const [editingPriority,setEditingPriority]=useState('');
  const [editingDue,setEditingDue]=useState('');
  const [editingStatus,setEditingStatus]=useState<LiveTask['status']>('todo');
  const [editingResource,setEditingResource]=useState('');
  const [editingResourceLabel,setEditingResourceLabel]=useState('');

  const load=useCallback(async()=>{
    if(!client) return;
    setLoading(true);setError('');
    try {
      const {data:identity,error:authError}=await client.auth.getUser();
      if(authError || identity.user?.id!==userId) throw new Error('Your session expired. Sign in again.');
      const [profileResult,taskResult,projectResult,staffResult]=await Promise.all([
        client.from('profiles').select('id,full_name,role').eq('id',userId).single(),
        client.from('tasks').select('id,title,description,status,priority,due_date,project_id,assigned_to,created_at,resource_url,resource_label').order('created_at',{ascending:false}).limit(300),
        client.from('projects').select('id,name,description,status,created_at').order('created_at',{ascending:false}).limit(100),
        client.from('profiles').select('id,full_name,email,role').eq('active',true).eq('registration_status','approved').limit(200),
      ]);
      if(profileResult.error || !profileResult.data)throw new Error('Unable to verify your profile.');
      if(taskResult.error)throw new Error('Tasks are not accessible to your account: '+taskResult.error.message);
      if(projectResult.error)throw new Error('Projects are not accessible to your account: '+projectResult.error.message);
      if(staffResult.error)throw new Error('Team directory is not accessible to your account: '+staffResult.error.message);
      setSessionUser({id:userId,name:profileResult.data.full_name||identity.user.email||'Team member',role:String(profileResult.data.role)});
      setTasks(taskResult.data as LiveTask[]);
      setProjects(projectResult.data as Project[]);
      setStaff(staffResult.data as Staff[]);
    }catch(cause){setError(cause instanceof Error?cause.message:'Unable to load workspace');}
    finally{setLoading(false);}
  },[client,userId]);
  useEffect(()=>{void load();},[load]);
  const lead=['founder','cofounder','ceo','admin','hr','project_manager','manager'].includes(sessionUser.role);
  const visible=useMemo(()=>tasks.filter(t=>(!projectFilter||t.project_id===projectFilter)&&(
    !search||[t.title,t.description,t.priority,staff.find(p=>p.id===t.assigned_to)?.full_name||''].join(' ').toLowerCase().includes(search.toLowerCase())
  )),[tasks,projectFilter,search,staff]);
  const complete=tasks.filter(t=>t.status==='done').length;
  const pending=tasks.filter(t=>t.status!=='done').length;
  const overdue=tasks.filter(t=>t.status!=='done'&&t.due_date&&new Date(t.due_date+'T00:00:00').getTime()<new Date().setHours(0,0,0,0)).length;
  const staffName=(id:string)=>staff.find(p=>p.id===id)?.full_name||'Team member';
  const projectNameById=(id:string|null)=>projects.find(p=>p.id===id)?.name||'No project';
  function navigate(id:View){setView(id);setMobileOpen(false);setSearch('');setProjectFilter('');}
  function newTask(){setTaskTitle('');setTaskDescription('');setTaskAssignee(userId);setTaskProject('');setTaskPriority('Normal');setTaskDue('');setTaskResource('');setTaskResourceLabel('');setNewTaskOpen(true);setError('');}
  function edit(t:LiveTask){setEditing(t);setEditingTitle(t.title);setEditingDescription(t.description);setEditingPriority(t.priority);setEditingDue(t.due_date||'');setEditingStatus(t.status);setEditingResource(t.resource_url||'');setEditingResourceLabel(t.resource_label||'');setError('');}
  function validResource(value:string){if(!value)return true;try{return ['https:','http:'].includes(new URL(value).protocol)}catch{return false}}
  async function runMutation(fn:()=>Promise<void>,message:string) {
    setWorking(true);setError('');setNotice('');
    try {await fn();await load();setNotice(message);}
    catch(cause){setError(cause instanceof Error?cause.message:'Save failed.');}
    finally{setWorking(false);}
  }
  async function createProject(event:FormEvent){
    event.preventDefault();if(!client||!lead||!projectName.trim())return;
    await runMutation(async()=>{
      const {error:issue}=await client.from('projects').insert({name:projectName.trim(),description:projectDescription.trim(),status:'Active',created_by:userId});
      if(issue)throw issue;setNewProjectOpen(false);setProjectName('');setProjectDescription('');
    },'Project created in Supabase.');
  }
  async function createTask(event:FormEvent){
    event.preventDefault();if(!client||!lead||!taskTitle.trim()||!uuid(taskAssignee)||!validResource(taskResource))return;
    await runMutation(async()=>{
      const {error:issue}=await client.rpc('create_workspace_task',{
        p_title:taskTitle.trim(),p_description:taskDescription.trim(),p_instructions:'',
        p_assignee:taskAssignee,p_other_assignees:[],p_project:taskProject||null,p_priority:taskPriority,
        p_start_date:null,p_due_date:taskDue||null,p_estimate:0,
        p_resources:taskResource.trim()?[{label:taskResourceLabel.trim()||'Resource',url:taskResource.trim()}]:[],
      });
      if(issue)throw issue;setNewTaskOpen(false);
    },'Task created in Supabase.');
  }
  async function saveTask(event:FormEvent){
    event.preventDefault();if(!client||!editing||!editingTitle.trim()||!validResource(editingResource))return;
    const id=editing.id;
    await runMutation(async()=>{
      const {error:issue}=await client.from('tasks').update({
        title:editingTitle.trim(),description:editingDescription.trim(),priority:editingPriority,
        due_date:editingDue||null,status:editingStatus,resource_url:editingResource.trim()||null,resource_label:editingResourceLabel.trim(),
      }).eq('id',id);
      if(issue)throw issue;setEditing(null);
    },'Task updated in Supabase.');
  }
  async function quickStatus(task:LiveTask,next:LiveTask['status']){
    if(!client)return;
    await runMutation(async()=>{
      const {error:issue}=await client.from('tasks').update({status:next}).eq('id',task.id);
      if(issue)throw issue;
    },'Task status saved.');
  }
  const toolbar=<div className="flex flex-wrap items-center gap-2">
    <label className="flex min-w-36 flex-1 items-center gap-2 rounded-md border border-[#303034] bg-[#171719] px-3 py-2 text-[#777780] sm:max-w-xs">
      <Search className="h-4 w-4"/><input type="search" placeholder="Find tasks..." aria-label="Find tasks" value={search} onChange={e=>setSearch(e.target.value)} className="min-w-0 w-full bg-transparent text-xs text-white outline-none"/>
    </label>
    <select aria-label="Filter project" className="rounded-md border border-[#303034] bg-[#171719] px-3 py-2 text-xs text-[#A0A0A8]" value={projectFilter} onChange={e=>setProjectFilter(e.target.value)}>
      <option value="">All projects</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
    </select>
  </div>;
  const list=<div className="overflow-hidden rounded-xl border border-[#303034] bg-[#171719]">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#303034] px-4 py-4">
      <h2 className="text-sm font-semibold">Workspace tasks</h2><span className="text-xs text-[#777780]">{visible.length} tasks visible to your role</span>
    </div>
    <div className="divide-y divide-[#303034]">
      {visible.map(task=><div key={task.id} className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-white/[.02]">
        <button type="button" aria-label="Open task" onClick={()=>edit(task)} className="min-w-[180px] flex-1 text-left">
          <p className="truncate text-sm font-medium text-white">{task.title}</p>
          <p className="mt-1 truncate text-[11px] text-[#777780]">{projectNameById(task.project_id)} · {staffName(task.assigned_to)}</p>
        </button>
        <span className="hidden rounded border border-[#44444b] px-2 py-1 text-[11px] text-[#A0A0A8] sm:block">{task.priority}</span>
        <span className="hidden text-[11px] text-[#777780] sm:block">{task.due_date||'No deadline'}</span>
        <select title="Change task status" aria-label="Task status" disabled={working} value={task.status} onChange={e=>void quickStatus(task,e.target.value as LiveTask['status'])}
          className="rounded-md border border-[#44444b] bg-[#101012] px-2 py-1.5 text-xs text-white disabled:opacity-50">
          {stages.map(s=><option key={s} value={s}>{stateLabels[s]}</option>)}
        </select>
        <button aria-label="Edit task" onClick={()=>edit(task)} className="rounded border border-[#44444b] px-2.5 py-1.5 text-xs text-[#A0A0A8] hover:text-white">Edit</button>
      </div>)}
      {!visible.length&&<p className="p-8 text-center text-xs text-[#777780]">No tasks are visible for this selection. Your database permissions determine which records appear.</p>}
    </div>
  </div>;

  const sidebar=<div className="flex h-full min-h-0 flex-col bg-[#121214]">
    <div className="flex shrink-0 items-center gap-2 border-b border-[#303034] p-4">
      <span className="flex h-8 w-8 items-center justify-center rounded bg-white text-xs font-black text-black">PD</span>
      <div className="min-w-0 flex-1"><p className="text-xs font-bold">ParroDash</p><p className="truncate text-[10px] text-[#777780]">TPARRO Workspace</p></div>
      <button className="md:hidden" aria-label="Close menu" onClick={()=>setMobileOpen(false)}><X className="h-4 w-4"/></button>
    </div>
    <div className="min-h-0 flex-1 overflow-y-auto p-2">
      {modules.map((m,i)=><React.Fragment key={m.id}>
        {(i===0||m.heading!==modules[i-1]?.heading)&&<p className="mb-2 mt-4 px-2 text-[10px] font-semibold uppercase tracking-widest text-[#777780]">{m.heading}</p>}
        <button onClick={()=>navigate(m.id)} className={'mb-0.5 flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-xs transition-colors '+(view===m.id?activeClass:inactiveClass)}>
          <m.Icon className="h-4 w-4 shrink-0"/><span className="truncate">{m.label}</span>
        </button>
      </React.Fragment>)}
    </div>
    <div className="shrink-0 border-t border-[#303034] p-3">
      <p className="truncate text-xs font-semibold">{sessionUser.name}</p>
      <p className="mt-1 text-[10px] capitalize text-[#777780]">{sessionUser.role} · Supabase workspace</p>
      <button onClick={()=>void client?.auth.signOut()} className="mt-3 inline-flex items-center gap-2 text-xs text-[#A0A0A8] hover:text-white"><LogOut className="h-3.5 w-3.5"/> Sign out</button>
    </div>
  </div>;

  return <div className="flex h-[100dvh] w-full overflow-hidden bg-[#0D0D0F] text-white">
    <aside className="hidden h-full w-[230px] shrink-0 border-r border-[#303034] md:block">{sidebar}</aside>
    <button aria-label="Open menu" onClick={()=>setMobileOpen(true)} className="fixed bottom-4 left-4 z-40 rounded-lg border border-[#44444b] bg-[#171719] p-3 md:hidden"><Menu className="h-5 w-5"/></button>
    {mobileOpen&&<div className="fixed inset-0 z-50 bg-black/70 md:hidden" onMouseDown={e=>{if(e.target===e.currentTarget)setMobileOpen(false)}}><aside className="h-full w-[min(85vw,280px)]">{sidebar}</aside></div>}
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      <header className="shrink-0 border-b border-[#303034] bg-[#171719]">
        <div className="flex min-h-12 items-center justify-between gap-2 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 text-[11px]"><span className="font-semibold">ParroDash Workspace</span><ChevronRight className="h-3.5 w-3.5 text-[#777780]"/><span className="truncate capitalize text-[#A0A0A8]">{view.replaceAll('_',' ')}</span></div>
          <div className="flex items-center gap-2"><button title="Refresh workspace" disabled={loading} onClick={()=>void load()} className="rounded border border-[#44444b] p-1.5 text-[#A0A0A8] hover:text-white"><RefreshCw className="h-4 w-4"/></button>
          {lead&&<button onClick={newTask} className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-2 text-xs font-semibold text-black"><Plus className="h-3.5 w-3.5"/> New task</button>}</div>
        </div>
      </header>
      <main className="min-h-0 flex-1 overflow-y-auto bg-[#0D0D0F]">
        {loading&&<p className="px-6 py-3 text-xs text-[#A0A0A8]" role="status">Syncing authorized workspace data...</p>}
        {error&&<p role="alert" className="m-4 rounded-lg border border-rose-900 bg-[#201316] p-3 text-xs text-rose-200">{error}</p>}
        {notice&&<p role="status" className="m-4 rounded-lg border border-[#44444b] p-3 text-xs text-white">{notice}</p>}
        {view==='dashboard'&&<div className="mx-auto max-w-7xl space-y-6 px-4 py-7 sm:px-7">
          <div><p className="text-[10px] uppercase tracking-widest text-[#777780]">Live Supabase · Your authorized workspace</p><h1 className="mt-2 text-2xl font-semibold">Workspace overview</h1><p className="mt-2 text-xs text-[#A0A0A8]">Real records only. All actions are enforced by database permissions.</p></div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[{label:'Projects',count:projects.length,Icon:FolderKanban},{label:'Tasks',count:tasks.length,Icon:ListTodo},{label:'In progress',count:pending,Icon:Database},{label:'Overdue',count:overdue,Icon:CalendarDays}].map(({label,count,Icon})=><div key={label} className="rounded-xl border border-[#303034] bg-[#171719] p-4"><div className="flex justify-between text-xs text-[#A0A0A8]"><span>{label}</span><Icon className="h-4 w-4"/></div><p className="mt-4 text-3xl font-semibold">{currencies(count)}</p></div>)}</div>
          <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-sm font-semibold">Recent tasks</h2><button onClick={()=>navigate('tasks')} className="text-xs underline underline-offset-4">View all tasks</button></div>
          {list}
        </div>}
        {view==='projects'&&<div className="mx-auto max-w-7xl space-y-5 px-4 py-7 sm:px-7">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-semibold">Projects</h1><p className="mt-2 text-xs text-[#A0A0A8]">Projects are read from Supabase. Task counts reflect your access.</p></div>
          {lead&&<button onClick={()=>{setNewProjectOpen(true);setError('')}} className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2.5 text-xs font-semibold text-black"><Plus className="h-4 w-4"/> New project</button>}</div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{projects.map(p=>{const related=tasks.filter(t=>t.project_id===p.id);const completed=related.filter(t=>t.status==='done').length;const percent=related.length?Math.round(100*completed/related.length):0;return <button key={p.id} onClick={()=>{navigate('tasks');setProjectFilter(p.id)}} className="rounded-xl border border-[#303034] bg-[#171719] p-5 text-left hover:border-[#777780]">
            <div className="flex items-center gap-2"><FolderKanban className="h-4 w-4"/><h2 className="truncate text-sm font-semibold">{p.name}</h2></div><p className="mt-3 line-clamp-2 min-h-9 text-xs text-[#A0A0A8]">{p.description||'No project description'}</p><p className="mt-4 text-[11px] text-[#777780]">{related.length} tasks · {percent}% completed</p>
            <div className="mt-2 h-1.5 rounded bg-[#303034]"><div className="h-1.5 rounded bg-white" style={{width:percent+'%'}}/></div></button>})}</div>
          {!projects.length&&<p className="rounded border border-[#303034] p-6 text-xs text-[#777780]">No projects accessible with your account.</p>}
        </div>}
        {view==='tasks'&&<div className="mx-auto max-w-7xl space-y-5 px-4 py-7 sm:px-7">
          <div><h1 className="text-2xl font-semibold">Tasks & Inbox</h1><p className="mt-2 text-xs text-[#A0A0A8]">Status updates persist in Supabase. Completed {complete} of {tasks.length} visible tasks.</p></div>
          {toolbar}{list}
        </div>}
        {(view==='people'||view==='crm')&&<OperationsView module={view}/>}
        {!['dashboard','projects','tasks','people','crm'].includes(view)&&<BusinessModuleView module={view as BusinessModule}/>}
      </main>
    </div>
    {newProjectOpen&&<div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-3"><form onSubmit={createProject} className="w-full max-w-lg space-y-4 rounded-xl border border-[#44444b] bg-[#171719] p-5">
      <div className="flex justify-between"><h2 className="text-lg font-semibold">Create project</h2><button type="button" onClick={()=>setNewProjectOpen(false)} aria-label="Close"><X className="h-5 w-5"/></button></div>
      <label className="block space-y-1 text-xs text-[#A0A0A8]">Project name<input required maxLength={180} className={inputClass} value={projectName} onChange={e=>setProjectName(e.target.value)}/></label>
      <label className="block space-y-1 text-xs text-[#A0A0A8]">Description<textarea className={inputClass} rows={3} value={projectDescription} onChange={e=>setProjectDescription(e.target.value)}/></label>
      <button disabled={working} className="w-full rounded-md bg-white px-4 py-2.5 text-xs font-semibold text-black disabled:opacity-50">Create project</button>
    </form></div>}
    {newTaskOpen&&<div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-3"><form onSubmit={createTask} className="max-h-[90dvh] w-full max-w-lg space-y-3 overflow-y-auto rounded-xl border border-[#44444b] bg-[#171719] p-5">
      <div className="flex justify-between"><h2 className="text-lg font-semibold">Create task</h2><button type="button" onClick={()=>setNewTaskOpen(false)} aria-label="Close"><X className="h-5 w-5"/></button></div>
      <label className="block space-y-1 text-xs text-[#A0A0A8]">Task title<input required maxLength={180} className={inputClass} value={taskTitle} onChange={e=>setTaskTitle(e.target.value)}/></label>
      <label className="block space-y-1 text-xs text-[#A0A0A8]">Description<textarea rows={2} className={inputClass} value={taskDescription} onChange={e=>setTaskDescription(e.target.value)}/></label>
      <label className="block space-y-1 text-xs text-[#A0A0A8]">Project<select value={taskProject} className={inputClass} onChange={e=>setTaskProject(e.target.value)}><option value="">No project</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      <label className="block space-y-1 text-xs text-[#A0A0A8]">Assignee<select value={taskAssignee} className={inputClass} onChange={e=>setTaskAssignee(e.target.value)}><option value={userId}>Myself</option>{staff.filter(s=>s.id!==userId).map(s=><option key={s.id} value={s.id}>{s.full_name||s.email||'Employee'}</option>)}</select></label>
      <div className="grid grid-cols-2 gap-2"><label className="space-y-1 text-xs text-[#A0A0A8]">Priority<select value={taskPriority} className={inputClass} onChange={e=>setTaskPriority(e.target.value)}>{['Low','Normal','High','Urgent'].map(x=><option key={x}>{x}</option>)}</select></label><label className="space-y-1 text-xs text-[#A0A0A8]">Due date<input type="date" className={inputClass} value={taskDue} onChange={e=>setTaskDue(e.target.value)}/></label></div>
      <label className="block space-y-1 text-xs text-[#A0A0A8]">Resource URL<input type="url" className={inputClass} placeholder="https://drive.google.com/..." value={taskResource} onChange={e=>setTaskResource(e.target.value)}/></label>
      <label className="block space-y-1 text-xs text-[#A0A0A8]">Resource label<input className={inputClass} value={taskResourceLabel} onChange={e=>setTaskResourceLabel(e.target.value)}/></label>
      <button disabled={working} className="w-full rounded-md bg-white px-4 py-2.5 text-xs font-semibold text-black disabled:opacity-50">Create task in Supabase</button>
    </form></div>}
    {editing&&<div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-3"><form onSubmit={saveTask} className="max-h-[90dvh] w-full max-w-lg space-y-3 overflow-y-auto rounded-xl border border-[#44444b] bg-[#171719] p-5">
      <div className="flex justify-between"><div><h2 className="text-lg font-semibold">Task details</h2><p className="mt-1 text-[11px] text-[#777780]">Assigned to {staffName(editing.assigned_to)} · {projectNameById(editing.project_id)}</p></div><button type="button" onClick={()=>setEditing(null)} aria-label="Close"><X className="h-5 w-5"/></button></div>
      <label className="block space-y-1 text-xs text-[#A0A0A8]">Title<input required maxLength={180} className={inputClass} value={editingTitle} onChange={e=>setEditingTitle(e.target.value)}/></label>
      <label className="block space-y-1 text-xs text-[#A0A0A8]">Description<textarea rows={3} className={inputClass} value={editingDescription} onChange={e=>setEditingDescription(e.target.value)}/></label>
      <div className="grid grid-cols-2 gap-2"><label className="space-y-1 text-xs text-[#A0A0A8]">Status<select value={editingStatus} onChange={e=>setEditingStatus(e.target.value as LiveTask['status'])} className={inputClass}>{stages.map(s=><option value={s} key={s}>{stateLabels[s]}</option>)}</select></label><label className="space-y-1 text-xs text-[#A0A0A8]">Priority<select value={editingPriority} onChange={e=>setEditingPriority(e.target.value)} className={inputClass}>{['Low','Normal','High','Urgent'].map(x=><option key={x}>{x}</option>)}</select></label></div>
      <label className="block space-y-1 text-xs text-[#A0A0A8]">Due date<input className={inputClass} type="date" value={editingDue} onChange={e=>setEditingDue(e.target.value)}/></label>
      <label className="block space-y-1 text-xs text-[#A0A0A8]">Resource URL<input className={inputClass} type="url" value={editingResource} onChange={e=>setEditingResource(e.target.value)}/></label>
      <label className="block space-y-1 text-xs text-[#A0A0A8]">Resource label<input className={inputClass} value={editingResourceLabel} onChange={e=>setEditingResourceLabel(e.target.value)}/></label>
      {editing.resource_url&&<a href={validResource(editing.resource_url)?editing.resource_url:undefined} target="_blank" rel="noopener noreferrer" className="block truncate text-xs text-white underline">{editing.resource_label||editing.resource_url}</a>}
      <button disabled={working} className="w-full rounded-md bg-white px-4 py-2.5 text-xs font-semibold text-black disabled:opacity-50">Save task changes</button>
    </form></div>}
    <EmployeeInviteManager userId={userId}/>
    <EmployeeApprovalInbox userId={userId}/>
  </div>;
}
