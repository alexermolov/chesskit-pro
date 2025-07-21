import { Button } from "@mui/material";
import { gameAtom, playerColorAtom } from "./states";
import { useAtomValue } from "jotai";
import { useChessActionsWithHistory } from "@/hooks/useChessActionsWithHistory";
import { Color } from "@/types/enums";

export default function UndoMoveButton() {
  const game = useAtomValue(gameAtom);
  const { goToMove, undoMove, canUndo } = useChessActionsWithHistory(gameAtom);
  const playerColor = useAtomValue(playerColorAtom);

  const handleClick = () => {
    if (!canUndo) return;

    const gameHistory = game.history();
    const turnColor = game.turn();
    if (
      (turnColor === "w" && playerColor === Color.White) ||
      (turnColor === "b" && playerColor === Color.Black)
    ) {
      if (gameHistory.length < 2) return;
      goToMove(gameHistory.length - 2, game);
    } else {
      if (!gameHistory.length) return;
      undoMove();
    }
  };

  return (
    <Button variant="outlined" onClick={handleClick} disabled={!canUndo}>
      Undo your last move
    </Button>
  );
}
