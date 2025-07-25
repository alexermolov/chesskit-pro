import { useChessActionsWithBranches } from "@/hooks/useChessActionsWithBranches";
import { useTempGamesManager } from "@/hooks/useTempGamesManager";
import { formatDate } from "@/lib/helpers";
import { Game } from "@/types/game";
import { Icon } from "@iconify/react";
import {
  Alert,
  Box,
  Button,
  ButtonGroup,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from "@mui/material";
import { useAtomValue, useSetAtom } from "jotai";
import Link from "next/link";
import { useCallback, useState } from "react";
import { gameAtom, gameEvalAtom } from "../../../states";
import { GameInfo, gamesListAtom } from "../../../states/gamesListState";

export default function GamesPanel() {
  const gamesList = useAtomValue(gamesListAtom);
  const { tempGamesList, loadTempGame, exportTempListToPgn, clearTempList } =
    useTempGamesManager();
  const { setPgn, reset } = useChessActionsWithBranches(gameAtom);
  const setEval = useSetAtom(gameEvalAtom);
  const [tab, setTab] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    "success" | "error" | "info" | "warning"
  >("success");

  // Состояние для диалога подтверждения очистки
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);

  // Функция для объединения всех игр в один PGN файл и его скачивания
  const handleExportAllTempGames = useCallback(async () => {
    const result = await exportTempListToPgn();
    setSnackbarMessage(result.message);
    setSnackbarSeverity(result.success ? "success" : "warning");
    setSnackbarOpen(true);
  }, [exportTempListToPgn]);

  // Открыть диалог подтверждения очистки
  const handleOpenClearConfirm = useCallback(() => {
    setClearConfirmOpen(true);
  }, []);

  // Закрыть диалог подтверждения очистки
  const handleCloseClearConfirm = useCallback(() => {
    setClearConfirmOpen(false);
  }, []);

  // Очистить список после подтверждения
  const handleConfirmClear = useCallback(() => {
    clearTempList();
    setClearConfirmOpen(false);
    setSnackbarMessage("Temporary games list cleared");
    setSnackbarSeverity("info");
    setSnackbarOpen(true);
  }, [clearTempList]);

  // Обновленная функция загрузки игры
  const handleLoadGame = useCallback(
    (game: GameInfo) => {
      reset();
      setEval(undefined);
      setPgn(game.pgn);
    },
    [reset, setEval, setPgn]
  );

  // Функция загрузки игры из временного списка
  const handleLoadTempGame = useCallback(
    (game: Game) => {
      loadTempGame(game, reset);
    },
    [loadTempGame, reset]
  );

  // Содержимое вкладки с загруженными играми
  const renderLoadedGames = () => {
    if (gamesList.length === 0) {
      return (
        <Box sx={{ p: 3, textAlign: "center", height: "100%" }}>
          <Typography variant="body1" color="text.secondary" component="div">
            No games available. Load a PGN file containing multiple games to see
            them here.
          </Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ height: "100%", overflow: "auto", p: 2 }}>
        <Typography variant="h6" component="div" sx={{ mb: 2 }}>
          Loaded Games ({gamesList.length})
        </Typography>

        {gamesList.map((game) => (
          <Box
            key={game.id}
            sx={{
              p: 2,
              mb: 1.5,
              border: "1px solid #e0e0e0",
              borderRadius: 1,
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              "&:hover": {
                backgroundColor: "rgba(59, 154, 198, 0.08)",
              },
            }}
          >
            <Box sx={{ flexGrow: 1, pr: 2 }}>
              <Typography
                variant="subtitle1"
                component="div"
                fontWeight="medium"
              >
                {game.white} vs {game.black}
              </Typography>

              <Typography
                variant="body2"
                component="div"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                {game.result} •{" "}
                {game.date ? formatDate(new Date(game.date)) : "No date"}
              </Typography>

              {game.headers.Event && (
                <Typography
                  variant="body2"
                  component="div"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  {game.headers.Event}
                </Typography>
              )}
            </Box>

            <Button
              variant="contained"
              size="small"
              onClick={() => handleLoadGame(game)}
            >
              Загрузить
            </Button>
          </Box>
        ))}
      </Box>
    );
  };

  // Содержимое вкладки с временными играми
  const renderTempGames = () => {
    if (tempGamesList.length === 0) {
      return (
        <Box sx={{ p: 3, textAlign: "center", height: "100%" }}>
          <Typography variant="body1" color="text.secondary" component="div">
            No temporary games available. Add games to the temporary list to see
            them here.
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" component="div">
              Use the <Icon icon="mdi:playlist-plus" inline={true} /> button in
              the toolbar to add the current game to the list.
            </Typography>
          </Box>
          <Box sx={{ mt: 3 }}>
            <Link href="/temp-games" passHref>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Icon icon="mdi:playlist-play" />}
              >
                Go to Temp Games Page
              </Button>
            </Link>
          </Box>
        </Box>
      );
    }

    return (
      <Box sx={{ height: "100%", overflow: "auto", p: 2 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6" component="div">
            Temporary Games ({tempGamesList.length})
          </Typography>
          <ButtonGroup variant="outlined" size="small">
            {/* Новая кнопка очистки с подтверждением */}
            <Tooltip title="Clear all temporary games">
              <Button
                onClick={handleOpenClearConfirm}
                startIcon={<Icon icon="mdi:delete-sweep" />}
                color="error"
              >
                Clear
              </Button>
            </Tooltip>
            <Tooltip title="Export all games to PGN file">
              <Button
                onClick={handleExportAllTempGames}
                startIcon={<Icon icon="mdi:file-export" />}
              >
                Export
              </Button>
            </Tooltip>
            <Link href="/temp-games" passHref>
              <Button startIcon={<Icon icon="mdi:playlist-play" />}>
                Full List
              </Button>
            </Link>
          </ButtonGroup>
        </Box>

        {tempGamesList.slice(0, 5).map((game) => (
          <Box
            key={game.id}
            sx={{
              p: 2,
              mb: 1.5,
              border: "1px solid #e0e0e0",
              borderRadius: 1,
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              "&:hover": {
                backgroundColor: "rgba(59, 154, 198, 0.08)",
              },
            }}
          >
            <Box sx={{ flexGrow: 1, pr: 2 }}>
              <Typography
                variant="subtitle1"
                component="div"
                fontWeight="medium"
              >
                {game.white?.name || "White"} vs {game.black?.name || "Black"}
              </Typography>

              <Typography
                variant="body2"
                component="div"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                {game.result || "*"} •{" "}
                {game.date
                  ? formatDate(new Date(game.date.replace(/\./g, "-")))
                  : "No date"}
              </Typography>

              {game.event && (
                <Typography
                  variant="body2"
                  component="div"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  {game.event}
                </Typography>
              )}
            </Box>

            <Button
              variant="contained"
              size="small"
              onClick={() => handleLoadTempGame(game)}
            >
              Загрузить
            </Button>
          </Box>
        ))}

        {tempGamesList.length > 5 && (
          <Box sx={{ textAlign: "center", mt: 2 }}>
            <Link href="/temp-games" passHref>
              <Button variant="text" size="small">
                View all {tempGamesList.length} games
              </Button>
            </Link>
          </Box>
        )}
      </Box>
    );
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={tab}
          onChange={(_, newValue) => setTab(newValue)}
          aria-label="game lists tabs"
          variant="fullWidth"
        >
          <Tab label={`Loaded Games (${gamesList.length})`} />
          <Tab label={`Temp List (${tempGamesList.length})`} />
        </Tabs>
      </Box>

      <Box sx={{ flexGrow: 1, overflow: "auto" }}>
        {tab === 0 ? renderLoadedGames() : renderTempGames()}
      </Box>

      {/* Диалог подтверждения очистки */}
      <Dialog
        open={clearConfirmOpen}
        onClose={handleCloseClearConfirm}
        aria-labelledby="clear-dialog-title"
        aria-describedby="clear-dialog-description"
      >
        <DialogTitle id="clear-dialog-title">
          Confirm Clear All Temporary Games
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="clear-dialog-description">
            Are you sure you want to clear all {tempGamesList.length} games from
            the temporary list? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseClearConfirm} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmClear}
            color="error"
            variant="contained"
            startIcon={<Icon icon="mdi:delete-forever" />}
          >
            Clear All Games
          </Button>
        </DialogActions>
      </Dialog>

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
    </Box>
  );
}
