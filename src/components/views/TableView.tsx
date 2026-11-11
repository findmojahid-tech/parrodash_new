import React from 'react';
import { Flag, Play, Square, CheckSquare } from 'lucide-react';
import { Task, TaskStatus, Assignee, Priority } from '../../types';

interface TableViewProps {
  tasks: Task[];
  statuses: TaskStatus[];
  teamMembers: Assignee[];
  onSelectTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  activeTimerTaskId: string | null;
  onToggleTimer: (taskId: string) => void;
}

export const TableView: React.FC<TableViewProps> = ({
  tasks,
  statuses,
  teamMembers,
  onSelectTask,
  onUpdateTask,
  activeTimerTaskId,
  onToggleTimer,
}) => {
  const formatSeconds = (sec: number) => {
    if (!sec || sec <= 0) return '0h';
    const hrs = (sec / 3600).toFixed(1);
    return `${hrs}h`;
  };

  return (
    <div className="flex-1 overflow-auto bg-[#111317] select-none p-6">
      <div className="min-w-[1000px] border border-slate-800 rounded-xl overflow-hidden shadow-lg bg-[#14161b]">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-3 px-4 py-2.5 bg-[#181a20] border-b border-slate-800 text-[11px] font-bold text-slate-400">
          <div className="col-span-1">KEY</div>
          <div className="col-span-3">NAME</div>
          <div className="col-span-2">STATUS</div>
          <div className="col-span-1">PRIORITY</div>
          <div className="col-span-2">ASSIGNEES</div>
          <div className="col-span-1">DUE DATE</div>
          <div className="col-span-1 text-right">TIME LOGGED</div>
          <div className="col-span-1 text-right">POINTS</div>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-slate-800/60 text-xs">
          {tasks.map(task => {
            const status = statuses.find(s => s.id === task.statusId);
            const isTimerActive = activeTimerTaskId === task.id;

            return (
              <div
                key={task.id}
                onClick={() => onSelectTask(task)}
                className="grid grid-cols-12 gap-3 px-4 py-2 items-center hover:bg-slate-800/40 cursor-pointer transition-colors"
              >
                {/* Key */}
                <div className="col-span-1 font-mono font-bold text-white text-[11px]">
                  {task.key}
                </div>

                {/* Title */}
                <div className="col-span-3 font-medium text-slate-200 truncate hover:text-white">
                  {task.title}
                </div>

                {/* Status Dropdown */}
                <div className="col-span-2" onClick={e => e.stopPropagation()}>
                  <select
                    value={task.statusId}
                    onChange={e => onUpdateTask({ ...task, statusId: e.target.value })}
                    className="w-full text-xs font-semibold rounded px-2 py-1 text-white border-none cursor-pointer focus:ring-1 focus:ring-purple-500"
                    style={{ backgroundColor: status?.color || '#3b82f6' }}
                  >
                    {statuses.map(s => (
                      <option key={s.id} value={s.id} className="bg-[#181a20] text-white">
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div className="col-span-1" onClick={e => e.stopPropagation()}>
                  <select
                    value={task.priority}
                    onChange={e => onUpdateTask({ ...task, priority: e.target.value as Priority })}
                    className="bg-slate-900 border border-slate-700/80 rounded px-1.5 py-1 text-[11px] text-slate-200 capitalize w-full focus:outline-none"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="normal">Normal</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                {/* Assignees */}
                <div className="col-span-2 flex items-center -space-x-1.5">
                  {task.assigneeIds.map(id => {
                    const m = teamMembers.find(mem => mem.id === id);
                    if (!m) return null;
                    return (
                      <img
                        key={m.id}
                        src={m.avatar}
                        alt={m.name}
                        title={m.name}
                        className="w-5 h-5 rounded-full object-cover border border-[#14161b]"
                      />
                    );
                  })}
                </div>

                {/* Due Date */}
                <div className="col-span-1 text-[11px] text-slate-300 font-mono tabular-nums">
                  {task.dueDate || '-'}
                </div>

                {/* Time */}
                <div className="col-span-1 text-right flex items-center justify-end gap-1 font-mono tabular-nums">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onToggleTimer(task.id);
                    }}
                    className={`p-1 rounded ${
                      isTimerActive ? 'bg-rose-500 text-white animate-pulse' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {isTimerActive ? <Square className="w-2.5 h-2.5 fill-current" /> : <Play className="w-2.5 h-2.5 fill-current" />}
                  </button>
                  <span className="text-[11px] text-slate-300">{formatSeconds(task.loggedSeconds)}</span>
                </div>

                {/* Story Points */}
                <div className="col-span-1 text-right font-mono tabular-nums text-slate-400 font-bold">
                  {task.customFields.storyPoints || 0}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
