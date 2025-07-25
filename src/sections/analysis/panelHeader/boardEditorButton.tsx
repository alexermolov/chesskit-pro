import BoardEditorModal from "@/components/BoardEditorModal";
import { useChessActionsWithBranches } from "@/hooks/useChessActionsWithBranches";
import { Icon } from "@iconify/react";
import { Button, Typography } from "@mui/material";
import { useAtom, useSetAtom } from "jotai";
import { useCallback, useState } from "react";
import {
  boardAtom,
  currentPositionAtom,
  evaluationProgressAtom,
  gameAtom,
  gameEvalAtom,
} from "../states";

export default function BoardEditorButton() {
  const [open, setOpen] = useState(false);
  const [board] = useAtom(boardAtom);

  const { reset: resetBoard } = useChessActionsWithBranches(boardAtom);
  const { reset: resetGame } = useChessActionsWithBranches(gameAtom);
  const setEval = useSetAtom(gameEvalAtom);
  const setCurrentPosition = useSetAtom(currentPositionAtom);
  const setEvaluationProgress = useSetAtom(evaluationProgressAtom);

  const resetAndSetFen = useCallback(
    async (fen: string) => {
      resetBoard({ fen, noHeaders: true });
      resetGame({ fen, noHeaders: true });

      // Clear evaluation data
      setEval(undefined);
      setCurrentPosition({});
      setEvaluationProgress(0);
    },
    [resetBoard, resetGame, setEval, setCurrentPosition, setEvaluationProgress]
  );

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleLoadPosition = (fen: string) => {
    resetAndSetFen(fen);
  };

  return (
    <>
      <Button
        variant="contained"
        onClick={handleOpen}
        size="small"
        color="primary"
        startIcon={<Icon icon="mdi:pencil" height={18} />}
        sx={{
          "&:hover": {
            backgroundColor: "primary.dark",
          },
        }}
      >
        <Typography fontSize="0.9em" fontWeight="500" lineHeight="1.4em">
          Edit board
        </Typography>
      </Button>

      <BoardEditorModal
        open={open}
        onClose={handleClose}
        onLoadPosition={handleLoadPosition}
        initialFen={board.fen()}
      />
    </>
  );
}
