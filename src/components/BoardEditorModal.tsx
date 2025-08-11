import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid2 as Grid,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { Chess } from "chess.js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Chessboard } from "react-chessboard";
import { Square } from "react-chessboard/dist/chessboard/types";
import { useTranslation } from "next-i18next";

interface BoardEditorModalProps {
  open: boolean;
  onClose: () => void;
  onLoadPosition: (fen: string) => void;
  initialFen?: string;
}

type PieceType = "p" | "n" | "b" | "r" | "q" | "k";
type PieceColor = "w" | "b";

export default function BoardEditorModal({
  open,
  onClose,
  onLoadPosition,
  initialFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
}: BoardEditorModalProps) {
  const { t } = useTranslation("chess");
  const { t: tCommon } = useTranslation("common");
  const [editableGame, setEditableGame] = useState(() => new Chess(initialFen));
  const [fenInput, setFenInput] = useState(initialFen);
  const [error, setError] = useState<string | null>(null);
  const [selectedPiece, setSelectedPiece] = useState<PieceType>("p");
  const [selectedColor, setSelectedColor] = useState<PieceColor>("w");
  const [activeColor, setActiveColor] = useState<"w" | "b">("w");
  const [castling, setCastling] = useState("KQkq");

  // Helper function to validate board state
  const validateBoardState = useCallback(
    (game: Chess) => {
      const squares = game.board().flat();
      const whiteKing = squares.filter(
        (square) => square && square.type === "k" && square.color === "w"
      ).length;
      const blackKing = squares.filter(
        (square) => square && square.type === "k" && square.color === "b"
      ).length;

      if (whiteKing === 0) return t("white_king_missing");
      if (blackKing === 0) return t("black_king_missing");
      if (whiteKing > 1) return t("too_many_white_kings");
      if (blackKing > 1) return t("too_many_black_kings");

      return null;
    },
    [t]
  );

  // Update state when modal opens with new FEN
  useEffect(() => {
    if (open) {
      try {
        const game = new Chess(initialFen);
        setEditableGame(game);
        setFenInput(initialFen);
        const fenParts = initialFen.split(" ");
        setActiveColor(fenParts[1] === "b" ? "b" : "w");
        setCastling(fenParts[2] || "KQkq");
        setError(null);
      } catch {
        setError(t("invalid_initial_fen"));
      }
    }
  }, [open, initialFen, t]);

  const handleFenChange = useCallback(
    (value: string) => {
      setFenInput(value);
      try {
        const testGame = new Chess(value);
        setEditableGame(testGame);
        setError(null);
      } catch {
        setError(t("invalid_fen_string"));
      }
    },
    [t]
  );

  const updateGameFromBoard = useCallback(
    (gameToUpdate: Chess) => {
      try {
        const boardFen = gameToUpdate.fen().split(" ")[0];
        const newFen = `${boardFen} ${activeColor} ${castling} - 0 1`;

        // Validate the FEN before setting it
        try {
          const testGame = new Chess(newFen);
          const validationError = validateBoardState(testGame);

          setFenInput(newFen);

          if (validationError) {
            setError(validationError);
          } else {
            setError(null);
          }
        } catch (validationError) {
          // If FEN is invalid, still update the input but show error
          setFenInput(newFen);
          setError(
            t("invalid_position") + ": " + (validationError as Error).message
          );
        }
      } catch {
        setError(t("error_updating_position"));
      }
    },
    [activeColor, castling, validateBoardState, t]
  );

  const handlePieceDrop = useCallback(
    (sourceSquare: Square, targetSquare: Square) => {
      try {
        const piece = editableGame.get(sourceSquare);
        if (piece) {
          const newGame = new Chess();
          newGame.clear();

          // Copy all existing pieces except the source square
          for (let fileIndex = 0; fileIndex < 8; fileIndex++) {
            const file = String.fromCharCode(97 + fileIndex); // 'a' + fileIndex
            for (let rank = 1; rank <= 8; rank++) {
              const currentSquare = `${file}${rank}` as Square;
              if (
                currentSquare !== sourceSquare &&
                currentSquare !== targetSquare
              ) {
                const currentPiece = editableGame.get(currentSquare);
                if (currentPiece) {
                  newGame.put(currentPiece, currentSquare);
                }
              }
            }
          }

          // Place the piece on the target square
          newGame.put(piece, targetSquare);
          setEditableGame(newGame);
          updateGameFromBoard(newGame);
          return true;
        }
      } catch {
        setError(t("invalid_move"));
      }
      return false;
    },
    [editableGame, updateGameFromBoard, t]
  );

  const handleSquareClick = useCallback(
    (square: Square) => {
      try {
        const newGame = new Chess();
        newGame.clear();

        // Copy all existing pieces except the target square
        for (let fileIndex = 0; fileIndex < 8; fileIndex++) {
          const file = String.fromCharCode(97 + fileIndex); // 'a' + fileIndex
          for (let rank = 1; rank <= 8; rank++) {
            const currentSquare = `${file}${rank}` as Square;
            if (currentSquare !== square) {
              const piece = editableGame.get(currentSquare);
              if (piece) {
                newGame.put(piece, currentSquare);
              }
            }
          }
        }

        // Place the selected piece on the target square
        newGame.put({ type: selectedPiece, color: selectedColor }, square);
        setEditableGame(newGame);
        updateGameFromBoard(newGame);
      } catch {
        setError(t("error_placing_piece"));
      }
    },
    [editableGame, selectedPiece, selectedColor, updateGameFromBoard, t]
  );

  const handleSquareRightClick = useCallback(
    (square: Square) => {
      try {
        const newGame = new Chess();
        newGame.clear();

        // Copy all existing pieces except the target square
        for (let fileIndex = 0; fileIndex < 8; fileIndex++) {
          const file = String.fromCharCode(97 + fileIndex); // 'a' + fileIndex
          for (let rank = 1; rank <= 8; rank++) {
            const currentSquare = `${file}${rank}` as Square;
            if (currentSquare !== square) {
              const piece = editableGame.get(currentSquare);
              if (piece) {
                newGame.put(piece, currentSquare);
              }
            }
          }
        }

        setEditableGame(newGame);
        updateGameFromBoard(newGame);
      } catch {
        setError(t("error_removing_piece"));
      }
    },
    [editableGame, updateGameFromBoard, t]
  );

  const handleClearBoard = useCallback(() => {
    try {
      const newGame = new Chess();
      newGame.clear();
      setEditableGame(newGame);
      updateGameFromBoard(newGame);
    } catch {
      setError(t("error_clearing_board"));
    }
  }, [updateGameFromBoard, t]);

  const handleStartingPosition = useCallback(() => {
    const startingFen =
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    setEditableGame(new Chess(startingFen));
    setFenInput(startingFen);
    setActiveColor("w");
    setCastling("KQkq");
    setError(null);
  }, []);

  const handleLoadPosition = useCallback(() => {
    if (!error && fenInput) {
      try {
        // Try to validate the FEN first
        const testGame = new Chess(fenInput);

        // Check for validation errors
        const validationError = validateBoardState(testGame);
        if (validationError) {
          setError(validationError);
          return;
        }

        onLoadPosition(fenInput);
        onClose();
      } catch (validationError) {
        setError(
          t("invalid_position") + ": " + (validationError as Error).message
        );
      }
    }
  }, [error, fenInput, onLoadPosition, onClose, validateBoardState, t]);

  const boardStyle = useMemo(
    () => ({
      borderRadius: "5px",
      boxShadow: "0 2px 10px rgba(0, 0, 0, 0.3)",
    }),
    []
  );

  const pieceOptions = [
    { value: "p", label: t("pawn") },
    { value: "n", label: t("knight") },
    { value: "b", label: t("bishop") },
    { value: "r", label: t("rook") },
    { value: "q", label: t("queen") },
    { value: "k", label: t("king") },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      slotProps={{
        paper: {
          sx: { minHeight: "700px" },
        },
      }}
    >
      <DialogTitle>{t("board_editor")}</DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          <Grid size={12}>
            <Alert severity="info" sx={{ mb: 2 }}>
              {t("board_editor_instructions")}
            </Alert>
          </Grid>

          <Grid container size={12} spacing={2}>
            <Grid size={8}>
              <Box display="flex" justifyContent="center" mb={2}>
                <Box width={400} height={400}>
                  <Chessboard
                    position={editableGame.fen()}
                    onPieceDrop={handlePieceDrop}
                    onSquareClick={handleSquareClick}
                    onSquareRightClick={handleSquareRightClick}
                    customBoardStyle={boardStyle}
                    boardOrientation="white"
                    isDraggablePiece={() => true}
                  />
                </Box>
              </Box>
            </Grid>

            <Grid size={4}>
              <Box display="flex" flexDirection="column" gap={2}>
                <Typography variant="subtitle1">{t("select_piece")}</Typography>

                {/* White pieces palette */}
                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {t("white_pieces")}
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {pieceOptions.map((piece) => (
                      <Box
                        key={`w${piece.value}`}
                        onClick={() => {
                          setSelectedPiece(piece.value as PieceType);
                          setSelectedColor("w");
                        }}
                        sx={{
                          width: 40,
                          height: 40,
                          border: 2,
                          borderColor:
                            selectedPiece === piece.value &&
                            selectedColor === "w"
                              ? "primary.main"
                              : "grey.300",
                          borderRadius: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          backgroundColor:
                            selectedPiece === piece.value &&
                            selectedColor === "w"
                              ? "primary.light"
                              : "background.paper",
                          "&:hover": {
                            borderColor: "primary.main",
                            backgroundColor: "primary.light",
                          },
                        }}
                      >
                        <Box
                          sx={{
                            width: 30,
                            height: 30,
                            backgroundImage: `url(./piece/cburnett/w${piece.value.toUpperCase()}.svg)`,
                            backgroundSize: "contain",
                            backgroundRepeat: "no-repeat",
                            backgroundPosition: "center",
                          }}
                        />
                      </Box>
                    ))}
                  </Box>
                </Box>

                {/* Black pieces palette */}
                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {t("black_pieces")}
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {pieceOptions.map((piece) => (
                      <Box
                        key={`b${piece.value}`}
                        onClick={() => {
                          setSelectedPiece(piece.value as PieceType);
                          setSelectedColor("b");
                        }}
                        sx={{
                          width: 40,
                          height: 40,
                          border: 2,
                          borderColor:
                            selectedPiece === piece.value &&
                            selectedColor === "b"
                              ? "primary.main"
                              : "grey.300",
                          borderRadius: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          backgroundColor:
                            selectedPiece === piece.value &&
                            selectedColor === "b"
                              ? "primary.light"
                              : "grey.100",
                          "&:hover": {
                            borderColor: "primary.main",
                            backgroundColor: "primary.light",
                          },
                        }}
                      >
                        <Box
                          sx={{
                            width: 30,
                            height: 30,
                            backgroundImage: `url(./piece/cburnett/b${piece.value.toUpperCase()}.svg)`,
                            backgroundSize: "contain",
                            backgroundRepeat: "no-repeat",
                            backgroundPosition: "center",
                          }}
                        />
                      </Box>
                    ))}
                  </Box>
                </Box>

                <Typography variant="h6">{t("position_settings")}</Typography>
                <ToggleButtonGroup
                  value={activeColor}
                  exclusive
                  onChange={(_, value) => value && setActiveColor(value)}
                  size="small"
                  fullWidth
                >
                  <ToggleButton value="w">{t("white_to_move")}</ToggleButton>
                  <ToggleButton value="b">{t("black_to_move")}</ToggleButton>
                </ToggleButtonGroup>

                <TextField
                  label={t("castling_rights")}
                  value={castling}
                  onChange={(e) => setCastling(e.target.value)}
                  size="small"
                  fullWidth
                  helperText={t("castling_rights_help")}
                />
              </Box>
            </Grid>
          </Grid>

          <Grid size={12}>
            <Box display="flex" gap={1} justifyContent="center" mb={2}>
              <Button
                variant="outlined"
                size="small"
                onClick={handleStartingPosition}
              >
                {t("starting_position")}
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={handleClearBoard}
              >
                {t("clear_board")}
              </Button>
            </Box>
          </Grid>

          <Grid size={12}>
            <TextField
              label="FEN"
              value={fenInput}
              onChange={(e) => handleFenChange(e.target.value)}
              fullWidth
              multiline
              rows={2}
              error={!!error}
              helperText={error || t("fen_help")}
              variant="outlined"
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="secondary">
          {tCommon("cancel")}
        </Button>
        <Button
          onClick={handleLoadPosition}
          variant="contained"
          disabled={!!error}
        >
          {t("board_editor_load_position")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
