import { Box, Typography } from "@mui/material";
import { useMemo, useCallback } from "react";
import { useAtomValue } from "jotai";
import { gameEvalAtom, boardAtom } from "../../../states";
import { MoveClassification } from "@/types/enums";
import { GameEval } from "@/types/eval";
import { MoveTree } from "@/types/moveTree";
import { useChessActionsWithBranches } from "@/hooks/useChessActionsWithBranches";
import type { Move } from "chess.js";

export default function BranchesMovesPanel() {
  const gameEval = useAtomValue(gameEvalAtom);

  const { currentMoves, goToNode, getAlternativeMoves, moveTree } =
    useChessActionsWithBranches(boardAtom);

  // Получаем альтернативные ходы для текущей позиции
  const alternativeMoves = getAlternativeMoves();

  // Функция для перехода к конкретному ходу по nodeId
  const handleMoveClick = (nodeId: string) => {
    goToNode(nodeId);
  };

  // Функция для получения главной линии (самая длинная ветка, фиксированная)
  const getMainLine = useCallback(
    (startNodeId: string): string[] => {
      // Используем самую длинную ветку как главную линию (не зависит от текущей позиции)
      const path: string[] = [];
      let currentNodeId = startNodeId;

      while (currentNodeId) {
        const node = moveTree.nodes[currentNodeId];
        if (!node) break;

        path.push(currentNodeId);

        // Выбираем первого ребенка как основную линию
        if (node.children.length > 0) {
          currentNodeId = node.children[0];
        } else {
          break;
        }
      }

      return path;
    },
    [moveTree]
  );

  // Получаем главную линию
  const mainLine = getMainLine("root");

  // Построение структуры для inline отображения с ветками (фиксированная структура)
  const inlineStructure = useMemo(() => {
    if (!moveTree || !moveTree.nodes) return [];

    const result: Array<{
      type: "move" | "branch";
      nodeId?: string;
      move?: Move;
      san?: string;
      moveNumber?: number;
      isWhite?: boolean;
      alternatives?: Array<{
        nodeId: string;
        moves: Array<{ nodeId: string; move: Move; san: string }>;
      }>;
    }> = [];

    // Рекурсивная функция для построения дерева ходов
    const buildMoveTree = (nodeId: string, depth: number = 0): void => {
      const node = moveTree.nodes[nodeId];
      if (!node) return;

      // Добавляем ход (кроме root)
      if (node.move) {
        const moveIndex = depth - 1;
        const moveNumber = Math.floor(moveIndex / 2) + 1;
        const isWhite = moveIndex % 2 === 0;

        result.push({
          type: "move",
          nodeId,
          move: node.move,
          san: node.san,
          moveNumber,
          isWhite,
        });
      }

      // Если есть дети, обрабатываем их
      if (node.children.length > 0) {
        // Главная линия - всегда первый ребенок (фиксированная структура)
        const mainChild = node.children[0];

        // Остальные дети - альтернативы
        if (node.children.length > 1) {
          const alternatives = node.children
            .filter((childId) => childId !== mainChild)
            .map((altNodeId) => {
              const altNode = moveTree.nodes[altNodeId];
              if (!altNode || !altNode.move) return null;

              // Собираем ходы альтернативной ветки (до 5 ходов)
              const branchMoves: Array<{
                nodeId: string;
                move: Move;
                san: string;
              }> = [];

              let currentAltId = altNodeId;
              let count = 0;
              while (currentAltId && count < 5) {
                const currentAltNode = moveTree.nodes[currentAltId];
                if (!currentAltNode || !currentAltNode.move) break;

                branchMoves.push({
                  nodeId: currentAltNode.id,
                  move: currentAltNode.move,
                  san: currentAltNode.san,
                });

                // Переходим к следующему ходу (берем первого ребенка)
                if (currentAltNode.children.length > 0) {
                  currentAltId = currentAltNode.children[0];
                } else {
                  break;
                }
                count++;
              }

              return {
                nodeId: altNodeId,
                moves: branchMoves,
              };
            })
            .filter((alt) => alt !== null);

          if (alternatives.length > 0) {
            result.push({
              type: "branch",
              alternatives: alternatives as Array<{
                nodeId: string;
                moves: Array<{ nodeId: string; move: Move; san: string }>;
              }>,
            });
          }
        }

        // Продолжаем с главным ребенком
        buildMoveTree(mainChild, depth + 1);

        // ВАЖНО: также обрабатываем альтернативные ветки рекурсивно
        // Это нужно для случаев, когда в альтернативной ветке есть свои подветки
        if (node.children.length > 1) {
          node.children.slice(1).forEach((altChildId) => {
            // Проверяем, есть ли у альтернативного узла свои дети для продолжения
            const altChild = moveTree.nodes[altChildId];
            if (altChild && altChild.children.length > 0) {
              // Рекурсивно обрабатываем подветки альтернативного хода
              altChild.children.forEach((subChildId) => {
                buildMoveTree(subChildId, depth + 2);
              });
            }
          });
        }
      }
    };

    // Начинаем с root
    buildMoveTree("root", 0);

    console.log("Main line:", getMainLine("root"));
    console.log("Result structure:", result);
    console.log(
      "Move tree nodes:",
      Object.keys(moveTree.nodes).map((nodeId) => ({
        nodeId,
        move: moveTree.nodes[nodeId]?.move?.san || "root",
        children: moveTree.nodes[nodeId]?.children || [],
        parent: moveTree.nodes[nodeId]?.parent,
      }))
    );
    console.log("Current node ID from moveTree:", moveTree.currentNodeId);
    return result;
  }, [moveTree, getMainLine]); // Убираем currentNode.id из зависимостей

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
      {/* Компактное отображение ходов в стиле Lichess с ветками */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 0.5,
          alignItems: "center",
        }}
      >
        <LichessStyleMovesDisplay
          key={`moves-display-${moveTree.currentNodeId}`}
          inlineStructure={inlineStructure}
          onMoveClick={handleMoveClick}
          gameEval={gameEval || null}
          moveTree={moveTree}
          mainLine={mainLine}
          currentNodeId={moveTree.currentNodeId}
        />
      </Box>
    </Box>
  );
}

