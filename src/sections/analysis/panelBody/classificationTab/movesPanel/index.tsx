import { Grid2 as Grid } from "@mui/material";
import BranchesMovesPanel from "./branchesMovesPanel";

export default function MovesPanel() {
  return (
    <Grid
      container
      justifyContent="center"
      alignItems="start"
      gap={0.5}
      paddingY={1}
      sx={{ scrollbarWidth: "thin", overflowY: "auto", width: "100%" }}
      maxHeight="100%"
      size={6}
      id="moves-panel"
    >
      <BranchesMovesPanel />
    </Grid>
  );
}
