import { Icon } from "@iconify/react";
import { Box, IconButton, Tooltip, alpha } from "@mui/material";

interface CommentElementProps {
  id: string;
  text: string;
  nodeId?: string;
  indentStyle: object;
  colors: any;
  onStartEditComment: (nodeId: string, comment: string) => void;
  formatCommentWithArrows: (comment: string) => React.ReactNode;
}

export const CommentElement = ({
  id,
  text,
  nodeId,
  indentStyle,
  colors,
  onStartEditComment,
  formatCommentWithArrows,
}: CommentElementProps) => {
  return (
    <Box
      key={id}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        margin: "2px 4px",
        padding: "2px 6px",
        borderRadius: "4px",
        backgroundColor: colors.commentBackground,
        border: `1px solid ${alpha(colors.commentColor, 0.2)}`,
        flexShrink: 0,
        ...indentStyle,
      }}
    >
      <Tooltip
        title="Нажмите чтобы редактировать комментарий"
        arrow
        enterDelay={500}
      >
        <span
          style={{
            color: colors.commentColor,
            fontStyle: "italic",
            fontSize: "0.9em",
            fontWeight: 500,
            cursor: nodeId ? "pointer" : "default",
          }}
          onClick={() => {
            if (nodeId) {
              onStartEditComment(nodeId, text);
            }
          }}
        >
          {formatCommentWithArrows(text)}
        </span>
      </Tooltip>
      {nodeId && (
        <IconButton
          size="small"
          onClick={() => {
            if (nodeId) {
              onStartEditComment(nodeId, text);
            }
          }}
          sx={{
            opacity: 0.7,
            "&:hover": { opacity: 1 },
            color: colors.commentColor,
            fontSize: "0.8rem",
            padding: "1px",
            width: "16px",
            height: "16px",
            minWidth: "16px",
          }}
        >
          <Icon icon="mdi:pencil" style={{ fontSize: "12px" }} />
        </IconButton>
      )}
    </Box>
  );
};
