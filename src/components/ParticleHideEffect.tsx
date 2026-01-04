import { Box } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { ReactNode } from "react";

interface ParticleHideEffectProps {
  children: ReactNode;
  isHidden: boolean;
}

export default function ParticleHideEffect({
  children,
  isHidden,
}: ParticleHideEffectProps) {
  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: "50px",
      }}
    >
      {/* Content */}
      <Box
        sx={{
          width: "100%",
          height: "100%",
          transition: "filter 200ms ease-in-out",
          filter: isHidden ? "blur(5px)" : "none",
          willChange: isHidden ? "filter" : "auto",
        }}
      >
        {children}
      </Box>

      {/* Tint overlay (no backdrop-filter to avoid black rectangles on some platforms) */}
      {isHidden && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            backgroundColor: (theme) =>
              theme.palette.mode === "dark"
                ? alpha(theme.palette.common.black, 0.25)
                : alpha(theme.palette.common.white, 0.25),
            pointerEvents: "none",
            zIndex: 10,
          }}
        />
      )}
    </Box>
  );
}
