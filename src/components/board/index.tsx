import { CLASSIFICATION_COLORS } from "@/constants";
import { useChessActionsWithBranches } from "@/hooks/useChessActionsWithBranches";
import { PgnParser } from "@/lib/pgnParser";
import { Color, MoveClassification } from "@/types/enums";
import { CurrentPosition } from "@/types/eval";
import { Player } from "@/types/game";
import { Box, Grid2 as Grid } from "@mui/material";
import { Chess } from "chess.js";
import { PrimitiveAtom, atom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chessboard } from "react-chessboard";
import {
  Arrow,
  CustomPieces,
  CustomSquareRenderer,
  Piece,
  PromotionPieceOption,
  Square,
} from "react-chessboard/dist/chessboard/types";
import tinycolor from "tinycolor2";
import EvaluationBar from "./evaluationBar";
import PlayerHeader from "./playerHeader";
import { getSquareRenderer } from "./squareRenderer";
import { boardHueAtom, pieceSetAtom } from "./states";

export interface Props {
  id: string;
  canPlay?: Color | boolean;
  gameAtom: PrimitiveAtom<Chess>;
  boardSize?: number;
  whitePlayer: Player;
  blackPlayer: Player;
  boardOrientation?: Color;
  currentPositionAtom?: PrimitiveAtom<CurrentPosition>;
  showBestMoveArrow?: boolean;
  showPlayerMoveIconAtom?: PrimitiveAtom<boolean>;
  showEvaluationBar?: boolean;
}

