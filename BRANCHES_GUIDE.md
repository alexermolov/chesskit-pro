# Система веток для истории ходов в ChessKit Pro

## Обзор

Реализована древовидная система истории ходов, которая позволяет создавать и управлять ветками (вариантами игры). Это расширение линейной истории ходов, где каждый ход может иметь несколько альтернатив.

## Ключевые компоненты

### 1. MoveTree (src/types/moveTree.ts)
- **MoveTreeNode**: Узел дерева с ходом, родителем и детьми
- **MoveTree**: Структура дерева с узлами, корнем и текущей позицией
- **MoveTreeUtils**: Утилиты для работы с деревом (добавление ходов, навигация, удаление веток)

### 2. useChessActionsWithBranches (src/hooks/useChessActionsWithBranches.ts)
Хук для работы с ветвящейся историей:
- `playMove()` - добавление хода (создает ветку если ход уже существует)
- `undoMove()` / `redoMove()` - навигация по истории
- `goToNode()` - переход к конкретному узлу
- `deleteBranch()` - удаление ветки
- `promoteToMainLine()` - превращение ветки в главную линию

### 3. BranchManager (src/components/BranchManager.tsx)
UI компонент для управления ветками:
- Отображение всех веток
- Альтернативные ходы в текущей позиции
- Операции с ветками (удаление, промоция в главную линию)

## Как работают ветки

### Создание веток
```typescript
// Обычный ход добавляется в текущую ветку
playMove({ from: "e2", to: "e4" });

// Если сделать ход назад и затем другой ход, создается новая ветка
undoMove();
playMove({ from: "d2", to: "d4" }); // Создает новую ветку

// Принудительное создание новой ветки даже если ход уже существует
playMove({ from: "e2", to: "e4", createNewBranch: true });
```

### Навигация по веткам
```typescript
// Переход к конкретному узлу
goToNode("node_id_123");

// Переход к ветке
goToBranch(branchInfo, moveIndex);

// Обычная навигация
undoMove(); // К родительскому узлу
redoMove(); // К первому дочернему узлу
```

### Управление ветками
```typescript
// Удаление ветки
deleteBranch("node_id_123");

// Превращение ветки в главную линию
promoteToMainLine("node_id_123");

// Получение альтернативных ходов
const alternatives = getAlternativeMoves();
```

## Интеграция в приложение

### 1. Добавить атом состояния
```typescript
// В src/sections/analysis/states.ts уже добавлен
export const moveTreeAtom = atom<MoveTree>(
  MoveTreeUtils.createEmptyTree(DEFAULT_POSITION)
);
```

### 2. Использовать хук
```typescript
import { useChessActionsWithBranches } from "@/hooks/useChessActionsWithBranches";

const MyComponent = () => {
  const {
    playMove,
    undoMove,
    redoMove,
    branches,
    currentNode,
    getAlternativeMoves,
  } = useChessActionsWithBranches(boardAtom);
  
  // Ваш код...
};
```

### 3. Добавить UI компоненты
```typescript
import BranchManager from "@/components/BranchManager";

// В вашем компоненте
<BranchManager />
```

## Совместимость

Хук `useChessActionsWithBranches` предоставляет API совместимый с линейным хуком:
- `moveHistory` - массив ходов до текущей позиции
- `currentPosition` - индекс текущей позиции
- Все основные функции (`playMove`, `undoMove`, `redoMove`)

## Тестирование

Компонент `HistoryDebugger` был обновлен для демонстрации обеих систем:
- Линейная история (слева)
- Ветвящаяся история (справа)
- Менеджер веток (справа внизу)

## Будущие улучшения

1. **Комментарии к ходам**: Добавление комментариев к узлам дерева
2. **Оценки позиций**: Сохранение оценок движка для каждого узла
3. **Экспорт/импорт**: Сохранение дерева в PGN с вариантами
4. **Визуализация**: Графическое отображение дерева ходов
5. **Горячие клавиши**: Быстрая навигация по веткам

## Примеры использования

### Анализ партии с вариантами
```typescript
// Основная линия
playMove({ from: "e2", to: "e4" });
playMove({ from: "e7", to: "e5" });

// Возвращаемся и исследуем альтернативу
undoMove(); // Назад к позиции после 1.e4
playMove({ from: "c7", to: "c5" }); // Сицилианская защита (новая ветка)

// Можем вернуться к основной линии
const mainBranch = branches.find(b => b.isMainLine);
goToBranch(mainBranch);
```

### Подготовка дебютного репертуара
```typescript
// Создаем дерево дебютных вариантов
playMove({ from: "e2", to: "e4" });

// Ответы черных
playMove({ from: "e7", to: "e5" }); // Открытые дебюты
undoMove();
playMove({ from: "c7", to: "c5" }); // Сицилианская
undoMove();
playMove({ from: "e7", to: "e6" }); // Французская

// Для каждого ответа можно развивать свои ветки
```
