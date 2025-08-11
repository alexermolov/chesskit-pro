import { useGameDatabase } from "@/hooks/useGameDatabase";
import { Icon } from "@iconify/react";
import { Grid2 as Grid, IconButton, Tooltip } from "@mui/material";
import { useAtomValue } from "jotai";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { boardAtom, gameAtom, gameEvalAtom, moveTreeAtom } from "../states";
import { getGameToSave } from "@/lib/chess";
import { MoveTreeUtils } from "@/types/moveTree";

export default function SaveButton() {
  const { t } = useTranslation("chess");
  const game = useAtomValue(gameAtom);
  const board = useAtomValue(boardAtom);
  const gameEval = useAtomValue(gameEvalAtom);
  const moveTree = useAtomValue(moveTreeAtom);
  const { addGame, addGameWithCustomPgn, setGameEval, gameFromUrl } =
    useGameDatabase();
  const router = useRouter();

  // Check for moves in the tree or in old atoms for compatibility
  const hasMovesInTree = Object.keys(moveTree.nodes).length > 1; // more than just root
  const enableSave =
    !gameFromUrl &&
    (hasMovesInTree || board.history().length || game.history().length);

  const handleSave = async () => {
    if (!enableSave) return;

    let gameId: number;

    // If there is a move tree with branches, use the new method
    if (hasMovesInTree) {
      // Get PGN with branches
      const pgnWithBranches = MoveTreeUtils.toPgn(moveTree);

      // Use the new method for saving with custom PGN
      gameId = await addGameWithCustomPgn(game, pgnWithBranches);
    } else {
      // Fallback to the old method for compatibility
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
        <Tooltip title={t("game_saved_in_database")}>
          <Grid>
            <IconButton disabled={true} sx={{ paddingX: 1.2, paddingY: 0.5 }}>
              <Icon icon="ri:folder-check-line" />
            </IconButton>
          </Grid>
        </Tooltip>
      ) : (
        <Tooltip title={t("save_game")}>
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
