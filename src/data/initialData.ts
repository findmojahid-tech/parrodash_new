import { Assignee, ClickUpSpace, Task, TaskStatus, DocPage, WhiteboardNode, WhiteboardEdge } from '../types';

export const INITIAL_STATUSES: TaskStatus[] = [
  { id: 'status-todo', name: 'TO DO', color: '#64748b', category: 'todo' },
  { id: 'status-in-progress', name: 'IN PROGRESS', color: '#3b82f6', category: 'in_progress' },
  { id: 'status-in-review', name: 'IN REVIEW', color: '#eab308', category: 'in_review' },
  { id: 'status-complete', name: 'COMPLETE', color: '#10b981', category: 'done' },
];

export const TEAM_MEMBERS: Assignee[] = [
  {
    id: 'user-alex',
    name: 'Alex Rivera',
    email: 'alex@clickup-workos.dev',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    color: '#8b5cf6',
    role: 'Staff Architect',
  },
  {
    id: 'user-sarah',
    name: 'Sarah Chen',
    email: 'sarah.c@clickup-workos.dev',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80',
    color: '#ec4899',
    role: 'Lead Product Designer',
  },
  {
    id: 'user-marcus',
    name: 'Marcus Vance',
    email: 'marcus@clickup-workos.dev',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    color: '#3b82f6',
    role: 'Full Stack Engineer',
  },
  {
    id: 'user-elena',
    name: 'Elena Rostova',
    email: 'elena@clickup-workos.dev',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
    color: '#10b981',
    role: 'Product Manager',
  },
  {
    id: 'user-david',
    name: 'David Kim',
    email: 'david@clickup-workos.dev',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    color: '#f59e0b',
    role: 'DevOps & Reliability',
  },
];

