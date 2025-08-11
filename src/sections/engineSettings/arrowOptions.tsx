import { Checkbox, FormControlLabel, Grid2 as Grid } from "@mui/material";
import { useTranslation } from "next-i18next";
import {
  showBestMoveArrowAtom,
  showPlayerMoveIconAtom,
} from "../analysis/states";
import { useAtomLocalStorage } from "@/hooks/useAtomLocalStorage";

export default function ArrowOptions() {
  const { t } = useTranslation("chess");
  const [showBestMove, setShowBestMove] = useAtomLocalStorage(
    "show-arrow-best-move",
    showBestMoveArrowAtom
  );
  const [showPlayerMoveIcon, setShowPlayerMoveIcon] = useAtomLocalStorage(
    "show-icon-player-move",
    showPlayerMoveIconAtom
  );

  return (
    <Grid
      container
      justifyContent="space-evenly"
      alignItems="center"
      size={12}
      gap={3}
    >
      <FormControlLabel
        control={
          <Checkbox
            checked={showBestMove}
            onChange={(_, checked) => setShowBestMove(checked)}
          />
        }
        label={t("show_engine_best_move_arrow")}
        sx={{ marginX: 0 }}
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={showPlayerMoveIcon}
            onChange={(_, checked) => setShowPlayerMoveIcon(checked)}
          />
        }
        label={t("show_played_move_icon")}
        sx={{ marginX: 0 }}
      />
    </Grid>
  );
}
