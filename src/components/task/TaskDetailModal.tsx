import React, { useState } from 'react';
import {
  X,
  Trash2,
  Calendar,
  Flag,
  Play,
  Square,
  Clock,
  Plus,
  Sparkles,
  Send,
  User,
  Copy,
  Check,
} from 'lucide-react';
import { Task, TaskStatus, Assignee, Priority, Subtask, ChecklistItem } from '../../types';
import { requestBrainAI } from '../../services/brainService';

interface TaskDetailModalProps {
  task: Task | null;
  statuses: TaskStatus[];
  teamMembers: Assignee[];
  onClose: () => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  activeTimerTaskId: string | null;
  onToggleTimer: (taskId: string) => void;
  currentUser: Assignee;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = (props) => {
  if (!props.task) return null;
  return <TaskDetailContent {...props} task={props.task} />;
};

const TaskDetailContent: React.FC<TaskDetailModalProps & { task: Task }> = ({
  task,
  statuses,
  teamMembers,
  onClose,
  onUpdateTask,
  onDeleteTask,
  activeTimerTaskId,
  onToggleTimer,
  currentUser,
}) => {

  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newChecklistText, setNewChecklistText] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const [isGeneratingSubtasks, setIsGeneratingSubtasks] = useState(false);
  const [isWritingDescription, setIsWritingDescription] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const isTimerActive = activeTimerTaskId === task.id;

  const handleTitleChange = (title: string) => {
    onUpdateTask({ ...task, title, updatedAt: new Date().toISOString() });
  };

  const handleDescriptionChange = (description: string) => {
    onUpdateTask({ ...task, description, updatedAt: new Date().toISOString() });
  };

  const handleStatusChange = (statusId: string) => {
    onUpdateTask({ ...task, statusId, updatedAt: new Date().toISOString() });
  };

  const handlePriorityChange = (priority: Priority) => {
    onUpdateTask({ ...task, priority, updatedAt: new Date().toISOString() });
  };

  const handleDueDateChange = (dueDate: string) => {
    onUpdateTask({ ...task, dueDate, updatedAt: new Date().toISOString() });
  };

  const handleToggleAssignee = (memberId: string) => {
    const exists = task.assigneeIds.includes(memberId);
    const newAssignees = exists
      ? task.assigneeIds.filter(id => id !== memberId)
      : [...task.assigneeIds, memberId];
    onUpdateTask({ ...task, assigneeIds: newAssignees, updatedAt: new Date().toISOString() });
  };

  const handleToggleSubtask = (subtaskId: string) => {
    const updated = task.subtasks.map(s =>
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    );
    onUpdateTask({ ...task, subtasks: updated, updatedAt: new Date().toISOString() });
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    const newSub: Subtask = {
      id: `sub-${Date.now()}`,
      title: newSubtaskTitle.trim(),
      completed: false,
      estimatedHours: 2,
    };
    onUpdateTask({
      ...task,
      subtasks: [...task.subtasks, newSub],
      updatedAt: new Date().toISOString(),
    });
    setNewSubtaskTitle('');
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    onUpdateTask({
      ...task,
      subtasks: task.subtasks.filter(s => s.id !== subtaskId),
      updatedAt: new Date().toISOString(),
    });
  };

  const handleAiGenerateSubtasks = async () => {
    setIsGeneratingSubtasks(true);
    try {
      const resp = await requestBrainAI({
        type: 'generate_subtasks',
        taskTitle: task.title,
        taskDescription: task.description,
      });

      if (resp.success && Array.isArray(resp.result)) {
        const generatedSubs: Subtask[] = resp.result.map((item: any, i: number) => ({
          id: `sub-ai-${Date.now()}-${i}`,
          title: item.title || 'Action item',
          completed: false,
          estimatedHours: item.estimatedHours || 2,
        }));

        onUpdateTask({
          ...task,
          subtasks: [...task.subtasks, ...generatedSubs],
          updatedAt: new Date().toISOString(),
        });
      }
    } finally {
      setIsGeneratingSubtasks(false);
    }
  };

  const handleAiWriteDescription = async () => {
    setIsWritingDescription(true);
    try {
      const resp = await requestBrainAI({
        type: 'write_description',
        taskTitle: task.title,
        taskDescription: task.description,
      });

      if (resp.success && typeof resp.result === 'string') {
        onUpdateTask({
          ...task,
          description: resp.result,
          updatedAt: new Date().toISOString(),
        });
      }
    } finally {
      setIsWritingDescription(false);
    }
  };

