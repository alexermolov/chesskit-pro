import { PageTitle } from "@/components/pageTitle";
import { useTempGamesManager } from "@/hooks/useTempGamesManager";
import Board from "@/sections/analysis/board";
import AnalysisTab from "@/sections/analysis/panelBody/analysisTab";
import ClassificationTab from "@/sections/analysis/panelBody/classificationTab";
import GraphTab from "@/sections/analysis/panelBody/graphTab";
import PanelHeader from "@/sections/analysis/panelHeader";
import PanelToolBar from "@/sections/analysis/panelToolbar";
import { boardAtom, gameAtom, gameEvalAtom } from "@/sections/analysis/states";
import EngineSettingsButton from "@/sections/engineSettings/engineSettingsButton";
import { Icon } from "@iconify/react";
import {
  Box,
  Divider,
  Grid2 as Grid,
  Tab,
  Tabs,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Chess } from "chess.js";
import { useAtom, useAtomValue } from "jotai";
import { GetStaticProps } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function Analysis() {
  const { t } = useTranslation("chess");
  const [tab, setTab] = useState(0);
  const router = useRouter();
  const theme = useTheme();
  const isLgOrGreater = useMediaQuery(theme.breakpoints.up("lg"));

  const [game] = useAtom(gameAtom);
  const [, setBoard] = useAtom(boardAtom);
  const gameEval = useAtomValue(gameEvalAtom);
  const { getTempGameById, loadTempGame } = useTempGamesManager();

  // Определяем когда показывать вкладку ходов
  const showMovesTab = game && game.history().length > 0;

  useEffect(() => {
    const resetBoard = () => {
      setBoard(new Chess());
    };

    // Load temp game if tempGameId is provided in URL
    if (router.query.tempGameId) {
      const tempGameId = Number(router.query.tempGameId);
      const tempGame = getTempGameById(tempGameId);
      if (tempGame) {
        loadTempGame(tempGame, resetBoard);
      }
    }
  }, [router.query, getTempGameById, loadTempGame, setBoard]);

  return (
    <Grid container gap={4} justifyContent="space-evenly" alignItems="start">
      <PageTitle title={`ChessKit Pro - ${t("analysis")}`} />

      {/* <Grid container justifyContent="center" alignItems="center" size={12}>
        <Link href="/temp-games" passHref>
          <Button
            variant="outlined"
            startIcon={<Icon icon="mdi:playlist-play" />}
            sx={{ mb: 2 }}
          >
            Temporary Games List ({tempGamesList.length})
          </Button>
        </Link>
      </Grid> */}

      <Board />

      <Grid
        container
        justifyContent="start"
        alignItems="center"
        borderRadius={2}
        border={1}
        borderColor={"secondary.main"}
        sx={{
          backgroundColor: "secondary.main",
          borderColor: "primary.main",
          borderWidth: 2,
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.5)",
        }}
        padding={2}
        style={{
          maxWidth: "1200px",
        }}
        rowGap={2}
        height={{ xs: tab === 1 ? "40rem" : "auto", lg: "calc(95vh - 60px)" }}
        display="flex"
        flexDirection="column"
        flexWrap="nowrap"
        size={{
          xs: 12,
          lg: "grow",
        }}
      >
        {isLgOrGreater ? (
          <Box width="100%">
            <PanelHeader key="analysis-panel-header" />
            <Divider sx={{ marginX: "5%", marginTop: 2.5 }} />
          </Box>
        ) : (
          <PanelToolBar key="review-panel-toolbar" />
        )}

        {!isLgOrGreater && <Divider sx={{ marginX: "5%" }} />}
        {!isLgOrGreater && <PanelHeader key="analysis-panel-header" />}

        {!isLgOrGreater && (
          <Box
            width="95%"
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              marginX: { sm: "5%", xs: undefined },
            }}
          >
            <Tabs
              value={tab}
              onChange={(_, newValue) => setTab(newValue)}
              aria-label="basic tabs example"
              variant="fullWidth"
              sx={{ minHeight: 0 }}
            >
              <Tab
                label={t("analysis")}
                id="tab0"
                icon={<Icon icon="mdi:magnify" height={15} />}
                iconPosition="start"
                sx={{
                  textTransform: "none",
                  minHeight: 15,
                  padding: "5px 0em 12px",
                }}
                disableFocusRipple
              />

              <Tab
                label={t("moves")}
                id="tab1"
                icon={<Icon icon="mdi:format-list-bulleted" height={15} />}
                iconPosition="start"
                sx={{
                  textTransform: "none",
                  minHeight: 15,
                  display: showMovesTab ? undefined : "none",
                  padding: "5px 0em 12px",
                }}
                disableFocusRipple
              />

              <Tab
                label={t("graph")}
                id="tab2"
                icon={<Icon icon="mdi:chart-line" height={15} />}
                iconPosition="start"
                sx={{
                  textTransform: "none",
                  minHeight: 15,
                  display: gameEval ? undefined : "none",
                  padding: "5px 0em 12px",
                }}
                disableFocusRipple
              />
            </Tabs>
          </Box>
        )}

        <GraphTab
          role="tabpanel"
          hidden={tab !== 2 && !isLgOrGreater}
          id="tabContent2"
        />

        <AnalysisTab
          role="tabpanel"
          hidden={tab !== 0 && !isLgOrGreater}
          id="tabContent0"
        />

        <ClassificationTab
          role="tabpanel"
          hidden={tab !== 1 && !isLgOrGreater}
          id="tabContent1"
        />

        {isLgOrGreater && (
          <Box width="100%">
            <Divider sx={{ marginX: "5%", marginBottom: 1.5 }} />
            <PanelToolBar key="review-panel-toolbar" />
          </Box>
        )}

        {!isLgOrGreater && gameEval && (
          <Box width="100%">
            <Divider sx={{ marginX: "5%", marginBottom: 2.5 }} />
            <PanelHeader key="analysis-panel-header" />
          </Box>
        )}
      </Grid>

      <EngineSettingsButton />
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
