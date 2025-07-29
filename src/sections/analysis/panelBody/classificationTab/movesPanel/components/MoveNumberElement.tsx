import { Chip } from "@mui/material";

interface MoveNumberElementProps {
  id: string;
  text: string;
  indentStyle: object;
  colors: any;
}

export const MoveNumberElement = ({
  id,
  text,
  indentStyle,
  colors,
}: MoveNumberElementProps) => {
  return (
    <Chip
      key={id}
      label={text}
      size="small"
      sx={{
        color: colors.moveNumberColor,
        margin: "0 2px",
        fontWeight: 600,
        fontSize: "0.85em",
        height: "auto",
        minHeight: "22px",
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
