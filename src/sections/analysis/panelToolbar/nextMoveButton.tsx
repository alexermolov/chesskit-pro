import { useBranchNavigation } from "@/hooks/useBranchNavigation";
import { useChessActionsWithBranches } from "@/hooks/useChessActionsWithBranches";
import { Icon } from "@iconify/react";
import {
  Grid2 as Grid,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
} from "@mui/material";
import { useAtomValue } from "jotai";
import { useTranslation } from "next-i18next";
import { useCallback, useEffect, useState } from "react";
import { boardAtom, gameAtom } from "../states";

export default function NextMoveButton() {
  const { t } = useTranslation("chess");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const game = useAtomValue(gameAtom);

  const { canRedo, getAlternativeMoves } =
    useChessActionsWithBranches(boardAtom);

  // Hook for navigation with modal window
  const { redoMove: redoMoveWithModal } = useBranchNavigation(boardAtom);

  const board = useAtomValue(boardAtom);
  const gameHistory = game.history();
  const boardHistory = board.history();

  // Check if we can add the next move from the game
  const canPlayNextGameMove =
    boardHistory.length < gameHistory.length &&
    !gameHistory[boardHistory.length]?.includes("x");

  const redoMove = redoMoveWithModal; // Always use modal for consistency
  // Get alternative moves for the context menu
  const alternativeMoves = getAlternativeMoves();
  const addNextGameMoveToBoard = useCallback(() => {
    // First try to repeat the canceled move
    if (canRedo) {
      redoMove();
      return;
    }

    // If there are no canceled moves, add the next move from the game
    if (!canPlayNextGameMove) return;

    const nextMove = gameHistory[boardHistory.length];
    board.move(nextMove);
  }, [
    canRedo,
    redoMove,
    canPlayNextGameMove,
    gameHistory,
    boardHistory,
    board,
  ]);

  // Handle right click to show alternatives
  const handleRightClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      if (alternativeMoves.length > 0) {
        setAnchorEl(event.currentTarget);
      }
    },
    [alternativeMoves]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === ".") {
        addNextGameMoveToBoard();
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [addNextGameMoveToBoard]);

  return (
    <>
      <Tooltip title={t("go_to_next_move")}>
        <Grid>
          <IconButton
            onClick={addNextGameMoveToBoard}
            disabled={!canRedo && !canPlayNextGameMove}
            onContextMenu={handleRightClick}
            sx={{ paddingX: 1.2, paddingY: 0.5 }}
          >
            <Icon icon="ri:arrow-right-line" height={30} />
          </IconButton>
        </Grid>
      </Tooltip>
      {/* Context menu for alternative moves */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        slotProps={{
          list: {
            "aria-labelledby": "basic-button",
            sx: { maxWidth: 300 },
          },
        }}
      >
        {alternativeMoves.map((move, index) => (
          <MenuItem
            key={`alternative-${index}`}
            onClick={() => {
              // Implement navigation to alternative move
              setAnchorEl(null);
            }}
          >
            {move.san}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
