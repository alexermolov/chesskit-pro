import { PgnParser } from "@/lib/pgnParser";
import { MoveTreeUtils, MoveTree, MoveTreeNode } from "@/types/moveTree";

const testPgn = `1.d4 d5 2.c4 c6 3.cxd5 cxd5 4.Nc3 
    ( 4.Bg5 { [%draw arrow,g5,d8,green]} 4...Qb6 { [%draw 
    arrow,b6,b2,green]} 
        ( 4...Nc6 5.Nc3 Qb6 
            ( 5...Nf6 6.Bxf6 exf6 { [%draw full,d5,green]} 
                ( 6...gxf6 7.e3 e6 8.Bd3 Bd6 9.Nf3 f5 10.g3 Bd7 11.O-O Rc8
                12.Rc1 h5 
                    ( 12...O-O { [%draw arrow,b2,b4,green] [%draw 
                    arrow,d1,e2,green]} )
                )
            7.e3 Bb4 8.Ne2 O-O 9.Rc1 { [%draw arrow,e2,f4,green] [%draw 
            arrow,f4,d5,green]} 9...Be6 10.Nf4 Rc8 { [%draw 
            arrow,a2,a3,green] [%draw arrow,d1,f3,green]} 11.Bd3 { [%draw 
            arrow,a2,a3,green] [%draw arrow,d1,f3,green] [%draw 
            arrow,e1,g1,green]} )
        6.Nxd5 
            ( 6.e4 dxe4 
                ( 6...e6 7.exd5 exd5 8.Bb5 a6 
                    ( 8...Bb4 9.Qa4 )
                    ( 8...Be6 )
                9.Nxd5 Qxb5 10.Nc7+ { [%draw arrow,c7,b5,green] [%draw 
                arrow,c7,e8,green] [%draw arrow,c7,a8,green]} )
            7.d5 Nb4 
                ( 7...Ne5 8.Be3 Qxb2 9.Nb5 { [%draw arrow,b5,c7,green] 
                [%draw arrow,e3,d4,green]} )
            8.Bb5+ Bd7 9.Bxd7+ Kxd7 10.Nxe4 )
        6...Qa5+ {ОШИБКА!} )
        ( 4...h6 5.Bh4 g5 
            ( 5...Qb6 6.Nc3 Qxb2 
                ( 6...e6 { [%draw full,c8,green]} 7.Qd2 )
            7.Nxd5 e6 8.Rb1 { [%draw arrow,b1,b4,green]} 8...Qxa2 )
        6.Bg3 )
    5.Nc3 Qxb2 
        ( 5...e6 { [%draw full,c8,green]} 6.Qd2 { [%draw 
        arrow,d2,b2,green] [%draw arrow,e2,e3,green] [%draw 
        arrow,f1,d3,green] [%draw arrow,g1,f3,green] [%draw 
        arrow,e1,g1,green]} )
    6.Nxd5 { [%draw arrow,d5,c7,green]} 6...Na6 { [%draw 
    arrow,a6,c7,green]} 7.e4 { [%draw arrow,f1,a6,green]} 7...e6 8.Rb1 
    Qxa2 9.Bb5+ Bd7 10.Ra1 
        ( 10.Bxd7+ Kxd7 11.Rxb7+ Kc8 12.Rxf7 )
    10...Qb2 11.Bxd7+ Kxd7 12.Qa4+ )
4...Nc6 5.Bg5 f6 
    ( 5...h6 6.Bh4 Qb6 )
6.Bh4 
    ( 6.Bd2 Nxd4 7.e3 Nc6 
        ( 7...Nf5 8.Bd3 e5 9.Nge2 { [%draw arrow,d1,b3,green] [%draw 
        arrow,a1,c1,green]} )
    8.Qh5+ g6 9.Qxd5 Qxd5 10.Nxd5 { [%draw full,e7,green] [%draw 
    full,f6,green] [%draw full,g6,green]} )
6...Nh6 
    { [%draw arrow,h6,f5,green] [%draw full,h4,green]}
*`;

interface PgnDebugUtils {
  parsePgn: (pgn?: string) => any;
  generatePgn: (moveTree?: MoveTree) => string;
  comparePgn: (originalPgn?: string) => any;
  inspectNode: (nodeId: string) => any;
  cleanPgnForComparison: (pgn: string) => string;
  getNodeDepth: (moveTree: MoveTree, nodeId: string) => number;
  analyzeDetailedDifferences: (
    originalPgn: string,
    generatedPgn: string
  ) => void;
  help: () => void;
}

