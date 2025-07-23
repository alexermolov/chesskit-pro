import { MoveTree, MoveTreeUtils } from "@/types/moveTree";
import { Chess } from "chess.js";

const DEFAULT_POSITION =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

interface PgnToken {
  type:
    | "move"
    | "variation_start"
    | "variation_end"
    | "comment"
    | "nag"
    | "result";
  value: string;
}

/**
 * Исправленный парсер PGN с поддержкой вариаций для создания дерева ходов
 *
 * Основные исправления:
 * 1. Правильная обработка вариаций - не откатываем ход при variation_start
 * 2. Улучшенная обработка комментариев
 * 3. Более надежное восстановление позиций через FEN
 */
export class PgnParser {
  /**
   * Tokenizes PGN string
   */
  private static tokenizePgn(pgn: string): PgnToken[] {
    const tokens: PgnToken[] = [];
    let i = 0;

    // Remove PGN headers - only headers starting with [Name "value"]
    const moveText = pgn.replace(/^\s*\[[^\]]*"[^"]*"\]\s*$/gm, "").trim();

    while (i < moveText.length) {
      const char = moveText[i];

      if (char === "(") {
        tokens.push({ type: "variation_start", value: "(" });
        i++;
      } else if (char === ")") {
        tokens.push({ type: "variation_end", value: ")" });
        i++;
      } else if (char === "{") {
        // Comment
        let comment = "";
        i++; // skip {
        while (i < moveText.length && moveText[i] !== "}") {
          comment += moveText[i];
          i++;
        }
        i++; // skip }
        // Clean comment from excessive whitespace but keep arrows
        const cleanComment = comment
          .replace(/\s+/g, " ") // replace multiple spaces with single spaces
          .trim();
        if (cleanComment) {
          tokens.push({ type: "comment", value: cleanComment });
        }
      } else if (char === "$") {
        // NAG (Numeric Annotation Glyph)
        let nag = "$";
        i++;
        while (i < moveText.length && /\d/.test(moveText[i])) {
          nag += moveText[i];
          i++;
        }
        tokens.push({ type: "nag", value: nag });
      } else if (/\s/.test(char)) {
        // Skip spaces
        i++;
      } else {
        // Move or result
        let token = "";
        while (i < moveText.length && !/[\s(){}]/.test(moveText[i])) {
          token += moveText[i];
          i++;
        }

        if (token) {
          // Check if this is a game result
          if (["1-0", "0-1", "1/2-1/2", "*"].includes(token)) {
            tokens.push({ type: "result", value: token });
          } else if (/^\d+(\.\.\.|\.)$/.test(token)) {
            // This is a move number - save as separate token
            tokens.push({ type: "move", value: token });
          } else {
            // Remove move numbers if they are at the beginning of token (e.g., "1.e4" -> "e4")
            const cleanToken = token.replace(/^\d+(\.\.\.|\.)/, "");
            if (cleanToken) {
              tokens.push({ type: "move", value: cleanToken });
            } else if (token.match(/^\d+(\.\.\.|\.)$/)) {
              // If only move number remains, save it
              tokens.push({ type: "move", value: token });
            }
          }
        }
      }
    }

    return tokens;
  }

  /**
   * Parses tokens into move tree
   */
  private static parseTokensToMoveTree(tokens: PgnToken[]): MoveTree {
    let moveTree = MoveTreeUtils.createEmptyTree(DEFAULT_POSITION);
    let currentGame = new Chess();
    let currentNodeId = "root";

    // Stack for handling variations
    const variationStack: Array<{
      nodeId: string;
      game: Chess;
    }> = [];

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      switch (token.type) {
        case "move":
          try {
            const move = currentGame.move(token.value);
            if (move) {
              const result = MoveTreeUtils.addMove(
                moveTree,
                move,
                currentGame.fen(),
                currentNodeId
              );
              moveTree = result.tree;
              currentNodeId = result.nodeId;
            }
          } catch {
            // Error when trying to make move - skip
          }
          break;

        case "variation_start": {
          // FIXED: Variation is an alternative to the CURRENT move
          // Save current state to stack
          variationStack.push({
            nodeId: currentNodeId,
            game: new Chess(currentGame.fen()),
          });

          // Restore position BEFORE current move to create alternative
          const currentNode = moveTree.nodes[currentNodeId];
          if (currentNode && currentNode.parent) {
            const parentNode = moveTree.nodes[currentNode.parent];
            if (parentNode && parentNode.fen) {
              currentGame = new Chess(parentNode.fen);
            } else {
              // If parent has no FEN, restore through move history
              currentGame = new Chess();
              const history = this.getHistoryToNode(
                moveTree,
                currentNode.parent
              );
              for (const move of history) {
                currentGame.move(move);
              }
            }
            // Move to parent node to add alternative move
            currentNodeId = currentNode.parent;
          }
          break;
        }

        case "variation_end": {
          // Restore state from stack
          if (variationStack.length > 0) {
            const restored = variationStack.pop()!;
            currentNodeId = restored.nodeId;
            currentGame = restored.game;
          }
          break;
        }

        case "comment": {
          // IMPROVED: More reliable comment handling
          if (moveTree.nodes[currentNodeId]) {
            const existingComment = moveTree.nodes[currentNodeId].comment;
            if (existingComment) {
              // If comment already exists, add new one with space
              moveTree.nodes[currentNodeId].comment =
                existingComment + " " + token.value;
            } else {
              moveTree.nodes[currentNodeId].comment = token.value;
            }
          }
          break;
        }

        case "nag": {
          // NAG is supported only in comments
          if (moveTree.nodes[currentNodeId]) {
            const currentComment = moveTree.nodes[currentNodeId].comment || "";
            moveTree.nodes[currentNodeId].comment = (
              currentComment +
              " " +
              token.value
            ).trim();
          }
          break;
        }

        case "result":
          // Game result - can be ignored or saved
          break;
      }
    }

