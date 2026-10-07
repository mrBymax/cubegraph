import type { Node, Edge } from '@xyflow/react'
import type { MoveName } from './cube'
import type { SolveResult } from './solver'
import { MOVE_COLORS } from './cube'

export interface SolutionNodeData {
  state: string
  stepIndex: number // -1 if non-path explored node, 0 for start, 1..N for path steps
  isStart: boolean
  isGoal: boolean
  isPathNode: boolean
  isActive: boolean
  isCompleted: boolean
  moveApplied: MoveName | null
  totalSteps: number
  depth: number
  [key: string]: unknown
}

export interface BuildSolutionGraphParams {
  solveResult: SolveResult
  currentStepIndex: number // 0 to solveResult.states.length - 1
  viewMode?: 'pathWithBranches' | 'searchTree'
  maxBranchingNodes?: number
}

export function buildSolutionGraph({
  solveResult,
  currentStepIndex,
  viewMode = 'pathWithBranches',
  maxBranchingNodes = 40,
}: BuildSolutionGraphParams): {
  nodes: Node<SolutionNodeData>[]
  edges: Edge[]
} {
  const { states: pathStates, path, exploredStates, exploredEdges } = solveResult
  const totalSteps = path.length

  // Map state string to node ID
  const stateToId = new Map<string, string>()
  const pathStateSet = new Set(pathStates)

  // Assign IDs to path states: node-path-0, node-path-1, ...
  pathStates.forEach((state, idx) => {
    stateToId.set(state, `node-path-${idx}`)
  })

  // Assign IDs to branch/explored states
  let branchCounter = 0
  for (const state of exploredStates.keys()) {
    if (!stateToId.has(state)) {
      if (branchCounter < maxBranchingNodes) {
        stateToId.set(state, `node-branch-${branchCounter++}`)
      }
    }
  }

  const nodes: Node<SolutionNodeData>[] = []
  const nodePositions = new Map<string, { x: number; y: number }>()

  if (viewMode === 'pathWithBranches') {
    // 1. Position path nodes along a linear or gentle serpentine corridor
    const SPACING_X = 220
    const SPACING_Y = 200
    const MAX_PER_ROW = 8

    pathStates.forEach((state, idx) => {
      let x = idx * SPACING_X
      let y = 0

      // If more than 8 steps, snake rows for comfortable viewing
      if (pathStates.length > MAX_PER_ROW) {
        const row = Math.floor(idx / MAX_PER_ROW)
        const col = idx % MAX_PER_ROW
        const isOddRow = row % 2 === 1
        x = (isOddRow ? MAX_PER_ROW - 1 - col : col) * SPACING_X
        y = row * SPACING_Y
      }

      nodePositions.set(state, { x, y })
    })

    // 2. Position non-path branch nodes around their parent on the path
    const branchCountsPerParent = new Map<string, number>()
    for (const [state, info] of exploredStates.entries()) {
      if (pathStateSet.has(state) || !stateToId.has(state)) continue

      const parentState = info.parent
      if (parentState && nodePositions.has(parentState)) {
        const parentPos = nodePositions.get(parentState)!
        const count = branchCountsPerParent.get(parentState) || 0
        branchCountsPerParent.set(parentState, count + 1)

        // Alternate above and below
        const side = count % 2 === 0 ? -1 : 1
        const offsetRank = Math.floor(count / 2) + 1
        const bx = parentPos.x + (side === -1 ? -40 : 40)
        const by = parentPos.y + side * (140 + (offsetRank - 1) * 80)

        nodePositions.set(state, { x: Math.round(bx), y: Math.round(by) })
      } else {
        nodePositions.set(state, { x: 0, y: -200 })
      }
    }
  } else {
    // Search Tree / Concentric or Left-to-Right layout
    // Start on left, Solved on right
    pathStates.forEach((state, idx) => {
      nodePositions.set(state, {
        x: idx * 260,
        y: 0,
      })
    })

    for (const [state, info] of exploredStates.entries()) {
      if (!pathStateSet.has(state) && stateToId.has(state)) {
        const parentPos = (info.parent && nodePositions.get(info.parent)) || { x: 0, y: 0 }
        const dy = (info.depth % 2 === 0 ? 1 : -1) * (info.depth * 90)
        nodePositions.set(state, {
          x: parentPos.x + 80,
          y: parentPos.y + dy,
        })
      }
    }
  }

  // Build React Flow Nodes
  for (const [state, id] of stateToId.entries()) {
    const isPathNode = pathStateSet.has(state)
    const stepIdx = isPathNode ? pathStates.indexOf(state) : -1
    const isStart = stepIdx === 0
    const isGoal = isPathNode && stepIdx === pathStates.length - 1
    const isActive = stepIdx === currentStepIndex
    const isCompleted = isPathNode && stepIdx <= currentStepIndex

    const info = exploredStates.get(state)
    const moveApplied =
      isPathNode && stepIdx > 0
        ? path[stepIdx - 1]
        : info?.move || null

    const pos = nodePositions.get(state) || { x: 0, y: 0 }

    nodes.push({
      id,
      type: 'solutionNode',
      position: pos,
      data: {
        state,
        stepIndex: stepIdx,
        isStart,
        isGoal,
        isPathNode,
        isActive,
        isCompleted,
        moveApplied,
        totalSteps,
        depth: info?.depth || 0,
      },
    })
  }

  // Build React Flow Edges
  const edges: Edge[] = []
  const edgeSet = new Set<string>()

  // 1. Solution Path Edges (high priority, highlighted)
  for (let i = 0; i < pathStates.length - 1; i++) {
    const sourceState = pathStates[i]
    const targetState = pathStates[i + 1]
    const sourceId = stateToId.get(sourceState)!
    const targetId = stateToId.get(targetState)!
    const move = path[i]
    const edgeKey = `${sourceId}->${targetId}`
    edgeSet.add(edgeKey)

    const isEdgeActive = i === currentStepIndex - 1 // the move that just got applied
    const isEdgeCompleted = i < currentStepIndex
    const isEdgeNext = i === currentStepIndex // upcoming move

    const moveColor = MOVE_COLORS[move] || '#4f46e5'

    edges.push({
      id: `path-edge-${i}`,
      source: sourceId,
      target: targetId,
      label: `${i + 1}: ${move}`,
      animated: isEdgeNext || isEdgeActive,
      style: {
        stroke: isEdgeActive
          ? '#4f46e5'
          : isEdgeCompleted
          ? '#10b981'
          : moveColor,
        strokeWidth: isEdgeActive ? 4 : isEdgeCompleted ? 3 : 2.5,
      },
      labelStyle: {
        fill: isEdgeActive ? '#4f46e5' : isEdgeCompleted ? '#059669' : '#334155',
        fontWeight: 700,
        fontSize: 11,
      },
      labelBgStyle: {
        fill: '#ffffff',
        fillOpacity: 0.95,
        stroke: isEdgeActive ? '#818cf8' : '#cbd5e1',
        strokeWidth: 1,
        rx: 4,
        ry: 4,
      },
      labelBgPadding: [6, 2],
      markerEnd: {
        type: 'arrowclosed',
        color: isEdgeActive ? '#4f46e5' : isEdgeCompleted ? '#10b981' : '#64748b',
        width: 14,
        height: 14,
      },
      zIndex: 10,
    })
  }

  // 2. Explored Side Branch Edges (subtle, light gray)
  for (const e of exploredEdges) {
    if (stateToId.has(e.source) && stateToId.has(e.target)) {
      const sourceId = stateToId.get(e.source)!
      const targetId = stateToId.get(e.target)!
      const edgeKey = `${sourceId}->${targetId}`

      if (!edgeSet.has(edgeKey)) {
        edgeSet.add(edgeKey)
        edges.push({
          id: `branch-edge-${edges.length}`,
          source: sourceId,
          target: targetId,
          label: e.move,
          animated: false,
          style: {
            stroke: '#cbd5e1',
            strokeWidth: 1,
            strokeDasharray: '4,4',
          },
          labelStyle: {
            fill: '#94a3b8',
            fontSize: 9,
            fontWeight: 500,
          },
          labelBgStyle: {
            fill: '#f8fafc',
            fillOpacity: 0.8,
            rx: 2,
            ry: 2,
          },
          labelBgPadding: [2, 1],
          markerEnd: {
            type: 'arrowclosed',
            color: '#cbd5e1',
            width: 10,
            height: 10,
          },
          zIndex: 1,
        })
      }
    }
  }

  return { nodes, edges }
}
