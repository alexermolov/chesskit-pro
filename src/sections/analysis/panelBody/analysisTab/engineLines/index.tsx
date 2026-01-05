import ParticleHideEffect from "@/components/ParticleHideEffect";
import { LineEval } from "@/types/eval";
import {
  Box,
  Grid2 as Grid,
  Grid2Props as GridProps,
  List,
} from "@mui/material";
import { useAtomValue } from "jotai";
import {
  boardAtom,
  currentPositionAtom,
  engineMultiPvAtom,
  showEngineLinesAtom,
} from "../../../states";
import LineEvaluation from "./lineEvaluation";

export default function EngineLines(props: GridProps) {
  const board = useAtomValue(boardAtom);
  const linesNumber = useAtomValue(engineMultiPvAtom);
  const position = useAtomValue(currentPositionAtom);
  const showEngineLines = useAtomValue(showEngineLinesAtom);

  const linesSkeleton: LineEval[] = Array.from({ length: linesNumber }).map(
    (_, i) => ({ pv: [`${i}`], depth: 0, multiPv: i + 1 })
  );

  const engineLines = position?.eval?.lines?.length
    ? position.eval.lines
    : linesSkeleton;

  if (board.isCheckmate()) return null;

  return (
    <Grid container justifyContent="center" alignItems="center" {...props}>
      <Box sx={{ width: "95%" }}>
        <ParticleHideEffect isHidden={!showEngineLines}>
          <List sx={{ width: "100%", padding: 0 }}>
            {engineLines.map((line) => (
              <LineEvaluation key={line.multiPv} line={line} />
            ))}
          </List>
        </ParticleHideEffect>
      </Box>
    </Grid>
  );
}
