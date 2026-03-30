'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  Panel,
  Handle,
  Position,
  BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// ── Types ──────────────────────────────────────────────────────────────────
export type GoalNodeType = 'root' | 'milestone' | 'action' | 'daily';

export interface BoxTask {
  id: string;
  text: string;
  done: boolean;
}

export interface GoalNodeData extends Record<string, unknown> {
  label: string;
  goalType: GoalNodeType;
  description: string;
  tasks: BoxTask[];
  onFocus?: (id: string) => void;
  accent?: string;
  isDark?: boolean;
}

const TYPE_COLORS: Record<GoalNodeType, string> = {
  root: '#00dcff',
  milestone: '#8c3cff',
  action: '#00ff88',
  daily: '#ffcc00'
};

const TYPE_ICONS: Record<GoalNodeType, string> = {
  root: '🎯',
  milestone: '🚩',
  action: '⚡',
  daily: '🔁'
};

// ── Custom Node Renderer ───────────────────────────────────────────────────
const GoalNodeComponent = ({ id, data, selected }: { id: string; data: GoalNodeData; selected: boolean }) => {
  const t = data.isDark ? '#fff' : '#1a2340';
  const sf = data.isDark ? 'rgba(255,255,255,.05)' : '#fff';
  const br = data.isDark ? 'rgba(255,255,255,.1)' : 'rgba(100,130,200,.2)';
  const color = TYPE_COLORS[data.goalType] || '#fff';
  const icon = TYPE_ICONS[data.goalType] || '📍';

  const total = data.tasks?.length || 0;
  const done = data.tasks?.filter(x => x.done).length || 0;
  const prog = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div
      onClick={() => data.onFocus?.(id)}
      style={{
        background: sf,
        border: `2px solid ${selected ? color : br}`,
        borderRadius: 12,
        padding: '12px 16px',
        minWidth: 180,
        boxShadow: selected ? `0 0 15px ${color}66` : '0 4px 12px rgba(0,0,0,0.1)',
        transition: 'all 0.2s ease',
        cursor: 'pointer'
      }}
    >
      {/* Input Handle (Top) - Allow multiple incoming edges unless root */}
      {data.goalType !== 'root' && (
        <Handle type="target" position={Position.Top} style={{ background: color, border: 'none', width: 10, height: 10 }} />
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: '1.2rem', background:`${color}22`, borderRadius:8, width:26, height:26, display:'flex', alignItems:'center', justifyContent:'center' }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: '.85rem', color: t }}>{data.label || 'Unnamed Node'}</div>
          <div style={{ fontSize: '.6rem', color: color, textTransform: 'uppercase', letterSpacing: '.1em', fontWeight: 700 }}>{data.goalType}</div>
        </div>
      </div>

      {data.description && (
        <div style={{ fontSize: '.7rem', color: data.isDark ? 'rgba(255,255,255,.6)' : '#4a5680', marginBottom: 8, maxHeight: 40, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {data.description}
        </div>
      )}

      {total > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.65rem', marginBottom: 3, fontWeight: 700, color: t }}>
            <span>Progress</span>
            <span>{prog}%</span>
          </div>
          <div style={{ height: 4, background: data.isDark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.05)', borderRadius: 2 }}>
            <div style={{ height: '100%', width: `${prog}%`, background: prog === 100 ? '#00c97a' : color, borderRadius: 2 }} />
          </div>
        </div>
      )}

      {/* Output Handle (Bottom) */}
      <Handle type="source" position={Position.Bottom} style={{ background: color, border: 'none', width: 10, height: 10 }} />
    </div>
  );
};

const nodeTypes = {
  goalNode: GoalNodeComponent
};

// ── Default Graph ──────────────────────────────────────────────────────────
const generateInitialNodes = (goalId: string, title?: string): GoalNode[] => [
  {
    id: `n-${goalId}-root`,
    type: 'goalNode',
    position: { x: 250, y: 50 },
    data: { label: title || 'Main Goal Workspace', goalType: 'root', description: 'Root goal hub.', tasks: [] }
  }
];

const initialEdges: Edge[] = [];

// ── Main View Component ───────────────────────────────────────────────────
export type GoalNode = Node<GoalNodeData, 'goalNode'>;

