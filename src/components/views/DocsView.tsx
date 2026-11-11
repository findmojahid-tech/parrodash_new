import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Share2,
  Download,
  Bold,
  Italic,
  Code,
  List,
  CheckSquare,
  Heading1,
  Heading2,
  Sparkles,
} from 'lucide-react';
import { DocPage, Assignee } from '../../types';

interface DocsViewProps {
  docs: DocPage[];
  onUpdateDoc: (doc: DocPage) => void;
  onCreateDoc: () => void;
  onDeleteDoc: (docId: string) => void;
  currentUser: Assignee;
}

export const DocsView: React.FC<DocsViewProps> = ({
  docs,
  onUpdateDoc,
  onCreateDoc,
  onDeleteDoc,
  currentUser,
}) => {
  const [activeDocId, setActiveDocId] = useState<string>(docs[0]?.id || '');
  const activeDoc = docs.find(d => d.id === activeDocId) || docs[0];

  const handleTitleChange = (title: string) => {
    if (!activeDoc) return;
    onUpdateDoc({ ...activeDoc, title, updatedAt: 'Just now' });
  };

  const handleContentChange = (content: string) => {
    if (!activeDoc) return;
    onUpdateDoc({ ...activeDoc, content, updatedAt: 'Just now' });
  };

  const handleDownload = () => {
    if (!activeDoc) return;
    const blob = new Blob([activeDoc.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeDoc.title.replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const insertSnippet = (prefix: string, suffix = '') => {
    if (!activeDoc) return;
    handleContentChange(activeDoc.content + '\n' + prefix + ' ' + suffix);
  };

  return (
    <div className="flex-1 flex h-full bg-[#111317] select-none overflow-hidden">
      {/* Left Sidebar: Pages Tree */}
      <div className="w-64 border-r border-slate-800 bg-[#14161b] flex flex-col shrink-0">
        <div className="p-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <FileText className="w-4 h-4 text-purple-400" />
            <span>ClickUp Docs</span>
          </div>
          <button
            onClick={onCreateDoc}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
            title="Create New Doc"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Doc List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {docs.map(doc => {
            const isSelected = doc.id === activeDoc?.id;
            return (
              <div
                key={doc.id}
                onClick={() => setActiveDocId(doc.id)}
                className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-xs cursor-pointer group transition-colors ${
                  isSelected
                    ? 'bg-purple-600/20 text-purple-300 font-semibold border border-purple-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                  <span className="truncate">{doc.title}</span>
                </div>

                {docs.length > 1 && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onDeleteDoc(doc.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-500 hover:text-rose-400"
                    title="Delete doc"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Pane: Document Editor */}
      {activeDoc ? (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#12141a]">
          {/* Header Controls */}
          <div className="px-8 py-3 border-b border-slate-800 flex items-center justify-between bg-[#14161b]">
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span>Last updated: {activeDoc.updatedAt}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                title="Download as Markdown"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export MD</span>
              </button>
            </div>
          </div>

          {/* Quick Formatting Bar */}
          <div className="px-8 py-2 border-b border-slate-800/60 bg-[#151820] flex items-center gap-1 text-slate-400">
            <button
              onClick={() => insertSnippet('# Heading 1')}
              className="p-1.5 hover:bg-slate-800 hover:text-white rounded"
              title="Heading 1"
            >
              <Heading1 className="w-4 h-4" />
            </button>
            <button
              onClick={() => insertSnippet('## Heading 2')}
              className="p-1.5 hover:bg-slate-800 hover:text-white rounded"
              title="Heading 2"
            >
              <Heading2 className="w-4 h-4" />
            </button>
            <div className="h-4 w-px bg-slate-800 mx-1" />
            <button
              onClick={() => insertSnippet('**Bold Text**')}
              className="p-1.5 hover:bg-slate-800 hover:text-white rounded"
              title="Bold"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              onClick={() => insertSnippet('*Italic Text*')}
              className="p-1.5 hover:bg-slate-800 hover:text-white rounded"
              title="Italic"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              onClick={() => insertSnippet('- [ ] Checklist item')}
              className="p-1.5 hover:bg-slate-800 hover:text-white rounded"
              title="Checklist"
            >
              <CheckSquare className="w-4 h-4" />
            </button>
            <button
              onClick={() => insertSnippet('```typescript\n// Code here\n```')}
              className="p-1.5 hover:bg-slate-800 hover:text-white rounded"
              title="Code block"
            >
              <Code className="w-4 h-4" />
            </button>
          </div>

          {/* Document Content Viewport */}
          <div className="flex-1 overflow-y-auto px-12 py-8 max-w-4xl mx-auto w-full space-y-4">
            {/* Title Input */}
            <input
              type="text"
              value={activeDoc.title}
              onChange={e => handleTitleChange(e.target.value)}
              placeholder="Untitled Document"
              className="w-full text-2xl font-black text-white bg-transparent border-none focus:outline-none placeholder-slate-600 tracking-tight"
            />

            {/* Markdown Body Textarea */}
            <textarea
              value={activeDoc.content}
              onChange={e => handleContentChange(e.target.value)}
              placeholder="Start typing your doc or markdown notes here..."
              rows={24}
              className="w-full bg-transparent text-slate-200 text-sm leading-relaxed border-none focus:outline-none resize-none font-mono"
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
          Select or create a document to get started
        </div>
      )}
    </div>
  );
};
