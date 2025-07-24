import { Chess } from "chess.js";
import { PgnParser } from "./pgnParser";

interface PgnGame {
  pgn: string;
  headers: Record<string, string>;
}

export class MultiGamePgnParser {
  /**
   * Parses a PGN string that might contain multiple games
   * and returns an array of PGN games
   */
  static parseMultiGamePgn(pgn: string): PgnGame[] {
    // Normalize line endings
    const normalizedPgn = pgn.replace(/\r\n/g, "\n");

    // Split the pgn into chunks (each game is separated by two new lines after the last move)
    const games: PgnGame[] = [];
    const pgnChunks = this.splitGames(normalizedPgn);

    for (const chunk of pgnChunks) {
      try {
        const game = new Chess();
        game.loadPgn(chunk);

        games.push({
          pgn: chunk,
          headers: game.getHeaders(),
        });
      } catch (error) {
        console.error("Error parsing game chunk:", error);
      }
    }

    return games;
  }

  /**
   * Splits a multi-game PGN string into individual game strings
   */
  private static splitGames(pgn: string): string[] {
    // Extract header blocks
    const headerBlockRegex = /(\[\s*\w+\s*"[^"]*"\s*\]\s*)+/g;
    const headerBlocks = pgn.match(headerBlockRegex) || [];

    if (headerBlocks.length <= 1) {
      // Only one game or no valid games
      return pgn.trim() ? [pgn.trim()] : [];
    }

    // Split the PGN based on header blocks
    const games: string[] = [];
    let lastIndex = 0;

    for (let i = 0; i < headerBlocks.length; i++) {
      const currentHeaderBlock = headerBlocks[i];
      const currentHeaderIndex = pgn.indexOf(currentHeaderBlock, lastIndex);

      if (i > 0) {
        // Extract the previous game (header + moves)
        const previousGameEnd = currentHeaderIndex;
        const gameContent = pgn.substring(lastIndex, previousGameEnd).trim();
        games.push(gameContent);
      }

      lastIndex = currentHeaderIndex;

      // Handle the last game
      if (i === headerBlocks.length - 1) {
        games.push(pgn.substring(lastIndex).trim());
      }
    }

    return games.filter((game) => game.length > 0);
  }

  /**
   * Parses a multi-game PGN string and returns an array of Chess.js games with move trees
   */
  static parseMultiGamePgnWithMoveTrees(pgn: string): Array<{
    game: Chess;
    moveTree: any;
    headers: Record<string, string>;
  }> {
    const pgnGames = this.parseMultiGamePgn(pgn);

    return pgnGames.map((game) => {
      const result = PgnParser.parsePgnToMoveTree(game.pgn);
      return {
        ...result,
        headers: result.game.getHeaders(),
      };
    });
  }
}
