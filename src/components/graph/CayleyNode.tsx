import React, { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import { CubeNet } from './CubeNet'
import type { CayleyNodeData } from '@/engine/cayley'
import { CheckCircle2, Navigation } from 'lucide-react'

export const CayleyNode: React.FC<NodeProps> = memo(({ data, selected }) => {
  const nodeData = data as unknown as CayleyNodeData
  const { state, depth, isCenter, isSolved, labelMove, pathFromCenter } = nodeData

  const pathString = pathFromCenter && pathFromCenter.length > 0 ? pathFromCenter.join(' ') : 'Origin'

  return (
    <div
      className={`relative flex flex-col items-center rounded-xl p-2.5 transition-all duration-200 cursor-pointer ${
        isCenter
          ? 'bg-indigo-50/90 border-2 border-indigo-600 shadow-md ring-4 ring-indigo-500/20'
          : isSolved
          ? 'bg-emerald-50/90 border-2 border-emerald-600 shadow-sm'
          : selected
          ? 'bg-white border-2 border-indigo-500 shadow-md'
          : 'bg-white border border-slate-200 hover:border-slate-400 shadow-xs'
      }`}
      style={{ minWidth: '120px' }}
    >
      {/* Handles on 4 sides for clean multi-directional graph connections */}
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

      {/* Top Header Badge */}
      <div className="flex w-full items-center justify-between gap-1 mb-1.5">
        {isCenter ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-semibold text-white">
            <Navigation className="h-2.5 w-2.5 fill-current" /> Active
          </span>
        ) : isSolved ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white">
            <CheckCircle2 className="h-2.5 w-2.5" /> Solved
          </span>
        ) : (
          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-600">
            d = {depth}
          </span>
        )}

        {labelMove && (
          <span className="rounded-md bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold font-mono text-indigo-700">
            {labelMove}
          </span>
        )}
      </div>

      {/* Mini Cube Net visualization */}
      <div className="my-1 py-1 px-2 rounded-md bg-slate-50/80 border border-slate-100 flex items-center justify-center">
        <CubeNet state={state} size={4.5} />
      </div>

      {/* Bottom Path Label */}
      <div className="mt-1 w-full text-center">
        <div
          className="text-[10px] font-mono text-slate-500 truncate max-w-[110px]"
          title={`Path: ${pathString}`}
        >
          {pathString}
        </div>
      </div>
    </div>
  )
})

CayleyNode.displayName = 'CayleyNode'
