import { Grid2Props as GridProps, Tab, Tabs, Box } from "@mui/material";
import { useAtomValue } from "jotai";
import { useState } from "react";
import { gameEvalAtom } from "../../states";
import MovesClassificationsRecap from "./movesClassificationsRecap";
import MovesPanel from "./movesPanel";

export default function ClassificationTab(props: GridProps) {
  const gameEval = useAtomValue(gameEvalAtom);
  const hasClassifications =
    Array.isArray(gameEval?.positions) && gameEval.positions.length > 0;

  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
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
        ...props.sx,
      }}
    >
      {/* Табы - всегда сверху */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", flexShrink: 0 }}>
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
          {hasClassifications && (
            <Tab
              label="Classification"
              id="classification-tab-1"
              aria-controls="classification-tabpanel-1"
            />
          )}
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
        {hasClassifications && (
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
            <MovesClassificationsRecap />
          </Box>
        )}
      </Box>
    </Box>
  );
}
