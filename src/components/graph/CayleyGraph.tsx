import React, { useMemo, useCallback } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
} from '@xyflow/react'
import { CayleyNode } from './CayleyNode'
import { buildCayleyGraph, type CayleyNodeData } from '@/engine/cayley'
import { useCubeStore } from '@/store/cubeStore'
import { Network, Repeat } from 'lucide-react'

const nodeTypes = {
  cayleyNode: CayleyNode,
}

export const CayleyGraph: React.FC = () => {
  const currentState = useCubeStore((s) => s.currentState)
  const depth = useCubeStore((s) => s.depth)
  const getActivePreset = useCubeStore((s) => s.getActivePreset)
  const setCurrentState = useCubeStore((s) => s.setCurrentState)

  const activePreset = getActivePreset()

  // Build the local Cayley graph whenever state, generators, or depth changes
  const { nodes: initialNodes, edges: initialEdges, totalStatesFound, cyclesDetected } =
    useMemo(() => {
      return buildCayleyGraph({
        centerState: currentState,
        generators: activePreset.generators,
        maxDepth: depth,
        maxNodes: 120,
      })
    }, [currentState, activePreset.generators, depth])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // Sync state when new graph is generated
  React.useEffect(() => {
    setNodes(initialNodes)
    setEdges(initialEdges)
  }, [initialNodes, initialEdges, setNodes, setEdges])

  // When clicking on a node, navigate to that state
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const data = node.data as unknown as CayleyNodeData
      if (data && data.state && data.state !== currentState) {
        setCurrentState(data.state)
      }
    },
    [currentState, setCurrentState]
  )

  return (
    <div className="relative h-full w-full bg-white">
      {/* Overlay badges */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-none">
        <div className="flex items-center gap-2 rounded-lg bg-white/95 px-3 py-1.5 text-xs border border-slate-200/90 backdrop-blur-sm shadow-xs text-slate-700 font-medium">
          <Network className="h-3.5 w-3.5 text-indigo-600" />
          <span>Cayley Graph: <strong className="text-slate-900">{activePreset.name}</strong></span>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-md bg-white/95 border border-slate-200 px-2 py-0.5 text-[11px] text-slate-600 font-mono shadow-2xs">
            {totalStatesFound} states in neighborhood
          </span>
          {cyclesDetected > 0 && (
            <span className="flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] text-emerald-700 font-medium shadow-2xs">
              <Repeat className="h-3 w-3" /> {cyclesDetected} cycles / loops
            </span>
          )}
        </div>
      </div>

      <div className="absolute bottom-4 left-4 z-10 text-[11px] text-slate-400 bg-white/90 px-2 py-1 rounded border border-slate-200 pointer-events-none">
        💡 Click any node to navigate the 3D cube to that state
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        minZoom={0.15}
        maxZoom={1.8}
        className="bg-white"
      >
        <Background color="#cbd5e1" gap={20} size={1} />
        <Controls className="bg-white! border-slate-200! shadow-xs! rounded-lg overflow-hidden" />
        <MiniMap
          nodeColor={(n) => {
            const d = n.data as unknown as CayleyNodeData
            return d?.isCenter ? '#4f46e5' : d?.isSolved ? '#10b981' : '#cbd5e1'
          }}
          className="border border-slate-200! rounded-lg overflow-hidden bg-slate-50!"
          zoomable
          pannable
        />
      </ReactFlow>
    </div>
  )
}
