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

  // Adding functions to work with comments
  const handleStartEditComment = useCallback(
    (nodeId: string, currentComment: string) => {
      setEditingComment(nodeId);
      // Show only the text part, remove arrows and clocks for editing
      const textOnly =
        PgnParser.removeClockAndArrowsFromComment(currentComment);
      setCommentText(textOnly);
    },
    []
  );

  const handleSaveComment = useCallback(
    (nodeId: string) => {
      const trimmedComment = commentText.trim();

      // Get the current comment of the node
      const currentNode = moveTree.nodes[nodeId];
      const currentComment = currentNode?.comment || "";

      // Extract existing arrows and clocks
      const existingArrows = PgnParser.extractArrowsFromComment(currentComment);
      const existingClock = PgnParser.extractClockFromComment(currentComment);

      // Combine new text with existing annotations
      let finalComment = trimmedComment;

      // Add arrows
      existingArrows.forEach((arrow) => {
        finalComment += ` [%draw arrow,${arrow.from},${arrow.to}${
          arrow.color ? `,${arrow.color}` : ""
        }]`;
      });

      // Add clocks
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

  // Generation of display elements based on the move tree
  const displayElements = useMemo(() => {
    return generateDisplayElements(moveTree);
  }, [moveTree]);

  // Displaying elements with line breaks
  const renderElements = useMemo(() => {
    if (!displayElements.length) {
      return null;
    }

    // Grouping elements by lines
    const lines: React.ReactNode[] = [];
    let currentLine: React.ReactNode[] = [];
    let lineIndex = 0;

    // Function to flush the current line
    const flushLine = () => {
      if (currentLine.length > 0) {
        lines.push(
          <Paper
            key={`line-${lineIndex++}`}
            elevation={0}
            sx={{
              marginBottom: "4px",
              display: "flex",
              flexWrap: "wrap", // Allow elements to wrap within the line
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

    // Process each element
    displayElements.forEach((element: DisplayElement) => {
      // If a line break is needed, finish the current line
      if (element.needsNewLine) {
        flushLine();
      }

      // Create the corresponding React element based on the type
      let reactElement: React.ReactNode;

      // Common indentation style
      const indentStyle = {
        marginLeft: 0,
      };

      // Check if this move is the current move
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
          // Check if this comment is currently being edited
          if (element.nodeId && editingComment === element.nodeId) {
            reactElement = null; // Comment in edit mode is displayed next to the move
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

      // Add the element to the current line
      if (reactElement) {
        currentLine.push(reactElement);
      }

      // Check if a line break is needed after the current element
      if (element.forceLineBreakAfter) {
        flushLine();
      }
    });

    // Add the last line if it's not empty
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
        overflowWrap: "break-word", // Allows word wrapping
        backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.3),
        borderRadius: 1,
      }}
    >
      {renderElements}
    </Box>
  );
}
