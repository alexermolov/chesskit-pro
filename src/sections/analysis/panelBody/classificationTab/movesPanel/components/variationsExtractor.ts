// Utility to extract all variations from move tree
// and convert them to linear paths

export interface Variation {
  id: string;
  moves: string[]; // Array of SAN notation moves
  nodeIds: string[]; // Corresponding node IDs
  isMainLine: boolean;
}

/**
 * Extract all variations from the move tree
 * Each variation is a complete path from the root to a leaf node
 */
export function extractAllVariations(moveTree: any): Variation[] {
  if (!moveTree || !moveTree.nodes || !moveTree.rootId) {
    return [];
  }

  const variations: Variation[] = [];
  let variationId = 0;

  // Recursive function to traverse the tree and collect all paths
  const traverse = (
    nodeId: string,
    currentMoves: string[],
    currentNodeIds: string[],
    isMainLine: boolean
  ): void => {
    const node = moveTree.nodes[nodeId];
    if (!node) return;

    // Add current move to the path (skip root node)
    if (node.move) {
      currentMoves = [...currentMoves, node.san];
      currentNodeIds = [...currentNodeIds, nodeId];
    }

    // If this is a leaf node (no children), save the variation
    if (node.children.length === 0) {
      if (currentMoves.length > 0) {
        variations.push({
          id: `var_${variationId++}`,
          moves: currentMoves,
          nodeIds: currentNodeIds,
          isMainLine,
        });
      }
      return;
    }

    // Continue traversal for all children
    node.children.forEach((childId: string, index: number) => {
      // First child continues the main line, others are variations
      const isChildMainLine = isMainLine && index === 0;
      traverse(childId, currentMoves, currentNodeIds, isChildMainLine);
    });
  };

  // Start traversal from root
  traverse(moveTree.rootId, [], [], true);

  return variations;
}

/**
 * Sort variations so that variations with the same moves are grouped together
 * Sort by first move, then by second move, etc.
 */
export function sortVariations(variations: Variation[]): Variation[] {
  return [...variations].sort((a, b) => {
    const maxLength = Math.max(a.moves.length, b.moves.length);

    for (let i = 0; i < maxLength; i++) {
      const moveA = a.moves[i] || "";
      const moveB = b.moves[i] || "";

      if (moveA !== moveB) {
        // Put main line first if one of them is main line
        if (i === 0) {
          if (a.isMainLine && !b.isMainLine) return -1;
          if (!a.isMainLine && b.isMainLine) return 1;
        }

        return moveA.localeCompare(moveB);
      }
    }

    // If all moves are the same, put shorter variation first
    return a.moves.length - b.moves.length;
  });
}

/**
 * Get maximum number of moves in all variations
 */
export function getMaxMovesCount(variations: Variation[]): number {
  return variations.reduce((max, variation) => {
    return Math.max(max, variation.moves.length);
  }, 0);
}
