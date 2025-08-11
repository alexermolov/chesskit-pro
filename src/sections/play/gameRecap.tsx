import { useAtomValue } from "jotai";
import { gameAtom, isGameInProgressAtom, playerColorAtom } from "./states";
import { Button, Grid2 as Grid, Typography } from "@mui/material";
import { Color } from "@/types/enums";
import { setGameHeaders } from "@/lib/chess";
import { useGameDatabase } from "@/hooks/useGameDatabase";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { safeNavigate } from "@/lib/electronUtils";

export default function GameRecap() {
  const { t } = useTranslation("chess");
  const game = useAtomValue(gameAtom);
  const playerColor = useAtomValue(playerColorAtom);
  const isGameInProgress = useAtomValue(isGameInProgressAtom);
  const { addGame } = useGameDatabase();
  const router = useRouter();

  if (isGameInProgress || !game.history().length) return null;

  const getResultLabel = () => {
    if (game.isCheckmate()) {
      const winnerColor = game.turn() === "w" ? Color.Black : Color.White;
      const winnerLabel = winnerColor === playerColor ? "You" : "Stockfish";
      return winnerLabel === "You"
        ? t("you_won_by_checkmate")
        : t("stockfish_won_by_checkmate");
    }
    if (game.isInsufficientMaterial())
      return t("draw_by_insufficient_material");
    if (game.isStalemate()) return t("draw_by_stalemate");
    if (game.isThreefoldRepetition()) return t("draw_by_threefold_repetition");
    if (game.isDraw()) return t("draw_by_fifty_move_rule");

    return t("you_resigned");
  };

  const handleOpenGameAnalysis = async () => {
    const gameToAnalysis = setGameHeaders(game, {
      resigned: !game.isGameOver() ? playerColor : undefined,
    });
    const gameId = await addGame(gameToAnalysis);

    // Используем безопасную навигацию для Electron
    safeNavigate(router, "/", { gameId });
  };

  return (
    <Grid
      container
      justifyContent="center"
      alignItems="center"
      gap={2}
      size={12}
    >
      <Grid container justifyContent="center" size={12}>
        <Typography>{getResultLabel()}</Typography>
      </Grid>

      <Button variant="outlined" onClick={handleOpenGameAnalysis}>
        {t("open_game_analysis")}
      </Button>
    </Grid>
  );
}
