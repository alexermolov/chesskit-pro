import { Chip } from "@mui/material";

interface VariationElementProps {
  id: string;
  text: string;
  type: "variationStart" | "variationEnd";
  indentStyle: object;
  colors: any;
}

export const VariationElement = ({
  id,
  text,
  indentStyle,
  colors,
}: VariationElementProps) => {
  return (
    <Chip
      key={id}
      label={text}
      size="small"
      sx={{
        color: colors.variationBracketColor,
        margin: "0 2px",
        fontSize: "1rem",
        fontWeight: 500,
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
