import { Icon } from "@iconify/react";
import { Grid2 as Grid, IconButton, Tooltip } from "@mui/material";
import { useAtomValue } from "jotai";
import { useTranslation } from "next-i18next";
import { boardAtom, moveTreeAtom } from "../states";
import { useChessActionsWithBranches } from "@/hooks/useChessActionsWithBranches";
import { useCallback, useEffect } from "react";

interface GoToLastPositionButtonProps {
  isModalOpen?: boolean;
}

export default function GoToLastPositionButton({
  isModalOpen = false,
}: GoToLastPositionButtonProps) {
  const { t } = useTranslation("chess");
  const { goToNode } = useChessActionsWithBranches(boardAtom);
  const moveTree = useAtomValue(moveTreeAtom);

  // Получаем последний узел основной линии
  const lastMainLineNodeId =
    moveTree.mainLineIds[moveTree.mainLineIds.length - 1];
  const isButtonDisabled = moveTree.currentNodeId === lastMainLineNodeId;

  const goToLastMainLinePosition = useCallback(() => {
    if (isButtonDisabled) return;
    goToNode(lastMainLineNodeId);
  }, [isButtonDisabled, goToNode, lastMainLineNodeId]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Не обрабатываем клавиши если открыто модальное окно выбора веток
      if (isModalOpen) {
        return;
      }

      if (e.key === "ArrowUp") {
        if (isButtonDisabled) return;
        goToLastMainLinePosition();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isButtonDisabled, isModalOpen, goToLastMainLinePosition]);

  return (
    <Tooltip title={t("go_to_final_position")}>
      <Grid>
        <IconButton
          onClick={goToLastMainLinePosition}
          disabled={isButtonDisabled}
          sx={{ paddingX: 1.2, paddingY: 0.5 }}
        >
          <Icon icon="material-symbols:skip-next-outline" height={30} />
        </IconButton>
      </Grid>
    </Tooltip>
  );
}
