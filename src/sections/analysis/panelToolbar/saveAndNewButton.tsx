import { useGameDatabase } from "@/hooks/useGameDatabase";
import { Icon } from "@iconify/react";
import { Grid2 as Grid, IconButton, Tooltip } from "@mui/material";
import { useAtomValue, useSetAtom } from "jotai";
import { useRouter } from "next/router";
import { boardAtom, gameAtom, gameEvalAtom, moveTreeAtom } from "../states";
import { getGameToSave } from "@/lib/chess";
import { MoveTreeUtils } from "@/types/moveTree";
import { Chess, DEFAULT_POSITION } from "chess.js";

export default function SaveAndNewButton() {
  const game = useAtomValue(gameAtom);
  const board = useAtomValue(boardAtom);
  const gameEval = useAtomValue(gameEvalAtom);
  const moveTree = useAtomValue(moveTreeAtom);
  const setGame = useSetAtom(gameAtom);
  const setBoard = useSetAtom(boardAtom);
  const setGameEval = useSetAtom(gameEvalAtom);
  const setMoveTree = useSetAtom(moveTreeAtom);

  const {
    addGame,
    addGameWithCustomPgn,
    setGameEval: saveGameEval,
  } = useGameDatabase();
  const router = useRouter();

  // Проверяем наличие ходов в дереве или в старых атомах для совместимости
  const hasMovesInTree = Object.keys(moveTree.nodes).length > 1; // больше чем только root
  const enableSave =
    hasMovesInTree || board.history().length || game.history().length;

  const handleSaveAndNew = async () => {
    if (!enableSave) return;

    // Сначала сохраняем текущую игру
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
      await saveGameEval(gameId, gameEval);
    }

    // Затем сбрасываем состояние для новой игры
    setGame(new Chess());
    setBoard(new Chess());
    setGameEval(undefined);
    setMoveTree(MoveTreeUtils.createEmptyTree(DEFAULT_POSITION));

    // Сбрасываем URL, чтобы не было привязки к сохраненной игре
    router.replace(
      {
        pathname: router.pathname,
        query: {}, // Убираем параметр gameId
      },
      undefined,
      { shallow: true, scroll: false }
    );
  };

  return (
    <Tooltip title="Save game and start new">
      <Grid>
        <IconButton
          onClick={handleSaveAndNew}
          disabled={!enableSave}
          sx={{ paddingX: 1.2, paddingY: 0.5 }}
        >
          <Icon icon="mdi:content-save-plus" />
        </IconButton>
      </Grid>
    </Tooltip>
  );
}
