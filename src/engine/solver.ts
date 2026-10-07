import {
  applyMove,
  SOLVED_STATE,
  type MoveName,
  INVERSE_MOVES,
  GENERATOR_PRESETS,
} from './cube'
import cubeSolver from 'cube-solver'

export interface ExploredNodeInfo {
  state: string
  depth: number
  parent: string | null
  move: MoveName | null
  direction: 'forward' | 'backward'
}

export interface ExploredEdgeInfo {
  source: string
  target: string
  move: MoveName
  isPathEdge: boolean
}

export interface SolveResult {
  path: MoveName[]
  states: string[] // states[0] = startState, states[states.length - 1] = SOLVED_STATE
  exploredStates: Map<string, ExploredNodeInfo>
  exploredEdges: ExploredEdgeInfo[]
  durationMs: number
  isOptimal: boolean
}

// Invert and simplify a move sequence
export function invertSequence(moves: MoveName[]): MoveName[] {
  const inverted: MoveName[] = []
  for (let i = moves.length - 1; i >= 0; i--) {
    inverted.push(INVERSE_MOVES[moves[i]])
  }
  return simplifyMoveSequence(inverted)
}

// Simplify redundant adjacent moves like R R' -> none, R R R -> R', U U -> U2, etc.
export function simplifyMoveSequence(moves: MoveName[]): MoveName[] {
  const res: MoveName[] = []
  for (const m of moves) {
    if (res.length === 0) {
      res.push(m)
      continue
    }
    const last = res[res.length - 1]
    const lastBase = last[0]
    const curBase = m[0]

    if (lastBase === curBase) {
      // Same face - compute net quarter turns
      const getTurns = (move: MoveName): number => {
        if (move.endsWith('2')) return 2
        if (move.endsWith("'")) return 3
        return 1
      }
      const netTurns = (getTurns(last) + getTurns(m)) % 4
      res.pop() // remove last
      if (netTurns === 1) res.push(lastBase as MoveName)
      else if (netTurns === 2) res.push(`${lastBase}2` as MoveName)
      else if (netTurns === 3) res.push(`${lastBase}'` as MoveName)
    } else {
      res.push(m)
    }
  }
  return res
}

// Optimal Bi-Directional BFS Solver
export function solveBidirectionalBFS(
  startState: string,
  generators: MoveName[] = ['U', "U'", 'D', "D'", 'R', "R'", 'L', "L'", 'F', "F'", 'B', "B'"],
  maxDepth: number = 7
): SolveResult | null {
  const startTime = performance.now()

  if (startState === SOLVED_STATE) {
    const explored = new Map<string, ExploredNodeInfo>()
    explored.set(SOLVED_STATE, {
      state: SOLVED_STATE,
      depth: 0,
      parent: null,
      move: null,
      direction: 'forward',
    })
    return {
      path: [],
      states: [SOLVED_STATE],
      exploredStates: explored,
      exploredEdges: [],
      durationMs: performance.now() - startTime,
      isOptimal: true,
    }
  }

  const forwardVisited = new Map<string, ExploredNodeInfo>()
  const backwardVisited = new Map<string, ExploredNodeInfo>()
  const rawEdges: { source: string; target: string; move: MoveName }[] = []

  forwardVisited.set(startState, {
    state: startState,
    depth: 0,
    parent: null,
    move: null,
    direction: 'forward',
  })

  backwardVisited.set(SOLVED_STATE, {
    state: SOLVED_STATE,
    depth: 0,
    parent: null,
    move: null,
    direction: 'backward',
  })

  let forwardFrontier = [startState]
  let backwardFrontier = [SOLVED_STATE]
  let meetingState: string | null = null
  let currentDepth = 0

  while (
    forwardFrontier.length > 0 &&
    backwardFrontier.length > 0 &&
    currentDepth < maxDepth
  ) {
    currentDepth++

    // 1. Expand forward frontier
    const nextForward: string[] = []
    for (const state of forwardFrontier) {
      for (const m of generators) {
        const next = applyMove(state, m)
        rawEdges.push({ source: state, target: next, move: m })

        if (backwardVisited.has(next)) {
          forwardVisited.set(next, {
            state: next,
            depth: currentDepth,
            parent: state,
            move: m,
            direction: 'forward',
          })
          meetingState = next
          break
        }

        if (!forwardVisited.has(next)) {
          forwardVisited.set(next, {
            state: next,
            depth: currentDepth,
            parent: state,
            move: m,
            direction: 'forward',
          })
          nextForward.push(next)
        }
      }
      if (meetingState) break
    }
    if (meetingState) break
    forwardFrontier = nextForward

    // 2. Expand backward frontier
    const nextBackward: string[] = []
    for (const state of backwardFrontier) {
      for (const m of generators) {
        const invM = INVERSE_MOVES[m]
        const prev = applyMove(state, invM)
        rawEdges.push({ source: prev, target: state, move: m })

        if (forwardVisited.has(prev)) {
          backwardVisited.set(prev, {
            state: prev,
            depth: currentDepth,
            parent: state,
            move: m,
            direction: 'backward',
          })
          meetingState = prev
          break
        }

        if (!backwardVisited.has(prev)) {
          backwardVisited.set(prev, {
            state: prev,
            depth: currentDepth,
            parent: state,
            move: m,
            direction: 'backward',
          })
          nextBackward.push(prev)
        }
      }
      if (meetingState) break
    }
    if (meetingState) break
    backwardFrontier = nextBackward
  }

  if (!meetingState) {
    return null
  }

  // Reconstruct path
  const forwardPath: MoveName[] = []
  let curr = meetingState
  while (curr !== startState) {
    const node = forwardVisited.get(curr)!
    forwardPath.unshift(node.move!)
    curr = node.parent!
  }

  const backwardPath: MoveName[] = []
  curr = meetingState
  while (curr !== SOLVED_STATE) {
    const node = backwardVisited.get(curr)!
    backwardPath.push(node.move!)
    curr = node.parent!
  }

  const fullPath = [...forwardPath, ...backwardPath]

  // Construct state sequence
  const states: string[] = [startState]
  let stateTrack = startState
  for (const m of fullPath) {
    stateTrack = applyMove(stateTrack, m)
    states.push(stateTrack)
  }

  // Combine explored maps
  const allExplored = new Map<string, ExploredNodeInfo>()
  for (const [k, v] of forwardVisited.entries()) allExplored.set(k, v)
  for (const [k, v] of backwardVisited.entries()) {
    if (!allExplored.has(k)) allExplored.set(k, v)
  }

  // Identify path edges
  const pathEdgeSet = new Set<string>()
  for (let i = 0; i < states.length - 1; i++) {
    pathEdgeSet.add(`${states[i]}->${states[i + 1]}`)
  }

  const processedEdgeKeys = new Set<string>()
  const exploredEdges: ExploredEdgeInfo[] = []

  for (const e of rawEdges) {
    if (allExplored.has(e.source) && allExplored.has(e.target)) {
      const edgeKey = `${e.source}->${e.target}:${e.move}`
      if (!processedEdgeKeys.has(edgeKey)) {
        processedEdgeKeys.add(edgeKey)
        const isPath = pathEdgeSet.has(`${e.source}->${e.target}`)
        exploredEdges.push({
          source: e.source,
          target: e.target,
          move: e.move,
          isPathEdge: isPath,
        })
      }
    }
  }

  const durationMs = performance.now() - startTime

  return {
    path: fullPath,
    states,
    exploredStates: allExplored,
    exploredEdges,
    durationMs,
    isOptimal: true,
  }
}

