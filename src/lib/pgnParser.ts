import { Chess } from "chess.js";
import { MoveTree, MoveTreeUtils } from "@/types/moveTree";

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
 * Парсер PGN с поддержкой вариаций для создания дерева ходов
 */
export class PgnParser {
  /**
   * Токенизирует PGN строку
   */
  private static tokenizePgn(pgn: string): PgnToken[] {
    const tokens: PgnToken[] = [];
    let i = 0;

    // Удаляем заголовки PGN
    const moveText = pgn.replace(/\[.*?\]\s*/g, "").trim();

    while (i < moveText.length) {
      const char = moveText[i];

      if (char === "(") {
        tokens.push({ type: "variation_start", value: "(" });
        i++;
      } else if (char === ")") {
        tokens.push({ type: "variation_end", value: ")" });
        i++;
      } else if (char === "{") {
        // Комментарий
        let comment = "";
        i++; // пропускаем {
        while (i < moveText.length && moveText[i] !== "}") {
          comment += moveText[i];
          i++;
        }
        i++; // пропускаем }
        tokens.push({ type: "comment", value: comment.trim() });
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
        // Пропускаем пробелы
        i++;
      } else {
        // Ход или результат
        let token = "";
        while (i < moveText.length && !/[\s(){}]/.test(moveText[i])) {
          token += moveText[i];
          i++;
        }

        if (token) {
          // Проверяем, является ли это результатом партии
          if (["1-0", "0-1", "1/2-1/2", "*"].includes(token)) {
            tokens.push({ type: "result", value: token });
          } else {
            // Удаляем номера ходов (например, "1.", "23...")
            const cleanToken = token.replace(/^\d+\.+/, "");
            if (cleanToken) {
              tokens.push({ type: "move", value: cleanToken });
            }
          }
        }
      }
    }

    return tokens;
  }

  /**
   * Парсит токены в дерево ходов
   */
  private static parseTokensToMoveTree(tokens: PgnToken[]): MoveTree {
    let moveTree = MoveTreeUtils.createEmptyTree(DEFAULT_POSITION);
    let currentGame = new Chess();
    let currentNodeId = "root";

    // Стек для обработки вариаций
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
          } catch (error) {
            console.warn(`Невозможно сделать ход: ${token.value}`, error);
          }
          break;

        case "variation_start": {
          // Сохраняем текущее состояние в стек
          variationStack.push({
            nodeId: currentNodeId,
            game: new Chess(currentGame.fen()),
          });

          // Возвращаемся к предыдущему ходу для создания вариации
          const parentNode = moveTree.nodes[currentNodeId];
          if (parentNode && parentNode.parent) {
            currentNodeId = parentNode.parent;
            // Простое восстановление - откатываем один ход
            try {
              currentGame.undo();
            } catch (error) {
              console.warn("Ошибка при откате хода для вариации:", error);
              // Если не можем откатить, восстанавливаем позицию через FEN
              const parentNodeData = moveTree.nodes[currentNodeId];
              if (parentNodeData && parentNodeData.fen) {
                currentGame = new Chess(parentNodeData.fen);
              }
            }
          }
          break;
        }

        case "variation_end": {
          // Восстанавливаем состояние из стека
          if (variationStack.length > 0) {
            const restored = variationStack.pop()!;
            currentNodeId = restored.nodeId;
            currentGame = restored.game;
          }
          break;
        }

        case "comment": {
          // Добавляем комментарий к текущему узлу
          if (moveTree.nodes[currentNodeId]) {
            moveTree.nodes[currentNodeId].comment = token.value;
          }
          break;
        }

        case "nag": {
          // NAG поддерживается только в комментариях
          if (moveTree.nodes[currentNodeId]) {
            const currentComment = moveTree.nodes[currentNodeId].comment || "";
            moveTree.nodes[currentNodeId].comment =
              currentComment + " " + token.value;
          }
          break;
        }

        case "result":
          // Результат партии - можно игнорировать или сохранить
          break;
      }
    }

    return moveTree;
  }

  /**
   * Парсит PGN строку и создает дерево ходов с вариациями
   */
  static parsePgnToMoveTree(pgn: string): {
    game: Chess;
    moveTree: MoveTree;
  } {
    try {
      console.log("Парсинг PGN:", pgn.substring(0, 200) + "...");

      // Токенизируем PGN
      const tokens = this.tokenizePgn(pgn);
      console.log("Токены:", tokens);

      // Создаем дерево из токенов
      const moveTree = this.parseTokensToMoveTree(tokens);

      // Создаем игру для основной линии
      const game = new Chess();
      try {
        game.loadPgn(pgn);
      } catch (error) {
        console.warn(
          "Ошибка загрузки PGN в Chess.js, используем пустую игру:",
          error
        );
      }

      console.log(
        "Создано дерево с узлами:",
        Object.keys(moveTree.nodes).length
      );

      return { game, moveTree };
    } catch (error) {
      console.error("Ошибка парсинга PGN:", error);
      // Возвращаем пустую игру и дерево в случае ошибки
      return {
        game: new Chess(),
        moveTree: MoveTreeUtils.createEmptyTree(DEFAULT_POSITION),
      };
    }
  }

  /**
   * Упрощенная версия для быстрого создания игры с ветками
   */
  static createGameWithBranches(pgn: string): {
    game: Chess;
    moveTree: MoveTree;
  } {
    return this.parsePgnToMoveTree(pgn);
  }
}
