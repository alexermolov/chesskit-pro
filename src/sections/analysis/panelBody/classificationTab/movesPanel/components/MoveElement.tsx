import { Icon } from "@iconify/react";
import { Box, Chip, IconButton, Menu, MenuItem, Tooltip } from "@mui/material";
import { useCallback, useState } from "react";
import { hasRealComment } from "@/lib/helpers";
import { useTranslation } from "next-i18next";

interface MoveElementProps {
  id: string;
  text: string;
  nodeId: string;
  isCurrentMove: boolean;
  isInVariation: boolean;
  comment?: string | null;
  onMoveClick: (nodeId: string) => void;
  onStartEditComment: (nodeId: string, comment: string) => void;
  onPromoteToMainLine?: (nodeId: string) => void;
  indentStyle: object;
  colors: any;
  theme: any;
}

export const MoveElement = ({
  id,
  text,
  nodeId,
  isCurrentMove,
  isInVariation,
  comment,
  onMoveClick,
  onStartEditComment,
  onPromoteToMainLine,
  indentStyle,
  colors,
  theme,
}: MoveElementProps) => {
  const { t } = useTranslation("chess");
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
  } | null>(null);

  const handleContextMenu = useCallback(
    (event: React.MouseEvent) => {
      // Only show context menu if node is in a variation and promote function is available
      if (isInVariation && onPromoteToMainLine) {
        event.preventDefault();
        setContextMenu(
          contextMenu === null
            ? {
                mouseX: event.clientX + 2,
                mouseY: event.clientY - 6,
              }
            : null
        );
      }
    },
    [isInVariation, onPromoteToMainLine, contextMenu]
  );

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handlePromoteToMainLine = useCallback(() => {
    if (onPromoteToMainLine && nodeId) {
      onPromoteToMainLine(nodeId);
    }
    handleCloseContextMenu();
  }, [onPromoteToMainLine, nodeId, handleCloseContextMenu]);

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
        title={`Click - go to move, Double click - ${hasActualComment ? "edit comment" : "add comment"}${isInVariation && onPromoteToMainLine ? ", Right click - promote to main line" : ""}`}
        arrow
        enterDelay={700}
      >
        <Chip
          label={text}
          onClick={() => nodeId && onMoveClick(nodeId)}
          onDoubleClick={handleDoubleClick}
          onContextMenu={handleContextMenu}
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

      {/* Context menu for promoting to main line */}
      <Menu
        open={contextMenu !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={handlePromoteToMainLine}>
          <Icon
            icon="mdi:arrow-up-bold"
            style={{ marginRight: "8px", fontSize: "18px" }}
          />
          {t("promote_to_main_line")}
        </MenuItem>
      </Menu>

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
