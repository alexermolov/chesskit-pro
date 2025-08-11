import Slider from "@/components/slider";
import { EngineName } from "@/types/enums";
import {
  MenuItem,
  Select,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  FormControl,
  InputLabel,
  OutlinedInput,
  DialogActions,
  Typography,
  Grid2 as Grid,
  Box,
  useTheme,
} from "@mui/material";
import {
  engineNameAtom,
  engineDepthAtom,
  engineMultiPvAtom,
  engineWorkersNbAtom,
} from "../analysis/states";
import ArrowOptions from "./arrowOptions";
import { useAtomLocalStorage } from "@/hooks/useAtomLocalStorage";
import { useEffect } from "react";
import { isEngineSupported } from "@/lib/engine/shared";
import { Stockfish16_1 } from "@/lib/engine/stockfish16_1";
import { useAtom } from "jotai";
import { useTranslation } from "next-i18next";
import { boardHueAtom, pieceSetAtom } from "@/components/board/states";
import Image from "next/image";
import {
  DEFAULT_ENGINE,
  ENGINE_LABELS,
  PIECE_SETS,
  STRONGEST_ENGINE,
} from "@/constants";
import { getRecommendedWorkersNb } from "@/lib/engine/worker";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function EngineSettingsDialog({ open, onClose }: Props) {
  const { t } = useTranslation(["common", "chess"]);
  const [depth, setDepth] = useAtomLocalStorage(
    "engine-depth",
    engineDepthAtom
  );
  const [multiPv, setMultiPv] = useAtomLocalStorage(
    "engine-multi-pv",
    engineMultiPvAtom
  );
  const [engineName, setEngineName] = useAtomLocalStorage(
    "engine-name",
    engineNameAtom
  );
  const [boardHue, setBoardHue] = useAtom(boardHueAtom);
  const [pieceSet, setPieceSet] = useAtom(pieceSetAtom);
  const [engineWorkersNb, setEngineWorkersNb] = useAtom(engineWorkersNbAtom);

  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  useEffect(() => {
    if (!isEngineSupported(engineName)) {
      if (Stockfish16_1.isSupported()) {
        setEngineName(EngineName.Stockfish16_1Lite);
      } else {
        setEngineName(EngineName.Stockfish11);
      }
    }
  }, [setEngineName, engineName]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle variant="h5" sx={{ paddingBottom: 1 }}>
        {t("common:settings")}
      </DialogTitle>
      <DialogContent sx={{ paddingBottom: 0 }}>
        <Grid
          container
          justifyContent="center"
          alignItems="center"
          paddingTop={1}
          spacing={3}
          size={12}
        >
          <Grid
            container
            justifyContent="center"
            size={{ xs: 12, sm: 7, md: 8 }}
          >
            <Typography variant="body2">
              {ENGINE_LABELS[DEFAULT_ENGINE].small}{" "}
              {t("chess:engine_default_description")}{" "}
              {ENGINE_LABELS[STRONGEST_ENGINE].small}{" "}
              {t("chess:engine_strongest_description_full", {
                size: ENGINE_LABELS[STRONGEST_ENGINE].sizeMb,
              })}
            </Typography>
          </Grid>

          <Grid
            container
            justifyContent="center"
            size={{ xs: 12, sm: 5, md: 4 }}
          >
            <FormControl variant="outlined">
              <InputLabel id="dialog-select-label">
                {t("chess:engine")}
              </InputLabel>
              <Select
                labelId="dialog-select-label"
                id="dialog-select"
                displayEmpty
                input={<OutlinedInput label={t("chess:engine")} />}
                value={engineName}
                onChange={(e) => setEngineName(e.target.value as EngineName)}
                sx={{ width: 280, maxWidth: "100%" }}
              >
                {Object.values(EngineName).map((engine) => (
                  <MenuItem
                    key={engine}
                    value={engine}
                    disabled={!isEngineSupported(engine)}
                  >
                    {ENGINE_LABELS[engine].full}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Slider
            label={t("chess:maximum_depth")}
            value={depth}
            setValue={setDepth}
            min={10}
            max={30}
            marksFilter={2}
          />

          <Slider
            label={t("chess:number_of_lines")}
            value={multiPv}
            setValue={setMultiPv}
            min={2}
            max={6}
            marksFilter={1}
            size={6}
          />

          <ArrowOptions />

          <Grid
            container
            justifyContent="center"
            size={{ xs: 12, sm: 8, md: 9 }}
          >
            <Slider
              label={t("chess:board_hue")}
              value={boardHue}
              setValue={setBoardHue}
              min={0}
              max={360}
            />
          </Grid>

          <Grid
            container
            justifyContent="center"
            alignItems="center"
            size={{ xs: 12, sm: 4, md: 3 }}
          >
            <FormControl variant="outlined">
              <InputLabel id="dialog-select-label">
                {t("chess:piece_set")}
              </InputLabel>
              <Select
                labelId="dialog-select-label"
                id="dialog-select"
                displayEmpty
                input={<OutlinedInput label={t("chess:piece_set")} />}
                value={pieceSet}
                onChange={(e) =>
                  setPieceSet(e.target.value as (typeof PIECE_SETS)[number])
                }
                sx={{ width: 200, maxWidth: "100%" }}
              >
                {PIECE_SETS.map((name) => (
                  <MenuItem key={name} value={name}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Image
                        loading="lazy"
                        src={`./piece/${name}/${isDarkMode ? "w" : "b"}N.svg`}
                        alt={`${name} knight`}
                        width={24}
                        height={24}
                      />
                      {name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid
            container
            justifyContent="center"
            alignItems="center"
            size={{ xs: 12, md: 11 }}
          >
            <Slider
              label={t("chess:number_of_threads")}
              value={engineWorkersNb}
              setValue={setEngineWorkersNb}
              min={1}
              max={12}
              marksFilter={1}
              infoContent={
                <>
                  {t("chess:threads_info_1")} {getRecommendedWorkersNb()}.{" "}
                  {t("chess:threads_info_2")}
                </>
              }
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ m: 1 }}>
        <Button variant="contained" onClick={onClose}>
          {t("common:close")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
