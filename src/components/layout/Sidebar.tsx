import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Search,
  Layers,
  FileText,
  Sparkles,
  Moon,
  Sun,
  RotateCcw,
  LayoutGrid,
  LayoutDashboard,
  Folder,
  FolderOpen,
  List as ListIcon,
  CheckCircle2,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { ClickUpSpace, Assignee } from '../../types';

interface SidebarProps {
  spaces: ClickUpSpace[];
  activeSpaceId: string | 'all';
  activeFolderId: string | null;
  activeListId: string | 'all';
  onSelectSpace: (spaceId: string | 'all') => void;
  onSelectFolder: (folderId: string | null) => void;
  onSelectList: (listId: string | 'all') => void;
  currentUser: Assignee;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onOpenCommandPalette: () => void;
  onOpenBrain: () => void;
  onOpenNewTask: () => void;
  onResetData: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onSelectDashboard: () => void;
  onSelectDocs: () => void;
  onSelectWhiteboard: () => void;
  activeView: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  spaces,
  activeSpaceId,
  activeFolderId,
  activeListId,
  onSelectSpace,
  onSelectFolder,
  onSelectList,
  currentUser,
  isDarkMode,
  onToggleTheme,
  onOpenCommandPalette,
  onOpenBrain,
  onOpenNewTask,
  onResetData,
  isCollapsed,
  onToggleCollapse,
  onSelectDashboard,
  onSelectDocs,
  onSelectWhiteboard,
  activeView,
}) => {
  const [expandedSpaces, setExpandedSpaces] = useState<Record<string, boolean>>({
    'space-eng': true,
    'space-product': true,
    'space-growth': false,
  });

  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'folder-sprint42': true,
    'folder-cu3': true,
  });

  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);

  const toggleSpace = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedSpaces(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleFolder = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (isCollapsed) {
    return (
      <aside className="w-12 shrink-0 h-screen bg-[#0e1013] border-r border-slate-800/60 flex flex-col items-center py-3 justify-between z-30 select-none">
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={onToggleCollapse}
            title="Expand Sidebar"
            className="w-7 h-7 rounded-md bg-purple-600/90 hover:bg-purple-600 flex items-center justify-center text-white transition-colors"
          >
            <span className="font-bold text-[11px] tracking-tight">CU</span>
          </button>

          <button
            onClick={onOpenNewTask}
            title="Create Task"
            className="w-7 h-7 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.06] flex items-center justify-center transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenCommandPalette}
            title="Search (⌘K)"
            className="w-7 h-7 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.06] flex items-center justify-center transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onOpenBrain}
            title="ClickUp Brain"
            className="w-7 h-7 rounded-md text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 flex items-center justify-center transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>

          <div className="w-5 h-px bg-slate-800/80 my-0.5" />

          <button
            onClick={() => onSelectSpace('all')}
            title="Everything"
            className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
              activeSpaceId === 'all' && activeView !== 'docs' && activeView !== 'whiteboard'
                ? 'bg-purple-500/15 text-purple-300'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
          </button>

          <button onClick={onSelectDashboard} title="Dashboard" className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${activeView === 'dashboard' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'}`}><LayoutDashboard className="w-3.5 h-3.5" /></button>

          <button
            onClick={onSelectDocs}
            title="Docs"
            className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
              activeView === 'docs'
                ? 'bg-purple-500/15 text-purple-300'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onSelectWhiteboard}
            title="Whiteboard"
            className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
              activeView === 'whiteboard'
                ? 'bg-purple-500/15 text-purple-300'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-2">
          <button
            onClick={onToggleTheme}
            title={isDarkMode ? 'Light mode' : 'Dark mode'}
            className="w-7 h-7 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.06] flex items-center justify-center transition-colors"
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onToggleCollapse}
            title="Expand Sidebar"
            className="w-7 h-7 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.06] flex items-center justify-center transition-colors"
          >
            <PanelLeftOpen className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-56 shrink-0 h-screen bg-[#0e1013] text-slate-300 border-r border-slate-800/60 flex flex-col justify-between z-30 select-none overflow-hidden">
      {/* Top Section */}
      <div className="flex flex-col">
        {/* Minimal Workspace Header */}
        <div className="px-3 py-2.5 border-b border-slate-800/60 relative">
          <div
            onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
            className="flex items-center justify-between p-1 rounded-md hover:bg-white/[0.04] cursor-pointer transition-colors group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-5 h-5 rounded bg-purple-600 flex items-center justify-center text-white shrink-0">
                <span className="font-bold text-[10px]">C</span>
              </div>
              <span className="text-xs font-semibold text-slate-100 truncate">Acme Workspace</span>
            </div>
            <div className="flex items-center gap-0.5">
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-colors" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCollapse();
                }}
                className="p-0.5 text-slate-500 hover:text-slate-300 rounded"
                title="Collapse Sidebar"
              >
                <PanelLeftClose className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Workspace dropdown popover */}
          {showWorkspaceMenu && (
            <div className="absolute top-11 left-2.5 right-2.5 bg-[#14161b] border border-slate-700/80 rounded-lg shadow-xl p-1.5 z-50 text-xs">
              <div className="flex items-center justify-between p-1.5 rounded bg-purple-500/10 text-purple-200 font-medium mb-1">
                <span className="truncate">Acme Workspace</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              </div>
              <div className="p-1.5 rounded hover:bg-white/[0.04] text-slate-300 cursor-pointer truncate">
                Personal Sandbox
              </div>
              <div className="h-px bg-slate-800 my-1" />
              <button
                onClick={() => {
                  onResetData();
                  setShowWorkspaceMenu(false);
                }}
                className="w-full flex items-center gap-1.5 p-1.5 rounded hover:bg-amber-500/10 text-amber-400 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Demo Data</span>
              </button>
            </div>
          )}
        </div>

        {/* Action Row: Quick Search, Brain, New Task */}
        <div className="p-2 space-y-0.5">
          <button
            onClick={onOpenCommandPalette}
            className="w-full flex items-center justify-between px-2 py-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition-colors text-xs"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <span>Search</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">⌘K</span>
          </button>

          <button
            onClick={onOpenBrain}
            className="w-full flex items-center justify-between px-2 py-1.5 rounded-md text-slate-400 hover:text-purple-300 hover:bg-white/[0.04] transition-colors text-xs"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Brain AI</span>
            </div>
            <span className="text-[9px] uppercase tracking-wider text-purple-400/80 font-mono">3.0</span>
          </button>

          <button
            onClick={onOpenNewTask}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.04] transition-colors text-xs"
          >
            <Plus className="w-3.5 h-3.5 text-purple-400" />
            <span>New Task</span>
          </button>
        </div>

        <div className="px-3 pt-2 pb-1 text-[10px] font-semibold text-slate-500 tracking-wider uppercase">
          Views
        </div>

        <div className="px-1.5 space-y-0.5">
          <button onClick={onSelectDashboard} className={`w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors ${activeView === 'dashboard' ? 'bg-white/10 font-semibold text-white' : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'}`}>
            <LayoutDashboard className="h-3.5 w-3.5" /><span>Dashboard</span><span className="ml-auto rounded border border-slate-700 px-1.5 py-0.5 text-[9px] text-slate-400">NEW</span>
          </button>
          <button
            onClick={() => {
              onSelectSpace('all');
              onSelectFolder(null);
              onSelectList('all');
            }}
            className={`w-full flex items-center gap-2 px-2 py-1 rounded-md text-xs transition-colors ${
              activeSpaceId === 'all' && activeView !== 'docs' && activeView !== 'whiteboard'
                ? 'bg-purple-500/10 text-purple-300 font-medium'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Everything</span>
          </button>

          <button
            onClick={onSelectDocs}
            className={`w-full flex items-center justify-between px-2 py-1 rounded-md text-xs transition-colors ${
              activeView === 'docs'
                ? 'bg-purple-500/10 text-purple-300 font-medium'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" />
              <span>Docs</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">2</span>
          </button>

          <button
            onClick={onSelectWhiteboard}
            className={`w-full flex items-center justify-between px-2 py-1 rounded-md text-xs transition-colors ${
              activeView === 'whiteboard'
                ? 'bg-purple-500/10 text-purple-300 font-medium'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <div className="flex items-center gap-2">
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Whiteboard</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">1</span>
          </button>
        </div>
      </div>

      {/* Center Section: Spaces Tree */}
      <div className="flex-1 overflow-y-auto px-1.5 py-3 space-y-1">
        <div className="px-2 pb-1 text-[10px] font-semibold text-slate-500 tracking-wider uppercase">
          Spaces
        </div>

        <div className="space-y-0.5">
          {spaces.map(space => {
            const isExpanded = !!expandedSpaces[space.id];
            const isSelectedSpace = activeSpaceId === space.id;

            return (
              <div key={space.id} className="space-y-0.5">
                <div
                  onClick={() => {
                    onSelectSpace(space.id);
                    onSelectFolder(null);
                    onSelectList('all');
                  }}
                  className={`flex items-center justify-between px-2 py-1 rounded-md text-xs cursor-pointer transition-colors ${
                    isSelectedSpace && activeListId === 'all' && activeFolderId === null
                      ? 'bg-white/[0.06] text-white font-medium'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <button
                      onClick={(e) => toggleSpace(space.id, e)}
                      className="p-0.5 text-slate-500 hover:text-slate-300"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                    </button>
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: space.color }}
                    />
                    <span className="truncate">{space.name}</span>
                  </div>
                </div>

                {/* Sub-items */}
                {isExpanded && (
                  <div className="pl-3 space-y-0.5">
                    {/* Folders */}
                    {space.folders.map(folder => {
                      const isFolderExpanded = !!expandedFolders[folder.id];
                      const isFolderSelected = activeFolderId === folder.id;

                      return (
                        <div key={folder.id} className="space-y-0.5">
                          <div
                            onClick={() => {
                              onSelectSpace(space.id);
                              onSelectFolder(folder.id);
                              onSelectList('all');
                            }}
                            className={`flex items-center justify-between px-2 py-0.5 rounded text-xs cursor-pointer transition-colors ${
                              isFolderSelected && activeListId === 'all'
                                ? 'text-white font-medium bg-white/[0.04]'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <button
                                onClick={(e) => toggleFolder(folder.id, e)}
                                className="p-0.5 text-slate-500 hover:text-slate-300"
                              >
                                {isFolderExpanded ? (
                                  <ChevronDown className="w-2.5 h-2.5" />
                                ) : (
                                  <ChevronRight className="w-2.5 h-2.5" />
                                )}
                              </button>
                              <span className="truncate text-[11px]">{folder.name}</span>
                            </div>
                          </div>

                          {/* Lists in Folder */}
                          {isFolderExpanded && (
                            <div className="pl-4 space-y-0.5">
                              {folder.lists.map(list => {
                                const isListSelected = activeListId === list.id;
                                return (
                                  <div
                                    key={list.id}
                                    onClick={() => {
                                      onSelectSpace(space.id);
                                      onSelectFolder(folder.id);
                                      onSelectList(list.id);
                                    }}
                                    className={`flex items-center justify-between px-2 py-0.5 rounded text-[11px] cursor-pointer transition-colors ${
                                      isListSelected
                                        ? 'text-purple-300 font-medium bg-purple-500/10'
                                        : 'text-slate-400 hover:text-slate-200'
                                    }`}
                                  >
                                    <span className="truncate">{list.name}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Direct Lists */}
                    {space.lists.map(list => {
                      const isListSelected = activeListId === list.id && activeFolderId === null;
                      return (
                        <div
                          key={list.id}
                          onClick={() => {
                            onSelectSpace(space.id);
                            onSelectFolder(null);
                            onSelectList(list.id);
                          }}
                          className={`flex items-center justify-between px-2 py-0.5 rounded text-[11px] cursor-pointer transition-colors ${
                            isListSelected
                              ? 'text-purple-300 font-medium bg-purple-500/10'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <span className="truncate">{list.name}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Section: Profile & Theme */}
      <div className="p-2 border-t border-slate-800/60 bg-[#0c0d10]">
        <div className="flex items-center justify-between px-2 py-1">
          <div className="flex items-center gap-2 min-w-0">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              referrerPolicy="no-referrer"
              className="w-5 h-5 rounded-full object-cover shrink-0"
            />
            <span className="text-xs text-slate-300 truncate">{currentUser.name.split(' ')[0]}</span>
          </div>

          <button
            onClick={onToggleTheme}
            className="p-1 text-slate-500 hover:text-slate-200 rounded transition-colors"
            title={isDarkMode ? 'Light mode' : 'Dark mode'}
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </aside>
  );
};
