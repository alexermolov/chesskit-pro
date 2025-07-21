import { Icon } from "@iconify/react";
import { IconButton, Tooltip } from "@mui/material";
import { useAtom } from "jotai";
import { showEngineLinesAtom } from "../states";

export default function ToggleEngineLinesButton() {
  const [showEngineLines, setShowEngineLines] = useAtom(showEngineLinesAtom);

  const handleToggle = () => {
    setShowEngineLines(!showEngineLines);
  };

  return (
    <Tooltip
      title={showEngineLines ? "Hide engine lines" : "Show engine lines"}
    >
      <IconButton
        onClick={handleToggle}
        size="small"
        sx={{
          backgroundColor: showEngineLines ? "primary.main" : "action.hover",
          color: showEngineLines ? "primary.contrastText" : "text.primary",
          "&:hover": {
            backgroundColor: showEngineLines
              ? "primary.dark"
              : "action.selected",
          },
        }}
      >
        <Icon icon={showEngineLines ? "mdi:eye" : "mdi:eye-off"} height={16} />
      </IconButton>
    </Tooltip>
  );
}
