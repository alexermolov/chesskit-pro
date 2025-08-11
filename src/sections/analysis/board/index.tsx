import Board from "@/components/board";
import MoveComment from "@/components/MoveComment";
import { usePlayersData } from "@/hooks/usePlayersData";
import { useScreenSize } from "@/hooks/useScreenSize";
import { hasRealComment } from "@/lib/helpers";
import { Color } from "@/types/enums";
import { Box } from "@mui/material";
import { useAtomValue } from "jotai";
import { useMemo, useState, useEffect } from "react";
import {
  boardAtom,
  boardOrientationAtom,
  currentPositionAtom,
  gameAtom,
  showBestMoveArrowAtom,
  showPlayerMoveIconAtom,
  moveTreeAtom,
} from "../states";

export default function BoardContainer() {
  const screenSize = useScreenSize();
  const boardOrientation = useAtomValue(boardOrientationAtom);
  const showBestMoveArrow = useAtomValue(showBestMoveArrowAtom);
  const { white, black } = usePlayersData(gameAtom);
  const moveTree = useAtomValue(moveTreeAtom);

  const [showCommentPopup, setShowCommentPopup] = useState(false);

  // Check if current move has a real comment
  const currentComment = useMemo(() => {
    if (!moveTree || !moveTree.currentNodeId) return null;
    const node = moveTree.nodes[moveTree.currentNodeId];
    const comment = node?.comment || null;
    return hasRealComment(comment) ? comment : null;
  }, [moveTree]);

  // Show popup when there's a real comment and hide after 5 seconds
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;

    if (currentComment) {
      setShowCommentPopup(true);
      timer = setTimeout(() => {
        setShowCommentPopup(false);
      }, 5000);
    } else {
      setShowCommentPopup(false);
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [currentComment]);

  const boardSize = useMemo(() => {
    const width = screenSize.width;
    const height = screenSize.height;

    // 1200 is the lg layout breakpoint
    if (window?.innerWidth < 1200) {
      return Math.min(width - 15, height - 150);
    }

    return Math.min(width - 700, height * 0.92);
  }, [screenSize]);

  return (
    <Box sx={{ position: "relative" }}>
      {/* Auto-hiding popup comment - only when showCommentPopup is true */}
      {showCommentPopup && currentComment && (
        <Box
          sx={{
            position: "fixed",
            top: 80,
            right: 20,
            zIndex: 9999,
            maxWidth: "350px",
            minWidth: "200px",
            backgroundColor: (theme) =>
              theme.palette.mode === "dark"
                ? "rgba(42, 42, 42, 0.95)"
                : "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(10px)",
            border: (theme) =>
              `1px solid ${theme.palette.mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
            borderRadius: 2,
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            padding: 2,
            transition: "all 0.3s ease-in-out",
            transform: showCommentPopup ? "translateX(0)" : "translateX(100%)",
            opacity: showCommentPopup ? 1 : 0,
            "&:hover": {
              boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
              transform: "translateY(-2px) translateX(0)",
            },
            // Slide in from right animation
            animation: "slideIn 0.4s ease-out",
            "@keyframes slideIn": {
              "0%": { opacity: 0, transform: "translateX(100%)" },
              "100%": { opacity: 1, transform: "translateX(0)" },
            },
          }}
        >
          <MoveComment gameAtom={boardAtom} />
        </Box>
      )}

      {/* Board */}
      <Board
        id="AnalysisBoard"
        boardSize={boardSize}
        canPlay={true}
        gameAtom={boardAtom}
        whitePlayer={white}
        blackPlayer={black}
        boardOrientation={boardOrientation ? Color.White : Color.Black}
        currentPositionAtom={currentPositionAtom}
        showBestMoveArrow={showBestMoveArrow}
        showPlayerMoveIconAtom={showPlayerMoveIconAtom}
        showEvaluationBar={true}
      />
    </Box>
  );
}
