import { PgnParser } from "@/lib/pgnParser";
import { Box, Paper, alpha } from "@mui/material";
import { useCallback, useMemo, useState } from "react";
import { CommentUtils } from "../commentUtils";
import { CommentEditForm } from "./CommentEditForm";
import { CommentElement } from "./CommentElement";
import { generateDisplayElements } from "./displayElementsGenerator";
import { MoveElement } from "./MoveElement";
import { MoveNumberElement } from "./MoveNumberElement";
import { ResultElement } from "./ResultElement";
import { DisplayElement, PgnDisplayProps } from "./types";
import { useThemeColors } from "./useThemeColors";
import { VariationElement } from "./VariationElement";

export function PgnDisplay({
  moveTree,
  onMoveClick,
  onCommentUpdate,
  currentNodeId,
}: PgnDisplayProps) {
  const { colors, theme } = useThemeColors();
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
    return CommentUtils.formatCommentWithArrows(commentText);
  }, []);

  // Генерация элементов отображения на основе дерева ходов
  const displayElements = useMemo(() => {
    return generateDisplayElements(moveTree);
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
          <Paper
            key={`line-${lineIndex++}`}
            elevation={0}
            sx={{
              marginBottom: "4px",
              display: "flex",
              flexWrap: "wrap", // Разрешаем переносить элементы внутри строки
              alignItems: "center",
              backgroundColor: "transparent",
              padding: "2px 4px",
              borderRadius: "6px",
            }}
          >
            {currentLine}
          </Paper>
        );
        currentLine = [];
      }
    };

    // Обрабатываем каждый элемент
    displayElements.forEach((element: DisplayElement) => {
      // Если нужен перенос строки, завершаем текущую строку
      if (element.needsNewLine) {
        flushLine();
      }

      // Создаем соответствующий React-элемент в зависимости от типа
      let reactElement: React.ReactNode;

      // Общий стиль отступа
      const indentStyle = {
        marginLeft:
          element.indentLevel > 0 ? `${element.indentLevel * 16}px` : 0,
      };

      // Проверяем, является ли этот ход текущим
      const isCurrentMove = element.nodeId === currentNodeId;

      switch (element.type) {
        case "move":
          if (element.nodeId && editingComment === element.nodeId) {
            reactElement = (
              <Box
                key={element.id}
                sx={{ ...indentStyle, display: "flex", alignItems: "center" }}
              >
                <MoveElement
                  id={element.id}
                  text={element.text}
                  nodeId={element.nodeId}
                  isCurrentMove={isCurrentMove}
                  comment={moveTree.nodes[element.nodeId]?.comment}
                  onMoveClick={onMoveClick}
                  onStartEditComment={handleStartEditComment}
                  indentStyle={{}}
                  colors={colors}
                  theme={theme}
                />
                <CommentEditForm
                  nodeId={element.nodeId}
                  commentText={commentText}
                  setCommentText={setCommentText}
                  onSave={handleSaveComment}
                  onCancel={handleCancelEdit}
                />
              </Box>
            );
          } else {
            reactElement = (
              <MoveElement
                key={element.id}
                id={element.id}
                text={element.text}
                nodeId={element.nodeId!}
                isCurrentMove={isCurrentMove}
                comment={
                  element.nodeId
                    ? moveTree.nodes[element.nodeId]?.comment
                    : undefined
                }
                onMoveClick={onMoveClick}
                onStartEditComment={handleStartEditComment}
                indentStyle={indentStyle}
                colors={colors}
                theme={theme}
              />
            );
          }
          break;

        case "moveNumber":
          reactElement = (
            <MoveNumberElement
              key={element.id}
              id={element.id}
              text={element.text}
              indentStyle={indentStyle}
              colors={colors}
            />
          );
          break;

        case "comment":
          // Проверяем, редактируется ли сейчас этот комментарий
          if (element.nodeId && editingComment === element.nodeId) {
            reactElement = null; // Комментарий в режиме редактирования отображается рядом с ходом
          } else {
            reactElement = (
              <CommentElement
                key={element.id}
                id={element.id}
                text={element.text}
                nodeId={element.nodeId}
                indentStyle={indentStyle}
                colors={colors}
                onStartEditComment={handleStartEditComment}
                formatCommentWithArrows={formatCommentWithArrows}
              />
            );
          }
          break;

        case "variationStart":
        case "variationEnd":
          reactElement = (
            <VariationElement
              key={element.id}
              id={element.id}
              text={element.text}
              type={element.type}
              indentStyle={indentStyle}
              colors={colors}
            />
          );
          break;

        case "result":
          reactElement = (
            <ResultElement
              key={element.id}
              id={element.id}
              text={element.text}
              indentStyle={indentStyle}
            />
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
                flexShrink: 0,
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
    theme,
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
        backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.3),
        borderRadius: 1,
      }}
    >
      {renderElements}
    </Box>
  );
}
