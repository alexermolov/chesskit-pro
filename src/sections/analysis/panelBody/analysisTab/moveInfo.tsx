import PrettyMoveSan from "@/components/prettyMoveSan";
import { moveLineUciToSan } from "@/lib/chess";
import { MoveClassification } from "@/types/enums";
import { Box, Skeleton, Stack, Typography } from "@mui/material";
import { useAtomValue } from "jotai";
import { useTranslation } from "next-i18next";
import { useMemo } from "react";
import { boardAtom, currentPositionAtom } from "../../states";

export default function MoveInfo() {
  const { t } = useTranslation("chess");
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

  const getMoveClassificationLabel = (
    classification: MoveClassification
  ): string => {
    switch (classification) {
      case MoveClassification.Opening:
        return t("opening_move");
      case MoveClassification.Forced:
        return t("forced_move_desc");
      case MoveClassification.Splendid:
        return t("splendid_move");
      case MoveClassification.Perfect:
        return t("perfect_move");
      case MoveClassification.Best:
        return t("best_move_desc");
      case MoveClassification.Excellent:
        return t("excellent_move_desc");
      case MoveClassification.Okay:
        return t("okay_move");
      case MoveClassification.Inaccuracy:
        return t("inaccuracy_move");
      case MoveClassification.Mistake:
        return t("mistake_move");
      case MoveClassification.Blunder:
        return t("blunder_move");
      default:
        return "";
    }
  };

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
              " " +
              t("is") +
              " " +
              getMoveClassificationLabel(moveClassification)
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
            additionalText={" " + t("was_the_best_move")}
          />
        </Stack>
      )}
    </Stack>
  );
}
