import { DocumentPage, LinkConnection, VisualEdge, VisualNode } from '../types';

/**
 * Computes all paths in the graph and extracts the transitive closure.
 * A transitively-inferred link (A -> C) exists if there is a path from A to C of length >= 2
 * and NO direct link connects A to C.
 */
export function computeTransitiveConnections(
  pages: DocumentPage[],
  links: LinkConnection[]
): {
  directEdges: VisualEdge[];
  transitiveEdges: VisualEdge[];
} {
  const pageIds = pages.map(p => p.id);
  const pageIdSet = new Set(pageIds);

  // Initialize adjacency map for direct links in an undirected manner
  // to ensure multilevel connectivity behaves natively across arbitrary chains
  const adj = new Map<string, Set<string>>();
  for (const id of pageIds) {
    adj.set(id, new Set());
  }

  for (const link of links) {
    if (pageIdSet.has(link.fromId) && pageIdSet.has(link.toId)) {
      adj.get(link.fromId)!.add(link.toId);
      adj.get(link.toId)!.add(link.fromId);
    }
  }

  const directEdges: VisualEdge[] = [];
  const transitiveEdges: VisualEdge[] = [];

  // Map to store direct link lookups for speed/correctness check
  const hasDirectLink = (from: string, to: string): boolean => {
    return adj.get(from)?.has(to) || false;
  };

  // Find all reachable nodes for each page using BFS on the undirected representation
  for (const startId of pageIds) {
    const visited = new Set<string>();
    // Queue stores: { currentId: string, pathTaken: string[] }
    const queue: { id: string; path: string[] }[] = [{ id: startId, path: [startId] }];
    visited.add(startId);

    while (queue.length > 0) {
      const { id, path } = queue.shift()!;
      const neighbors = adj.get(id) || new Set();

      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          const newPath = [...path, neighbor];
          queue.push({ id: neighbor, path: newPath });

          // If this path length is >= 3 (e.g., A -> B -> C, path length is 3)
          // and there is no direct link between startId and neighbor, then we form a transitive connection!
          const pathLen = newPath.length;
          if (pathLen >= 3) {
            if (!hasDirectLink(startId, neighbor)) {
              transitiveEdges.push({
                id: `transitive-${startId}-${neighbor}`,
                source: startId,
                target: neighbor,
                isTransitive: true,
                path: newPath,
              });
            }
          }
        }
      }
    }
  }

  // Populate direct edges using original requested directionality for drawing arrows cleanly
  for (const link of links) {
    if (pageIdSet.has(link.fromId) && pageIdSet.has(link.toId)) {
      directEdges.push({
        id: `direct-${link.fromId}-${link.toId}`,
        source: link.fromId,
        target: link.toId,
        isTransitive: false,
        path: [link.fromId, link.toId],
      });
    }
  }

  return { directEdges, transitiveEdges };
}

/**
 * Generates an initial force layout coordinate system for nodes
 */
export function generateInitialLayout(
  pages: DocumentPage[],
  width = 600,
  height = 400
): VisualNode[] {
  const count = pages.length;
  return pages.map((page, index) => {
    // Position notes in a circular structure to start with nicely balanced spread
    const angle = (index / (count || 1)) * 2 * Math.PI;
    const radius = Math.min(width, height) * 0.35;
    const centerX = width / 2;
    const centerY = height / 2;

    return {
      id: page.id,
      label: page.title,
      icon: page.icon || '📄',
      isDatabase: page.isDatabase,
      x: centerX + radius * Math.cos(angle) + (Math.random() - 0.5) * 20,
      y: centerY + radius * Math.sin(angle) + (Math.random() - 0.5) * 20,
      vx: 0,
      vy: 0,
    };
  });
}

/**
 * Multi-pass simple force simulation worker to structure coordinates organically.
 */
export function runForceSimulationStep(
  nodes: VisualNode[],
  edges: VisualEdge[],
  width = 600,
  height = 400,
  alpha = 0.1
): VisualNode[] {
  const nodeMap = new Map<string, VisualNode>();
  for (const node of nodes) {
    nodeMap.set(node.id, node);
  }

  // 1. Repulsion between all node pairs (Electrostatic)
  for (let i = 0; i < nodes.length; i++) {
    const nodeA = nodes[i];
    for (let j = i + 1; j < nodes.length; j++) {
      const nodeB = nodes[j];
      const dx = nodeB.x - nodeA.x;
      const dy = nodeB.y - nodeA.y;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;
      
      // Repel if too close
      const minDistance = 90;
      if (distance < minDistance) {
        const force = ((minDistance - distance) / distance) * 0.45;
        nodeA.vx -= dx * force;
        nodeA.vy -= dy * force;
        nodeB.vx += dx * force;
        nodeB.vy += dy * force;
      }
    }
  }

  // 2. Attraction along edges (Spring force)
  // Only use direct edges to avoid overcrowding paths
  const directEdges = edges.filter(e => !e.isTransitive);
  for (const edge of directEdges) {
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);
    if (sourceNode && targetNode) {
      const dx = targetNode.x - sourceNode.x;
      const dy = targetNode.y - sourceNode.y;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;
      const desiredLength = 120;
      const force = (distance - desiredLength) * 0.035;

      const fx = (dx / distance) * force;
      const fy = (dy / distance) * force;

      sourceNode.vx += fx;
      sourceNode.vy += fy;
      targetNode.vx -= fx;
      targetNode.vy -= fy;
    }
  }

  // 3. Gravity center force pulling elements back to stage focal point
  const centerX = width / 2;
  const centerY = height / 2;
  for (const node of nodes) {
    const dx = centerX - node.x;
    const dy = centerY - node.y;
    node.vx += dx * 0.01;
    node.vy += dy * 0.01;
  }

  // Update position with damping
  const updatedNodes = nodes.map(node => {
    // Apply speed limits to avoid chaotic flight
    let vx = node.vx * 0.85;
    let vy = node.vy * 0.85;

    const speedLimit = 8;
    const speed = Math.sqrt(vx * vx + vy * vy);
    if (speed > speedLimit) {
      vx = (vx / speed) * speedLimit;
      vy = (vy / speed) * speedLimit;
    }

    // Border constraints
    let x = node.x + vx;
    let y = node.y + vy;

    const padding = 30;
    if (x < padding) { x = padding; vx = -vx * 0.5; }
    if (x > width - padding) { x = width - padding; vx = -vx * 0.5; }
    if (y < padding) { y = padding; vy = -vy * 0.5; }
    if (y > height - padding) { y = height - padding; vy = -vy * 0.5; }

    return {
      ...node,
      x,
      y,
      vx,
      vy
    };
  });

  return updatedNodes;
}
