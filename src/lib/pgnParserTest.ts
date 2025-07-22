import { PgnParser } from "@/lib/pgnParser";

// Функция для тестирования парсера в консоли браузера
export function testPgnParser() {
  const testPgn = `1. e4 e5 2. Nf3 Nc6 3. Bb5 (3. Bc4 Be7 4. d3) 3... a6 4. Ba4 Nf6 5. O-O Be7 (5... b5 6. Bb3 Bb7) 6. Re1 *`;
  
  console.log("🧪 Тестируем PGN парсер с вариациями:");
  console.log("PGN:", testPgn);
  
  const result = PgnParser.parsePgnToMoveTree(testPgn);
  console.log("📊 Результат парсинга:");
  console.log("- Узлов в дереве:", Object.keys(result.moveTree.nodes).length);
  console.log("- Корневой узел:", result.moveTree.nodes[result.moveTree.rootId]);
  
  // Проверяем наличие веток
  let branchCount = 0;
  Object.values(result.moveTree.nodes).forEach(node => {
    if (node.children.length > 1) {
      branchCount++;
      console.log("🌿 Узел с ветками:", node.san, "→", node.children.length, "детей");
    }
  });
  
  console.log("🌳 Всего узлов с ветками:", branchCount);
  
  return result;
}

// Добавляем функцию в window для доступа из консоли браузера
if (typeof window !== "undefined") {
  (window as any).testPgnParser = testPgnParser;
}
