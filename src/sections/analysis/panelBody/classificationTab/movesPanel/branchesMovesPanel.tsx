import { useChessActionsWithBranches } from "@/hooks/useChessActionsWithBranches";
import { PgnParser } from "@/lib/pgnParser";
import { MoveTree, MoveTreeNode, MoveTreeUtils } from "@/types/moveTree";
import { Icon } from "@iconify/react";
import { Box, IconButton, TextField, useTheme } from "@mui/material";
import { useCallback, useMemo, useState } from "react";
import { boardAtom } from "../../../states";

export default function BranchesMovesPanel() {
  const { goToNode, moveTree, updateNodeComment } =
    useChessActionsWithBranches(boardAtom);

  // Функция для перехода к конкретному ходу по nodeId
  const handleMoveClick = (nodeId: string) => {
    goToNode(nodeId);
  };

  // Функция для обновления комментария
  const handleCommentUpdate = useCallback(
    (nodeId: string, comment: string | null) => {
      updateNodeComment(nodeId, comment);
    },
    [updateNodeComment]
  );

  // Получаем правильно сформированный PGN
  const correctPgn = useMemo(() => {
    if (!moveTree) return "";

    const pgn = MoveTreeUtils.toPgn(moveTree);

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
          onCommentUpdate={handleCommentUpdate}
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
  onCommentUpdate: (nodeId: string, comment: string | null) => void;
  currentNodeId: string;
}

function PgnDisplay({
  pgn,
  moveTree,
  onMoveClick,
  onCommentUpdate,
  currentNodeId,
}: PgnDisplayProps) {
  const theme = useTheme();
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<string>("");

  // Добавляем функции для работы с комментариями
  const handleStartEditComment = useCallback(
    (nodeId: string, currentComment: string) => {
      setEditingComment(nodeId);
      // Показываем только текстовую часть, убираем стрелки и часы для редактирования
      const textOnly =
        PgnParser.removeClockAndArrowsFromComment(currentComment);
      setCommentText(textOnly);
    },
    []
  );

  const handleSaveComment = useCallback(
    (nodeId: string) => {
      const trimmedComment = commentText.trim();

      // Получаем текущий комментарий узла
      const currentNode = moveTree.nodes[nodeId];
      const currentComment = currentNode?.comment || "";

      // Извлекаем существующие стрелки и часы
      const existingArrows = PgnParser.extractArrowsFromComment(currentComment);
      const existingClock = PgnParser.extractClockFromComment(currentComment);

      // Комбинируем новый текст с существующими аннотациями
      let finalComment = trimmedComment;

      // Добавляем стрелки
      existingArrows.forEach((arrow) => {
        finalComment += ` [%draw arrow,${arrow.from},${arrow.to}${
          arrow.color ? `,${arrow.color}` : ""
        }]`;
      });

      // Добавляем часы
      if (existingClock) {
        finalComment += ` [%clk ${existingClock}]`;
      }

      onCommentUpdate(nodeId, finalComment.trim() || null);
      setEditingComment(null);
      setCommentText("");
    },
    [commentText, onCommentUpdate, moveTree]
  );

  const handleCancelEdit = useCallback(() => {
    setEditingComment(null);
    setCommentText("");
  }, []);

  // Function to format comment with arrows
  const formatCommentWithArrows = useCallback((commentText: string) => {
    console.log(commentText);

    const arrows = PgnParser.extractArrowsFromComment(commentText);

    if (arrows.length === 0) {
      // Even if no arrows, still remove clock annotations and empty braces
      return PgnParser.removeClockAndArrowsFromComment(commentText);
    }

    let formattedText = commentText;

    // Use the original regex from PgnParser to find and replace arrows
    const arrowRegex =
      /\[%draw\s+arrow[\s,]+([a-h][1-8])[\s,]+([a-h][1-8])(?:[\s,]+([^;\]]+))?\]/g;

    formattedText = formattedText.replace(arrowRegex, (_, from, to, color) => {
      let colorIcon = "";
      const normalizedColor = color?.toLowerCase()?.trim() || "default";

      switch (normalizedColor) {
        case "red":
        case "r":
          colorIcon = "🔴";
          break;
        case "green":
        case "g":
          colorIcon = "🟢";
          break;
        case "blue":
        case "b":
          colorIcon = "🔵";
          break;
        case "yellow":
        case "y":
          colorIcon = "🟡";
          break;
        case "orange":
        case "o":
          colorIcon = "🟠";
          break;
        default:
          colorIcon = "➤";
          break;
      }

      return `${colorIcon} ${from}→${to}`;
    });

    // Use the PgnParser function to properly remove clock annotations and empty braces
    formattedText = PgnParser.removeClockAndArrowsFromComment(formattedText);

    return formattedText;
  }, []);

  // Функция для поиска nodeId последнего хода перед комментарием
  const findNodeIdForComment = useCallback(
    (commentIndex: number, tokens: string[]): string | null => {
      // Ищем последний ход перед комментарием
      for (let i = commentIndex - 1; i >= 0; i--) {
        const token = tokens[i];
        if (
          !token.startsWith("{") &&
          !token.endsWith("}") &&
          !/^\d+\.+$/.test(token) &&
          token !== "(" &&
          token !== ")"
        ) {
          const cleanToken = token.replace(/^\d+(\.\.\.|\.)/, "");
          const nodeId = findNodeBySan(cleanToken, moveTree);
          if (nodeId) {
            return nodeId;
          }
        }
      }
      return null;
    },
    [moveTree]
  );

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
      // Remove only PGN headers with quotes, not arrows
      const cleanPgn = pgnText
        .replace(/^\s*\[[^\]]*"[^"]*"\]\s*$/gm, "")
        .trim();

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

          // Проверяем содержимое комментария
          const commentContent = comment.slice(1, -1); // убираем фигурные скобки
          const hasArrows =
            PgnParser.extractArrowsFromComment(commentContent).length > 0;
          const cleanedContent =
            PgnParser.removeClockAndArrowsFromComment(commentContent);

          // Добавляем токен если есть реальное содержимое ИЛИ стрелки
          if (cleanedContent.trim().length > 0 || hasArrows) {
            tokens.push(comment);
          }
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
        // Находим nodeId последнего хода перед комментарием
        const commentNodeId = findNodeIdForComment(index, tokens);
        moveElements.push({
          token,
          nodeId: commentNodeId || undefined,
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
        moveNumber = (moveNumberMatch[1] + moveNumberMatch[2]) as any; // "1." или "1..."
        displayToken = (moveNumberMatch[3] || moveNumber) as any; // ход или номер если нет хода
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
          <div key={`line-${lineIndex++}`} style={{ marginBottom: "2px" }}>
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
          marginLeft: `${(indentLevel || 0) * 12}px`,
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
                style={{
                  color: theme.palette.mode === "dark" ? "#888" : "#333",
                  marginRight: "3px",
                  fontWeight: 600,
                  fontSize: "0.95em",
                  ...indentStyle,
                }}
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
                style={{ color: "#999", margin: "0 1px", ...indentStyle }}
              >
                {token}
              </span>
            );
            return;
          }

          if (token === ")") {
            currentLine.push(
              <span key={index} style={{ color: "#999", margin: "0 1px" }}>
                {token}
              </span>
            );
            // После закрытия вариации переносим строку
            flushLine();
            return;
          }

          // Комментарии
          if (token.startsWith("{") && token.endsWith("}")) {
            const originalCommentText = token.slice(1, -1).trim(); // убираем фигурные скобки
            const commentNodeId = nodeId; // nodeId найден в предыдущей обработке

            if (commentNodeId && editingComment === commentNodeId) {
              // Режим редактирования
              currentLine.push(
                <Box
                  key={index}
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 1,
                    margin: "0 2px",
                    ...indentStyle,
                  }}
                >
                  <TextField
                    size="small"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      // Останавливаем всплытие событий для всех клавиш
                      e.stopPropagation();

                      if (e.key === "Enter" && e.ctrlKey) {
                        handleSaveComment(commentNodeId);
                      } else if (e.key === "Escape") {
                        handleCancelEdit();
                      }
                    }}
                    onKeyUp={(e) => {
                      // Также останавливаем всплытие для keyUp
                      e.stopPropagation();
                    }}
                    sx={{
                      "& .MuiInputBase-root": {
                        fontSize: "0.9em",
                        backgroundColor:
                          theme.palette.mode === "dark" ? "#2e2e2e" : "#f5f5f5",
                      },
                    }}
                    autoFocus
                  />
                  <IconButton
                    size="small"
                    onClick={() => handleSaveComment(commentNodeId)}
                    sx={{ color: "#4caf50" }}
                  >
                    <Icon icon="mdi:check" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={handleCancelEdit}
                    sx={{ color: "#f44336" }}
                  >
                    <Icon icon="mdi:close" />
                  </IconButton>
                </Box>
              );
            } else {
              // Режим просмотра с возможностью редактирования
              currentLine.push(
                <Box
                  key={index}
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.5,
                    margin: "0 2px",
                    ...indentStyle,
                  }}
                >
                  <span
                    style={{
                      color:
                        theme.palette.mode === "dark" ? "#4caf50" : "#2e7d32",
                      fontStyle: "italic",
                      fontSize: "0.9em",
                      fontWeight: 500,
                      cursor: commentNodeId ? "pointer" : "default",
                    }}
                    onClick={() => {
                      if (commentNodeId) {
                        handleStartEditComment(
                          commentNodeId,
                          originalCommentText
                        );
                      }
                    }}
                    title={
                      commentNodeId
                        ? "Нажмите чтобы редактировать комментарий"
                        : undefined
                    }
                  >
                    {`{${formatCommentWithArrows(originalCommentText)}}`}
                  </span>
                  {commentNodeId && (
                    <IconButton
                      size="small"
                      onClick={() =>
                        handleStartEditComment(
                          commentNodeId,
                          originalCommentText
                        )
                      }
                      sx={{
                        opacity: 0.6,
                        "&:hover": { opacity: 1 },
                        color:
                          theme.palette.mode === "dark" ? "#4caf50" : "#2e7d32",
                        fontSize: "0.8rem",
                        padding: "2px",
                      }}
                    >
                      <Icon icon="mdi:pencil" style={{ fontSize: "12px" }} />
                    </IconButton>
                  )}
                </Box>
              );
            }
            return;
          }

          currentLine.push(
            <span key={index} style={{ margin: "0 0.5px", ...indentStyle }}>
              {token}
            </span>
          );
          return;
        }

        // Это ход - делаем кликабельным
        if (nodeId) {
          const isCurrentMove = nodeId === currentNodeId;
          const nodeData = moveTree.nodes[nodeId];
          const hasComment = nodeData?.comment;

          // Проверяем, есть ли реальный текстовый комментарий (не только часы и стрелки)
          const hasRealComment =
            hasComment &&
            PgnParser.removeClockAndArrowsFromComment(hasComment).trim()
              .length > 0;

          currentLine.push(
            <Box
              key={index}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
                ...indentStyle,
              }}
            >
              <span
                onClick={() => onMoveClick(nodeId)}
                onDoubleClick={() => {
                  const currentComment = hasComment || "";
                  handleStartEditComment(nodeId, currentComment);
                }}
                style={{
                  cursor: "pointer",
                  padding: "2px 4px",
                  borderRadius: "4px",
                  backgroundColor: isCurrentMove ? "#1976d2" : "transparent",
                  color: isCurrentMove ? "white" : colors.moveColor,
                  fontWeight: isCurrentMove ? 600 : 400,
                  margin: "1px 1px",
                  transition: "all 0.15s ease",
                  textDecoration: "none",
                  display: "inline-block",
                  whiteSpace: "nowrap",
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
                title="Клик - перейти к ходу, Двойной клик - добавить/редактировать комментарий"
              >
                {token}
              </span>

              {/* Иконка для добавления комментария (только если реального комментария нет) */}
              {!hasRealComment && (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartEditComment(nodeId, "");
                  }}
                  sx={{
                    opacity: 0.4,
                    "&:hover": { opacity: 1 },
                    color: theme.palette.mode === "dark" ? "#666" : "#999",
                    fontSize: "0.7rem",
                    padding: "1px",
                    marginLeft: "2px",
                  }}
                  title="Добавить комментарий"
                >
                  <Icon icon="mdi:comment-plus" style={{ fontSize: "10px" }} />
                </IconButton>
              )}

              {/* Показываем поле ввода для нового комментария */}
              {editingComment === nodeId && (
                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 1,
                    marginLeft: 1,
                  }}
                >
                  <TextField
                    size="small"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      // Останавливаем всплытие событий для всех клавиш
                      e.stopPropagation();

                      if (e.key === "Enter" && e.ctrlKey) {
                        handleSaveComment(nodeId);
                      } else if (e.key === "Escape") {
                        handleCancelEdit();
                      }
                    }}
                    onKeyUp={(e) => {
                      // Также останавливаем всплытие для keyUp
                      e.stopPropagation();
                    }}
                    placeholder="Добавить комментарий..."
                    sx={{
                      "& .MuiInputBase-root": {
                        fontSize: "0.9em",
                        backgroundColor:
                          theme.palette.mode === "dark" ? "#2e2e2e" : "#f5f5f5",
                      },
                    }}
                    autoFocus
                  />
                  <IconButton
                    size="small"
                    onClick={() => handleSaveComment(nodeId)}
                    sx={{ color: "#4caf50" }}
                  >
                    <Icon icon="mdi:check" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={handleCancelEdit}
                    sx={{ color: "#f44336" }}
                  >
                    <Icon icon="mdi:close" />
                  </IconButton>
                </Box>
              )}
            </Box>
          );
          return;
        }

        // Ход без nodeId - отображаем как обычный текст
        currentLine.push(
          <span key={index} style={{ margin: "0 0.5px", ...indentStyle }}>
            {token}
          </span>
        );
      }
    );

    // Добавляем последнюю строку
    flushLine();

    return result;
  }, [
    pgn,
    moveTree,
    onMoveClick,
    colors,
    currentNodeId,
    findNodeIdForComment,
    theme.palette.mode,
    editingComment,
    commentText,
    handleStartEditComment,
    handleSaveComment,
    handleCancelEdit,
    formatCommentWithArrows,
  ]);

  return (
    <Box
      sx={{
        lineHeight: 1.5,
        wordSpacing: "1px",
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
