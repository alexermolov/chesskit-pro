import { Button, Typography } from "@mui/material";
import { useState } from "react";
import NewGameDialog from "./loadGameDialog";
import { useTranslation } from "next-i18next";

interface Props {
  setPgn?: (pgn: string, gamesList?: any[]) => Promise<void>;
  label?: string;
  size?: "small" | "medium" | "large";
}

export default function LoadGameButtonWithPgn({ setPgn, label, size }: Props) {
  const { t } = useTranslation("common");
  const [openDialog, setOpenDialog] = useState(false);

  return (
    <>
      <Button
        variant="contained"
        onClick={() => setOpenDialog(true)}
        size={size}
      >
        <Typography fontSize="0.9em" fontWeight="500" lineHeight="1.4em">
          {label || t("add_game")}
        </Typography>
      </Button>

      <NewGameDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        setPgn={setPgn}
      />
    </>
  );
}
