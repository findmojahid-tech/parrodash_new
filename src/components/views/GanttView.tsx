import React from 'react';
import { Calendar, Flag, CheckSquare, Clock } from 'lucide-react';
import { Task, TaskStatus, Assignee } from '../../types';

interface GanttViewProps {
  tasks: Task[];
  statuses: TaskStatus[];
  teamMembers: Assignee[];
  onSelectTask: (task: Task) => void;
}

export const GanttView: React.FC<GanttViewProps> = ({
  tasks,
  statuses,
  teamMembers,
  onSelectTask,
}) => {
  // Timeline spanning Nov 1 to Nov 22, 2026
  const startDate = new Date(2026, 10, 1);
  const totalDays = 22;
  const days: { date: Date; dateStr: string; label: string; isWeekend: boolean; isToday: boolean }[] = [];

  for (let i = 0; i < totalDays; i++) {
    const d = new Date(2026, 10, i + 1);
    const dateStr = `2026-11-${String(i + 1).padStart(2, '0')}`;
    const dayOfWeek = d.getDay();
    days.push({
      date: d,
      dateStr,
      label: `${d.toLocaleDateString('en-US', { weekday: 'narrow' })} ${i + 1}`,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      isToday: dateStr === '2026-11-11',
    });
  }

  // Calculate bar position and width (in percentage)
  const getTaskBarSpan = (task: Task) => {
    const taskStart = task.startDate ? new Date(task.startDate) : new Date(2026, 10, 5);
    const taskEnd = task.dueDate ? new Date(task.dueDate) : new Date(2026, 10, 12);

    // Days relative to Nov 1
    const startDayIndex = Math.max(0, Math.min(totalDays - 1, Math.floor((taskStart.getTime() - startDate.getTime()) / (1000 * 3600 * 24))));
    const endDayIndex = Math.max(startDayIndex, Math.min(totalDays - 1, Math.floor((taskEnd.getTime() - startDate.getTime()) / (1000 * 3600 * 24))));

    const durationDays = endDayIndex - startDayIndex + 1;

    const leftPercent = (startDayIndex / totalDays) * 100;
    const widthPercent = (durationDays / totalDays) * 100;

    return { leftPercent, widthPercent, durationDays };
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#111317] overflow-hidden select-none">
      {/* Top Banner */}
      <div className="px-6 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-white" />
            <span>Interactive Gantt Timeline (Sprint 42)</span>
          </h2>
          <span className="text-xs text-slate-400 font-mono">Nov 1 – Nov 22, 2026</span>
        </div>
        <div className="text-xs text-slate-400 flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-purple-500" />
            <span>Today (Nov 11)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-800" />
            <span>Weekend</span>
          </div>
        </div>
      </div>

      {/* Gantt Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane: Tasks Sidebar */}
        <div className="w-72 shrink-0 border-r border-slate-800 bg-[#14161b] flex flex-col">
          <div className="h-10 px-4 flex items-center text-[11px] font-bold text-slate-400 border-b border-slate-800">
            TASK NAME & ASSIGNEE
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {tasks.map(task => {
              const status = statuses.find(s => s.id === task.statusId);
              return (
                <div
                  key={task.id}
                  onClick={() => onSelectTask(task)}
                  className="h-14 px-4 flex items-center justify-between hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-bold text-white">{task.key}</span>
                      <span className="text-xs font-semibold text-slate-200 truncate">{task.title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span className="font-medium" style={{ color: status?.color }}>
                        {status?.name}
                      </span>
                      <span>·</span>
                      <span>{task.customFields.storyPoints || 3} pts</span>
                    </div>
                  </div>

                  <div className="flex items-center -space-x-1 shrink-0">
                    {task.assigneeIds.map(id => {
                      const m = teamMembers.find(mem => mem.id === id);
                      if (!m) return null;
                      return (
                        <img
                          key={m.id}
                          src={m.avatar}
                          alt={m.name}
                          className="w-5 h-5 rounded-full object-cover border border-[#14161b]"
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Pane: Timeline Chart Grid */}
        <div className="flex-1 flex flex-col overflow-x-auto overflow-y-auto relative">
          {/* Timeline Header Days */}
          <div className="h-10 flex border-b border-slate-800 sticky top-0 bg-[#14161b] z-20 shrink-0 min-w-[700px]">
            {days.map(day => (
              <div
                key={day.dateStr}
                className={`flex-1 border-r border-[#303034] flex items-center justify-center text-[11px] font-mono tabular-nums ${
                  day.isToday
                    ? 'bg-purple-900/30 text-white font-bold border-purple-500/50'
                    : day.isWeekend
                    ? 'bg-slate-900/60 text-slate-500'
                    : 'text-slate-400'
                }`}
              >
                {day.label}
              </div>
            ))}
          </div>

          {/* Timeline Rows */}
          <div className="divide-y divide-slate-800/60 relative min-w-[700px] flex-1">
            {/* Background Column Grid Lines */}
            <div className="absolute inset-0 flex pointer-events-none">
              {days.map(day => (
                <div
                  key={`bg-${day.dateStr}`}
                  className={`flex-1 border-r border-[#303034] ${
                    day.isToday ? 'bg-purple-500/5' : day.isWeekend ? 'bg-slate-900/20' : ''
                  }`}
                />
              ))}
            </div>

            {/* Task Bars */}
            {tasks.map(task => {
              const { leftPercent, widthPercent, durationDays } = getTaskBarSpan(task);
              const status = statuses.find(s => s.id === task.statusId);

              return (
                <div key={task.id} className="h-14 relative flex items-center px-1">
                  <div
                    onClick={() => onSelectTask(task)}
                    className="absolute h-8 rounded-lg shadow-md cursor-pointer flex items-center px-2.5 text-white text-xs font-semibold overflow-hidden transition-all hover:brightness-110 hover:shadow-lg group"
                    style={{
                      left: `${leftPercent}%`,
                      width: `${Math.max(widthPercent, 5)}%`,
                      backgroundColor: status?.color || '#8b5cf6',
                    }}
                  >
                    {/* Progress Fill Indicator */}
                    <div
                      className="absolute inset-y-0 left-0 bg-black/20 pointer-events-none"
                      style={{ width: `${task.customFields.progressPercent || 0}%` }}
                    />

                    <span className="relative z-10 truncate font-mono text-[11px] tracking-tight">
                      {task.key}: {task.title}
                    </span>

                    <span className="relative z-10 ml-auto text-[10px] opacity-80 pl-2 shrink-0 font-mono">
                      {durationDays}d
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
