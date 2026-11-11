import React, { useState } from 'react';
import { X, Plus, Calendar, Flag, User } from 'lucide-react';
import { ClickUpSpace, Assignee, Priority, Task } from '../../types';

interface NewTaskModalProps {
  spaces: ClickUpSpace[];
  activeSpaceId: string;
  activeListId: string;
  teamMembers: Assignee[];
  onClose: () => void;
  onCreateTask: (newTask: Partial<Task>) => void;
}

export const NewTaskModal: React.FC<NewTaskModalProps> = ({
  spaces,
  activeSpaceId,
  activeListId,
  teamMembers,
  onClose,
  onCreateTask,
}) => {
  const defaultSpace = spaces.find(s => s.id === activeSpaceId) || spaces[0];
  const [selectedSpaceId, setSelectedSpaceId] = useState(defaultSpace?.id || spaces[0].id);
  const currentSpace = spaces.find(s => s.id === selectedSpaceId) || spaces[0];

  const allSpaceLists = [
    ...currentSpace.lists,
    ...currentSpace.folders.flatMap(f => f.lists),
  ];

  const [selectedListId, setSelectedListId] = useState(
    allSpaceLists[0]?.id || 'list-active-sprint'
  );
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('normal');
  const [dueDate, setDueDate] = useState('2026-11-15');
  const [assignedMemberIds, setAssignedMemberIds] = useState<string[]>([]);
  const [storyPoints, setStoryPoints] = useState(3);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onCreateTask({
      title: title.trim(),
      description: description.trim(),
      spaceId: selectedSpaceId,
      listId: selectedListId,
      statusId: currentSpace.statuses[0]?.id || 'status-todo',
      priority,
      dueDate,
      assigneeIds: assignedMemberIds,
      customFields: {
        storyPoints,
        progressPercent: 0,
      },
    });

    onClose();
  };

  const toggleAssignee = (id: string) => {
    setAssignedMemberIds(prev =>
      prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#14161b] border border-slate-800/80 rounded-xl shadow-2xl overflow-hidden select-none">
        {/* Header */}
        <div className="px-5 py-3 border-b border-slate-800/50 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-200">New Task</span>
          <button
            onClick={onClose}
            className="p-1 text-slate-500 hover:text-white rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          {/* Location row */}
          <div className="flex items-center gap-2 text-slate-400">
            <span>In</span>
            <select
              value={selectedSpaceId}
              onChange={e => {
                setSelectedSpaceId(e.target.value);
                const newSpace = spaces.find(s => s.id === e.target.value);
                if (newSpace) {
                  const lists = [
                    ...newSpace.lists,
                    ...newSpace.folders.flatMap(f => f.lists),
                  ];
                  if (lists[0]) setSelectedListId(lists[0].id);
                }
              }}
              className="bg-[#1a1d24] border border-slate-700/60 rounded px-2 py-0.5 text-white focus:outline-none"
            >
              {spaces.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <span>/</span>
            <select
              value={selectedListId}
              onChange={e => setSelectedListId(e.target.value)}
              className="bg-[#1a1d24] border border-slate-700/60 rounded px-2 py-0.5 text-white focus:outline-none"
            >
              {allSpaceLists.map(l => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <input
            type="text"
            autoFocus
            placeholder="Task title..."
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full bg-transparent text-sm font-semibold text-white placeholder-slate-500 focus:outline-none py-1"
          />

          {/* Description */}
          <textarea
            rows={3}
            placeholder="Description..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full bg-transparent text-xs text-slate-300 placeholder-slate-600 focus:outline-none resize-none font-mono py-1"
          />

          {/* Properties Row */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/40 text-slate-400">
            <div>
              <span className="text-[10px] block mb-1">Priority</span>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as Priority)}
                className="w-full bg-[#1a1d24] border border-slate-700/60 rounded px-1.5 py-1 text-white capitalize focus:outline-none"
              >
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <span className="text-[10px] block mb-1">Due date</span>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full bg-[#1a1d24] border border-slate-700/60 rounded px-1.5 py-1 text-white focus:outline-none"
              />
            </div>

            <div>
              <span className="text-[10px] block mb-1">Points</span>
              <input
                type="number"
                min={1}
                max={21}
                value={storyPoints}
                onChange={e => setStoryPoints(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-[#1a1d24] border border-slate-700/60 rounded px-1.5 py-1 text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Assignees */}
          <div className="pt-2">
            <span className="text-[10px] text-slate-500 block mb-1.5">Assignee</span>
            <div className="flex flex-wrap gap-1">
              {teamMembers.map(m => {
                const isSelected = assignedMemberIds.includes(m.id);
                return (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => toggleAssignee(m.id)}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition-colors ${
                      isSelected
                        ? 'bg-purple-500/20 text-purple-200'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <img src={m.avatar} alt={m.name} className="w-3.5 h-3.5 rounded-full object-cover" />
                    <span>{m.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-800/40 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-slate-400 hover:text-white rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded font-medium"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
