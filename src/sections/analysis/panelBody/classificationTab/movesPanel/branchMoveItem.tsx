import { MoveClassification } from "@/types/enums";
import { Box, Grid2 as Grid } from "@mui/material";
import { useEffect } from "react";
import { isInViewport } from "@/lib/helpers";
import { CLASSIFICATION_COLORS } from "@/constants";
import PrettyMoveSan from "@/components/prettyMoveSan";

interface Props {
  san: string;
  moveClassification?: MoveClassification;
  moveIdx: number;
  moveColor: "w" | "b";
  isCurrentMove?: boolean;
}

export default function BranchMoveItem({
  san,
  moveClassification,
  moveIdx,
  moveColor,
  isCurrentMove = false,
}: Props) {
  const color = getMoveColor(moveClassification);

  useEffect(() => {
    if (!isCurrentMove) return;
    const moveItem = document.getElementById(`move-${moveIdx}`);
    if (!moveItem) return;

    const movePanel = document.getElementById("moves-panel");
    if (!movePanel || !isInViewport(movePanel)) return;

    moveItem.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [isCurrentMove, moveIdx]);

  const handleClick = () => {
    if (isCurrentMove) return;

    // Simple stub for now
    // TODO: Implement navigation to specific move in tree
  };

  return (
    <Grid
      container
      justifyContent="center"
      alignItems="center"
      gap={1}
      width="5rem"
      wrap="nowrap"
      onClick={handleClick}
      paddingY={0.5}
      sx={(theme) => ({
        cursor: isCurrentMove ? undefined : "pointer",
        backgroundColor:
          isCurrentMove && theme.palette.mode === "dark"
            ? "#4f4f4f"
            : undefined,
        border:
          isCurrentMove && theme.palette.mode === "light"
            ? "1px solid #424242"
            : undefined,
        borderRadius: 1,
      })}
      id={`move-${moveIdx}`}
    >
      {color && moveClassification && (
        <Box
          sx={{
            width: 14,
            height: 14,
            maxWidth: "3.5vw",
            maxHeight: "3.5vw",
            backgroundImage: `url(./icons/${moveClassification}.png)`,
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }}
        />
      )}

      <PrettyMoveSan
        san={san}
        color={moveColor}
        typographyProps={{ fontSize: "0.9rem" }}
      />
    </Grid>
  );
}

const getMoveColor = (moveClassification?: MoveClassification) => {
  if (
    !moveClassification ||
    moveClassificationsToIgnore.includes(moveClassification)
  ) {
    return undefined;
  }
  return CLASSIFICATION_COLORS[moveClassification];
};

const moveClassificationsToIgnore = [
  MoveClassification.Perfect,
  MoveClassification.Okay,
];