export const INITIAL_SPACES: ClickUpSpace[] = [
  {
    id: 'space-eng',
    name: 'Core Engineering',
    color: '#7b68ee', // signature ClickUp purple
    icon: 'Terminal',
    description: 'Sprint planning, infrastructure, bug tracking, and release engineering',
    statuses: INITIAL_STATUSES,
    folders: [
      {
        id: 'folder-sprint42',
        name: 'Sprint 42 - NextGen Release',
        spaceId: 'space-eng',
        color: '#8b5cf6',
        lists: [
          { id: 'list-active-sprint', name: 'Active Sprint Tasks', spaceId: 'space-eng', folderId: 'folder-sprint42' },
          { id: 'list-bugs', name: 'Bugs & Incidents', spaceId: 'space-eng', folderId: 'folder-sprint42' },
        ],
      },
    ],
    lists: [
      { id: 'list-eng-backlog', name: 'Architecture Backlog', spaceId: 'space-eng' },
      { id: 'list-tech-debt', name: 'Refactoring & Tech Debt', spaceId: 'space-eng' },
    ],
  },
  {
    id: 'space-product',
    name: 'Product & Design',
    color: '#ec4899',
    icon: 'Layers',
    description: 'Design system components, UX research, wireframes, and prototypes',
    statuses: INITIAL_STATUSES,
    folders: [
      {
        id: 'folder-cu3',
        name: 'ClickUp 3.0 Design System',
        spaceId: 'space-product',
        color: '#ec4899',
        lists: [
          { id: 'list-tokens', name: 'Design Tokens & UI Kit', spaceId: 'space-product', folderId: 'folder-cu3' },
          { id: 'list-usertest', name: 'User Testing Sessions', spaceId: 'space-product', folderId: 'folder-cu3' },
        ],
      },
    ],
    lists: [
      { id: 'list-design-backlog', name: 'Design Backlog', spaceId: 'space-product' },
    ],
  },
  {
    id: 'space-growth',
    name: 'Growth & Marketing',
    color: '#10b981',
    icon: 'TrendingUp',
    description: 'Customer acquisition, launch campaigns, content calendar, and analytics',
    statuses: INITIAL_STATUSES,
    folders: [
      {
        id: 'folder-launch',
        name: 'Q4 Global Launch',
        spaceId: 'space-growth',
        color: '#10b981',
        lists: [
          { id: 'list-producthunt', name: 'Product Hunt Launch', spaceId: 'space-growth', folderId: 'folder-launch' },
        ],
      },
    ],
    lists: [
      { id: 'list-content-calendar', name: 'Content Marketing Pipeline', spaceId: 'space-growth' },
    ],
  },
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    key: 'CU-101',
    title: 'Architect multi-workspace database tenancy & caching',
    description: 'Design and deploy Redis clusters with tenant isolation keys to support sub-10ms response times on high-concurrency API calls across workspaces.',
    statusId: 'status-in-progress',
    priority: 'urgent',
    spaceId: 'space-eng',
    folderId: 'folder-sprint42',
    listId: 'list-active-sprint',
    assigneeIds: ['user-alex', 'user-david'],
    tags: ['Architecture', 'High Priority', 'Backend'],
    startDate: '2026-11-08',
    dueDate: '2026-11-14',
    estimatedHours: 16,
    loggedSeconds: 19800, // 5.5h
    order: 1,
    customFields: {
      storyPoints: 8,
      department: 'Platform Engineering',
      riskLevel: 'High',
      progressPercent: 65,
    },
    subtasks: [
      { id: 'sub-1-1', title: 'Draft RFC specification document for caching hierarchy', completed: true, estimatedHours: 4 },
      { id: 'sub-1-2', title: 'Provision benchmark Redis cluster in staging environment', completed: true, estimatedHours: 4 },
      { id: 'sub-1-3', title: 'Benchmark key eviction strategies under 50k req/s load', completed: false, estimatedHours: 4 },
      { id: 'sub-1-4', title: 'Configure Grafana alerts and latency telemetry dashboards', completed: false, estimatedHours: 4 },
    ],
    checklists: [
      { id: 'chk-1-1', text: 'Zero data leakage between tenant namespaces', completed: true },
      { id: 'chk-1-2', text: 'Graceful fallback to replica read-pools on failover', completed: true },
      { id: 'chk-1-3', text: 'Pass SOC2 compliance latency guidelines', completed: false },
    ],
    comments: [
      {
        id: 'comm-1',
        authorId: 'user-david',
        text: 'Ran initial load test: p99 latency dropped from 48ms to 7.2ms! Pushing branch for review.',
        createdAt: '2 hours ago',
        reactions: { '🚀': 3, '🔥': 2 },
      },
      {
        id: 'comm-2',
        authorId: 'user-alex',
        text: 'Outstanding numbers David. Let’s make sure failover tests run before Friday cut-off.',
        createdAt: '1 hour ago',
        reactions: { '👍': 1 },
      },
    ],
    createdAt: '2026-11-08T09:00:00Z',
    updatedAt: '2026-11-10T14:30:00Z',
  },
  {
    id: 'task-2',
    key: 'CU-102',
    title: 'Build ClickUp 3.0 Command Palette with fuzzy search',
    description: 'Implement universal Command Palette (Cmd+K / Ctrl+K) allowing keyboard shortcuts to search tasks, spaces, docs, and trigger quick actions.',
    statusId: 'status-in-progress',
    priority: 'high',
    spaceId: 'space-eng',
    folderId: 'folder-sprint42',
    listId: 'list-active-sprint',
    assigneeIds: ['user-marcus'],
    tags: ['Frontend', 'Navigation', 'UX'],
    startDate: '2026-11-09',
    dueDate: '2026-11-13',
    estimatedHours: 12,
    loggedSeconds: 14400, // 4h
    order: 2,
    customFields: {
      storyPoints: 5,
      department: 'Frontend Experience',
      riskLevel: 'Medium',
      progressPercent: 45,
    },
    subtasks: [
      { id: 'sub-2-1', title: 'Set up global keyboard event listener and modal backdrop', completed: true, estimatedHours: 2 },
      { id: 'sub-2-2', title: 'Implement fuzzy match scoring algorithm for spaces and tasks', completed: true, estimatedHours: 3 },
      { id: 'sub-2-3', title: 'Add quick action triggers (Create task, Start timer, Toggle theme)', completed: false, estimatedHours: 4 },
      { id: 'sub-2-4', title: 'Add arrow key navigation and focus trapping for accessibility', completed: false, estimatedHours: 3 },
    ],
    checklists: [
      { id: 'chk-2-1', text: 'Opens instantly within 50ms upon Cmd+K', completed: true },
      { id: 'chk-2-2', text: 'Recent searches remembered in local session', completed: false },
    ],
    comments: [],
    createdAt: '2026-11-09T10:00:00Z',
    updatedAt: '2026-11-10T11:00:00Z',
  },
  {
    id: 'task-3',
    key: 'CU-103',
    title: 'Deploy ClickUp Brain AI agent for automated standups',
    description: 'Integrate Gemini 3.8 Flash model to summarize sprint tickets, generate daily standups, and suggest subtasks automatically.',
    statusId: 'status-todo',
    priority: 'urgent',
    spaceId: 'space-eng',
    folderId: 'folder-sprint42',
    listId: 'list-active-sprint',
    assigneeIds: ['user-alex', 'user-sarah'],
    tags: ['AI', 'ClickUp Brain', 'Gemini'],
    startDate: '2026-11-11',
    dueDate: '2026-11-15',
    estimatedHours: 14,
    loggedSeconds: 0,
    order: 3,
    customFields: {
      storyPoints: 8,
      department: 'AI & Automations',
      riskLevel: 'Low',
      progressPercent: 10,
    },
    subtasks: [
      { id: 'sub-3-1', title: 'Configure server-side proxy route with Google GenAI SDK', completed: true, estimatedHours: 3 },
      { id: 'sub-3-2', title: 'Design prompt templates for task summarization and subtask generation', completed: false, estimatedHours: 3 },
      { id: 'sub-3-3', title: 'Implement ClickUp Brain interactive modal with copy-to-clipboard', completed: false, estimatedHours: 4 },
      { id: 'sub-3-4', title: 'Add one-click AI subtask generation in task detail drawer', completed: false, estimatedHours: 4 },
    ],
    checklists: [
      { id: 'chk-3-1', text: 'No client-side API key exposure', completed: true },
      { id: 'chk-3-2', text: 'Fallback logic when offline or quota restricted', completed: true },
    ],
    comments: [
      {
        id: 'comm-3',
        authorId: 'user-sarah',
        text: 'The ClickUp Brain icon should pulse gently with signature violet gradient. I’ve updated Figma specs!',
        createdAt: '3 hours ago',
      },
    ],
    createdAt: '2026-11-10T08:00:00Z',
    updatedAt: '2026-11-10T15:00:00Z',
  },
  {
    id: 'task-4',
    key: 'CU-104',
    title: 'Fix drag-and-drop column clipping on Kanban board view',
    description: 'When dragging tasks between columns with over 15 items, the dropzone boundary was causing occasional card flickering and scroll jumping.',
    statusId: 'status-in-review',
    priority: 'normal',
    spaceId: 'space-eng',
    folderId: 'folder-sprint42',
    listId: 'list-bugs',
    assigneeIds: ['user-marcus'],
    tags: ['Bug', 'Board', 'Regression'],
    startDate: '2026-11-07',
    dueDate: '2026-11-11',
    estimatedHours: 6,
    loggedSeconds: 21600, // 6h
    order: 4,
    customFields: {
      storyPoints: 3,
      department: 'Frontend Experience',
      riskLevel: 'Low',
      progressPercent: 90,
    },
    subtasks: [
      { id: 'sub-4-1', title: 'Reproduce drag collision on Safari and Chrome', completed: true, estimatedHours: 2 },
      { id: 'sub-4-2', title: 'Switch to composite transform layer to eliminate repaints', completed: true, estimatedHours: 3 },
      { id: 'sub-4-3', title: 'Verify touch support for iPad and tablet devices', completed: true, estimatedHours: 1 },
    ],
    checklists: [
      { id: 'chk-4-1', text: 'Smooth 60fps drag physics', completed: true },
      { id: 'chk-4-2', text: 'Unit test verifying drop target calculation', completed: true },
    ],
    comments: [
      {
        id: 'comm-4',
        authorId: 'user-elena',
        text: 'Tested on staging build #418 - smooth as silk. Moving to ready to merge.',
        createdAt: '4 hours ago',
      },
    ],
    createdAt: '2026-11-07T11:00:00Z',
    updatedAt: '2026-11-10T16:00:00Z',
  },
  {
    id: 'task-5',
    key: 'CU-105',
    title: 'Release Interactive Gantt Timeline with dependency lines',
    description: 'Allow project managers to schedule task durations visually, drag start/end dates, and draw dependency arrows between linked milestones.',
    statusId: 'status-complete',
    priority: 'high',
    spaceId: 'space-eng',
    folderId: 'folder-sprint42',
    listId: 'list-active-sprint',
    assigneeIds: ['user-alex', 'user-sarah'],
    tags: ['Timeline', 'Gantt', 'Feature'],
    startDate: '2026-11-01',
    dueDate: '2026-11-09',
    estimatedHours: 20,
    loggedSeconds: 72000, // 20h
    order: 5,
    customFields: {
      storyPoints: 13,
      department: 'Platform Engineering',
      riskLevel: 'Medium',
      progressPercent: 100,
    },
    subtasks: [
      { id: 'sub-5-1', title: 'Build day/week calendar header strip', completed: true, estimatedHours: 4 },
      { id: 'sub-5-2', title: 'Render SVG Bezier curve connectors between dependent tasks', completed: true, estimatedHours: 6 },
      { id: 'sub-5-3', title: 'Implement date range shifting with collision warnings', completed: true, estimatedHours: 6 },
      { id: 'sub-5-4', title: 'Export Gantt chart to PDF / PNG', completed: true, estimatedHours: 4 },
    ],
    checklists: [
      { id: 'chk-5-1', text: 'Supports zooming from days to months', completed: true },
      { id: 'chk-5-2', text: 'Critical path calculation highlighting', completed: true },
    ],
    comments: [],
    createdAt: '2026-11-01T09:00:00Z',
    updatedAt: '2026-11-09T18:00:00Z',
  },
  {
    id: 'task-6',
    key: 'CU-106',
    title: 'Harmonize Design System tokens for Dark & Light Mode',
    description: 'Audit all semantic surface tokens, text contrast ratios, and accent colors across dark slate (#0f1115) and light mode (#ffffff).',
    statusId: 'status-in-progress',
    priority: 'normal',
    spaceId: 'space-product',
    folderId: 'folder-cu3',
    listId: 'list-tokens',
    assigneeIds: ['user-sarah'],
    tags: ['Design System', 'Tailwind', 'Accessibility'],
    startDate: '2026-11-06',
    dueDate: '2026-11-12',
    estimatedHours: 10,
    loggedSeconds: 18000, // 5h
    order: 6,
    customFields: {
      storyPoints: 5,
      department: 'Product Design',
      riskLevel: 'Low',
      progressPercent: 50,
    },
    subtasks: [
      { id: 'sub-6-1', title: 'Define CSS variables for neutral dark background and borders', completed: true, estimatedHours: 3 },
      { id: 'sub-6-2', title: 'Test WCAG AA 4.5:1 text contrast on muted labels', completed: true, estimatedHours: 2 },
      { id: 'sub-6-3', title: 'Implement status badge color system with high-legibility dark mode pairs', completed: false, estimatedHours: 3 },
      { id: 'sub-6-4', title: 'Create interactive Storybook token playground', completed: false, estimatedHours: 2 },
    ],
    checklists: [],
    comments: [],
    createdAt: '2026-11-06T13:00:00Z',
    updatedAt: '2026-11-10T12:00:00Z',
  },
  {
    id: 'task-7',
    key: 'CU-107',
    title: 'Launch Product Hunt Q4 showcase & founder live AMA',
    description: 'Coordinate promotional assets, prepare live demo workspace link, write copy highlighting ClickUp 3.0 speed and Brain AI features.',
    statusId: 'status-todo',
    priority: 'high',
    spaceId: 'space-growth',
    folderId: 'folder-launch',
    listId: 'list-producthunt',
    assigneeIds: ['user-elena'],
    tags: ['Marketing', 'Launch', 'ProductHunt'],
    startDate: '2026-11-10',
    dueDate: '2026-11-20',
    estimatedHours: 15,
    loggedSeconds: 3600, // 1h
    order: 7,
    customFields: {
      storyPoints: 5,
      department: 'Marketing & Brand',
      riskLevel: 'Medium',
      progressPercent: 20,
    },
    subtasks: [
      { id: 'sub-7-1', title: 'Finalize high-resolution screenshots & GIF walk-throughs', completed: true, estimatedHours: 4 },
      { id: 'sub-7-2', title: 'Draft maker comment and core value proposition narrative', completed: false, estimatedHours: 3 },
      { id: 'sub-7-3', title: 'Coordinate launch day community outreach and newsletter blast', completed: false, estimatedHours: 5 },
      { id: 'sub-7-4', title: 'Monitor incoming comments and questions in real-time', completed: false, estimatedHours: 3 },
    ],
    checklists: [
      { id: 'chk-7-1', text: 'Hunter confirmed and scheduled', completed: true },
      { id: 'chk-7-2', text: 'Special discount code configured for PH community', completed: false },
    ],
    comments: [],
    createdAt: '2026-11-10T14:00:00Z',
    updatedAt: '2026-11-10T14:00:00Z',
  },
];

