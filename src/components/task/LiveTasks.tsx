import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Database, Plus, RefreshCw, X } from 'lucide-react';
import { getSupabaseClient } from '../../services/supabaseClient';

type TaskRecord = {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string | null;
  assigned_to: string;
  project_id: string | null;
  created_at: string;
};
type ProjectRecord = { id: string; name: string };
type StaffRecord = { id: string; full_name: string; role: string };

export function LiveTasks({ userId }: { userId: string }) {
  const client = getSupabaseClient();
  const [open, setOpen] = useState(false);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [staff, setStaff] = useState<StaffRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignee, setAssignee] = useState(userId);
  const [project, setProject] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('Normal');

  const refresh = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    setError('');
    try {
      const { data: session, error: authError } = await client.auth.getUser();
      if (authError || session.user?.id !== userId) throw new Error('Session expired. Sign in again.');
      const [taskResult, projectResult, staffResult] = await Promise.all([
        client.from('tasks').select('id,title,description,status,priority,due_date,assigned_to,project_id,created_at')
          .order('created_at', { ascending: false }).limit(150),
        client.from('projects').select('id,name').order('name').limit(150),
        client.from('profiles').select('id,full_name,role').eq('active', true).eq('registration_status', 'approved').limit(200),
      ]);
      if (taskResult.error) throw new Error('Unable to read tasks with your account permissions.');
      if (projectResult.error) throw new Error('Unable to read projects with your account permissions.');
      if (staffResult.error) throw new Error('Unable to read team members with your account permissions.');
      setTasks(taskResult.data || []);
      setProjects(projectResult.data || []);
      setStaff(staffResult.data || []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load workspace records.');
    } finally { setLoading(false); }
  }, [client, userId]);

  useEffect(() => {
    if (open) void refresh();
  }, [open, refresh]);

  async function createTask(event: FormEvent) {
    event.preventDefault();
    if (!client || !title.trim() || !assignee) return;
    setCreating(true);
    setError('');
    try {
      const { data: session, error: authError } = await client.auth.getUser();
      if (authError || session.user?.id !== userId) throw new Error('Session expired.');
      // Original ParroDash RPC is the authoritative, transactional creation API.
      // Role checks, assignee restrictions and task resources remain server-side.
      const { error: rpcError } = await client.rpc('create_workspace_task', {
        p_title: title.trim(),
        p_description: description.trim(),
        p_instructions: '',
        p_assignee: assignee,
        p_other_assignees: [],
        p_project: project || null,
        p_priority: priority,
        p_start_date: null,
        p_due_date: dueDate || null,
        p_estimate: 0,
        p_resources: [],
      });
      if (rpcError) throw new Error(rpcError.message);
      setTitle('');
      setDescription('');
      setDueDate('');
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to create task.');
    } finally { setCreating(false); }
  }

  const staffName = (id: string) => staff.find(p => p.id === id)?.full_name || 'Team member';
  const projectName = (id: string | null) => projects.find(p => p.id === id)?.name || 'Unassigned project';

  return <>
    <button type="button" onClick={() => setOpen(true)}
      className="fixed bottom-28 right-5 z-40 flex items-center gap-2 rounded-lg border border-slate-600 bg-[#17191e] px-3 py-2.5 text-xs font-medium text-white shadow-xl hover:bg-[#23252c]">
      <Database className="h-4 w-4" /> Live Tasks
    </button>
    {open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3"
      onMouseDown={e => { if (e.target === e.currentTarget) setOpen(false); }}>
      <section role="dialog" aria-modal="true" aria-label="Live workspace tasks"
        className="flex max-h-[94dvh] w-full max-w-4xl flex-col gap-4 overflow-y-auto rounded-xl border border-slate-700 bg-[#17191e] p-5 text-slate-100 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div><h2 className="text-lg font-semibold">Workspace tasks</h2>
            <p className="text-xs text-slate-400">Records from Supabase. Access is restricted by your actual database permissions.</p></div>
          <button aria-label="Close live tasks" onClick={() => setOpen(false)} className="rounded-md p-2 hover:bg-white/10"><X className="h-4 w-4"/></button>
        </div>
        <form onSubmit={createTask} className="grid gap-3 rounded-lg border border-slate-700 bg-[#101115] p-4 sm:grid-cols-2">
          <label className="text-xs text-slate-300 sm:col-span-2">Task title
            <input required maxLength={180} value={title} onChange={e => setTitle(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-600 bg-[#17191e] px-3 py-2 text-sm text-white" />
          </label>
          <label className="text-xs text-slate-300 sm:col-span-2">Description
            <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-600 bg-[#17191e] px-3 py-2 text-sm text-white" />
          </label>
          <label className="text-xs text-slate-300">Assignee
            <select value={assignee} onChange={e => setAssignee(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-600 bg-[#17191e] px-3 py-2 text-sm text-white">
              <option value={userId}>Myself</option>
              {staff.filter(p => p.id !== userId).map(p => <option key={p.id} value={p.id}>{p.full_name} ({p.role})</option>)}
            </select>
          </label>
          <label className="text-xs text-slate-300">Project
            <select value={project} onChange={e => setProject(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-600 bg-[#17191e] px-3 py-2 text-sm text-white">
              <option value="">No project</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label className="text-xs text-slate-300">Priority
            <select value={priority} onChange={e=>setPriority(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-600 bg-[#17191e] px-3 py-2 text-sm text-white">
              <option>Normal</option><option>High</option><option>Urgent</option><option>Low</option>
            </select>
          </label>
          <label className="text-xs text-slate-300">Due date
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-600 bg-[#17191e] px-3 py-2 text-sm text-white" />
          </label>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <button type="button" disabled={loading} onClick={() => void refresh()}
              className="inline-flex items-center gap-2 rounded-md border border-slate-600 px-3 py-2 text-xs disabled:opacity-50">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh</button>
            <button type="submit" disabled={creating || loading || !title.trim()}
              className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-xs font-semibold text-black disabled:opacity-50">
              <Plus className="h-3.5 w-3.5" /> {creating ? 'Creating...' : 'Create task'}</button>
          </div>
        </form>
        {error && <p role="alert" className="text-xs text-amber-200">{error}</p>}
        {loading && <p role="status" className="text-xs text-slate-400">Loading live records...</p>}
        {!loading && !error && tasks.length === 0 && <p className="text-sm text-slate-400">No tasks visible to your account.</p>}
        <div className="space-y-2">
          {tasks.map(t => <article key={t.id} className="flex flex-col gap-2 rounded-lg border border-slate-700 bg-[#101115] p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold">{t.title}</h3>
              <p className="mt-1 text-xs text-slate-400">{projectName(t.project_id)} · {staffName(t.assigned_to)}</p>
              {t.description && <p className="mt-1 line-clamp-2 text-xs text-slate-300">{t.description}</p>}
            </div>
            <div className="flex shrink-0 flex-wrap gap-2 text-xs text-slate-300">
              <span className="rounded-md border border-slate-600 px-2 py-1">{t.status}</span>
              <span className="rounded-md border border-slate-600 px-2 py-1">{t.priority}</span>
              {t.due_date && <span className="rounded-md border border-slate-600 px-2 py-1">{t.due_date}</span>}
            </div>
          </article>)}
        </div>
      </section>
    </div>}
  </>;
}
