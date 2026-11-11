import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Copy,
  Check,
  Send,
  Plus,
} from 'lucide-react';
import { Task, Assignee } from '../../types';
import { requestBrainAI } from '../../services/brainService';

interface ClickUpBrainModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  teamMembers: Assignee[];
  onCreateTaskFromBrain: (title: string, description: string) => void;
}

export const ClickUpBrainModal: React.FC<ClickUpBrainModalProps> = ({
  isOpen,
  onClose,
  tasks,
  teamMembers,
  onCreateTaskFromBrain,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'standup' | 'sprint' | 'drafter' | 'ask'>('standup');
  const [loading, setLoading] = useState(false);
  const [resultText, setResultText] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const [draftTitle, setDraftTitle] = useState('Real-Time Webhook Event Dispatcher');
  const [userQuery, setUserQuery] = useState('');

  const handleGenerateStandup = async () => {
    setLoading(true);
    setResultText('');
    try {
      const resp = await requestBrainAI({
        type: 'sprint_standup',
        taskTitle: 'Engineering Standup',
        contextData: tasks.map(t => ({
          key: t.key,
          title: t.title,
          priority: t.priority,
          statusId: t.statusId,
        })),
      });
      if (resp.success && typeof resp.result === 'string') {
        setResultText(resp.result);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSprintRetrospective = async () => {
    setLoading(true);
    setResultText('');
    try {
      const resp = await requestBrainAI({
        type: 'summarize_task',
        taskTitle: 'Sprint 42 Retrospective',
        taskDescription: 'Overall team throughput, remaining story points, and release risks',
        contextData: {
          totalTasks: tasks.length,
          completed: tasks.filter(t => t.statusId === 'status-complete').length,
          inProgress: tasks.filter(t => t.statusId === 'status-in-progress').length,
          totalStoryPoints: tasks.reduce((acc, t) => acc + (t.customFields.storyPoints || 0), 0),
        },
      });
      if (resp.success && typeof resp.result === 'string') {
        setResultText(resp.result);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDraftTicket = async () => {
    if (!draftTitle.trim()) return;
    setLoading(true);
    setResultText('');
    try {
      const resp = await requestBrainAI({
        type: 'write_description',
        taskTitle: draftTitle,
      });
      if (resp.success && typeof resp.result === 'string') {
        setResultText(resp.result);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAskBrain = async () => {
    if (!userQuery.trim()) return;
    setLoading(true);
    setResultText('');
    try {
      const resp = await requestBrainAI({
        type: 'ask_brain',
        taskTitle: 'Workspace Query',
        userPrompt: userQuery,
        contextData: {
          tasksCount: tasks.length,
        },
      });
      if (resp.success && typeof resp.result === 'string') {
        setResultText(resp.result);
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(resultText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-[#14161b] border border-slate-800/80 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] select-none text-xs">
        {/* Minimal Header */}
        <div className="px-5 py-3 border-b border-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="font-semibold text-white">ClickUp Brain</span>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-500 hover:text-white rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Minimal Tab Switcher */}
        <div className="flex items-center gap-1 px-5 pt-2 border-b border-slate-800/40">
          {[
            { id: 'standup', label: 'Standup' },
            { id: 'sprint', label: 'Retrospective' },
            { id: 'drafter', label: 'Draft Spec' },
            { id: 'ask', label: 'Ask AI' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setResultText('');
              }}
              className={`px-3 py-1.5 text-xs font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-purple-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 flex-1 overflow-y-auto">
          {activeTab === 'standup' && (
            <div className="space-y-3">
              <p className="text-slate-400">
                Summarize completed work and active tickets into a daily standup.
              </p>
              <button
                onClick={handleGenerateStandup}
                disabled={loading}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded font-medium transition-colors"
              >
                {loading ? 'Synthesizing...' : 'Generate Standup'}
              </button>
            </div>
          )}

          {activeTab === 'sprint' && (
            <div className="space-y-3">
              <p className="text-slate-400">
                Analyze velocity, delivered story points, and sprint status.
              </p>
              <button
                onClick={handleSprintRetrospective}
                disabled={loading}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded font-medium transition-colors"
              >
                {loading ? 'Analyzing...' : 'Generate Retrospective'}
              </button>
            </div>
          )}

          {activeTab === 'drafter' && (
            <div className="space-y-2">
              <label className="text-slate-400">Task or feature title:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={draftTitle}
                  onChange={e => setDraftTitle(e.target.value)}
                  placeholder="Feature name..."
                  className="flex-1 bg-[#1a1d24] border border-slate-700/60 rounded px-2.5 py-1 text-white focus:outline-none"
                />
                <button
                  onClick={handleDraftTicket}
                  disabled={loading}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded font-medium"
                >
                  {loading ? 'Drafting...' : 'Draft'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'ask' && (
            <div className="space-y-2">
              <label className="text-slate-400">Question:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={userQuery}
                  onChange={e => setUserQuery(e.target.value)}
                  placeholder="e.g. What are the urgent blockers?"
                  className="flex-1 bg-[#1a1d24] border border-slate-700/60 rounded px-2.5 py-1 text-white focus:outline-none"
                />
                <button
                  onClick={handleAskBrain}
                  disabled={loading}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded font-medium"
                >
                  {loading ? 'Thinking...' : 'Ask'}
                </button>
              </div>
            </div>
          )}

          {/* Results Output */}
          {resultText && (
            <div className="mt-3 p-3.5 rounded-lg bg-[#181a20] border border-slate-800 space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800/60">
                <span className="font-medium text-slate-300">Generated Output</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>

                  {activeTab === 'drafter' && (
                    <button
                      onClick={() => {
                        onCreateTaskFromBrain(draftTitle, resultText);
                        onClose();
                      }}
                      className="flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Create Task</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="text-slate-300 whitespace-pre-wrap leading-relaxed font-mono text-[11px] max-h-60 overflow-y-auto">
                {resultText}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
