import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Play,
  Square,
  Flag,
  Trash2,
  CheckSquare,
} from 'lucide-react';
import { Task, TaskStatus, Assignee, Priority } from '../../types';

interface ListViewProps {
  tasks: Task[];
  statuses: TaskStatus[];
  teamMembers: Assignee[];
  onSelectTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onQuickAddTask: (statusId: string, title: string) => void;
  activeTimerTaskId: string | null;
  onToggleTimer: (taskId: string) => void;
  groupBy: 'status' | 'assignee' | 'priority' | 'dueDate';
}

export const ListView: React.FC<ListViewProps> = ({
  tasks,
  statuses,
  teamMembers,
  onSelectTask,
  onUpdateTask,
  onDeleteTask,
  onQuickAddTask,
  activeTimerTaskId,
  onToggleTimer,
  groupBy,
}) => {
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [inlineTaskInput, setInlineTaskInput] = useState<Record<string, string>>({});
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const handleCheckboxChange = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTaskIds(prev =>
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  const handleSelectAllInGroup = (groupTaskIds: string[]) => {
    const allSelected = groupTaskIds.every(id => selectedTaskIds.includes(id));
    if (allSelected) {
      setSelectedTaskIds(prev => prev.filter(id => !groupTaskIds.includes(id)));
    } else {
      setSelectedTaskIds(prev => Array.from(new Set([...prev, ...groupTaskIds])));
    }
  };

  const handleInlineAddSubmit = (statusId: string, e: React.FormEvent) => {
    e.preventDefault();
    const title = (inlineTaskInput[statusId] || '').trim();
    if (!title) return;
    onQuickAddTask(statusId, title);
    setInlineTaskInput(prev => ({ ...prev, [statusId]: '' }));
  };

  const handleBatchStatus = (newStatusId: string) => {
    selectedTaskIds.forEach(id => {
      const task = tasks.find(t => t.id === id);
      if (task) {
        onUpdateTask({ ...task, statusId: newStatusId });
      }
    });
    setSelectedTaskIds([]);
  };

  const handleBatchPriority = (newPriority: Priority) => {
    selectedTaskIds.forEach(id => {
      const task = tasks.find(t => t.id === id);
      if (task) {
        onUpdateTask({ ...task, priority: newPriority });
      }
    });
    setSelectedTaskIds([]);
  };

  const handleBatchDelete = () => {
    selectedTaskIds.forEach(id => onDeleteTask(id));
    setSelectedTaskIds([]);
  };

  const getGroups = () => {
    if (groupBy === 'priority') {
      const priorities: Priority[] = ['urgent', 'high', 'normal', 'low', 'none'];
      return priorities.map(p => ({
        id: p,
        name: p.toUpperCase(),
        color:
          p === 'urgent'
            ? '#ef4444'
            : p === 'high'
            ? '#f97316'
            : p === 'normal'
            ? '#3b82f6'
            : '#94a3b8',
        tasks: tasks.filter(t => t.priority === p),
      }));
    }

    if (groupBy === 'assignee') {
      const groups = teamMembers.map(m => ({
        id: m.id,
        name: m.name,
        color: m.color,
        tasks: tasks.filter(t => t.assigneeIds.includes(m.id)),
      }));
      const unassigned = tasks.filter(t => t.assigneeIds.length === 0);
      if (unassigned.length > 0) {
        groups.push({
          id: 'unassigned',
          name: 'Unassigned',
          color: '#64748b',
          tasks: unassigned,
        });
      }
      return groups;
    }

    return statuses.map(s => ({
      id: s.id,
      name: s.name,
      color: s.color,
      tasks: tasks.filter(t => t.statusId === s.id),
    }));
  };

  const groups = getGroups();

  const getPriorityIndicator = (priority: Priority) => {
    switch (priority) {
      case 'urgent':
        return <Flag className="w-3.5 h-3.5 text-red-400 fill-red-400 shrink-0" />;
      case 'high':
        return <Flag className="w-3.5 h-3.5 text-orange-400 fill-orange-400 shrink-0" />;
      case 'normal':
        return <Flag className="w-3.5 h-3.5 text-blue-400 fill-blue-400 shrink-0" />;
      case 'low':
        return <Flag className="w-3.5 h-3.5 text-slate-500 shrink-0" />;
      default:
        return <span className="text-slate-600">-</span>;
    }
  };

  const formatSeconds = (sec: number) => {
    if (!sec || sec <= 0) return null;
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  const formatDueDate = (dateStr?: string) => {
    if (!dateStr) return <span className="text-slate-600">-</span>;
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isPast = date < today;
    const isToday = date.toDateString() === today.toDateString();

    const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    if (isToday) return <span className="text-amber-400">Today</span>;
    if (isPast) return <span className="text-rose-400">{formatted}</span>;
    return <span className="text-slate-400">{formatted}</span>;
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-3 select-none">
      {/* Table Headers */}
      <div className="grid grid-cols-12 gap-3 px-3 py-1.5 text-[11px] font-medium text-slate-500 border-b border-[#303034]">
        <div className="col-span-6">Name</div>
        <div className="col-span-2">Assignee</div>
        <div className="col-span-2">Due Date</div>
        <div className="col-span-1">Priority</div>
        <div className="col-span-1 text-right">Time</div>
      </div>

      {/* Groups Container */}
      <div className="space-y-4 mt-2">
        {groups.map(group => {
          const isCollapsed = !!collapsedGroups[group.id];
          const groupTaskIds = group.tasks.map(t => t.id);
          const allGroupSelected =
            groupTaskIds.length > 0 && groupTaskIds.every(id => selectedTaskIds.includes(id));

          return (
            <div key={group.id} className="space-y-0.5">
              {/* Minimal Group Header */}
              <div className="flex items-center justify-between py-1 px-1.5 text-xs text-slate-400 group/hdr">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="p-0.5 text-slate-500 hover:text-slate-300"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </button>

                  <input
                    type="checkbox"
                    checked={allGroupSelected}
                    onChange={() => handleSelectAllInGroup(groupTaskIds)}
                    className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-900 text-white focus:ring-0 cursor-pointer"
                  />

                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: group.color }}
                  />

                  <span className="font-semibold text-slate-300 text-xs tracking-tight">
                    {group.name}
                  </span>

                  <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                    {group.tasks.length}
                  </span>
                </div>

                <button
                  onClick={() => {
                    if (isCollapsed) toggleGroup(group.id);
                    setInlineTaskInput(prev => ({ ...prev, [group.id]: '' }));
                  }}
                  className="opacity-0 group-hover/hdr:opacity-100 flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-300 transition-opacity"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add task</span>
                </button>
              </div>

              {/* Task Rows */}
              {!isCollapsed && (
                <div className="divide-y divide-slate-800/30 border-y border-[#303034]">
                  {group.tasks.map(task => {
                    const isSelected = selectedTaskIds.includes(task.id);
                    const isTimerActive = activeTimerTaskId === task.id;
                    const completedSubtasks = task.subtasks.filter(s => s.completed).length;
                    const timeLoggedStr = formatSeconds(task.loggedSeconds);

                    return (
                      <div
                        key={task.id}
                        onClick={() => onSelectTask(task)}
                        className={`grid grid-cols-12 gap-3 px-3 py-2 text-xs items-center cursor-pointer transition-colors group/row ${
                          isSelected
                            ? 'bg-white/10 text-white'
                            : 'hover:bg-white/[0.02] text-slate-300'
                        }`}
                      >
                        {/* Task Title & Key */}
                        <div className="col-span-6 flex items-center gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onClick={e => e.stopPropagation()}
                            onChange={e => handleCheckboxChange(task.id, e as any)}
                            className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-900 text-white focus:ring-0 cursor-pointer shrink-0"
                          />

                          {/* Minimal status circle */}
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              const currentIndex = statuses.findIndex(s => s.id === task.statusId);
                              const nextStatus = statuses[(currentIndex + 1) % statuses.length];
                              onUpdateTask({ ...task, statusId: nextStatus.id });
                            }}
                            title="Advance status"
                            className="w-3.5 h-3.5 rounded-full border border-slate-600 hover:border-white transition-colors shrink-0 flex items-center justify-center"
                            style={{
                              backgroundColor:
                                task.statusId === 'status-complete' ? '#10b981' : 'transparent',
                            }}
                          >
                            {task.statusId === 'status-complete' && (
                              <span className="w-1.5 h-1.5 rounded-full bg-white" />
                            )}
                          </button>

                          <span className="text-[11px] font-mono text-slate-500 shrink-0">
                            {task.key}
                          </span>

                          <span className="truncate font-medium text-slate-200 group-hover/row:text-white">
                            {task.title}
                          </span>

                          {task.subtasks.length > 0 && (
                            <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                              {completedSubtasks}/{task.subtasks.length}
                            </span>
                          )}
                        </div>

                        {/* Assignees */}
                        <div className="col-span-2 flex items-center -space-x-1 overflow-hidden">
                          {task.assigneeIds.length === 0 ? (
                            <span className="text-slate-600 text-[11px]">-</span>
                          ) : (
                            task.assigneeIds.map(assigneeId => {
                              const member = teamMembers.find(m => m.id === assigneeId);
                              if (!member) return null;
                              return (
                                <img
                                  key={member.id}
                                  src={member.avatar}
                                  alt={member.name}
                                  title={member.name}
                                  referrerPolicy="no-referrer"
                                  className="w-4.5 h-4.5 rounded-full object-cover border border-[#0f1115]"
                                />
                              );
                            })
                          )}
                        </div>

                        {/* Due Date */}
                        <div className="col-span-2 text-[11px]">
                          {formatDueDate(task.dueDate)}
                        </div>

                        {/* Priority */}
                        <div className="col-span-1">
                          {getPriorityIndicator(task.priority)}
                        </div>

                        {/* Time */}
                        <div className="col-span-1 flex items-center justify-end gap-1.5 font-mono text-[11px] tabular-nums">
                          {timeLoggedStr && (
                            <span className="text-slate-400">{timeLoggedStr}</span>
                          )}
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              onToggleTimer(task.id);
                            }}
                            title={isTimerActive ? 'Stop Timer' : 'Start Timer'}
                            className={`p-1 rounded opacity-0 group-hover/row:opacity-100 transition-opacity ${
                              isTimerActive
                                ? 'opacity-100 text-rose-400'
                                : 'text-slate-500 hover:text-white'
                            }`}
                          >
                            {isTimerActive ? (
                              <Square className="w-3 h-3 fill-current" />
                            ) : (
                              <Play className="w-3 h-3 fill-current" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Inline quick add */}
                  <form
                    onSubmit={e => handleInlineAddSubmit(group.id, e)}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-500 hover:text-slate-400"
                  >
                    <Plus className="w-3 h-3 text-slate-500" />
                    <input
                      type="text"
                      placeholder={`New task in ${group.name.toLowerCase()}...`}
                      value={inlineTaskInput[group.id] || ''}
                      onChange={e =>
                        setInlineTaskInput(prev => ({ ...prev, [group.id]: e.target.value }))
                      }
                      className="bg-transparent text-xs text-slate-200 placeholder-slate-600 focus:outline-none flex-1"
                    />
                  </form>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Minimal Batch Actions Bar */}
      {selectedTaskIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#14161b] border border-slate-700/80 rounded-lg shadow-xl px-4 py-2 flex items-center gap-3 z-40 text-xs">
          <span className="font-medium text-slate-300">
            {selectedTaskIds.length} selected
          </span>

          <div className="h-3 w-px bg-slate-700" />

          {/* Status buttons */}
          <div className="flex items-center gap-1">
            {statuses.map(s => (
              <button
                key={s.id}
                onClick={() => handleBatchStatus(s.id)}
                className="px-2 py-0.5 rounded text-[11px] text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                {s.name}
              </button>
            ))}
          </div>

          <div className="h-3 w-px bg-slate-700" />

          <button
            onClick={handleBatchDelete}
            className="text-rose-400 hover:text-rose-300 transition-colors"
          >
            Delete
          </button>

          <button
            onClick={() => setSelectedTaskIds([])}
            className="text-slate-500 hover:text-slate-300 ml-1"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
