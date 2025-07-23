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
        // Очищаем комментарий от специальных символов и лишних пробелов
        const cleanComment = comment
          .replace(/\[%draw\s+arrow[^\]]*\]/g, "") // убираем стрелки
          .replace(/\s+/g, " ") // заменяем множественные пробелы на одинарные
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
          } else if (/^\d+(\.\.\.|\.)$/.test(token)) {
            // Это номер хода - сохраняем как отдельный токен
            tokens.push({ type: "move", value: token });
          } else {
            // Убираем номера ходов если они в начале токена (например, "1.e4" -> "e4")
            const cleanToken = token.replace(/^\d+(\.\.\.|\.)/, "");
            if (cleanToken) {
              tokens.push({ type: "move", value: cleanToken });
            } else if (token.match(/^\d+(\.\.\.|\.)$/)) {
              // Если остался только номер хода, сохраняем его
              tokens.push({ type: "move", value: token });
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
          } catch {
            // Ошибка при попытке сделать ход - пропускаем
          }
          break;

        case "variation_start": {
          // ИСПРАВЛЕНО: Вариация - это альтернатива к ТЕКУЩЕМУ ходу
          // Сохраняем текущее состояние в стек
          variationStack.push({
            nodeId: currentNodeId,
            game: new Chess(currentGame.fen()),
          });

          // Восстанавливаем позицию ДО текущего хода для создания альтернативы
          const currentNode = moveTree.nodes[currentNodeId];
          if (currentNode && currentNode.parent) {
            const parentNode = moveTree.nodes[currentNode.parent];
            if (parentNode && parentNode.fen) {
              currentGame = new Chess(parentNode.fen);
            } else {
              // Если нет FEN у родителя, восстанавливаем через историю ходов
              currentGame = new Chess();
              const history = this.getHistoryToNode(
                moveTree,
                currentNode.parent
              );
              for (const move of history) {
                currentGame.move(move);
              }
            }
            // Переходим к родительскому узлу для добавления альтернативного хода
            currentNodeId = currentNode.parent;
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
          // УЛУЧШЕНО: Более надежная обработка комментариев
          if (moveTree.nodes[currentNodeId]) {
            const existingComment = moveTree.nodes[currentNodeId].comment;
            if (existingComment) {
              // Если уже есть комментарий, добавляем новый через пробел
              moveTree.nodes[currentNodeId].comment =
                existingComment + " " + token.value;
            } else {
              moveTree.nodes[currentNodeId].comment = token.value;
            }
          }
          break;
        }

        case "nag": {
          // NAG поддерживается только в комментариях
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
      // Токенизируем PGN
      const tokens = this.tokenizePgn(pgn);

      // Создаем дерево из токенов
      const moveTree = this.parseTokensToMoveTree(tokens);

      // Создаем игру для основной линии
      const game = new Chess();
      try {
        game.loadPgn(pgn);
      } catch {
        // Ошибка загрузки PGN в Chess.js, используем пустую игру
      }

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

  /**
   * Вспомогательный метод для получения истории ходов до узла
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
   * НОВОЕ: Анализ токенов для отладки
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
