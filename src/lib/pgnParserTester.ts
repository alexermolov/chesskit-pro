import { PgnParser } from "./pgnParser";
import {
  TEST_PGN_WITH_VARIATIONS,
  SIMPLE_PGN,
  COMPLEX_PGN_WITH_MULTIPLE_VARIATIONS,
  PGN_WITH_NESTED_VARIATIONS,
} from "./testPgn";

/**
 * Тестирует парсер PGN на различных вариациях
 */
export function testPgnParser() {
  console.log("🧪 Тестирование PGN парсера...");

  const testCases = [
    { name: "Простой PGN", pgn: SIMPLE_PGN },
    { name: "PGN с вариациями", pgn: TEST_PGN_WITH_VARIATIONS },
    {
      name: "Сложный PGN с множественными вариациями",
      pgn: COMPLEX_PGN_WITH_MULTIPLE_VARIATIONS,
    },
    { name: "PGN с вложенными вариациями", pgn: PGN_WITH_NESTED_VARIATIONS },
  ];

  const results = testCases.map((testCase) => {
    try {
      console.log(`\n📝 Тестируем: ${testCase.name}`);
      console.log(`PGN: ${testCase.pgn.substring(0, 100)}...`);

      const result = PgnParser.parsePgnToMoveTree(testCase.pgn);
      const nodeCount = Object.keys(result.moveTree.nodes).length;

      console.log(`✅ Успешно! Создано узлов: ${nodeCount}`);
      console.log(`📊 Позиция игры: ${result.game.fen()}`);

      return {
        name: testCase.name,
        success: true,
        nodeCount,
        error: null,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.log(`❌ Ошибка: ${errorMessage}`);
      return {
        name: testCase.name,
        success: false,
        nodeCount: 0,
        error: errorMessage,
      };
    }
  });

  console.log("\n📈 Сводка результатов:");
  results.forEach((result) => {
    const status = result.success ? "✅" : "❌";
    console.log(
      `${status} ${result.name}: ${
        result.success ? `${result.nodeCount} узлов` : result.error
      }`
    );
  });

  const successCount = results.filter((r) => r.success).length;
  console.log(`\n🎯 Пройдено тестов: ${successCount}/${results.length}`);

  return results;
}

/**
 * Тестирует конкретный PGN и возвращает детальную информацию
 */
export function debugPgnParsing(pgn: string) {
  console.log("🔍 Детальное тестирование PGN парсера:");
  console.log(`PGN: ${pgn}`);

  try {
    const result = PgnParser.parsePgnToMoveTree(pgn);

    console.log("\n📊 Результат парсинга:");
    console.log(
      `- Узлов в дереве: ${Object.keys(result.moveTree.nodes).length}`
    );
    console.log(`- Корневой узел: ${result.moveTree.rootId}`);
    console.log(`- Позиция игры: ${result.game.fen()}`);

    console.log("\n🌳 Структура дерева:");
    Object.entries(result.moveTree.nodes).forEach(([nodeId, node]) => {
      const parentInfo = node.parent
        ? ` (родитель: ${node.parent})`
        : " (корень)";
      const childrenInfo =
        node.children.length > 0 ? ` детей: ${node.children.length}` : "";
      console.log(
        `  ${nodeId}: ${node.san || "root"}${parentInfo}${childrenInfo}`
      );
    });

    return result;
  } catch (error) {
    console.error("❌ Ошибка парсинга:", error);
    throw error;
  }
}
