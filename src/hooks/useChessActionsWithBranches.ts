import { setGameHeaders } from "@/lib/chess";
import { PgnParser } from "@/lib/pgnParser";
import { playIllegalMoveSound, playSoundFromMove } from "@/lib/sounds";
import { moveTreeAtom } from "@/sections/analysis/states";
import { Player } from "@/types/game";
import { BranchInfo, MoveTreeNode, MoveTreeUtils } from "@/types/moveTree";
import { Chess, DEFAULT_POSITION, Move } from "chess.js";
import { PrimitiveAtom, useAtom } from "jotai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface resetGameParams {
  fen?: string;
  white?: Player;
  black?: Player;
  noHeaders?: boolean;
}

export const useChessActionsWithBranches = (
  chessAtom: PrimitiveAtom<Chess>
) => {
  const [game, setGame] = useAtom(chessAtom);
  const [moveTree, setMoveTree] = useAtom(moveTreeAtom);

  // Flag to prevent auto-synchronization during tree operations
  const [isManualTreeOperation, setIsManualTreeOperation] = useState(false);
  const lastManualOperationRef = useRef<number>(0);

  // Get current node
  const currentNode = useMemo(() => {
    return moveTree.nodes[moveTree.currentNodeId];
  }, [moveTree.nodes, moveTree.currentNodeId]);

  // Get all moves up to the current position
  const currentMoves = useMemo(() => {
    return MoveTreeUtils.getMovesToNode(moveTree, moveTree.currentNodeId);
  }, [moveTree]);

  // Check if undo/redo is possible
  const canUndo = useMemo(() => {
    return moveTree.currentNodeId !== moveTree.rootId;
  }, [moveTree.currentNodeId, moveTree.rootId]);

  const canRedo = useMemo(() => {
    return currentNode?.children.length > 0;
  }, [currentNode]);

  // Get branch information
  const branches = useMemo(() => {
    return MoveTreeUtils.getAllBranches(moveTree);
  }, [moveTree]);

  // Get history length for useEffect dependency
  const gameHistoryLength = game.history().length;

  // Synchronize tree with game
  useEffect(() => {
    if (isManualTreeOperation) {
      setIsManualTreeOperation(false);
      return;
    }

    const timeSinceLastManualOp = Date.now() - lastManualOperationRef.current;
    if (timeSinceLastManualOp < 2000) {
      // Increased to 2 seconds
      return;
    }

    const gameHistoryMoves = game.history({ verbose: true });
    const treeMovesCount = MoveTreeUtils.getMovesToNode(
      moveTree,
      moveTree.currentNodeId
    ).length;

    // Get total number of moves in the tree (from root to the farthest node)
    const allTreeMoves = MoveTreeUtils.getMovesToNode(
      moveTree,
      moveTree.mainLineIds[moveTree.mainLineIds.length - 1]
    );

    // Synchronize only if:
    // 1. Game has more moves than the tree AND
    // 2. Tree is not empty (to avoid duplication when loading PGN) AND
    // 3. Game contains more moves than are in the entire tree (not just up to the current node)
    if (
      gameHistoryMoves.length > treeMovesCount &&
      treeMovesCount > 0 &&
      gameHistoryMoves.length > allTreeMoves.length
    ) {
      const newMoves = gameHistoryMoves.slice(allTreeMoves.length);
      let currentTree = moveTree;
      let hasChanges = false;

      newMoves.forEach((move) => {
        const { tree } = MoveTreeUtils.addMove(
          currentTree,
          move,
          game.fen(),
          currentTree.currentNodeId
        );
        currentTree = tree;
        hasChanges = true;
      });

      // Update only if there were changes
      if (hasChanges) {
        setMoveTree(currentTree);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    gameHistoryLength,
    moveTree.currentNodeId,
    setMoveTree,
    isManualTreeOperation,
  ]);

  // Reconstruct game from tree
  const reconstructGameFromTree = useCallback(
    (nodeId?: string) => {
      const targetNodeId = nodeId || moveTree.currentNodeId;
      const moves = MoveTreeUtils.getMovesToNode(moveTree, targetNodeId);

      const newGame = new Chess();
      const headers = game.getHeaders();
      Object.entries(headers).forEach(([key, value]) => {
        if (value) newGame.setHeader(key, value);
      });

      moves.forEach((move: Move) => {
        try {
          newGame.move({
            from: move.from,
            to: move.to,
            promotion: move.promotion,
          });
        } catch {
          // Skip invalid moves
        }
      });

      return newGame;
    },
    [moveTree, game]
  );

  const setPgn = useCallback(
    (pgn: string) => {
      setIsManualTreeOperation(true);
      lastManualOperationRef.current = Date.now();

      // Use the new parser with branch support
      const { game: parsedGame, moveTree: newTree } =
        PgnParser.parsePgnToMoveTree(pgn);

      // Find the last move in the main line to set the game at the final position
      const mainLineIds = newTree.mainLineIds;
      const lastMoveNodeId = mainLineIds[mainLineIds.length - 1];

      const correctedTree = {
        ...newTree,
        currentNodeId: lastMoveNodeId,
      };

      // Set the game at the final position instead of starting position
      setGame(parsedGame);

      // Set the move tree
      setMoveTree(correctedTree);
    },
    [setGame, setMoveTree]
  );

  const setFen = useCallback(
    (fen: string) => {
      setIsManualTreeOperation(true);

      const newGame = new Chess(fen);
      setGame(newGame);

      // Create a new tree from the new position
      const newTree = MoveTreeUtils.createEmptyTree(fen);
      setMoveTree(newTree);
    },
    [setGame, setMoveTree]
  );

  const reset = useCallback(
    (params?: resetGameParams) => {
      setIsManualTreeOperation(true);

      const newGame = new Chess(params?.fen);
      if (!params?.noHeaders) setGameHeaders(newGame, params);
      setGame(newGame);

      // Reset the tree
      const newTree = MoveTreeUtils.createEmptyTree(
        params?.fen || DEFAULT_POSITION
      );
      setMoveTree(newTree);
    },
    [setGame, setMoveTree]
  );

  const playMove = useCallback(
    (params: {
      from: string;
      to: string;
      promotion?: string;
      comment?: string;
      createNewBranch?: boolean; // Option to force creating a new branch
    }): Move | null => {
      const { comment, createNewBranch, ...moveParams } = params;

      // Check if such a move already exists in the children of the current node
      const existingChild = currentNode.children.find((childId) => {
        const childNode = moveTree.nodes[childId];
        const childMove = childNode?.move;
        return (
          childMove &&
          childMove.from === moveParams.from &&
          childMove.to === moveParams.to &&
          childMove.promotion === moveParams.promotion
        );
      });

      // If the move already exists and we're not forcing a new branch
      if (existingChild && !createNewBranch) {
        // Go to the existing move
        const newTree = MoveTreeUtils.goToNode(moveTree, existingChild);
        setMoveTree(newTree);

        const newGame = reconstructGameFromTree(existingChild);
        setGame(newGame);

        const childMove = moveTree.nodes[existingChild]?.move;
        if (childMove) playSoundFromMove(childMove);

        return childMove;
      }

      // Create a new move
      const tempGame = reconstructGameFromTree();

      try {
        const result = tempGame.move(moveParams);
        if (comment) tempGame.setComment(comment);

        // Add the move to the tree
        const { tree: newTree } = MoveTreeUtils.addMove(
          moveTree,
          result,
          tempGame.fen(),
          moveTree.currentNodeId
        );

        setMoveTree(newTree);
        setGame(tempGame);
        playSoundFromMove(result);

        return result;
      } catch {
        playIllegalMoveSound();
        return null;
      }
    },
    [currentNode, moveTree, reconstructGameFromTree, setMoveTree, setGame]
  );

  // Undo move (go to parent node)
  const undoMove = useCallback(() => {
    if (!canUndo || !currentNode.parent) return;

    setIsManualTreeOperation(true);
    lastManualOperationRef.current = Date.now();

    const parentNodeId = currentNode.parent;
    const newTree = MoveTreeUtils.goToNode(moveTree, parentNodeId);
    const newGame = reconstructGameFromTree(parentNodeId);

    // Update state in the correct order
    setMoveTree(newTree);
    setGame(newGame);

    // Play the sound of the move we're going to (if it's not the root)
    const parentNode = moveTree.nodes[parentNodeId];
    if (parentNode?.move) {
      playSoundFromMove(parentNode.move);
    }
  }, [
    canUndo,
    currentNode,
    moveTree,
    reconstructGameFromTree,
    setMoveTree,
    setGame,
  ]);

  // Redo move (go to the first child node)
  const redoMove = useCallback(() => {
    if (!canRedo || currentNode.children.length === 0) return;

    setIsManualTreeOperation(true);
    lastManualOperationRef.current = Date.now();

    // Choose the first child (main line) or allow to choose
    const nextNodeId = currentNode.children[0];
    const newTree = MoveTreeUtils.goToNode(moveTree, nextNodeId);
    const newGame = reconstructGameFromTree(nextNodeId);

    // Update state in the correct order
    setMoveTree(newTree);
    setGame(newGame);

    const nextMove = moveTree.nodes[nextNodeId]?.move;
    if (nextMove) playSoundFromMove(nextMove);
  }, [
    canRedo,
    currentNode,
    moveTree,
    reconstructGameFromTree,
    setMoveTree,
    setGame,
  ]);

  // Go to a specific node
  const goToNode = useCallback(
    (nodeId: string) => {
      if (!moveTree.nodes[nodeId]) return;

      setIsManualTreeOperation(true);
      lastManualOperationRef.current = Date.now();

      const newTree = MoveTreeUtils.goToNode(moveTree, nodeId);
      const newGame = reconstructGameFromTree(nodeId);

      // Update state in the correct order
      setMoveTree(newTree);
      setGame(newGame);

      const targetNode = moveTree.nodes[nodeId];
      if (targetNode?.move) {
        playSoundFromMove(targetNode.move);
      }
    },
    [moveTree, reconstructGameFromTree, setMoveTree, setGame]
  );

  // Go to a specific move in a branch
  const goToBranch = useCallback(
    (branchInfo: BranchInfo, moveIndex?: number) => {
      const targetIndex = moveIndex ?? branchInfo.nodeIds.length - 1;
      const nodeId = branchInfo.nodeIds[targetIndex];

      if (nodeId) {
        goToNode(nodeId);
      }
    },
    [goToNode]
  );

  // Delete a branch
  const deleteBranch = useCallback(
    (nodeId: string) => {
      if (nodeId === moveTree.rootId) return;

      const newTree = MoveTreeUtils.deleteBranch(moveTree, nodeId);
      setMoveTree(newTree);

      // If the current node was deleted, the game is already updated in deleteBranch
      if (newTree.currentNodeId !== moveTree.currentNodeId) {
        const newGame = reconstructGameFromTree(newTree.currentNodeId);
        setGame(newGame);
      }
    },
    [moveTree, reconstructGameFromTree, setMoveTree, setGame]
  );

  // Promote a branch to the main line
  const promoteToMainLine = useCallback(
    (nodeId: string) => {
      const newTree = MoveTreeUtils.promoteToMainLine(moveTree, nodeId);
      setMoveTree(newTree);
    },
    [moveTree, setMoveTree]
  );

  // Update node comment
  const updateNodeComment = useCallback(
    (nodeId: string, comment: string | null) => {
      setMoveTree((prevTree) => {
        const newTree = { ...prevTree };
        newTree.nodes = { ...prevTree.nodes };

        if (newTree.nodes[nodeId]) {
          newTree.nodes[nodeId] = {
            ...newTree.nodes[nodeId],
            comment: comment || undefined,
          };
        }

        return newTree;
      });
    },
    [setMoveTree]
  );

  // Get alternative moves (variants) for the current position
  const getAlternativeMoves = useCallback(() => {
    return currentNode.children.map((childId) => {
      const childNode = moveTree.nodes[childId];
      return {
        nodeId: childId,
        move: childNode.move,
        san: childNode.san,
      };
    });
  }, [currentNode, moveTree.nodes]);

  const getMainLineMoves = useCallback(() => {
    const mainLineMoves: Array<{ san: string; nodeId: string }> = [];

    if (moveTree && moveTree.nodes && moveTree.rootId) {
      let currentId: string | null = moveTree.rootId;
      while (currentId) {
        const node = (moveTree.nodes[currentId] || null) as MoveTreeNode;
        if (!node) break;
        if (node.move) {
          mainLineMoves.push({ san: node.move.san, nodeId: currentId });
        }
        currentId = node.children[0] || null;
      }
    }
    return mainLineMoves;
  }, [moveTree]);

  return {
    // Basic operations
    setPgn,
    reset,
    playMove,
    undoMove,
    redoMove,
    setFen,

    // Tree operations
    goToNode,
    goToBranch,
    deleteBranch,
    promoteToMainLine,
    updateNodeComment,

    // State information
    canUndo,
    canRedo,
    branches,
    currentNode,
    currentMoves,
    moveTree,

    // Utilities
    getAlternativeMoves,
    reconstructGameFromTree,
    getMainLineMoves,

    // Compatibility with linear version
    moveHistory: currentMoves,
    currentPosition: currentMoves.length - 1,
  };
};
