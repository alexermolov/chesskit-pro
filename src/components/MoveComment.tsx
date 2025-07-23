import { Box, Typography, Fade } from "@mui/material";
import { useAtomValue } from "jotai";
import { useChessActionsWithBranches } from "@/hooks/useChessActionsWithBranches";
import { useMemo } from "react";

interface MoveCommentProps {
  gameAtom: any;
}

export default function MoveComment({ gameAtom }: MoveCommentProps) {
  const { moveTree } = useChessActionsWithBranches(gameAtom);

  // Получаем комментарий текущего хода
  const currentComment = useMemo(() => {
    if (!moveTree || !moveTree.currentNodeId || !moveTree.nodes) {
      return null;
    }

    const currentNode = moveTree.nodes[moveTree.currentNodeId];
    return currentNode?.comment || null;
  }, [moveTree]);

  if (!currentComment) {
    return null;
  }

  return (
    <Fade in={true} timeout={300}>
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          backdropFilter: "blur(8px)",
          color: "#4caf50", // Зеленый цвет для лучшей видимости
          padding: 2,
          borderRadius: "0 0 12px 12px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
          border: "1px solid rgba(76, 175, 80, 0.3)", // Зеленая граница
        }}
      >
        <Typography
          variant="body2"
          sx={{
            fontSize: "0.9rem",
            lineHeight: 1.5,
            fontStyle: "italic",
            textAlign: "center",
            fontWeight: 400,
          }}
        >
          {currentComment}
        </Typography>
      </Box>
    </Fade>
  );
}
