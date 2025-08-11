import { Paper } from "@mui/material";
import React from "react";

interface MoveLineProps {
  children: React.ReactNode;
  lineIndex: number;
}

export const MoveLine = ({ children, lineIndex }: MoveLineProps) => {
  return (
    <Paper
      key={`line-${lineIndex}`}
      elevation={0}
      sx={{
        marginBottom: "4px",
        display: "flex",
        flexWrap: "wrap", // Allow wrapping elements within the line
        alignItems: "center",
        backgroundColor: "transparent",
        padding: "2px 4px",
        borderRadius: "6px",
      }}
    >
      {children}
    </Paper>
  );
};
