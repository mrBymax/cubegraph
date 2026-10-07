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
import { solveCube, type SolveResult } from '@/engine/solver'

interface CubeStoreState {
  initialState: string // The initial scrambled position
  currentState: string // The currently active/viewed state (for 3D cube and playback)
  history: MoveName[] // Move history applied so far
  selectedPresetId: string
  depth: number // Cayley neighborhood depth (1..3)
  isSolvedState: boolean

  // Solution and path state
  solveResult: SolveResult | null
  currentStepIndex: number // 0 = startState, 1..N = steps along solution
  isPlaying: boolean
  playbackSpeedMs: number
  viewMode: 'solutionPath' | 'cayleyLocal'

  // Actions
  applyMove: (move: MoveName) => void
  setCurrentState: (state: string) => void
  setDepth: (depth: number) => void
  setPreset: (presetId: string) => void
  setViewMode: (mode: 'solutionPath' | 'cayleyLocal') => void
  setPlaybackSpeedMs: (speed: number) => void

  // Scramble & Custom Configuration
  scrambleAndSolve: (length?: number) => void
  applyCustomConfiguration: (moves: MoveName[]) => void
  recomputeSolution: () => void

  // Playback & Path stepping
  setStep: (stepIndex: number) => void
  nextStep: () => void
  prevStep: () => void
  togglePlay: () => void
  resetToSolved: () => void

  getActivePreset: () => GeneratorPreset
}

export const useCubeStore = create<CubeStoreState>((set, get) => ({
  initialState: SOLVED_STATE,
  currentState: SOLVED_STATE,
  history: [],
  selectedPresetId: 'RU',
  depth: 2,
  isSolvedState: true,

  solveResult: null,
  currentStepIndex: 0,
  isPlaying: false,
  playbackSpeedMs: 700,
  viewMode: 'solutionPath',

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

  setViewMode: (mode: 'solutionPath' | 'cayleyLocal') => {
    set({ viewMode: mode })
  },

  setPlaybackSpeedMs: (speed: number) => {
    set({ playbackSpeedMs: speed })
  },

  // Scramble the cube and immediately solve to generate path
  scrambleAndSolve: (length: number = 5) => {
    const preset = get().getActivePreset()
    const scrambleMoves = generateScramble(length, preset.generators)
    let state = SOLVED_STATE
    for (const m of scrambleMoves) {
      state = applyMove(state, m)
    }

    // Solve using bi-directional BFS / generator set
    const result = solveCube({
      currentState: state,
      scrambleHistory: scrambleMoves,
      generatorSet: preset.generators,
      maxBFSdepth: 8,
    })

    set({
      initialState: state,
      currentState: state,
      history: scrambleMoves,
      isSolvedState: isSolved(state),
      solveResult: result,
      currentStepIndex: 0,
      isPlaying: false,
      viewMode: 'solutionPath',
    })
  },

  // Apply a custom sequence of moves (e.g. from user input)
  applyCustomConfiguration: (moves: MoveName[]) => {
    let state = SOLVED_STATE
    for (const m of moves) {
      state = applyMove(state, m)
    }

    const preset = get().getActivePreset()
    const result = solveCube({
      currentState: state,
      scrambleHistory: moves,
      generatorSet: preset.generators,
      maxBFSdepth: 8,
    })

    set({
      initialState: state,
      currentState: state,
      history: moves,
      isSolvedState: isSolved(state),
      solveResult: result,
      currentStepIndex: 0,
      isPlaying: false,
      viewMode: 'solutionPath',
    })
  },

  // Recompute solution for whatever the current state is
  recomputeSolution: () => {
    const { currentState, history } = get()
    const preset = get().getActivePreset()
    const result = solveCube({
      currentState,
      scrambleHistory: history,
      generatorSet: preset.generators,
      maxBFSdepth: 8,
    })

    set({
      initialState: currentState,
      solveResult: result,
      currentStepIndex: 0,
      isPlaying: false,
    })
  },

  setStep: (stepIndex: number) => {
    const { solveResult } = get()
    if (!solveResult || solveResult.states.length === 0) return

    const clamped = Math.max(0, Math.min(stepIndex, solveResult.states.length - 1))
    const targetState = solveResult.states[clamped]

    set({
      currentStepIndex: clamped,
      currentState: targetState,
      isSolvedState: isSolved(targetState),
    })
  },

  nextStep: () => {
    const { currentStepIndex, solveResult } = get()
    if (!solveResult) return
    if (currentStepIndex < solveResult.states.length - 1) {
      get().setStep(currentStepIndex + 1)
    } else {
      set({ isPlaying: false })
    }
  },

  prevStep: () => {
    const { currentStepIndex } = get()
    if (currentStepIndex > 0) {
      get().setStep(currentStepIndex - 1)
    }
  },

  togglePlay: () => {
    const { isPlaying, currentStepIndex, solveResult } = get()
    if (!solveResult || solveResult.path.length === 0) return

    // If at the end, restart from beginning
    if (!isPlaying && currentStepIndex >= solveResult.states.length - 1) {
      get().setStep(0)
    }

    set({ isPlaying: !isPlaying })
  },

  resetToSolved: () => {
    set({
      initialState: SOLVED_STATE,
      currentState: SOLVED_STATE,
      history: [],
      isSolvedState: true,
      solveResult: null,
      currentStepIndex: 0,
      isPlaying: false,
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
