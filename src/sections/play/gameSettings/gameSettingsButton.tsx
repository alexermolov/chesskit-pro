import { Button } from "@mui/material";
import { useTranslation } from "next-i18next";
import { useState } from "react";
import GameSettingsDialog from "./gameSettingsDialog";
import { gameAtom } from "../states";
import { useAtomValue } from "jotai";

export default function GameSettingsButton() {
  const { t } = useTranslation("buttons");
  const [openDialog, setOpenDialog] = useState(false);
  const game = useAtomValue(gameAtom);

  return (
    <>
      <Button variant="contained" onClick={() => setOpenDialog(true)}>
        {game.history().length ? t("new_game") : t("start")}
      </Button>

      <GameSettingsDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
      />
    </>
  );
}
