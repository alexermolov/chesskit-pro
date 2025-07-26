import { useChessActionsWithBranches } from "@/hooks/useChessActionsWithBranches";
import { PgnParser } from "@/lib/pgnParser";
import { MoveTree } from "@/types/moveTree";
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

  return (
    <Box
      sx={{
        width: "100%",
        minWidth: 0, // Позволяет контейнеру сжиматься
        padding: 1,
        overflowY: "auto", // Вертикальная прокрутка
        overflowX: "hidden", // Скрываем горизонтальную прокрутку
        maxHeight: "40vh",
        fontSize: "0.9rem",
        lineHeight: 1.4,
      }}
      id="moves-panel"
    >
      <Box
        sx={{
          fontSize: "0.95rem",
          fontFamily: "monospace",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <PgnDisplay
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
  moveTree: MoveTree;
  onMoveClick: (nodeId: string) => void;
  onCommentUpdate: (nodeId: string, comment: string | null) => void;
  currentNodeId: string;
}

// Типы для представления элементов отображения
type ElementType =
  | "move" // Ход (сан-нотация)
  | "moveNumber" // Номер хода (1., 5..., и т.д.)
  | "comment" // Комментарий
  | "variationStart" // Начало вариации (
  | "variationEnd" // Конец вариации )
  | "result" // Результат партии (* или 1-0, 0-1, 1/2-1/2)
  | "space"; // Пробел

// Элемент отображения дерева ходов
interface DisplayElement {
  id: string; // Уникальный идентификатор элемента
  type: ElementType; // Тип элемента
  text: string; // Текст для отображения
  nodeId?: string; // ID узла в дереве ходов (для move и comment)
  indentLevel: number; // Уровень отступа для вариаций
  needsNewLine: boolean; // Нужен ли перенос строки перед элементом
  forceLineBreakAfter?: boolean; // Принудительно добавить перенос строки после элемента
}

function PgnDisplay({
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

  // Генерация элементов отображения на основе дерева ходов
  // Алгоритм аналогичен toPgn, но создает структуру данных, а не строку
  const displayElements = useMemo(() => {
    if (!moveTree || !moveTree.nodes || !moveTree.rootId) {
      return [];
    }

    const elements: DisplayElement[] = [];
    let elementId = 0;

    // Функция для генерации уникального ID элемента
    const generateElementId = () => {
      return `el_${elementId++}`;
    };

    // Функция для подсчета номера хода на основе пути от корня
    // Аналогично getMoveNumber в toPgn
    const getMoveNumber = (nodeId: string): number => {
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
    };

    // Функция для определения цвета хода
    // Аналогично isWhiteMove в toPgn
    const isWhiteMove = (nodeId: string): boolean => {
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
    };

    // Рекурсивная функция для обработки узла и его детей
    // Аналогично processNode в toPgn
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
        const moveNumber = getMoveNumber(nodeId);
        const isWhite = isWhiteMove(nodeId);

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
        const moveNumber = getMoveNumber(mainChild);
        const isWhite = isWhiteMove(mainChild);

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
      id: generateElementId(),
      type: "result",
      text: "*",
      indentLevel: 0,
      needsNewLine: false,
    });

    return elements;
  }, [moveTree]);

  // Отображение элементов с разбивкой на строки
  const renderElements = useMemo(() => {
    if (!displayElements.length) {
      return null;
    }

    // Группируем элементы по строкам
    const lines: React.ReactNode[] = [];
    let currentLine: React.ReactNode[] = [];
    let lineIndex = 0;

    // Функция для завершения текущей строки
    const flushLine = () => {
      if (currentLine.length > 0) {
        lines.push(
          <div
            key={`line-${lineIndex++}`}
            style={{
              marginBottom: "3px",
              display: "flex",
              flexWrap: "wrap", // Разрешаем переносить элементы внутри строки
              alignItems: "center",
            }}
          >
            {currentLine}
          </div>
        );
        currentLine = [];
      }
    };

    // Обрабатываем каждый элемент
    displayElements.forEach((element) => {
      // Если нужен перенос строки, завершаем текущую строку
      if (element.needsNewLine) {
        flushLine();
      }

      // Создаем соответствующий React-элемент в зависимости от типа
      let reactElement: React.ReactNode;

      // Общий стиль отступа
      const indentStyle = {
        marginLeft:
          element.indentLevel > 0 ? `${element.indentLevel * 12}px` : 0,
      };

      // Проверяем, является ли этот ход текущим
      const isCurrentMove = element.nodeId === currentNodeId;

      switch (element.type) {
        case "move":
          reactElement = (
            <Box
              key={element.id}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
                margin: "0 2px", // Увеличиваем отступ между ходами
                flexShrink: 0, // Предотвращает сжатие элемента
                ...indentStyle,
              }}
            >
              <span
                onClick={() => element.nodeId && onMoveClick(element.nodeId)}
                onDoubleClick={() => {
                  if (element.nodeId) {
                    const node = moveTree.nodes[element.nodeId];
                    const currentComment = node?.comment || "";
                    handleStartEditComment(element.nodeId, currentComment);
                  }
                }}
                style={{
                  cursor: "pointer",
                  padding: "2px 4px",
                  borderRadius: "4px",
                  backgroundColor: isCurrentMove ? "#1976d2" : "transparent",
                  color: isCurrentMove ? "white" : colors.moveColor,
                  fontWeight: isCurrentMove ? 600 : 400,
                  transition: "all 0.15s ease",
                  textDecoration: "none",
                  display: "inline-block",
                  whiteSpace: "nowrap", // Запрещает перенос внутри хода
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
                {element.text}
              </span>

              {/* Кнопка добавления комментария если его нет */}
              {element.nodeId && !moveTree.nodes[element.nodeId]?.comment && (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (element.nodeId) {
                      handleStartEditComment(element.nodeId, "");
                    }
                  }}
                  sx={{
                    opacity: 0.4,
                    "&:hover": { opacity: 1 },
                    color: theme.palette.mode === "dark" ? "#666" : "#999",
                    fontSize: "0.7rem",
                    padding: "1px",
                  }}
                  title="Добавить комментарий"
                >
                  <Icon icon="mdi:comment-plus" style={{ fontSize: "10px" }} />
                </IconButton>
              )}

              {/* Поле редактирования комментария */}
              {element.nodeId && editingComment === element.nodeId && (
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
                        handleSaveComment(element.nodeId!);
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
                        maxWidth: "160px", // Ограничиваем ширину поля ввода
                      },
                    }}
                    autoFocus
                  />
                  <IconButton
                    size="small"
                    onClick={() => handleSaveComment(element.nodeId!)}
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
          break;

        case "moveNumber":
          reactElement = (
            <span
              key={element.id}
              style={{
                color: theme.palette.mode === "dark" ? "#888" : "#333",
                marginRight: "3px",
                fontWeight: 600,
                fontSize: "0.95em",
                display: "inline-block",
                whiteSpace: "nowrap", // Запрещает перенос внутри номера хода
                flexShrink: 0, // Предотвращает сжатие элемента
                ...indentStyle,
              }}
            >
              {element.text}
            </span>
          );
          break;

        case "comment":
          // Проверяем, редактируется ли сейчас этот комментарий
          if (element.nodeId && editingComment === element.nodeId) {
            reactElement = null; // Комментарий в режиме редактирования отображается рядом с ходом
          } else {
            reactElement = (
              <Box
                key={element.id}
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.5,
                  margin: "0 2px",
                  flexShrink: 0, // Предотвращает сжатие элемента
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
                    cursor: element.nodeId ? "pointer" : "default",
                  }}
                  onClick={() => {
                    if (element.nodeId) {
                      handleStartEditComment(element.nodeId, element.text);
                    }
                  }}
                  title={
                    element.nodeId
                      ? "Нажмите чтобы редактировать комментарий"
                      : undefined
                  }
                >
                  {`{${formatCommentWithArrows(element.text)}}`}
                </span>
                {element.nodeId && (
                  <IconButton
                    size="small"
                    onClick={() => {
                      if (element.nodeId) {
                        handleStartEditComment(element.nodeId, element.text);
                      }
                    }}
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
          break;

        case "variationStart":
          reactElement = (
            <span
              key={element.id}
              style={{
                color: "#999",
                margin: "0 2px",
                display: "inline-block",
                whiteSpace: "nowrap",
                flexShrink: 0, // Предотвращает сжатие элемента
                ...indentStyle,
              }}
            >
              {element.text}
            </span>
          );
          break;

        case "variationEnd":
          reactElement = (
            <span
              key={element.id}
              style={{
                color: "#999",
                margin: "0 2px",
                display: "inline-block",
                whiteSpace: "nowrap",
                flexShrink: 0, // Предотвращает сжатие элемента
                ...indentStyle,
              }}
            >
              {element.text}
            </span>
          );
          break;

        case "result":
          reactElement = (
            <span
              key={element.id}
              style={{
                color: "#666",
                margin: "0 2px",
                display: "inline-block",
                whiteSpace: "nowrap",
                flexShrink: 0, // Предотвращает сжатие элемента
                ...indentStyle,
              }}
            >
              {element.text}
            </span>
          );
          break;

        case "space":
        default:
          reactElement = (
            <span
              key={element.id}
              style={{
                margin: "0 2px",
                display: "inline-block",
                whiteSpace: "nowrap",
                flexShrink: 0, // Предотвращает сжатие элемента
                ...indentStyle,
              }}
            >
              {element.text}
            </span>
          );
          break;
      }

      // Добавляем элемент в текущую строку
      if (reactElement) {
        currentLine.push(reactElement);
      }

      // Проверяем, нужно ли добавить перенос строки после текущего элемента
      if (element.forceLineBreakAfter) {
        flushLine();
      }
    });

    // Добавляем последнюю строку, если она не пуста
    if (currentLine.length > 0) {
      flushLine();
    }

    return lines;
  }, [
    displayElements,
    currentNodeId,
    moveTree,
    colors,
    onMoveClick,
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
        display: "block",
        width: "100%",
        boxSizing: "border-box",
        overflowWrap: "break-word", // Позволяет переносить слова
      }}
    >
      {renderElements}
    </Box>
  );
}
