import { useGameDatabase } from "@/hooks/useGameDatabase";
import { getGameToSave } from "@/lib/chess";
import { MoveTreeUtils } from "@/types/moveTree";
import { Icon } from "@iconify/react";
import { Grid2 as Grid, IconButton, Tooltip } from "@mui/material";
import { Chess, DEFAULT_POSITION } from "chess.js";
import { useAtom, useAtomValue } from "jotai";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { boardAtom, gameAtom, gameEvalAtom, moveTreeAtom } from "../states";

export default function SaveAndNewButton() {
  const { t } = useTranslation("buttons");
  const [game, setGame] = useAtom(gameAtom);
  const [board, setBoard] = useAtom(boardAtom);
  const gameEval = useAtomValue(gameEvalAtom);
  const [moveTree, setMoveTree] = useAtom(moveTreeAtom);
  const { addGame, addGameWithCustomPgn, setGameEval } = useGameDatabase();
  const router = useRouter();

  // Check for moves in the tree or in old atoms for compatibility
  const hasMovesInTree = Object.keys(moveTree.nodes).length > 1; // more than just root
  const enableSave =
    hasMovesInTree || board.history().length || game.history().length;

  const handleSaveAndNew = async () => {
    if (!enableSave) return;

    // First save the current game
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

    // Then reset the state for a new game
    setGame(new Chess());
    setBoard(new Chess());
    setMoveTree(MoveTreeUtils.createEmptyTree(DEFAULT_POSITION));

    // Reset URL to remove binding to the saved game
    router.replace(
      {
        pathname: router.pathname,
        query: {}, // Remove gameId parameter
      },
      undefined,
      { shallow: true, scroll: false }
    );
  };

  return (
    <Tooltip title={t("save_and_new")}>
      <Grid>
        <IconButton
          onClick={handleSaveAndNew}
          disabled={!enableSave}
          sx={{ paddingX: 1.2, paddingY: 0.5 }}
        >
          <Icon icon="ri:save-line" />
        </IconButton>
      </Grid>
    </Tooltip>
  );
}
