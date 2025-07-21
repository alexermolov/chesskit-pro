import { Box, Typography, Chip } from "@mui/material";
import { useMemo } from "react";
import { useAtomValue } from "jotai";
import { gameEvalAtom, boardAtom } from "../../../states";
import { MoveClassification } from "@/types/enums";
import { GameEval } from "@/types/eval";
import { useChessActionsWithBranches } from "@/hooks/useChessActionsWithBranches";
import { MoveTreeUtils } from "@/types/moveTree";
import type { Move } from "chess.js";

export default function BranchesMovesPanel() {
  const gameEval = useAtomValue(gameEvalAtom);

  const {
    currentNode,
    branches,
    currentMoves,
    goToNode,
    getAlternativeMoves,
    moveTree,
  } = useChessActionsWithBranches(boardAtom);

  // Получаем альтернативные ходы для текущей позиции
  const alternativeMoves = getAlternativeMoves();

  // Получаем путь от корня до текущего узла для правильной навигации
  const pathToCurrentNode = useMemo(() => {
    return MoveTreeUtils.getPathToNode(moveTree, currentNode.id);
  }, [moveTree, currentNode.id]);

  // Функция для перехода к конкретному ходу по индексу
  const handleMoveClick = (moveIdx: number) => {
    // Получаем nodeId для нужной позиции
    const targetNodeIndex = moveIdx; // moveIdx соответствует индексу в pathToCurrentNode

    if (targetNodeIndex >= 0 && targetNodeIndex < pathToCurrentNode.length) {
      const targetNodeId = pathToCurrentNode[targetNodeIndex];
      goToNode(targetNodeId);
    }
  };

  // Получаем информацию о текущей ветке
  const currentBranch = branches.find((branch) =>
    branch.nodeIds.includes(currentNode.id)
  );

  if (!currentMoves.length && alternativeMoves.length === 0) return null;

  return (
    <Box
      sx={{
        width: "100%",
        padding: 1,
        overflowY: "auto",
        maxHeight: "100%",
        fontSize: "0.9rem",
        lineHeight: 1.4,
      }}
      id="moves-panel"
    >
      {/* Информация о текках (если есть) */}
      {branches.length > 1 && (
        <Box sx={{ mb: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
            Ветки:
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1 }}>
            {branches.map((branch) => (
              <Chip
                key={branch.id}
                label={`${branch.isMainLine ? "★" : ""} ${branch.name} (${
                  branch.moveCount
                })`}
                size="small"
                variant={
                  branch.id === currentBranch?.id ? "filled" : "outlined"
                }
                onClick={() => {
                  const lastNodeId = branch.nodeIds[branch.nodeIds.length - 1];
                  if (lastNodeId) goToNode(lastNodeId);
                }}
                sx={{ fontSize: "0.7rem", height: "18px" }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Компактное отображение ходов в стиле Lichess */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 0.5,
          alignItems: "center",
        }}
      >
        <InlineMovesDisplay
          moves={currentMoves}
          currentMoveIndex={currentMoves.length - 1}
          onMoveClick={handleMoveClick}
          gameEval={gameEval || null}
        />
      </Box>

      {/* Альтернативные ходы (ветки) */}
      {alternativeMoves.length > 1 && (
        <Box sx={{ mt: 1, pt: 1, borderTop: "1px solid #e0e0e0" }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
            Альтернативы:
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
            {alternativeMoves.map((altMove) => (
              <Chip
                key={altMove.nodeId}
                label={altMove.san}
                onClick={() => goToNode(altMove.nodeId)}
                variant="outlined"
                size="small"
                sx={{ fontSize: "0.7rem", height: "18px" }}
              />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}

// Компонент для инлайн отображения ходов в стиле Lichess
interface InlineMovesDisplayProps {
  moves: Move[];
  currentMoveIndex: number;
  onMoveClick: (moveIdx: number) => void;
  gameEval: GameEval | null;
}

function InlineMovesDisplay({
  moves,
  currentMoveIndex,
  onMoveClick,
  gameEval,
}: InlineMovesDisplayProps) {
  return (
    <>
      {moves.map((move, moveIdx) => {
        const isCurrentMove = moveIdx === currentMoveIndex;
        const isWhiteMove = moveIdx % 2 === 0;
        const moveNumber = Math.floor(moveIdx / 2) + 1;
        const showMoveNumber = isWhiteMove;
        const moveClassification =
          gameEval?.positions[moveIdx + 1]?.moveClassification;

        return (
          <Box
            key={moveIdx}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.25,
              mr: 0.5,
            }}
          >
            {/* Номер хода для белых */}
            {showMoveNumber && (
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  mr: 0.25,
                }}
              >
                {moveNumber}.
              </Typography>
            )}

            {/* Ход */}
            <Box
              component="span"
              onClick={() => onMoveClick(moveIdx)}
              sx={{
                cursor: isCurrentMove ? "default" : "pointer",
                padding: "2px 4px",
                borderRadius: "3px",
                backgroundColor: isCurrentMove ? "primary.main" : "transparent",
                color: isCurrentMove ? "primary.contrastText" : "text.primary",
                fontSize: "0.9rem",
                fontWeight: isCurrentMove ? 600 : 400,
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                gap: 0.25,
                "&:hover": {
                  backgroundColor: isCurrentMove
                    ? "primary.main"
                    : "action.hover",
                },
                transition: "background-color 0.15s ease",
              }}
            >
              {/* Иконка классификации хода */}
              {moveClassification &&
                !moveClassificationsToIgnore.includes(moveClassification) && (
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      backgroundImage: `url(./icons/${moveClassification}.png)`,
                      backgroundSize: "contain",
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "center",
                      mr: 0.25,
                    }}
                  />
                )}
              {move.san}
            </Box>
          </Box>
        );
      })}
    </>
  );
}

const moveClassificationsToIgnore = [
  MoveClassification.Perfect,
  MoveClassification.Okay,
];
