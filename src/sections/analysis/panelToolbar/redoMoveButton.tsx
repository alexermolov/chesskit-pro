import { Icon } from "@iconify/react";
import { Grid2 as Grid, IconButton, Tooltip } from "@mui/material";
import { useChessActionsWithHistory } from "@/hooks/useChessActionsWithHistory";
import { boardAtom } from "../states";
import { useCallback, useEffect } from "react";

export default function RedoMoveButton() {
  const { redoMove, canRedo } = useChessActionsWithHistory(boardAtom);

  const handleRedoMove = useCallback(() => {
    if (canRedo) {
      redoMove();
    }
  }, [canRedo, redoMove]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Y или Ctrl+Shift+Z для повтора
      if (
        (e.ctrlKey && e.key === "y") ||
        (e.ctrlKey && e.shiftKey && e.key === "Z")
      ) {
        e.preventDefault();
        handleRedoMove();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [handleRedoMove]);

  return (
    <Tooltip title="Redo move (Ctrl+Y)">
      <Grid>
        <IconButton
          onClick={handleRedoMove}
          disabled={!canRedo}
          sx={{ paddingX: 1.2, paddingY: 0.5 }}
        >
          <Icon icon="ri:arrow-go-forward-line" height={30} />
        </IconButton>
      </Grid>
    </Tooltip>
  );
}
