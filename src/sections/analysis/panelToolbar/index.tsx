import BranchSelectionModal from "@/components/BranchSelectionModal";
import { useBranchNavigation } from "@/hooks/useBranchNavigation";
import { useChessActionsWithBranches } from "@/hooks/useChessActionsWithBranches";
import { useChessActionsWithHistory } from "@/hooks/useChessActionsWithHistory";
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
import { useCallback, useEffect, useState } from "react";
import { boardAtom, gameAtom, moveTreeAtom } from "../states";
import FlipBoardButton from "./flipBoardButton";
import GoToLastPositionButton from "./goToLastPositionButton";
import NextMoveButton from "./nextMoveButton";
import RedoMoveButton from "./redoMoveButton";
import SaveButton from "./saveButton";

export default function PanelToolBar() {
  const board = useAtomValue(boardAtom);
  const moveTree = useAtomValue(moveTreeAtom);
  const [useBranches, setUseBranches] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Хуки для обеих систем
  const {
    resetToStartingPosition: resetBoard,
    undoMove: undoBoardMove,
    canUndo: canUndoLinear,
  } = useChessActionsWithHistory(boardAtom);

  const {
    undoMove: undoBranchedMove,
    canUndo: canUndoBranched,
    currentMoves,
  } = useChessActionsWithBranches(boardAtom);

  // Хук для навигации с модальным окном
  const {
    isModalOpen,
    availableBranches,
    redoMove: redoMoveWithModal,
    handleBranchSelect,
    closeBranchModal,
    currentMove,
  } = useBranchNavigation(boardAtom);

  const canUndo = useBranches ? canUndoBranched : canUndoLinear;
  const undoMove = useBranches ? undoBranchedMove : undoBoardMove;

  // Получаем историю ходов для контекстного меню
  const recentMoves = useBranches ? currentMoves.slice(-5) : []; // Последние 5 ходов

  const boardHistory = board.history();
  const game = useAtomValue(gameAtom);

  // Функция для получения PGN с ветками
  const getPgnWithBranches = useCallback(() => {
    const hasMovesInTree = Object.keys(moveTree.nodes).length > 1;
    if (hasMovesInTree) {
      return MoveTreeUtils.toPgn(moveTree);
    }
    return game.pgn();
  }, [moveTree, game]);

  const handleUndoMove = useCallback(() => {
    if (canUndo) {
      undoMove();
    }
  }, [canUndo, undoMove]);

  // Обработка правого клика для показа истории
  const handleRightClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (useBranches && recentMoves.length > 1) {
        event.preventDefault();
        setAnchorEl(event.currentTarget);
      }
    },
    [useBranches, recentMoves.length]
  );

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Не обрабатываем клавиши если открыто модальное окно выбора веток
      if (isModalOpen) {
        return;
      }

      if (e.key === "ArrowLeft") {
        if (canUndo) undoMove();
      } else if (e.key === "ArrowRight" && useBranches) {
        // Используем новую функцию redoMove с поддержкой модального окна
        redoMoveWithModal();
      } else if (e.key === "ArrowDown") {
        resetBoard();
      }
      // Добавляем поддержку Ctrl+Z для отмены
      else if (e.ctrlKey && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndoMove();
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
  }, [
    undoMove,
    resetBoard,
    canUndo,
    handleUndoMove,
    useBranches,
    isModalOpen,
    redoMoveWithModal,
  ]);

  const undoTooltipTitle = useBranches
    ? `Go to previous move (Ctrl+Z) | Ветки: ${recentMoves.length > 1 ? "ПКМ для истории" : "нет истории"} | Ctrl+B: переключить режим`
    : "Go to previous move (Ctrl+Z) | Ctrl+B: переключить на режим веток";

  return (
    <>
      <Grid container justifyContent="center" alignItems="center" size={12}>
        <FlipBoardButton />

        <Tooltip title="Reset board">
          <Grid>
            <IconButton
              onClick={() => resetBoard()}
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
              sx={{
                paddingX: 1.2,
                paddingY: 0.5,
                backgroundColor: useBranches ? "action.hover" : "transparent",
              }}
            >
              <Icon icon="ri:arrow-left-s-line" height={30} />
            </IconButton>
          </Grid>
        </Tooltip>

        <RedoMoveButton />

        <NextMoveButton />

        <GoToLastPositionButton isModalOpen={isModalOpen} />

        <Tooltip title="Copy pgn">
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

        <SaveButton />
      </Grid>

      {/* Контекстное меню для истории ходов */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem disabled>
          <Typography variant="caption">Перейти к ходу:</Typography>
        </MenuItem>
        {recentMoves.reverse().map((move: Move, index: number) => (
          <MenuItem
            key={`move-${index}`}
            onClick={() => {
              // Переход к позиции через количество отмен
              const stepsBack = index + 1;
              for (let i = 0; i < stepsBack; i++) {
                if (canUndo) undoMove();
              }
              handleCloseMenu();
            }}
          >
            {index === 0
              ? "Текущий ход"
              : `${recentMoves.length - index}. ${move.san || "ход"}`}
          </MenuItem>
        ))}
      </Menu>

      {/* Модальное окно для выбора ветки */}
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