export default function Board({
  id: boardId,
  canPlay,
  gameAtom,
  boardSize,
  whitePlayer,
  blackPlayer,
  boardOrientation = Color.White,
  currentPositionAtom = atom({}),
  showBestMoveArrow = false,
  showPlayerMoveIconAtom,
  showEvaluationBar = false,
}: Props) {
  const boardRef = useRef<HTMLDivElement>(null);
  const game = useAtomValue(gameAtom);
  const { playMove, moveTree } = useChessActionsWithBranches(gameAtom);
  const clickedSquaresAtom = useMemo(() => atom<Square[]>([]), []);
  const setClickedSquares = useSetAtom(clickedSquaresAtom);
  const playableSquaresAtom = useMemo(() => atom<Square[]>([]), []);
  const setPlayableSquares = useSetAtom(playableSquaresAtom);
  const position = useAtomValue(currentPositionAtom);
  const [showPromotionDialog, setShowPromotionDialog] = useState(false);
  const [moveClickFrom, setMoveClickFrom] = useState<Square | null>(null);
  const [moveClickTo, setMoveClickTo] = useState<Square | null>(null);
  const pieceSet = useAtomValue(pieceSetAtom);
  const boardHue = useAtomValue(boardHueAtom);

  const gameFen = game.fen();

  useEffect(() => {
    setClickedSquares([]);
  }, [gameFen, setClickedSquares]);

  const isPiecePlayable = useCallback(
    ({ piece }: { piece: string }): boolean => {
      if (game.isGameOver() || !canPlay) return false;
      if (canPlay === true || canPlay === piece[0]) return true;
      return false;
    },
    [canPlay, game]
  );

  const onPieceDrop = useCallback(
    (source: Square, target: Square, piece: string): boolean => {
      if (!isPiecePlayable({ piece })) return false;

      const result = playMove({
        from: source,
        to: target,
        promotion: piece[1]?.toLowerCase() ?? "q",
      });

      return !!result;
    },
    [isPiecePlayable, playMove]
  );

  const resetMoveClick = useCallback(
    (square?: Square | null) => {
      setMoveClickFrom(square ?? null);
      setMoveClickTo(null);
      setShowPromotionDialog(false);
      if (square) {
        const moves = game.moves({ square, verbose: true });
        setPlayableSquares(moves.map((m) => m.to));
      } else {
        setPlayableSquares([]);
      }
    },
    [setMoveClickFrom, setMoveClickTo, setPlayableSquares, game]
  );

  const handleSquareLeftClick = useCallback(
    (square: Square, piece?: string) => {
      setClickedSquares([]);

      if (!moveClickFrom) {
        if (piece && !isPiecePlayable({ piece })) return;
        resetMoveClick(square);
        return;
      }

      const validMoves = game.moves({ square: moveClickFrom, verbose: true });
      const move = validMoves.find((m) => m.to === square);

      if (!move) {
        resetMoveClick(square);
        return;
      }

      setMoveClickTo(square);

      if (
        move.piece === "p" &&
        ((move.color === "w" && square[1] === "8") ||
          (move.color === "b" && square[1] === "1"))
      ) {
        setShowPromotionDialog(true);
        return;
      }

      const result = playMove({
        from: moveClickFrom,
        to: square,
      });

      resetMoveClick(result ? undefined : square);
    },
    [
      game,
      isPiecePlayable,
      moveClickFrom,
      playMove,
      resetMoveClick,
      setClickedSquares,
    ]
  );

  const handleSquareRightClick = useCallback(
    (square: Square) => {
      setClickedSquares((prev) =>
        prev.includes(square)
          ? prev.filter((s) => s !== square)
          : [...prev, square]
      );
    },
    [setClickedSquares]
  );

  const handlePieceDragBegin = useCallback(
    (_: string, square: Square) => {
      resetMoveClick(square);
    },
    [resetMoveClick]
  );

  const handlePieceDragEnd = useCallback(() => {
    resetMoveClick();
  }, [resetMoveClick]);

  const onPromotionPieceSelect = useCallback(
    (piece?: PromotionPieceOption, from?: Square, to?: Square) => {
      if (!piece) return false;
      const promotionPiece = piece[1]?.toLowerCase() ?? "q";

      if (moveClickFrom && moveClickTo) {
        const result = playMove({
          from: moveClickFrom,
          to: moveClickTo,
          promotion: promotionPiece,
        });
        resetMoveClick();
        return !!result;
      }

      if (from && to) {
        const result = playMove({
          from,
          to,
          promotion: promotionPiece,
        });
        resetMoveClick();
        return !!result;
      }

      resetMoveClick(moveClickFrom);
      return false;
    },
    [moveClickFrom, moveClickTo, playMove, resetMoveClick]
  );

  const customArrows: Arrow[] = useMemo(() => {
    const bestMove = position?.lastEval?.bestMove;
    const moveClassification = position?.eval?.moveClassification;
    const lines = position?.lastEval?.lines || [];
    const arrows: Arrow[] = [];
    let hasCommentArrows = false;

    // Add arrows from current move comment
    if (moveTree && moveTree.currentNodeId) {
      const currentNode = moveTree.nodes[moveTree.currentNodeId];
      if (currentNode?.comment) {
        const commentArrows = PgnParser.extractArrowsFromComment(
          currentNode.comment
        );

        if (commentArrows.length > 0) {
          hasCommentArrows = true;
        }

        commentArrows.forEach((arrow) => {
          // Convert color names to hex colors
          let arrowColor = "#ff6b35"; // Default orange color

          switch (arrow.color?.toLowerCase()) {
            case "red":
            case "r":
              arrowColor = "#e74c3c";
              break;
            case "green":
            case "g":
              arrowColor = "#2ecc71";
              break;
            case "blue":
            case "b":
              arrowColor = "#3498db";
              break;
            case "yellow":
            case "y":
              arrowColor = "#f1c40f";
              break;
            case "orange":
            case "o":
              arrowColor = "#ff6b35";
              break;
            default:
              arrowColor = "#ff6b35";
              break;
          }

          const commentArrow = [
            arrow.from,
            arrow.to,
            tinycolor(arrowColor).spin(-boardHue).toHexString(),
          ] as Arrow;

          arrows.push(commentArrow);
        });
      }
    }

    // Add arrows for analysis lines
    // If there are comment arrows, show only the best move (first line)
    // Otherwise, show all analysis lines
    const linesToShow = hasCommentArrows ? lines.slice(0, 1) : lines;

    linesToShow.forEach((line, index) => {
      if (line.pv && line.pv.length > 0) {
        const firstMove = line.pv[0];
        if (firstMove && firstMove.length >= 4) {
          // When showing only best move due to comment arrows, always use full color
          // Otherwise use the original logic with lighter colors for subsequent lines
          const baseColor = tinycolor(
            CLASSIFICATION_COLORS[MoveClassification.Best]
          ).spin(-boardHue);

          let lineColor: string;
          if (hasCommentArrows || index === 0) {
            // First line or when limiting to best move only - full color
            lineColor = baseColor.toHexString();
          } else {
            // Subsequent lines - lighter versions by mixing with white
            const lightenAmount = Math.min(70, 20 + (index - 1) * 15);
            lineColor = baseColor.lighten(lightenAmount).toHexString();
          }

          const lineArrow = [
            firstMove.slice(0, 2),
            firstMove.slice(2, 4),
            lineColor,
          ] as Arrow;

          arrows.push(lineArrow);
        }
      }
    });

    // Add best move arrow if it should be shown and doesn't match any analysis line
    if (
      bestMove &&
      showBestMoveArrow &&
      moveClassification !== MoveClassification.Best &&
      moveClassification !== MoveClassification.Opening &&
      moveClassification !== MoveClassification.Forced &&
      moveClassification !== MoveClassification.Perfect
    ) {
      // Check if best move already exists in analysis lines
      const bestMoveExistsInLines = lines.some(
        (line) => line.pv && line.pv.length > 0 && line.pv[0] === bestMove
      );

      if (!bestMoveExistsInLines) {
        const bestMoveArrow = [
          bestMove.slice(0, 2),
          bestMove.slice(2, 4),
          tinycolor(CLASSIFICATION_COLORS[MoveClassification.Best])
            .spin(-boardHue)
            .toHexString(),
        ] as Arrow;

        arrows.push(bestMoveArrow);
      }
    }

    return arrows;
  }, [position, showBestMoveArrow, boardHue, moveTree]);

  const SquareRenderer: CustomSquareRenderer = useMemo(() => {
    return getSquareRenderer({
      currentPositionAtom: currentPositionAtom,
      clickedSquaresAtom,
      playableSquaresAtom,
      showPlayerMoveIconAtom,
    });
  }, [
    currentPositionAtom,
    clickedSquaresAtom,
    playableSquaresAtom,
    showPlayerMoveIconAtom,
  ]);

  const customPieces = useMemo(
    () =>
      PIECE_CODES.reduce<CustomPieces>((acc, piece) => {
        acc[piece] = ({ squareWidth }) => (
          <Box
            width={squareWidth}
            height={squareWidth}
            sx={{
              backgroundImage: `url(./piece/${pieceSet}/${piece}.svg)`,
              backgroundSize: "contain",
            }}
          />
        );

        return acc;
      }, {}),
    [pieceSet]
  );

  const customBoardStyle = useMemo(() => {
    const commonBoardStyle = {
      borderRadius: "5px",
      boxShadow: "0 2px 10px rgba(0, 0, 0, 0.5)",
    };

    if (boardHue) {
      return {
        ...commonBoardStyle,
        filter: `hue-rotate(${boardHue}deg)`,
      };
    }

    return commonBoardStyle;
  }, [boardHue]);

  return (
    <Grid
      container
      justifyContent="center"
      alignItems="center"
      wrap="nowrap"
      width={boardSize}
    >
      {showEvaluationBar && (
        <EvaluationBar
          height={boardRef?.current?.offsetHeight || boardSize || 400}
          boardOrientation={boardOrientation}
          currentPositionAtom={currentPositionAtom}
        />
      )}

      <Grid
        container
        rowGap={1.5}
        justifyContent="center"
        alignItems="center"
        paddingLeft={showEvaluationBar ? 2 : 0}
        size="grow"
      >
        <PlayerHeader
          color={boardOrientation === Color.White ? Color.Black : Color.White}
          gameAtom={gameAtom}
          player={boardOrientation === Color.White ? blackPlayer : whitePlayer}
        />

        <Grid
          container
          justifyContent="center"
          alignItems="center"
          ref={boardRef}
          size={12}
        >
          <Chessboard
            id={`${boardId}-${canPlay}`}
            position={gameFen}
            onPieceDrop={onPieceDrop}
            boardOrientation={
              boardOrientation === Color.White ? "white" : "black"
            }
            customBoardStyle={customBoardStyle}
            customArrows={customArrows}
            isDraggablePiece={isPiecePlayable}
            customSquare={SquareRenderer}
            onSquareClick={handleSquareLeftClick}
            onSquareRightClick={handleSquareRightClick}
            onPieceDragBegin={handlePieceDragBegin}
            onPieceDragEnd={handlePieceDragEnd}
            onPromotionPieceSelect={onPromotionPieceSelect}
            showPromotionDialog={showPromotionDialog}
            promotionToSquare={moveClickTo}
            animationDuration={200}
            customPieces={customPieces}
          />
        </Grid>

        <PlayerHeader
          color={boardOrientation}
          gameAtom={gameAtom}
          player={boardOrientation === Color.White ? whitePlayer : blackPlayer}
        />
      </Grid>
    </Grid>
  );
}

export const PIECE_CODES = [
  "wP",
  "wB",
  "wN",
  "wR",
  "wQ",
  "wK",
  "bP",
  "bB",
  "bN",
  "bR",
  "bQ",
  "bK",
] as const satisfies Piece[];
