// Типы для представления элементов отображения
export type ElementType =
  | "move" // Ход (сан-нотация)
  | "moveNumber" // Номер хода (1., 5..., и т.д.)
  | "comment" // Комментарий
  | "variationStart" // Начало вариации (
  | "variationEnd" // Конец вариации )
  | "result" // Результат партии (* или 1-0, 0-1, 1/2-1/2)
  | "space"; // Пробел

// Элемент отображения дерева ходов
export interface DisplayElement {
  id: string; // Уникальный идентификатор элемента
  type: ElementType; // Тип элемента
  text: string; // Текст для отображения
  nodeId?: string; // ID узла в дереве ходов (для move и comment)
  indentLevel: number; // Уровень отступа для вариаций
  needsNewLine: boolean; // Нужен ли перенос строки перед элементом
  forceLineBreakAfter?: boolean; // Принудительно добавить перенос строки после элемента
}

export interface PgnDisplayProps {
  moveTree: any; // MoveTree
  onMoveClick: (nodeId: string) => void;
  onCommentUpdate: (nodeId: string, comment: string | null) => void;
  currentNodeId: string;
}
