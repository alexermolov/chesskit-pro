import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Box,
  IconButton,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { Move } from "chess.js";
import { useEffect, useState, useCallback } from "react";

interface BranchOption {
  nodeId: string;
  move: Move;
  previewMoves: Move[]; // First few moves from branch for preview
}

interface BranchSelectionModalProps {
  open: boolean;
  onClose: () => void;
  branches: BranchOption[];
  onSelectBranch: (nodeId: string) => void;
  currentMove?: Move | null; // Current move for context
}

export default function BranchSelectionModal({
  open,
  onClose,
  branches,
  onSelectBranch,
  currentMove,
}: BranchSelectionModalProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Total number of options: branches + main line option
  const totalOptions = branches.length + 1;

  useEffect(() => {
    // Reset selected index when modal opens
    if (open) {
      setSelectedIndex(0);
    }
  }, [open]);

  const handleSelectBranch = useCallback(
    (nodeId: string) => {
      onSelectBranch(nodeId);
      onClose();
    },
    [onSelectBranch, onClose]
  );

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : totalOptions - 1));
          break;
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev < totalOptions - 1 ? prev + 1 : 0));
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex < branches.length) {
            handleSelectBranch(branches[selectedIndex].nodeId);
          } else {
            handleSelectBranch("main");
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    open,
    selectedIndex,
    branches,
    totalOptions,
    handleSelectBranch,
    onClose,
  ]);

  const getPreviewText = (moves: Move[]): string => {
    return moves
      .slice(0, 3) // Show only first 3 moves from branch
      .map((move) => move.san)
      .join(" ");
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            backgroundColor: "background.paper",
            backgroundImage: "none",
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 1,
        }}
      >
        Choose branch to continue
        <IconButton onClick={onClose} size="small">
          <Icon icon="mdi:close" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {currentMove &&
            `After move ${currentMove.san} the following variants are available:`}
        </Typography>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mb: 2, display: "block" }}
        >
          Use ↑↓ to navigate, Enter to select, Esc to cancel
        </Typography>

        <List disablePadding>
          {branches.map((branch, index) => {
            const isSelected = selectedIndex === index;
            return (
              <ListItem key={branch.nodeId} disablePadding>
                <ListItemButton
                  onClick={() => handleSelectBranch(branch.nodeId)}
                  sx={{
                    border: 1,
                    borderColor: isSelected ? "primary.main" : "divider",
                    borderRadius: 1,
                    mb: 1,
                    backgroundColor: isSelected
                      ? "action.selected"
                      : "transparent",
                    "&:hover": {
                      borderColor: "primary.main",
                      backgroundColor: "action.hover",
                    },
                  }}
                >
                  <ListItemText
                    primary={
                      <Box>
                        <Typography variant="subtitle2" component="span">
                          Variant {index + 1}: {branch.move.san}
                        </Typography>
                        {branch.previewMoves.length > 0 && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 0.5 }}
                          >
                            Continuation: {getPreviewText(branch.previewMoves)}
                            {branch.previewMoves.length > 3 && "..."}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <Icon icon="mdi:chevron-right" />
                </ListItemButton>
              </ListItem>
            );
          })}

          {/* Option to continue on main line */}
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => handleSelectBranch("main")}
              sx={{
                border: 1,
                borderColor: "primary.main",
                borderRadius: 1,
                backgroundColor:
                  selectedIndex === branches.length
                    ? "primary.dark"
                    : "primary.main",
                color: "primary.contrastText",
                "&:hover": {
                  backgroundColor: "primary.dark",
                },
              }}
            >
              <ListItemText
                primary={
                  <Typography variant="subtitle2">
                    Continue on main line
                  </Typography>
                }
                secondary={
                  <Typography
                    variant="body2"
                    sx={{ color: "inherit", opacity: 0.8 }}
                  >
                    Follow the main variation
                  </Typography>
                }
              />
              <Icon icon="mdi:arrow-right-bold" />
            </ListItemButton>
          </ListItem>
        </List>
      </DialogContent>
    </Dialog>
  );
}
