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
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";

const gridLocaleText: GridLocaleText = {
  ...GRID_DEFAULT_LOCALE_TEXT,
  noRowsLabel: "No games in temporary list",
};

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
  const {
    tempGamesList,
    removeFromTempList,
    clearTempList,
    exportTempListToPgn,
  } = useTempGamesManager();
  const router = useRouter();
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
      whiteName: game.white?.name || "Unknown",
      whiteRating: game.white?.rating,
      blackName: game.black?.name || "Unknown",
      blackRating: game.black?.rating,
      result: game.result || "",
      hasEval: !!game.eval,
      // Сохраняем оригинальные объекты для обратного преобразования
      originalWhite: game.white,
      originalBlack: game.black,
      originalEval: game.eval,
    }));

    setRows(transformedRows);
  }, [tempGamesList]);

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
      setSnackbarMessage("Game details updated successfully");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    },
    [tempGamesList]
  );

  const handleDeleteGameRow = useCallback(
    (id: GridRowId) => () => {
      removeFromTempList(Number(id));
      setSnackbarMessage("Game removed from list");
      setSnackbarSeverity("info");
      setSnackbarOpen(true);
    },
    [removeFromTempList]
  );

  const handleCopyGameRow = useCallback(
    (id: GridRowId) => () => {
      const game = tempGamesList.find((game) => game.id === id);
      if (game) {
        navigator.clipboard?.writeText?.(game.pgn);
        setSnackbarMessage("PGN copied to clipboard");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
      }
    },
    [tempGamesList]
  );

  const handleAnalyzeGame = useCallback(
    (id: GridRowId) => () => {
      router.push({ pathname: "/", query: { tempGameId: id } });
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
    setSnackbarMessage("Temporary games list cleared");
    setSnackbarSeverity("info");
    setSnackbarOpen(true);
  }, [clearTempList]);

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
        headerName: "Event",
        width: 150,
        editable: true,
      },
      {
        field: "site",
        headerName: "Site",
        width: 150,
        editable: true,
      },
      {
        field: "date",
        headerName: "Date",
        width: 150,
        editable: true,
      },
      {
        field: "round",
        headerName: "Round",
        headerAlign: "center",
        align: "center",
        width: 150,
        editable: true,
      },
      {
        field: "whiteName",
        headerName: "White",
        width: 150,
        headerAlign: "center",
        align: "center",
        editable: true,
      },
      {
        field: "whiteRating",
        headerName: "Rating",
        width: 100,
        headerAlign: "center",
        align: "center",
        editable: true,
        type: "number",
      },
      {
        field: "result",
        headerName: "Result",
        headerAlign: "center",
        align: "center",
        width: 100,
        editable: true,
      },
      {
        field: "blackName",
        headerName: "Black",
        width: 150,
        headerAlign: "center",
        align: "center",
        editable: true,
      },
      {
        field: "blackRating",
        headerName: "Rating",
        width: 100,
        headerAlign: "center",
        align: "center",
        editable: true,
        type: "number",
      },
      {
        field: "hasEval",
        headerName: "Evaluation",
        type: "boolean",
        headerAlign: "center",
        align: "center",
        width: 100,
      },
      {
        field: "openEvaluation",
        type: "actions",
        headerName: "Analyze",
        width: 100,
        cellClassName: "actions",
        getActions: ({ id }) => {
          return [
            <GridActionsCellItem
              icon={
                <Icon icon="streamline:magnifying-glass-solid" width="20px" />
              }
              label="Open Evaluation"
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
        headerName: "Actions",
        width: 100,
        cellClassName: "actions",
        getActions: ({ id }) => {
          const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;

          if (isInEditMode) {
            return [
              <GridActionsCellItem
                icon={<Icon icon="mdi:check" color={green[400]} width="20px" />}
                label="Save"
                onClick={handleSaveClick(id)}
                key={`${id}-save-button`}
              />,
              <GridActionsCellItem
                icon={<Icon icon="mdi:close" color={red[400]} width="20px" />}
                label="Cancel"
                onClick={handleCancelClick(id)}
                key={`${id}-cancel-button`}
              />,
            ];
          }

          return [
            <GridActionsCellItem
              icon={<Icon icon="mdi:pencil" color={blue[400]} width="20px" />}
              label="Edit"
              onClick={handleEditClick(id)}
              key={`${id}-edit-button`}
            />,
            <GridActionsCellItem
              icon={
                <Icon icon="mdi:delete-outline" color={red[400]} width="20px" />
              }
              label="Delete"
              onClick={handleDeleteGameRow(id)}
              key={`${id}-delete-button`}
            />,
            <GridActionsCellItem
              icon={
                <Icon icon="ri:clipboard-line" color={blue[400]} width="20px" />
              }
              label="Copy pgn"
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
      <PageTitle title="Chesskit-Pro Temporary Games List" />

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
          onClick={() => router.push("/")}
          startIcon={<Icon icon="mdi:chess-queen" />}
        >
          Back to Analysis
        </Button>

        {tempGamesList.length > 0 && (
          <ButtonGroup variant="outlined">
            {/* Новая кнопка очистки с подтверждением */}
            <Tooltip title="Clear all games from the temporary list">
              <Button
                color="error"
                onClick={handleOpenClearConfirm}
                startIcon={<Icon icon="mdi:delete-sweep" />}
              >
                Clear All Games
              </Button>
            </Tooltip>

            <Tooltip title="Export all games to a single PGN file">
              <Button
                color="primary"
                onClick={handleExportAllGames}
                startIcon={<Icon icon="mdi:file-export" />}
              >
                Export All
              </Button>
            </Tooltip>
          </ButtonGroup>
        )}
      </Grid>

      <Grid container justifyContent="center" alignItems="center" size={12}>
        <Typography variant="subtitle2">
          You have {tempGamesList.length} game
          {tempGamesList.length !== 1 && "s"} in your temporary list.
          <span
            style={{ marginLeft: "8px", fontStyle: "italic", color: "#666" }}
          >
            Double-click on a cell or click the edit icon to modify game
            details.
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
          Confirm Clear All Games
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
    </Grid>
  );
}
