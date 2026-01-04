import { Box, Typography, alpha } from "@mui/material";
import { useMemo } from "react";
import {
  extractAllVariations,
  sortVariations,
  getMaxMovesCount,
} from "./variationsExtractor";
import { useThemeColors } from "./useThemeColors";

interface VariationsTableDisplayProps {
  moveTree: any;
  onMoveClick: (nodeId: string) => void;
  currentNodeId: string;
}

export function VariationsTableDisplay({
  moveTree,
  onMoveClick,
  currentNodeId,
}: VariationsTableDisplayProps) {
  const { colors } = useThemeColors();

  // Extract and sort variations
  const variations = useMemo(() => {
    const extracted = extractAllVariations(moveTree);
    return sortVariations(extracted);
  }, [moveTree]);

  const maxMoves = useMemo(() => {
    return getMaxMovesCount(variations);
  }, [variations]);

  // Check if a node is the current node
  const isCurrentNode = (nodeId: string) => nodeId === currentNodeId;

  if (variations.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: "center", color: "text.secondary" }}>
        <Typography variant="body2">No moves to display</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: "100%",
        backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.3),
        borderRadius: 1,
        paddingBottom: 2,
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: `60px repeat(${variations.length}, minmax(80px, 1fr))`,
          gap: 0.5,
          minWidth: "max-content",
        }}
      >
        {/* Header row - variation numbers */}
        <Box
          sx={{
            position: "sticky",
            left: 0,
            zIndex: 2,
            backgroundColor: (theme) => theme.palette.background.paper,
            fontWeight: "bold",
            padding: 1,
            borderBottom: 1,
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography variant="caption" fontWeight="bold">
            Move #
          </Typography>
        </Box>

        {variations.map((variation, varIndex) => (
          <Box
            key={variation.id}
            sx={{
              fontWeight: "bold",
              padding: 1,
              borderBottom: 1,
              borderColor: "divider",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: (theme) =>
                variation.isMainLine
                  ? alpha(theme.palette.primary.main, 0.1)
                  : "transparent",
            }}
          >
            <Typography
              variant="caption"
              fontWeight="bold"
              color={variation.isMainLine ? "primary" : "text.secondary"}
            >
              Var {varIndex + 1}
              {variation.isMainLine && " ★"}
            </Typography>
          </Box>
        ))}

        {/* Move rows */}
        {Array.from({ length: maxMoves }).map((_, moveIndex) => {
          const moveNumber = Math.floor(moveIndex / 2) + 1;
          const isWhiteMove = moveIndex % 2 === 0;
          const displayNumber = isWhiteMove
            ? `${moveNumber}.`
            : `${moveNumber}...`;

          return (
            <>
              {/* Move number cell */}
              <Box
                key={`move-num-${moveIndex}`}
                sx={{
                  position: "sticky",
                  left: 0,
                  zIndex: 2,
                  backgroundColor: (theme) => theme.palette.background.paper,
                  padding: 0.75,
                  paddingLeft: 1,
                  borderBottom: 1,
                  borderColor: "divider",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  fontFamily: "'Roboto Mono', monospace",
                  fontSize: "0.85rem",
                }}
              >
                <Typography
                  variant="body2"
                  fontFamily="inherit"
                  color="text.secondary"
                >
                  {displayNumber}
                </Typography>
              </Box>

              {/* Move cells for each variation */}
              {variations.map((variation) => {
                const move = variation.moves[moveIndex];
                const nodeId = variation.nodeIds[moveIndex];
                const isCurrent = nodeId && isCurrentNode(nodeId);

                return (
                  <Box
                    key={`${variation.id}-move-${moveIndex}`}
                    sx={{
                      padding: 0.75,
                      borderBottom: 1,
                      borderColor: "divider",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: move ? "pointer" : "default",
                      backgroundColor: isCurrent
                        ? alpha(colors.moveColor, 0.3)
                        : "transparent",
                      fontFamily: "'Roboto Mono', monospace",
                      fontSize: "0.9rem",
                      transition: "all 0.15s ease-in-out",
                      "&:hover": move
                        ? {
                            backgroundColor: alpha(colors.hoverColor, 0.2),
                            transform: "scale(1.05)",
                          }
                        : {},
                    }}
                    onClick={() => {
                      if (move && nodeId) {
                        onMoveClick(nodeId);
                      }
                    }}
                  >
                    {move ? (
                      <Typography
                        variant="body2"
                        fontFamily="inherit"
                        fontWeight={isCurrent ? "bold" : "normal"}
                        color={isCurrent ? colors.moveColor : "text.primary"}
                      >
                        {move}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.disabled">
                        —
                      </Typography>
                    )}
                  </Box>
                );
              })}
            </>
          );
        })}
      </Box>
    </Box>
  );
}
