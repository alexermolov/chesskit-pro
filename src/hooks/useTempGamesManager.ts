import { PgnParser } from "@/lib/pgnParser";
import {
  gameAtom,
  gameEvalAtom,
  moveTreeAtom,
  tempGamesListAtom,
} from "@/sections/analysis/states";
import { Game } from "@/types/game";
import { Chess } from "chess.js";
import { useAtom, useSetAtom } from "jotai";
import { useCallback } from "react";

/**
 * Хук для управления временными играми
 * Предоставляет методы для работы со списком временных игр
 */
export const useTempGamesManager = () => {
  const [tempGamesList, setTempGamesList] = useAtom(tempGamesListAtom);
  const setGame = useSetAtom(gameAtom);
  const setEval = useSetAtom(gameEvalAtom);
  const setMoveTree = useSetAtom(moveTreeAtom);

  /**
   * Загружает игру из временного списка
   * @param game Игра для загрузки
   * @param resetBoard Функция для сброса доски
   */
  const loadTempGame = useCallback(
    (game: Game, resetBoard?: () => void) => {
      try {
        // Сбрасываем текущее состояние, если есть функция сброса
        if (resetBoard) {
          resetBoard();
          setEval(undefined);
        }

        // Создаем новую игру и загружаем PGN
        try {
          // Создаем новую игру с более безопасной загрузкой
          const fallbackGame = new Chess();

          try {
            // Пытаемся загрузить PGN
            fallbackGame.loadPgn(game.pgn);
            setGame(fallbackGame);

            // Если PGN содержит ветки, будем использовать парсер
            if (game.pgn.includes("{") || game.pgn.includes("(")) {
              // Используем парсер для поддержки веток
              const { game: parsedGame, moveTree } =
                PgnParser.parsePgnToMoveTree(game.pgn);
              setGame(parsedGame);
              setMoveTree(moveTree);
            }

            // Загружаем оценку, если она есть
            if (game.eval) {
              setEval(game.eval);
            }
          } catch (loadError) {
            console.error("Failed to load PGN:", loadError);

            // Если в PGN есть заголовки, попытаемся их установить
            const headerMatch = game.pgn.match(/\[(.*?)\s+"(.*?)"\]/g);
            if (headerMatch) {
              try {
                // Создаем пустую игру
                const newGame = new Chess();

                // Создаем строку PGN с заголовками
                const headers = headerMatch.join("\n");
                const pgn = headers + "\n\n*";

                // Загружаем только заголовки
                newGame.loadPgn(pgn);
                setGame(newGame);
              } catch (headerError) {
                console.error("Failed to load headers:", headerError);
                setGame(new Chess());
              }
            } else {
              setGame(new Chess());
            }
          }
        } catch (e) {
          console.error("Failed fallback handling:", e);
          setGame(new Chess());
        }
      } catch (e) {
        console.error("Error loading game:", e);
        setGame(new Chess());
      }
    },
    [setGame, setEval, setMoveTree]
  );

  /**
   * Добавляет игру во временный список
   * @param gameToAdd Игра для добавления
   */
  const addToTempList = useCallback(
    (gameToAdd: Game) => {
      setTempGamesList([...tempGamesList, gameToAdd]);
      return gameToAdd.id;
    },
    [tempGamesList, setTempGamesList]
  );

  /**
   * Удаляет игру из временного списка
   * @param id ID игры для удаления
   */
  const removeFromTempList = useCallback(
    (id: number) => {
      const updatedList = tempGamesList.filter((game) => game.id !== id);
      setTempGamesList(updatedList);
    },
    [tempGamesList, setTempGamesList]
  );

  /**
   * Очищает временный список игр
   */
  const clearTempList = useCallback(() => {
    setTempGamesList([]);
  }, [setTempGamesList]);

  /**
   * Генерирует заголовки PGN на основе свойств игры
   * @param game Игра для генерации заголовков
   * @returns Строка с заголовками PGN
   */
  const generatePgnHeaders = useCallback((game: Game): string => {
    // Базовые заголовки
    const headers = [
      `[Event "${game.event || "Temporary Game"}"]`,
      `[Site "${game.site || "Chesskit-Pro"}"]`,
      `[Date "${game.date || "????.??.??"}"]`,
      `[Round "${game.round || "?"}"]`,
      `[White "${game.white?.name || "White"}"]`,
      `[Black "${game.black?.name || "Black"}"]`,
      `[Result "${game.result || "*"}"]`,
    ];

    // Добавляем рейтинги, если они есть
    if (game.white?.rating) {
      headers.push(`[WhiteElo "${game.white.rating}"]`);
    }
    if (game.black?.rating) {
      headers.push(`[BlackElo "${game.black.rating}"]`);
    }

    // Добавляем дополнительные заголовки, если они есть
    if (game.timeControl) {
      headers.push(`[TimeControl "${game.timeControl}"]`);
    }
    if (game.termination) {
      headers.push(`[Termination "${game.termination}"]`);
    }

    return headers.join("\n");
  }, []);

  /**
   * Извлекает ходы из PGN игры (без заголовков)
   * @param pgn Строка PGN
   * @returns Только ходы без заголовков
   */
  const extractMovesFromPgn = useCallback((pgn: string): string => {
    // Удаляем все заголовки
    const movesText = pgn.replace(/\[.*?\]\s*/g, "").trim();
    return movesText;
  }, []);

  /**
   * Экспортирует все игры во временном списке в один PGN файл
   * с учетом обновленных заголовков
   * @returns Промис с результатом операции
   */
  const exportTempListToPgn = useCallback(async () => {
    try {
      if (tempGamesList.length === 0) {
        return { success: false, message: "No games to export" };
      }

      // Объединяем все PGN с разделителями и учетом заголовков
      const combinedPgn = tempGamesList
        .map((game) => {
          // Генерируем заголовки на основе текущих данных игры
          const headers = generatePgnHeaders(game);
          let moves = "";

          // Извлекаем ходы из исходного PGN
          if (game.pgn) {
            moves = extractMovesFromPgn(game.pgn);
            if (!moves.trim()) {
              moves = "*"; // Если ходов нет, используем * как результат
            }
          } else {
            moves = "*";
          }

          // Формируем полное PGN с новыми заголовками и исходными ходами
          return `${headers}\n\n${moves}\n\n`;
        })
        .join("");

      // Создаем объект Blob с текстом PGN
      const blob = new Blob([combinedPgn], { type: "text/plain" });

      // Создаем временную ссылку для скачивания
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chesskit_temp_games_${new Date().toISOString().slice(0, 10)}.pgn`;

      // Добавляем ссылку в DOM, запускаем клик и удаляем
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Освобождаем URL
      URL.revokeObjectURL(url);

      return {
        success: true,
        message: `Exported ${tempGamesList.length} games to PGN file with updated headers`,
      };
    } catch (error) {
      console.error("Failed to export games:", error);
      return {
        success: false,
        message: "Failed to export games",
      };
    }
  }, [tempGamesList, generatePgnHeaders, extractMovesFromPgn]);

  /**
   * Получает игру по ID из временного списка
   * @param id ID игры
   * @returns Игра или undefined, если не найдена
   */
  const getTempGameById = useCallback(
    (id: number) => {
      return tempGamesList.find((game) => game.id === id);
    },
    [tempGamesList]
  );

  return {
    tempGamesList,
    loadTempGame,
    addToTempList,
    removeFromTempList,
    clearTempList,
    exportTempListToPgn,
    getTempGameById,
  };
};
