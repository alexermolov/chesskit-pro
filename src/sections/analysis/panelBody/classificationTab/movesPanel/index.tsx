import { Grid2 as Grid, Button, Box } from "@mui/material";
import MovesLine from "./movesLine";
import BranchesMovesPanel from "./branchesMovesPanel";
import { useMemo, useState } from "react";
import { useAtomValue } from "jotai";
import { boardAtom, gameAtom, gameEvalAtom } from "../../../states";
import { MoveClassification } from "@/types/enums";

export default function MovesPanel() {
  const [useBranches, setUseBranches] = useState(true); // По умолчанию используем ветки
  const game = useAtomValue(gameAtom);
  const board = useAtomValue(boardAtom);
  const gameEval = useAtomValue(gameEvalAtom);

  const gameMoves = useMemo(() => {
    const gameHistory = game.history();
    const boardHistory = board.history();
    const history = gameHistory.length ? gameHistory : boardHistory;

    if (!history.length) return undefined;

    const moves: { san: string; moveClassification?: MoveClassification }[][] =
      [];

    for (let i = 0; i < history.length; i += 2) {
      const items = [
        {
          san: history[i],
          moveClassification: gameHistory.length
            ? gameEval?.positions[i + 1]?.moveClassification
            : undefined,
        },
      ];

      if (history[i + 1]) {
        items.push({
          san: history[i + 1],
          moveClassification: gameHistory.length
            ? gameEval?.positions[i + 2]?.moveClassification
            : undefined,
        });
      }

      moves.push(items);
    }

    return moves;
  }, [game, board, gameEval]);

  // Если используем ветки, показываем новый компонент
  if (useBranches) {
    return (
      <Grid
        container
        justifyContent="center"
        alignItems="start"
        gap={0.5}
        paddingY={1}
        sx={{ scrollbarWidth: "thin", overflowY: "auto" }}
        maxHeight="100%"
        size={6}
        id="moves-panel"
      >
        <Box
          sx={{
            width: "100%",
            mb: 1,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Button
            size="small"
            variant="outlined"
            onClick={() => setUseBranches(false)}
            sx={{ fontSize: "0.7rem" }}
          >
            Переключить на линейный режим
          </Button>
        </Box>
        <BranchesMovesPanel />
      </Grid>
    );
  }

  // Оригинальный линейный режим
  if (!gameMoves?.length) return null;

  return (
    <Grid
      container
      justifyContent="center"
      alignItems="start"
      gap={0.5}
      paddingY={1}
      sx={{ scrollbarWidth: "thin", overflowY: "auto" }}
      maxHeight="100%"
      size={6}
      id="moves-panel"
    >
      <Box
        sx={{ width: "100%", mb: 1, display: "flex", justifyContent: "center" }}
      >
        <Button
          size="small"
          variant="outlined"
          onClick={() => setUseBranches(true)}
          sx={{ fontSize: "0.7rem" }}
        >
          Переключить на режим веток
        </Button>
      </Box>

      {gameMoves?.map((moves, idx) => (
        <MovesLine
          key={`${moves.map(({ san }) => san).join()}-${idx}`}
          moves={moves}
          moveNb={idx + 1}
        />
      ))}
    </Grid>
  );
}
