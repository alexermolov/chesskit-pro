import { Icon } from "@iconify/react";
import { ToggleButton, ToggleButtonGroup, Tooltip } from "@mui/material";
import { useAtom } from "jotai";
import { useTranslation } from "next-i18next";
import { movesDisplayModeAtom } from "../../../states";

export default function MovesDisplayModeToggle() {
  const { t } = useTranslation("chess");
  const [displayMode, setDisplayMode] = useAtom(movesDisplayModeAtom);

  const handleModeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newMode: "tree" | "variations" | null
  ) => {
    if (newMode !== null) {
      setDisplayMode(newMode);
    }
  };

  return (
    <ToggleButtonGroup
      value={displayMode}
      exclusive
      onChange={handleModeChange}
      size="small"
      sx={{
        backgroundColor: (theme) => theme.palette.background.paper,
        borderRadius: 1,
      }}
    >
      <ToggleButton value="tree" aria-label="tree view">
        <Tooltip title={t("tree_view") || "Tree View"}>
          <Icon icon="mdi:file-tree" height={18} />
        </Tooltip>
      </ToggleButton>
      <ToggleButton value="variations" aria-label="variations table">
        <Tooltip title={t("variations_table") || "Variations Table"}>
          <Icon icon="mdi:table" height={18} />
        </Tooltip>
      </ToggleButton>
    </ToggleButtonGroup>
  );
}
