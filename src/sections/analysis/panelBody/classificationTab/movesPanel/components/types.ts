// Types for display elements representation
export type ElementType =
  | "move" // Move (san notation)
  | "moveNumber" // Move number (1., 5..., etc.)
  | "comment" // Comment
  | "variationStart" // Variation start (
  | "variationEnd" // Variation end )
  | "result" // Game result (* or 1-0, 0-1, 1/2-1/2)
  | "space"; // Space

// Move tree display element
export interface DisplayElement {
  id: string; // Unique element identifier
  type: ElementType; // Element type
  text: string; // Text to display
  nodeId?: string; // Node ID in the move tree (for move and comment)
  indentLevel: number; // Indent level for variations
  needsNewLine: boolean; // Whether a line break is needed before the element
  forceLineBreakAfter?: boolean; // Force a line break after the element
}

export interface PgnDisplayProps {
  moveTree: any; // MoveTree
  onMoveClick: (nodeId: string) => void;
  onCommentUpdate: (nodeId: string, comment: string | null) => void;
  onPromoteToMainLine?: (nodeId: string) => void;
  currentNodeId: string;
}
