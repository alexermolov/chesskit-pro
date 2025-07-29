import { Chip } from "@mui/material";

interface ResultElementProps {
  id: string;
  text: string;
  indentStyle: object;
}

export const ResultElement = ({
  id,
  text,
  indentStyle,
}: ResultElementProps) => {
  return (
    <Chip
      key={id}
      label={text}
      size="small"
      sx={{
        color: "#666",
        margin: "0 2px",
        fontSize: "0.9rem",
        height: "auto",
        minHeight: "20px",
        padding: "0 3px",
        backgroundColor: "transparent",
        border: "none",
        whiteSpace: "nowrap",
        flexShrink: 0,
        ...indentStyle,
      }}
    />
  );
};
