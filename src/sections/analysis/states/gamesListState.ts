import { atom } from "jotai";
import { Chess } from "chess.js";

export interface GameInfo {
  id: string;
  pgn: string;
  headers: Record<string, string>;
  date?: string;
  white: string;
  black: string;
  result: string;
  previewFen?: string;
}

// Атом для хранения списка игр
export const gamesListAtom = atom<GameInfo[]>([]);

// Вспомогательная функция для создания GameInfo из PGN
export function createGameInfoFromPgn(
  pgn: string,
  index: number
): GameInfo | null {
  try {
    const game = new Chess();
    game.loadPgn(pgn);
    const headers = game.getHeaders();

    // Создаем уникальный идентификатор
    const id = `game-${index}-${Date.now()}`;

    // Получаем превью позиции (например, после 10 ходов или последняя позиция, если ходов меньше)
    let previewFen = game.fen();
    const moves = game.history();
    if (moves.length > 10) {
      const previewGame = new Chess();
      for (let i = 0; i < Math.min(10, moves.length); i++) {
        previewGame.move(moves[i]);
      }
      previewFen = previewGame.fen();
    }

    return {
      id,
      pgn,
      headers,
      date: headers.Date || headers.UTCDate,
      white: headers.White || "Unknown",
      black: headers.Black || "Unknown",
      result: headers.Result || "*",
      previewFen,
    };
  } catch (error) {
    console.error("Error creating game info:", error);
    return null;
  }
}
