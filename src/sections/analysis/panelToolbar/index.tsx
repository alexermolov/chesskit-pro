import BranchSelectionModal from "@/components/BranchSelectionModal";
import { useBranchNavigation } from "@/hooks/useBranchNavigation";
import { useChessActionsWithBranches } from "@/hooks/useChessActionsWithBranches";
import { MoveTreeUtils } from "@/types/moveTree";
import { Icon } from "@iconify/react";
import {
  Grid2 as Grid,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from "@mui/material";
import { Move } from "chess.js";
import { useAtomValue } from "jotai";
import { useTranslation } from "next-i18next";
import { useCallback, useEffect, useState } from "react";
import { boardAtom, gameAtom, moveTreeAtom } from "../states";
import AddToTempListButton from "./addToTempListButton";
import FlipBoardButton from "./flipBoardButton";
import GoToLastPositionButton from "./goToLastPositionButton";
import NextMoveButton from "./nextMoveButton";
import SaveAndNewButton from "./saveAndNewButton";
import SaveButton from "./saveButton";

export default function PanelToolBar() {
  const { t } = useTranslation("chess");
  const board = useAtomValue(boardAtom);
  const moveTree = useAtomValue(moveTreeAtom);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Hooks for the branch system
  const { undoMove, canUndo, currentMoves, goToNode } =
    useChessActionsWithBranches(boardAtom);

  // Hook for navigation with modal window
  const {
    isModalOpen,
    availableBranches,
    redoMove: redoMoveWithModal,
    handleBranchSelect,
    closeBranchModal,
    currentMove,
  } = useBranchNavigation(boardAtom);

  // Get move history for context menu
  const recentMoves = currentMoves.slice(-5); // Last 5 moves

  const boardHistory = board.history();
  const game = useAtomValue(gameAtom);

  // Function to get PGN with branches
  const getPgnWithBranches = useCallback(() => {
    const hasMovesInTree = Object.keys(moveTree.nodes).length > 1;
    if (hasMovesInTree) {
      return MoveTreeUtils.toPgn(moveTree);
    }
    return game.pgn();
  }, [moveTree, game]);

  // Function to download PGN file
  const downloadPgn = useCallback(() => {
    const pgn = getPgnWithBranches();
    if (!pgn) return;

    // Get header data to form filename
    const headers = game.getHeaders();
    let fileName = "game.pgn";

    // Try to form a more informative filename from headers
    if (headers.White && headers.Black && headers.Date) {
      const date = headers.Date.replace(/\./g, "-").split("?")[0]; // Remove question marks from date
      fileName = `${headers.White} vs ${headers.Black} ${date}.pgn`;
    } else if (headers.Event) {
      fileName = `${headers.Event}.pgn`;
    }

    // Create a Blob object with PGN text
    const blob = new Blob([pgn], { type: "text/plain" });

    // Create a temporary link for download
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;

    // Add link to DOM, trigger click and remove
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Free the URL
    URL.revokeObjectURL(url);
  }, [getPgnWithBranches, game]);

  const handleUndoMove = useCallback(() => {
    if (canUndo) {
      undoMove();
    }
  }, [canUndo, undoMove]);

  // Function to go to the beginning of the main line (tree root)
  const goToStartPosition = useCallback(() => {
    goToNode(moveTree.rootId);
  }, [goToNode, moveTree.rootId]);

  // Handle right click to show history
  const handleRightClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (recentMoves.length > 1) {
        event.preventDefault();
        setAnchorEl(event.currentTarget);
      }
    },
    [recentMoves.length]
  );

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Don't process keys if the branch selection modal is open
      if (isModalOpen) {
        return;
      }

      if (e.key === "ArrowLeft") {
        if (canUndo) undoMove();
      } else if (e.key === "ArrowRight") {
        // Use redoMove function with modal support
        redoMoveWithModal();
      } else if (e.key === "ArrowDown") {
        goToStartPosition();
      }
      // Add support for Ctrl+Z for undo
      else if (e.ctrlKey && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndoMove();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [
    undoMove,
    goToStartPosition,
    canUndo,
    handleUndoMove,
    isModalOpen,
    redoMoveWithModal,
  ]);

  const undoTooltipTitle = `${t("go_to_previous_move")} (Ctrl+Z) | ${recentMoves.length > 1 ? t("right_click_for_history") : t("no_history")}`;

  return (
    <>
      <Grid container justifyContent="center" alignItems="center" size={12}>
        <FlipBoardButton />

        <Tooltip title={t("reset_board")}>
          <Grid>
            <IconButton
              onClick={goToStartPosition}
              disabled={boardHistory.length === 0}
              sx={{ paddingX: 1.2, paddingY: 0.5 }}
            >
              <Icon icon="ri:skip-back-line" />
            </IconButton>
          </Grid>
        </Tooltip>

        <Tooltip title={undoTooltipTitle}>
          <Grid>
            <IconButton
              onClick={handleUndoMove}
              onContextMenu={handleRightClick}
              disabled={!canUndo}
              sx={{ paddingX: 1.2, paddingY: 0.5 }}
            >
              <Icon icon="ri:arrow-left-line" height={30} />
            </IconButton>
          </Grid>
        </Tooltip>

        <NextMoveButton />
        <GoToLastPositionButton isModalOpen={isModalOpen} />

        <Tooltip title={t("copy_pgn")}>
          <Grid>
            <IconButton
              disabled={
                game.history().length === 0 &&
                Object.keys(moveTree.nodes).length <= 1
              }
              onClick={() => {
                navigator.clipboard?.writeText?.(getPgnWithBranches());
              }}
              sx={{ paddingX: 1.2, paddingY: 0.5 }}
            >
              <Icon icon="ri:clipboard-line" />
            </IconButton>
          </Grid>
        </Tooltip>

        <Tooltip title={t("download_pgn")}>
          <Grid>
            <IconButton
              disabled={
                game.history().length === 0 &&
                Object.keys(moveTree.nodes).length <= 1
              }
              onClick={downloadPgn}
              sx={{ paddingX: 1.2, paddingY: 0.5 }}
            >
              <Icon icon="ri:download-line" />
            </IconButton>
          </Grid>
        </Tooltip>

        <SaveButton />
        <SaveAndNewButton />
        <AddToTempListButton />
      </Grid>

      {/* Context menu for move history */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem disabled>
          <Typography variant="caption">{t("go_to_move")}:</Typography>
        </MenuItem>
        {recentMoves.reverse().map((move: Move, index: number) => (
          <MenuItem
            key={`move-${index}`}
            onClick={() => {
              // Go to position through a number of undos
              const stepsBack = index + 1;
              for (let i = 0; i < stepsBack; i++) {
                if (canUndo) undoMove();
              }
              handleCloseMenu();
            }}
          >
            {index === 0
              ? t("current_move")
              : `${recentMoves.length - index}. ${move.san || "move"}`}
          </MenuItem>
        ))}
      </Menu>

      {/* Modal window for branch selection */}
      <BranchSelectionModal
        open={isModalOpen}
        onClose={closeBranchModal}
        branches={availableBranches}
        onSelectBranch={handleBranchSelect}
        currentMove={currentMove}
      />
    </>
  );
}