export const INITIAL_DOCS: DocPage[] = [
  {
    id: 'doc-1',
    title: 'ClickUp WorkOS 3.0 Architecture Guide',
    icon: 'BookOpen',
    updatedAt: 'Nov 10, 2026',
    authorId: 'user-alex',
    content: `# ClickUp WorkOS 3.0 Architecture & Design Principles

Welcome to the internal engineering guide for **ClickUp WorkOS 3.0**. Our mission is to save users 1 day every single week by unifying tasks, docs, chat, whiteboards, and AI into one blazing-fast workspace.

---

### 1. Core Engineering Pillars
- **⚡ 10x Performance**: Every view switch, filter application, and keyboard stroke must settle within 100 milliseconds.
- **🧠 Native ClickUp Brain**: AI is deeply embedded across tasks, docs, and search—not an external chatbot bolted onto the side.
- **📐 Universal Hierarchy**:
  - **Workspaces**: Entire company container
  - **Spaces**: High-level divisions (Engineering, Product, Marketing)
  - **Folders**: Organizational groups for sprints, quarters, or domains
  - **Lists**: Specific task collections
  - **Tasks & Subtasks**: Actionable items with rich metadata

---

### 2. Status Progression
All spaces follow our strict state lifecycle:
1. **TO DO** (\`#64748b\`): Queued for upcoming cycle
2. **IN PROGRESS** (\`#3b82f6\`): Active development or execution
3. **IN REVIEW** (\`#eab308\`): Code review, design audit, or QA verification
4. **COMPLETE** (\`#10b981\`): Verified and delivered to production

---

### 3. ClickUp Brain Capabilities
- Subtask breakdown with estimated duration
- Automated daily standup synthesis
- Executive summaries of long task discussions
- Acceptance criteria generator`,
  },
  {
    id: 'doc-2',
    title: 'Sprint 42 Release Checklist & Verification',
    icon: 'CheckSquare',
    updatedAt: 'Nov 9, 2026',
    authorId: 'user-elena',
    content: `# Sprint 42 Release Checklist

### Release Targets
- **Cut-off Date**: Friday 17:00 UTC
- **Production Rollout**: Monday 08:00 UTC

### Checklist:
- [x] Database migration scripts tested against staging dump
- [x] Command Palette Cmd+K shortcuts tested on macOS & Windows
- [x] Dark mode contrast compliance verified across all modals
- [ ] End-to-end performance benchmark passing under 50k req/s
- [ ] Sign-off from Lead Product Designer & Staff Architect`,
  },
];

