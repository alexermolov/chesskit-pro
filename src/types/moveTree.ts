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
          name: `Variation ${index + 1}`,
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
    
    // Create a new tree with updated main line
    const newTree: MoveTree = {
      ...tree,
      mainLineIds: [tree.rootId, ...path],
      nodes: { ...tree.nodes },
    };

    // Reorder children in parent nodes to put promoted variation first
    // This is important for proper PGN generation and UI display
    path.forEach((currentNodeId, index) => {
      if (index === 0) return; // Skip root

      const parentId = path[index - 1] || tree.rootId;
      const parentNode = newTree.nodes[parentId];
      
      if (parentNode && parentNode.children.length > 1) {
        // Find the position of current node in children
        const currentIndex = parentNode.children.indexOf(currentNodeId);
        
        if (currentIndex > 0) {
          // Move this child to the first position
          const newChildren = [...parentNode.children];
          newChildren.splice(currentIndex, 1); // Remove from current position
          newChildren.unshift(currentNodeId); // Add to beginning
          
          // Update parent node with reordered children
          newTree.nodes[parentId] = {
            ...parentNode,
            children: newChildren,
          };
        }
      }
    });

    return newTree;
  }

  // Convert move tree to PGN string with branches
  static toPgn(tree: MoveTree): string {
    const result: string[] = [];

    // Function to calculate the move number based on the path from the root
    const getMoveNumber = (nodeId: string): number => {
      let currentId = nodeId;
      let moveCount = 0;

      while (currentId && currentId !== tree.rootId) {
        const node = tree.nodes[currentId];
        if (node && node.move) {
          moveCount++;
        }
        currentId = node?.parent || "";
      }

      return Math.ceil(moveCount / 2);
    };

    // Function to determine the color of the move
    const isWhiteMove = (nodeId: string): boolean => {
      let currentId = nodeId;
      let moveCount = 0;

      while (currentId && currentId !== tree.rootId) {
        const node = tree.nodes[currentId];
        if (node && node.move) {
          moveCount++;
        }
        currentId = node?.parent || "";
      }

      return moveCount % 2 === 1;
    };

    const processNode = (
      nodeId: string,
      skipMove: boolean = false,
      isFirstInVariation: boolean = false,
      insideVariation: boolean = false,
      variationEnd: boolean = false
    ): void => {
      const node = tree.nodes[nodeId];
      if (!node) return;

      // Add the move (except for the root and if not skipping)
      if (node.move && !skipMove) {
        const moveNumber = getMoveNumber(nodeId);
        const isWhite = isWhiteMove(nodeId);

        // For the first move in a variation:
        // - if white, then N.move
        // - if black, then N...move
        if (isFirstInVariation) {
          if (isWhite) {
            result.push(`${moveNumber}.${node.san}`);
          } else {
            result.push(`${moveNumber}...${node.san}`);
          }
        } else {
          // Inside a variation and the main line:
          // - white moves always have a number
          // - black moves: without a number, but with number if coming after variation end
          if (isWhite) {
            result.push(`${moveNumber}.${node.san}`);
          } else {
            // For black moves: if returning from variation, add move number with ellipsis
            if (variationEnd) {
              result.push(`${moveNumber}...${node.san}`);
            } else {
              result.push(node.san);
            }
          }
        }

        // Reset variationEnd flag after using it
        variationEnd = false;

        // Add the comment if it exists
        if (node.comment) {
          result.push(`{${node.comment}}`);
        }
      }

      // If there are no children - end of the branch
      if (node.children.length === 0) {
        return;
      }

      // If there is one child - just continue
      if (node.children.length === 1) {
        processNode(
          node.children[0],
          false,
          false,
          insideVariation,
          variationEnd
        );
        return;
      }

      // If there are multiple children - there are variations
      // Determine the main child
      let mainChild: string | null = null;
      const variations: string[] = [];

      const currentMainIndex = tree.mainLineIds.indexOf(nodeId);
      if (
        currentMainIndex !== -1 &&
        currentMainIndex + 1 < tree.mainLineIds.length
      ) {
        const nextMainLineId = tree.mainLineIds[currentMainIndex + 1];
        if (node.children.includes(nextMainLineId)) {
          mainChild = nextMainLineId;
          variations.push(
            ...node.children.filter((childId) => childId !== nextMainLineId)
          );
        }
      }

      // If not found in the main line, take the first child as the main one
      if (!mainChild) {
        mainChild = node.children[0];
        variations.push(...node.children.slice(1));
      }

      // 1. First, add the move of the main line
      const mainChildNode = tree.nodes[mainChild];
      if (mainChildNode && mainChildNode.move) {
        const moveNumber = getMoveNumber(mainChild);
        const isWhite = isWhiteMove(mainChild);

        // Main line - number only for white
        if (isWhite) {
          result.push(`${moveNumber}.${mainChildNode.san}`);
        } else {
          // Black moves in the main line always without a number
          result.push(mainChildNode.san);
        }

        // Add the comment if it exists
        if (mainChildNode.comment) {
          result.push(`{${mainChildNode.comment}}`);
        }
      }

      // 2. Immediately process all variations
      for (const variationId of variations) {
        result.push("(");
        processNode(variationId, false, true, true, false); // first move in variation, inside variation
        result.push(")");

        variationEnd = true;
      }

      // 3. Then continue with the children of the main line (skipping the move itself, as it has already been added)
      if (mainChildNode) {
        processNode(mainChild, true, false, false, variationEnd); // return to the main line
      }
    };

    // Start from the root
    processNode(tree.rootId, false, false, false, false);

    // Add the end symbol
    if (result.length > 0) {
      result.push("*");
    }

    // Combine into a string
    return result.join(" ");
  }
}
