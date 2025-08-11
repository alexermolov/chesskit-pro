import { Icon } from "@iconify/react";
import { Box, Chip, IconButton, Tooltip } from "@mui/material";
import { useCallback } from "react";
import { hasRealComment } from "@/lib/helpers";

interface MoveElementProps {
  id: string;
  text: string;
  nodeId: string;
  isCurrentMove: boolean;
  comment?: string | null;
  onMoveClick: (nodeId: string) => void;
  onStartEditComment: (nodeId: string, comment: string) => void;
  indentStyle: object;
  colors: any;
  theme: any;
}

export const MoveElement = ({
  id,
  text,
  nodeId,
  isCurrentMove,
  comment,
  onMoveClick,
  onStartEditComment,
  indentStyle,
  colors,
  theme,
}: MoveElementProps) => {
  const handleDoubleClick = useCallback(() => {
    if (nodeId) {
      const currentComment = comment || "";
      onStartEditComment(nodeId, currentComment);
    }
  }, [nodeId, comment, onStartEditComment]);

  const handleAddComment = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (nodeId) {
        onStartEditComment(nodeId, "");
      }
    },
    [nodeId, onStartEditComment]
  );

  const hasActualComment = hasRealComment(comment);

  return (
    <Box
      key={id}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        margin: "2px 3px",
        flexShrink: 0,
        ...indentStyle,
      }}
    >
      <Tooltip
        title={`Click - go to move, Double click - ${hasActualComment ? "edit comment" : "add comment"}`}
        arrow
        enterDelay={700}
      >
        <Chip
          label={text}
          onClick={() => nodeId && onMoveClick(nodeId)}
          onDoubleClick={handleDoubleClick}
          size="small"
          sx={{
            height: "auto",
            minHeight: "24px",
            padding: "1px 2px",
            fontWeight: isCurrentMove ? 600 : 500,
            backgroundColor: isCurrentMove
              ? colors.currentMoveBackground
              : "transparent",
            color: isCurrentMove
              ? theme.palette.primary.contrastText
              : colors.moveColor,
            transition: "all 0.2s ease",
            border: `1px solid ${
              isCurrentMove
                ? theme.palette.primary.main
                : theme.palette.mode === "dark"
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(0,0,0,0.05)"
            }`,
            "&:hover": {
              backgroundColor: isCurrentMove
                ? colors.currentMoveBackground
                : colors.hoverColor,
              boxShadow: isCurrentMove
                ? `0 0 0 1px ${theme.palette.primary.main}`
                : "none",
            },
            cursor: "pointer",
            whiteSpace: "nowrap",
            fontSize: "0.9rem",
          }}
        />
      </Tooltip>

      {/* Add comment button if there is no real comment */}
      {nodeId && !hasActualComment && (
        <IconButton
          size="small"
          onClick={handleAddComment}
          sx={{
            opacity: 0.4,
            "&:hover": { opacity: 1 },
            color: theme.palette.mode === "dark" ? "#888" : "#999",
            fontSize: "0.7rem",
            padding: "1px",
            width: "16px",
            height: "16px",
            minWidth: "16px",
          }}
          title="Add comment"
        >
          <Icon icon="mdi:comment-plus" style={{ fontSize: "10px" }} />
        </IconButton>
      )}
    </Box>
  );
};
