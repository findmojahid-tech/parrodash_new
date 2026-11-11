import React, { useState } from 'react';
import {
  Plus,
  Flag,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { Task, TaskStatus, Assignee, Priority } from '../../types';

interface BoardViewProps {
  tasks: Task[];
  statuses: TaskStatus[];
  teamMembers: Assignee[];
  onSelectTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onQuickAddTask: (statusId: string, title: string) => void;
}

export const BoardView: React.FC<BoardViewProps> = ({
  tasks,
  statuses,
  teamMembers,
  onSelectTask,
  onUpdateTask,
  onQuickAddTask,
}) => {
  const [addingInColumn, setAddingInColumn] = useState<string | null>(null);
  const [quickTitle, setQuickTitle] = useState('');

  const handleAddSubmit = (statusId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    onQuickAddTask(statusId, quickTitle.trim());
    setQuickTitle('');
    setAddingInColumn(null);
  };

  const moveTask = (task: Task, direction: 'prev' | 'next', e: React.MouseEvent) => {
    e.stopPropagation();
    const currentIndex = statuses.findIndex(s => s.id === task.statusId);
    if (direction === 'next' && currentIndex < statuses.length - 1) {
      onUpdateTask({ ...task, statusId: statuses[currentIndex + 1].id });
    } else if (direction === 'prev' && currentIndex > 0) {
      onUpdateTask({ ...task, statusId: statuses[currentIndex - 1].id });
    }
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'urgent':
        return '#ef4444';
      case 'high':
        return '#f97316';
      case 'normal':
        return '#3b82f6';
      default:
        return '#64748b';
    }
  };

  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 select-none flex gap-4 h-full">
      {statuses.map((status, index) => {
        const columnTasks = tasks.filter(t => t.statusId === status.id);
        const isAdding = addingInColumn === status.id;

        return (
          <div
            key={status.id}
            className="w-72 shrink-0 bg-[#121419]/70 rounded-lg border border-[#303034] flex flex-col max-h-full"
          >
            {/* Minimal Column Header */}
            <div className="p-2.5 border-b border-[#303034] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: status.color }}
                />
                <h3 className="text-xs font-semibold text-slate-300 tracking-tight">
                  {status.name}
                </h3>
                <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                  {columnTasks.length}
                </span>
              </div>

              <button
                onClick={() => setAddingInColumn(status.id)}
                className="p-1 text-slate-500 hover:text-slate-300 rounded"
                title="Add task"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Cards Container */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {isAdding && (
                <form
                  onSubmit={e => handleAddSubmit(status.id, e)}
                  className="bg-[#181a20] p-2 rounded-md border border-slate-700/80 space-y-2 shadow-sm"
                >
                  <input
                    type="text"
                    autoFocus
                    placeholder="Task title..."
                    value={quickTitle}
                    onChange={e => setQuickTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                  <div className="flex justify-end gap-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setAddingInColumn(null)}
                      className="px-2 py-0.5 text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-2.5 py-0.5 bg-white hover:bg-zinc-200 text-black font-medium rounded"
                    >
                      Save
                    </button>
                  </div>
                </form>
              )}

              {columnTasks.map(task => {
                const completedSubtasks = task.subtasks.filter(s => s.completed).length;

                return (
                  <div
                    key={task.id}
                    onClick={() => onSelectTask(task)}
                    className="group bg-[#16181e] hover:bg-[#1a1d24] border border-[#303034] hover:border-slate-700/80 rounded-md p-2.5 space-y-2 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-500">
                        {task.key}
                      </span>
                      <Flag
                        className="w-3 h-3"
                        style={{
                          fill: task.priority !== 'low' ? getPriorityColor(task.priority) : 'none',
                          color: getPriorityColor(task.priority),
                        }}
                      />
                    </div>

                    <h4 className="text-xs font-medium text-slate-200 group-hover:text-white leading-snug line-clamp-2">
                      {task.title}
                    </h4>

                    {/* Card Footer */}
                    <div className="flex items-center justify-between pt-1 border-t border-[#303034] text-[11px] text-slate-500">
                      <div>
                        {task.subtasks.length > 0 && (
                          <span className="font-mono text-[10px]">
                            {completedSubtasks}/{task.subtasks.length}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center -space-x-1">
                          {task.assigneeIds.map(id => {
                            const member = teamMembers.find(m => m.id === id);
                            if (!member) return null;
                            return (
                              <img
                                key={member.id}
                                src={member.avatar}
                                alt={member.name}
                                referrerPolicy="no-referrer"
                                className="w-4 h-4 rounded-full object-cover border border-[#16181e]"
                              />
                            );
                          })}
                        </div>

                        {/* Move Buttons */}
                        <div className="opacity-0 group-hover:opacity-100 flex items-center transition-opacity">
                          {index > 0 && (
                            <button
                              onClick={e => moveTask(task, 'prev', e)}
                              className="p-0.5 hover:bg-slate-700 text-slate-400 hover:text-white rounded"
                            >
                              <ArrowLeft className="w-2.5 h-2.5" />
                            </button>
                          )}
                          {index < statuses.length - 1 && (
                            <button
                              onClick={e => moveTask(task, 'next', e)}
                              className="p-0.5 hover:bg-slate-700 text-slate-400 hover:text-white rounded"
                            >
                              <ArrowRight className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
