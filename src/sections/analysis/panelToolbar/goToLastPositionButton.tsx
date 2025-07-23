import { Icon } from "@iconify/react";
import { Grid2 as Grid, IconButton, Tooltip } from "@mui/material";
import { useAtomValue } from "jotai";
import { boardAtom, gameAtom } from "../states";
import { useChessActionsWithBranches } from "@/hooks/useChessActionsWithBranches";
import { useEffect } from "react";

interface GoToLastPositionButtonProps {
  isModalOpen?: boolean;
}

export default function GoToLastPositionButton({
  isModalOpen = false,
}: GoToLastPositionButtonProps) {
  const { setPgn: setBoardPgn } = useChessActionsWithBranches(boardAtom);
  const game = useAtomValue(gameAtom);
  const board = useAtomValue(boardAtom);

  const gameHistory = game.history();
  const boardHistory = board.history();

  const isButtonDisabled = boardHistory >= gameHistory;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Не обрабатываем клавиши если открыто модальное окно выбора веток
      if (isModalOpen) {
        return;
      }

      if (e.key === "ArrowUp") {
        if (isButtonDisabled) return;
        setBoardPgn(game.pgn());
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [setBoardPgn, game, isButtonDisabled, isModalOpen]);

  return (
    <Tooltip title="Go to final position">
      <Grid>
        <IconButton
          onClick={() => {
            if (isButtonDisabled) return;
            setBoardPgn(game.pgn());
          }}
          disabled={isButtonDisabled}
          sx={{ paddingX: 1.2, paddingY: 0.5 }}
        >
          <Icon icon="material-symbols:skip-next-outline" width={20} />
        </IconButton>
      </Grid>
    </Tooltip>
  );
}
