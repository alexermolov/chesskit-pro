import React from "react";
import {
  Box,
  Typography,
  Button,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
} from "@mui/material";
import { useChessActionsWithBranches } from "@/hooks/useChessActionsWithBranches";
import { boardAtom } from "@/sections/analysis/states";
import { BranchInfo } from "@/types/moveTree";

export default function BranchManager() {
  const {
    branches,
    currentNode,
    goToBranch,
    deleteBranch,
    promoteToMainLine,
    getAlternativeMoves,
    currentMoves,
  } = useChessActionsWithBranches(boardAtom);

  const alternativeMoves = getAlternativeMoves();

  const handleDeleteBranch = (branchInfo: BranchInfo) => {
    if (branchInfo.isMainLine) return; // Нельзя удалить главную линию

    // Удаляем последний узел ветки (это удалит всю ветку)
    const lastNodeId = branchInfo.nodeIds[branchInfo.nodeIds.length - 1];
    if (lastNodeId) {
      deleteBranch(lastNodeId);
    }
  };

  const handlePromoteToMainLine = (branchInfo: BranchInfo) => {
    if (branchInfo.isMainLine) return;

    const lastNodeId = branchInfo.nodeIds[branchInfo.nodeIds.length - 1];
    if (lastNodeId) {
      promoteToMainLine(lastNodeId);
    }
  };

  return (
    <Box sx={{ p: 2, maxWidth: 400 }}>
      <Typography variant="h6" gutterBottom>
        Управление ветками
      </Typography>

      {/* Информация о текущей позиции */}
      <Box sx={{ mb: 2, p: 2, bgcolor: "grey.100", borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Текущая позиция: {currentMoves.length} ход
          {currentMoves.length !== 1 ? "а" : ""}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Узел: {currentNode.id}
        </Typography>
      </Box>

      {/* Альтернативные ходы в текущей позиции */}
      {alternativeMoves.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Альтернативные ходы:
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {alternativeMoves.map((altMove) => (
              <Chip
                key={altMove.nodeId}
                label={altMove.san}
                onClick={() =>
                  goToBranch({
                    id: altMove.nodeId,
                    name: altMove.san,
                    nodeIds: [altMove.nodeId],
                    isMainLine: false,
                    moveCount: 1,
                  })
                }
                variant="outlined"
                size="small"
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Список всех веток */}
      <Typography variant="subtitle1" gutterBottom>
        Все ветки ({branches.length}):
      </Typography>

      {branches.map((branch) => (
        <Accordion key={branch.id} sx={{ mb: 1 }}>
          <AccordionSummary
            sx={{
              bgcolor: branch.isMainLine ? "primary.light" : "grey.50",
              "&:hover": {
                bgcolor: branch.isMainLine ? "primary.main" : "grey.100",
              },
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                width: "100%",
              }}
            >
              <Typography variant="body2">
                {branch.isMainLine ? "★" : "☆"}
              </Typography>
              <Typography variant="body2" sx={{ flexGrow: 1 }}>
                {branch.name} ({branch.moveCount} ход
                {branch.moveCount !== 1 ? "а" : ""})
              </Typography>
              {!branch.isMainLine && (
                <Box sx={{ display: "flex", gap: 0.5 }}>
                  <Tooltip title="Сделать главной линией">
                    <Button
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePromoteToMainLine(branch);
                      }}
                    >
                      ★
                    </Button>
                  </Tooltip>
                  <Tooltip title="Удалить ветку">
                    <Button
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteBranch(branch);
                      }}
                    >
                      ✕
                    </Button>
                  </Tooltip>
                </Box>
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Ходы:{"  "}
                {branch.nodeIds
                  .slice(1)
                  .map((_, index) => {
                    return `${index + 1}.`;
                  })
                  .join(" ")}
              </Typography>

              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => goToBranch(branch)}
                >
                  Перейти к концу
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => goToBranch(branch, 0)}
                >
                  К началу ветки
                </Button>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>
      ))}

      {branches.length === 1 && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Только главная линия. Сделайте альтернативный ход, чтобы создать новую
          ветку.
        </Typography>
      )}
    </Box>
  );
}
