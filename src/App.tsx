/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ClickUpSpace,
  Task,
  DocPage,
  WhiteboardNode,
  WhiteboardEdge,
  ActiveView,
  FilterState,
  Assignee,
} from './types';
import {
  INITIAL_SPACES,
  INITIAL_TASKS,
  INITIAL_STATUSES,
  TEAM_MEMBERS,
  INITIAL_DOCS,
  INITIAL_WHITEBOARD_NODES,
  INITIAL_WHITEBOARD_EDGES,
} from './data/initialData';

import { Sidebar } from './components/layout/Sidebar';
import { TopHeader } from './components/layout/TopHeader';
import { ListView } from './components/views/ListView';
import { BoardView } from './components/views/BoardView';
import { CalendarView } from './components/views/CalendarView';
import { GanttView } from './components/views/GanttView';
import { TableView } from './components/views/TableView';
import { DocsView } from './components/views/DocsView';
import { WhiteboardView } from './components/views/WhiteboardView';
import { TaskDetailModal } from './components/task/TaskDetailModal';
import { NewTaskModal } from './components/task/NewTaskModal';
import { ClickUpBrainModal } from './components/ai/ClickUpBrainModal';
import { TimeTrackerBar } from './components/time/TimeTrackerBar';
import { CommandPalette } from './components/common/CommandPalette';

const STORAGE_KEY_TASKS = 'clickup_workos_tasks_v1';
const STORAGE_KEY_DOCS = 'clickup_workos_docs_v1';
const STORAGE_KEY_WHITEBOARD = 'clickup_workos_whiteboard_v1';
const STORAGE_KEY_THEME = 'clickup_workos_theme';

