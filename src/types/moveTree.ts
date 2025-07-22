import { Move } from "chess.js";

// Move tree node
export interface MoveTreeNode {
  id: string; // Unique node identifier
  move: Move | null; // Move (null for root node)
  parent: string | null; // Parent node ID
  children: string[]; // Array of child node IDs
  san: string; // Chess notation for display
  comment?: string; // Move comment
  fen: string; // Position after move
}

// Move tree structure with branches
export interface MoveTree {
  nodes: { [nodeId: string]: MoveTreeNode }; // All tree nodes
  rootId: string; // Root node ID
  currentNodeId: string; // Current active node ID
  mainLineIds: string[]; // Main line node IDs
}

// Branch information
export interface BranchInfo {
  id: string;
  name: string;
  nodeIds: string[]; // Path from root to branch end
  isMainLine: boolean;
  moveCount: number;
}

// Move tree utilities
export class MoveTreeUtils {
  // Create new empty tree
  static createEmptyTree(initialFen: string): MoveTree {
    const rootId = "root";
    const rootNode: MoveTreeNode = {
      id: rootId,
      move: null,
      parent: null,
      children: [],
      san: "",
      fen: initialFen,
    };

    return {
      nodes: { [rootId]: rootNode },
      rootId,
      currentNodeId: rootId,
      mainLineIds: [rootId],
    };
  }

