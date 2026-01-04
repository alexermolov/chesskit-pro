import { useChessActionsWithBranches } from "@/hooks/useChessActionsWithBranches";
import { Box, alpha } from "@mui/material";
import { useCallback } from "react";
import { boardAtom, showMovesAtom } from "../../../states";
import { VariationsTableDisplay } from "./components/VariationsTableDisplay";
import { useAtomValue } from "jotai";
import ParticleHideEffect from "@/components/ParticleHideEffect";

export default function VariationsPanel() {
  const { goToNode, moveTree } = useChessActionsWithBranches(boardAtom);
  const showMoves = useAtomValue(showMovesAtom);

  // Function to navigate to a specific move by nodeId
  const handleMoveClick = useCallback(
    (nodeId: string) => {
      goToNode(nodeId);
    },
    [goToNode]
  );

  return (
    <Box
      sx={{
        width: "100%",
        minWidth: 0,
        height: "100%",
        overflowY: "auto",
        overflowX: "auto",
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
          height: "6px",
        },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: (theme) =>
            theme.palette.mode === "dark"
              ? alpha(theme.palette.common.white, 0.2)
              : alpha(theme.palette.common.black, 0.2),
          borderRadius: "3px",
        },
      }}
      id="variations-panel"
    >
      <ParticleHideEffect isHidden={!showMoves}>
        <Box
          sx={{
            fontSize: "0.95rem",
            fontFamily: "'Roboto Mono', monospace",
            width: "100%",
            boxSizing: "border-box",
            padding: 1,
            paddingBottom: 2,
          }}
        >
          <VariationsTableDisplay
            moveTree={moveTree}
            onMoveClick={handleMoveClick}
            currentNodeId={moveTree?.currentNodeId || ""}
          />
        </Box>
      </ParticleHideEffect>
    </Box>
  );
}
