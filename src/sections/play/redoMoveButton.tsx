import { Button } from "@mui/material";
import { gameAtom } from "./states";
import { useTranslation } from "next-i18next";
import { useChessActionsWithHistory } from "@/hooks/useChessActionsWithHistory";

export default function RedoMoveButton() {
  const { t } = useTranslation("chess");
  const { redoMove, canRedo } = useChessActionsWithHistory(gameAtom);

  const handleClick = () => {
    if (canRedo) {
      redoMove();
    }
  };

  return (
    <Button variant="outlined" onClick={handleClick} disabled={!canRedo}>
      {t("redo_move_button")}
    </Button>
  );
}
