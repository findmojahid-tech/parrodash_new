import React, { useEffect, useState } from 'react';
import { Square, Clock } from 'lucide-react';
import { Task } from '../../types';

interface TimeTrackerBarProps {
  activeTask: Task | null;
  onStopTimer: () => void;
  onOpenTask: (task: Task) => void;
}

export const TimeTrackerBar: React.FC<TimeTrackerBarProps> = ({
  activeTask,
  onStopTimer,
  onOpenTask,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!activeTask) {
      setElapsedSeconds(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTask]);

  if (!activeTask) return null;

  const totalLogged = activeTask.loggedSeconds + elapsedSeconds;
  const hrs = Math.floor(totalLogged / 3600);
  const mins = Math.floor((totalLogged % 3600) / 60);
  const secs = totalLogged % 60;

  const timeString = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(
    secs
  ).padStart(2, '0')}`;

  return (
    <div className="fixed bottom-4 right-6 z-40 bg-[#14161c] border border-slate-700/60 rounded-lg shadow-xl px-3 py-2 flex items-center gap-3 select-none text-xs">
      <div
        onClick={() => onOpenTask(activeTask)}
        className="flex items-center gap-2 cursor-pointer hover:opacity-80"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
        <span className="font-mono text-[11px] text-purple-400">{activeTask.key}</span>
        <span className="text-slate-300 font-medium truncate max-w-[160px]">{activeTask.title}</span>
        <span className="font-mono text-slate-400 tabular-nums">{timeString}</span>
      </div>

      <div className="h-3 w-px bg-slate-800" />

      <button
        onClick={onStopTimer}
        className="flex items-center gap-1 text-rose-400 hover:text-rose-300 font-medium"
      >
        <Square className="w-3 h-3 fill-current" />
        <span>Stop</span>
      </button>
    </div>
  );
};
