import { useGameDatabase } from "@/hooks/useGameDatabase";
import { Icon } from "@iconify/react";
import { Grid2 as Grid, IconButton, Tooltip } from "@mui/material";
import { useAtomValue } from "jotai";
import { useRouter } from "next/router";
import { boardAtom, gameAtom, gameEvalAtom, moveTreeAtom } from "../states";
import { getGameToSave } from "@/lib/chess";
import { MoveTreeUtils } from "@/types/moveTree";

export default function SaveButton() {
  const game = useAtomValue(gameAtom);
  const board = useAtomValue(boardAtom);
  const gameEval = useAtomValue(gameEvalAtom);
  const moveTree = useAtomValue(moveTreeAtom);
  const { addGame, addGameWithCustomPgn, setGameEval, gameFromUrl } =
    useGameDatabase();
  const router = useRouter();

  // Проверяем наличие ходов в дереве или в старых атомах для совместимости
  const hasMovesInTree = Object.keys(moveTree.nodes).length > 1; // больше чем только root
  const enableSave =
    !gameFromUrl &&
    (hasMovesInTree || board.history().length || game.history().length);

  const handleSave = async () => {
    if (!enableSave) return;

    let gameId: number;

    // Если есть дерево ходов с ветками, используем новый метод
    if (hasMovesInTree) {
      // Получаем PGN с ветками
      const pgnWithBranches = MoveTreeUtils.toPgn(moveTree);

      // Используем новый метод для сохранения с кастомным PGN
      gameId = await addGameWithCustomPgn(game, pgnWithBranches);
    } else {
      // Fallback к старому методу для совместимости
      const gameToSave = getGameToSave(game, board);
      gameId = await addGame(gameToSave);
    }

    if (gameEval) {
      await setGameEval(gameId, gameEval);
    }

    router.replace(
      {
        query: { gameId: gameId },
        pathname: router.pathname,
      },
      undefined,
      { shallow: true, scroll: false }
    );
  };

  return (
    <>
      {gameFromUrl ? (
        <Tooltip title="Game saved in database">
          <Grid>
            <IconButton disabled={true} sx={{ paddingX: 1.2, paddingY: 0.5 }}>
              <Icon icon="ri:folder-check-line" />
            </IconButton>
          </Grid>
        </Tooltip>
      ) : (
        <Tooltip title="Save game">
          <Grid>
            <IconButton
              onClick={handleSave}
              disabled={!enableSave}
              sx={{ paddingX: 1.2, paddingY: 0.5 }}
            >
              <Icon icon="ri:save-3-line" />
            </IconButton>
          </Grid>
        </Tooltip>
      )}
    </>
  );
}
