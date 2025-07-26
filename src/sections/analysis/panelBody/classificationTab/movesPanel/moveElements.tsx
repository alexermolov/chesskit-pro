import { Icon } from "@iconify/react";
import { Box, IconButton, TextField } from "@mui/material";
import {
  CommentEditorProps,
  CommentElementProps,
  MoveElementProps,
} from "./types";

// Компонент для отображения хода
export function MoveElement({
  element,
  currentNodeId,
  onMoveClick,
  onStartEditComment,
  moveTree,
  colors,
}: MoveElementProps) {
  const isCurrentMove = element.nodeId === currentNodeId;

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        margin: "0 2px",
        flexShrink: 0,
        marginLeft:
          element.indentLevel > 0 ? `${element.indentLevel * 12}px` : 0,
      }}
    >
      <span
        onClick={() => element.nodeId && onMoveClick(element.nodeId)}
        onDoubleClick={() => {
          if (element.nodeId) {
            const node = moveTree.nodes[element.nodeId];
            const currentComment = node?.comment || "";
            onStartEditComment(element.nodeId, currentComment);
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
        {element.text}
      </span>

      {/* Кнопка добавления комментария если его нет */}
      {element.nodeId && !moveTree.nodes[element.nodeId]?.comment && (
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            if (element.nodeId) {
              onStartEditComment(element.nodeId, "");
            }
          }}
          sx={{
            opacity: 0.4,
            "&:hover": { opacity: 1 },
            color: "text.secondary",
            fontSize: "0.7rem",
            padding: "1px",
            marginLeft: "2px",
          }}
          title="Добавить комментарий"
        >
          <Icon icon="mdi:comment-plus" style={{ fontSize: "10px" }} />
        </IconButton>
      )}
    </Box>
  );
}

// Компонент для отображения комментария
export function CommentElement({
  element,
  onStartEditComment,
  formatCommentWithArrows,
  theme,
}: CommentElementProps) {
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        margin: "0 2px",
        flexShrink: 0,
        marginLeft:
          element.indentLevel > 0 ? `${element.indentLevel * 12}px` : 0,
      }}
    >
      <span
        style={{
          color: theme.palette.mode === "dark" ? "#4caf50" : "#2e7d32",
          fontStyle: "italic",
          fontSize: "0.9em",
          fontWeight: 500,
          cursor: element.nodeId ? "pointer" : "default",
        }}
        onClick={() => {
          if (element.nodeId) {
            onStartEditComment(element.nodeId, element.text);
          }
        }}
        title={
          element.nodeId ? "Нажмите чтобы редактировать комментарий" : undefined
        }
      >
        {`{${formatCommentWithArrows(element.text)}}`}
      </span>
      {element.nodeId && (
        <IconButton
          size="small"
          onClick={() => {
            if (element.nodeId) {
              onStartEditComment(element.nodeId, element.text);
            }
          }}
          sx={{
            opacity: 0.6,
            "&:hover": { opacity: 1 },
            color: theme.palette.mode === "dark" ? "#4caf50" : "#2e7d32",
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

// Компонент редактора комментариев
export function CommentEditor({
  nodeId,
  commentText,
  onSave,
  onCancel,
  onChange,
  theme,
}: CommentEditorProps) {
  return (
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
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          // Останавливаем всплытие событий для всех клавиш
          e.stopPropagation();

          if (e.key === "Enter" && e.ctrlKey) {
            onSave(nodeId);
          } else if (e.key === "Escape") {
            onCancel();
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
            maxWidth: "160px",
          },
        }}
        autoFocus
      />
      <IconButton
        size="small"
        onClick={() => onSave(nodeId)}
        sx={{ color: "#4caf50" }}
      >
        <Icon icon="mdi:check" />
      </IconButton>
      <IconButton size="small" onClick={onCancel} sx={{ color: "#f44336" }}>
        <Icon icon="mdi:close" />
      </IconButton>
    </Box>
  );
}
