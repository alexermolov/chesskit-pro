import { MoveTree } from "@/types/moveTree";
import { DisplayElement } from "./types";

export class MovesDisplayUtils {
  // Функция для подсчета номера хода на основе пути от корня
  static getMoveNumber(moveTree: MoveTree, nodeId: string): number {
    let currentId = nodeId;
    let moveCount = 0;

    while (currentId && currentId !== moveTree.rootId) {
      const node = moveTree.nodes[currentId];
      if (node && node.move) {
        moveCount++;
      }
      currentId = node?.parent || "";
    }

    return Math.ceil(moveCount / 2);
  }

  // Функция для определения цвета хода
  static isWhiteMove(moveTree: MoveTree, nodeId: string): boolean {
    let currentId = nodeId;
    let moveCount = 0;

    while (currentId && currentId !== moveTree.rootId) {
      const node = moveTree.nodes[currentId];
      if (node && node.move) {
        moveCount++;
      }
      currentId = node?.parent || "";
    }

    return moveCount % 2 === 1;
  }

  // Генерация элементов отображения на основе дерева ходов
  static createDisplayElements(moveTree: MoveTree): DisplayElement[] {
    if (!moveTree || !moveTree.nodes || !moveTree.rootId) {
      return [];
    }

    const elements: DisplayElement[] = [];
    let elementId = 0;

    // Функция для генерации уникального ID элемента
    const generateElementId = () => {
      return `el_${elementId++}`;
    };

    // Рекурсивная функция для обработки узла и его детей
    const processNode = (
      nodeId: string,
      skipMove: boolean = false,
      isFirstInVariation: boolean = false,
      insideVariation: boolean = false,
      indentLevel: number = 0
    ): void => {
      const node = moveTree.nodes[nodeId];
      if (!node) return;

      // Добавляем ход (кроме корня и если не пропускаем)
      if (node.move && !skipMove) {
        const moveNumber = this.getMoveNumber(moveTree, nodeId);
        const isWhite = this.isWhiteMove(moveTree, nodeId);

        // Для первого хода вариации:
        // - если белый, то N.ход
        // - если черный, то N...ход
        if (isFirstInVariation) {
          if (isWhite) {
            // Добавляем номер хода
            elements.push({
              id: generateElementId(),
              type: "moveNumber",
              text: `${moveNumber}.`,
              indentLevel,
              needsNewLine: false,
            });

            // Добавляем ход
            elements.push({
              id: generateElementId(),
              type: "move",
              text: node.san,
              nodeId,
              indentLevel,
              needsNewLine: false,
            });
          } else {
            // Добавляем номер хода с многоточием
            elements.push({
              id: generateElementId(),
              type: "moveNumber",
              text: `${moveNumber}...`,
              indentLevel,
              needsNewLine: false,
            });

            // Добавляем ход
            elements.push({
              id: generateElementId(),
              type: "move",
              text: node.san,
              nodeId,
              indentLevel,
              needsNewLine: false,
            });
          }
        } else {
          // Внутри вариации и основной линии:
          // - белые ходы всегда с номером
          // - черные ходы всегда без номера
          if (isWhite) {
            // Добавляем номер хода
            elements.push({
              id: generateElementId(),
              type: "moveNumber",
              text: `${moveNumber}.`,
              indentLevel,
              needsNewLine: false,
            });

            // Добавляем ход
            elements.push({
              id: generateElementId(),
              type: "move",
              text: node.san,
              nodeId,
              indentLevel,
              needsNewLine: false,
            });
          } else {
            // Добавляем только ход без номера
            elements.push({
              id: generateElementId(),
              type: "move",
              text: node.san,
              nodeId,
              indentLevel,
              needsNewLine: false,
            });
          }
        }

        // Добавляем комментарий если есть
        if (node.comment) {
          elements.push({
            id: generateElementId(),
            type: "comment",
            text: node.comment,
            nodeId,
            indentLevel,
            needsNewLine: false,
          });
        }
      }

      // Если нет детей - конец ветки
      if (node.children.length === 0) {
        return;
      }

      // Если один ребенок - просто продолжаем
      if (node.children.length === 1) {
        processNode(
          node.children[0],
          false,
          false,
          insideVariation,
          indentLevel
        );
        return;
      }

      // Если несколько детей - есть вариации
      // Определяем главного ребенка
      let mainChild: string | null = null;
      const variations: string[] = [];

      const currentMainIndex = moveTree.mainLineIds.indexOf(nodeId);
      if (
        currentMainIndex !== -1 &&
        currentMainIndex + 1 < moveTree.mainLineIds.length
      ) {
        const nextMainLineId = moveTree.mainLineIds[currentMainIndex + 1];
        if (node.children.includes(nextMainLineId)) {
          mainChild = nextMainLineId;
          variations.push(
            ...node.children.filter((childId) => childId !== nextMainLineId)
          );
        }
      }

      // Если не нашли в основной линии, берем первого ребенка как основного
      if (!mainChild) {
        mainChild = node.children[0];
        variations.push(...node.children.slice(1));
      }

      // 1. Сначала добавляем ход основной линии
      const mainChildNode = moveTree.nodes[mainChild];
      if (mainChildNode && mainChildNode.move) {
        const moveNumber = this.getMoveNumber(moveTree, mainChild);
        const isWhite = this.isWhiteMove(moveTree, mainChild);

        // Основная линия - номер только для белых
        if (isWhite) {
          // Добавляем номер хода
          elements.push({
            id: generateElementId(),
            type: "moveNumber",
            text: `${moveNumber}.`,
            indentLevel,
            needsNewLine: false,
          });

          // Добавляем ход
          elements.push({
            id: generateElementId(),
            type: "move",
            text: mainChildNode.san,
            nodeId: mainChild,
            indentLevel,
            needsNewLine: false,
          });
        } else {
          // Черные ходы в основной линии всегда без номера
          elements.push({
            id: generateElementId(),
            type: "move",
            text: mainChildNode.san,
            nodeId: mainChild,
            indentLevel,
            needsNewLine: false,
          });
        }

        // Добавляем комментарий если есть
        if (mainChildNode.comment) {
          elements.push({
            id: generateElementId(),
            type: "comment",
            text: mainChildNode.comment,
            nodeId: mainChild,
            indentLevel,
            needsNewLine: false,
          });
        }
      }

      // 2. Сразу обрабатываем все вариации
      for (const variationId of variations) {
        // Начало вариации
        elements.push({
          id: generateElementId(),
          type: "variationStart",
          text: "(",
          indentLevel: indentLevel + 1,
          needsNewLine: true, // Новая строка для начала вариации
        });

        // Обрабатываем вариацию
        processNode(variationId, false, true, true, indentLevel + 1);

        // Конец вариации
        elements.push({
          id: generateElementId(),
          type: "variationEnd",
          text: ")",
          indentLevel: indentLevel + 1,
          needsNewLine: false,
          forceLineBreakAfter: true, // Добавляем перенос строки ПОСЛЕ закрывающей скобки
        });
      }

      // 3. Потом продолжаем с детей основной линии (пропуская сам ход, так как уже добавили)
      if (mainChildNode) {
        processNode(mainChild, true, false, false, indentLevel);
      }
    };

    // Начинаем с корня
    processNode(moveTree.rootId, false, false, false, 0);

    // Добавляем символ окончания
    elements.push({
      id: `el_${elementId++}`,
      type: "result",
      text: "*",
      indentLevel: 0,
      needsNewLine: false,
    });

    return elements;
  }
}
