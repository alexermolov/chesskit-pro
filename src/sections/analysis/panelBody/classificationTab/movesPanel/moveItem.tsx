import PrettyMoveSan from "@/components/prettyMoveSan";
import { CLASSIFICATION_COLORS } from "@/constants";
import { useChessActionsWithBranches } from "@/hooks/useChessActionsWithBranches";
import { isInViewport } from "@/lib/helpers";
import { MoveClassification } from "@/types/enums";
import { Box, Grid2 as Grid } from "@mui/material";
import { useAtomValue } from "jotai";
import { useEffect } from "react";
import { gameAtom, moveTreeAtom } from "../../../states";

interface Props {
  san: string;
  moveClassification?: MoveClassification;
  moveIdx: number;
  moveColor: "w" | "b";
  nodeId?: string; // ID узла в дереве ходов
}

export default function MoveItem({
  san,
  moveClassification,
  moveIdx,
  moveColor,
  nodeId,
}: Props) {
  const moveTree = useAtomValue(moveTreeAtom);
  const { goToNode } = useChessActionsWithBranches(gameAtom);
  const color = getMoveColor(moveClassification);

  // Определяем, является ли этот ход текущим
  const isCurrentMove = nodeId ? moveTree.currentNodeId === nodeId : false;

  useEffect(() => {
    if (!isCurrentMove) return;
    const moveItem = document.getElementById(`move-${moveIdx}`);
    if (!moveItem) return;

    const movePanel = document.getElementById("moves-panel");
    if (!movePanel || !isInViewport(movePanel)) return;

    moveItem.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [isCurrentMove, moveIdx]);

  const handleClick = () => {
    if (isCurrentMove || !nodeId) return;

    // Переходим к узлу в дереве ходов
    goToNode(nodeId);
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

const moveClassificationsToIgnore: MoveClassification[] = [
  MoveClassification.Okay,
  MoveClassification.Excellent,
  MoveClassification.Forced,
];
