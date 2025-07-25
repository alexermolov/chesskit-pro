import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { useChessActionsWithHistory } from "@/hooks/useChessActionsWithHistory";
import { useChessActionsWithBranches } from "@/hooks/useChessActionsWithBranches";
import { boardAtom } from "@/sections/analysis/states";
import BranchManager from "./BranchManager";

export default function HistoryDebugger() {
  // Тестируем оба хука
  const {
    undoMove: undoMoveLinear,
    redoMove: redoMoveLinear,
    canUndo: canUndoLinear,
    canRedo: canRedoLinear,
    moveHistory,
    currentPosition,
  } = useChessActionsWithHistory(boardAtom);

  const {
    playMove: playMoveBranched,
    undoMove: undoMoveBranched,
    redoMove: redoMoveBranched,
    canUndo: canUndoBranched,
    canRedo: canRedoBranched,
    branches,
  } = useChessActionsWithBranches(boardAtom);

  const makeTestMove = () => {
    playMoveBranched({ from: "e2", to: "e4" });
  };

  const makeAlternativeMove = () => {
    playMoveBranched({ from: "d2", to: "d4" });
  };

  return (
    <Box sx={{ p: 2, display: "flex", gap: 2 }}>
      {/* Линейная история */}
      <Box sx={{ border: 1, borderColor: "grey.300", p: 2, minWidth: 300 }}>
        <Typography variant="h6">Линейная история</Typography>
        <Typography>
          Position: {currentPosition + 1} / {moveHistory.length} moves
        </Typography>
        <Typography>
          Undo: {canUndoLinear ? "✓" : "✗"} | Redo: {canRedoLinear ? "✓" : "✗"}
        </Typography>

        <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button variant="outlined" onClick={makeTestMove}>
            e4
          </Button>
          <Button variant="outlined" onClick={makeAlternativeMove}>
            d4
          </Button>
          <Button
            variant="outlined"
            onClick={undoMoveLinear}
            disabled={!canUndoLinear}
            color="warning"
          >
            Undo
          </Button>
          <Button
            variant="outlined"
            onClick={redoMoveLinear}
            disabled={!canRedoLinear}
            color="success"
          >
            Redo
          </Button>
        </Box>

        <Typography variant="caption" sx={{ mt: 2, display: "block" }}>
          History:{" "}
          {moveHistory
            .map((move, i) => `${move.san}${i === currentPosition ? "*" : ""}`)
            .join(" ")}
        </Typography>
      </Box>

      {/* Ветвящаяся история */}
      <Box sx={{ border: 1, borderColor: "grey.300", p: 2, minWidth: 300 }}>
        <Typography variant="h6">Ветвящаяся история</Typography>
        <Typography>Веток: {branches.length}</Typography>
        <Typography>
          Undo: {canUndoBranched ? "✓" : "✗"} | Redo:{" "}
          {canRedoBranched ? "✓" : "✗"}
        </Typography>

        <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button variant="outlined" onClick={makeTestMove}>
            e4
          </Button>
          <Button variant="outlined" onClick={makeAlternativeMove}>
            d4
          </Button>
          <Button
            variant="outlined"
            onClick={undoMoveBranched}
            disabled={!canUndoBranched}
            color="warning"
          >
            Undo
          </Button>
          <Button
            variant="outlined"
            onClick={redoMoveBranched}
            disabled={!canRedoBranched}
            color="success"
          >
            Redo
          </Button>
        </Box>

        <Typography variant="caption" sx={{ mt: 2, display: "block" }}>
          Branches:{" "}
          {branches.map((b) => `${b.name}(${b.moveCount})`).join(", ")}
        </Typography>
      </Box>

      {/* Менеджер веток */}
      <BranchManager />
    </Box>
  );
}