// Master solve function:
// Tries optimal BFS first; if scramble is too deep or known history exists, falls back gracefully
export function solveCube({
  currentState,
  scrambleHistory = [],
  generatorSet,
  maxBFSdepth = 7,
}: {
  currentState: string
  scrambleHistory?: MoveName[]
  generatorSet?: MoveName[]
  maxBFSdepth?: number
}): SolveResult {
  const startTime = performance.now()

  if (currentState === SOLVED_STATE) {
    const explored = new Map<string, ExploredNodeInfo>()
    explored.set(SOLVED_STATE, {
      state: SOLVED_STATE,
      depth: 0,
      parent: null,
      move: null,
      direction: 'forward',
    })
    return {
      path: [],
      states: [SOLVED_STATE],
      exploredStates: explored,
      exploredEdges: [],
      durationMs: 0,
      isOptimal: true,
    }
  }

  const gens =
    generatorSet ||
    (GENERATOR_PRESETS.find((p) => p.id === 'QTM_ALL')?.generators ?? [
      'U', "U'", 'D', "D'", 'R', "R'", 'L', "L'", 'F', "F'", 'B', "B'",
    ])

  // Try optimal Bi-directional BFS
  const bfsResult = solveBidirectionalBFS(currentState, gens, maxBFSdepth)
  if (bfsResult) {
    return bfsResult
  }

  // If BFS didn't find within depth limit, check if we have a known scramble history
  let fallbackPath: MoveName[] = []
  if (scrambleHistory && scrambleHistory.length > 0) {
    fallbackPath = invertSequence(scrambleHistory)
  } else {
    // Try Kociemba solver from cube-solver if available
    try {
      const solutionStr = cubeSolver.solve(currentState, 'kociemba') as string
      if (solutionStr && typeof solutionStr === 'string') {
        fallbackPath = solutionStr.trim().split(/\s+/) as MoveName[]
      }
    } catch {
      // If cube-solver throws or fails, fallback to empty
      fallbackPath = []
    }
  }

  // Build the state sequence for the fallback path
  const states: string[] = [currentState]
  let tracker = currentState
  const explored = new Map<string, ExploredNodeInfo>()
  const edges: ExploredEdgeInfo[] = []

  explored.set(currentState, {
    state: currentState,
    depth: 0,
    parent: null,
    move: null,
    direction: 'forward',
  })

  for (let i = 0; i < fallbackPath.length; i++) {
    const m = fallbackPath[i]
    const nextState = applyMove(tracker, m)
    states.push(nextState)

    explored.set(nextState, {
      state: nextState,
      depth: i + 1,
      parent: tracker,
      move: m,
      direction: 'forward',
    })

    edges.push({
      source: tracker,
      target: nextState,
      move: m,
      isPathEdge: true,
    })

    tracker = nextState
  }

  return {
    path: fallbackPath,
    states,
    exploredStates: explored,
    exploredEdges: edges,
    durationMs: performance.now() - startTime,
    isOptimal: false,
  }
}