  // Add move to tree
  static addMove(
    tree: MoveTree,
    move: Move,
    fen: string,
    parentNodeId?: string
  ): { tree: MoveTree; nodeId: string } {
    const parent = parentNodeId || tree.currentNodeId;
    const parentNode = tree.nodes[parent];

    if (!parentNode) {
      throw new Error(`Parent node ${parent} not found`);
    }

    const nodeId = `${parent}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const newNode: MoveTreeNode = {
      id: nodeId,
      move,
      parent,
      children: [],
      san: move.san,
      fen,
    };

    const newTree: MoveTree = {
      ...tree,
      nodes: {
        ...tree.nodes,
        [nodeId]: newNode,
        [parent]: {
          ...parentNode,
          children: [...parentNode.children, nodeId],
        },
      },
      currentNodeId: nodeId,
    };

    // If adding to end of main line, extend it
    if (parent === tree.mainLineIds[tree.mainLineIds.length - 1]) {
      newTree.mainLineIds = [...tree.mainLineIds, nodeId];
    }

    return { tree: newTree, nodeId };
  }

  // Get path from root to node
  static getPathToNode(tree: MoveTree, nodeId: string): string[] {
    const path: string[] = [];
    let currentId: string | null = nodeId;

    while (currentId && currentId !== tree.rootId) {
      path.unshift(currentId);
      const node: MoveTreeNode | undefined = tree.nodes[currentId];
      currentId = node?.parent || null;
    }

    return path;
  }

  // Get all moves from root to node
  static getMovesToNode(tree: MoveTree, nodeId: string): Move[] {
    const path = this.getPathToNode(tree, nodeId);
    return path
      .map((id) => tree.nodes[id]?.move)
      .filter((move): move is Move => move !== null);
  }

  // Get all branches
  static getAllBranches(tree: MoveTree): BranchInfo[] {
    const branches: BranchInfo[] = [];

    // Main line
    const mainLine: BranchInfo = {
      id: "main",
      name: "Main line",
      nodeIds: tree.mainLineIds,
      isMainLine: true,
      moveCount: tree.mainLineIds.length - 1, // Exclude root node
    };
    branches.push(mainLine);

    // Find all leaf nodes
    const leafNodes = Object.values(tree.nodes).filter(
      (node) => node.children.length === 0 && node.id !== tree.rootId
    );

    // Create branches for each leaf not in main line
    leafNodes.forEach((leaf, index) => {
      const path = this.getPathToNode(tree, leaf.id);
      const isMainLineBranch = tree.mainLineIds.includes(leaf.id);

      if (!isMainLineBranch && path.length > 0) {
        branches.push({
          id: `branch_${index}`,
          name: `Вариант ${index + 1}`,
          nodeIds: [tree.rootId, ...path],
          isMainLine: false,
          moveCount: path.length,
        });
      }
    });

    return branches;
  }

  // Go to node
  static goToNode(tree: MoveTree, nodeId: string): MoveTree {
    if (!tree.nodes[nodeId]) {
      throw new Error(`Node ${nodeId} not found`);
    }

    return {
      ...tree,
      currentNodeId: nodeId,
    };
  }

  // Delete branch (node and all its descendants)
  static deleteBranch(tree: MoveTree, nodeId: string): MoveTree {
    if (nodeId === tree.rootId) {
      throw new Error("Cannot delete root node");
    }

    const node = tree.nodes[nodeId];
    if (!node) {
      throw new Error(`Node ${nodeId} not found`);
    }

    // Collect all nodes to delete (node and all its descendants)
    const nodesToDelete = new Set<string>();
    const collectNodes = (id: string) => {
      nodesToDelete.add(id);
      const currentNode = tree.nodes[id];
      if (currentNode) {
        currentNode.children.forEach(collectNodes);
      }
    };
    collectNodes(nodeId);

    // Create new nodes without deleted ones
    const newNodes = { ...tree.nodes };
    nodesToDelete.forEach((id) => delete newNodes[id]);

    // Remove reference from parent
    if (node.parent) {
      const parent = newNodes[node.parent];
      if (parent) {
        parent.children = parent.children.filter((id) => id !== nodeId);
      }
    }

    // Update main line if affected
    const newMainLineIds = tree.mainLineIds.filter(
      (id) => !nodesToDelete.has(id)
    );

    // If current node is deleted, go to parent
    let newCurrentNodeId = tree.currentNodeId;
    if (nodesToDelete.has(tree.currentNodeId)) {
      newCurrentNodeId = node.parent || tree.rootId;
    }

    return {
      ...tree,
      nodes: newNodes,
      currentNodeId: newCurrentNodeId,
      mainLineIds: newMainLineIds,
    };
  }

  // Promote branch to main line
  static promoteToMainLine(tree: MoveTree, nodeId: string): MoveTree {
    const path = this.getPathToNode(tree, nodeId);

    return {
      ...tree,
      mainLineIds: [tree.rootId, ...path],
    };
  }

  // Convert move tree to PGN string with branches
  static toPgn(tree: MoveTree): string {
    // Recursive function to build PGN with proper branch order
    const buildPgn = (nodeId: string, depth: number = 0): string[] => {
      const node = tree.nodes[nodeId];
      if (!node) return [];

      const result: string[] = [];

      // If this is a move (not root), add it
      if (node.move) {
        const moveNumber = Math.floor((depth - 1) / 2) + 1;
        const isWhite = (depth - 1) % 2 === 0;

        // Check if this node is an alternative move
        const isAlternativeMove =
          node.parent &&
          tree.nodes[node.parent] &&
          tree.nodes[node.parent].children.indexOf(node.id) > 0;

        // Add move number
        if (isWhite) {
          result.push(`${moveNumber}.`);
        } else if (isAlternativeMove) {
          // For black moves that are alternatives
          result.push(`${moveNumber}...`);
        }
        // For black moves in main line, don't add number

        result.push(node.san);
      }

      // If there are children, process them
      if (node.children.length > 0) {
        // First child - main line
        const mainChild = node.children[0];

        // Continue main line
        const mainMoves = buildPgn(mainChild, depth + 1);
        result.push(...mainMoves);

        // AFTER main line add alternative branches
        for (let i = 1; i < node.children.length; i++) {
          const altChild = node.children[i];
          result.push("(");

          // Recursively build alternative branch
          const altMoves = buildPgn(altChild, depth + 1);
          result.push(...altMoves);

          result.push(")");
        }
      }

      return result;
    };

    // Start from root
    const allMoves = buildPgn(tree.rootId);

    // Добавляем завершающий символ если есть ходы
    if (allMoves.length > 0) {
      allMoves.push("*");
    }

    return allMoves
      .join(" ")
      .replace(/(\d+)\. /g, "$1.")
      .replace(/(\d+)\.\.\. /g, "$1...");
  }
}
