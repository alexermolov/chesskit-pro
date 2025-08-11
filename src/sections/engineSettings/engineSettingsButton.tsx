import { Fab } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "next-i18next";
import EngineSettingsDialog from "./engineSettingsDialog";
import { Icon } from "@iconify/react";

export default function EngineSettingsButton() {
  const { t } = useTranslation("common");
  const [openDialog, setOpenDialog] = useState(false);

  return (
    <>
      <Fab
        title={t("engine_settings")}
        color="secondary"
        size="small"
        sx={{
          top: "auto",
          right: 16,
          bottom: 16,
          left: "auto",
          position: "fixed",
        }}
        onClick={() => setOpenDialog(true)}
      >
        <Icon icon="mdi:settings" height={20} />
      </Fab>

      <EngineSettingsDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
      />
    </>
  );
}
