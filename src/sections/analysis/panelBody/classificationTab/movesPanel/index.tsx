import { Box } from "@mui/material";
import { useAtomValue } from "jotai";
import { movesDisplayModeAtom } from "../../../states";
import BranchesMovesPanel from "./branchesMovesPanel";
import VariationsPanel from "./variationsPanel";
import MovesDisplayModeToggle from "./movesDisplayModeToggle";

export default function MovesPanel() {
  const displayMode = useAtomValue(movesDisplayModeAtom);

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        maxHeight: "calc(100vh - 250px)",
        display: "flex",
        flexDirection: "column",
        gap: 0.5,
        paddingY: 1,
      }}
      id="moves-panel-container"
    >
      {/* Toggle button for switching between modes - always centered */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          px: 1,
          flexShrink: 0,
        }}
      >
        <MovesDisplayModeToggle />
      </Box>

      {/* Display the appropriate panel based on mode */}
      <Box sx={{ flexGrow: 1, minHeight: 0, overflow: "hidden" }}>
        {displayMode === "tree" ? <BranchesMovesPanel /> : <VariationsPanel />}
      </Box>
    </Box>
  );
}
