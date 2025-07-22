// Тестовый PGN с вариациями для проверки парсера
export const TEST_PGN_WITH_VARIATIONS =
  "1. e4 e5 2. Nf3 Nc6 3. Bb5 (3. Bc4 Be7 4. d3) 3... a6 4. Ba4 Nf6 5. O-O Be7 (5... b5 6. Bb3 Bb7) 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 *";

export const SIMPLE_PGN =
  "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 *";

// Дополнительные тестовые PGN для проверки различных случаев
export const COMPLEX_PGN_WITH_MULTIPLE_VARIATIONS =
  "1. e4 e5 2. Nf3 Nc6 3. Bb5 (3. Bc4 Be7 (3... f5 4. exf5 Bxf5) 4. d3) 3... a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 *";

export const PGN_WITH_NESTED_VARIATIONS =
  "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 (3... Nf6 4. O-O (4. d3 Be7) 4... Be7) 4. Ba4 *";
