import { useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useMemo } from "react";

export function useThemeColors() {
  const theme = useTheme();

  // Определяем цвета в зависимости от темы (мемоизируем)
  const colors = useMemo(
    () => ({
      moveColor: theme.palette.mode === "dark" ? "#90caf9" : "#1976d2",
      hoverColor:
        theme.palette.mode === "dark"
          ? alpha(theme.palette.primary.main, 0.15)
          : alpha(theme.palette.primary.main, 0.1),
      backgroundMain: theme.palette.mode === "dark" ? "#2d2d2d" : "#f7f7f7",
      backgroundVariation:
        theme.palette.mode === "dark" ? "#252525" : "#f0f0f0",
      moveNumberColor: theme.palette.mode === "dark" ? "#aaa" : "#666",
      variationBracketColor: theme.palette.mode === "dark" ? "#777" : "#999",
      commentColor: theme.palette.mode === "dark" ? "#81c784" : "#43a047",
      currentMoveBackground:
        theme.palette.mode === "dark"
          ? alpha(theme.palette.primary.main, 0.4)
          : alpha(theme.palette.primary.main, 0.2),
      commentBackground:
        theme.palette.mode === "dark"
          ? alpha(theme.palette.success.main, 0.1)
          : alpha(theme.palette.success.main, 0.05),
    }),
    [theme]
  );

  return { colors, theme };
}
