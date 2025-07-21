import { Icon } from "@iconify/react";
import { Grid2 as Grid, IconButton, Tooltip } from "@mui/material";
import { useAtomValue } from "jotai";
import { boardAtom, gameAtom } from "../states";
import { useChessActionsWithHistory } from "@/hooks/useChessActionsWithHistory";
import { useCallback, useEffect } from "react";

export default function NextMoveButton() {
  const {
    playMove: playBoardMove,
    redoMove,
    canRedo,
  } = useChessActionsWithHistory(boardAtom);
  const game = useAtomValue(gameAtom);
  const board = useAtomValue(boardAtom);

  const gameHistory = game.history();
  const boardHistory = board.history();

  // Проверяем, можем ли мы добавить следующий ход из игры
  const canPlayNextGameMove =
    boardHistory.length < gameHistory.length &&
    gameHistory.slice(0, boardHistory.length).join() === boardHistory.join();

  const addNextGameMoveToBoard = useCallback(() => {
    // Сначала пытаемся повторить отмененный ход
    if (canRedo) {
      redoMove();
      return;
    }

    // Если нет отмененных ходов, добавляем следующий ход из игры
    if (!canPlayNextGameMove) return;

    const nextMoveIndex = boardHistory.length;
    const nextMove = game.history({ verbose: true })[nextMoveIndex];
    const comment = game
      .getComments()
      .find((c) => c.fen === nextMove.after)?.comment;

    if (nextMove) {
      playBoardMove({
        from: nextMove.from,
        to: nextMove.to,
        promotion: nextMove.promotion,
        comment,
      });
    }
  }, [
    canRedo,
    redoMove,
    canPlayNextGameMove,
    boardHistory,
    game,
    playBoardMove,
  ]);

  const isButtonEnabled = canRedo || canPlayNextGameMove;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        addNextGameMoveToBoard();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [addNextGameMoveToBoard]);

  return (
    <Tooltip title="Go to next move (Redo or next from game)">
      <Grid>
        <IconButton
          onClick={() => addNextGameMoveToBoard()}
          disabled={!isButtonEnabled}
          sx={{ paddingX: 1.2, paddingY: 0.5 }}
        >
          <Icon icon="ri:arrow-right-s-line" height={30} />
        </IconButton>
      </Grid>
    </Tooltip>
  );
}
