import { setGameHeaders } from "@/lib/chess";
import { playIllegalMoveSound, playSoundFromMove } from "@/lib/sounds";
import { Player } from "@/types/game";
import { MoveTreeUtils, BranchInfo } from "@/types/moveTree";
import { Chess, DEFAULT_POSITION, Move } from "chess.js";
import { PrimitiveAtom, useAtom } from "jotai";
import { useCallback, useState, useMemo, useEffect, useRef } from "react";
import { moveTreeAtom } from "@/sections/analysis/states";

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

  // Флаг для предотвращения автосинхронизации во время операций с деревом
  const [isManualTreeOperation, setIsManualTreeOperation] = useState(false);
  const lastManualOperationRef = useRef<number>(0);

  // Получение текущего узла
  const currentNode = useMemo(() => {
    return moveTree.nodes[moveTree.currentNodeId];
  }, [moveTree.nodes, moveTree.currentNodeId]);

  // Получение всех ходов до текущей позиции
  const currentMoves = useMemo(() => {
    return MoveTreeUtils.getMovesToNode(moveTree, moveTree.currentNodeId);
  }, [moveTree]);

  // Проверка возможности отмены/повтора
  const canUndo = useMemo(() => {
    return moveTree.currentNodeId !== moveTree.rootId;
  }, [moveTree.currentNodeId, moveTree.rootId]);

  const canRedo = useMemo(() => {
    return currentNode?.children.length > 0;
  }, [currentNode]);

  // Получение информации о ветках
  const branches = useMemo(() => {
    return MoveTreeUtils.getAllBranches(moveTree);
  }, [moveTree]);

  // Синхронизация дерева с игрой
  useEffect(() => {
    if (isManualTreeOperation) {
      setIsManualTreeOperation(false);
      return;
    }

    const timeSinceLastManualOp = Date.now() - lastManualOperationRef.current;
    if (timeSinceLastManualOp < 1000) {
      return;
    }

    const gameHistoryMoves = game.history({ verbose: true });
    const treeMovesCount = MoveTreeUtils.getMovesToNode(
      moveTree,
      moveTree.currentNodeId
    ).length;

    // Синхронизируем только если в игре больше ходов чем в дереве
    if (gameHistoryMoves.length > treeMovesCount) {
      const newMoves = gameHistoryMoves.slice(treeMovesCount);
      let currentTree = moveTree;

      newMoves.forEach((move) => {
        const { tree } = MoveTreeUtils.addMove(
          currentTree,
          move,
          game.fen(),
          currentTree.currentNodeId
        );
        currentTree = tree;
      });

      setMoveTree(currentTree);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game, moveTree.currentNodeId, setMoveTree, isManualTreeOperation]);

  // Восстановление игры из дерева
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
          // Пропускаем некорректные ходы
        }
      });

      return newGame;
    },
    [moveTree, game]
  );

  const setPgn = useCallback(
    (pgn: string) => {
      setIsManualTreeOperation(true);

      const newGame = new Chess();
      newGame.loadPgn(pgn);
      setGame(newGame);

      // Создаем новое дерево из PGN
      let newTree = MoveTreeUtils.createEmptyTree(DEFAULT_POSITION);
      const moves = newGame.history({ verbose: true });

      moves.forEach((move) => {
        const { tree } = MoveTreeUtils.addMove(
          newTree,
          move,
          newGame.fen(),
          newTree.currentNodeId
        );
        newTree = tree;
      });

      setMoveTree(newTree);
    },
    [setGame, setMoveTree]
  );

  const setFen = useCallback(
    (fen: string) => {
      setIsManualTreeOperation(true);

      const newGame = new Chess(fen);
      setGame(newGame);

      // Создаем новое дерево с новой позиции
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

      // Сброс дерева
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
      createNewBranch?: boolean; // Опция для принудительного создания новой ветки
    }): Move | null => {
      const { comment, createNewBranch, ...moveParams } = params;

      // Проверяем, существует ли уже такой ход в детях текущего узла
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

      // Если ход уже существует и мы не создаем новую ветку принудительно
      if (existingChild && !createNewBranch) {
        // Переходим к существующему ходу
        const newTree = MoveTreeUtils.goToNode(moveTree, existingChild);
        setMoveTree(newTree);

        const newGame = reconstructGameFromTree(existingChild);
        setGame(newGame);

        const childMove = moveTree.nodes[existingChild]?.move;
        if (childMove) playSoundFromMove(childMove);

        return childMove;
      }

      // Создаем новый ход
      const tempGame = reconstructGameFromTree();

      try {
        const result = tempGame.move(moveParams);
        if (comment) tempGame.setComment(comment);

        // Добавляем ход в дерево
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

  // Отмена хода (переход к родительскому узлу)
  const undoMove = useCallback(() => {
    if (!canUndo || !currentNode.parent) return;

    setIsManualTreeOperation(true);
    lastManualOperationRef.current = Date.now();

    const newTree = MoveTreeUtils.goToNode(moveTree, currentNode.parent);
    setMoveTree(newTree);

    const newGame = reconstructGameFromTree(currentNode.parent);
    setGame(newGame);

    // Воспроизводим звук предыдущего хода
    const parentNode = moveTree.nodes[currentNode.parent];
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

  // Повтор хода (переход к первому дочернему узлу)
  const redoMove = useCallback(() => {
    if (!canRedo || currentNode.children.length === 0) return;

    setIsManualTreeOperation(true);
    lastManualOperationRef.current = Date.now();

    // Выбираем первого ребенка (главную линию) или позволяем выбрать
    const nextNodeId = currentNode.children[0];
    const newTree = MoveTreeUtils.goToNode(moveTree, nextNodeId);
    setMoveTree(newTree);

    const newGame = reconstructGameFromTree(nextNodeId);
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

  // Переход к конкретному узлу
  const goToNode = useCallback(
    (nodeId: string) => {
      if (!moveTree.nodes[nodeId]) return;

      setIsManualTreeOperation(true);
      lastManualOperationRef.current = Date.now();

      const newTree = MoveTreeUtils.goToNode(moveTree, nodeId);
      setMoveTree(newTree);

      const newGame = reconstructGameFromTree(nodeId);
      setGame(newGame);

      const targetNode = moveTree.nodes[nodeId];
      if (targetNode?.move) {
        playSoundFromMove(targetNode.move);
      }
    },
    [moveTree, reconstructGameFromTree, setMoveTree, setGame]
  );

  // Переход к конкретному ходу в ветке
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

  // Удаление ветки
  const deleteBranch = useCallback(
    (nodeId: string) => {
      if (nodeId === moveTree.rootId) return;

      const newTree = MoveTreeUtils.deleteBranch(moveTree, nodeId);
      setMoveTree(newTree);

      // Если текущий узел был удален, игра уже обновлена в deleteBranch
      if (newTree.currentNodeId !== moveTree.currentNodeId) {
        const newGame = reconstructGameFromTree(newTree.currentNodeId);
        setGame(newGame);
      }
    },
    [moveTree, reconstructGameFromTree, setMoveTree, setGame]
  );

  // Промоция ветки в главную линию
  const promoteToMainLine = useCallback(
    (nodeId: string) => {
      const newTree = MoveTreeUtils.promoteToMainLine(moveTree, nodeId);
      setMoveTree(newTree);
    },
    [moveTree, setMoveTree]
  );

  // Получение вариантов (альтернативных ходов) для текущей позиции
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

  return {
    // Базовые операции
    setPgn,
    reset,
    playMove,
    undoMove,
    redoMove,
    setFen,

    // Операции с деревом
    goToNode,
    goToBranch,
    deleteBranch,
    promoteToMainLine,

    // Информация о состоянии
    canUndo,
    canRedo,
    branches,
    currentNode,
    currentMoves,
    moveTree,

    // Утилиты
    getAlternativeMoves,
    reconstructGameFromTree,

    // Совместимость с линейной версией
    moveHistory: currentMoves,
    currentPosition: currentMoves.length - 1,
  };
};
