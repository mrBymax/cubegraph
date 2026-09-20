import { create } from 'zustand'
import {
  SOLVED_STATE,
  applyMove,
  generateScramble,
  isSolved,
  type MoveName,
  GENERATOR_PRESETS,
  type GeneratorPreset,
} from '@/engine/cube'

interface CubeStoreState {
  currentState: string
  history: MoveName[]
  selectedPresetId: string
  depth: number
  isSolvedState: boolean

  // Actions
  applyMove: (move: MoveName) => void
  setCurrentState: (state: string) => void
  setDepth: (depth: number) => void
  setPreset: (presetId: string) => void
  scramble: (length?: number) => void
  resetToSolved: () => void
  undo: () => void
  getActivePreset: () => GeneratorPreset
}

export const useCubeStore = create<CubeStoreState>((set, get) => ({
  currentState: SOLVED_STATE,
  history: [],
  selectedPresetId: 'RU',
  depth: 2,
  isSolvedState: true,

  applyMove: (move: MoveName) => {
    const next = applyMove(get().currentState, move)
    set((s) => ({
      currentState: next,
      history: [...s.history, move],
      isSolvedState: isSolved(next),
    }))
  },

  setCurrentState: (state: string) => {
    set({
      currentState: state,
      isSolvedState: isSolved(state),
    })
  },

  setDepth: (depth: number) => {
    set({ depth })
  },

  setPreset: (presetId: string) => {
    set({ selectedPresetId: presetId })
  },

  scramble: (length: number = 6) => {
    const preset = get().getActivePreset()
    const moves = generateScramble(length, preset.generators)
    let state = get().currentState
    for (const m of moves) {
      state = applyMove(state, m)
    }
    set((s) => ({
      currentState: state,
      history: [...s.history, ...moves],
      isSolvedState: isSolved(state),
    }))
  },

  resetToSolved: () => {
    set({
      currentState: SOLVED_STATE,
      history: [],
      isSolvedState: true,
    })
  },

  undo: () => {
    const { history } = get()
    if (history.length === 0) return
    const newHistory = history.slice(0, -1)
    let state = SOLVED_STATE
    for (const m of newHistory) {
      state = applyMove(state, m)
    }
    set({
      currentState: state,
      history: newHistory,
      isSolvedState: isSolved(state),
    })
  },

  getActivePreset: () => {
    const { selectedPresetId } = get()
    return (
      GENERATOR_PRESETS.find((p) => p.id === selectedPresetId) ||
      GENERATOR_PRESETS[0]
    )
  },
}))
