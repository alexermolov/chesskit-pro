import { useChessActionsWithBranches } from "@/hooks/useChessActionsWithBranches";
import { useGameDatabase } from "@/hooks/useGameDatabase";
import { decodeBase64 } from "@/lib/helpers";
import { Game } from "@/types/game";
import { Chess } from "chess.js";
import { useAtomValue, useSetAtom } from "jotai";
import { useRouter } from "next/router";
import { useCallback, useEffect } from "react";
import LoadGameButtonWithPgn from "../../loadGame/loadGameButtonWithPgn";
import {
  boardOrientationAtom,
  evaluationProgressAtom,
  gameAtom,
  gameEvalAtom,
} from "../states";

export default function LoadGame() {
  const router = useRouter();
  const game = useAtomValue(gameAtom);
  const { setPgn: setGamePgn, reset: resetBoard } =
    useChessActionsWithBranches(gameAtom);
  const { gameFromUrl } = useGameDatabase();
  const setEval = useSetAtom(gameEvalAtom);
  const setBoardOrientation = useSetAtom(boardOrientationAtom);
  const evaluationProgress = useAtomValue(evaluationProgressAtom);

  const resetAndSetGamePgn = useCallback(
    (pgn: string) => {
      resetBoard();
      setEval(undefined);
      setGamePgn(pgn);
    },
    [resetBoard, setGamePgn, setEval]
  );

  const { pgn: pgnParam, orientation: orientationParam } = router.query;

  // Получаем стабильную ссылку на историю игры для сравнения
  const gameHistoryString = game.history().join();

  useEffect(() => {
    const loadGameFromIdParam = (gameUrl: Game) => {
      const gamefromDbChess = new Chess();
      gamefromDbChess.loadPgn(gameUrl.pgn);
      if (gameHistoryString === gamefromDbChess.history().join()) return;

      resetAndSetGamePgn(gameUrl.pgn);
      setEval(gameUrl.eval);
      setBoardOrientation(
        gameUrl.black.name === "You" && gameUrl.site === "Chesskit-Pro"
          ? false
          : true
      );
    };

    const loadGameFromPgnParam = (encodedPgn: string) => {
      const decodedPgn = decodeBase64(encodedPgn);
      if (!decodedPgn) return;

      const gameFromPgnParam = new Chess();
      gameFromPgnParam.loadPgn(decodedPgn || "");
      if (gameHistoryString === gameFromPgnParam.history().join()) return;

      resetAndSetGamePgn(decodedPgn);
      setBoardOrientation(orientationParam !== "black");
    };

    if (gameFromUrl) {
      loadGameFromIdParam(gameFromUrl);
    } else if (typeof pgnParam === "string") {
      loadGameFromPgnParam(pgnParam);
    }
  }, [
    gameFromUrl,
    pgnParam,
    orientationParam,
    gameHistoryString,
    resetAndSetGamePgn,
    setEval,
    setBoardOrientation,
  ]);

  const isGameLoaded =
    gameFromUrl !== undefined ||
    (!!game.getHeaders().White && game.getHeaders().White !== "?") ||
    game.history().length > 0;

  if (evaluationProgress) return null;

  return (
    <LoadGameButtonWithPgn
      label={isGameLoaded ? "Load another game" : "Load game"}
      size="small"
      setPgn={async (pgn) => {
        await router.push("/");
        // Используем PGN напрямую, чтобы сохранить вариации
        resetAndSetGamePgn(pgn);
      }}
    />
  );
}