// Компонент для отображения ходов в стиле Lichess с встроенными ветками
interface LichessStyleMovesDisplayProps {
  inlineStructure: Array<{
    type: "move" | "branch";
    nodeId?: string;
    move?: Move;
    san?: string;
    moveNumber?: number;
    isWhite?: boolean;
    alternatives?: Array<{
      nodeId: string;
      moves: Array<{ nodeId: string; move: Move; san: string }>;
    }>;
  }>;
  onMoveClick: (nodeId: string) => void;
  gameEval: GameEval | null;
  moveTree: MoveTree;
  mainLine: string[];
  currentNodeId: string;
}

function LichessStyleMovesDisplay({
  inlineStructure,
  onMoveClick,
  gameEval,
  moveTree,
  mainLine,
  currentNodeId,
}: LichessStyleMovesDisplayProps) {
  return (
    <>
      {inlineStructure.map((item, idx) => {
        if (item.type === "move") {
          const isWhite = item.isWhite;
          const showMoveNumber = isWhite;
          const moveClassification =
            gameEval?.positions?.[idx + 1]?.moveClassification;
          const isCurrentMove = item.nodeId === currentNodeId;

          return (
            <Box
              key={`${item.nodeId}-${idx}`}
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
                  {item.moveNumber}.
                </Typography>
              )}

              {/* Ход */}
              <span
                onClick={() => item.nodeId && onMoveClick(item.nodeId)}
                style={{
                  cursor: isCurrentMove ? "default" : "pointer",
                  padding: "2px 4px",
                  borderRadius: "3px",
                  backgroundColor: isCurrentMove
                    ? "rgb(25, 118, 210)" // primary.main
                    : "transparent",
                  color: isCurrentMove
                    ? "white" // primary.contrastText
                    : "inherit",
                  fontSize: "0.9rem",
                  fontWeight: isCurrentMove ? 600 : 400,
                  position: "relative",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "2px",
                  transition: "background-color 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isCurrentMove) {
                    e.currentTarget.style.backgroundColor =
                      "rgba(0, 0, 0, 0.04)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isCurrentMove) {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
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
                {item.san}
              </span>
            </Box>
          );
        }

        if (item.type === "branch" && item.alternatives) {
          return (
            <Box
              key={`branch-${idx}`}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.25,
                mr: 0.5,
              }}
            >
              {item.alternatives.map((alt, altIdx) => (
                <Box
                  key={`${alt.nodeId}-${altIdx}`}
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.25,
                    color: "text.secondary",
                    fontSize: "0.85rem",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary", fontSize: "0.85rem" }}
                  >
                    (
                  </Typography>
                  {alt.moves.map((move, moveIdx) => {
                    // Определяем правильную нумерацию для альтернативных ходов
                    // Находим позицию родителя в основной линии
                    const parentNodeId = moveTree.nodes[alt.nodeId]?.parent;
                    const parentIndex = mainLine.indexOf(parentNodeId || "");
                    const baseDepth = parentIndex >= 0 ? parentIndex : 0;

                    const absoluteMoveIndex = baseDepth + moveIdx;
                    const isWhite = absoluteMoveIndex % 2 === 0;
                    const moveNumber = Math.floor(absoluteMoveIndex / 2) + 1;
                    const showMoveNumber = isWhite || moveIdx === 0; // Показываем номер для белых или первого хода альтернативы

                    return (
                      <Box
                        key={move.nodeId}
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 0.25,
                        }}
                      >
                        {showMoveNumber && (
                          <Typography
                            variant="caption"
                            sx={{
                              color: "text.secondary",
                              fontSize: "0.75rem",
                              mr: 0.1,
                            }}
                          >
                            {moveNumber}
                            {isWhite ? "." : "..."}
                          </Typography>
                        )}
                        <span
                          onClick={() => onMoveClick(move.nodeId)}
                          style={{
                            cursor:
                              move.nodeId === currentNodeId
                                ? "default"
                                : "pointer",
                            color:
                              move.nodeId === currentNodeId
                                ? "white"
                                : "rgba(0, 0, 0, 0.6)",
                            backgroundColor:
                              move.nodeId === currentNodeId
                                ? "rgb(25, 118, 210)"
                                : "transparent",
                            fontSize: "0.85rem",
                            marginRight: "2px",
                            padding: "2px 4px",
                            borderRadius: "3px",
                            fontWeight:
                              move.nodeId === currentNodeId ? 600 : 400,
                            transition: "background-color 0.15s ease",
                          }}
                          onMouseEnter={(e) => {
                            if (move.nodeId !== currentNodeId) {
                              e.currentTarget.style.color = "rgb(25, 118, 210)";
                              e.currentTarget.style.textDecoration =
                                "underline";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (move.nodeId !== currentNodeId) {
                              e.currentTarget.style.color =
                                "rgba(0, 0, 0, 0.6)";
                              e.currentTarget.style.textDecoration = "none";
                            }
                          }}
                        >
                          {move.san}
                        </span>
                      </Box>
                    );
                  })}
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary", fontSize: "0.85rem" }}
                  >
                    )
                  </Typography>
                </Box>
              ))}
            </Box>
          );
        }

        return null;
      })}
    </>
  );
}

const moveClassificationsToIgnore = [
  MoveClassification.Perfect,
  MoveClassification.Okay,
];
