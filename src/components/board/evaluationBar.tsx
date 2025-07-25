import { Box, Grid2 as Grid, Typography } from "@mui/material";
import { PrimitiveAtom, atom, useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { getEvaluationBarValue } from "@/lib/chess";
import { Color } from "@/types/enums";
import { CurrentPosition } from "@/types/eval";

interface Props {
  height: number;
  boardOrientation?: Color;
  currentPositionAtom?: PrimitiveAtom<CurrentPosition>;
}

export default function EvaluationBar({
  height,
  boardOrientation,
  currentPositionAtom = atom({}),
}: Props) {
  const [evalBar, setEvalBar] = useState({
    whiteBarPercentage: 50,
    label: "0.0",
  });
  const position = useAtomValue(currentPositionAtom);

  // Используем стабильные примитивные значения для зависимостей
  const hasEval = !!position?.eval;
  const evalDepth = position?.eval?.lines[0]?.depth || 0;
  const evalCp = position?.eval?.lines[0]?.cp || 0;

  useEffect(() => {
    if (!hasEval || evalDepth < 6 || !position.eval) return;

    const evalBar = getEvaluationBarValue(position.eval);
    setEvalBar(evalBar);
  }, [hasEval, evalDepth, evalCp, position.eval]);

  return (
    <Grid
      container
      justifyContent="center"
      alignItems="center"
      width="2rem"
      height={height}
      border="1px solid black"
      borderRadius="5px"
    >
      <Box
        sx={{
          backgroundColor:
            boardOrientation === Color.White ? "#424242" : "white",
          transition: "height 1s",
        }}
        height={`${
          boardOrientation === Color.White
            ? 100 - evalBar.whiteBarPercentage
            : evalBar.whiteBarPercentage
        }%`}
        width="100%"
        borderRadius={
          evalBar.whiteBarPercentage === 100 ? "5px" : "5px 5px 0 0"
        }
      >
        <Typography
          color={boardOrientation === Color.White ? "white" : "black"}
          textAlign="center"
          width="100%"
        >
          {(evalBar.whiteBarPercentage < 50 &&
            boardOrientation === Color.White) ||
          (evalBar.whiteBarPercentage >= 50 && boardOrientation === Color.Black)
            ? evalBar.label
            : ""}
        </Typography>
      </Box>

      <Box
        sx={{
          backgroundColor:
            boardOrientation === Color.White ? "white" : "#424242",
          transition: "height 1s",
        }}
        height={`${
          boardOrientation === Color.White
            ? evalBar.whiteBarPercentage
            : 100 - evalBar.whiteBarPercentage
        }%`}
        width={"100%"}
        display="flex"
        alignItems="flex-end"
        borderRadius={
          evalBar.whiteBarPercentage === 100 ? "5px" : "0 0 5px 5px"
        }
      >
        <Typography
          color={boardOrientation === Color.White ? "black" : "white"}
          textAlign="center"
          width="100%"
        >
          {(evalBar.whiteBarPercentage >= 50 &&
            boardOrientation === Color.White) ||
          (evalBar.whiteBarPercentage < 50 && boardOrientation === Color.Black)
            ? evalBar.label
            : ""}
        </Typography>
      </Box>
    </Grid>
  );
}