export function CanvasView({
  accent,
  isDark,
  goalId,
  goalTitle,
  onBack,
}: {
  accent: string;
  isDark: boolean;
  goalId: string;
  goalTitle?: string;
  onBack: () => void;
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState<GoalNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Theme Colors
  const t = isDark ? '#fff' : '#1a2340';
  const t2 = isDark ? 'rgba(255,255,255,.6)' : '#4a5680';
  const sf = isDark ? 'rgba(255,255,255,.03)' : '#fff';
  const br = isDark ? 'rgba(255,255,255,.09)' : 'rgba(100,130,200,.18)';
  const ib = isDark ? 'rgba(255,255,255,.06)' : 'rgba(230,238,255,.6)';
  const idB = isDark ? 'rgba(255,255,255,.1)' : 'rgba(100,130,200,.2)';

  // Persist State
  useEffect(() => {
    try {
      const savedNodes = JSON.parse(localStorage.getItem(`tl_canvas_nodes_${goalId}`) || 'null') as GoalNode[];
      const savedEdges = JSON.parse(localStorage.getItem(`tl_canvas_edges_${goalId}`) || 'null') as Edge[];
      if (savedNodes && savedNodes.length > 0) {
        setNodes(savedNodes as GoalNode[]);
        setEdges(savedEdges || []);
      } else {
        setNodes(generateInitialNodes(goalId, goalTitle));
        setEdges(initialEdges);
      }
    } catch {
      setNodes(generateInitialNodes(goalId, goalTitle));
      setEdges(initialEdges);
    }
  }, [setNodes, setEdges, goalId, goalTitle]);

  // Sync Node data with Theme and focus handlers
  const onFocus = useCallback((id: string) => setSelectedNodeId(id), []);
  const nodesWithProps = useMemo(() => {
    return nodes.map(n => ({
      ...n,
      data: {
        ...n.data,
        accent,
        isDark,
        onFocus
      }
    }));
  }, [nodes, accent, isDark, onFocus]);

  const onConnect = useCallback((params: Connection | Edge) => {
    const newEdge: Edge = { ...params, id: `e-${Date.now()}`, type: 'default', source: params.source || '', target: params.target || '', animated: true, style: { stroke: isDark ? 'rgba(255,255,255,0.4)' : '#8090b0', strokeWidth: 2 } };
    setEdges(eds => {
      const updated = addEdge(newEdge, eds);
      localStorage.setItem(`tl_canvas_edges_${goalId}`, JSON.stringify(updated));
      return updated;
    });
  }, [setEdges, isDark, goalId]);

  const saveNodes = (ns: GoalNode[]) => {
    setNodes(ns);
    localStorage.setItem(`tl_canvas_nodes_${goalId}`, JSON.stringify(ns));
  };

  const addNode = () => {
    const newNode: GoalNode = {
      id: `n-${Date.now()}`,
      type: 'goalNode',
      position: { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 },
      data: { label: 'New Goal', goalType: 'action', description: '', tasks: [], accent, isDark, onFocus }
    };
    saveNodes([...nodes, newNode]);
    setSelectedNodeId(newNode.id);
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  const updateNodeData = (field: string, value: any) => {
    if (!selectedNodeId) return;
    const ns = nodes.map(n => {
      if (n.id === selectedNodeId) {
        return { ...n, data: { ...n.data, [field]: value } };
      }
      return n;
    });
    saveNodes(ns);
  };

  const addTask = () => {
    if (!selectedNode) return;
    const tasks = selectedNode.data.tasks || [];
    updateNodeData('tasks', [...tasks, { id: `t${Date.now()}`, text: 'New sub-step', done: false }]);
  };

  const toggleTask = (taskId: string) => {
    if (!selectedNode) return;
    const tasks = selectedNode.data.tasks.map((t: BoxTask) => t.id === taskId ? { ...t, done: !t.done } : t);
    updateNodeData('tasks', tasks);
  };

  const updateTaskText = (taskId: string, txt: string) => {
    if (!selectedNode) return;
    const tasks = selectedNode.data.tasks.map((t: BoxTask) => t.id === taskId ? { ...t, text: txt } : t);
    updateNodeData('tasks', tasks);
  };

  const deleteNode = () => {
    if (!selectedNodeId) return;
    const ns = nodes.filter(n => n.id !== selectedNodeId);
    const es = edges.filter(e => e.source !== selectedNodeId && e.target !== selectedNodeId);
    setNodes(ns);
    setEdges(es);
    localStorage.setItem(`tl_canvas_nodes_${goalId}`, JSON.stringify(ns));
    localStorage.setItem(`tl_canvas_edges_${goalId}`, JSON.stringify(es));
    setSelectedNodeId(null);
  };

  const onNodesChangeWrapped = (changes: any) => {
    onNodesChange(changes);
    setTimeout(() => localStorage.setItem(`tl_canvas_nodes_${goalId}`, JSON.stringify(nodes)), 100);
  };

  const inpStyle = {
    background: ib, border: `1px solid ${idB}`, borderRadius: 8, padding: '8px 12px',
    color: t, fontFamily: 'inherit', fontSize: '.84rem', outline: 'none', width: '100%', boxSizing: 'border-box' as const
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '75vh', border: `1px solid ${br}`, borderRadius: 14, overflow: 'hidden' }}>
      {/* Absolute full width parent guarantees ReactFlow does not collapse */}
      <ReactFlow
        nodes={nodesWithProps}
        edges={edges}
        onNodesChange={onNodesChangeWrapped}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background 
           variant={BackgroundVariant.Dots} 
           gap={24} 
           size={2} 
           color={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} 
        />
        <Controls style={{ display: 'flex', flexDirection: 'column' }} />
        <MiniMap 
           nodeStrokeColor={(n) => TYPE_COLORS[n.data.goalType as GoalNodeType] || '#fff'}
           nodeColor={isDark ? '#1a2340' : '#fff'}
           maskColor={isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.6)'}
           style={{ background: sf }}
        />
        
        <Panel position="top-left" style={{ display: 'flex', gap: 10 }}>
          <button 
            onClick={onBack}
            style={{ padding: '8px 14px', background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', border: `1px solid ${br}`, borderRadius: 8, color: t, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center' }}
          >
            ← Back
          </button>
          <button 
            onClick={addNode}
            style={{ padding: '8px 16px', background: accent, border: 'none', borderRadius: 8, color: '#000', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            + Add Action Node
          </button>
        </Panel>
      </ReactFlow>

      {/* Slide-over Node Editor Panel */}
      {selectedNode && (
        <div style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, width: 340,
          background: isDark ? 'rgba(10,16,28,0.95)' : 'rgba(250,252,255,0.95)',
          backdropFilter: 'blur(10px)', borderLeft: `1px solid ${br}`,
          padding: 24, paddingBottom: 40,
          boxShadow: '-10px 0 30px rgba(0,0,0,0.2)',
          display: 'flex', flexDirection: 'column', gap: 16,
          zIndex: 10, overflowY: 'auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '.75rem', fontWeight: 800, color: TYPE_COLORS[selectedNode.data.goalType as GoalNodeType], textTransform: 'uppercase', letterSpacing: '.1em' }}>Edit Node</span>
            <button onClick={() => setSelectedNodeId(null)} style={{ background: 'none', border: 'none', color: t2, cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
          </div>

          <div>
            <label style={{ fontSize: '.65rem', color: t2, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.1em' }}>Label</label>
            <input value={selectedNode.data.label as string} onChange={e => updateNodeData('label', e.target.value)} style={inpStyle} />
          </div>

          <div>
            <label style={{ fontSize: '.65rem', color: t2, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.1em' }}>Node Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {(['root', 'milestone', 'action', 'daily'] as GoalNodeType[]).map(type => (
                <button
                  key={type}
                  onClick={() => updateNodeData('goalType', type)}
                  style={{
                    padding: '8px 4px', borderRadius: 6, cursor: 'pointer', fontSize: '.75rem', fontWeight: 600, fontFamily: 'inherit',
                    background: selectedNode.data.goalType === type ? `${TYPE_COLORS[type]}22` : 'transparent',
                    color: selectedNode.data.goalType === type ? TYPE_COLORS[type] : t2,
                    border: `1px solid ${selectedNode.data.goalType === type ? TYPE_COLORS[type] : idB}`
                  }}
                >
                  {TYPE_ICONS[type]} {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '.65rem', color: t2, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.1em' }}>Description</label>
            <textarea value={selectedNode.data.description as string} onChange={e => updateNodeData('description', e.target.value)} rows={3} style={{ ...inpStyle, resize: 'vertical' }} />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ fontSize: '.65rem', color: t2, textTransform: 'uppercase', letterSpacing: '.1em' }}>Checklist / Habits</label>
              <button onClick={addTask} style={{ background: 'none', border: `1px solid ${br}`, color: accent, borderRadius: 5, padding: '3px 8px', fontSize: '.7rem', cursor: 'pointer' }}>+ Add</button>
            </div>
            {(selectedNode.data.tasks as BoxTask[])?.map(task => (
              <div key={task.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                <button onClick={() => toggleTask(task.id)} style={{ width: 14, height: 14, flexShrink: 0, marginTop: 6, borderRadius: 4, background: task.done ? '#00c97a' : 'transparent', border: `1.5px solid ${task.done ? '#00c97a' : idB}`, cursor: 'pointer', outline: 'none' }} />
                <input value={task.text} onChange={e => updateTaskText(task.id, e.target.value)} style={{ ...inpStyle, padding: '4px 8px', background: 'transparent', textDecoration: task.done ? 'line-through' : 'none', color: task.done ? t2 : t }} />
              </div>
            ))}
            {!(selectedNode.data.tasks?.length) && <div style={{ fontSize: '.75rem', color: t2, fontStyle: 'italic' }}>No steps added. Break this down!</div>}
          </div>

          <div style={{ marginTop: 'auto', paddingTop: 24 }}>
            <button onClick={deleteNode} style={{ width: '100%', padding: '10px 0', background: 'rgba(232,51,74,.1)', border: '1px solid rgba(232,51,74,.3)', color: '#e8334a', borderRadius: 8, fontWeight: 700, cursor: 'pointer', transition: '.2s' }}>
              Delete Node
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
