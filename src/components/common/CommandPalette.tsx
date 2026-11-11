import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Sparkles,
  Plus,
  Sun,
  FileText,
  Layers,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { Task, ClickUpSpace, DocPage, ActiveView } from '../../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  spaces: ClickUpSpace[];
  docs: DocPage[];
  onSelectTask: (task: Task) => void;
  onOpenNewTask: () => void;
  onOpenBrain: () => void;
  onToggleTheme: () => void;
  onViewChange: (view: ActiveView) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  tasks,
  spaces,
  docs,
  onSelectTask,
  onOpenNewTask,
  onOpenBrain,
  onToggleTheme,
  onViewChange,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const normalizedQuery = query.toLowerCase().trim();

  const defaultActions = [
    {
      id: 'action-create',
      title: 'Create Task',
      icon: <Plus className="w-3.5 h-3.5 text-purple-400" />,
      category: 'Action',
      run: () => {
        onClose();
        onOpenNewTask();
      },
    },
    {
      id: 'action-brain',
      title: 'ClickUp Brain AI',
      icon: <Sparkles className="w-3.5 h-3.5 text-purple-400" />,
      category: 'AI',
      run: () => {
        onClose();
        onOpenBrain();
      },
    },
    {
      id: 'action-theme',
      title: 'Toggle Theme',
      icon: <Sun className="w-3.5 h-3.5 text-slate-400" />,
      category: 'Preference',
      run: () => {
        onClose();
        onToggleTheme();
      },
    },
    {
      id: 'action-view-board',
      title: 'Go to Board View',
      icon: <Layers className="w-3.5 h-3.5 text-slate-400" />,
      category: 'View',
      run: () => {
        onClose();
        onViewChange('board');
      },
    },
    {
      id: 'action-view-gantt',
      title: 'Go to Gantt Timeline',
      icon: <Clock className="w-3.5 h-3.5 text-slate-400" />,
      category: 'View',
      run: () => {
        onClose();
        onViewChange('gantt');
      },
    },
  ];

  const matchedTasks = tasks
    .filter(
      t =>
        t.title.toLowerCase().includes(normalizedQuery) ||
        t.key.toLowerCase().includes(normalizedQuery)
    )
    .slice(0, 5)
    .map(t => ({
      id: t.id,
      title: `${t.key}: ${t.title}`,
      icon: <span className="font-mono text-[10px] text-purple-400">{t.key}</span>,
      category: 'Task',
      run: () => {
        onClose();
        onSelectTask(t);
      },
    }));

  const matchedDocs = docs
    .filter(d => d.title.toLowerCase().includes(normalizedQuery))
    .slice(0, 3)
    .map(d => ({
      id: d.id,
      title: d.title,
      icon: <FileText className="w-3.5 h-3.5 text-slate-400" />,
      category: 'Doc',
      run: () => {
        onClose();
        onViewChange('docs');
      },
    }));

  const allItems = normalizedQuery
    ? [...matchedTasks, ...matchedDocs, ...defaultActions.filter(a => a.title.toLowerCase().includes(normalizedQuery))]
    : [...defaultActions, ...matchedTasks];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, allItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + allItems.length) % Math.max(1, allItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allItems[selectedIndex]) {
        allItems[selectedIndex].run();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-24 p-4 select-none"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg bg-[#14161c] border border-slate-800/80 rounded-xl shadow-2xl overflow-hidden flex flex-col text-xs"
      >
        {/* Search header */}
        <div className="flex items-center px-3.5 py-2.5 border-b border-slate-800/60 gap-2.5">
          <Search className="w-4 h-4 text-slate-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search..."
            className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
          />
          <kbd className="text-[10px] font-mono text-slate-500">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto p-1.5 space-y-0.5">
          {allItems.length === 0 ? (
            <div className="p-4 text-center text-slate-500 text-xs">
              No results found
            </div>
          ) : (
            allItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.run}
                  className={`flex items-center justify-between px-2.5 py-2 rounded-md cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-purple-500/15 text-white'
                      : 'text-slate-300 hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-5 h-5 flex items-center justify-center shrink-0">
                      {item.icon}
                    </div>
                    <span className="truncate">{item.title}</span>
                  </div>

                  <span className="text-[10px] text-slate-500 uppercase">{item.category}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
