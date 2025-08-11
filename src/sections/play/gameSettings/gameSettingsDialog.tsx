import Slider from "@/components/slider";
import { Color, EngineName } from "@/types/enums";
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
  FormGroup,
  FormControlLabel,
  Switch,
  TextField,
} from "@mui/material";
import { useAtomLocalStorage } from "@/hooks/useAtomLocalStorage";
import { useTranslation } from "next-i18next";
import { useAtom, useSetAtom } from "jotai";
import {
  engineEloAtom,
  playerColorAtom,
  isGameInProgressAtom,
  gameAtom,
  enginePlayNameAtom,
} from "../states";
import { useChessActions } from "@/hooks/useChessActions";
import { logAnalyticsEvent } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { isEngineSupported } from "@/lib/engine/shared";
import { Stockfish16_1 } from "@/lib/engine/stockfish16_1";
import { DEFAULT_ENGINE, ENGINE_LABELS, STRONGEST_ENGINE } from "@/constants";
import { getGameFromPgn } from "@/lib/chess";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function GameSettingsDialog({ open, onClose }: Props) {
  const { t } = useTranslation("chess");
  const [engineElo, setEngineElo] = useAtomLocalStorage(
    "engine-elo",
    engineEloAtom
  );
  const [engineName, setEngineName] = useAtomLocalStorage(
    "engine-play-name",
    enginePlayNameAtom
  );
  const [playerColor, setPlayerColor] = useAtom(playerColorAtom);
  const setIsGameInProgress = useSetAtom(isGameInProgressAtom);
  const { reset: resetGame } = useChessActions(gameAtom);
  const [startingPositionInput, setStartingPositionInput] = useState("");
  const [parsingError, setParsingError] = useState("");

  const handleGameStart = () => {
    setParsingError("");

    try {
      const input = startingPositionInput.trim();
      const startingFen = input.startsWith("[")
        ? getGameFromPgn(input).fen()
        : input || undefined;

      resetGame({
        white: {
          name:
            playerColor === Color.White
              ? t("you")
              : ENGINE_LABELS[engineName].small,
          rating: playerColor === Color.White ? undefined : engineElo,
        },
        black: {
          name:
            playerColor === Color.Black
              ? t("you")
              : ENGINE_LABELS[engineName].small,
          rating: playerColor === Color.Black ? undefined : engineElo,
        },
        fen: startingFen,
      });
    } catch (error) {
      console.error(error);
      setParsingError(
        error instanceof Error
          ? `${error.message} !`
          : t("unknown_error_parsing")
      );
      return;
    }

    setIsGameInProgress(true);
    handleClose();

    logAnalyticsEvent("play_game", {
      engine: engineName,
      engineElo,
      playerColor,
    });
  };

  useEffect(() => {
    if (!isEngineSupported(engineName)) {
      if (Stockfish16_1.isSupported()) {
        setEngineName(EngineName.Stockfish16_1Lite);
      } else {
        setEngineName(EngineName.Stockfish11);
      }
    }
  }, [setEngineName, engineName]);

  const handleClose = () => {
    onClose();
    setStartingPositionInput("");
    setParsingError("");
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle marginY={1} variant="h5">
        {t("set_game_parameters")}
      </DialogTitle>
      <DialogContent sx={{ paddingBottom: 0 }}>
        <Typography>
          {ENGINE_LABELS[DEFAULT_ENGINE].small}{" "}
          {t("engine_default_description")}{" "}
          {ENGINE_LABELS[STRONGEST_ENGINE].small}{" "}
          {t("engine_strongest_description")}
        </Typography>
        <Grid
          marginTop={4}
          container
          justifyContent="center"
          alignItems="center"
          rowGap={3}
          size={12}
        >
          <Grid container justifyContent="center" size={12}>
            <FormControl variant="outlined">
              <InputLabel id="dialog-select-label">
                {t("bot_engine")}
              </InputLabel>
              <Select
                labelId="dialog-select-label"
                id="dialog-select"
                displayEmpty
                input={<OutlinedInput label={t("bot_engine")} />}
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
            label={t("bot_elo_rating")}
            value={engineElo}
            setValue={setEngineElo}
            min={1320}
            max={3190}
            step={10}
            marksFilter={374}
          />

          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  color="default"
                  checked={playerColor === Color.White}
                  onChange={(e) => {
                    setPlayerColor(
                      e.target.checked ? Color.White : Color.Black
                    );
                  }}
                />
              }
              label={
                playerColor === Color.White
                  ? t("you_play_as_white")
                  : t("you_play_as_black")
              }
            />
          </FormGroup>

          <FormControl fullWidth>
            <TextField
              label={t("optional_starting_position")}
              variant="outlined"
              multiline
              value={startingPositionInput}
              onChange={(e) => setStartingPositionInput(e.target.value)}
            />
          </FormControl>

          {parsingError && (
            <FormControl fullWidth>
              <Typography color="salmon" textAlign="center" marginTop={1}>
                {parsingError}
              </Typography>
            </FormControl>
          )}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ m: 2 }}>
        <Button
          variant="outlined"
          sx={{ marginRight: 2 }}
          onClick={handleClose}
        >
          {t("cancel")}
        </Button>
        <Button variant="contained" onClick={handleGameStart}>
          {t("start_game")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
