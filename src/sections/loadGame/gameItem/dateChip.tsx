import { Icon } from "@iconify/react";
import { Chip, Tooltip } from "@mui/material";
import { useTranslation } from "next-i18next";

interface Props {
  date?: string;
}

export default function DateChip({ date }: Props) {
  const { t } = useTranslation("common");

  if (!date) return null;

  return (
    <Tooltip title={t("date_played")}>
      <Chip
        icon={<Icon icon="material-symbols:calendar-today" />}
        label={date}
        size="small"
      />
    </Tooltip>
  );
}
