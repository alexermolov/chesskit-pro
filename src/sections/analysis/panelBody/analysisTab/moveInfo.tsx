import PrettyMoveSan from "@/components/prettyMoveSan";
import { moveLineUciToSan } from "@/lib/chess";
import { MoveClassification } from "@/types/enums";
import { Box, Skeleton, Stack, Typography } from "@mui/material";
import { useAtomValue } from "jotai";
import { useMemo } from "react";
import { boardAtom, currentPositionAtom } from "../../states";

export default function MoveInfo() {
  const position = useAtomValue(currentPositionAtom);
  const board = useAtomValue(boardAtom);

  const bestMove = position?.lastEval?.bestMove;

  const moveClassification = position?.eval?.moveClassification;

  const bestMoveSan = useMemo(() => {
    if (!bestMove) return undefined;

    const lastPosition = board.history({ verbose: true }).at(-1)?.before;
    if (!lastPosition) return undefined;

    return moveLineUciToSan(lastPosition)(bestMove);
  }, [bestMove, board]);

  if (board.history().length === 0) return null;

  if (!bestMoveSan) {
    return (
      <Stack direction="row" alignItems="center" columnGap={5} marginTop={0.8}>
        <Skeleton
          variant="rounded"
          animation="wave"
          width={"12em"}
          sx={{ color: "transparent", maxWidth: "7vw" }}
        >
          <Typography align="center" fontSize="0.9rem">
            placeholder
          </Typography>
        </Skeleton>
      </Stack>
    );
  }

  const showBestMoveLabel =
    moveClassification !== MoveClassification.Best &&
    moveClassification !== MoveClassification.Opening &&
    moveClassification !== MoveClassification.Forced &&
    moveClassification !== MoveClassification.Splendid &&
    moveClassification !== MoveClassification.Perfect;

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="center"
      columnGap={4}
      marginTop={0.5}
      flexWrap="wrap"
    >
      {moveClassification && (
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box
            sx={{
              width: 16,
              height: 16,
              maxWidth: "3.5vw",
              maxHeight: "3.5vw",
              backgroundImage: `url(./icons/${moveClassification}.png)`,
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
            }}
          />

          <PrettyMoveSan
            typographyProps={{
              fontSize: "0.9rem",
            }}
            san={position.lastMove?.san ?? ""}
            color={position.lastMove?.color ?? "w"}
            additionalText={
              " is " + moveClassificationLabels[moveClassification]
            }
          />
        </Stack>
      )}

      {showBestMoveLabel && (
        <Stack direction="row" alignItems="center" spacing={1}>
          <div
            style={{
              width: 16,
              height: 16,
              maxWidth: "3.5vw",
              maxHeight: "3.5vw",
              backgroundImage: "url(./icons/best.png)",
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
            }}
            aria-label="move-icon"
          />
          <PrettyMoveSan
            typographyProps={{
              fontSize: "0.9rem",
            }}
            san={bestMoveSan}
            color={position.lastMove?.color ?? "w"}
            additionalText=" was the best move"
          />
        </Stack>
      )}
    </Stack>
  );
}

const moveClassificationLabels: Record<MoveClassification, string> = {
  [MoveClassification.Opening]: "an opening move",
  [MoveClassification.Forced]: "forced",
  [MoveClassification.Splendid]: "splendid !!",
  [MoveClassification.Perfect]: "the only good move !",
  [MoveClassification.Best]: "the best move",
  [MoveClassification.Excellent]: "excellent",
  [MoveClassification.Okay]: "an okay move",
  [MoveClassification.Inaccuracy]: "an inaccuracy",
  [MoveClassification.Mistake]: "a mistake",
  [MoveClassification.Blunder]: "a blunder",
};
