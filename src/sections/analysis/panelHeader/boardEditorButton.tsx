import BoardEditorModal from "@/components/BoardEditorModal";
import { useChessActions } from "@/hooks/useChessActions";
import { Icon } from "@iconify/react";
import { IconButton, Tooltip } from "@mui/material";
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

  const { reset: resetBoard } = useChessActions(boardAtom);
  const { reset: resetGame } = useChessActions(gameAtom);
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
      <Tooltip title="Edit board position">
        <IconButton
          onClick={handleOpen}
          size="small"
          sx={{
            backgroundColor: "action.hover",
            color: "text.primary",
            "&:hover": {
              backgroundColor: "action.selected",
            },
          }}
        >
          <Icon icon="mdi:pencil" height={16} />
        </IconButton>
      </Tooltip>

      <BoardEditorModal
        open={open}
        onClose={handleClose}
        onLoadPosition={handleLoadPosition}
        initialFen={board.fen()}
      />
    </>
  );
}
