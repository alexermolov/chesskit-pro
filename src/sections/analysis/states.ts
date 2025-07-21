import { DEFAULT_ENGINE } from "@/constants";
import { getRecommendedWorkersNb } from "@/lib/engine/worker";
import { EngineName } from "@/types/enums";
import { CurrentPosition, GameEval, SavedEvals } from "@/types/eval";
import { Chess, Move } from "chess.js";
import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export const gameEvalAtom = atom<GameEval | undefined>(undefined);
export const gameAtom = atom(new Chess());
export const boardAtom = atom(new Chess());
export const currentPositionAtom = atom<CurrentPosition>({});

// Атом для истории ходов - глобальное состояние
export const moveHistoryAtom = atom<{
  allMoves: Move[];
  currentPosition: number;
}>({
  allMoves: [],
  currentPosition: -1,
});

export const boardOrientationAtom = atom(true);
export const showBestMoveArrowAtom = atom(true);
export const showPlayerMoveIconAtom = atom(true);
export const showEngineLinesAtom = atom(true);

export const engineNameAtom = atom<EngineName>(DEFAULT_ENGINE);
export const engineDepthAtom = atom(14);
export const engineMultiPvAtom = atom(3);
export const engineWorkersNbAtom = atomWithStorage(
  "engineWorkersNb",
  getRecommendedWorkersNb()
);
export const evaluationProgressAtom = atom(0);

export const savedEvalsAtom = atom<SavedEvals>({});
