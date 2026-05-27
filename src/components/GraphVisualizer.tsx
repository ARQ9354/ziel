import React, { useEffect, useRef, useState, useMemo } from 'react';
import { DocumentPage, LinkConnection, VisualNode, VisualEdge } from '../types';
import { computeTransitiveConnections, generateInitialLayout, runForceSimulationStep } from '../utils/graphUtils';
import { Share2, Compass, Network, Eye, EyeOff, Search, Info, HelpCircle } from 'lucide-react';

interface GraphVisualizerProps {
  pages: DocumentPage[];
  links: LinkConnection[];
  activePageId: string;
  onSelectPage: (id: string) => void;
  onAddLink: (fromId: string, toId: string) => void;
}

export default function GraphVisualizer({
  pages,
  links,
  activePageId,
  onSelectPage,
  onAddLink,
}: GraphVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 700, height: 450 });
  const [nodes, setNodes] = useState<VisualNode[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  
  // Toggles for visual clarity
  const [showTransitive, setShowTransitive] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Hovered connection details
  const [hoveredEdge, setHoveredEdge] = useState<VisualEdge | null>(null);

  // Derive direct and transitive edge closures
  const { directEdges, transitiveEdges } = useMemo(() => {
    return computeTransitiveConnections(pages, links);
  }, [pages, links]);

  // Combine visible edges based on state
  const visibleEdges = useMemo(() => {
    return showTransitive ? [...directEdges, ...transitiveEdges] : directEdges;
  }, [directEdges, transitiveEdges, showTransitive]);

  // Track size change dynamically with standard ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        setDimensions({
          width: Math.max(width, 400),
          height: Math.max(height, 350)
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Initialize nodes only once or when pages structural length changes
  useEffect(() => {
    setNodes((prevNodes) => {
      // Preserve coordinate values if already positioned, just insert new entries
      const prevMap = new Map<string, VisualNode>();
      prevNodes.forEach((n) => {
        prevMap.set(n.id, n);
      });
      const newLayout = generateInitialLayout(pages, dimensions.width, dimensions.height);
      
      return newLayout.map((node) => {
        if (prevMap.has(node.id)) {
          const match = prevMap.get(node.id)!;
          return {
            ...node,
            x: match.x,
            y: match.y,
            vx: match.vx,
            vy: match.vy,
          };
        }
        return node;
      });
    });
  }, [pages, dimensions.width, dimensions.height]);

  // Physics animation loop
  useEffect(() => {
    let animId: number;
    const handleTick = () => {
      setNodes((currentNodes) => {
        // Skip updating coordinates on standard manual dragging to keep pointer smooth
        const physicsNodes = currentNodes.map((n) => {
          if (n.id === draggedNodeId) return n;
          return n;
        });
        return runForceSimulationStep(physicsNodes, visibleEdges, dimensions.width, dimensions.height);
      });
      animId = requestAnimationFrame(handleTick);
    };

    animId = requestAnimationFrame(handleTick);
    return () => cancelAnimationFrame(animId);
  }, [visibleEdges, dimensions.width, dimensions.height, draggedNodeId]);

  // Handle manual coordinate dragging
  const handlePointerDown = (nodeId: string, event: React.PointerEvent) => {
    event.preventDefault();
    setDraggedNodeId(nodeId);
    setSelectedNodeId(nodeId);
    onSelectPage(nodeId);
    (event.target as Element).setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    if (draggedNodeId === null) return;
    const svgRect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - svgRect.left;
    const y = event.clientY - svgRect.top;

    setNodes((prev) =>
      prev.map((n) =>
        n.id === draggedNodeId
          ? { ...n, x: Math.max(20, Math.min(dimensions.width - 20, x)), y: Math.max(20, Math.min(dimensions.height - 20, y)), vx: 0, vy: 0 }
          : n
      )
    );
  };

  const handlePointerUp = (event: React.PointerEvent) => {
    if (draggedNodeId !== null) {
      setDraggedNodeId(null);
    }
  };

  // Quick relation linking menu
  const [linkSourceId, setLinkSourceId] = useState<string | null>(null);
  const handleStartLinking = (id: string) => {
    setLinkSourceId(id);
  };

  const handleFinishLinking = (id: string) => {
    if (linkSourceId && linkSourceId !== id) {
      onAddLink(linkSourceId, id);
    }
    setLinkSourceId(null);
  };

  // Filter nodes matching search criteria
  const isMatch = (node: VisualNode) => {
    if (!searchQuery) return true;
    return node.label.toLowerCase().includes(searchQuery.toLowerCase());
  };

  return (
    <div className="flex flex-col bg-white border border-[#E8E8E6] rounded-xl overflow-hidden shadow-sm transition-all duration-300">
      
      {/* Header Panel */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#E8E8E6] bg-[#F7F7F5] p-4 gap-3">
        <div className="flex items-center gap-2">
          <Network className="h-4.5 w-4.5 text-[#37352F] animate-pulse" />
          <h2 className="text-xs font-bold text-[#37352F] tracking-wide uppercase">
            AUTOMATIC KNOWLEDGE GRAPH VISUALIZER
          </h2>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#37352F]/40" />
            <input
              type="text"
              placeholder="Search graph nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-white border border-[#E8E8E6] text-xs rounded-lg text-[#37352F] placeholder-[#37352F]/40 focus:outline-none focus:border-[#37352F] w-44"
            />
          </div>

          {/* Toggle Transitive view */}
          <button
            onClick={() => setShowTransitive(!showTransitive)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
              showTransitive 
                ? 'bg-amber-50 border border-amber-300 text-amber-800 hover:bg-amber-100' 
                : 'bg-white border border-[#E8E8E6] text-[#37352F]/70 hover:bg-[#F1F1EF]'
            }`}
            title="Compute and display indirect transitive links automatically"
          >
            {showTransitive ? <Eye className="h-3.5 w-3.5 text-amber-600" /> : <EyeOff className="h-3.5 w-3.5" />}
            Transitive Links: {showTransitive ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* SVG Container */}
      <div className="relative flex-1 bg-gradient-to-b from-[#FFFFFF] to-[#F9F9F8] overflow-hidden" ref={containerRef}>
        
        {/* Dynamic Canvas */}
        <svg
          width={dimensions.width}
          height={dimensions.height}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="select-none cursor-grab active:cursor-grabbing w-full h-full"
          id="knowledge-graph-svg"
        >
          {/* Markers/Arrows for connections */}
          <defs>
            <marker
              id="arrow-direct"
              viewBox="0 0 10 10"
              refX="33"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#10B981" />
            </marker>
            <marker
              id="arrow-active"
              viewBox="0 0 10 10"
              refX="33"
              refY="5"
              markerWidth="8"
              markerHeight="8"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#4F46E5" />
            </marker>
            <marker
              id="arrow-transitive"
              viewBox="0 0 10 10"
              refX="33"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#D97706" />
            </marker>
          </defs>

          {/* Grid Background */}
          <g className="opacity-[0.45]">
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E8E8E6" strokeWidth="1" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </g>

          {/* Edges layer */}
          <g>
            {(() => {
              const renderedPairs = new Set<string>();
              return visibleEdges.map((edge) => {
                const fromNode = nodes.find((n) => n.id === edge.source);
                const toNode = nodes.find((n) => n.id === edge.target);
                if (!fromNode || !toNode) return null;

                // Avoid drawing redundant visual paths for symmetrical transitive nodes
                const pairKey = [edge.source, edge.target].sort().join('-');
                if (renderedPairs.has(pairKey)) return null;
                renderedPairs.add(pairKey);

                const isSourceActive = fromNode.id === activePageId;
                const isTargetActive = toNode.id === activePageId;
                const isEdgeHighlighted = isSourceActive || isTargetActive;
                const isHovered = hoveredEdge?.id === edge.id;

                return (
                  <path
                    key={edge.id}
                    d={`M ${fromNode.x} ${fromNode.y} L ${toNode.x} ${toNode.y}`}
                    stroke={
                      edge.isTransitive 
                        ? isHovered ? '#F59E0B' : '#D97706' // Golden Amber for automatic transitive
                        : isEdgeHighlighted ? '#4F46E5' : '#10B981' // Green direct, deep indigo highlighting active
                    }
                    strokeWidth={edge.isTransitive ? (isHovered ? 2.5 : 1.5) : (isEdgeHighlighted ? 2.5 : 1.75)}
                    strokeDasharray={edge.isTransitive ? '5,4' : undefined}
                    markerEnd={
                      edge.isTransitive 
                        ? 'url(#arrow-transitive)' 
                        : isEdgeHighlighted ? 'url(#arrow-active)' : 'url(#arrow-direct)'
                    }
                    className="transition-all duration-150 cursor-pointer"
                    onMouseEnter={() => setHoveredEdge(edge)}
                    onMouseLeave={() => setHoveredEdge(null)}
                  />
                );
              });
            })()}
          </g>

          {/* Nodes layer */}
          <g>
            {nodes.map((node) => {
              const isActive = node.id === activePageId;
              const matchedBySearch = searchQuery ? isMatch(node) : false;
              const filteredOut = searchQuery && !matchedBySearch;
              const isLinkingSelected = linkSourceId === node.id;
              
              // Get parent page details to fetch corresponding title
              const pageName = pages.find((p) => p.id === node.id)?.title || node.label;

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x},${node.y})`}
                  className={`${filteredOut ? 'opacity-30' : 'opacity-100'} transition-opacity duration-200`}
                >
                  {/* Subtle outer glowing backdrop for active elements */}
                  {isActive && (
                    <circle
                      r="22"
                      className="fill-[#4F46E5]/10 stroke-[#4F46E5]/20 stroke-[1.5] animate-pulse"
                    />
                  )}

                  {/* Pulsing state marker for manual linking actions */}
                  {isLinkingSelected && (
                    <circle
                      r="26"
                      className="fill-none stroke-rose-400 stroke-[1.5] stroke-dasharray-[4,2]"
                    />
                  )}

                  {/* Bubble wrapper */}
                  <circle
                    r="17"
                    onPointerDown={(e) => handlePointerDown(node.id, e)}
                    className={`cursor-grab active:cursor-grabbing text-center stroke-[1.5] ${
                      isActive
                        ? 'fill-white stroke-[#4F46E5] shadow-sm'
                        : node.isDatabase
                        ? 'fill-[#F1F1EF] stroke-cyan-600'
                        : 'fill-white stroke-emerald-600 hover:fill-[#F7F7F5]'
                    }`}
                  />

                  {/* Node icon inside bubble */}
                  <text
                    textAnchor="middle"
                    dy=".3em"
                    fontSize="12px"
                    className="pointer-events-none select-none"
                  >
                    {node.icon}
                  </text>

                  {/* Node name backdrop */}
                  <rect
                    y="22"
                    x={-(Math.min(100, pageName.length * 4.5) + 8) / 2}
                    width={Math.min(100, pageName.length * 4.5) + 8}
                    height="16"
                    rx="3"
                    className="fill-[#F1F1EF] stroke-[#E8E8E6] stroke-[0.5] pointer-events-none"
                  />

                  {/* Label Text */}
                  <text
                    y="33"
                    textAnchor="middle"
                    fontSize="9px"
                    className={`pointer-events-none select-none font-medium ${
                      isActive ? 'fill-[#4F46E5] font-semibold' : 'fill-[#37352F]'
                    }`}
                  >
                    {pageName.length > 15 ? `${pageName.substring(0, 15)}...` : pageName}
                  </text>

                  {/* Quick-linking action toggle handles */}
                  <g transform="translate(13, -13)" className="cursor-pointer">
                    {!linkSourceId ? (
                      <circle
                        r="5.5"
                        fill="#E8E8E6"
                        stroke="#37352F"
                        strokeWidth="0.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartLinking(node.id);
                        }}
                        className="hover:fill-emerald-400 hover:stroke-emerald-600 transition-colors"
                        title="Start link connection from here"
                      />
                    ) : (
                      linkSourceId !== node.id && (
                        <circle
                          r="5.5"
                          fill="#FECDD3"
                          stroke="#F43F5E"
                          strokeWidth="0.5"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFinishLinking(node.id);
                          }}
                          className="hover:fill-rose-400 transition-colors"
                          title="Connect link to this node"
                        />
                      )
                    )}
                  </g>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Legend overlays */}
        <div className="absolute bottom-3 left-3 flex flex-col gap-1.5 p-2.5 bg-white/95 border border-[#E8E8E6] rounded-lg text-[10px] text-[#37352F]/70 select-none max-w-[190px] pointer-events-none shadow-sm">
          <div className="font-bold text-[#37352F] border-b border-[#E8E8E6] pb-1 mb-1">GRAPH SCHEMA LEGEND</div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-[3px] bg-emerald-500 rounded" />
            <span>Direct Knowledge Link (Solid)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-[3px] border-t border-dashed border-amber-500 rounded" />
            <span>Transitive Inferred Link (Dashed)</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs">🎯</span>
            <span>Active Document Node</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs">🗃️</span>
            <span>Database Node</span>
          </div>
        </div>

        {/* Hover connection guide panel */}
        {hoveredEdge && (
          <div className="absolute top-3 left-3 p-3 bg-white border border-amber-300 rounded-lg shadow-md max-w-sm text-xs text-[#37352F] pointer-events-none transition-opacity duration-300">
            <div className="flex items-center gap-1.5 text-amber-700 font-bold mb-1">
              <Info className="h-3.5 w-3.5 text-amber-600" />
              {hoveredEdge.isTransitive ? 'Automatic Transitive Mapping' : 'Direct Link Connection'}
            </div>
            
            <p className="text-[11px] leading-relaxed text-[#37352F]/70 mb-2">
              {hoveredEdge.isTransitive 
                ? 'Because A is linked to B and B to C, the graph dynamically maps an indirect dependency relationship.' 
                : 'This is an explicit relational mapping set up by the workspace user.'}
            </p>

            <div className="flex items-center flex-wrap gap-1 bg-[#F7F7F5] border border-[#E8E8E6] p-1.5 rounded text-[10px] text-[#4F46E5] font-mono">
              {hoveredEdge.path.map((nodeId, idx) => {
                const nodeTitle = pages.find((p) => p.id === nodeId)?.title || nodeId;
                return (
                  <span key={nodeId} className="flex items-center">
                    {idx > 0 && <span className="mx-1 text-[#37352F]/40">→</span>}
                    <span className="bg-white border border-[#E8E8E6] px-1 py-0.5 rounded text-[#37352F] max-w-[80px] truncate">{nodeTitle}</span>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Floating helper note */}
        {!hoveredEdge && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 p-2 bg-white/90 border border-[#E8E8E6] rounded-lg text-[10px] text-[#37352F]/70">
            <HelpCircle className="h-3 w-3 text-[#4F46E5]" />
            <span>Drag nodes to position. Hover dashed lines to audit transitivity paths.</span>
          </div>
        )}

        {/* Cancel linking alert */}
        {linkSourceId && (
          <div className="absolute top-3 right-3 p-2 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 flex items-center gap-2 shadow-sm">
            <span>Linking from <strong>{pages.find(p => p.id === linkSourceId)?.title}</strong>...</span>
            <button
              onClick={() => setLinkSourceId(null)}
              className="px-1.5 py-0.5 bg-rose-100 hover:bg-rose-200 border border-rose-300 rounded text-[9px] cursor-pointer text-rose-800 font-semibold"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