    return moveTree;
  }

  /**
   * Parses PGN string and creates move tree with variations
   */
  static parsePgnToMoveTree(pgn: string): {
    game: Chess;
    moveTree: MoveTree;
  } {
    try {
      // Tokenize PGN
      const tokens = this.tokenizePgn(pgn);

      // Create tree from tokens
      const moveTree = this.parseTokensToMoveTree(tokens);

      // Create game for main line
      const game = new Chess();
      try {
        game.loadPgn(pgn);
      } catch {
        // Error loading PGN in Chess.js, use empty game
      }

      return { game, moveTree };
    } catch (error) {
      console.error("PGN parsing error:", error);
      // Return empty game and tree in case of error
      return {
        game: new Chess(),
        moveTree: MoveTreeUtils.createEmptyTree(DEFAULT_POSITION),
      };
    }
  }

  /**
   * Simplified version for quickly creating game with branches
   */
  static createGameWithBranches(pgn: string): {
    game: Chess;
    moveTree: MoveTree;
  } {
    return this.parsePgnToMoveTree(pgn);
  }

  /**
   * Helper method to get move history to a node
   */
  private static getHistoryToNode(
    moveTree: MoveTree,
    nodeId: string
  ): string[] {
    const history: string[] = [];
    let currentId = nodeId;

    while (currentId !== "root") {
      const node = moveTree.nodes[currentId];
      if (node && node.move) {
        history.unshift(node.move.san);
      }
      if (node && node.parent) {
        currentId = node.parent;
      } else {
        break;
      }
    }

    return history;
  }

  /**
   * Extracts arrows from comment text
   */
  static extractArrowsFromComment(comment: string): Array<{
    from: string;
    to: string;
    color?: string;
  }> {
    if (!comment) return [];

    // Support both formats: [%draw arrow d5 c4 green] and [%draw arrow,d5,c4,green]
    const arrowRegex =
      /\[%draw\s+arrow[\s,]+([a-h][1-8])[\s,]+([a-h][1-8])(?:[\s,]+([^;\]]+))?\]/g;
    const arrows: Array<{ from: string; to: string; color?: string }> = [];
    let match;

    while ((match = arrowRegex.exec(comment)) !== null) {
      const [, from, to, color] = match;
      arrows.push({
        from,
        to,
        color: color?.trim() || "default",
      });
    }

    return arrows;
  }

  /**
   * Removes arrow annotations from comment text, leaving only text content
   */
  static removeArrowsFromComment(comment: string): string {
    if (!comment) return "";

    // Remove arrow annotations using the same regex as in extractArrowsFromComment
    const arrowRegex =
      /\[%draw\s+arrow[\s,]+([a-h][1-8])[\s,]+([a-h][1-8])(?:[\s,]+([^;\]]+))?\]/g;

    return comment.replace(arrowRegex, "").trim();
  }

  /**
   * Extracts clock time from comment text
   */
  static extractClockFromComment(comment: string): string | null {
    if (!comment) return null;

    // Match clock format like [%clk 0:09:57.6] or [%clk 1:30:45]
    const clockRegex = /\[%clk\s+(\d+:\d{2}:\d{2}(?:\.\d+)?)\]/;
    const match = comment.match(clockRegex);

    return match ? match[1] : null;
  }

  /**
   * Removes clock annotations and arrows from comment text, leaving only text content
   */
  static removeClockAndArrowsFromComment(comment: string): string {
    if (!comment) return "";

    // Remove both arrow and clock annotations
    const arrowRegex =
      /\[%draw\s+arrow[\s,]+([a-h][1-8])[\s,]+([a-h][1-8])(?:[\s,]+([^;\]]+))?\]/g;
    const clockRegex = /\[%clk\s+\d+:\d{2}:\d{2}(?:\.\d+)?\]/g;

    let result = comment.replace(arrowRegex, "").replace(clockRegex, "").trim();

    // Remove empty braces and normalize whitespace
    result = result
      .replace(/\{\s*\}/g, "") // Remove empty braces
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .trim();

    return result;
  }

  /**
   * NEW: Token analysis for debugging
   */
  static analyzeTokens(pgn: string): {
    tokens: PgnToken[];
    stats: {
      moves: number;
      variations: number;
      comments: number;
      nags: number;
      results: number;
    };
  } {
    const tokens = this.tokenizePgn(pgn);
    const stats = {
      moves: tokens.filter((t) => t.type === "move").length,
      variations: tokens.filter((t) => t.type === "variation_start").length,
      comments: tokens.filter((t) => t.type === "comment").length,
      nags: tokens.filter((t) => t.type === "nag").length,
      results: tokens.filter((t) => t.type === "result").length,
    };

    return { tokens, stats };
  }
}
