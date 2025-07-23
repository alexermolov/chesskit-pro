import { useState, useCallback, useMemo } from "react";
import { useChessActionsWithBranches } from "./useChessActionsWithBranches";
import { PrimitiveAtom } from "jotai";
import { Chess, Move } from "chess.js";

interface BranchOption {
  nodeId: string;
  move: Move;
  previewMoves: Move[];
}

export const useBranchNavigation = (chessAtom: PrimitiveAtom<Chess>) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    currentNode,
    moveTree,
    goToNode,
    redoMove: originalRedoMove,
    canRedo,
  } = useChessActionsWithBranches(chessAtom);

  const availableBranches = useMemo((): BranchOption[] => {
    if (!currentNode || currentNode.children.length === 0) {
      return [];
    }

    const branches = currentNode.children
      .map((childId) => {
        const childNode = moveTree.nodes[childId];
        
        if (!childNode) return null;

        const previewMoves: Move[] = [];
        let currentPreviewNode = childNode;

        while (
          previewMoves.length < 3 &&
          currentPreviewNode.children.length > 0
        ) {
          const nextChildId = currentPreviewNode.children[0];
          const nextChildNode = moveTree.nodes[nextChildId];
          if (!nextChildNode?.move) break;

          previewMoves.push(nextChildNode.move);
          currentPreviewNode = nextChildNode;
        }

        return {
          nodeId: childId,
          move: childNode.move!,
          previewMoves,
        };
      })
      .filter(Boolean) as BranchOption[];
      
    return branches;
  }, [currentNode, moveTree.nodes]);

  const shouldShowBranchModal = useMemo(() => {
    return availableBranches.length > 1;
  }, [availableBranches.length]);

  const redoMove = useCallback(() => {
    if (!canRedo) return;

    if (shouldShowBranchModal) {
      setIsModalOpen(true);
      return;
    }

    if (availableBranches.length === 1) {
      goToNode(availableBranches[0].nodeId);
      return;
    }

    originalRedoMove();
  }, [
    canRedo,
    shouldShowBranchModal,
    availableBranches,
    goToNode,
    originalRedoMove,
  ]);

  const handleBranchSelect = useCallback(
    (nodeId: string) => {
      if (nodeId === "main" && availableBranches.length > 0) {
        goToNode(availableBranches[0].nodeId);
      } else {
        goToNode(nodeId);
      }
      setIsModalOpen(false);
    },
    [availableBranches, goToNode]
  );

  const closeBranchModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleKeyboardNavigation = useCallback(
    (direction: "forward" | "back") => {
      if (direction === "forward") {
        redoMove();
      }
    },
    [redoMove]
  );

  return {
    isModalOpen,
    availableBranches,
    redoMove,
    handleBranchSelect,
    closeBranchModal,
    handleKeyboardNavigation,
    currentMove: currentNode?.move,
    shouldShowBranchModal,
  };
};

export default useBranchNavigation;
