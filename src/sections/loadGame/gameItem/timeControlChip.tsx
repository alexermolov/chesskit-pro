import { Icon } from "@iconify/react";
import { Chip, Tooltip } from "@mui/material";
import { useTranslation } from "next-i18next";

interface Props {
  timeControl?: string;
}

export default function TimeControlChip({ timeControl }: Props) {
  const { t } = useTranslation("chess");

  if (!timeControl) return null;

  return (
    <Tooltip title={t("time_control")}>
      <Chip
        icon={<Icon icon="material-symbols:timer-outline" />}
        label={timeControl}
        size="small"
      />
    </Tooltip>
  );
}
