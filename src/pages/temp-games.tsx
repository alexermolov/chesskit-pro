import { PageTitle } from "@/components/pageTitle";
import { useTempGamesManager } from "@/hooks/useTempGamesManager";
import { Game, Player } from "@/types/game";
import { Icon } from "@iconify/react";
import {
  Alert,
  Button,
  ButtonGroup,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid2 as Grid,
  Snackbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { blue, green, red } from "@mui/material/colors";
import {
  DataGrid,
  GRID_DEFAULT_LOCALE_TEXT,
  GridActionsCellItem,
  GridColDef,
  GridLocaleText,
  GridRowId,
  GridRowModel,
  GridRowModes,
  GridRowModesModel,
  GridRowParams,
  MuiEvent,
} from "@mui/x-data-grid";
import { GetStaticProps } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { safeNavigate } from "@/lib/electronUtils";

// Преобразованная структура для DataGrid
interface GameRow {
  id: number;
  pgn: string;
  event?: string;
  site?: string;
  date?: string;
  round?: string;
  whiteName: string;
  whiteRating?: number;
  blackName: string;
  blackRating?: number;
  result?: string;
  hasEval: boolean;
  // Храним ссылки на оригинальные объекты
  originalWhite: Player;
  originalBlack: Player;
  originalEval?: any;
}

export default function TempGamesList() {
  const { t } = useTranslation(["navigation", "common", "chess"]);
  const {
    tempGamesList,
    removeFromTempList,
    clearTempList,
    exportTempListToPgn,
  } = useTempGamesManager();
  const router = useRouter();

  const gridLocaleText: GridLocaleText = {
    ...GRID_DEFAULT_LOCALE_TEXT,
    noRowsLabel: t("common:no_games"),
  };
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    "success" | "error" | "info" | "warning"
  >("success");

  // Состояние для диалога подтверждения очистки
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);

  // Преобразованные данные для DataGrid
  const [rows, setRows] = useState<GameRow[]>([]);

  // Преобразуем данные из tempGamesList в формат, подходящий для DataGrid
  useEffect(() => {
    const transformedRows = tempGamesList.map((game) => ({
      id: game.id,
      pgn: game.pgn,
      event: game.event || "",
      site: game.site || "",
      date: game.date || "",
      round: game.round || "",
      whiteName: game.white?.name || t("common:unknown"),
      whiteRating: game.white?.rating,
      blackName: game.black?.name || t("common:unknown"),
      blackRating: game.black?.rating,
      result: game.result || "",
      hasEval: !!game.eval,
      // Сохраняем оригинальные объекты для обратного преобразования
      originalWhite: game.white,
      originalBlack: game.black,
      originalEval: game.eval,
    }));

    setRows(transformedRows);
  }, [tempGamesList, t]);

  // Состояние для режима редактирования строк
  const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});

  // Функция для обновления данных временной игры
  const updateTempGame = useCallback(
    (updatedGameRow: GameRow) => {
      // Преобразуем обратно в формат Game
      const updatedGame: Game = {
        id: updatedGameRow.id,
        pgn: updatedGameRow.pgn,
        event: updatedGameRow.event,
        site: updatedGameRow.site,
        date: updatedGameRow.date,
        round: updatedGameRow.round,
        result: updatedGameRow.result,
        white: {
          ...updatedGameRow.originalWhite,
          name: updatedGameRow.whiteName,
          rating: updatedGameRow.whiteRating,
        },
        black: {
          ...updatedGameRow.originalBlack,
          name: updatedGameRow.blackName,
          rating: updatedGameRow.blackRating,
        },
        eval: updatedGameRow.originalEval,
      };

      // Обновляем список игр в localStorage
      const updatedList = tempGamesList.map((game) =>
        game.id === updatedGame.id ? updatedGame : game
      );
      window.localStorage.setItem("tempGamesList", JSON.stringify(updatedList));

      // Уведомляем пользователя
      setSnackbarMessage(t("common:game_updated"));
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    },
    [tempGamesList, t]
  );

  const handleDeleteGameRow = useCallback(
    (id: GridRowId) => () => {
      removeFromTempList(Number(id));
      setSnackbarMessage(t("common:game_removed"));
      setSnackbarSeverity("info");
      setSnackbarOpen(true);
    },
    [removeFromTempList, t]
  );

  const handleCopyGameRow = useCallback(
    (id: GridRowId) => () => {
      const game = tempGamesList.find((game) => game.id === id);
      if (game) {
        navigator.clipboard?.writeText?.(game.pgn);
        setSnackbarMessage(t("common:pgn_copied"));
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
      }
    },
    [tempGamesList, t]
  );

  const handleAnalyzeGame = useCallback(
    (id: GridRowId) => () => {
      // Используем безопасную навигацию для Electron
      safeNavigate(router, "/", { tempGameId: id });
    },
    [router]
  );

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

  // Функция для экспорта всех игр в один PGN файл
  const handleExportAllGames = useCallback(async () => {
    const result = await exportTempListToPgn();
    setSnackbarMessage(result.message);
    setSnackbarSeverity(result.success ? "success" : "warning");
    setSnackbarOpen(true);
  }, [exportTempListToPgn]);

  // Функции для управления режимом редактирования
  const handleEditClick = useCallback(
    (id: GridRowId) => () => {
      setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
    },
    [rowModesModel]
  );

  const handleSaveClick = useCallback(
    (id: GridRowId) => () => {
      setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
    },
    [rowModesModel]
  );

  const handleCancelClick = useCallback(
    (id: GridRowId) => () => {
      setRowModesModel({
        ...rowModesModel,
        [id]: { mode: GridRowModes.View, ignoreModifications: true },
      });
    },
    [rowModesModel]
  );

  // Обработчик события процесса сохранения изменений
  const processRowUpdate = useCallback(
    (newRow: GridRowModel) => {
      // Обновляем в localStorage
      updateTempGame(newRow as GameRow);
      return newRow;
    },
    [updateTempGame]
  );

  const handleRowEditStart = useCallback(
    (_: GridRowParams, event: MuiEvent) => {
      event.defaultMuiPrevented = true;
    },
    []
  );

  const handleRowEditStop = useCallback((_: GridRowParams, event: MuiEvent) => {
    event.defaultMuiPrevented = true;
  }, []);

  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: "event",
        headerName: t("chess:event"),
        width: 150,
        editable: true,
      },
      {
        field: "site",
        headerName: t("chess:site"),
        width: 150,
        editable: true,
      },
      {
        field: "date",
        headerName: t("chess:date"),
        width: 150,
        editable: true,
      },
      {
        field: "round",
        headerName: t("chess:round"),
        headerAlign: "center",
        align: "center",
        width: 150,
        editable: true,
      },
      {
        field: "whiteName",
        headerName: t("chess:white"),
        width: 150,
        headerAlign: "center",
        align: "center",
        editable: true,
      },
      {
        field: "whiteRating",
        headerName: t("common:rating"),
        width: 100,
        headerAlign: "center",
        align: "center",
        editable: true,
        type: "number",
      },
      {
        field: "result",
        headerName: t("chess:result"),
        headerAlign: "center",
        align: "center",
        width: 100,
        editable: true,
      },
      {
        field: "blackName",
        headerName: t("chess:black"),
        width: 150,
        headerAlign: "center",
        align: "center",
        editable: true,
      },
      {
        field: "blackRating",
        headerName: t("common:rating"),
        width: 100,
        headerAlign: "center",
        align: "center",
        editable: true,
        type: "number",
      },
      {
        field: "hasEval",
        headerName: t("chess:evaluation"),
        type: "boolean",
        headerAlign: "center",
        align: "center",
        width: 100,
      },
      {
        field: "openEvaluation",
        type: "actions",
        headerName: t("chess:analyze"),
        width: 100,
        cellClassName: "actions",
        getActions: ({ id }) => {
          return [
            <GridActionsCellItem
              icon={
                <Icon icon="streamline:magnifying-glass-solid" width="20px" />
              }
              label={t("chess:open_evaluation")}
              onClick={handleAnalyzeGame(id)}
              color="inherit"
              key={`${id}-open-eval-button`}
            />,
          ];
        },
      },
      {
        field: "actions",
        type: "actions",
        headerName: t("chess:actions"),
        width: 100,
        cellClassName: "actions",
        getActions: ({ id }) => {
          const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;

          if (isInEditMode) {
            return [
              <GridActionsCellItem
                icon={<Icon icon="mdi:check" color={green[400]} width="20px" />}
                label={t("common:save")}
                onClick={handleSaveClick(id)}
                key={`${id}-save-button`}
              />,
              <GridActionsCellItem
                icon={<Icon icon="mdi:close" color={red[400]} width="20px" />}
                label={t("common:cancel")}
                onClick={handleCancelClick(id)}
                key={`${id}-cancel-button`}
              />,
            ];
          }

          return [
            <GridActionsCellItem
              icon={<Icon icon="mdi:pencil" color={blue[400]} width="20px" />}
              label={t("common:edit")}
              onClick={handleEditClick(id)}
              key={`${id}-edit-button`}
            />,
            <GridActionsCellItem
              icon={
                <Icon icon="mdi:delete-outline" color={red[400]} width="20px" />
              }
              label={t("common:delete")}
              onClick={handleDeleteGameRow(id)}
              key={`${id}-delete-button`}
            />,
            <GridActionsCellItem
              icon={
                <Icon icon="ri:clipboard-line" color={blue[400]} width="20px" />
              }
              label={t("chess:copy_pgn")}
              onClick={handleCopyGameRow(id)}
              key={`${id}-copy-button`}
            />,
          ];
        },
      },
    ],
    [
      handleDeleteGameRow,
      handleCopyGameRow,
      handleAnalyzeGame,
      handleEditClick,
      handleSaveClick,
      handleCancelClick,
      rowModesModel,
      t,
    ]
  );

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <Grid
      container
      justifyContent="center"
      alignItems="center"
      gap={4}
      marginTop={6}
    >
      <PageTitle title={`ChessKit Pro - ${t("navigation:temp_games")}`} />

      <Grid
        container
        justifyContent="center"
        alignItems="center"
        gap={2}
        size={12}
      >
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            // Используем безопасную навигацию для Electron
            safeNavigate(router, "/");
          }}
          startIcon={<Icon icon="mdi:chess-queen" />}
        >
          {t("common:back_to_analysis")}
        </Button>

        {tempGamesList.length > 0 && (
          <ButtonGroup variant="outlined">
            {/* Новая кнопка очистки с подтверждением */}
            <Tooltip title={t("common:clear_all_tooltip")}>
              <Button
                color="error"
                onClick={handleOpenClearConfirm}
                startIcon={<Icon icon="mdi:delete-sweep" />}
              >
                {t("common:clear_all_games")}
              </Button>
            </Tooltip>

            <Tooltip title={t("common:export_all_tooltip")}>
              <Button
                color="primary"
                onClick={handleExportAllGames}
                startIcon={<Icon icon="mdi:file-export" />}
              >
                {t("common:export_all")}
              </Button>
            </Tooltip>
          </ButtonGroup>
        )}
      </Grid>

      <Grid container justifyContent="center" alignItems="center" size={12}>
        <Typography variant="subtitle2">
          {t("common:game_count", { count: tempGamesList.length })}
          <span
            style={{ marginLeft: "8px", fontStyle: "italic", color: "#666" }}
          >
            {t("common:edit_hint")}
          </span>
        </Typography>
      </Grid>

      <Grid
        maxWidth="100%"
        minWidth="50px"
        sx={{ height: "calc(100vh - 280px)", width: "90%" }}
      >
        <DataGrid
          aria-label="Temporary games list"
          rows={rows}
          columns={columns}
          disableColumnMenu
          editMode="row"
          rowModesModel={rowModesModel}
          onRowModesModelChange={(newModel) => setRowModesModel(newModel)}
          onRowEditStart={handleRowEditStart}
          onRowEditStop={handleRowEditStop}
          processRowUpdate={processRowUpdate}
          localeText={gridLocaleText}
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 25,
              },
            },
            sorting: {
              sortModel: [
                {
                  field: "date",
                  sort: "desc",
                },
              ],
            },
          }}
        />
      </Grid>

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
    </Grid>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? "en", [
      "common",
      "chess",
      "buttons",
      "navigation",
    ])),
  },
});
