import { Icon } from "@iconify/react";
import {
  Grid2 as Grid,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import { useChessActionsWithHistory } from "@/hooks/useChessActionsWithHistory";
import { useChessActionsWithBranches } from "@/hooks/useChessActionsWithBranches";
import { boardAtom } from "../states";
import { useCallback, useEffect, useState } from "react";

export default function RedoMoveButton() {
  const [useBranches, setUseBranches] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Хуки для обеих систем
  const { redoMove: redoLinear, canRedo: canRedoLinear } =
    useChessActionsWithHistory(boardAtom);
  const {
    redoMove: redoBranched,
    canRedo: canRedoBranched,
    getAlternativeMoves,
    goToNode,
  } = useChessActionsWithBranches(boardAtom);

  const canRedo = useBranches ? canRedoBranched : canRedoLinear;
  const redoMove = useBranches ? redoBranched : redoLinear;

  // Получаем альтернативные ходы для контекстного меню
  const alternativeMoves = useBranches ? getAlternativeMoves() : [];

  const handleRedoMove = useCallback(() => {
    if (canRedo) {
      redoMove();
    }
  }, [canRedo, redoMove]);

  // Обработка правого клика для показа альтернатив
  const handleRightClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (useBranches && alternativeMoves.length > 1) {
        event.preventDefault();
        setAnchorEl(event.currentTarget);
      }
    },
    [useBranches, alternativeMoves.length]
  );

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleSelectAlternative = (nodeId: string) => {
    goToNode(nodeId);
    handleCloseMenu();
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Y или Ctrl+Shift+Z для повтора
      if (
        (e.ctrlKey && e.key === "y") ||
        (e.ctrlKey && e.shiftKey && e.key === "Z")
      ) {
        e.preventDefault();
        handleRedoMove();
      }

      // Ctrl+B для переключения режимов
      if (e.ctrlKey && e.key === "b") {
        e.preventDefault();
        setUseBranches(!useBranches);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [handleRedoMove, useBranches]);

  const tooltipTitle = useBranches
    ? `Redo move (Ctrl+Y) | Ветки: ${alternativeMoves.length > 1 ? "ПКМ для альтернатив" : "нет альтернатив"} | Ctrl+B: переключить режим`
    : "Redo move (Ctrl+Y) | Ctrl+B: переключить на режим веток";

  return (
    <>
      <Tooltip title={tooltipTitle}>
        <Grid>
          <IconButton
            onClick={handleRedoMove}
            onContextMenu={handleRightClick}
            disabled={!canRedo}
            sx={{
              paddingX: 1.2,
              paddingY: 0.5,
              backgroundColor: useBranches ? "action.hover" : "transparent",
            }}
          >
            <Icon icon="ri:arrow-go-forward-line" height={30} />
          </IconButton>
        </Grid>
      </Tooltip>

      {/* Контекстное меню для альтернативных ходов */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem disabled>
          <Typography variant="caption">Альтернативные ходы:</Typography>
        </MenuItem>
        {alternativeMoves.map((altMove) => (
          <MenuItem
            key={altMove.nodeId}
            onClick={() => handleSelectAlternative(altMove.nodeId)}
          >
            {altMove.san}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
