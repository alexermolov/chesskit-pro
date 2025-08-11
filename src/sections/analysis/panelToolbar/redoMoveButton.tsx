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
import { useTranslation } from "next-i18next";
import { useCallback, useEffect, useState } from "react";
import { boardAtom } from "../states";

export default function RedoMoveButton() {
  const { t } = useTranslation("chess");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const { canRedo, getAlternativeMoves } =
    useChessActionsWithBranches(boardAtom);

  // Hook for navigation with modal window
  const { redoMove: redoMoveWithModal } = useBranchNavigation(boardAtom);

  const redoMove = redoMoveWithModal; // Always use modal for consistency
  // Get alternative moves for the context menu
  const alternativeMoves = getAlternativeMoves();

  const handleRedoMove = useCallback(() => {
    redoMove();
  }, [redoMove]);

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
      // Ctrl+Y or Ctrl+Shift+Z for redo
      if (
        (e.ctrlKey && e.key === "y") ||
        (e.ctrlKey && e.shiftKey && e.key === "z")
      ) {
        if (canRedo) redoMove();
        e.preventDefault();
      }

      // Ctrl+B for switching modes
      if (e.ctrlKey && e.key === "b") {
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [canRedo, redoMove]);

  return (
    <>
      <Tooltip title={t("redo_move")}>
        <Grid>
          <IconButton
            onClick={handleRedoMove}
            disabled={!canRedo}
            onContextMenu={handleRightClick}
            sx={{ paddingX: 1.2, paddingY: 0.5 }}
          >
            <Icon icon="ri:arrow-left-line" />
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
