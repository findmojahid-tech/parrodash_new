import React, { useState, useRef } from 'react';
import { LayoutGrid, Plus, Sparkles, StickyNote, Move, Trash2 } from 'lucide-react';
import { WhiteboardNode, WhiteboardEdge, Task } from '../../types';

interface WhiteboardViewProps {
  nodes: WhiteboardNode[];
  edges: WhiteboardEdge[];
  onUpdateNodes: (nodes: WhiteboardNode[]) => void;
  onSelectTask: (task: Task) => void;
  tasks: Task[];
}

export const WhiteboardView: React.FC<WhiteboardViewProps> = ({
  nodes,
  edges,
  onUpdateNodes,
  onSelectTask,
  tasks,
}) => {
  const [activeDraggingNodeId, setActiveDraggingNodeId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveDraggingNodeId(nodeId);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!activeDraggingNodeId || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(20, Math.min(rect.width - 200, e.clientX - rect.left - 90));
    const y = Math.max(20, Math.min(rect.height - 120, e.clientY - rect.top - 40));

    onUpdateNodes(
      nodes.map(n => (n.id === activeDraggingNodeId ? { ...n, x, y } : n))
    );
  };

  const handleMouseUp = () => {
    setActiveDraggingNodeId(null);
  };

  const handleAddSticky = () => {
    const newNode: WhiteboardNode = {
      id: `node-${Date.now()}`,
      type: 'sticky',
      title: '💡 New Brainstorm Idea',
      content: 'Double click to edit note thoughts...',
      x: 300 + Math.random() * 100,
      y: 200 + Math.random() * 100,
      color: '#f59e0b',
    };
    onUpdateNodes([...nodes, newNode]);
  };

  const handleDeleteNode = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateNodes(nodes.filter(n => n.id !== id));
  };

  return (
    <div
      ref={canvasRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="flex-1 relative bg-[#0d0f14] overflow-hidden select-none"
      style={{
        backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      {/* Floating Toolbar */}
      <div className="absolute top-4 left-6 z-20 flex items-center gap-2 bg-[#181a20]/90 backdrop-blur border border-slate-700/80 rounded-xl px-3 py-1.5 shadow-xl">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
          <LayoutGrid className="w-4 h-4 text-purple-400" />
          <span>ClickUp Whiteboard</span>
        </div>

        <div className="h-4 w-px bg-slate-700 mx-1" />

        <button
          onClick={handleAddSticky}
          className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-medium rounded-lg border border-amber-500/30 transition-colors"
        >
          <StickyNote className="w-3.5 h-3.5" />
          <span>+ Sticky Note</span>
        </button>
      </div>

      {/* SVG Connecting Edges */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
        {edges.map(edge => {
          const fromNode = nodes.find(n => n.id === edge.from);
          const toNode = nodes.find(n => n.id === edge.to);
          if (!fromNode || !toNode) return null;

          const x1 = fromNode.x + 100;
          const y1 = fromNode.y + 40;
          const x2 = toNode.x + 100;
          const y2 = toNode.y + 40;

          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2;

          return (
            <g key={edge.id}>
              <path
                d={`M ${x1} ${y1} Q ${midX} ${y1 - 30} ${x2} ${y2}`}
                fill="none"
                stroke="#6366f1"
                strokeWidth="2"
                strokeDasharray="4 4"
                className="opacity-60"
              />
              {edge.label && (
                <text
                  x={midX}
                  y={midY - 10}
                  fill="#94a3b8"
                  fontSize="10"
                  textAnchor="middle"
                  fontFamily="sans-serif"
                >
                  {edge.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Canvas Nodes */}
      {nodes.map(node => {
        const isTask = node.type === 'task';
        const linkedTask = node.linkedTaskId ? tasks.find(t => t.id === node.linkedTaskId) : null;

        return (
          <div
            key={node.id}
            onMouseDown={e => handleMouseDown(node.id, e)}
            style={{
              transform: `translate(${node.x}px, ${node.y}px)`,
              borderColor: node.color,
            }}
            className="absolute w-56 rounded-xl border bg-[#181a22] shadow-2xl p-3 cursor-grab active:cursor-grabbing hover:border-purple-400 transition-shadow z-10 group"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                style={{ backgroundColor: `${node.color}25`, color: node.color }}
              >
                {node.type}
              </span>
              <button
                onClick={e => handleDeleteNode(node.id, e)}
                className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-500 hover:text-rose-400 rounded"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>

            <h4 className="text-xs font-bold text-white leading-tight mb-1">{node.title}</h4>

            {node.content && (
              <p className="text-[11px] text-slate-400 leading-snug line-clamp-3 mb-2">
                {node.content}
              </p>
            )}

            {isTask && linkedTask && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  onSelectTask(linkedTask);
                }}
                className="w-full mt-1 py-1 px-2 rounded bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-[11px] font-medium transition-colors text-center"
              >
                Open Task ({linkedTask.key})
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};