const pgnDebugUtils: PgnDebugUtils = {
  // Парсинг PGN и вывод результата
  parsePgn(pgn = testPgn) {
    try {
      console.log("🔍 Парсинг PGN...");

      const result = PgnParser.parsePgnToMoveTree(pgn);

      console.log("✅ Результат парсинга:");
      console.log(
        "📊 Количество узлов:",
        Object.keys(result.moveTree.nodes).length
      );
      console.log("🎯 Корневой узел:", result.moveTree.rootId);
      console.log("🎮 Текущий узел:", result.moveTree.currentNodeId);
      console.log("📝 FEN позиция:", result.game.fen());

      console.log("\n🌳 Структура дерева:");
      Object.entries(result.moveTree.nodes).forEach(([nodeId, node]) => {
        const indent = "  ".repeat(this.getNodeDepth(result.moveTree, nodeId));
        const moveInfo = node.move ? `${node.san}` : "ROOT";
        const comment = node.comment ? ` {${node.comment}}` : "";
        console.log(`${indent}${nodeId}: ${moveInfo}${comment}`);
      });

      (window as any).lastParsedResult = result;
      return result;
    } catch (error) {
      console.error("❌ Ошибка парсинга:", error);
      return null;
    }
  },

  // Генерация PGN из дерева
  generatePgn(moveTree = (window as any).lastParsedResult?.moveTree) {
    if (!moveTree) {
      console.warn("⚠️ Нет дерева ходов. Сначала выполните parsePgn()");
      return "";
    }

    try {
      console.log("⚙️ Генерация PGN из дерева...");

      const generatedPgn = MoveTreeUtils.toPgn(moveTree);

      console.log("✅ Сгенерированный PGN:");
      console.log(generatedPgn);

      return generatedPgn;
    } catch (error) {
      console.error("❌ Ошибка генерации:", error);
      return "";
    }
  },

  // Сравнение исходного и сгенерированного PGN
  comparePgn(originalPgn = testPgn) {
    console.log("🔍 Полное сравнение PGN...\n");

    const result = this.parsePgn(originalPgn);
    if (!result) return;

    const generatedPgn = this.generatePgn(result.moveTree);

    console.log("📋 ИСХОДНЫЙ PGN:");
    console.log("─".repeat(50));
    console.log(originalPgn);

    console.log("\n🔧 СГЕНЕРИРОВАННЫЙ PGN:");
    console.log("─".repeat(50));
    console.log(generatedPgn);

    console.log("\n🔍 АНАЛИЗ РАЗЛИЧИЙ:");
    console.log("─".repeat(50));

    const originalClean = this.cleanPgnForComparison(originalPgn);
    const generatedClean = this.cleanPgnForComparison(generatedPgn);

    console.log("Исходный (очищенный):", originalClean);
    console.log("Сгенерированный (очищенный):", generatedClean);
    console.log(
      "Совпадают:",
      originalClean === generatedClean ? "✅ ДА" : "❌ НЕТ"
    );

    // Дополнительный анализ различий
    this.analyzeDetailedDifferences(originalPgn, generatedPgn);

    return {
      original: originalPgn,
      generated: generatedPgn,
      match: originalClean === generatedClean,
    };
  },

  // Детальный анализ различий
  analyzeDetailedDifferences(originalPgn: string, generatedPgn: string) {
    console.log("\n🔬 ДЕТАЛЬНЫЙ АНАЛИЗ РАЗЛИЧИЙ:");
    console.log("─".repeat(50));

    // Разбиваем на токены для сравнения
    const originalTokens = originalPgn
      .split(/\s+/)
      .filter((token) => token.trim());
    const generatedTokens = generatedPgn
      .split(/\s+/)
      .filter((token) => token.trim());

    console.log(
      `📊 Количество токенов - Исходный: ${originalTokens.length}, Сгенерированный: ${generatedTokens.length}`
    );

    // Найдем первые различающиеся токены
    let firstDiff = -1;
    for (
      let i = 0;
      i < Math.min(originalTokens.length, generatedTokens.length);
      i++
    ) {
      if (originalTokens[i] !== generatedTokens[i]) {
        firstDiff = i;
        break;
      }
    }

    if (firstDiff >= 0) {
      console.log(`❌ Первое различие на позиции ${firstDiff}:`);
      console.log(`   Исходный: "${originalTokens[firstDiff]}"`);
      console.log(`   Сгенерированный: "${generatedTokens[firstDiff]}"`);

      // Покажем контекст вокруг различия
      const start = Math.max(0, firstDiff - 3);
      const end = Math.min(originalTokens.length, firstDiff + 4);
      console.log(`\n🔍 Контекст различия:`);
      console.log(`   Исходный: ${originalTokens.slice(start, end).join(" ")}`);
      console.log(
        `   Сгенерированный: ${generatedTokens.slice(start, Math.min(generatedTokens.length, firstDiff + 4)).join(" ")}`
      );
    } else if (originalTokens.length !== generatedTokens.length) {
      console.log(`⚠️ Токены совпадают, но разная длина`);
    } else {
      console.log(`✅ Все токены совпадают!`);
    }

    // Анализ комментариев
    const originalComments = originalPgn.match(/\{[^}]*\}/g) || [];
    const generatedComments = generatedPgn.match(/\{[^}]*\}/g) || [];

    console.log(
      `\n💬 Комментарии - Исходный: ${originalComments.length}, Сгенерированный: ${generatedComments.length}`
    );
    if (originalComments.length !== generatedComments.length) {
      console.log(`❌ Количество комментариев не совпадает!`);
      console.log(
        `   Исходные комментарии: ${originalComments.slice(0, 3).join(", ")}${originalComments.length > 3 ? "..." : ""}`
      );
      console.log(
        `   Сгенерированные комментарии: ${generatedComments.slice(0, 3).join(", ")}${generatedComments.length > 3 ? "..." : ""}`
      );
    }

    // Анализ вариаций
    const originalVariations = (originalPgn.match(/\(/g) || []).length;
    const generatedVariations = (generatedPgn.match(/\(/g) || []).length;

    console.log(
      `\n🌿 Вариации - Исходный: ${originalVariations}, Сгенерированный: ${generatedVariations}`
    );
    if (originalVariations !== generatedVariations) {
      console.log(`❌ Количество вариаций не совпадает!`);
    }
  },

  // Вспомогательная функция для определения глубины узла
  getNodeDepth(moveTree: MoveTree, nodeId: string) {
    let depth = 0;
    let currentId: string | null = nodeId;

    while (currentId && currentId !== moveTree.rootId) {
      const node = moveTree.nodes[currentId];
      if (!node) break;
      currentId = node.parent;
      depth++;
    }

    return depth;
  },

  // Очистка PGN для сравнения (убираем комментарии и лишние пробелы)
  cleanPgnForComparison(pgn: string) {
    return pgn
      .replace(/\{[^}]*\}/g, "") // Убираем комментарии
      .replace(/\s+/g, " ") // Нормализуем пробелы
      .replace(/\(\s+/g, "(") // Убираем пробелы после (
      .replace(/\s+\)/g, ")") // Убираем пробелы перед )
      .trim();
  },

  // Показать информацию о конкретном узле
  inspectNode(nodeId: string) {
    const result = (window as any).lastParsedResult;
    if (!result) {
      console.warn("⚠️ Нет данных. Сначала выполните parsePgn()");
      return;
    }

    const node = result.moveTree.nodes[nodeId];
    if (!node) {
      console.warn(`⚠️ Узел ${nodeId} не найден`);
      return;
    }

    console.log(`🔍 Информация об узле ${nodeId}:`);
    console.log("  Ход:", node.move ? node.san : "ROOT");
    console.log("  Родитель:", node.parent || "нет");
    console.log(
      "  Дети:",
      node.children.length ? node.children.join(", ") : "нет"
    );
    console.log("  Комментарий:", node.comment || "нет");
    console.log("  FEN:", node.fen);

    return node;
  },

  // Показать все доступные команды
  help() {
    console.log("🆘 Доступные команды для отладки PGN:");
    console.log("─".repeat(50));
    console.log("pgnDebugUtils.parsePgn(pgn)         - Парсинг PGN");
    console.log("pgnDebugUtils.generatePgn(tree)     - Генерация PGN");
    console.log(
      "pgnDebugUtils.comparePgn(pgn)       - Сравнение исходного и сгенерированного"
    );
    console.log("pgnDebugUtils.inspectNode(nodeId)   - Информация об узле");
    console.log("pgnDebugUtils.cleanPgnForComparison - Очистка PGN");
    console.log("pgnDebugUtils.help()                - Эта справка");
    console.log("\n📝 Примеры использования:");
    console.log("pgnDebugUtils.parsePgn()");
    console.log("pgnDebugUtils.comparePgn()");
    console.log("pgnDebugUtils.inspectNode('root')");
  },
};

// Экспорт для использования в консоли браузера
if (typeof window !== "undefined") {
  (window as any).pgnDebugUtils = pgnDebugUtils;
  (window as any).testPgn = testPgn;

  console.log("🎯 Утилиты для отладки PGN загружены!");
  console.log("💡 Введите pgnDebugUtils.help() для списка команд");
  console.log("🚀 Быстрый старт: pgnDebugUtils.comparePgn()");
}

export { pgnDebugUtils, testPgn };
