import React, { useEffect, useRef, useState, useMemo } from 'react';
import { MindMapNode, ChatContextPayload, ContextType } from '../types';

interface MindMapViewerProps {
  nodes: MindMapNode[];
  onExpand: (nodeId: string, label: string) => void;
  onChat: (payload: ChatContextPayload) => void;
  isLoading: boolean;
  docTitle: string;
}

const MindMapViewer: React.FC<MindMapViewerProps> = ({ nodes, onExpand, onChat, isLoading, docTitle }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, nodeId: string } | null>(null);
  const [viewBox, setViewBox] = useState({ x: -400, y: -300, w: 800, h: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Handle Pan/Zoom
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === svgRef.current) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setContextMenu(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const dx = (e.clientX - dragStart.x) * (viewBox.w / svgRef.current!.clientWidth);
      const dy = (e.clientY - dragStart.y) * (viewBox.h / svgRef.current!.clientHeight);
      setViewBox(prev => ({ ...prev, x: prev.x - dx, y: prev.y - dy }));
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => setIsDragging(false);
  const handleWheel = (e: React.WheelEvent) => {
    const scale = e.deltaY > 0 ? 1.1 : 0.9;
    setViewBox(prev => ({
      x: prev.x - (prev.w * (1 - scale)) / 2,
      y: prev.y - (prev.h * (1 - scale)) / 2,
      w: prev.w * scale,
      h: prev.h * scale
    }));
  };

  // Node Interactions
  const handleNodeClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedNode(id);
    setContextMenu(null);
  };

  const handleNodeDoubleClick = (e: React.MouseEvent, id: string, label: string) => {
    e.stopPropagation();
    onExpand(id, label);
  };

  const handleContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedNode(id);
    // Calculate position relative to the container, not screen
    const rect = svgRef.current?.getBoundingClientRect();
    if (rect) {
        setContextMenu({ 
            x: e.clientX - rect.left, 
            y: e.clientY - rect.top, 
            nodeId: id 
        });
    }
  };

  const startChat = (mode: ContextType) => {
    if (!contextMenu) return;
    const node = nodes.find(n => n.id === contextMenu.nodeId);
    if (!node) return;

    // Build hierarchy string (simple version)
    let hierarchy = node.label;
    let curr = node;
    while(curr.parentId) {
        const parent = nodes.find(n => n.id === curr.parentId);
        if(parent) {
            hierarchy = `${parent.label} > ${hierarchy}`;
            curr = parent;
        } else {
            break;
        }
    }

    onChat({
        selectedConcept: node.label,
        contextType: mode,
        nodeHierarchy: hierarchy
    });
    setContextMenu(null);
  };

  // Derived Edges
  const edges = useMemo(() => {
    const result: { x1: number, y1: number, x2: number, y2: number }[] = [];
    nodes.forEach(node => {
      if (node.parentId) {
        const parent = nodes.find(n => n.id === node.parentId);
        if (parent) {
          result.push({ x1: parent.x, y1: parent.y, x2: node.x, y2: node.y });
        }
      }
    });
    return result;
  }, [nodes]);

  return (
    <div className="w-full h-full bg-slate-100 relative overflow-hidden select-none">
      {/* Toolbar / Legend */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur p-3 rounded-lg shadow-sm border border-slate-200 z-10">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{docTitle || "Document"} Mindmap</h3>
        <p className="text-[10px] text-slate-400">
            Double-click to expand • Right-click for options
        </p>
        {isLoading && <span className="text-xs text-blue-600 font-medium animate-pulse mt-1 block">Analyzing structure...</span>}
      </div>

      <svg
        ref={svgRef}
        className="w-full h-full cursor-move bg-slate-50"
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <defs>
          <marker id="arrow" markerWidth="10" markerHeight="10" refX="20" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="#cbd5e1" />
          </marker>
        </defs>

        {/* Edges */}
        {edges.map((edge, i) => (
          <line
            key={i}
            x1={edge.x1}
            y1={edge.y1}
            x2={edge.x2}
            y2={edge.y2}
            stroke="#cbd5e1"
            strokeWidth="2"
            markerEnd="url(#arrow)"
          />
        ))}

        {/* Nodes */}
        {nodes.map(node => (
          <g
            key={node.id}
            transform={`translate(${node.x}, ${node.y})`}
            onClick={(e) => handleNodeClick(e, node.id)}
            onDoubleClick={(e) => handleNodeDoubleClick(e, node.id, node.label)}
            onContextMenu={(e) => handleContextMenu(e, node.id)}
            className="cursor-pointer transition-all duration-300"
          >
            <circle
              r={node.depth === 0 ? 40 : node.depth === 1 ? 30 : 20}
              fill={selectedNode === node.id ? '#eff6ff' : 'white'}
              stroke={selectedNode === node.id ? '#2563eb' : node.depth === 0 ? '#3b82f6' : '#64748b'}
              strokeWidth={selectedNode === node.id ? 3 : 2}
              className="transition-colors shadow-sm"
            />
            <foreignObject x={-60} y={-40} width={120} height={80} pointerEvents="none">
               <div className="w-full h-full flex flex-col items-center justify-center text-center p-1">
                 <span className={`text-xs font-bold leading-tight ${node.depth === 0 ? 'text-slate-800' : 'text-slate-600'}`}>
                    {node.label}
                 </span>
                 {selectedNode === node.id && (
                     <span className="text-[8px] text-slate-400 mt-1 line-clamp-2 leading-none bg-white/80 rounded px-1">
                         {node.description}
                     </span>
                 )}
               </div>
            </foreignObject>
            
            {/* Expansion Indicator */}
            {node.children.length === 0 && !node.isExpanded && (
                <circle cx={node.depth === 0 ? 30 : 22} cy={0} r={4} fill="#10b981" />
            )}
          </g>
        ))}
      </svg>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="absolute bg-white rounded-lg shadow-xl border border-slate-200 w-48 py-1 z-20 text-sm overflow-hidden"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <div className="px-3 py-2 border-b border-slate-100 bg-slate-50 text-xs font-bold text-slate-600">
            Node Actions
          </div>
          <button 
            onClick={() => startChat('strict')}
            className="w-full text-left px-3 py-2 hover:bg-blue-50 text-slate-700 hover:text-blue-600 transition-colors flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-red-400"></span>
            Strict Chat (PDF Only)
          </button>
          <button 
            onClick={() => startChat('liberal')}
            className="w-full text-left px-3 py-2 hover:bg-blue-50 text-slate-700 hover:text-blue-600 transition-colors flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
            Liberal Chat (+Info)
          </button>
          <button 
            onClick={() => startChat('expansive')}
            className="w-full text-left px-3 py-2 hover:bg-blue-50 text-slate-700 hover:text-blue-600 transition-colors flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-green-400"></span>
            Expansive Chat (Deep)
          </button>
        </div>
      )}
    </div>
  );
};

export default MindMapViewer;