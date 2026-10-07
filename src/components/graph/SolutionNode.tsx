import React, { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import { CubeNet } from './CubeNet'
import type { SolutionNodeData } from '@/engine/solutionGraph'
import { CheckCircle2, Play, Sparkles, Flag, ArrowRight } from 'lucide-react'

export const SolutionNode: React.FC<NodeProps> = memo(({ data, selected }) => {
  const nodeData = data as unknown as SolutionNodeData
  const {
    state,
    stepIndex,
    isStart,
    isGoal,
    isPathNode,
    isActive,
    isCompleted,
    moveApplied,
    totalSteps,
  } = nodeData

  let containerClasses =
    'relative flex flex-col items-center rounded-xl p-2.5 transition-all duration-200 cursor-pointer min-w-[130px] '

  if (isActive) {
    containerClasses +=
      'bg-indigo-50/95 border-2 border-indigo-600 shadow-lg ring-4 ring-indigo-500/25 scale-105 z-20'
  } else if (isStart) {
    containerClasses +=
      'bg-amber-50/90 border-2 border-amber-500 shadow-sm hover:shadow-md'
  } else if (isGoal) {
    containerClasses +=
      'bg-emerald-50/90 border-2 border-emerald-600 shadow-sm hover:shadow-md'
  } else if (isPathNode) {
    if (isCompleted) {
      containerClasses +=
        'bg-white border-2 border-emerald-400/80 shadow-xs hover:shadow-sm'
    } else {
      containerClasses +=
        'bg-white border border-slate-300 shadow-2xs hover:border-slate-400'
    }
  } else {
    // Non-path explored branch node
    containerClasses +=
      'bg-slate-50/80 border border-dashed border-slate-300 opacity-75 hover:opacity-100 hover:border-slate-400'
  }

  if (selected) {
    containerClasses += ' ring-2 ring-indigo-400'
  }

  return (
    <div className={containerClasses}>
      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="l"
        className="opacity-0 w-2 h-2"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="r"
        className="opacity-0 w-2 h-2"
      />
      <Handle
        type="target"
        position={Position.Top}
        id="t"
        className="opacity-0 w-2 h-2"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="b"
        className="opacity-0 w-2 h-2"
      />

      {/* Header Tag */}
      <div className="flex w-full items-center justify-between gap-1 mb-1.5">
        {isStart ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs">
            <Flag className="h-2.5 w-2.5 fill-current" /> START
          </span>
        ) : isGoal ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs">
            <Sparkles className="h-2.5 w-2.5" /> GOAL
          </span>
        ) : isPathNode ? (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              isActive
                ? 'bg-indigo-600 text-white'
                : isCompleted
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {isActive ? (
              <>
                <Play className="h-2.5 w-2.5 fill-current" /> Current
              </>
            ) : isCompleted ? (
              <>
                <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" /> Step {stepIndex}
              </>
            ) : (
              `Step ${stepIndex}/${totalSteps}`
            )}
          </span>
        ) : (
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-mono text-slate-500">
            Explored
          </span>
        )}

        {moveApplied && (
          <span className="flex items-center gap-0.5 rounded-md bg-indigo-50 border border-indigo-200/80 px-1.5 py-0.5 text-[10px] font-mono font-bold text-indigo-700 shadow-2xs">
            <ArrowRight className="h-2.5 w-2.5 text-indigo-400" />
            {moveApplied}
          </span>
        )}
      </div>

      {/* Mini Cube Net */}
      <div className="my-1 py-1 px-1.5 rounded-md bg-white border border-slate-100/80 shadow-2xs flex items-center justify-center">
        <CubeNet state={state} size={4.5} />
      </div>

      {/* Footer Info */}
      <div className="mt-1 w-full text-center">
        <span className="text-[10px] font-mono text-slate-500">
          {isStart ? 'Initial Scramble' : isGoal ? 'Solved Identity (e)' : `Step ${stepIndex}`}
        </span>
      </div>
    </div>
  )
})

SolutionNode.displayName = 'SolutionNode'
