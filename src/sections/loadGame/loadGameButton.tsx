import { Button, Typography } from "@mui/material";
import { useTranslation } from "next-i18next";
import { useState } from "react";
import NewGameDialog from "./loadGameDialog";
import { Chess } from "chess.js";

interface Props {
  setGame?: (game: Chess) => Promise<void>;
  label?: string;
  size?: "small" | "medium" | "large";
}

export default function LoadGameButton({ setGame, label, size }: Props) {
  const { t } = useTranslation("buttons");
  const [openDialog, setOpenDialog] = useState(false);

  return (
    <>
      <Button
        variant="contained"
        onClick={() => setOpenDialog(true)}
        size={size}
      >
        <Typography fontSize="0.9em" fontWeight="500" lineHeight="1.4em">
          {label || t("load_game")}
        </Typography>
      </Button>

      <NewGameDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        setGame={setGame}
      />
    </>
  );
}
