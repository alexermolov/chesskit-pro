import { useChessActionsWithBranches } from "@/hooks/useChessActionsWithBranches";
import {
  Box,
  Fade,
  Typography,
  TextField,
  IconButton,
  Tooltip,
} from "@mui/material";
import { useMemo, useState } from "react";
import { Icon } from "@iconify/react";

interface MoveCommentProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gameAtom: any;
}

export default function MoveComment({ gameAtom }: MoveCommentProps) {
  const { moveTree, updateNodeComment } = useChessActionsWithBranches(gameAtom);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");

  // Получаем комментарий текущего хода
  const { currentComment, currentNodeId } = useMemo(() => {
    if (!moveTree || !moveTree.currentNodeId || !moveTree.nodes) {
      return { currentComment: null, currentNodeId: null };
    }

    const currentNode = moveTree.nodes[moveTree.currentNodeId];
    return {
      currentComment: currentNode?.comment || null,
      currentNodeId: moveTree.currentNodeId,
    };
  }, [moveTree]);

  const handleStartEdit = () => {
    setEditText(currentComment || "");
    setIsEditing(true);
  };

  const handleSave = () => {
    if (currentNodeId && updateNodeComment) {
      updateNodeComment(currentNodeId, editText.trim() || null);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditText("");
  };

  const handleAddComment = () => {
    setEditText("");
    setIsEditing(true);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.ctrlKey) {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  // Показываем компонент если есть комментарий или мы в режиме редактирования
  if (!currentComment && !isEditing) {
    // Показываем кнопку добавления комментария только если есть текущий ход
    if (!currentNodeId) return null;

    return (
      <Fade in={true} timeout={300}>
        <Box
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 10,
          }}
        >
          <Tooltip title="Добавить комментарий">
            <IconButton
              onClick={handleAddComment}
              sx={{
                backgroundColor: "rgba(76, 175, 80, 0.1)",
                color: "#4caf50",
                border: "1px solid rgba(76, 175, 80, 0.3)",
                "&:hover": {
                  backgroundColor: "rgba(76, 175, 80, 0.2)",
                },
              }}
              size="small"
            >
              <Icon
                icon="material-symbols:comment-add"
                width="18"
                height="18"
              />
            </IconButton>
          </Tooltip>
        </Box>
      </Fade>
    );
  }

  return (
    <Fade in={true} timeout={300}>
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          background:
            "linear-gradient(135deg, rgba(32, 32, 32, 0.95) 0%, rgba(16, 16, 16, 0.98) 100%)",
          backdropFilter: "blur(12px)",
          color: "#4caf50",
          padding: 3,
          borderRadius: "0 0 16px 16px",
          boxShadow:
            "0 8px 32px rgba(0, 0, 0, 0.6), 0 4px 16px rgba(76, 175, 80, 0.3)",
          border: "2px solid rgba(76, 175, 80, 0.8)",
          borderTop: "none",
          animation: "slideDown 0.3s ease-out",
          "@keyframes slideDown": {
            "0%": {
              transform: "translateY(-100%)",
              opacity: 0,
            },
            "100%": {
              transform: "translateY(0)",
              opacity: 1,
            },
          },
        }}
      >
        {isEditing ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={handleKeyPress}
              multiline
              rows={3}
              placeholder="Введите комментарий к ходу..."
              autoFocus
              sx={{
                "& .MuiOutlinedInput-root": {
                  color: "#4caf50",
                  fontSize: "0.95rem",
                  backgroundColor: "rgba(76, 175, 80, 0.05)",
                  "& fieldset": {
                    borderColor: "rgba(76, 175, 80, 0.3)",
                  },
                  "&:hover fieldset": {
                    borderColor: "rgba(76, 175, 80, 0.5)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#4caf50",
                  },
                },
                "& .MuiInputBase-input::placeholder": {
                  color: "rgba(76, 175, 80, 0.7)",
                  opacity: 1,
                },
              }}
            />
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
              <IconButton
                onClick={handleCancel}
                sx={{
                  color: "#f44336",
                  "&:hover": { backgroundColor: "rgba(244, 67, 54, 0.1)" },
                }}
                size="small"
              >
                <Icon icon="material-symbols:close" width="18" height="18" />
              </IconButton>
              <IconButton
                onClick={handleSave}
                sx={{
                  color: "#4caf50",
                  "&:hover": { backgroundColor: "rgba(76, 175, 80, 0.1)" },
                }}
                size="small"
              >
                <Icon icon="material-symbols:check" width="18" height="18" />
              </IconButton>
            </Box>
            <Typography
              variant="caption"
              sx={{ color: "rgba(76, 175, 80, 0.7)", textAlign: "center" }}
            >
              Ctrl+Enter для сохранения, Esc для отмены
            </Typography>
          </Box>
        ) : (
          <Box sx={{ position: "relative" }}>
            <Typography
              variant="body2"
              sx={{
                fontSize: "1rem",
                lineHeight: 1.6,
                fontStyle: "italic",
                textAlign: "center",
                fontWeight: 600,
                letterSpacing: "0.5px",
                paddingRight: "40px", // Место для кнопки редактирования
              }}
            >
              {currentComment}
            </Typography>
            <Box
              sx={{
                position: "absolute",
                top: -8,
                right: -8,
                display: "flex",
                gap: 0.5,
              }}
            >
              <Tooltip title="Редактировать комментарий">
                <IconButton
                  onClick={handleStartEdit}
                  sx={{
                    color: "#4caf50",
                    backgroundColor: "rgba(76, 175, 80, 0.1)",
                    "&:hover": { backgroundColor: "rgba(76, 175, 80, 0.2)" },
                  }}
                  size="small"
                >
                  <Icon icon="material-symbols:edit" width="16" height="16" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Удалить комментарий">
                <IconButton
                  onClick={() =>
                    currentNodeId &&
                    updateNodeComment &&
                    updateNodeComment(currentNodeId, null)
                  }
                  sx={{
                    color: "#f44336",
                    backgroundColor: "rgba(244, 67, 54, 0.1)",
                    "&:hover": { backgroundColor: "rgba(244, 67, 54, 0.2)" },
                  }}
                  size="small"
                >
                  <Icon icon="material-symbols:delete" width="16" height="16" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        )}
      </Box>
    </Fade>
  );
}