export default function App() {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_THEME);
    return saved !== null ? saved === 'true' : true;
  });

  // Sync dark class on <html>
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(STORAGE_KEY_THEME, String(isDarkMode));
  }, [isDarkMode]);

  // Core Data States
  const [spaces, setSpaces] = useState<ClickUpSpace[]>(INITIAL_SPACES);
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TASKS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved tasks:', e);
    }
    return INITIAL_TASKS;
  });

  const [docs, setDocs] = useState<DocPage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DOCS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved docs:', e);
    }
    return INITIAL_DOCS;
  });

  const [whiteboardNodes, setWhiteboardNodes] = useState<WhiteboardNode[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_WHITEBOARD);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved whiteboard:', e);
    }
    return INITIAL_WHITEBOARD_NODES;
  });

  const [whiteboardEdges] = useState<WhiteboardEdge[]>(INITIAL_WHITEBOARD_EDGES);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
    } catch (e) {
      console.warn('Error saving tasks:', e);
    }
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DOCS, JSON.stringify(docs));
    } catch (e) {
      console.warn('Error saving docs:', e);
    }
  }, [docs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_WHITEBOARD, JSON.stringify(whiteboardNodes));
    } catch (e) {
      console.warn('Error saving whiteboard:', e);
    }
  }, [whiteboardNodes]);

  // Navigation & View selection
  const [activeSpaceId, setActiveSpaceId] = useState<string | 'all'>('space-eng');
  const [activeFolderId, setActiveFolderId] = useState<string | null>('folder-sprint42');
  const [activeListId, setActiveListId] = useState<string | 'all'>('list-active-sprint');
  const [activeView, setActiveView] = useState<ActiveView>('list');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Current logged in user
  const [currentUser] = useState<Assignee>(TEAM_MEMBERS[0]);

  // Filter state
  const [filterState, setFilterState] = useState<FilterState>({
    searchQuery: '',
    statusId: 'all',
    priority: 'all',
    assigneeId: 'all',
    tag: 'all',
    groupBy: 'status',
  });

  // Modals & Panels
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isBrainModalOpen, setIsBrainModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Active Timer state
  const [activeTimerTaskId, setActiveTimerTaskId] = useState<string | null>(null);

  // Real-time ticking for active task timer
  useEffect(() => {
    if (!activeTimerTaskId) return;

    const interval = setInterval(() => {
      setTasks(prevTasks =>
        prevTasks.map(t =>
          t.id === activeTimerTaskId ? { ...t, loggedSeconds: t.loggedSeconds + 1 } : t
        )
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimerTaskId]);

  const handleToggleTimer = (taskId: string) => {
    if (activeTimerTaskId === taskId) {
      setActiveTimerTaskId(null);
    } else {
      setActiveTimerTaskId(taskId);
    }
  };

  // Keyboard shortcut listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter tasks based on current navigation & filters
  const filteredTasks = tasks.filter(task => {
    // Space filter
    if (activeSpaceId !== 'all' && task.spaceId !== activeSpaceId) {
      return false;
    }
    // Folder filter
    if (activeFolderId && task.folderId !== activeFolderId) {
      return false;
    }
    // List filter
    if (activeListId !== 'all' && task.listId !== activeListId) {
      return false;
    }
    // Status filter
    if (filterState.statusId !== 'all' && task.statusId !== filterState.statusId) {
      return false;
    }
    // Priority filter
    if (filterState.priority !== 'all' && task.priority !== filterState.priority) {
      return false;
    }
    // Assignee filter
    if (filterState.assigneeId !== 'all' && !task.assigneeIds.includes(filterState.assigneeId)) {
      return false;
    }
    // Search query filter
    if (filterState.searchQuery.trim().length > 0) {
      const q = filterState.searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchKey = task.key.toLowerCase().includes(q);
      const matchDesc = task.description.toLowerCase().includes(q);
      const matchTags = task.tags.some(tag => tag.toLowerCase().includes(q));
      if (!matchTitle && !matchKey && !matchDesc && !matchTags) {
        return false;
      }
    }
    return true;
  });

  // Task Handlers
  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => (t.id === updatedTask.id ? updatedTask : t)));
    if (selectedTask?.id === updatedTask.id) {
      setSelectedTask(updatedTask);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    if (activeTimerTaskId === taskId) {
      setActiveTimerTaskId(null);
    }
    if (selectedTask?.id === taskId) {
      setSelectedTask(null);
    }
  };

  const handleQuickAddTask = (statusId: string, title: string) => {
    const nextKeyNum = 100 + tasks.length + 1;
    const currentSpace = spaces.find(s => s.id === activeSpaceId) || spaces[0];
    const targetListId =
      activeListId !== 'all'
        ? activeListId
        : currentSpace.lists[0]?.id || currentSpace.folders[0]?.lists[0]?.id || 'list-active-sprint';

    const newTask: Task = {
      id: `task-${Date.now()}`,
      key: `CU-${nextKeyNum}`,
      title,
      description: '',
      statusId,
      priority: 'normal',
      spaceId: currentSpace.id,
      folderId: activeFolderId || undefined,
      listId: targetListId,
      assigneeIds: [currentUser.id],
      tags: [],
      dueDate: '2026-11-15',
      estimatedHours: 4,
      loggedSeconds: 0,
      subtasks: [],
      checklists: [],
      comments: [],
      customFields: {
        storyPoints: 3,
        progressPercent: 0,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      order: tasks.length + 1,
    };

    setTasks(prev => [...prev, newTask]);
  };

  const handleQuickAddTaskWithDate = (dueDate: string) => {
    const nextKeyNum = 100 + tasks.length + 1;
    const currentSpace = spaces.find(s => s.id === activeSpaceId) || spaces[0];
    const targetListId =
      activeListId !== 'all'
        ? activeListId
        : currentSpace.lists[0]?.id || currentSpace.folders[0]?.lists[0]?.id || 'list-active-sprint';

    const newTask: Task = {
      id: `task-${Date.now()}`,
      key: `CU-${nextKeyNum}`,
      title: 'New Scheduled Task',
      description: 'Scheduled from ClickUp Calendar View',
      statusId: 'status-todo',
      priority: 'normal',
      spaceId: currentSpace.id,
      folderId: activeFolderId || undefined,
      listId: targetListId,
      assigneeIds: [currentUser.id],
      tags: ['Calendar'],
      dueDate,
      estimatedHours: 2,
      loggedSeconds: 0,
      subtasks: [],
      checklists: [],
      comments: [],
      customFields: {
        storyPoints: 2,
        progressPercent: 0,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      order: tasks.length + 1,
    };

    setTasks(prev => [...prev, newTask]);
    setSelectedTask(newTask);
  };

  const handleCreateTaskFull = (newTaskData: Partial<Task>) => {
    const nextKeyNum = 100 + tasks.length + 1;
    const newTask: Task = {
      id: `task-${Date.now()}`,
      key: `CU-${nextKeyNum}`,
      title: newTaskData.title || 'Untitled Task',
      description: newTaskData.description || '',
      statusId: newTaskData.statusId || 'status-todo',
      priority: newTaskData.priority || 'normal',
      spaceId: newTaskData.spaceId || 'space-eng',
      folderId: newTaskData.folderId,
      listId: newTaskData.listId || 'list-active-sprint',
      assigneeIds: newTaskData.assigneeIds || [currentUser.id],
      tags: newTaskData.tags || [],
      dueDate: newTaskData.dueDate,
      estimatedHours: newTaskData.estimatedHours || 4,
      loggedSeconds: 0,
      subtasks: newTaskData.subtasks || [],
      checklists: newTaskData.checklists || [],
      comments: [],
      customFields: newTaskData.customFields || {
        storyPoints: 3,
        progressPercent: 0,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      order: tasks.length + 1,
    };

    setTasks(prev => [...prev, newTask]);
  };

  const handleCreateTaskFromBrain = (title: string, description: string) => {
    handleCreateTaskFull({
      title,
      description,
      spaceId: 'space-eng',
      listId: 'list-active-sprint',
      priority: 'high',
      tags: ['ClickUp Brain', 'AI Spec'],
    });
  };

  // Docs Handlers
  const handleUpdateDoc = (updatedDoc: DocPage) => {
    setDocs(prev => prev.map(d => (d.id === updatedDoc.id ? updatedDoc : d)));
  };

  const handleCreateDoc = () => {
    const newDoc: DocPage = {
      id: `doc-${Date.now()}`,
      title: 'Untitled Document',
      content: `# New Document\n\nWrite your project specs, SOPs, or meeting minutes here...`,
      icon: 'FileText',
      updatedAt: 'Just now',
      authorId: currentUser.id,
    };
    setDocs(prev => [newDoc, ...prev]);
  };

  const handleDeleteDoc = (docId: string) => {
    setDocs(prev => prev.filter(d => d.id !== docId));
  };

  // Reset to initial demo data
  const handleResetData = () => {
    if (confirm('Reset workspace to clean demo dataset? All local edits will be reset.')) {
      setTasks(INITIAL_TASKS);
      setDocs(INITIAL_DOCS);
      setWhiteboardNodes(INITIAL_WHITEBOARD_NODES);
      localStorage.removeItem(STORAGE_KEY_TASKS);
      localStorage.removeItem(STORAGE_KEY_DOCS);
      localStorage.removeItem(STORAGE_KEY_WHITEBOARD);
    }
  };

  // Breadcrumb names
  const currentSpace = spaces.find(s => s.id === activeSpaceId);
  const currentFolder = currentSpace?.folders.find(f => f.id === activeFolderId);
  const allCurrentLists = [
    ...(currentSpace?.lists || []),
    ...(currentSpace?.folders.flatMap(f => f.lists) || []),
  ];
  const currentList = allCurrentLists.find(l => l.id === activeListId);

  const spaceName = activeSpaceId === 'all' ? 'Everything' : currentSpace?.name || 'Workspace';
  const folderName = currentFolder?.name;
  const listName = activeListId === 'all' ? 'All Tasks' : currentList?.name || 'Tasks';

  const activeTimerTask = tasks.find(t => t.id === activeTimerTaskId) || null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0f1115] text-slate-100 font-sans antialiased">
      {/* ClickUp 3.0 Sidebar */}
      <Sidebar
        spaces={spaces}
        activeSpaceId={activeSpaceId}
        activeFolderId={activeFolderId}
        activeListId={activeListId}
        onSelectSpace={sId => setActiveSpaceId(sId)}
        onSelectFolder={fId => setActiveFolderId(fId)}
        onSelectList={lId => setActiveListId(lId)}
        currentUser={currentUser}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(prev => !prev)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenBrain={() => setIsBrainModalOpen(true)}
        onOpenNewTask={() => setIsNewTaskModalOpen(true)}
        onResetData={handleResetData}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
        onSelectDocs={() => setActiveView('docs')}
        onSelectWhiteboard={() => setActiveView('whiteboard')}
        activeView={activeView}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden bg-[#0f1115]">
        {/* Top Header Navigation & Controls */}
        <TopHeader
          activeView={activeView}
          onViewChange={view => setActiveView(view)}
          filterState={filterState}
          onFilterChange={filters => setFilterState(prev => ({ ...prev, ...filters }))}
          spaceName={spaceName}
          folderName={folderName}
          listName={listName}
          totalTasks={filteredTasks.length}
          onOpenNewTask={() => setIsNewTaskModalOpen(true)}
          onOpenBrain={() => setIsBrainModalOpen(true)}
          teamMembers={TEAM_MEMBERS}
        />

        {/* View Viewport */}
        <main className="flex-1 flex overflow-hidden relative">
          {activeView === 'list' && (
            <ListView
              tasks={filteredTasks}
              statuses={INITIAL_STATUSES}
              teamMembers={TEAM_MEMBERS}
              onSelectTask={task => setSelectedTask(task)}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onQuickAddTask={handleQuickAddTask}
              activeTimerTaskId={activeTimerTaskId}
              onToggleTimer={handleToggleTimer}
              groupBy={filterState.groupBy}
            />
          )}

          {activeView === 'board' && (
            <BoardView
              tasks={filteredTasks}
              statuses={INITIAL_STATUSES}
              teamMembers={TEAM_MEMBERS}
              onSelectTask={task => setSelectedTask(task)}
              onUpdateTask={handleUpdateTask}
              onQuickAddTask={handleQuickAddTask}
            />
          )}

          {activeView === 'calendar' && (
            <CalendarView
              tasks={filteredTasks}
              statuses={INITIAL_STATUSES}
              teamMembers={TEAM_MEMBERS}
              onSelectTask={task => setSelectedTask(task)}
              onQuickAddTaskWithDate={handleQuickAddTaskWithDate}
            />
          )}

          {activeView === 'gantt' && (
            <GanttView
              tasks={filteredTasks}
              statuses={INITIAL_STATUSES}
              teamMembers={TEAM_MEMBERS}
              onSelectTask={task => setSelectedTask(task)}
            />
          )}

          {activeView === 'table' && (
            <TableView
              tasks={filteredTasks}
              statuses={INITIAL_STATUSES}
              teamMembers={TEAM_MEMBERS}
              onSelectTask={task => setSelectedTask(task)}
              onUpdateTask={handleUpdateTask}
              activeTimerTaskId={activeTimerTaskId}
              onToggleTimer={handleToggleTimer}
            />
          )}

          {activeView === 'docs' && (
            <DocsView
              docs={docs}
              onUpdateDoc={handleUpdateDoc}
              onCreateDoc={handleCreateDoc}
              onDeleteDoc={handleDeleteDoc}
              currentUser={currentUser}
            />
          )}

          {activeView === 'whiteboard' && (
            <WhiteboardView
              nodes={whiteboardNodes}
              edges={whiteboardEdges}
              onUpdateNodes={setWhiteboardNodes}
              onSelectTask={task => setSelectedTask(task)}
              tasks={tasks}
            />
          )}
        </main>
      </div>

      {/* Persistent Floating Time Tracker Bar */}
      <TimeTrackerBar
        activeTask={activeTimerTask}
        onStopTimer={() => setActiveTimerTaskId(null)}
        onOpenTask={task => setSelectedTask(task)}
      />

      {/* Task Detail Drawer / Modal */}
      <TaskDetailModal
        task={selectedTask}
        statuses={INITIAL_STATUSES}
        teamMembers={TEAM_MEMBERS}
        onClose={() => setSelectedTask(null)}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
        activeTimerTaskId={activeTimerTaskId}
        onToggleTimer={handleToggleTimer}
        currentUser={currentUser}
      />

      {/* New Task Creator Modal */}
      {isNewTaskModalOpen && (
        <NewTaskModal
          spaces={spaces}
          activeSpaceId={activeSpaceId === 'all' ? spaces[0].id : activeSpaceId}
          activeListId={activeListId === 'all' ? 'list-active-sprint' : activeListId}
          teamMembers={TEAM_MEMBERS}
          onClose={() => setIsNewTaskModalOpen(false)}
          onCreateTask={handleCreateTaskFull}
        />
      )}

      {/* ClickUp Brain AI Assistant Modal */}
      <ClickUpBrainModal
        isOpen={isBrainModalOpen}
        onClose={() => setIsBrainModalOpen(false)}
        tasks={tasks}
        teamMembers={TEAM_MEMBERS}
        onCreateTaskFromBrain={handleCreateTaskFromBrain}
      />

      {/* Cmd+K Universal Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        tasks={tasks}
        spaces={spaces}
        docs={docs}
        onSelectTask={task => setSelectedTask(task)}
        onOpenNewTask={() => setIsNewTaskModalOpen(true)}
        onOpenBrain={() => setIsBrainModalOpen(true)}
        onToggleTheme={() => setIsDarkMode(prev => !prev)}
        onViewChange={view => setActiveView(view)}
      />
    </div>
  );
}
