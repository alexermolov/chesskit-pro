import { PgnParser } from "@/lib/pgnParser";

export class CommentUtils {
  // Format comment by replacing arrows with icons
  static formatCommentWithArrows(commentText: string): string {
    const arrows = PgnParser.extractArrowsFromComment(commentText);

    if (arrows.length === 0) {
      // Even if no arrows, still remove clock annotations and empty braces
      return PgnParser.removeClockAndArrowsFromComment(commentText);
    }

    let formattedText = commentText;

    // Use the original regex from PgnParser to find and replace arrows
    const arrowRegex =
      /\[%draw\s+arrow[\s,]+([a-h][1-8])[\s,]+([a-h][1-8])(?:[\s,]+([^;\]]+))?\]/g;

    formattedText = formattedText.replace(arrowRegex, (_, from, to, color) => {
      let colorIcon = "";
      const normalizedColor = color?.toLowerCase()?.trim() || "default";

      switch (normalizedColor) {
        case "red":
        case "r":
          colorIcon = "🔴";
          break;
        case "green":
        case "g":
          colorIcon = "🟢";
          break;
        case "blue":
        case "b":
          colorIcon = "🔵";
          break;
        case "yellow":
        case "y":
          colorIcon = "🟡";
          break;
        case "orange":
        case "o":
          colorIcon = "🟠";
          break;
        default:
          colorIcon = "➤";
          break;
      }

      return `${colorIcon} ${from}→${to}`;
    });

    // Use the PgnParser function to properly remove clock annotations and empty braces
    formattedText = PgnParser.removeClockAndArrowsFromComment(formattedText);

    return formattedText;
  }

  // Prepare comment for saving - preserves arrows and clock
  static prepareCommentForSave(
    newText: string,
    currentComment: string
  ): string {
    const trimmedComment = newText.trim();

    // Extract existing arrows and clock
    const existingArrows = PgnParser.extractArrowsFromComment(currentComment);
    const existingClock = PgnParser.extractClockFromComment(currentComment);

    // Combine new text with existing annotations
    let finalComment = trimmedComment;

    // Add arrows
    existingArrows.forEach((arrow) => {
      finalComment += ` [%draw arrow,${arrow.from},${arrow.to}${
        arrow.color ? `,${arrow.color}` : ""
      }]`;
    });

    // Add clock
    if (existingClock) {
      finalComment += ` [%clk ${existingClock}]`;
    }

    return finalComment.trim();
  }
}
