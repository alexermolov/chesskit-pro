import { Grid2 as Grid, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import {
  DataGrid,
  GridColDef,
  GridLocaleText,
  GRID_DEFAULT_LOCALE_TEXT,
  GridActionsCellItem,
  GridRowId,
} from "@mui/x-data-grid";
import { useCallback, useMemo } from "react";
import { blue, red } from "@mui/material/colors";
import LoadGameButton from "@/sections/loadGame/loadGameButton";
import { useGameDatabase } from "@/hooks/useGameDatabase";
import { useRouter } from "next/router";
import { PageTitle } from "@/components/pageTitle";
import { GetStaticProps } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { safeNavigate } from "@/lib/electronUtils";

export default function GameDatabase() {
  const { t } = useTranslation("chess");
  const { t: tCommon } = useTranslation("common");
  const { games, deleteGame } = useGameDatabase(true);
  const router = useRouter();

  const gridLocaleText: GridLocaleText = {
    ...GRID_DEFAULT_LOCALE_TEXT,
    noRowsLabel: tCommon("no_games_found"),
  };

  const handleDeleteGameRow = useCallback(
    (id: GridRowId) => async () => {
      if (typeof id !== "number") {
        throw new Error(tCommon("unable_to_remove_game"));
      }
      await deleteGame(id);
    },
    [deleteGame, tCommon]
  );

  const handleCopyGameRow = useCallback(
    (id: GridRowId) => async () => {
      if (typeof id !== "number") {
        throw new Error(tCommon("unable_to_copy_game"));
      }
      await navigator.clipboard?.writeText?.(games[id - 1].pgn);
    },
    [games, tCommon]
  );

  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: "event",
        headerName: t("event"),
        width: 150,
      },
      {
        field: "site",
        headerName: t("site"),
        width: 150,
      },
      {
        field: "date",
        headerName: t("date"),
        width: 150,
      },
      {
        field: "round",
        headerName: t("round"),
        headerAlign: "center",
        align: "center",
        width: 150,
      },
      {
        field: "whiteLabel",
        headerName: tCommon("white"),
        width: 200,
        headerAlign: "center",
        align: "center",
        valueGetter: (_, row) =>
          `${row.white.name ?? tCommon("unknown")} (${row.white.rating ?? "?"})`,
      },
      {
        field: "result",
        headerName: t("result"),
        headerAlign: "center",
        align: "center",
        width: 100,
      },
      {
        field: "blackLabel",
        headerName: tCommon("black"),
        width: 200,
        headerAlign: "center",
        align: "center",
        valueGetter: (_, row) =>
          `${row.black.name ?? tCommon("unknown")} (${row.black.rating ?? "?"})`,
      },
      {
        field: "eval",
        headerName: t("evaluation"),
        type: "boolean",
        headerAlign: "center",
        align: "center",
        width: 100,
        valueGetter: (_, row) => !!row.eval,
      },
      {
        field: "openEvaluation",
        type: "actions",
        headerName: t("analyze"),
        width: 100,
        cellClassName: "actions",
        getActions: ({ id }) => {
          return [
            <GridActionsCellItem
              icon={
                <Icon icon="streamline:magnifying-glass-solid" width="20px" />
              }
              label={t("open_evaluation")}
              onClick={() => {
                // Используем безопасную навигацию для Electron
                safeNavigate(router, "/", { gameId: id });
              }}
              color="inherit"
              key={`${id}-open-eval-button`}
            />,
          ];
        },
      },
      {
        field: "delete",
        type: "actions",
        headerName: tCommon("delete"),
        width: 100,
        cellClassName: "actions",
        getActions: ({ id }) => {
          return [
            <GridActionsCellItem
              icon={
                <Icon icon="mdi:delete-outline" color={red[400]} width="20px" />
              }
              label={tCommon("delete")}
              onClick={handleDeleteGameRow(id)}
              color="inherit"
              key={`${id}-delete-button`}
            />,
          ];
        },
      },
      {
        field: "copy pgn",
        type: "actions",
        headerName: t("copy_pgn"),
        width: 100,
        cellClassName: "actions",
        getActions: ({ id }) => {
          return [
            <GridActionsCellItem
              icon={
                <Icon icon="ri:clipboard-line" color={blue[400]} width="20px" />
              }
              label={t("copy_pgn")}
              onClick={handleCopyGameRow(id)}
              color="inherit"
              key={`${id}-copy-button`}
            />,
          ];
        },
      },
    ],
    [handleDeleteGameRow, handleCopyGameRow, router, t, tCommon]
  );

  return (
    <Grid
      container
      justifyContent="center"
      alignItems="center"
      gap={4}
      marginTop={6}
    >
      <PageTitle title={`ChessKit Pro - ${t("database")}`} />

      <Grid container justifyContent="center" alignItems="center" size={12}>
        <LoadGameButton />
      </Grid>

      <Grid container justifyContent="center" alignItems="center" size={12}>
        <Typography variant="subtitle2">
          {tCommon("you_have_games", { count: games.length })}
        </Typography>
      </Grid>

      <Grid maxWidth="100%" minWidth="50px">
        <DataGrid
          aria-label={tCommon("games_list")}
          rows={games}
          columns={columns}
          disableColumnMenu
          hideFooter={true}
          localeText={gridLocaleText}
          initialState={{
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
