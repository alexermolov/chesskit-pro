import { Move } from "chess.js";

// Узел дерева ходов
export interface MoveTreeNode {
  id: string; // Уникальный идентификатор узла
  move: Move | null; // Ход (null для корневого узла)
  parent: string | null; // ID родительского узла
  children: string[]; // Массив ID дочерних узлов
  san: string; // Шахматная нотация для отображения
  comment?: string; // Комментарий к ходу
  fen: string; // Позиция после хода
}

// Структура дерева ходов с ветками
export interface MoveTree {
  nodes: { [nodeId: string]: MoveTreeNode }; // Все узлы дерева
  rootId: string; // ID корневого узла
  currentNodeId: string; // ID текущего активного узла
  mainLineIds: string[]; // ID узлов главной линии
}

// Информация о ветке
export interface BranchInfo {
  id: string;
  name: string;
  nodeIds: string[]; // Путь от корня до конца ветки
  isMainLine: boolean;
  moveCount: number;
}

// Утилиты для работы с деревом ходов
export class MoveTreeUtils {
  // Создание нового пустого дерева
  static createEmptyTree(initialFen: string): MoveTree {
    const rootId = "root";
    const rootNode: MoveTreeNode = {
      id: rootId,
      move: null,
      parent: null,
      children: [],
      san: "",
      fen: initialFen,
    };

    return {
      nodes: { [rootId]: rootNode },
      rootId,
      currentNodeId: rootId,
      mainLineIds: [rootId],
    };
  }

  // Добавление хода в дерево
  static addMove(
    tree: MoveTree,
    move: Move,
    fen: string,
    parentNodeId?: string
  ): { tree: MoveTree; nodeId: string } {
    const parent = parentNodeId || tree.currentNodeId;
    const parentNode = tree.nodes[parent];

    if (!parentNode) {
      throw new Error(`Parent node ${parent} not found`);
    }

    const nodeId = `${parent}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const newNode: MoveTreeNode = {
      id: nodeId,
      move,
      parent,
      children: [],
      san: move.san,
      fen,
    };

    const newTree: MoveTree = {
      ...tree,
      nodes: {
        ...tree.nodes,
        [nodeId]: newNode,
        [parent]: {
          ...parentNode,
          children: [...parentNode.children, nodeId],
        },
      },
      currentNodeId: nodeId,
    };

    // Если добавляем к концу главной линии, расширяем её
    if (parent === tree.mainLineIds[tree.mainLineIds.length - 1]) {
      newTree.mainLineIds = [...tree.mainLineIds, nodeId];
    }

    return { tree: newTree, nodeId };
  }

  // Получение пути от корня до узла
  static getPathToNode(tree: MoveTree, nodeId: string): string[] {
    const path: string[] = [];
    let currentId: string | null = nodeId;

    while (currentId && currentId !== tree.rootId) {
      path.unshift(currentId);
      const node: MoveTreeNode | undefined = tree.nodes[currentId];
      currentId = node?.parent || null;
    }

    return path;
  }

  // Получение всех ходов от корня до узла
  static getMovesToNode(tree: MoveTree, nodeId: string): Move[] {
    const path = this.getPathToNode(tree, nodeId);
    return path
      .map((id) => tree.nodes[id]?.move)
      .filter((move): move is Move => move !== null);
  }

  // Получение всех веток
  static getAllBranches(tree: MoveTree): BranchInfo[] {
    const branches: BranchInfo[] = [];

    // Главная линия
    const mainLine: BranchInfo = {
      id: "main",
      name: "Главная линия",
      nodeIds: tree.mainLineIds,
      isMainLine: true,
      moveCount: tree.mainLineIds.length - 1, // Исключаем корневой узел
    };
    branches.push(mainLine);

    // Поиск всех концевых узлов (листьев)
    const leafNodes = Object.values(tree.nodes).filter(
      (node) => node.children.length === 0 && node.id !== tree.rootId
    );

    // Создаем ветки для каждого листа, который не в главной линии
    leafNodes.forEach((leaf, index) => {
      const path = this.getPathToNode(tree, leaf.id);
      const isMainLineBranch = tree.mainLineIds.includes(leaf.id);

      if (!isMainLineBranch && path.length > 0) {
        branches.push({
          id: `branch_${index}`,
          name: `Вариант ${index + 1}`,
          nodeIds: [tree.rootId, ...path],
          isMainLine: false,
          moveCount: path.length,
        });
      }
    });

    return branches;
  }

  // Переход к узлу
  static goToNode(tree: MoveTree, nodeId: string): MoveTree {
    if (!tree.nodes[nodeId]) {
      throw new Error(`Node ${nodeId} not found`);
    }

    return {
      ...tree,
      currentNodeId: nodeId,
    };
  }

  // Удаление ветки (узла и всех его потомков)
  static deleteBranch(tree: MoveTree, nodeId: string): MoveTree {
    if (nodeId === tree.rootId) {
      throw new Error("Cannot delete root node");
    }

    const node = tree.nodes[nodeId];
    if (!node) {
      throw new Error(`Node ${nodeId} not found`);
    }

    // Собираем все узлы для удаления (узел и все его потомки)
    const nodesToDelete = new Set<string>();
    const collectNodes = (id: string) => {
      nodesToDelete.add(id);
      const currentNode = tree.nodes[id];
      if (currentNode) {
        currentNode.children.forEach(collectNodes);
      }
    };
    collectNodes(nodeId);

    // Создаем новые узлы без удаляемых
    const newNodes = { ...tree.nodes };
    nodesToDelete.forEach((id) => delete newNodes[id]);

    // Удаляем ссылку из родителя
    if (node.parent) {
      const parent = newNodes[node.parent];
      if (parent) {
        parent.children = parent.children.filter((id) => id !== nodeId);
      }
    }

    // Обновляем главную линию, если она затронута
    const newMainLineIds = tree.mainLineIds.filter(
      (id) => !nodesToDelete.has(id)
    );

    // Если текущий узел удален, переходим к родителю
    let newCurrentNodeId = tree.currentNodeId;
    if (nodesToDelete.has(tree.currentNodeId)) {
      newCurrentNodeId = node.parent || tree.rootId;
    }

    return {
      ...tree,
      nodes: newNodes,
      currentNodeId: newCurrentNodeId,
      mainLineIds: newMainLineIds,
    };
  }

  // Промоция ветки в главную линию
  static promoteToMainLine(tree: MoveTree, nodeId: string): MoveTree {
    const path = this.getPathToNode(tree, nodeId);

    return {
      ...tree,
      mainLineIds: [tree.rootId, ...path],
    };
  }
}
