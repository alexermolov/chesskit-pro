import { Button } from "@mui/material";
import { gameAtom } from "./states";
import { useChessActionsWithHistory } from "@/hooks/useChessActionsWithHistory";

export default function RedoMoveButton() {
  const { redoMove, canRedo } = useChessActionsWithHistory(gameAtom);

  const handleClick = () => {
    if (canRedo) {
      redoMove();
    }
  };

  return (
    <Button variant="outlined" onClick={handleClick} disabled={!canRedo}>
      Redo move
    </Button>
  );
}
