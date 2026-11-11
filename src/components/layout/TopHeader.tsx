import React, { useState } from 'react';
import {
  List,
  Kanban,
  Calendar,
  BarChart2,
  Table,
  FileText,
  LayoutGrid,
  Search,
  Filter,
  Sparkles,
  Plus,
  SlidersHorizontal,
  ChevronRight,
  X,
} from 'lucide-react';
import { ActiveView, FilterState, Assignee } from '../../types';

interface TopHeaderProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
  filterState: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  spaceName: string;
  folderName?: string;
  listName: string;
  totalTasks: number;
  onOpenNewTask: () => void;
  onOpenBrain: () => void;
  teamMembers: Assignee[];
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  activeView,
  onViewChange,
  filterState,
  onFilterChange,
  spaceName,
  folderName,
  listName,
  totalTasks,
  onOpenNewTask,
  onOpenBrain,
  teamMembers,
}) => {
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showGroupByDropdown, setShowGroupByDropdown] = useState(false);

  const views: { id: ActiveView; label: string; icon: React.ReactNode }[] = [
    { id: 'list', label: 'List', icon: <List className="w-3.5 h-3.5" /> },
    { id: 'board', label: 'Board', icon: <Kanban className="w-3.5 h-3.5" /> },
    { id: 'calendar', label: 'Calendar', icon: <Calendar className="w-3.5 h-3.5" /> },
    { id: 'gantt', label: 'Gantt', icon: <BarChart2 className="w-3.5 h-3.5" /> },
    { id: 'table', label: 'Table', icon: <Table className="w-3.5 h-3.5" /> },
    { id: 'docs', label: 'Docs', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'whiteboard', label: 'Whiteboard', icon: <LayoutGrid className="w-3.5 h-3.5" /> },
  ];

  const hasActiveFilters =
    filterState.statusId !== 'all' ||
    filterState.priority !== 'all' ||
    filterState.assigneeId !== 'all' ||
    filterState.searchQuery.trim().length > 0;

  return (
    <header className="bg-[#0f1115] text-slate-200 border-b border-slate-800/60 shrink-0 select-none">
      {/* Top Bar: Breadcrumb + AI + Add Task */}
      <div className="flex items-center justify-between px-6 py-2 border-b border-slate-800/40">
        {/* Breadcrumb Trail */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 min-w-0">
          <span className="text-slate-300 font-medium">{spaceName}</span>
          {folderName && (
            <>
              <span className="text-slate-600">/</span>
              <span className="text-slate-400">{folderName}</span>
            </>
          )}
          <span className="text-slate-600">/</span>
          <span className="text-purple-400 font-medium">{listName}</span>
          <span className="text-[11px] font-mono text-slate-500 tabular-nums ml-1">
            ({totalTasks})
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenBrain}
            className="flex items-center gap-1 px-2.5 py-1 rounded text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 text-xs font-medium transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Brain AI</span>
          </button>

          <button
            onClick={onOpenNewTask}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Views Navigation & Quick Filters */}
      <div className="flex items-center justify-between px-6 py-1 gap-4 overflow-x-auto">
        {/* Minimalist View Tabs */}
        <nav className="flex items-center gap-0.5">
          {views.map(view => {
            const isActive = activeView === view.id;
            return (
              <button
                key={view.id}
                onClick={() => onViewChange(view.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'text-white font-medium bg-white/[0.08]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                }`}
              >
                {view.icon}
                <span>{view.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Minimal Search & Filters */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Quiet Search Input */}
          <div className="relative flex items-center">
            <Search className="w-3 h-3 text-slate-500 absolute left-2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search..."
              value={filterState.searchQuery}
              onChange={e => onFilterChange({ searchQuery: e.target.value })}
              className="bg-transparent border border-transparent hover:border-slate-800 focus:border-slate-700 rounded pl-6 pr-5 py-0.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none w-36 transition-all"
            />
            {filterState.searchQuery && (
              <button
                onClick={() => onFilterChange({ searchQuery: '' })}
                className="absolute right-1 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Group By selector */}
          <div className="relative">
            <button
              onClick={() => setShowGroupByDropdown(!showGroupByDropdown)}
              className="flex items-center gap-1 px-2 py-0.5 text-xs rounded text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition-colors"
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span className="capitalize">{filterState.groupBy}</span>
            </button>
            {showGroupByDropdown && (
              <div className="absolute right-0 top-7 bg-[#14161b] border border-slate-700/80 rounded-lg shadow-xl py-1 w-32 z-40 text-xs">
                {(['status', 'assignee', 'priority', 'dueDate'] as const).map(group => (
                  <button
                    key={group}
                    onClick={() => {
                      onFilterChange({ groupBy: group });
                      setShowGroupByDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-1 capitalize hover:bg-white/[0.06] ${
                      filterState.groupBy === group ? 'text-purple-400 font-medium' : 'text-slate-300'
                    }`}
                  >
                    {group}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter Popover */}
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded transition-colors ${
                hasActiveFilters
                  ? 'text-purple-300 bg-purple-500/10 font-medium'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              <Filter className="w-3 h-3" />
              <span>Filter</span>
              {hasActiveFilters && (
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              )}
            </button>

            {showFilterDropdown && (
              <div className="absolute right-0 top-7 bg-[#14161b] border border-slate-700/80 rounded-lg shadow-xl p-3 w-56 z-40 space-y-2.5 text-xs">
                <div className="flex items-center justify-between font-medium text-slate-300">
                  <span>Filter</span>
                  {hasActiveFilters && (
                    <button
                      onClick={() =>
                        onFilterChange({
                          statusId: 'all',
                          priority: 'all',
                          assigneeId: 'all',
                          tag: 'all',
                          searchQuery: '',
                        })
                      }
                      className="text-[11px] text-purple-400 hover:text-purple-300"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase">Status</span>
                  <select
                    value={filterState.statusId}
                    onChange={e => onFilterChange({ statusId: e.target.value })}
                    className="w-full bg-[#181a20] border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="all">All</option>
                    <option value="status-todo">To Do</option>
                    <option value="status-in-progress">In Progress</option>
                    <option value="status-in-review">In Review</option>
                    <option value="status-complete">Complete</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase">Priority</span>
                  <select
                    value={filterState.priority}
                    onChange={e => onFilterChange({ priority: e.target.value as any })}
                    className="w-full bg-[#181a20] border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="all">All</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="normal">Normal</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div className="pt-1 flex justify-end">
                  <button
                    onClick={() => setShowFilterDropdown(false)}
                    className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded font-medium"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
