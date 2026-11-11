import React, { useMemo } from 'react';
import { ArrowUpRight, CalendarDays, CheckCheck, Clock3, FolderKanban, ListTodo, Plus, TrendingUp } from 'lucide-react';
import type { Task, ClickUpSpace, TaskStatus, Assignee } from '../../types';

type Props = {
  tasks: Task[];
  spaces: ClickUpSpace[];
  statuses: TaskStatus[];
  members: Assignee[];
  onOpenTask: (task: Task) => void;
  onNewTask: () => void;
  onViewTasks: () => void;
};

/** Dashboard is computed from the same Task[] as List, Board, and Calendar. */
export const DashboardView: React.FC<Props> = ({ tasks, spaces, statuses, members, onOpenTask, onNewTask, onViewTasks }) => {
  const summary = useMemo(() => {
    const doneIds = new Set(statuses.filter(s => s.category === 'done' || s.category === 'closed').map(s => s.id));
    const done = tasks.filter(t => doneIds.has(t.statusId));
    const active = tasks.filter(t => !doneIds.has(t.statusId));
    const today = new Date();
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const overdue = active.filter(t => t.dueDate && new Date(t.dueDate + 'T00:00:00').getTime() < day);
    const upcoming = active.filter(t => t.dueDate && new Date(t.dueDate + 'T00:00:00').getTime() >= day)
      .sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate))).slice(0, 5);
    const priority = active.filter(t => t.priority === 'urgent' || t.priority === 'high')
      .sort((a, b) => (a.priority === 'urgent' ? -1 : 0) - (b.priority === 'urgent' ? -1 : 0)).slice(0, 5);
    return { done, active, overdue, upcoming, priority, total: tasks.length };
  }, [tasks, statuses]);

  const metrics = [
    { label: 'Total tasks', number: summary.total, icon: ListTodo, detail: 'Across your workspace' },
    { label: 'In progress', number: summary.active.length, icon: Clock3, detail: 'Not marked complete' },
    { label: 'Completed', number: summary.done.length, icon: CheckCheck, detail: summary.total ? Math.round(summary.done.length * 100 / summary.total) + '% completion rate' : 'No tasks yet' },
    { label: 'Overdue', number: summary.overdue.length, icon: CalendarDays, detail: 'Needs attention' },
  ];
  const name = (id: string) => members.find(m => m.id === id)?.name || 'Unassigned';
  const status = (id: string) => statuses.find(s => s.id === id)?.name || 'TASK';
  const date = (value?: string) => value ? new Date(value + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No date';

  return <div className="h-full w-full overflow-y-auto bg-[#0f1115] text-slate-100">
    <div className="mx-auto max-w-7xl space-y-6 px-5 py-7 sm:px-7 lg:px-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            <span className="h-1.5 w-1.5 rounded-full bg-white" /> Workspace overview <span className="rounded border border-slate-700 px-1.5 py-0.5 text-[9px] tracking-normal">DEMO DATA</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[30px]">Good to see you.</h1>
          <p className="mt-2 text-sm text-slate-400">Everything happening across your workspace, all in one place.</p>
        </div>
        <button onClick={onNewTask} className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-xs font-semibold text-black transition-opacity hover:opacity-85"><Plus className="h-4 w-4"/> New task</button>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metrics.map(({ label, number, icon: Icon, detail }) => <div key={label} className="rounded-xl border border-slate-800 bg-[#17191e] p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-400"><span className="text-xs font-medium">{label}</span><Icon className="h-4 w-4 text-slate-400"/></div>
          <p className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">{number}</p>
          <p className="mt-2 text-[11px] text-slate-500">{detail}</p>
        </div>)}
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(300px,1fr)]">
        <section className="min-w-0 rounded-xl border border-slate-800 bg-[#17191e]">
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 px-5 py-4">
            <div><h2 className="text-sm font-semibold">Priority focus</h2><p className="mt-1 text-xs text-slate-500">High-impact work that needs your attention</p></div>
            <button onClick={onViewTasks} className="flex items-center gap-1 text-xs text-slate-300 hover:text-white">All tasks <ArrowUpRight className="h-4 w-4"/></button>
          </div>
          <div className="divide-y divide-slate-800/80">
            {summary.priority.length ? summary.priority.map(t => <button key={t.id} onClick={() => onOpenTask(t)} className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-white/[0.035]">
              <span className={'h-2 w-2 shrink-0 rounded-full ' + (t.priority === 'urgent' ? 'bg-rose-500' : 'bg-amber-400')}/>
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{t.title}</span><span className="mt-1 block truncate text-[11px] text-slate-500">{t.key} · {name(t.assigneeIds[0] || '')} · {status(t.statusId)}</span></span>
              <span className="shrink-0 text-[11px] text-slate-500">{date(t.dueDate)}</span><ArrowUpRight className="h-4 w-4 shrink-0 text-slate-600"/>
            </button>) : <p className="p-5 text-xs text-slate-400">No urgent or high priority tasks.</p>}
          </div>
        </section>
        <section className="min-w-0 rounded-xl border border-slate-800 bg-[#17191e]">
          <div className="border-b border-slate-800 px-5 py-4"><h2 className="text-sm font-semibold">Upcoming deadlines</h2><p className="mt-1 text-xs text-slate-500">Your next scheduled milestones</p></div>
          <div className="divide-y divide-slate-800/80">
            {summary.upcoming.length ? summary.upcoming.map(t => <button key={t.id} onClick={() => onOpenTask(t)} className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-white/[0.035]">
              <div className="flex h-10 w-12 shrink-0 flex-col items-center justify-center rounded-md border border-slate-700 bg-[#101115]">
                <span className="text-[9px] uppercase text-slate-500">{new Date(String(t.dueDate) + 'T00:00:00').toLocaleDateString('en', { month: 'short' })}</span>
                <span className="text-sm font-semibold">{new Date(String(t.dueDate) + 'T00:00:00').getDate()}</span>
              </div>
              <span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium">{t.title}</span><span className="mt-1 block truncate text-[11px] text-slate-500">{t.key}</span></span>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-600"/>
            </button>) : <p className="p-5 text-xs text-slate-400">No upcoming task deadlines.</p>}
          </div>
        </section>
      </div>
      <section className="rounded-xl border border-slate-800 bg-[#17191e] p-5">
        <div className="mb-5 flex items-center gap-2"><FolderKanban className="h-4 w-4 text-slate-400"/><h2 className="text-sm font-semibold">Spaces at a glance</h2><span className="ml-auto text-xs text-slate-500">{spaces.length} spaces</span></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {spaces.map(space => {
            const related = tasks.filter(t => t.spaceId === space.id);
            const complete = related.filter(t => statuses.some(s => s.id === t.statusId && (s.category === 'done' || s.category === 'closed'))).length;
            const percent = related.length ? Math.round(complete * 100 / related.length) : 0;
            return <div key={space.id} className="rounded-lg border border-slate-800 bg-[#101115] p-4">
              <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full border border-slate-500"/><span className="truncate text-sm font-medium">{space.name}</span></div>
              <p className="mt-3 line-clamp-2 min-h-8 text-xs text-slate-500">{space.description}</p>
              <div className="mt-4 flex justify-between text-[11px] text-slate-400"><span>{related.length} tasks</span><span>{percent}% complete</span></div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full bg-white transition-all" style={{width: percent + '%'}}/></div>
            </div>;
          })}
        </div>
      </section>
      <div className="flex items-center gap-2 pb-4 text-[11px] text-slate-500"><TrendingUp className="h-3.5 w-3.5"/> These numbers update instantly as you create, edit, or complete demo tasks.</div>
    </div>
  </div>;
};
