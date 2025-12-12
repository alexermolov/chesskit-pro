import { useGameDatabase } from "@/hooks/useGameDatabase";
import { getGameFromPgn } from "@/lib/chess";
import { MultiGamePgnParser } from "@/lib/multiGamePgnParser";
import { GameOrigin } from "@/types/enums";
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
  Grid2 as Grid,
  Snackbar,
  Alert,
} from "@mui/material";
import { setContext as setSentryContext } from "@sentry/react";
import { Chess } from "chess.js";
import { useRef, useState } from "react";
import GamePgnInput from "./gamePgnInput";
import ChessComInput from "./chessComInput";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import LichessInput from "./lichessInput";
import { useSetAtom } from "jotai";
import { boardOrientationAtom } from "../analysis/states";
import {
  createGameInfoFromPgn,
  GameInfo,
  gamesListAtom,
} from "../analysis/states/gamesListState";
import { useTranslation } from "next-i18next";

interface Props {
  open: boolean;
  onClose: () => void;
  setGame?: (game: Chess) => Promise<void>;
  setPgn?: (pgn: string, gamesList?: GameInfo[]) => Promise<void>;
}

export default function NewGameDialog({
  open,
  onClose,
  setGame,
  setPgn: setPgnCallback,
}: Props) {
  const { t } = useTranslation("common");
  const [pgn, setPgn] = useState("");
  const [gameOrigin, setGameOrigin] = useLocalStorage(
    "preferred-game-origin",
    GameOrigin.ChessCom
  );
  const [parsingError, setParsingError] = useState("");
  const [multiGameMessage, setMultiGameMessage] = useState("");
  const parsingErrorTimeout = useRef<NodeJS.Timeout | null>(null);
  const messageTimeout = useRef<NodeJS.Timeout | null>(null);
  const setBoardOrientation = useSetAtom(boardOrientationAtom);
  const setGamesList = useSetAtom(gamesListAtom);
  const { addGame } = useGameDatabase();

  const showTimedMessage = (
    message: string,
    setter: (msg: string) => void,
    timeoutRef: React.MutableRefObject<NodeJS.Timeout | null>,
    duration: number
  ) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setter(message);
    timeoutRef.current = setTimeout(() => setter(""), duration);
  };

  const loadSingleGame = async (gamePgn: string, gamesList?: GameInfo[]) => {
    setSentryContext("loadedGame", { pgn: gamePgn });

    if (setPgnCallback) {
      await setPgnCallback(gamePgn, gamesList);
    } else if (setGame) {
      await setGame(getGameFromPgn(gamePgn));
    } else {
      await addGame(getGameFromPgn(gamePgn));
    }
  };

  const handleAddGame = async (pgn: string, boardOrientation?: boolean) => {
    if (!pgn) return;

    try {
      const games = MultiGamePgnParser.parseMultiGamePgn(pgn);
      const isMultiGame = games.length > 1;

      // Always create and set the games list for "Load a game" mode
      if (setPgnCallback || setGame) {
        const gameInfos = games
          .map((game, index) => createGameInfoFromPgn(game.pgn, index))
          .filter((game): game is GameInfo => game !== null);

        setGamesList(gameInfos);

        if (isMultiGame) {
          showTimedMessage(
            t("multi_games_loaded", { count: games.length }),
            setMultiGameMessage,
            messageTimeout,
            5000
          );
        }

        // Load the first game as active, passing the games list for Electron
        await loadSingleGame(games[0].pgn, gameInfos);
      } else {
        // Database mode: add all games to the database
        if (isMultiGame) {
          showTimedMessage(
            t("multi_games_loaded", { count: games.length }),
            setMultiGameMessage,
            messageTimeout,
            5000
          );
        }

        for (const game of games) {
          await addGame(getGameFromPgn(game.pgn));
        }
      }

      setBoardOrientation(boardOrientation ?? true);
      handleClose();
    } catch (error) {
      console.error(error);

      const errorMessage =
        error instanceof Error
          ? `${error.message} !`
          : t("invalid_pgn_unknown_error");

      showTimedMessage(
        errorMessage,
        setParsingError,
        parsingErrorTimeout,
        3000
      );
    }
  };

  const clearTimeouts = () => {
    [parsingErrorTimeout, messageTimeout].forEach((ref) => {
      if (ref.current) {
        clearTimeout(ref.current);
      }
    });
  };

  const handleClose = () => {
    setPgn("");
    setParsingError("");
    setMultiGameMessage("");
    clearTimeouts();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      slotProps={{
        paper: {
          sx: {
            position: "fixed",
            top: 0,
            width: "calc(100% - 10px)",
            marginY: { xs: "3vh", sm: 5 },
            maxHeight: { xs: "calc(100% - 5vh)", sm: "calc(100% - 64px)" },
          },
        },
      }}
    >
      <DialogTitle marginY={1} variant="h5">
        {setGame || setPgnCallback
          ? t("load_a_game")
          : t("add_game_to_database")}
      </DialogTitle>
      <DialogContent sx={{ padding: { xs: 2, md: 3 } }}>
        <Grid
          container
          marginTop={1}
          alignItems="center"
          justifyContent="start"
          rowGap={2}
        >
          <FormControl sx={{ my: 1, mr: 2, width: 150 }}>
            <InputLabel id="dialog-select-label">{t("game_origin")}</InputLabel>
            <Select
              labelId="dialog-select-label"
              id="dialog-select"
              displayEmpty
              input={<OutlinedInput label={t("game_origin")} />}
              value={gameOrigin ?? ""}
              onChange={(e) => {
                setGameOrigin(e.target.value as GameOrigin);
                setParsingError("");
              }}
            >
              {Object.entries(gameOriginLabel).map(([origin, label]) => (
                <MenuItem key={origin} value={origin}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {gameOrigin === GameOrigin.Pgn && (
            <GamePgnInput pgn={pgn} setPgn={setPgn} />
          )}

          {gameOrigin === GameOrigin.ChessCom && (
            <ChessComInput onSelect={handleAddGame} />
          )}

          {gameOrigin === GameOrigin.Lichess && (
            <LichessInput onSelect={handleAddGame} />
          )}

          <Snackbar open={!!parsingError}>
            <Alert
              onClose={() => setParsingError("")}
              severity="error"
              variant="filled"
              sx={{ width: "100%" }}
            >
              {parsingError}
            </Alert>
          </Snackbar>

          <Snackbar open={!!multiGameMessage}>
            <Alert
              onClose={() => setMultiGameMessage("")}
              severity="success"
              variant="filled"
              sx={{ width: "100%" }}
            >
              {multiGameMessage}
            </Alert>
          </Snackbar>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ m: 2 }}>
        <Button variant="outlined" onClick={handleClose}>
          {t("cancel")}
        </Button>
        {gameOrigin === GameOrigin.Pgn && (
          <Button
            variant="contained"
            sx={{ marginLeft: 2 }}
            onClick={() => {
              handleAddGame(pgn);
            }}
          >
            {t("add")}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

const gameOriginLabel: Record<GameOrigin, string> = {
  [GameOrigin.ChessCom]: "Chess.com",
  [GameOrigin.Lichess]: "Lichess.org",
  [GameOrigin.Pgn]: "PGN",
};
