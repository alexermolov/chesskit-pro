import { setGameHeaders } from "@/lib/chess";
import { playIllegalMoveSound, playSoundFromMove } from "@/lib/sounds";
import { Player } from "@/types/game";
import { Chess, DEFAULT_POSITION, Move } from "chess.js";
import { PrimitiveAtom, useAtom } from "jotai";
import { useCallback, useState, useMemo, useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { moveHistoryAtom } from "@/sections/analysis/states";

export interface resetGameParams {
  fen?: string;
  white?: Player;
  black?: Player;
  noHeaders?: boolean;
}

export const useChessActionsWithHistory = (chessAtom: PrimitiveAtom<Chess>) => {
  const [game, setGame] = useAtom(chessAtom);

  // Используем глобальный атом для истории ходов вместо локального состояния
  const [moveHistory, setMoveHistory] = useAtom(moveHistoryAtom);

  // Флаг для предотвращения автосинхронизации во время undo/redo
  const [isManualHistoryOperation, setIsManualHistoryOperation] =
    useState(false);

  // Используем useRef для отслеживания последней ручной операции
  const lastManualOperationRef = useRef<number>(0);

  // Производные свойства для проверки возможности отмены/повтора
  const canUndo = useMemo(() => {
    return moveHistory.currentPosition >= 0;
  }, [moveHistory.currentPosition]);

  const canRedo = useMemo(() => {
    return moveHistory.currentPosition < moveHistory.allMoves.length - 1;
  }, [moveHistory.currentPosition, moveHistory.allMoves.length]);

  // Синхронизируем историю с текущей игрой только при значительных изменениях
  useEffect(() => {
    // Пропускаем синхронизацию во время ручных операций с историей
    if (isManualHistoryOperation) {
      setIsManualHistoryOperation(false);
      return;
    }

    // Проверяем, была ли недавняя ручная операция (в течение 1000мс)
    const timeSinceLastManualOp = Date.now() - lastManualOperationRef.current;
    if (timeSinceLastManualOp < 1000) {
      return;
    }

    const gameHistoryMoves = game.history({ verbose: true });

    // Синхронизируем только если история пуста ИЛИ игра имеет больше ходов чем наша история
    // НЕ обрезаем историю если игра имеет меньше ходов (это может быть результат undo)
    if (
      moveHistory.allMoves.length === 0 ||
      gameHistoryMoves.length > moveHistory.allMoves.length
    ) {
      setMoveHistory({
        allMoves: gameHistoryMoves,
        currentPosition: gameHistoryMoves.length - 1,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    game,
    moveHistory.allMoves.length,
    setMoveHistory,
    isManualHistoryOperation,
  ]);

  // Получение текущих активных ходов
  const getCurrentMoves = useCallback(() => {
    return moveHistory.allMoves.slice(0, moveHistory.currentPosition + 1);
  }, [moveHistory]);

  // Функция для восстановления игры из текущих активных ходов
  const reconstructGameFromHistory = useCallback(() => {
    const newGame = new Chess();
    // Копируем заголовки из текущей игры
    const headers = game.getHeaders();
    Object.entries(headers).forEach(([key, value]) => {
      if (value) newGame.setHeader(key, value);
    });

    // Применяем все активные ходы
    getCurrentMoves().forEach((move: Move) => {
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
  }, [game, getCurrentMoves]);

  const setPgn = useCallback(
    (pgn: string) => {
      // Устанавливаем флаг для предотвращения автосинхронизации
      setIsManualHistoryOperation(true);

      const newGame = new Chess();
      newGame.loadPgn(pgn);
      setGame(newGame);

      // Сброс истории ходов при загрузке новой игры
      setMoveHistory(() => ({
        allMoves: newGame.history({ verbose: true }),
        currentPosition: newGame.history().length - 1,
      }));
    },
    [setGame, setMoveHistory, setIsManualHistoryOperation]
  );

  const setFen = useCallback(
    (fen: string) => {
      // Устанавливаем флаг для предотвращения автосинхронизации
      setIsManualHistoryOperation(true);

      const newGame = new Chess(fen);
      setGame(newGame);

      // Сброс истории ходов при установке новой позиции
      setMoveHistory(() => ({
        allMoves: [],
        currentPosition: -1,
      }));
    },
    [setGame, setMoveHistory, setIsManualHistoryOperation]
  );

  const reset = useCallback(
    (params?: resetGameParams) => {
      // Устанавливаем флаг для предотвращения автосинхронизации
      setIsManualHistoryOperation(true);

      const newGame = new Chess(params?.fen);
      if (!params?.noHeaders) setGameHeaders(newGame, params);
      setGame(newGame);

      // Сброс истории ходов
      setMoveHistory(() => ({
        allMoves: [],
        currentPosition: -1,
      }));
    },
    [setGame, setMoveHistory, setIsManualHistoryOperation]
  );

  const copyGame = useCallback(() => {
    return reconstructGameFromHistory();
  }, [reconstructGameFromHistory]);

  const resetToStartingPosition = useCallback(
    (pgn?: string) => {
      if (pgn) {
        setPgn(pgn);
        return;
      }

      const newGame = copyGame();
      newGame.load(newGame.getHeaders().FEN || DEFAULT_POSITION, {
        preserveHeaders: true,
      });
      setGame(newGame);

      // Возвращаемся к начальной позиции в истории
      setMoveHistory((prev) => ({
        ...prev,
        currentPosition: -1,
      }));
    },
    [copyGame, setGame, setMoveHistory, setPgn]
  );

  const playMove = useCallback(
    (params: {
      from: string;
      to: string;
      promotion?: string;
      comment?: string;
    }): Move | null => {
      const newGame = copyGame();

      try {
        const { comment, ...moveParams } = params;
        const result = newGame.move(moveParams);
        if (comment) newGame.setComment(comment);

        setGame(newGame);
        playSoundFromMove(result);

        // Добавляем ход в историю
        setMoveHistory((prev) => {
          const newPosition = prev.currentPosition + 1;
          const newAllMoves = [...prev.allMoves.slice(0, newPosition), result];

          return {
            allMoves: newAllMoves,
            currentPosition: newPosition,
          };
        });

        return result;
      } catch {
        playIllegalMoveSound();
        return null;
      }
    },
    [copyGame, setGame, setMoveHistory]
  );

  const addMoves = useCallback(
    (moves: string[]) => {
      const newGame = copyGame();

      let lastMove: Move | null = null;
      const newMoves: Move[] = [];

      for (const moveStr of moves) {
        try {
          lastMove = newGame.move(moveStr);
          if (lastMove) newMoves.push(lastMove);
        } catch {
          // Пропускаем некорректные ходы
          break;
        }
      }

      if (newMoves.length > 0) {
        setGame(newGame);
        if (lastMove) playSoundFromMove(lastMove);

        // Добавляем все ходы в историю
        setMoveHistory((prev) => {
          const newPosition = prev.currentPosition + newMoves.length;
          const newAllMoves = [
            ...prev.allMoves.slice(0, prev.currentPosition + 1),
            ...newMoves,
          ];

          return {
            allMoves: newAllMoves,
            currentPosition: newPosition,
          };
        });
      }
    },
    [copyGame, setGame, setMoveHistory]
  );

  // Функция отмены хода (назад в истории)
  const undoMove = useCallback(() => {
    if (moveHistory.currentPosition < 0) return;

    // Устанавливаем флаг и временную метку для предотвращения автосинхронизации
    setIsManualHistoryOperation(true);
    lastManualOperationRef.current = Date.now();

    const newPosition = moveHistory.currentPosition - 1;
    const newGame = new Chess();

    // Копируем заголовки
    const headers = game.getHeaders();
    Object.entries(headers).forEach(([key, value]) => {
      if (value) newGame.setHeader(key, value);
    });

    // Применяем ходы до новой позиции
    if (newPosition >= 0) {
      moveHistory.allMoves.slice(0, newPosition + 1).forEach((move: Move) => {
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
    }

    setGame(newGame);

    // Обновляем позицию в истории, сохраняя все ходы
    flushSync(() => {
      setMoveHistory((prev) => ({
        ...prev,
        currentPosition: newPosition,
      }));
    });

    // Воспроизводим звук последнего хода
    if (newPosition >= 0) {
      const lastMove = moveHistory.allMoves[newPosition];
      if (lastMove) playSoundFromMove(lastMove);
    }
  }, [moveHistory, game, setGame, setMoveHistory, setIsManualHistoryOperation]);

  // Функция повтора отмененного хода (вперед в истории)
  const redoMove = useCallback(() => {
    if (moveHistory.currentPosition >= moveHistory.allMoves.length - 1) {
      return;
    }

    // Устанавливаем флаг и временную метку для предотвращения автосинхронизации
    setIsManualHistoryOperation(true);
    lastManualOperationRef.current = Date.now();

    const newPosition = moveHistory.currentPosition + 1;
    const moveToRedo = moveHistory.allMoves[newPosition];

    if (moveToRedo) {
      const newGame = new Chess();

      // Копируем заголовки
      const headers = game.getHeaders();
      Object.entries(headers).forEach(([key, value]) => {
        if (value) newGame.setHeader(key, value);
      });

      // Применяем ходы до новой позиции включительно
      moveHistory.allMoves.slice(0, newPosition + 1).forEach((move: Move) => {
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

      setGame(newGame);
      playSoundFromMove(moveToRedo);

      flushSync(() => {
        setMoveHistory((prev) => ({
          ...prev,
          currentPosition: newPosition,
        }));
      });
    }
  }, [moveHistory, game, setGame, setMoveHistory, setIsManualHistoryOperation]);

  const goToMove = useCallback(
    (moveIdx: number, fullGame?: Chess) => {
      if (moveIdx < -1) return;

      // Устанавливаем флаг для предотвращения автосинхронизации
      setIsManualHistoryOperation(true);

      // Если предоставлена полная игра, используем её
      if (fullGame) {
        const newGame = new Chess();
        newGame.loadPgn(fullGame.pgn());

        const movesNb = fullGame.history().length;
        if (moveIdx > movesNb) return;

        let lastMove: Move | null = {} as Move;
        for (let i = movesNb; i > moveIdx; i--) {
          lastMove = newGame.undo();
        }

        setGame(newGame);
        if (lastMove) playSoundFromMove(lastMove);
        return;
      }

      // Используем историю ходов
      const maxPosition = moveHistory.allMoves.length - 1;
      const targetPosition = Math.max(-1, Math.min(moveIdx, maxPosition));

      const newGame = new Chess();
      const headers = game.getHeaders();
      Object.entries(headers).forEach(([key, value]) => {
        if (value) newGame.setHeader(key, value);
      });

      // Применяем ходы до целевой позиции
      moveHistory.allMoves
        .slice(0, targetPosition + 1)
        .forEach((move: Move) => {
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

      setGame(newGame);
      setMoveHistory((prev) => ({
        ...prev,
        currentPosition: targetPosition,
      }));

      // Воспроизводим звук последнего хода
      if (targetPosition >= 0) {
        const lastMove = moveHistory.allMoves[targetPosition];
        if (lastMove) playSoundFromMove(lastMove);
      }
    },
    [moveHistory, game, setGame, setMoveHistory, setIsManualHistoryOperation]
  );

  return {
    setPgn,
    reset,
    playMove,
    undoMove,
    redoMove, // Новая функция
    goToMove,
    resetToStartingPosition,
    addMoves,
    setFen,
    // Информация о состоянии истории
    canUndo,
    canRedo,
    moveHistory: moveHistory.allMoves,
    currentPosition: moveHistory.currentPosition,
  };
};
