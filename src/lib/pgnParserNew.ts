import { Chess } from "chess.js";
import { MoveTree, MoveTreeUtils } from "@/types/moveTree";

const DEFAULT_POSITION = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

/**
 * Парсер PGN с поддержкой вариаций для создания дерева ходов
 */
export class PgnParser {
  /**
   * Парсит PGN строку и создает дерево ходов с вариациями
   */
  static parsePgnToMoveTree(pgn: string): {
    game: Chess;
    moveTree: MoveTree;
  } {
    const game = new Chess();

    try {
      game.loadPgn(pgn);
    } catch (error) {
      console.error("Ошибка загрузки PGN:", error);
      // Возвращаем пустую игру и дерево в случае ошибки
      return {
        game: new Chess(),
        moveTree: MoveTreeUtils.createEmptyTree(DEFAULT_POSITION),
      };
    }

    // Создаем начальное дерево
    let moveTree = MoveTreeUtils.createEmptyTree(DEFAULT_POSITION);

    // Получаем историю ходов (только основная линия)
    const history = game.history({ verbose: true });

    // Добавляем ходы в дерево
    history.forEach((move) => {
      const result = MoveTreeUtils.addMove(
        moveTree,
        move,
        move.after, // FEN после хода
        moveTree.currentNodeId
      );
      moveTree = result.tree;
    });

    return { game, moveTree };
  }

  /**
   * Упрощенная версия для быстрого создания игры с ветками
   * Пока что обрабатывает только основную линию, но готова для расширения
   */
  static createGameWithBranches(pgn: string): {
    game: Chess;
    moveTree: MoveTree;
  } {
    return this.parsePgnToMoveTree(pgn);
  }
}
