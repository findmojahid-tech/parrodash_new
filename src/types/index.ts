export type Priority = 'urgent' | 'high' | 'normal' | 'low' | 'none';

export type StatusCategory = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done' | 'closed';

export interface TaskStatus {
  id: string;
  name: string;
  color: string;
  category: StatusCategory;
}

export interface Assignee {
  id: string;
  name: string;
  email: string;
  avatar: string;
  color: string;
  role: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  assigneeId?: string;
  dueDate?: string;
  estimatedHours?: number;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface TaskComment {
  id: string;
  authorId: string;
  text: string;
  createdAt: string;
  reactions?: { [emoji: string]: number };
}

export interface TimeEntry {
  id: string;
  taskId: string;
  durationSeconds: number;
  date: string;
  note?: string;
}

export interface CustomFields {
  storyPoints?: number;
  department?: string;
  client?: string;
  riskLevel?: 'Low' | 'Medium' | 'High';
  progressPercent?: number;
}

export interface Task {
  id: string;
  key: string; // e.g. "CU-101"
  title: string;
  description: string;
  statusId: string;
  priority: Priority;
  spaceId: string;
  listId: string;
  folderId?: string;
  assigneeIds: string[];
  tags: string[];
  startDate?: string;
  dueDate?: string;
  estimatedHours: number;
  loggedSeconds: number;
  subtasks: Subtask[];
  checklists: ChecklistItem[];
  comments: TaskComment[];
  customFields: CustomFields;
  createdAt: string;
  updatedAt: string;
  order: number;
}

export interface ClickUpList {
  id: string;
  name: string;
  spaceId: string;
  folderId?: string;
  color?: string;
  icon?: string;
  taskCount?: number;
}

export interface ClickUpFolder {
  id: string;
  name: string;
  spaceId: string;
  color?: string;
  lists: ClickUpList[];
}

export interface ClickUpSpace {
  id: string;
  name: string;
  color: string;
  icon: string;
  description: string;
  statuses: TaskStatus[];
  folders: ClickUpFolder[];
  lists: ClickUpList[]; // Direct lists not in folders
}

export interface DocPage {
  id: string;
  title: string;
  content: string;
  icon: string;
  updatedAt: string;
  authorId: string;
}

export interface WhiteboardNode {
  id: string;
  type: 'task' | 'sticky' | 'milestone' | 'decision';
  title: string;
  content?: string;
  x: number;
  y: number;
  color: string;
  linkedTaskId?: string;
}

export interface WhiteboardEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
}

export type ActiveView = 'dashboard' | 'list' | 'board' | 'calendar' | 'gantt' | 'table' | 'docs' | 'whiteboard' | 'people' | 'crm';

export interface FilterState {
  searchQuery: string;
  statusId: string | 'all';
  priority: Priority | 'all';
  assigneeId: string | 'all';
  tag: string | 'all';
  groupBy: 'status' | 'assignee' | 'priority' | 'dueDate';
}
