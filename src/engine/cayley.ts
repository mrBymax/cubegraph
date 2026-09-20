import { applyMove, isSolved, type MoveName, MOVE_COLORS } from './cube'
import type { Node, Edge } from '@xyflow/react'

export interface CayleyNodeData {
  state: string
  depth: number
  pathFromCenter: MoveName[]
  isCenter: boolean
  isSolved: boolean
  labelMove?: MoveName
  [key: string]: unknown
}

export interface BuildCayleyOptions {
  centerState: string
  generators: MoveName[]
  maxDepth: number
  maxNodes?: number
}

export interface CayleyGraphResult {
  nodes: Node<CayleyNodeData>[]
  edges: Edge[]
  totalStatesFound: number
  cyclesDetected: number
}

export function buildCayleyGraph({
  centerState,
  generators,
  maxDepth,
  maxNodes = 90,
}: BuildCayleyOptions): CayleyGraphResult {
  // BFS exploration
  interface QueueItem {
    state: string
    depth: number
    path: MoveName[]
    parentState?: string
    lastMove?: MoveName
  }

  const visitedMap = new Map<
    string,
    {
      id: string
      state: string
      depth: number
      path: MoveName[]
      lastMove?: MoveName
      parentState?: string
    }
  >()

  const edgesList: {
    source: string
    target: string
    move: MoveName
  }[] = []

  let nextId = 0

  // Initialize center
  const centerId = `node-${nextId++}`
  visitedMap.set(centerState, {
    id: centerId,
    state: centerState,
    depth: 0,
    path: [],
  })

  const queue: QueueItem[] = [
    {
      state: centerState,
      depth: 0,
      path: [],
    },
  ]

  let cyclesDetected = 0
  const processedEdges = new Set<string>()

  while (queue.length > 0) {
    const current = queue.shift()!
    if (current.depth >= maxDepth) continue

    for (const move of generators) {
      const nextState = applyMove(current.state, move)
      const currentId = visitedMap.get(current.state)!.id

      if (visitedMap.has(nextState)) {
        // Node already visited -> this is a cycle or alternative path!
        const existingNode = visitedMap.get(nextState)!
        const edgeKey = `${currentId}->${existingNode.id}:${move}`
        if (!processedEdges.has(edgeKey)) {
          processedEdges.add(edgeKey)
          edgesList.push({
            source: currentId,
            target: existingNode.id,
            move,
          })
          cyclesDetected++
        }
      } else {
        // New node discovered
        if (visitedMap.size >= maxNodes) {
          continue
        }

        const newId = `node-${nextId++}`
        const newPath = [...current.path, move]
        visitedMap.set(nextState, {
          id: newId,
          state: nextState,
          depth: current.depth + 1,
          path: newPath,
          lastMove: move,
          parentState: current.state,
        })

        const edgeKey = `${currentId}->${newId}:${move}`
        processedEdges.add(edgeKey)
        edgesList.push({
          source: currentId,
          target: newId,
          move,
        })

        queue.push({
          state: nextState,
          depth: current.depth + 1,
          path: newPath,
          parentState: current.state,
          lastMove: move,
        })
      }
    }
  }

  // Compute Layout: Concentric Radial layout around Center (0, 0)
  // Group nodes by depth
  const depthGroups = new Map<number, string[]>()
  for (const [state, info] of visitedMap.entries()) {
    const d = info.depth
    if (!depthGroups.has(d)) depthGroups.set(d, [])
    depthGroups.get(d)!.push(state)
  }

  const positions = new Map<string, { x: number; y: number }>()
  const nodeAngles = new Map<string, number>()

  // Depth 0: center
  positions.set(centerState, { x: 0, y: 0 })
  nodeAngles.set(centerState, 0)

  // Depth 1
  const depth1States = depthGroups.get(1) || []
  const r1 = Math.max(260, depth1States.length * 35)
  depth1States.forEach((state, idx) => {
    const angle = (2 * Math.PI * idx) / depth1States.length - Math.PI / 2
    nodeAngles.set(state, angle)
    positions.set(state, {
      x: Math.round(r1 * Math.cos(angle)),
      y: Math.round(r1 * Math.sin(angle)),
    })
  })

  // Higher depths: place near parent's angle to minimize crossing lines
  for (let d = 2; d <= maxDepth; d++) {
    const statesAtD = depthGroups.get(d) || []
    if (statesAtD.length === 0) continue

    const rd = r1 + (d - 1) * 280

    // Group by parent
    const parentGroups = new Map<string, string[]>()
    for (const st of statesAtD) {
      const p = visitedMap.get(st)?.parentState || centerState
      if (!parentGroups.has(p)) parentGroups.set(p, [])
      parentGroups.get(p)!.push(st)
    }

    // Allocate angular slice around parent's angle
    const parentCount = parentGroups.size
    let pIdx = 0

    for (const [parent, children] of parentGroups.entries()) {
      const parentAngle = nodeAngles.get(parent) ?? (2 * Math.PI * pIdx) / parentCount
      const spread = (2 * Math.PI) / (parentCount * 1.5)
      const startAngle = parentAngle - spread / 2

      children.forEach((cState, cIdx) => {
        const cAngle =
          children.length === 1
            ? parentAngle
            : startAngle + (spread * cIdx) / (children.length - 1)
        nodeAngles.set(cState, cAngle)
        positions.set(cState, {
          x: Math.round(rd * Math.cos(cAngle)),
          y: Math.round(rd * Math.sin(cAngle)),
        })
      })
      pIdx++
    }
  }

  // Convert to React Flow Nodes
  const nodes: Node<CayleyNodeData>[] = []
  for (const [state, info] of visitedMap.entries()) {
    const pos = positions.get(state) || { x: 0, y: 0 }
    const isCenter = state === centerState
    const solved = isSolved(state)

    nodes.push({
      id: info.id,
      type: 'cayleyNode',
      position: pos,
      data: {
        state,
        depth: info.depth,
        pathFromCenter: info.path,
        isCenter,
        isSolved: solved,
        labelMove: info.lastMove,
      },
    })
  }

  // Convert to React Flow Edges
  const edges: Edge[] = edgesList.map((e, idx) => {
    const moveColor = MOVE_COLORS[e.move] || '#6366f1'
    return {
      id: `edge-${idx}-${e.source}-${e.target}`,
      source: e.source,
      target: e.target,
      label: e.move,
      animated: false,
      style: {
        stroke: moveColor,
        strokeWidth: 2,
      },
      labelStyle: {
        fill: '#1e293b',
        fontWeight: 600,
        fontSize: 11,
      },
      labelBgStyle: {
        fill: '#ffffff',
        fillOpacity: 0.9,
        rx: 4,
        ry: 4,
      },
      labelBgPadding: [4, 2] as [number, number],
      markerEnd: {
        type: 'arrowclosed' as const,
        color: moveColor,
        width: 14,
        height: 14,
      },
    }
  })

  return {
    nodes,
    edges,
    totalStatesFound: visitedMap.size,
    cyclesDetected,
  }
}
