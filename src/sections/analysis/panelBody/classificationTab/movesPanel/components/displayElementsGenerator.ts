import { DisplayElement } from "./types";

// Function to generate display elements based on the move tree
export function generateDisplayElements(moveTree: any) {
  if (!moveTree || !moveTree.nodes || !moveTree.rootId) {
    return [];
  }

  const elements: DisplayElement[] = [];
  let elementId = 0;

  // Function to generate a unique ID for an element
  const generateElementId = () => {
    return `el_${elementId++}`;
  };

  // Function to calculate the move number based on the path from the root
  const getMoveNumber = (nodeId: string): number => {
    let currentId = nodeId;
    let moveCount = 0;

    while (currentId && currentId !== moveTree.rootId) {
      const node = moveTree.nodes[currentId];
      if (node && node.move) {
        moveCount++;
      }
      currentId = node?.parent || "";
    }

    return Math.ceil(moveCount / 2);
  };

  // Function to determine the color of the move
  const isWhiteMove = (nodeId: string): boolean => {
    let currentId = nodeId;
    let moveCount = 0;

    while (currentId && currentId !== moveTree.rootId) {
      const node = moveTree.nodes[currentId];
      if (node && node.move) {
        moveCount++;
      }
      currentId = node?.parent || "";
    }

    return moveCount % 2 === 1;
  };

  // Recursive function to process a node and its children
  const processNode = (
    nodeId: string,
    skipMove: boolean = false,
    isFirstInVariation: boolean = false,
    insideVariation: boolean = false,
    indentLevel: number = 0,
    variationEnd: boolean = false
  ): void => {
    const node = moveTree.nodes[nodeId];
    if (!node) return;

    // Add the move (except for the root and if not skipping)
    if (node.move && !skipMove) {
      const moveNumber = getMoveNumber(nodeId);
      const isWhite = isWhiteMove(nodeId);

      // For the first move in a variation:
      // - if white, then N.move
      // - if black, then N...move
      if (isFirstInVariation) {
        if (isWhite) {
          // Add the move number
          elements.push({
            id: generateElementId(),
            type: "moveNumber",
            text: `${moveNumber}.`,
            indentLevel,
            needsNewLine: false,
          });

          // Add the move
          elements.push({
            id: generateElementId(),
            type: "move",
            text: node.san,
            nodeId,
            indentLevel,
            needsNewLine: false,
          });
        } else {
          // Add the move number with ellipsis
          elements.push({
            id: generateElementId(),
            type: "moveNumber",
            text: `${moveNumber}...`,
            indentLevel,
            needsNewLine: false,
          });

          // Add the move
          elements.push({
            id: generateElementId(),
            type: "move",
            text: node.san,
            nodeId,
            indentLevel,
            needsNewLine: false,
          });
        }
      } else {
        // Inside a variation and the main line:
        // - white moves always have a number
        // - black moves: without a number, but with number if coming after variation end
        if (isWhite) {
          // Add the move number
          elements.push({
            id: generateElementId(),
            type: "moveNumber",
            text: `${moveNumber}.`,
            indentLevel,
            needsNewLine: false,
          });

          // Add the move
          elements.push({
            id: generateElementId(),
            type: "move",
            text: node.san,
            nodeId,
            indentLevel,
            needsNewLine: false,
          });
        } else {
          // For black moves: if returning from variation, add move number with ellipsis
          if (variationEnd) {
            // Add the move number with ellipsis
            elements.push({
              id: generateElementId(),
              type: "moveNumber",
              text: `${moveNumber}...`,
              indentLevel,
              needsNewLine: false,
            });
          }

          // Add the move
          elements.push({
            id: generateElementId(),
            type: "move",
            text: node.san,
            nodeId,
            indentLevel,
            needsNewLine: false,
          });
        }
      }

      // Reset variationEnd flag after using it
      variationEnd = false;

      // Add the comment if it exists
      if (node.comment) {
        elements.push({
          id: generateElementId(),
          type: "comment",
          text: node.comment,
          nodeId,
          indentLevel,
          needsNewLine: false,
        });
      }
    }

    // If there are no children - end of the branch
    if (node.children.length === 0) {
      return;
    }

    // If there is one child - just continue
    if (node.children.length === 1) {
      processNode(
        node.children[0],
        false,
        false,
        insideVariation,
        indentLevel,
        variationEnd
      );
      return;
    }

    // If there are multiple children - there are variations
    // Determine the main child
    let mainChild: string | null = null;
    const variations: string[] = [];

    const currentMainIndex = moveTree.mainLineIds.indexOf(nodeId);
    if (
      currentMainIndex !== -1 &&
      currentMainIndex + 1 < moveTree.mainLineIds.length
    ) {
      const nextMainLineId = moveTree.mainLineIds[currentMainIndex + 1];
      if (node.children.includes(nextMainLineId)) {
        mainChild = nextMainLineId;
        variations.push(
          ...node.children.filter(
            (childId: string) => childId !== nextMainLineId
          )
        );
      }
    }

    // If not found in the main line, take the first child as the main one
    if (!mainChild) {
      mainChild = node.children[0];
      variations.push(...node.children.slice(1));
    }

    // 1. First, add the move of the main line
    const mainChildNode = moveTree.nodes[mainChild!];
    if (mainChildNode && mainChildNode.move) {
      const moveNumber = getMoveNumber(mainChild!);
      const isWhite = isWhiteMove(mainChild!);

      // Main line - number only for white
      if (isWhite) {
        // Add the move number
        elements.push({
          id: generateElementId(),
          type: "moveNumber",
          text: `${moveNumber}.`,
          indentLevel,
          needsNewLine: false,
        });

        // Add the move
        elements.push({
          id: generateElementId(),
          type: "move",
          text: mainChildNode.san,
          nodeId: mainChild!,
          indentLevel,
          needsNewLine: false,
        });
      } else {
        // Black moves in the main line always without a number
        elements.push({
          id: generateElementId(),
          type: "move",
          text: mainChildNode.san,
          nodeId: mainChild!,
          indentLevel,
          needsNewLine: false,
        });
      }

      // Add the comment if it exists
      if (mainChildNode.comment) {
        elements.push({
          id: generateElementId(),
          type: "comment",
          text: mainChildNode.comment,
          nodeId: mainChild!,
          indentLevel,
          needsNewLine: false,
        });
      }
    }

    // 2. Immediately process all variations
    for (const variationId of variations) {
      // Start of the variation
      elements.push({
        id: generateElementId(),
        type: "variationStart",
        text: "(",
        indentLevel: indentLevel + 1,
        needsNewLine: true, // New line for the start of the variation
      });

      // Process the variation
      processNode(variationId, false, true, true, indentLevel + 1, false);

      // End of the variation
      elements.push({
        id: generateElementId(),
        type: "variationEnd",
        text: ")",
        indentLevel: indentLevel + 1,
        needsNewLine: false,
        forceLineBreakAfter: true, // Add a line break AFTER the closing bracket
      });

      variationEnd = true;
    }

    // 3. Then continue with the children of the main line (skipping the move itself, as it has already been added)
    if (mainChildNode) {
      processNode(mainChild!, true, false, false, indentLevel, variationEnd);
    }
  };

  // Start from the root
  processNode(moveTree.rootId, false, false, false, 0, false);

  // Add the end symbol
  elements.push({
    id: generateElementId(),
    type: "result",
    text: "*",
    indentLevel: 0,
    needsNewLine: false,
  });

  return elements;
}
