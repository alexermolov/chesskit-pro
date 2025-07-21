import { Grid2 as Grid, IconButton, Tooltip } from "@mui/material";
import { Icon } from "@iconify/react";
import { useAtomValue } from "jotai";
import { boardAtom, gameAtom } from "../states";
import { useChessActionsWithHistory } from "@/hooks/useChessActionsWithHistory";
import FlipBoardButton from "./flipBoardButton";
import NextMoveButton from "./nextMoveButton";
import RedoMoveButton from "./redoMoveButton";
import GoToLastPositionButton from "./goToLastPositionButton";
import SaveButton from "./saveButton";
import { useEffect } from "react";

export default function PanelToolBar() {
  const board = useAtomValue(boardAtom);
  const {
    resetToStartingPosition: resetBoard,
    undoMove: undoBoardMove,
    canUndo,
  } = useChessActionsWithHistory(boardAtom);

  const boardHistory = board.history();
  const game = useAtomValue(gameAtom);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        if (canUndo) undoBoardMove();
      } else if (e.key === "ArrowDown") {
        resetBoard();
      }
      // Добавляем поддержку Ctrl+Z для отмены
      else if (e.ctrlKey && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) undoBoardMove();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [undoBoardMove, resetBoard, canUndo]);

  return (
    <Grid container justifyContent="center" alignItems="center" size={12}>
      <FlipBoardButton />

      <Tooltip title="Reset board">
        <Grid>
          <IconButton
            onClick={() => resetBoard()}
            disabled={boardHistory.length === 0}
            sx={{ paddingX: 1.2, paddingY: 0.5 }}
          >
            <Icon icon="ri:skip-back-line" />
          </IconButton>
        </Grid>
      </Tooltip>

      <Tooltip title="Go to previous move (Ctrl+Z)">
        <Grid>
          <IconButton
            onClick={() => undoBoardMove()}
            disabled={!canUndo}
            sx={{ paddingX: 1.2, paddingY: 0.5 }}
          >
            <Icon icon="ri:arrow-left-s-line" height={30} />
          </IconButton>
        </Grid>
      </Tooltip>

      <RedoMoveButton />

      <NextMoveButton />

      <GoToLastPositionButton />

      <Tooltip title="Copy pgn">
        <Grid>
          <IconButton
            disabled={game.history().length === 0}
            onClick={() => {
              navigator.clipboard?.writeText?.(game.pgn());
            }}
            sx={{ paddingX: 1.2, paddingY: 0.5 }}
          >
            <Icon icon="ri:clipboard-line" />
          </IconButton>
        </Grid>
      </Tooltip>

      <SaveButton />
    </Grid>
  );
}
