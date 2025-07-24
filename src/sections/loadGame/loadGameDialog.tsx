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
  gamesListAtom,
} from "../analysis/states/gamesListState";

interface Props {
  open: boolean;
  onClose: () => void;
  setGame?: (game: Chess) => Promise<void>;
  setPgn?: (pgn: string) => Promise<void>;
}

export default function NewGameDialog({
  open,
  onClose,
  setGame,
  setPgn: setPgnCallback,
}: Props) {
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

  const handleAddGame = async (pgn: string, boardOrientation?: boolean) => {
    if (!pgn) return;

    try {
      // Проверяем, содержит ли PGN несколько игр
      const games = MultiGamePgnParser.parseMultiGamePgn(pgn);

      if (games.length > 1) {
        // Если найдено несколько игр, сохраняем их в список и загружаем первую
        const gameInfos = games
          .map((game, index) => createGameInfoFromPgn(game.pgn, index))
          .filter(Boolean);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setGamesList(gameInfos as any);

        // Показываем сообщение о том, что загружено несколько игр
        if (messageTimeout.current) {
          clearTimeout(messageTimeout.current);
        }

        setMultiGameMessage(
          `${games.length} games loaded. All games are available in the Games tab.`
        );

        messageTimeout.current = setTimeout(() => {
          setMultiGameMessage("");
        }, 5000);

        // Загружаем первую игру как активную
        if (setPgnCallback) {
          setSentryContext("loadedGame", { pgn: games[0].pgn });
          await setPgnCallback(games[0].pgn);
        } else if (setGame) {
          const gameToAdd = getGameFromPgn(games[0].pgn);
          setSentryContext("loadedGame", { pgn: games[0].pgn });
          await setGame(gameToAdd);
        }
      } else {
        // Если только одна игра, обрабатываем как обычно
        if (setPgnCallback) {
          setSentryContext("loadedGame", { pgn });
          await setPgnCallback(pgn);
        } else if (setGame) {
          const gameToAdd = getGameFromPgn(pgn);
          setSentryContext("loadedGame", { pgn });
          await setGame(gameToAdd);
        } else {
          await addGame(getGameFromPgn(pgn));
        }
      }

      setBoardOrientation(boardOrientation ?? true);
      handleClose();
    } catch (error) {
      console.error(error);

      if (parsingErrorTimeout.current) {
        clearTimeout(parsingErrorTimeout.current);
      }

      setParsingError(
        error instanceof Error
          ? `${error.message} !`
          : "Invalid PGN: unknown error !"
      );

      parsingErrorTimeout.current = setTimeout(() => {
        setParsingError("");
      }, 3000);
    }
  };

  const handleClose = () => {
    setPgn("");
    setParsingError("");
    setMultiGameMessage("");
    if (parsingErrorTimeout.current) {
      clearTimeout(parsingErrorTimeout.current);
    }
    if (messageTimeout.current) {
      clearTimeout(messageTimeout.current);
    }
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
          ? "Load a game"
          : "Add a game to your database"}
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
            <InputLabel id="dialog-select-label">Game origin</InputLabel>
            <Select
              labelId="dialog-select-label"
              id="dialog-select"
              displayEmpty
              input={<OutlinedInput label="Game origin" />}
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
          Cancel
        </Button>
        {gameOrigin === GameOrigin.Pgn && (
          <Button
            variant="contained"
            sx={{ marginLeft: 2 }}
            onClick={() => {
              handleAddGame(pgn);
            }}
          >
            Add
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
