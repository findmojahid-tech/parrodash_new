import React, { useState } from 'react';
import {
  BarChart3, BriefcaseBusiness, Users, CalendarDays, ChevronDown, ChevronRight, CheckSquare2, Command,
  FileText, FolderKanban, LayoutDashboard, LayoutGrid, Menu, Moon, PanelLeftClose,
  PanelLeftOpen, Plus, RotateCcw, Search, Sparkles, Sun, X,
} from 'lucide-react';
import type { Assignee, ClickUpSpace } from '../../types';

interface Props {
  spaces: ClickUpSpace[];
  activeSpaceId: string | 'all';
  activeFolderId: string | null;
  activeListId: string | 'all';
  onSelectSpace: (id: string | 'all') => void;
  onSelectFolder: (id: string | null) => void;
  onSelectList: (id: string | 'all') => void;
  currentUser: Assignee;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onOpenCommandPalette: () => void;
  onOpenBrain: () => void;
  onOpenNewTask: () => void;
  onResetData: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onSelectDocs: () => void;
  onSelectWhiteboard: () => void;
  onSelectDashboard: () => void;
  onSelectTasks: () => void;
  onSelectBoard: () => void;
  onSelectCalendar: () => void;
  onSelectPeople: () => void;
  onSelectCrm: () => void;
  activeView: string;
}
export const OarkieSidebar: React.FC<Props> = ({
  spaces, activeSpaceId, activeFolderId, activeListId, onSelectSpace, onSelectFolder,
  onSelectList, currentUser, isDarkMode, onToggleTheme, onOpenCommandPalette,
  onOpenBrain, onOpenNewTask, onResetData, isCollapsed, onToggleCollapse,
  onSelectDocs, onSelectWhiteboard, onSelectDashboard, onSelectTasks,
  onSelectBoard, onSelectCalendar, onSelectPeople, onSelectCrm, activeView,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedSpaces, setExpandedSpaces] = useState<Record<string, boolean>>({});
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const closeOnMobile = () => setMobileOpen(false);
  const nav = [
    { label: 'Dashboard', Icon: LayoutDashboard, current: activeView === 'dashboard', click: onSelectDashboard },
    { label: 'Projects', Icon: FolderKanban, current: activeView === 'gantt' || activeView === 'board', click: onSelectBoard },
    { label: 'Tasks & Inbox', Icon: CheckSquare2, current: ['list', 'table'].includes(activeView), click: onSelectTasks },
    { label: 'HR & People', Icon: Users, current: activeView === 'people', click: onSelectPeople },
    { label: 'Client CRM', Icon: BriefcaseBusiness, current: activeView === 'crm', click: onSelectCrm },
    { label: 'Calendar', Icon: CalendarDays, current: activeView === 'calendar', click: onSelectCalendar },
    { label: 'Docs', Icon: FileText, current: activeView === 'docs', click: onSelectDocs },
    { label: 'Whiteboard', Icon: LayoutGrid, current: activeView === 'whiteboard', click: onSelectWhiteboard },
    { label: 'Parro AI', Icon: Sparkles, current: false, click: onOpenBrain },
  ];
  function pick(action: () => void) { action(); closeOnMobile(); }
  const selectSpace = (id: string) => {
    onSelectSpace(id); onSelectFolder(null); onSelectList('all'); onSelectTasks(); closeOnMobile();
  };
  const selectList = (spaceId: string, folderId: string | null, id: string) => {
    onSelectSpace(spaceId); onSelectFolder(folderId); onSelectList(id); onSelectTasks(); closeOnMobile();
  };
  const navItem = (label: string, Icon: React.ComponentType<{className?: string}>, current: boolean, click: () => void) => (
    <button key={label} title={label} aria-current={current ? 'page' : undefined} onClick={() => pick(click)}
      className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[12px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-white ${current ? 'bg-white text-black' : 'text-[#A0A0A8] hover:bg-[#252529] hover:text-white'}`}>
      <Icon className="h-[15px] w-[15px] shrink-0" />
      {!isCollapsed && <span className="truncate">{label}</span>}
    </button>
  );
  const content = <div className="flex h-full min-h-0 flex-col bg-[#121214]">
    <div className="shrink-0 border-b border-[#303034] p-3">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#58585e] bg-white text-[11px] font-black tracking-tight text-black">PD</span>
        {!isCollapsed && <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-white">ParroDash</p><p className="truncate text-[10px] text-[#777780]">TPARRO Workspace</p></div>}
        <button aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} onClick={onToggleCollapse} className="hidden rounded p-1.5 text-[#777780] hover:bg-[#252529] hover:text-white md:block">
          {isCollapsed ? <PanelLeftOpen className="h-4 w-4"/> : <PanelLeftClose className="h-4 w-4"/>}
        </button>
        <button aria-label="Close navigation" className="rounded p-1.5 text-[#A0A0A8] md:hidden" onClick={closeOnMobile}><X className="h-4 w-4"/></button>
      </div>
    </div>
    <div className="shrink-0 space-y-1 border-b border-[#303034] p-2">
      <button title="Search workspace" onClick={() => pick(onOpenCommandPalette)} className="flex w-full items-center gap-2 rounded-md border border-[#303034] bg-[#0D0D0F] px-2.5 py-2 text-xs text-[#777780] hover:text-white">
        <Search className="h-3.5 w-3.5"/>{!isCollapsed && <><span className="flex-1 text-left">Search workspace</span><kbd className="rounded border border-[#303034] px-1 text-[10px]">⌘K</kbd></>}
      </button>
    </div>
    <nav aria-label="Workspace navigation" className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
      {!isCollapsed && <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-[#777780]">Core workspace</p>}
      <div className="space-y-0.5">{nav.map(n => navItem(n.label, n.Icon, n.current, n.click))}</div>
      <div className="my-4 border-t border-[#303034]"/>
      {!isCollapsed && <div className="mb-2 flex items-center justify-between px-2"><p className="text-[10px] font-semibold uppercase tracking-widest text-[#777780]">Spaces & projects</p><button aria-label="New task" title="New task" onClick={() => pick(onOpenNewTask)} className="text-[#777780] hover:text-white"><Plus className="h-3.5 w-3.5"/></button></div>}
      <div className="space-y-1">
        {spaces.map(space => {
          const expanded = expandedSpaces[space.id] ?? (activeSpaceId === space.id);
          return <div key={space.id}>
            <div className="flex items-center gap-1">
              <button title={space.name} onClick={() => selectSpace(space.id)} className={`min-w-0 flex flex-1 items-center gap-2 rounded px-2 py-2 text-left text-[11px] ${activeSpaceId === space.id ? 'bg-[#252529] text-white' : 'text-[#A0A0A8] hover:bg-[#202023] hover:text-white'}`}>
                <span className="h-1.5 w-1.5 shrink-0 rounded-full border border-[#777780] bg-[#e5e5e5]" />
                {!isCollapsed && <span className="truncate">{space.name}</span>}
              </button>
              {!isCollapsed && <button aria-label={expanded ? 'Collapse ' + space.name : 'Expand ' + space.name} onClick={() => setExpandedSpaces(p => ({...p, [space.id]: !expanded}))} className="p-1 text-[#777780] hover:text-white">{expanded ? <ChevronDown className="h-3 w-3"/> : <ChevronRight className="h-3 w-3"/>}</button>}
            </div>
            {!isCollapsed && expanded && <div className="ml-3 border-l border-[#303034] pl-2">
              {space.folders.map(folder => {
                const folderOpen = expandedFolders[folder.id] ?? activeFolderId === folder.id;
                return <div key={folder.id}>
                  <button onClick={() => setExpandedFolders(p => ({...p, [folder.id]: !folderOpen}))} className="flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-left text-[11px] text-[#A0A0A8] hover:bg-[#202023] hover:text-white">{folderOpen ? <ChevronDown className="h-3 w-3"/> : <ChevronRight className="h-3 w-3"/>}<span className="truncate">{folder.name}</span></button>
                  {folderOpen && folder.lists.map(list => <button key={list.id} onClick={() => selectList(space.id, folder.id, list.id)} className={`ml-4 block w-[calc(100%-1rem)] truncate rounded px-2 py-1.5 text-left text-[11px] ${activeListId === list.id && activeSpaceId === space.id ? 'bg-[#303034] text-white' : 'text-[#777780] hover:text-white'}`}>{list.name}</button>)}
                </div>;
              })}
              {space.lists.map(list => <button key={list.id} onClick={() => selectList(space.id, null, list.id)} className={`block w-full truncate rounded px-2 py-1.5 text-left text-[11px] ${activeListId === list.id && activeSpaceId === space.id ? 'bg-[#303034] text-white' : 'text-[#777780] hover:text-white'}`}>{list.name}</button>)}
            </div>}
          </div>;
        })}
      </div>
    </nav>
    <div className="shrink-0 space-y-2 border-t border-[#303034] bg-[#111113] p-3">
      {!isCollapsed && <div className="flex items-center justify-between text-[10px] text-[#777780]"><span>Workspace mode</span><span className="rounded border border-[#303034] px-1.5 py-0.5 text-white">DEMO</span></div>}
      <div className="flex items-center gap-2">
        <img src={currentUser.avatar} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" />
        {!isCollapsed && <div className="min-w-0 flex-1"><p className="truncate text-[11px] font-semibold text-white">{currentUser.name}</p><p className="truncate text-[10px] text-[#777780]">{currentUser.role}</p></div>}
        <button title="Theme" aria-label="Toggle theme" onClick={onToggleTheme} className="rounded p-1.5 text-[#A0A0A8] hover:text-white">{isDarkMode ? <Sun className="h-4 w-4"/> : <Moon className="h-4 w-4"/>}</button>
        {!isCollapsed && <button title="Reset demo data" aria-label="Reset demo data" onClick={() => { setWorkspaceMenuOpen(!workspaceMenuOpen); }} className="rounded p-1.5 text-[#A0A0A8] hover:text-white"><RotateCcw className="h-3.5 w-3.5"/></button>}
      </div>
      {workspaceMenuOpen && !isCollapsed && <button onClick={() => {onResetData();setWorkspaceMenuOpen(false);}} className="w-full rounded border border-[#303034] px-2 py-2 text-left text-[11px] text-[#A0A0A8] hover:text-white">Reset local demo data</button>}
    </div>
  </div>;
  return <>
    <button onClick={() => setMobileOpen(true)} aria-label="Open navigation" className="fixed bottom-4 left-4 z-40 rounded-lg border border-[#4B4B52] bg-[#171719] p-3 text-white shadow-xl md:hidden"><Menu className="h-5 w-5"/></button>
    {mobileOpen && <div className="fixed inset-0 z-50 bg-black/70 md:hidden" onMouseDown={e => {if(e.target === e.currentTarget)closeOnMobile();}}><aside className="h-full w-[min(86vw,280px)] border-r border-[#303034]">{content}</aside></div>}
    <aside className={`hidden h-screen shrink-0 border-r border-[#303034] md:block ${isCollapsed ? 'w-[68px]' : 'w-[230px]'}`}>{content}</aside>
  </>;
};
