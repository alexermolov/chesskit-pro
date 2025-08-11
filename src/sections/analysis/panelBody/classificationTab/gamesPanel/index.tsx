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
import { useTranslation } from "next-i18next";
import { useCallback, useState } from "react";
import { gameAtom, gameEvalAtom } from "../../../states";
import { GameInfo, gamesListAtom } from "../../../states/gamesListState";

export default function GamesPanel() {
  const { t } = useTranslation(["common", "chess"]);
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
    setSnackbarMessage(t("common:list_cleared"));
    setSnackbarSeverity("info");
    setSnackbarOpen(true);
  }, [clearTempList, t]);

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
            {t("common:no_games_available")}
          </Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ height: "100%", overflow: "auto", p: 2 }}>
        <Typography variant="h6" component="div" sx={{ mb: 2 }}>
          {t("common:loaded_games")} ({gamesList.length})
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
                {game.date
                  ? formatDate(new Date(game.date))
                  : t("common:no_date")}
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
              {t("common:load")}
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
            {t("common:no_temp_games")}
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" component="div">
              {t("common:use_add_button_tooltip")}
            </Typography>
          </Box>
          <Box sx={{ mt: 3 }}>
            <Button
              component={Link}
              href="/temp-games"
              variant="outlined"
              size="small"
              startIcon={<Icon icon="mdi:playlist-play" />}
            >
              {t("common:go_to_temp_games")}
            </Button>
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
            {t("common:temp_games_list")} ({tempGamesList.length})
          </Typography>
          <ButtonGroup variant="outlined" size="small">
            {/* Новая кнопка очистки с подтверждением */}
            <Tooltip title={t("common:clear_all_tooltip")}>
              <Button
                onClick={handleOpenClearConfirm}
                startIcon={<Icon icon="mdi:delete-sweep" />}
                color="error"
              >
                {t("common:clear")}
              </Button>
            </Tooltip>
            <Tooltip title={t("common:export_all_tooltip")}>
              <Button
                onClick={handleExportAllTempGames}
                startIcon={<Icon icon="mdi:file-export" />}
              >
                {t("common:export")}
              </Button>
            </Tooltip>
            <Button
              component={Link}
              href="/temp-games"
              startIcon={<Icon icon="mdi:playlist-plus" />}
            >
              {t("navigation:temp_games")}
            </Button>
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
                {game.white?.name || t("common:white")} vs{" "}
                {game.black?.name || t("common:black")}
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
                  : t("common:no_date")}
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
              {t("common:load")}
            </Button>
          </Box>
        ))}

        {tempGamesList.length > 5 && (
          <Box sx={{ textAlign: "center", mt: 2 }}>
            <Link href="/temp-games" passHref>
              <Button variant="text" size="small">
                {t("common:view_all_games", { count: tempGamesList.length })}
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
          <Tab
            label={t("common:loaded_games_tab", { count: gamesList.length })}
          />
          <Tab
            label={t("common:temp_list_tab", { count: tempGamesList.length })}
          />
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
          {t("common:confirm_clear_title")}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="clear-dialog-description">
            {t("common:confirm_clear_message", { count: tempGamesList.length })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseClearConfirm} color="primary">
            {t("common:cancel")}
          </Button>
          <Button
            onClick={handleConfirmClear}
            color="error"
            variant="contained"
            startIcon={<Icon icon="mdi:delete-forever" />}
          >
            {t("common:clear_all_confirm")}
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
