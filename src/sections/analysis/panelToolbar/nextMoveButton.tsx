import { Icon } from "@iconify/react";
import {
  Grid2 as Grid,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import { useAtomValue } from "jotai";
import { boardAtom, gameAtom } from "../states";
import { useChessActionsWithHistory } from "@/hooks/useChessActionsWithHistory";
import { useChessActionsWithBranches } from "@/hooks/useChessActionsWithBranches";
import { useCallback, useEffect, useState } from "react";

export default function NextMoveButton() {
  const [useBranches, setUseBranches] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Хуки для обеих систем
  const {
    playMove: playBoardMove,
    redoMove: redoLinear,
    canRedo: canRedoLinear,
  } = useChessActionsWithHistory(boardAtom);

  const {
    redoMove: redoBranched,
    canRedo: canRedoBranched,
    getAlternativeMoves,
    goToNode,
  } = useChessActionsWithBranches(boardAtom);

  const game = useAtomValue(gameAtom);
  const board = useAtomValue(boardAtom);

  const gameHistory = game.history();
  const boardHistory = board.history();

  // Проверяем, можем ли мы добавить следующий ход из игры
  const canPlayNextGameMove =
    boardHistory.length < gameHistory.length &&
    gameHistory.slice(0, boardHistory.length).join() === boardHistory.join();

  const canRedo = useBranches ? canRedoBranched : canRedoLinear;
  const redoMove = useBranches ? redoBranched : redoLinear;

  // Получаем альтернативные ходы для контекстного меню
  const alternativeMoves = useBranches ? getAlternativeMoves() : [];

  const addNextGameMoveToBoard = useCallback(() => {
    // Сначала пытаемся повторить отмененный ход
    if (canRedo) {
      redoMove();
      return;
    }

    // Если нет отмененных ходов, добавляем следующий ход из игры
    if (!canPlayNextGameMove) return;

    const nextMoveIndex = boardHistory.length;
    const nextMove = game.history({ verbose: true })[nextMoveIndex];
    const comment = game
      .getComments()
      .find((c) => c.fen === nextMove.after)?.comment;

    if (nextMove) {
      playBoardMove({
        from: nextMove.from,
        to: nextMove.to,
        promotion: nextMove.promotion,
        comment,
      });
    }
  }, [
    canRedo,
    redoMove,
    canPlayNextGameMove,
    boardHistory,
    game,
    playBoardMove,
  ]);

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

  const isButtonEnabled = canRedo || canPlayNextGameMove;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        addNextGameMoveToBoard();
      }
      // Ctrl+B для переключения режимов
      else if (e.ctrlKey && e.key === "b") {
        e.preventDefault();
        setUseBranches(!useBranches);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [addNextGameMoveToBoard, useBranches]);

  const tooltipTitle = useBranches
    ? `Go to next move (Redo or next from game) | Ветки: ${alternativeMoves.length > 1 ? "ПКМ для альтернатив" : "нет альтернатив"} | Ctrl+B: переключить режим`
    : "Go to next move (Redo or next from game) | Ctrl+B: переключить на режим веток";

  return (
    <>
      <Tooltip title={tooltipTitle}>
        <Grid>
          <IconButton
            onClick={addNextGameMoveToBoard}
            onContextMenu={handleRightClick}
            disabled={!isButtonEnabled}
            sx={{
              paddingX: 1.2,
              paddingY: 0.5,
              backgroundColor: useBranches ? "action.hover" : "transparent",
            }}
          >
            <Icon icon="ri:arrow-right-s-line" height={30} />
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
