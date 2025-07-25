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
      sx={{
        width: "100%",
        height: "100%",
      }}
      maxHeight="calc(100vh - 250px)"
      id="moves-panel-container" // Изменяем ID для уникальности
    >
      <BranchesMovesPanel />
    </Grid>
  );
}
