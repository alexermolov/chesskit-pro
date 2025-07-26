import { MoveTree } from "@/types/moveTree";

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

// Интерфейс для отображения PGN
export interface PgnDisplayProps {
  moveTree: MoveTree;
  onMoveClick: (nodeId: string) => void;
  onCommentUpdate: (nodeId: string, comment: string | null) => void;
  currentNodeId: string;
}

// Интерфейс для отдельных элементов отображения
export interface MoveElementProps {
  element: DisplayElement;
  currentNodeId: string;
  onMoveClick: (nodeId: string) => void;
  onStartEditComment: (nodeId: string, comment: string) => void;
  moveTree: MoveTree;
  colors: {
    moveColor: string;
    hoverColor: string;
  };
}

export interface CommentElementProps {
  element: DisplayElement;
  onStartEditComment: (nodeId: string, comment: string) => void;
  formatCommentWithArrows: (comment: string) => string;
  theme: any;
}

export interface CommentEditorProps {
  nodeId: string;
  commentText: string;
  onSave: (nodeId: string) => void;
  onCancel: () => void;
  onChange: (text: string) => void;
  theme: any;
}
