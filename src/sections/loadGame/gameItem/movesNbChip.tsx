import { Icon } from "@iconify/react";
import { Chip, Tooltip } from "@mui/material";
import { useTranslation } from "next-i18next";

interface Props {
  movesNb?: number;
}

export default function MovesNbChip({ movesNb }: Props) {
  const { t } = useTranslation("common");

  if (!movesNb) return null;

  return (
    <Tooltip title={t("number_of_moves")} sx={{ overflow: "hidden" }}>
      <Chip
        icon={<Icon icon="heroicons:hashtag-20-solid" />}
        label={t("moves_count", { count: Math.ceil(movesNb / 2) })}
        size="small"
      />
    </Tooltip>
  );
}
