import React from 'react';
import {
  BarChart3, BriefcaseBusiness, Users, CalendarDays, CheckSquare2, Command, FileText, Filter, FolderKanban,
  LayoutDashboard, LayoutGrid, Plus, Search, SlidersHorizontal, Sparkles, Table2,
} from 'lucide-react';
import type { ActiveView, Assignee, FilterState } from '../../types';
import { BUSINESS_MODULES, type BusinessModule } from '../views/BusinessModuleView';

interface Props {
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
const views: {id: ActiveView; label: string; Icon: React.ComponentType<{className?: string}>}[] = [
  {id: 'people', label: 'People', Icon: Users},
  {id: 'crm', label: 'CRM', Icon: BriefcaseBusiness},
  {id: 'dashboard', label: 'Overview', Icon: LayoutDashboard},
  {id: 'list', label: 'List', Icon: CheckSquare2},
  {id: 'board', label: 'Board', Icon: FolderKanban},
  {id: 'calendar', label: 'Calendar', Icon: CalendarDays},
  {id: 'gantt', label: 'Gantt', Icon: BarChart3},
  {id: 'table', label: 'Table', Icon: Table2},
  {id: 'docs', label: 'Docs', Icon: FileText},
  {id: 'whiteboard', label: 'Whiteboard', Icon: LayoutGrid},
];
export const OarkieHeader: React.FC<Props> = ({
  activeView, onViewChange, filterState, onFilterChange, spaceName, folderName, listName,
  totalTasks, onOpenNewTask, onOpenBrain, teamMembers,
}) => {
  const heading = activeView === 'dashboard' ? 'Executive workspace overview'
    : activeView in BUSINESS_MODULES ? BUSINESS_MODULES[activeView as BusinessModule].title
    : activeView === 'people' ? 'People operations & team directory'
    : activeView === 'crm' ? 'Client CRM & revenue pipeline'
    : activeView === 'docs' ? 'Workspace documents'
    : activeView === 'whiteboard' ? 'Collaborative whiteboard'
    : activeView === 'calendar' ? 'Delivery & team schedule'
    : activeView === 'gantt' ? 'Project timeline & milestones'
    : activeView === 'board' ? 'Project delivery board'
    : activeView === 'table' ? 'Task data table' : 'Active tasks & deliverables';
  return <header className="z-20 shrink-0 border-b border-[#303034] bg-[#0D0D0F] text-[#F7F7F8]">
    <div className="flex min-h-[45px] items-center justify-between gap-3 border-b border-[#303034] bg-[#171719] px-4 sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <div className="hidden items-center gap-1.5 sm:flex" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-white/15"/><span className="h-2.5 w-2.5 rounded-full bg-white/15"/><span className="h-2.5 w-2.5 rounded-full bg-white/15"/>
        </div>
        <span className="hidden h-4 w-px bg-[#303034] sm:block"/>
        <span className="truncate text-[11px] text-[#A0A0A8]"><span className="font-semibold text-white">ParroDash Workspace</span> <span className="mx-1">/</span> {activeView === 'dashboard' ? 'Dashboard' : spaceName}</span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button type="button" onClick={onOpenBrain} title="Parro AI" className="flex h-7 items-center gap-1.5 rounded border border-[#303034] bg-[#0D0D0F] px-2.5 text-[11px] text-[#A0A0A8] hover:text-white"><Sparkles className="h-3.5 w-3.5"/><span className="hidden sm:inline">Parro AI</span></button>
        <button type="button" onClick={onOpenNewTask} className="flex h-7 items-center gap-1.5 rounded bg-white px-2.5 text-[11px] font-semibold text-black hover:bg-zinc-200"><Plus className="h-3.5 w-3.5"/>New task</button>
      </div>
    </div>
    <div className="flex items-start justify-between gap-3 px-4 pb-2 pt-3 sm:px-6">
      <div className="min-w-0">
        <p className="mb-1 truncate text-[10px] uppercase tracking-[0.13em] text-[#777780]">{activeView === 'dashboard' ? 'Core workspace' : [spaceName, folderName, listName].filter(Boolean).join(' / ')}</p>
        <h1 className="truncate text-[15px] font-semibold tracking-tight text-white sm:text-lg">{heading}</h1>
      </div>
      <span className="hidden shrink-0 rounded border border-[#303034] bg-[#171719] px-2 py-1 text-[10px] text-[#A0A0A8] sm:inline-flex">{totalTasks} visible tasks</span>
    </div>
    <div className="flex items-center justify-between gap-2 border-t border-[#242428] px-3 sm:px-5">
      <div role="tablist" aria-label="Workspace views" className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto scrollbar-none">
        {views.map(({id,label,Icon}) => <button type="button" key={id} role="tab" aria-selected={activeView === id}
          onClick={() => onViewChange(id)}
          className={`flex shrink-0 items-center gap-1.5 border-b-2 px-2.5 py-2.5 text-[11px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-white ${activeView === id ? 'border-white text-white' : 'border-transparent text-[#777780] hover:text-white'}`}>
          <Icon className="h-3.5 w-3.5"/>{label}
        </button>)}
      </div>
    </div>
    {!(['dashboard','people','crm','docs','whiteboard',...Object.keys(BUSINESS_MODULES)].includes(activeView)) && <div className="flex flex-wrap items-center gap-2 border-t border-[#303034] bg-[#121214] px-4 py-2 sm:px-6">
      <label className="flex min-w-[160px] flex-1 items-center gap-2 rounded-md border border-[#303034] bg-[#0D0D0F] px-2.5 py-1.5 text-[#777780] sm:max-w-[280px]">
        <Search className="h-3.5 w-3.5 shrink-0"/><input value={filterState.searchQuery} onChange={e=>onFilterChange({searchQuery:e.target.value})} type="search" placeholder="Search tasks..." aria-label="Search tasks" className="w-full min-w-0 bg-transparent text-[11px] text-white outline-none placeholder:text-[#777780]" />
      </label>
      <div className="flex items-center gap-1 text-[11px] text-[#A0A0A8]"><Filter className="h-3.5 w-3.5"/>
        <select aria-label="Filter by priority" value={filterState.priority} onChange={e=>onFilterChange({priority:e.target.value as FilterState['priority']})} className="rounded-md border border-[#303034] bg-[#171719] px-2 py-1.5 text-[11px] text-[#A0A0A8]">
          <option value="all">All priorities</option><option value="urgent">Urgent</option><option value="high">High</option><option value="normal">Normal</option><option value="low">Low</option><option value="none">None</option>
        </select>
      </div>
      <div className="flex items-center gap-1 text-[#A0A0A8]"><SlidersHorizontal className="h-3.5 w-3.5"/>
        <select aria-label="Group tasks" value={filterState.groupBy} onChange={e=>onFilterChange({groupBy:e.target.value as FilterState['groupBy']})} className="rounded-md border border-[#303034] bg-[#171719] px-2 py-1.5 text-[11px] text-[#A0A0A8]">
          <option value="status">Group by status</option><option value="assignee">Assignee</option><option value="priority">Priority</option><option value="dueDate">Due date</option>
        </select>
      </div>
      <div className="flex items-center gap-1 text-[#A0A0A8]"><Command className="h-3.5 w-3.5"/>
        <select aria-label="Filter by assignee" value={filterState.assigneeId} onChange={e=>onFilterChange({assigneeId:e.target.value})} className="rounded-md border border-[#303034] bg-[#171719] px-2 py-1.5 text-[11px] text-[#A0A0A8]">
          <option value="all">All assignees</option>{teamMembers.map(member=><option key={member.id} value={member.id}>{member.name}</option>)}
        </select>
      </div>
    </div>}
  </header>;
};
