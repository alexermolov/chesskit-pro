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
  const [editableGame, setEditableGame] = useState(() => new Chess(initialFen));
  const [fenInput, setFenInput] = useState(initialFen);
  const [error, setError] = useState<string | null>(null);
  const [selectedPiece, setSelectedPiece] = useState<PieceType>("p");
  const [selectedColor, setSelectedColor] = useState<PieceColor>("w");
  const [activeColor, setActiveColor] = useState<"w" | "b">("w");
  const [castling, setCastling] = useState("KQkq");

  // Helper function to validate board state
  const validateBoardState = useCallback((game: Chess) => {
    const squares = game.board().flat();
    const whiteKing = squares.filter(
      (square) => square && square.type === "k" && square.color === "w"
    ).length;
    const blackKing = squares.filter(
      (square) => square && square.type === "k" && square.color === "b"
    ).length;

    if (whiteKing === 0) return "White king is missing";
    if (blackKing === 0) return "Black king is missing";
    if (whiteKing > 1) return "Too many white kings";
    if (blackKing > 1) return "Too many black kings";

    return null;
  }, []);

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
        setError("Invalid initial FEN");
      }
    }
  }, [open, initialFen]);

  const handleFenChange = useCallback((value: string) => {
    setFenInput(value);
    try {
      const testGame = new Chess(value);
      setEditableGame(testGame);
      setError(null);
    } catch {
      setError("Invalid FEN string");
    }
  }, []);

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
          setError("Invalid position: " + (validationError as Error).message);
        }
      } catch {
        setError("Error updating position");
      }
    },
    [activeColor, castling, validateBoardState]
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
        setError("Invalid move");
      }
      return false;
    },
    [editableGame, updateGameFromBoard]
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
        setError("Error placing piece");
      }
    },
    [editableGame, selectedPiece, selectedColor, updateGameFromBoard]
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
        setError("Error removing piece");
      }
    },
    [editableGame, updateGameFromBoard]
  );

  const handleClearBoard = useCallback(() => {
    try {
      const newGame = new Chess();
      newGame.clear();
      setEditableGame(newGame);
      updateGameFromBoard(newGame);
    } catch {
      setError("Error clearing board");
    }
  }, [updateGameFromBoard]);

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
        setError("Invalid position: " + (validationError as Error).message);
      }
    }
  }, [error, fenInput, onLoadPosition, onClose, validateBoardState]);

  const boardStyle = useMemo(
    () => ({
      borderRadius: "5px",
      boxShadow: "0 2px 10px rgba(0, 0, 0, 0.3)",
    }),
    []
  );

  const pieceOptions = [
    { value: "p", label: "Pawn" },
    { value: "n", label: "Knight" },
    { value: "b", label: "Bishop" },
    { value: "r", label: "Rook" },
    { value: "q", label: "Queen" },
    { value: "k", label: "King" },
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
      <DialogTitle>Board Editor</DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          <Grid size={12}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Select a piece from the palette, then left-click on the board to
              place it. Right-click on the board to remove pieces. You can also
              drag pieces to move them.
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
                <Typography variant="subtitle1">Select Piece</Typography>

                {/* White pieces palette */}
                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    White Pieces
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
                    Black Pieces
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

                <Typography variant="h6">Position Settings</Typography>
                <ToggleButtonGroup
                  value={activeColor}
                  exclusive
                  onChange={(_, value) => value && setActiveColor(value)}
                  size="small"
                  fullWidth
                >
                  <ToggleButton value="w">White to move</ToggleButton>
                  <ToggleButton value="b">Black to move</ToggleButton>
                </ToggleButtonGroup>

                <TextField
                  label="Castling rights"
                  value={castling}
                  onChange={(e) => setCastling(e.target.value)}
                  size="small"
                  fullWidth
                  helperText="e.g., KQkq, Kq, -, etc."
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
                Starting Position
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={handleClearBoard}
              >
                Clear Board
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
              helperText={error || "Enter a valid FEN string"}
              variant="outlined"
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button
          onClick={handleLoadPosition}
          variant="contained"
          disabled={!!error}
        >
          Load Position
        </Button>
      </DialogActions>
    </Dialog>
  );
}
