import { Box, Grid2Props as GridProps, Tab, Tabs } from "@mui/material";
import { useAtomValue } from "jotai";
import { useState } from "react";
import { gameEvalAtom } from "../../states";
import MovesClassificationsRecap from "./movesClassificationsRecap";
import MovesPanel from "./movesPanel";
import GamesPanel from "./gamesPanel";

export default function ClassificationTab(props: GridProps) {
  const gameEval = useAtomValue(gameEvalAtom);
  const hasClassifications =
    Array.isArray(gameEval?.positions) && gameEval.positions.length > 0;

  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box
      sx={{
        ...(props.hidden ? { display: "none" } : {}),
        height: "100%",
        maxHeight: "calc(100vh - 200px)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        width: "100%",
        ...props.sx,
      }}
    >
      {/* Табы - всегда сверху */}
      <Box
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          flexShrink: 0,
          width: "100%",
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="classification tabs"
          variant="fullWidth"
        >
          <Tab
            label="Moves"
            id="moves-tab-0"
            aria-controls="moves-tabpanel-0"
          />
          <Tab
            label="Classification"
            id="classification-tab-1"
            aria-controls="classification-tabpanel-1"
          />
          <Tab
            label="Games"
            id="games-tab-2"
            aria-controls="games-tabpanel-2"
          />
        </Tabs>
      </Box>

      {/* Контент табов - занимает оставшееся пространство */}
      <Box sx={{ flexGrow: 1, overflow: "hidden", minHeight: 0 }}>
        {/* Таб с ходами */}
        <Box
          role="tabpanel"
          hidden={activeTab !== 0}
          id="moves-tabpanel-0"
          aria-labelledby="moves-tab-0"
          sx={{
            height: "100%",
            display: activeTab === 0 ? "block" : "none",
          }}
        >
          <MovesPanel />
        </Box>

        {/* Таб с классификацией */}
        <Box
          role="tabpanel"
          hidden={activeTab !== 1}
          id="classification-tabpanel-1"
          aria-labelledby="classification-tab-1"
          sx={{
            height: "100%",
            display: activeTab === 1 ? "block" : "none",
          }}
        >
          {hasClassifications ? (
            <MovesClassificationsRecap />
          ) : (
            <Box sx={{ p: 3, textAlign: "center" }}>
              <Box sx={{ mb: 2, color: "text.secondary" }}>
                Classification data is not available yet.
              </Box>
              <Box sx={{ color: "text.secondary", fontSize: "0.9rem" }}>
                Run the engine analysis to see move classifications.
              </Box>
            </Box>
          )}
        </Box>

        {/* Таб с играми */}
        <Box
          role="tabpanel"
          hidden={activeTab !== 2}
          id="games-tabpanel-2"
          aria-labelledby="games-tab-2"
          sx={{
            height: "100%",
            display: activeTab === 2 ? "block" : "none",
          }}
        >
          <GamesPanel />
        </Box>
      </Box>
    </Box>
  );
}
