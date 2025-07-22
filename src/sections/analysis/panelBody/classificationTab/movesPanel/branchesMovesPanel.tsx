import { useChessActionsWithBranches } from "@/hooks/useChessActionsWithBranches";
import { MoveTree, MoveTreeUtils } from "@/types/moveTree";
import { Box, useTheme } from "@mui/material";
import { useMemo } from "react";
import { boardAtom } from "../../../states";

export default function BranchesMovesPanel() {
  const { currentMoves, goToNode, getAlternativeMoves, moveTree } =
    useChessActionsWithBranches(boardAtom);

  // Получаем альтернативные ходы для текущей позиции
  const alternativeMoves = getAlternativeMoves();

  // Функция для перехода к конкретному ходу по nodeId
  const handleMoveClick = (nodeId: string) => {
    goToNode(nodeId);
  };

  // Получаем правильно сформированный PGN
  const correctPgn = useMemo(() => {
    if (!moveTree) return "";

    const pgn = MoveTreeUtils.toPgn(moveTree);

    return pgn;
  }, [moveTree]);

  if (!currentMoves.length && alternativeMoves.length === 0) return null;

  return (
    <Box
      sx={{
        width: "100%",
        minWidth: 0, // Позволяет контейнеру сжиматься
        padding: 1,
        overflowY: "auto",
        maxHeight: "100%",
        fontSize: "0.9rem",
        lineHeight: 1.4,
      }}
      id="moves-panel"
    >
      {/* Правильное отображение PGN с ветками */}
      <Box
        sx={{
          fontSize: "0.95rem",
          fontFamily: "monospace",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <PgnDisplay
          pgn={correctPgn}
          moveTree={moveTree}
          onMoveClick={handleMoveClick}
          currentNodeId={moveTree.currentNodeId}
        />
      </Box>
    </Box>
  );
}

// Новый компонент для отображения PGN с кликабельными ходами
interface PgnDisplayProps {
  pgn: string;
  moveTree: MoveTree;
  onMoveClick: (nodeId: string) => void;
  currentNodeId: string;
}

function PgnDisplay({
  pgn,
  moveTree,
  onMoveClick,
  currentNodeId,
}: PgnDisplayProps) {
  const theme = useTheme();

  // Определяем цвета в зависимости от темы (мемоизируем)
  const colors = useMemo(
    () => ({
      moveColor: theme.palette.mode === "dark" ? "#64b5f6" : "#1976d2",
      hoverColor:
        theme.palette.mode === "dark"
          ? "rgba(100, 181, 246, 0.1)"
          : "rgba(25, 118, 210, 0.1)",
    }),
    [theme.palette.mode]
  );

  // Разбираем PGN и создаем кликабельные элементы
  const renderPgn = useMemo(() => {
    if (!pgn) return null;

    // Создаем карту сопоставления ходов с nodeId
    const moveToNodeMap = new Map<string, string>();

    // Рекурсивный обход дерева для создания карты ход -> nodeId
    const buildMoveMap = (nodeId: string, currentPath: string[] = []) => {
      const node = moveTree.nodes[nodeId];
      if (!node) return;

      if (node.move) {
        const san = node.move.san;
        const pathKey = currentPath.join("-") + "-" + san;
        moveToNodeMap.set(pathKey, nodeId);
        // Также добавляем простое сопоставление для уникальных ходов
        if (!moveToNodeMap.has(san)) {
          moveToNodeMap.set(san, nodeId);
        }
      }

      // Продолжаем обход детей
      node.children.forEach((childId) => {
        const newPath = node.move
          ? [...currentPath, node.move.san]
          : currentPath;
        buildMoveMap(childId, newPath);
      });
    };

    buildMoveMap("root");

    // Разбиваем PGN на токены
    const tokens = pgn
      .split(/(\s+|\(|\)|\d+\.+|\*)/g)
      .filter((token) => token.trim());

    return tokens.map((token, index) => {
      // Убираем завершающий символ
      if (token === "*") {
        return (
          <span key={index} style={{ color: "#666", marginLeft: "4px" }}>
            {token}
          </span>
        );
      }

      // Номера ходов
      if (/^\d+\.+$/.test(token)) {
        return (
          <span key={index} style={{ color: "#666", marginRight: "4px" }}>
            {token}
          </span>
        );
      }

      // Скобки вариаций
      if (token === "(" || token === ")") {
        return (
          <span key={index} style={{ color: "#999", margin: "0 2px" }}>
            {token}
          </span>
        );
      }

      // Проверяем, является ли токен ходом
      const nodeId = moveToNodeMap.get(token);
      if (nodeId) {
        const isCurrentMove = nodeId === currentNodeId;
        return (
          <span
            key={index}
            onClick={() => onMoveClick(nodeId)}
            style={{
              cursor: "pointer",
              padding: "3px 6px",
              borderRadius: "4px",
              backgroundColor: isCurrentMove ? "#1976d2" : "transparent",
              color: isCurrentMove ? "white" : colors.moveColor,
              fontWeight: isCurrentMove ? 600 : 400,
              margin: "1px 2px",
              transition: "all 0.15s ease",
              textDecoration: "none",
              display: "inline-block",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              if (!isCurrentMove) {
                e.currentTarget.style.backgroundColor = colors.hoverColor;
                e.currentTarget.style.textDecoration = "underline";
              }
            }}
            onMouseLeave={(e) => {
              if (!isCurrentMove) {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.textDecoration = "none";
              }
            }}
          >
            {token}
          </span>
        );
      }

      // Обычный текст
      return (
        <span key={index} style={{ margin: "0 1px" }}>
          {token}
        </span>
      );
    });
  }, [pgn, moveTree, currentNodeId, onMoveClick, colors]);

  return (
    <Box
      sx={{
        lineHeight: 1.8,
        wordSpacing: "2px",
        padding: 1,
        display: "flex",
        flexWrap: "wrap",
        gap: "4px",
        alignItems: "center",
        wordBreak: "break-word",
        whiteSpace: "normal",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {renderPgn}
    </Box>
  );
}
