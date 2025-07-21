import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { useChessActionsWithHistory } from "@/hooks/useChessActionsWithHistory";
import { boardAtom } from "@/sections/analysis/states";

export default function HistoryDebugger() {
  const {
    playMove,
    undoMove,
    redoMove,
    canUndo,
    canRedo,
    moveHistory,
    currentPosition,
  } = useChessActionsWithHistory(boardAtom);

  const makeTestMove = () => {
    playMove({ from: "e2", to: "e4" });
  };

  return (
    <Box sx={{ p: 2, border: 1, borderColor: "grey.300", m: 2 }}>
      <Typography variant="h6">History Debugger</Typography>

      <Typography>
        Position: {currentPosition + 1} / {moveHistory.length} moves
      </Typography>
      <Typography>
        Undo: {canUndo ? "✓" : "✗"} | Redo: {canRedo ? "✓" : "✗"}
      </Typography>

      <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
        <Button variant="outlined" onClick={makeTestMove}>
          Test Move (e4)
        </Button>
        <Button
          variant="outlined"
          onClick={undoMove}
          disabled={!canUndo}
          color="warning"
        >
          Undo
        </Button>
        <Button
          variant="outlined"
          onClick={redoMove}
          disabled={!canRedo}
          color="success"
        >
          Redo
        </Button>
      </Box>

      <Typography variant="caption" sx={{ mt: 2, display: "block" }}>
        History: {moveHistory
          .map(
            (move, i) =>
              `${move.san}${i === currentPosition ? "*" : ""}`
          )
          .join(" ")}
      </Typography>
    </Box>
  );
}
