const { Chess } = require('chess.js');

// Simulate the parsing step by step
const pgn = "1. e4 e5 2. Nf3 Nc6 3. Bb5 (3. Bc4 Be7 4. d3) 3... a6 4. Ba4 Nf6 5. O-O Be7 (5... b5 6. Bb3 Bb7) 6. Re1 *";

console.log("Testing PGN parsing step by step:");
console.log("PGN:", pgn);

// Tokenize
const tokens = [];
let i = 0;
const moveText = pgn.replace(/\[.*?\]\s*/g, '').trim();

while (i < moveText.length) {
  const char = moveText[i];
  
  if (char === '(') {
    tokens.push({ type: 'variation_start', value: '(' });
    i++;
  } else if (char === ')') {
    tokens.push({ type: 'variation_end', value: ')' });
    i++;
  } else if (/\s/.test(char)) {
    i++;
  } else {
    let token = '';
    while (i < moveText.length && !/[\s(){}]/.test(moveText[i])) {
      token += moveText[i];
      i++;
    }
    
    if (token) {
      if (['1-0', '0-1', '1/2-1/2', '*'].includes(token)) {
        tokens.push({ type: 'result', value: token });
      } else {
        const cleanToken = token.replace(/^\d+\.+/, '');
        if (cleanToken) {
          tokens.push({ type: 'move', value: cleanToken });
        }
      }
    }
  }
}

console.log("\nTokens:", tokens.map(t => `${t.type}:${t.value}`));

// Test parsing
let currentGame = new Chess();
const variationStack = [];

console.log("\nParsing moves:");
for (let i = 0; i < tokens.length; i++) {
  const token = tokens[i];
  
  console.log(`\nStep ${i + 1}: ${token.type} - ${token.value}`);
  console.log(`Current position: ${currentGame.fen()}`);
  console.log(`Turn: ${currentGame.turn() === 'w' ? 'White' : 'Black'}`);
  
  switch (token.type) {
    case 'move':
      try {
        const move = currentGame.move(token.value);
        console.log(`✓ Move successful: ${move.san}`);
      } catch (error) {
        console.log(`✗ Move failed: ${error.message}`);
        console.log(`Available moves: ${currentGame.moves().join(', ')}`);
      }
      break;
      
    case 'variation_start':
      console.log("Starting variation - saving current state");
      variationStack.push({
        game: new Chess(currentGame.fen()),
        position: currentGame.fen()
      });
      
      // Go back one move to create variation
      currentGame.undo();
      console.log(`After undo: ${currentGame.fen()}`);
      break;
      
    case 'variation_end':
      console.log("Ending variation - restoring state");
      if (variationStack.length > 0) {
        const restored = variationStack.pop();
        currentGame = restored.game;
        console.log(`Restored to: ${currentGame.fen()}`);
      }
      break;
      
    case 'result':
      console.log("Game result encountered");
      break;
  }
}
