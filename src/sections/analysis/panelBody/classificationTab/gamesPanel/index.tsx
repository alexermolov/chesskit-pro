import { useChessActionsWithBranches } from "@/hooks/useChessActionsWithBranches";
import { formatDate } from "@/lib/helpers";
import { Box, Button, Typography } from "@mui/material";
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback } from "react";
import { gameAtom, gameEvalAtom } from "../../../states";
import { GameInfo, gamesListAtom } from "../../../states/gamesListState";

export default function GamesPanel() {
  const gamesList = useAtomValue(gamesListAtom);
  const { setPgn, reset } = useChessActionsWithBranches(gameAtom);
  const setEval = useSetAtom(gameEvalAtom);

  // Обновленная функция загрузки игры
  const handleLoadGame = useCallback(
    (game: GameInfo) => {
      reset();
      setEval(undefined);
      setPgn(game.pgn);
    },
    [reset, setEval, setPgn]
  );

  if (gamesList.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: "center", height: "100%" }}>
        <Typography variant="body1" color="text.secondary" component="div">
          No games available. Load a PGN file containing multiple games to see
          them here.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: "100%", overflow: "auto", p: 2 }}>
      <Typography variant="h6" component="div" sx={{ mb: 2 }}>
        Games List ({gamesList.length})
      </Typography>

      {gamesList.map((game) => (
        <Box
          key={game.id}
          sx={{
            p: 2,
            mb: 1.5,
            border: "1px solid #e0e0e0",
            borderRadius: 1,
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            "&:hover": {
              backgroundColor: "rgba(59, 154, 198, 0.08)",
            },
          }}
        >
          <Box sx={{ flexGrow: 1, pr: 2 }}>
            <Typography variant="subtitle1" component="div" fontWeight="medium">
              {game.white} vs {game.black}
            </Typography>

            <Typography
              variant="body2"
              component="div"
              color="text.secondary"
              sx={{ mt: 0.5 }}
            >
              {game.result} •{" "}
              {game.date ? formatDate(new Date(game.date)) : "No date"}
            </Typography>

            {game.headers.Event && (
              <Typography
                variant="body2"
                component="div"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                {game.headers.Event}
              </Typography>
            )}
          </Box>

          <Button
            variant="contained"
            size="small"
            onClick={() => handleLoadGame(game)}
          >
            Загрузить
          </Button>
        </Box>
      ))}
    </Box>
  );
}
