import { Icon } from "@iconify/react";
import { Box, IconButton, TextField, Tooltip, alpha } from "@mui/material";
import { useCallback } from "react";

interface CommentEditFormProps {
  nodeId: string;
  commentText: string;
  setCommentText: (text: string) => void;
  onSave: (nodeId: string) => void;
  onCancel: () => void;
}

export const CommentEditForm = ({
  nodeId,
  commentText,
  setCommentText,
  onSave,
  onCancel,
}: CommentEditFormProps) => {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Stop event propagation for all keys
      e.stopPropagation();

      if (e.key === "Enter" && e.ctrlKey) {
        onSave(nodeId);
      } else if (e.key === "Escape") {
        onCancel();
      }
    },
    [nodeId, onSave, onCancel]
  );

  const handleKeyUp = useCallback((e: React.KeyboardEvent) => {
    // Also stop propagation for keyUp
    e.stopPropagation();
  }, []);

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 1,
        marginLeft: 1,
        backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.9),
        borderRadius: 1,
        padding: "2px 4px",
        boxShadow: 1,
      }}
    >
      <TextField
        size="small"
        value={commentText}
        onChange={(e) => setCommentText(e.target.value)}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        placeholder="Add a comment..."
        sx={{
          "& .MuiInputBase-root": {
            fontSize: "0.9em",
            backgroundColor: (theme) =>
              theme.palette.mode === "dark" ? "#2e2e2e" : "#f5f5f5",
            maxWidth: "160px", // Limit input field width
          },
        }}
        autoFocus
      />
      <Tooltip title="Save (Ctrl+Enter)" arrow>
        <IconButton
          size="small"
          onClick={() => onSave(nodeId)}
          sx={{
            color: "#4caf50",
            width: "20px",
            height: "20px",
            minWidth: "20px",
          }}
        >
          <Icon icon="mdi:check" fontSize="14px" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Cancel (Esc)" arrow>
        <IconButton
          size="small"
          onClick={onCancel}
          sx={{
            color: "#f44336",
            width: "20px",
            height: "20px",
            minWidth: "20px",
          }}
        >
          <Icon icon="mdi:close" fontSize="14px" />
        </IconButton>
      </Tooltip>
    </Box>
  );
};
