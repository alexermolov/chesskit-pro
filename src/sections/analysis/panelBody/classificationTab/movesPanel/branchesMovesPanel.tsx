import { useChessActionsWithBranches } from "@/hooks/useChessActionsWithBranches";
import { Box, alpha } from "@mui/material";
import { useCallback } from "react";
import { boardAtom } from "../../../states";
import { PgnDisplay } from "./components/PgnDisplay";

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
        borderRadius: 1,
        backgroundColor: (theme) =>
          theme.palette.mode === "dark"
            ? alpha(theme.palette.background.paper, 0.6)
            : alpha(theme.palette.background.paper, 0.3),
        boxShadow: (theme) =>
          theme.palette.mode === "dark"
            ? `inset 0 0 5px ${alpha(theme.palette.common.black, 0.2)}`
            : `inset 0 0 5px ${alpha(theme.palette.common.black, 0.05)}`,
        scrollbarWidth: "thin",
        "&::-webkit-scrollbar": {
          width: "6px",
        },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: (theme) =>
            theme.palette.mode === "dark"
              ? alpha(theme.palette.common.white, 0.2)
              : alpha(theme.palette.common.black, 0.2),
          borderRadius: "3px",
        },
      }}
      id="moves-panel"
    >
      <Box
        sx={{
          fontSize: "0.95rem",
          fontFamily: "'Roboto Mono', monospace",
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
