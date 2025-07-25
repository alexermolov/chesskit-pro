import { Icon } from "@iconify/react";
import { Button, Typography } from "@mui/material";
import { useAtom } from "jotai";
import { showEngineLinesAtom } from "../states";

export default function ToggleEngineLinesButton() {
  const [showEngineLines, setShowEngineLines] = useAtom(showEngineLinesAtom);

  const handleToggle = () => {
    setShowEngineLines(!showEngineLines);
  };

  return (
    <Button
      variant="contained"
      onClick={handleToggle}
      size="small"
      color={showEngineLines ? "primary" : "inherit"}
      startIcon={
        <Icon icon={showEngineLines ? "mdi:eye" : "mdi:eye-off"} height={18} />
      }
      sx={{
        backgroundColor: showEngineLines ? "primary.main" : "action.hover",
        color: showEngineLines ? "primary.contrastText" : "text.primary",
        "&:hover": {
          backgroundColor: showEngineLines ? "primary.dark" : "action.selected",
        },
      }}
    >
      <Typography fontSize="0.9em" fontWeight="500" lineHeight="1.4em">
        {showEngineLines ? "Hide lines" : "Show lines"}
      </Typography>
    </Button>
  );
}