  const handleAiSummarize = async () => {
    setIsSummarizing(true);
    try {
      const resp = await requestBrainAI({
        type: 'summarize_task',
        taskTitle: task.title,
        taskDescription: task.description,
        contextData: {
          subtasksCount: task.subtasks.length,
          completedCount: task.subtasks.filter(s => s.completed).length,
          status: statuses.find(s => s.id === task.statusId)?.name,
        },
      });

      if (resp.success && typeof resp.result === 'string') {
        setAiSummary(resp.result);
      }
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleToggleChecklist = (chkId: string) => {
    const updated = task.checklists.map(c =>
      c.id === chkId ? { ...c, completed: !c.completed } : c
    );
    onUpdateTask({ ...task, checklists: updated, updatedAt: new Date().toISOString() });
  };

  const handleAddChecklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;
    const newChk: ChecklistItem = {
      id: `chk-${Date.now()}`,
      text: newChecklistText.trim(),
      completed: false,
    };
    onUpdateTask({
      ...task,
      checklists: [...task.checklists, newChk],
      updatedAt: new Date().toISOString(),
    });
    setNewChecklistText('');
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    const newComment = {
      id: `comm-${Date.now()}`,
      authorId: currentUser.id,
      text: newCommentText.trim(),
      createdAt: 'Just now',
    };
    onUpdateTask({
      ...task,
      comments: [...task.comments, newComment],
      updatedAt: new Date().toISOString(),
    });
    setNewCommentText('');
  };

  const copyTaskKey = () => {
    navigator.clipboard.writeText(task.key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const completedSubtasks = task.subtasks.filter(s => s.completed).length;
  const currentStatus = statuses.find(s => s.id === task.statusId);

  const formatSeconds = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-2xl bg-[#111317] h-full border-l border-[#303034] flex flex-col shadow-2xl overflow-hidden select-none">
        {/* Minimal Header */}
        <div className="px-6 py-2.5 border-b border-slate-800/50 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-mono text-white">{task.key}</span>
            <button
              onClick={copyTaskKey}
              className="p-1 hover:text-white rounded"
              title="Copy ID"
            >
              {copiedKey ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (confirm(`Delete ${task.key}?`)) {
                  onDeleteTask(task.id);
                  onClose();
                }
              }}
              className="p-1 hover:text-rose-400 rounded"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:text-white rounded"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          {/* Title input */}
          <input
            type="text"
            value={task.title}
            onChange={e => handleTitleChange(e.target.value)}
            placeholder="Task title..."
            className="w-full bg-transparent text-lg font-semibold text-white border-none focus:outline-none"
          />

          {/* Minimal Properties Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-2 border-y border-slate-800/40 text-xs">
            {/* Status Selector */}
            <div className="space-y-1">
              <span className="text-[11px] text-slate-500">Status</span>
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: currentStatus?.color }}
                />
                <select
                  value={task.statusId}
                  onChange={e => handleStatusChange(e.target.value)}
                  className="bg-transparent text-xs text-slate-200 border-none focus:outline-none cursor-pointer"
                >
                  {statuses.map(s => (
                    <option key={s.id} value={s.id} className="bg-[#181a20]">
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Priority */}
            <div className="space-y-1">
              <span className="text-[11px] text-slate-500">Priority</span>
              <select
                value={task.priority}
                onChange={e => handlePriorityChange(e.target.value as Priority)}
                className="bg-transparent text-xs text-slate-200 capitalize border-none focus:outline-none cursor-pointer"
              >
                <option value="urgent" className="bg-[#181a20]">Urgent</option>
                <option value="high" className="bg-[#181a20]">High</option>
                <option value="normal" className="bg-[#181a20]">Normal</option>
                <option value="low" className="bg-[#181a20]">Low</option>
              </select>
            </div>

            {/* Due Date */}
            <div className="space-y-1">
              <span className="text-[11px] text-slate-500">Due date</span>
              <input
                type="date"
                value={task.dueDate || ''}
                onChange={e => handleDueDateChange(e.target.value)}
                className="bg-transparent text-xs text-slate-300 border-none focus:outline-none"
              />
            </div>

            {/* Time Tracker */}
            <div className="space-y-1">
              <span className="text-[11px] text-slate-500">Time tracked</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onToggleTimer(task.id)}
                  className={`p-1 rounded ${
                    isTimerActive ? 'text-rose-400' : 'text-slate-400 hover:text-white'
                  }`}
                  title={isTimerActive ? 'Stop' : 'Start'}
                >
                  {isTimerActive ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                </button>
                <span className="font-mono text-xs tabular-nums text-slate-300">
                  {formatSeconds(task.loggedSeconds)}
                </span>
              </div>
            </div>
          </div>

          {/* Assignees */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-slate-500">Assignees</span>
            <div className="flex flex-wrap gap-1.5 items-center">
              {teamMembers.map(member => {
                const isAssigned = task.assigneeIds.includes(member.id);
                return (
                  <button
                    key={member.id}
                    onClick={() => handleToggleAssignee(member.id)}
                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs transition-colors ${
                      isAssigned
                        ? 'bg-white/10 text-white'
                        : 'opacity-40 hover:opacity-100 text-slate-400'
                    }`}
                  >
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-4 h-4 rounded-full object-cover"
                    />
                    <span>{member.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Description</span>
              <button
                onClick={handleAiWriteDescription}
                disabled={isWritingDescription}
                className="flex items-center gap-1 text-[11px] text-white hover:text-white transition-colors"
              >
                <Sparkles className="w-3 h-3" />
                <span>{isWritingDescription ? 'Writing...' : 'AI auto-write'}</span>
              </button>
            </div>

            <textarea
              rows={5}
              value={task.description}
              onChange={e => handleDescriptionChange(e.target.value)}
              placeholder="Add details..."
              className="w-full bg-transparent text-xs text-slate-300 leading-relaxed border-none focus:outline-none font-mono resize-none"
            />
          </div>

          {/* Subtasks Section */}
          <div className="space-y-2 pt-2 border-t border-slate-800/40">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">
                Subtasks ({completedSubtasks}/{task.subtasks.length})
              </span>
              <button
                onClick={handleAiGenerateSubtasks}
                disabled={isGeneratingSubtasks}
                className="flex items-center gap-1 text-[11px] text-white hover:text-white transition-colors"
              >
                <Sparkles className="w-3 h-3" />
                <span>{isGeneratingSubtasks ? 'Generating...' : 'AI subtasks'}</span>
              </button>
            </div>

            <div className="space-y-1">
              {task.subtasks.map(sub => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between py-1 text-xs text-slate-300 group"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={sub.completed}
                      onChange={() => handleToggleSubtask(sub.id)}
                      className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-900 text-purple-600 focus:ring-0 cursor-pointer"
                    />
                    <span className={sub.completed ? 'line-through text-slate-500' : ''}>
                      {sub.title}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteSubtask(sub.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              <form onSubmit={handleAddSubtask}>
                <input
                  type="text"
                  placeholder="+ Add subtask..."
                  value={newSubtaskTitle}
                  onChange={e => setNewSubtaskTitle(e.target.value)}
                  className="w-full bg-transparent py-1 text-xs text-slate-400 placeholder-slate-600 focus:outline-none"
                />
              </form>
            </div>
          </div>

          {/* Activity / Comments */}
          <div className="space-y-3 pt-3 border-t border-slate-800/40 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Activity</span>
              <button
                onClick={handleAiSummarize}
                disabled={isSummarizing}
                className="flex items-center gap-1 text-[11px] text-white hover:text-white"
              >
                <Sparkles className="w-3 h-3" />
                <span>{isSummarizing ? 'Summarizing...' : 'Summarize'}</span>
              </button>
            </div>

            {aiSummary && (
              <div className="p-2.5 rounded bg-white/10 border border-[#4B4B52] text-white text-xs whitespace-pre-line">
                {aiSummary}
              </div>
            )}

            <div className="space-y-2">
              {task.comments.map(c => {
                const author = teamMembers.find(m => m.id === c.authorId);
                return (
                  <div key={c.id} className="flex gap-2">
                    <img
                      src={author?.avatar || currentUser.avatar}
                      alt={author?.name || 'User'}
                      className="w-5 h-5 rounded-full object-cover shrink-0 mt-0.5"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-300">{author?.name}</span>
                        <span className="text-[10px] text-slate-600">{c.createdAt}</span>
                      </div>
                      <p className="text-slate-400 mt-0.5">{c.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleAddComment} className="flex gap-2 pt-1">
              <input
                type="text"
                placeholder="Write a comment..."
                value={newCommentText}
                onChange={e => setNewCommentText(e.target.value)}
                className="flex-1 bg-white/[0.03] border border-[#303034] rounded px-2.5 py-1 text-xs text-slate-200 placeholder-slate-600 focus:outline-none"
              />
              <button
                type="submit"
                className="px-2.5 py-1 bg-white hover:bg-zinc-200 text-black rounded text-xs font-medium"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
