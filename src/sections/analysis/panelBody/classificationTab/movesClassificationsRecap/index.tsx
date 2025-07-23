import { usePlayersData } from "@/hooks/usePlayersData";
import { MoveClassification } from "@/types/enums";
import { Grid2 as Grid, Typography } from "@mui/material";
import { useAtomValue } from "jotai";
import { gameAtom, gameEvalAtom } from "../../../states";
import ClassificationRow from "./classificationRow";

export default function MovesClassificationsRecap() {
  const { white, black } = usePlayersData(gameAtom);
  const gameEval = useAtomValue(gameEvalAtom);

  if (!gameEval?.positions.length) return null;

  return (
    <Grid
      container
      justifyContent="center"
      alignItems="center"
      rowGap={0.7}
      sx={{
        scrollbarWidth: "thin",
        overflowY: "auto",
        height: "calc(100% - 10px)",
      }}
    >
      <Grid
        container
        alignItems="center"
        justifyContent="space-evenly"
        wrap="nowrap"
        size={12}
      >
        <Typography width="12rem" align="center" noWrap fontSize="0.9rem">
          {white.name}
        </Typography>

        <Typography width="7rem" />

        <Typography width="12rem" align="center" noWrap fontSize="0.9rem">
          {black.name}
        </Typography>
      </Grid>

      {sortedMoveClassfications.map((classification) => (
        <ClassificationRow
          key={classification}
          classification={classification}
        />
      ))}
    </Grid>
  );
}

export const sortedMoveClassfications = [
  MoveClassification.Splendid,
  MoveClassification.Perfect,
  MoveClassification.Best,
  MoveClassification.Excellent,
  MoveClassification.Okay,
  MoveClassification.Opening,
  MoveClassification.Inaccuracy,
  MoveClassification.Mistake,
  MoveClassification.Blunder,
];
