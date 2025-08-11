import { useTempGamesManager } from "@/hooks/useTempGamesManager";
import { getGameToSave } from "@/lib/chess";
import { MoveTreeUtils } from "@/types/moveTree";
import { Icon } from "@iconify/react";
import {
  Alert,
  Grid2 as Grid,
  IconButton,
  Snackbar,
  Tooltip,
} from "@mui/material";
import { Chess } from "chess.js";
import { useAtomValue } from "jotai";
import { useTranslation } from "next-i18next";
import { useState } from "react";
import { boardAtom, gameAtom, gameEvalAtom, moveTreeAtom } from "../states";

export default function AddToTempListButton() {
  const { t } = useTranslation("chess");
  const game = useAtomValue(gameAtom);
  const board = useAtomValue(boardAtom);
  const gameEval = useAtomValue(gameEvalAtom);
  const moveTree = useAtomValue(moveTreeAtom);
  const { addToTempList } = useTempGamesManager();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    "success" | "error" | "info" | "warning"
  >("success");

  // Check for moves in the tree or in old atoms for compatibility
  const hasMovesInTree = Object.keys(moveTree.nodes).length > 1;
  const enableAdd =
    hasMovesInTree || board.history().length || game.history().length;

  const handleAddToTempList = () => {
    if (!enableAdd) return;

    try {
      let pgnToSave: string;

      // If there is a move tree with branches, use the new method
      if (hasMovesInTree) {
        // Get PGN with branches
        pgnToSave = MoveTreeUtils.toPgn(moveTree);
      } else {
        // Fallback to the old method for compatibility
        const gameToSave = getGameToSave(game, board);
        pgnToSave = gameToSave.pgn();
      }

      // Check that PGN is valid
      try {
        const testGame = new Chess();
        testGame.loadPgn(pgnToSave);
      } catch (e) {
        console.error("Invalid PGN:", e);
        setSnackbarMessage("Unable to save: invalid game format");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        return;
      }

      // Format the game to add to the list
      const headers = game.getHeaders();
      const gameToAdd = {
        id: Date.now(), // Temporary ID
        pgn: pgnToSave,
        event: headers.Event || "Game Analysis",
        site: headers.Site || "Chesskit-Pro",
        date:
          headers.Date ||
          new Date().toISOString().split("T")[0].replace(/-/g, "."),
        round: headers.Round ?? "?",
        white: {
          name: headers.White || "White",
          rating: headers.WhiteElo ? Number(headers.WhiteElo) : undefined,
        },
        black: {
          name: headers.Black || "Black",
          rating: headers.BlackElo ? Number(headers.BlackElo) : undefined,
        },
        result: headers.Result || "*",
        termination: headers.Termination || "Unterminated",
        timeControl: headers.TimeControl,
        eval: gameEval,
      };

      // Add the game to the list through the hook
      addToTempList(gameToAdd);

      // Show success notification
      setSnackbarMessage(t("game_added_to_temporary_list"));
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Error adding game to temporary list:", error);
      setSnackbarMessage(t("failed_to_add_game_to_list"));
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <>
      <Tooltip title={t("add_to_temporary_list")}>
        <Grid>
          <IconButton
            onClick={handleAddToTempList}
            disabled={!enableAdd}
            sx={{ paddingX: 1.2, paddingY: 0.5 }}
          >
            <Icon icon="mdi:playlist-plus" />
          </IconButton>
        </Grid>
      </Tooltip>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
