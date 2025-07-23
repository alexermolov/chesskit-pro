import { useAtomValue } from "jotai";
import {
  boardAtom,
  boardOrientationAtom,
  currentPositionAtom,
  gameAtom,
  showBestMoveArrowAtom,
  showPlayerMoveIconAtom,
} from "../states";
import { useMemo } from "react";
import { useScreenSize } from "@/hooks/useScreenSize";
import { Color } from "@/types/enums";
import Board from "@/components/board";
import { usePlayersData } from "@/hooks/usePlayersData";
import { Box } from "@mui/material";
import MoveComment from "@/components/MoveComment";

export default function BoardContainer() {
  const screenSize = useScreenSize();
  const boardOrientation = useAtomValue(boardOrientationAtom);
  const showBestMoveArrow = useAtomValue(showBestMoveArrowAtom);
  const { white, black } = usePlayersData(gameAtom);

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
      {/* Комментарий к текущему ходу */}
      <MoveComment gameAtom={boardAtom} />
      
      {/* Доска */}
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
