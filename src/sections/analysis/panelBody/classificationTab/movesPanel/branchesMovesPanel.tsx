import { useChessActionsWithBranches } from "@/hooks/useChessActionsWithBranches";
import { MoveTree, MoveTreeNode, MoveTreeUtils } from "@/types/moveTree";
import { Box, useTheme } from "@mui/material";
import { useMemo } from "react";
import { boardAtom } from "../../../states";

export default function BranchesMovesPanel() {
  const { goToNode, moveTree } = useChessActionsWithBranches(boardAtom);

  // Функция для перехода к конкретному ходу по nodeId
  const handleMoveClick = (nodeId: string) => {
    goToNode(nodeId);
  };

  // Получаем правильно сформированный PGN
  const correctPgn = useMemo(() => {
    if (!moveTree) return "";

    // Отладка структуры дерева
    console.log("=== DETAILED MoveTree Debug ===");
    console.log("Root ID:", moveTree.rootId);
    console.log("Main Line IDs:", moveTree.mainLineIds);

    // Детальная информация о каждом узле
    Object.entries(moveTree.nodes).forEach(([id, node]) => {
      console.log(`Node ${id}:`, {
        san: node.san,
        parent: node.parent,
        children: node.children,
        comment: node.comment,
        move: node.move ? { san: node.move.san, color: node.move.color } : null,
      });
    });

    // Проходим по главной линии
    console.log("=== Main Line Traversal ===");
    moveTree.mainLineIds.forEach((nodeId, index) => {
      const node = moveTree.nodes[nodeId];
      console.log(
        `${index}: ${nodeId} -> san: "${node.san}", move: ${node.move?.san || "null"}`
      );
    });

    const pgn = MoveTreeUtils.toPgn(moveTree);

    // Временная отладка для нового алгоритма
    console.log("NEW PGN algorithm result:", JSON.stringify(pgn));

    return pgn;
  }, [moveTree]);

  return (
    <Box
      sx={{
        width: "100%",
        minWidth: 0, // Позволяет контейнеру сжиматься
        padding: 1,
        overflowY: "auto",
        maxHeight: "40vh",
        fontSize: "0.9rem",
        lineHeight: 1.4,
      }}
      id="moves-panel"
    >
      {/* Правильное отображение PGN с ветками */}
      <Box
        sx={{
          fontSize: "0.95rem",
          fontFamily: "monospace",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <PgnDisplay
          pgn={correctPgn}
          moveTree={moveTree}
          onMoveClick={handleMoveClick}
          currentNodeId={moveTree?.currentNodeId || ""}
        />
      </Box>
    </Box>
  );
}

// Новый компонент для отображения PGN с кликабельными ходами
interface PgnDisplayProps {
  pgn: string;
  moveTree: MoveTree;
  onMoveClick: (nodeId: string) => void;
  currentNodeId: string;
}

function PgnDisplay({
  pgn,
  moveTree,
  onMoveClick,
  currentNodeId,
}: PgnDisplayProps) {
  const theme = useTheme();

  // Определяем цвета в зависимости от темы (мемоизируем)
  const colors = useMemo(
    () => ({
      moveColor: theme.palette.mode === "dark" ? "#64b5f6" : "#1976d2",
      hoverColor:
        theme.palette.mode === "dark"
          ? "rgba(100, 181, 246, 0.1)"
          : "rgba(25, 118, 210, 0.1)",
    }),
    [theme.palette.mode]
  );

  // Разбираем PGN и создаем кликабельные элементы с форматированием
  const renderPgn = useMemo(() => {
    if (!pgn) return null;

    // Создаем более точную карту сопоставления с учетом порядка
    const moveElements: Array<{
      token: string;
      nodeId?: string;
      isMove: boolean;
      index: number | string;
      isVariationStart?: boolean;
      isVariationEnd?: boolean;
      isComment?: boolean;
      needsNewLine?: boolean;
      indentLevel?: number;
    }> = [];

    // Токенизируем PGN с сохранением пробелов в комментариях
    function tokenizePgn(pgnText: string): string[] {
      const tokens: string[] = [];
      let i = 0;
      const cleanPgn = pgnText.replace(/\[.*?\]\s*/g, "").trim();

      while (i < cleanPgn.length) {
        const char = cleanPgn[i];

        if (char === "(") {
          tokens.push("(");
          i++;
        } else if (char === ")") {
          tokens.push(")");
          i++;
        } else if (char === "{") {
          // Комментарий - сохраняем с фигурными скобками и пробелами
          let comment = "{";
          i++; // пропускаем {
          while (i < cleanPgn.length && cleanPgn[i] !== "}") {
            comment += cleanPgn[i];
            i++;
          }
          comment += "}"; // добавляем закрывающую скобку
          i++; // пропускаем }
          tokens.push(comment);
        } else if (char === "$") {
          // NAG
          let nag = "$";
          i++;
          while (i < cleanPgn.length && /\d/.test(cleanPgn[i])) {
            nag += cleanPgn[i];
            i++;
          }
          tokens.push(nag);
        } else if (/\s/.test(char)) {
          // Пропускаем пробелы между токенами
          i++;
        } else {
          // Ход, номер хода или результат
          let token = "";
          while (i < cleanPgn.length && !/[\s(){}]/.test(cleanPgn[i])) {
            token += cleanPgn[i];
            i++;
          }
          if (token) {
            tokens.push(token);
          }
        }
      }

      return tokens;
    }

    const tokens = tokenizePgn(pgn);

    // Создаем список всех ходов в главной линии в правильном порядке
    const mainLineMoves: Array<{ san: string; nodeId: string }> = [];

    // Проверяем, что moveTree существует и имеет нужные свойства
    if (moveTree && moveTree.nodes && moveTree.rootId) {
      let currentId: string | null = moveTree.rootId;

      while (currentId) {
        const node: MoveTreeNode | null = moveTree.nodes[currentId] || null;
        if (!node) break;

        if (node.move) {
          mainLineMoves.push({
            san: node.move.san,
            nodeId: currentId,
          });
        }

        // Переходим к первому ребенку (главная линия)
        currentId = node.children[0] || null;
      }
    }

    // Индекс для отслеживания текущего хода в главной линии
    let mainLineMoveIndex = 0;
    let variationDepth = 0;
    let afterVariation = false;

    tokens.forEach((token, index) => {
      // Убираем завершающий символ
      if (token === "*") {
        moveElements.push({
          token,
          isMove: false,
          index,
          needsNewLine: false,
          indentLevel: 0,
        });
        return;
      }

      // Скобки вариаций
      if (token === "(") {
        variationDepth++;
        moveElements.push({
          token,
          isMove: false,
          index,
          isVariationStart: true,
          needsNewLine: true,
          indentLevel: variationDepth,
        });
        return;
      }

      if (token === ")") {
        moveElements.push({
          token,
          isMove: false,
          index,
          isVariationEnd: true,
          needsNewLine: false,
          indentLevel: variationDepth,
        });
        variationDepth--;
        afterVariation = true;
        return;
      }

      // Номера ходов
      if (/^\d+\.+$/.test(token)) {
        const needsNewLine = afterVariation && variationDepth === 0;
        moveElements.push({
          token,
          isMove: false,
          index,
          needsNewLine,
          indentLevel: variationDepth,
        });
        afterVariation = false;
        return;
      }

      // Комментарии в фигурных скобках
      if (token.startsWith("{") && token.endsWith("}")) {
        moveElements.push({
          token,
          isMove: false,
          index,
          isComment: true,
          needsNewLine: false, // Изменено с true на false для inline отображения
          indentLevel: variationDepth,
        });
        return;
      }

      // Проверяем, является ли токен ходом из главной линии
      // Сначала извлекаем номер хода, если есть
      const moveNumberMatch = token.match(/^(\d+)(\.\.\.|\.)(.*)$/);
      let displayToken = token;
      let moveNumber = null;

      if (moveNumberMatch) {
        moveNumber = moveNumberMatch[1] + moveNumberMatch[2]; // "1." или "1..."
        displayToken = moveNumberMatch[3] || moveNumber; // ход или номер если нет хода
      }

      // Если есть номер хода, добавляем его как отдельный элемент
      if (moveNumber && moveNumberMatch && moveNumberMatch[3]) {
        const needsNewLine = afterVariation && variationDepth === 0;
        moveElements.push({
          token: moveNumber,
          isMove: false,
          index: index + "_num",
          needsNewLine,
          indentLevel: variationDepth,
        });
        afterVariation = false;
      }

      const cleanToken = displayToken.replace(/^\d+(\.\.\.|\.)/, "");
      if (
        (cleanToken || displayToken) &&
        mainLineMoveIndex < mainLineMoves.length &&
        mainLineMoves[mainLineMoveIndex].san === (cleanToken || displayToken)
      ) {
        moveElements.push({
          token: cleanToken || displayToken,
          nodeId: mainLineMoves[mainLineMoveIndex].nodeId,
          isMove: true,
          index,
          needsNewLine: false,
          indentLevel: variationDepth,
        });
        mainLineMoveIndex++;
        return;
      }

      // Если это не ход из главной линии, ищем в вариантах
      const nodeId = findNodeBySan(cleanToken || displayToken, moveTree);
      if (nodeId) {
        moveElements.push({
          token: cleanToken || displayToken,
          nodeId,
          isMove: true,
          index,
          needsNewLine: false,
          indentLevel: variationDepth,
        });
      } else {
        moveElements.push({
          token: displayToken,
          isMove: false,
          index,
          needsNewLine: false,
          indentLevel: variationDepth,
        });
      }
    });

    // Рендерим элементы с учетом переносов строк и отступов
    const result: React.JSX.Element[] = [];
    let currentLine: React.JSX.Element[] = [];
    let lineIndex = 0;

    const flushLine = () => {
      if (currentLine.length > 0) {
        result.push(
          <div key={`line-${lineIndex++}`} style={{ marginBottom: "4px" }}>
            {currentLine}
          </div>
        );
        currentLine = [];
      }
    };

    moveElements.forEach(
      ({ token, nodeId, isMove, index, needsNewLine, indentLevel }) => {
        // Добавляем перенос строки если нужно
        if (needsNewLine && currentLine.length > 0) {
          flushLine();
        }

        // Добавляем отступы для вариаций
        const indentStyle = {
          marginLeft: `${(indentLevel || 0) * 20}px`,
        };

        if (!isMove) {
          // Не ход - отображаем как обычный текст
          if (token === "*") {
            currentLine.push(
              <span key={index} style={{ color: "#666", ...indentStyle }}>
                {token}
              </span>
            );
            return;
          }

          if (/^\d+\.+$/.test(token)) {
            currentLine.push(
              <span
                key={index}
                style={{ color: "#666", marginRight: "4px", ...indentStyle }}
              >
                {token}
              </span>
            );
            return;
          }

          if (token === "(") {
            // Начало вариации - перенос строки и отступ
            flushLine();
            currentLine.push(
              <span
                key={index}
                style={{ color: "#999", margin: "0 2px", ...indentStyle }}
              >
                {token}
              </span>
            );
            return;
          }

          if (token === ")") {
            currentLine.push(
              <span key={index} style={{ color: "#999", margin: "0 2px" }}>
                {token}
              </span>
            );
            // После закрытия вариации переносим строку
            flushLine();
            return;
          }

          // Комментарии
          if (token.startsWith("{") && token.endsWith("}")) {
            // Комментарии inline с отступом
            currentLine.push(
              <span
                key={index}
                style={{
                  color: "#666",
                  fontStyle: "italic",
                  margin: "0 4px",
                  fontSize: "0.9em",
                  ...indentStyle,
                }}
              >
                {token}
              </span>
            );
            return;
          }

          currentLine.push(
            <span key={index} style={{ margin: "0 1px", ...indentStyle }}>
              {token}
            </span>
          );
          return;
        }

        // Это ход - делаем кликабельным
        if (nodeId) {
          const isCurrentMove = nodeId === currentNodeId;
          currentLine.push(
            <span
              key={index}
              onClick={() => onMoveClick(nodeId)}
              style={{
                cursor: "pointer",
                padding: "3px 6px",
                borderRadius: "4px",
                backgroundColor: isCurrentMove ? "#1976d2" : "transparent",
                color: isCurrentMove ? "white" : colors.moveColor,
                fontWeight: isCurrentMove ? 600 : 400,
                margin: "1px 2px",
                transition: "all 0.15s ease",
                textDecoration: "none",
                display: "inline-block",
                whiteSpace: "nowrap",
                ...indentStyle,
              }}
              onMouseEnter={(e) => {
                if (!isCurrentMove) {
                  e.currentTarget.style.backgroundColor = colors.hoverColor;
                  e.currentTarget.style.textDecoration = "underline";
                }
              }}
              onMouseLeave={(e) => {
                if (!isCurrentMove) {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.textDecoration = "none";
                }
              }}
            >
              {token}
            </span>
          );
          return;
        }

        // Ход без nodeId - отображаем как обычный текст
        currentLine.push(
          <span key={index} style={{ margin: "0 1px", ...indentStyle }}>
            {token}
          </span>
        );
      }
    );

    // Добавляем последнюю строку
    flushLine();

    return result;
  }, [pgn, moveTree, onMoveClick, colors, currentNodeId]);

  return (
    <Box
      sx={{
        lineHeight: 1.8,
        wordSpacing: "2px",
        padding: 1,
        display: "block", // Изменено с flex на block для многострочного отображения
        alignItems: "flex-start",
        wordBreak: "break-word",
        whiteSpace: "normal",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {renderPgn}
    </Box>
  );
}

// Вспомогательная функция для поиска узла по SAN
function findNodeBySan(san: string, moveTree: MoveTree): string | null {
  // Проверяем, что moveTree и moveTree.nodes существуют
  if (!moveTree || !moveTree.nodes) {
    return null;
  }

  for (const [nodeId, node] of Object.entries(moveTree.nodes)) {
    if (node && node.move && node.move.san === san) {
      return nodeId;
    }
  }
  return null;
}
