import React, { useMemo, useCallback, useEffect } from 'react'
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
import { SolutionNode } from './SolutionNode'
import { buildCayleyGraph, type CayleyNodeData } from '@/engine/cayley'
import { buildSolutionGraph, type SolutionNodeData } from '@/engine/solutionGraph'
import { useCubeStore } from '@/store/cubeStore'
import { Network, Route, Sparkles, Navigation } from 'lucide-react'

const nodeTypes = {
  cayleyNode: CayleyNode,
  solutionNode: SolutionNode,
}

export const CayleyGraph: React.FC = () => {
  const currentState = useCubeStore((s) => s.currentState)
  const solveResult = useCubeStore((s) => s.solveResult)
  const currentStepIndex = useCubeStore((s) => s.currentStepIndex)
  const viewMode = useCubeStore((s) => s.viewMode)
  const depth = useCubeStore((s) => s.depth)
  const setViewMode = useCubeStore((s) => s.setViewMode)
  const setStep = useCubeStore((s) => s.setStep)
  const setCurrentState = useCubeStore((s) => s.setCurrentState)
  const getActivePreset = useCubeStore((s) => s.getActivePreset)

  const activePreset = getActivePreset()

  // 1. Solution Path Graph
  const solutionGraphData = useMemo(() => {
    if (!solveResult || solveResult.path.length === 0) return null
    return buildSolutionGraph({
      solveResult,
      currentStepIndex,
      viewMode: 'pathWithBranches',
    })
  }, [solveResult, currentStepIndex])

  // 2. Local Cayley Graph
  const localCayleyData = useMemo(() => {
    return buildCayleyGraph({
      centerState: currentState,
      generators: activePreset.generators,
      maxDepth: depth,
      maxNodes: 120,
    })
  }, [currentState, activePreset.generators, depth])

  // Choose which graph to display
  const activeGraph = useMemo(() => {
    if (viewMode === 'solutionPath' && solutionGraphData) {
      return {
        nodes: solutionGraphData.nodes,
        edges: solutionGraphData.edges,
        isSolutionView: true,
      }
    }
    return {
      nodes: localCayleyData.nodes,
      edges: localCayleyData.edges,
      isSolutionView: false,
    }
  }, [viewMode, solutionGraphData, localCayleyData])

  const [nodes, setNodes, onNodesChange] = useNodesState<
    Node<CayleyNodeData | SolutionNodeData>
  >(activeGraph.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(activeGraph.edges)

  // Keep React Flow internal state in sync with computed graph
  useEffect(() => {
    setNodes(activeGraph.nodes)
    setEdges(activeGraph.edges)
  }, [activeGraph.nodes, activeGraph.edges, setNodes, setEdges])

  // Handle clicking on nodes
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (activeGraph.isSolutionView) {
        const data = node.data as unknown as SolutionNodeData
        if (data && typeof data.stepIndex === 'number' && data.stepIndex >= 0) {
          setStep(data.stepIndex)
        } else if (data?.state) {
          setCurrentState(data.state)
        }
      } else {
        const data = node.data as unknown as CayleyNodeData
        if (data?.state && data.state !== currentState) {
          setCurrentState(data.state)
        }
      }
    },
    [activeGraph.isSolutionView, currentState, setCurrentState, setStep]
  )

  const hasSolution = Boolean(solveResult && solveResult.path.length > 0)

  return (
    <div className="relative h-full w-full bg-white">
      {/* Top Floating Controls & View Mode Toggle */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-auto">
        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex rounded-lg bg-white/95 p-1 border border-slate-200/90 shadow-xs backdrop-blur-sm">
            <button
              onClick={() => setViewMode('solutionPath')}
              disabled={!hasSolution}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                viewMode === 'solutionPath' && hasSolution
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
              title={hasSolution ? 'View the path from Initial to Solved' : 'Randomize cube first to generate solution path'}
            >
              <Route className="h-3.5 w-3.5" />
              Solution Path Graph
            </button>

            <button
              onClick={() => setViewMode('cayleyLocal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                viewMode === 'cayleyLocal' || !hasSolution
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Network className="h-3.5 w-3.5" />
              Cayley Neighborhood
            </button>
          </div>
        </div>

        {/* Info stats badge */}
        <div className="flex items-center gap-2">
          {activeGraph.isSolutionView ? (
            <span className="flex items-center gap-1 rounded-md bg-white/95 border border-slate-200 px-2.5 py-1 text-xs text-slate-700 font-medium shadow-2xs">
              <Sparkles className="h-3 w-3 text-emerald-600" />
              Path Length: <strong className="font-mono text-indigo-600">{solveResult?.path.length}</strong> moves
              <span className="text-slate-300">|</span>
              <span className="text-slate-500 font-mono text-[11px]">
                {solveResult?.states.length} states on trajectory
              </span>
            </span>
          ) : (
            <span className="flex items-center gap-1 rounded-md bg-white/95 border border-slate-200 px-2.5 py-1 text-xs text-slate-700 font-medium shadow-2xs">
              <Navigation className="h-3 w-3 text-indigo-600" />
              Neighborhood: <strong className="font-mono text-slate-900">{localCayleyData.totalStatesFound}</strong> states
              {localCayleyData.cyclesDetected > 0 && (
                <span className="ml-1 text-emerald-600 font-mono text-[11px]">
                  ({localCayleyData.cyclesDetected} cycles)
                </span>
              )}
            </span>
          )}
        </div>
      </div>

      {/* Bottom Hint */}
      <div className="absolute bottom-4 left-4 z-10 text-[11px] text-slate-500 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs pointer-events-none">
        💡 {activeGraph.isSolutionView
          ? 'Click any node along the path to scrub the 3D cube to that step'
          : 'Click any node to navigate the 3D cube to that state'}
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.12}
        maxZoom={1.6}
        className="bg-white"
      >
        <Background color="#cbd5e1" gap={20} size={1} />
        <Controls className="bg-white! border-slate-200! shadow-xs! rounded-lg overflow-hidden" />
        <MiniMap
          nodeColor={(n) => {
            const d = n.data as Record<string, unknown>
            if (d?.isStart) return '#d97706'
            if (d?.isGoal) return '#10b981'
            if (d?.isActive) return '#4f46e5'
            if (d?.isCenter) return '#4f46e5'
            return '#cbd5e1'
          }}
          className="border border-slate-200! rounded-lg overflow-hidden bg-slate-50!"
          zoomable
          pannable
        />
      </ReactFlow>
    </div>
  )
}
