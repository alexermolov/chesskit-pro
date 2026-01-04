import { Icon } from "@iconify/react";
import { Button, Typography } from "@mui/material";
import { useAtom } from "jotai";
import { useTranslation } from "next-i18next";
import { showMovesAtom } from "../../../states";

export default function ToggleMovesButton() {
  const { t } = useTranslation("chess");
  const [showMoves, setShowMoves] = useAtom(showMovesAtom);

  const handleToggle = () => {
    setShowMoves(!showMoves);
  };

  return (
    <Button
      variant="contained"
      onClick={handleToggle}
      size="small"
      color={showMoves ? "primary" : "inherit"}
      startIcon={
        <Icon icon={showMoves ? "mdi:eye" : "mdi:eye-off"} height={18} />
      }
      sx={{
        backgroundColor: showMoves ? "primary.main" : "action.hover",
        color: showMoves ? "primary.contrastText" : "text.primary",
        "&:hover": {
          backgroundColor: showMoves ? "primary.dark" : "action.selected",
        },
      }}
    >
      <Typography fontSize="0.9em" fontWeight="500" lineHeight="1.4em">
        {showMoves ? t("hide_moves") : t("show_moves")}
      </Typography>
    </Button>
  );
}
