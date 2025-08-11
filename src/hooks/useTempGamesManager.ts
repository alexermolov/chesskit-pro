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
import { useCallback, useEffect } from "react";

/**
 * Hook for managing temporary games
 * Provides methods for working with the list of temporary games
 */
export const useTempGamesManager = () => {
  const [tempGamesList, setTempGamesList] = useAtom(tempGamesListAtom);
  const setGame = useSetAtom(gameAtom);
  const setEval = useSetAtom(gameEvalAtom);
  const setMoveTree = useSetAtom(moveTreeAtom);

  // Log changes in the list for debugging
  useEffect(() => {
    console.log("Temp games list updated:", tempGamesList.length, "games");
  }, [tempGamesList]);

  /**
   * Loads a game from the temporary list
   * @param game Game to load
   * @param resetBoard Function to reset the board
   */
  const loadTempGame = useCallback(
    (game: Game, resetBoard?: () => void) => {
      try {
        console.log("Loading temp game:", game.id);

        // Reset current state if reset function is provided
        if (resetBoard) {
          resetBoard();
          setEval(undefined);
        }

        // Create a new game and load PGN
        try {
          // Create a new game with safer loading
          const fallbackGame = new Chess();

          try {
            // Try to load PGN
            fallbackGame.loadPgn(game.pgn);
            setGame(fallbackGame);

            // If PGN contains variations, use parser
            if (game.pgn.includes("{") || game.pgn.includes("(")) {
              // Use parser to support variations
              const { game: parsedGame, moveTree } =
                PgnParser.parsePgnToMoveTree(game.pgn);
              setGame(parsedGame);
              setMoveTree(moveTree);
            } else {
              // For regular games without variations, create standard move tree
              const { moveTree } = PgnParser.parsePgnToMoveTree(game.pgn);
              setMoveTree(moveTree);
            }

            // Load evaluation if present
            if (game.eval) {
              setEval(game.eval);
            }

            console.log("Temp game loaded successfully");
          } catch (loadError) {
            console.error("Failed to load PGN:", loadError);

            // If PGN has headers, try to set them
            const headerMatch = game.pgn.match(/\[(.*?)\s+"(.*?)"\]/g);
            if (headerMatch) {
              try {
                // Create an empty game
                const newGame = new Chess();

                // Create PGN string with headers
                const headers = headerMatch.join("\n");
                const pgn = headers + "\n\n*";

                // Load only headers
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
   * Adds a game to the temporary list
   * @param gameToAdd Game to add
   */
  const addToTempList = useCallback(
    (gameToAdd: Game) => {
      setTempGamesList([...tempGamesList, gameToAdd]);
      return gameToAdd.id;
    },
    [tempGamesList, setTempGamesList]
  );

  /**
   * Removes a game from the temporary list
   * @param id ID of the game to remove
   */
  const removeFromTempList = useCallback(
    (id: number) => {
      const updatedList = tempGamesList.filter((game) => game.id !== id);
      setTempGamesList(updatedList);
    },
    [tempGamesList, setTempGamesList]
  );

  /**
   * Clears the temporary games list
   */
  const clearTempList = useCallback(() => {
    setTempGamesList([]);
  }, [setTempGamesList]);

  /**
   * Generates PGN headers based on game properties
   * @param game Game to generate headers for
   * @returns String with PGN headers
   */
  const generatePgnHeaders = useCallback((game: Game): string => {
    // Basic headers
    const headers = [
      `[Event "${game.event || "Temporary Game"}"]`,
      `[Site "${game.site || "Chesskit-Pro"}"]`,
      `[Date "${game.date || "????.??.??"}"]`,
      `[Round "${game.round || "?"}"]`,
      `[White "${game.white?.name || "White"}"]`,
      `[Black "${game.black?.name || "Black"}"]`,
      `[Result "${game.result || "*"}"]`,
    ];

    // Add ratings if present
    if (game.white?.rating) {
      headers.push(`[WhiteElo "${game.white.rating}"]`);
    }
    if (game.black?.rating) {
      headers.push(`[BlackElo "${game.black.rating}"]`);
    }

    // Add additional headers if present
    if (game.timeControl) {
      headers.push(`[TimeControl "${game.timeControl}"]`);
    }
    if (game.termination) {
      headers.push(`[Termination "${game.termination}"]`);
    }

    return headers.join("\n");
  }, []);

  /**
   * Extracts moves from a game's PGN (without headers)
   * @param pgn PGN string
   * @returns Only moves without headers
   */
  const extractMovesFromPgn = useCallback((pgn: string): string => {
    // Remove all headers
    const movesText = pgn.replace(/\[.*?\]\s*/g, "").trim();
    return movesText;
  }, []);

  /**
   * Exports all games in the temporary list to a single PGN file
   * with updated headers
   * @returns Promise with operation result
   */
  const exportTempListToPgn = useCallback(async () => {
    try {
      if (tempGamesList.length === 0) {
        return { success: false, message: "No games to export" };
      }

      // Combine all PGNs with separators and updated headers
      const combinedPgn = tempGamesList
        .map((game) => {
          // Generate headers based on current game data
          const headers = generatePgnHeaders(game);
          let moves = "";

          // Extract moves from original PGN
          if (game.pgn) {
            moves = extractMovesFromPgn(game.pgn);
            if (!moves.trim()) {
              moves = "*"; // If no moves, use * as result
            }
          } else {
            moves = "*";
          }

          // Form full PGN with new headers and original moves
          return `${headers}\n\n${moves}\n\n`;
        })
        .join("");

      // Create Blob object with PGN text
      const blob = new Blob([combinedPgn], { type: "text/plain" });

      // Create temporary link for download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chesskit_temp_games_${new Date().toISOString().slice(0, 10)}.pgn`;

      // Add link to DOM, trigger click, and remove
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Release URL
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
   * Gets a game by ID from the temporary list
   * @param id Game ID
   * @returns Game or undefined if not found
   */
  const getTempGameById = useCallback(
    (id: number) => {
      console.log(
        "Looking for temp game with ID:",
        id,
        "in list of",
        tempGamesList.length,
        "games"
      );
      const found = tempGamesList.find((game) => game.id === id);
      if (!found) {
        console.warn("Temp game not found with ID:", id);
      }
      return found;
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
