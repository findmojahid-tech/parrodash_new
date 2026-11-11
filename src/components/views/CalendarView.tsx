import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Flag } from 'lucide-react';
import { Task, TaskStatus, Assignee } from '../../types';

interface CalendarViewProps {
  tasks: Task[];
  statuses: TaskStatus[];
  teamMembers: Assignee[];
  onSelectTask: (task: Task) => void;
  onQuickAddTaskWithDate: (dueDate: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  statuses,
  teamMembers,
  onSelectTask,
  onQuickAddTaskWithDate,
}) => {
  // Use November 2026 based on mock context date
  const [currentDate, setCurrentDate] = useState(new Date(2026, 10, 11)); // Nov 2026

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date(2026, 10, 11));
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Compute days in month
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const days: { day: number; isCurrentMonth: boolean; dateStr: string }[] = [];

  // Prev month padding
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const m = month === 0 ? 12 : month;
    const y = month === 0 ? year - 1 : year;
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({ day: d, isCurrentMonth: false, dateStr });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({ day: d, isCurrentMonth: true, dateStr });
  }

  // Next month padding to fill 35 or 42 cells
  const remainingCells = (7 - (days.length % 7)) % 7;
  for (let d = 1; d <= remainingCells; d++) {
    const m = month === 11 ? 1 : month + 2;
    const y = month === 11 ? year + 1 : year;
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({ day: d, isCurrentMonth: false, dateStr });
  }

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#111317] select-none p-6 overflow-hidden">
      {/* Calendar Header Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-bold text-white">{monthName}</h2>
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={prevMonth}
              className="p-1 hover:text-white text-slate-400 rounded hover:bg-slate-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goToToday}
              className="px-2 py-0.5 text-xs text-slate-300 hover:text-white font-medium"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              className="p-1 hover:text-white text-slate-400 rounded hover:bg-slate-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-2">
          <span>Click on any date to schedule a task</span>
        </div>
      </div>

      {/* Weekday Strip */}
      <div className="grid grid-cols-7 border-b border-slate-800 text-[11px] font-semibold text-slate-400 pb-2 text-center">
        {daysOfWeek.map(day => (
          <div key={day}>{day}</div>
        ))}
      </div>

      {/* Calendar Days Grid */}
      <div className="grid grid-cols-7 flex-1 border-b border-r border-slate-800/80 mt-1">
        {days.map((item, idx) => {
          const isToday = item.dateStr === '2026-11-11';
          const dayTasks = tasks.filter(t => t.dueDate === item.dateStr);

          return (
            <div
              key={idx}
              onClick={() => onQuickAddTaskWithDate(item.dateStr)}
              className={`border-t border-l border-slate-800/80 p-2 flex flex-col justify-between group hover:bg-slate-900/60 transition-colors cursor-pointer min-h-[90px] ${
                !item.isCurrentMonth ? 'bg-[#0e1014]/50 opacity-40' : 'bg-[#14161b]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-mono tabular-nums font-semibold w-5 h-5 flex items-center justify-center rounded-full ${
                    isToday ? 'bg-purple-600 text-white' : 'text-slate-300'
                  }`}
                >
                  {item.day}
                </span>

                <button
                  onClick={e => {
                    e.stopPropagation();
                    onQuickAddTaskWithDate(item.dateStr);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-opacity"
                  title="Add Task on this day"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Tasks on this day */}
              <div className="space-y-1 mt-1 overflow-y-auto max-h-20">
                {dayTasks.map(task => {
                  const status = statuses.find(s => s.id === task.statusId);
                  return (
                    <div
                      key={task.id}
                      onClick={e => {
                        e.stopPropagation();
                        onSelectTask(task);
                      }}
                      className="px-1.5 py-1 rounded text-[11px] font-medium text-white truncate flex items-center gap-1.5 hover:opacity-90 shadow-sm"
                      style={{ backgroundColor: status?.color || '#3b82f6' }}
                    >
                      <span className="font-mono text-[9px] opacity-80">{task.key}</span>
                      <span className="truncate">{task.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