export const INITIAL_WHITEBOARD_NODES: WhiteboardNode[] = [
  {
    id: 'node-1',
    type: 'milestone',
    title: 'ClickUp 3.0 General Availability',
    content: 'Target date: Dec 1, 2026',
    x: 420,
    y: 80,
    color: '#8b5cf6',
  },
  {
    id: 'node-2',
    type: 'task',
    title: 'Multi-Tenant Redis Cache (CU-101)',
    content: 'Sub-10ms response times on high-load routes',
    x: 180,
    y: 220,
    color: '#3b82f6',
    linkedTaskId: 'task-1',
  },
  {
    id: 'node-3',
    type: 'task',
    title: 'Command Palette Cmd+K (CU-102)',
    content: 'Instant global search and navigation',
    x: 440,
    y: 220,
    color: '#3b82f6',
    linkedTaskId: 'task-2',
  },
  {
    id: 'node-4',
    type: 'task',
    title: 'ClickUp Brain AI Assistant (CU-103)',
    content: 'Gemini 3.8 Flash automated standups & subtasks',
    x: 700,
    y: 220,
    color: '#ec4899',
    linkedTaskId: 'task-3',
  },
  {
    id: 'node-5',
    type: 'sticky',
    title: '💡 Idea: Live Canvas Whiteboard',
    content: 'Let users drag tasks directly into node diagrams and draw dependencies!',
    x: 440,
    y: 380,
    color: '#f59e0b',
  },
];

export const INITIAL_WHITEBOARD_EDGES: WhiteboardEdge[] = [
  { id: 'edge-1', from: 'node-2', to: 'node-1', label: 'Blocks GA' },
  { id: 'edge-2', from: 'node-3', to: 'node-1', label: 'Prerequisite' },
  { id: 'edge-3', from: 'node-4', to: 'node-1', label: 'Feature Launch' },
  { id: 'edge-4', from: 'node-5', to: 'node-3', label: 'Sprint 43' },
];
