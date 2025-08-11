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

// Atom for storing the list of games
export const gamesListAtom = atom<GameInfo[]>([]);

// Helper function for creating GameInfo from PGN
export function createGameInfoFromPgn(
  pgn: string,
  index: number
): GameInfo | null {
  try {
    const game = new Chess();
    game.loadPgn(pgn);
    const headers = game.getHeaders();

    // Create a unique identifier
    const id = `game-${index}-${Date.now()}`;

    // Get position preview (for example, after 10 moves or the last position if there are fewer moves)
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
