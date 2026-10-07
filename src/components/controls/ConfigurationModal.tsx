import React, { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useCubeStore } from '@/store/cubeStore'
import type { MoveName } from '@/engine/cube'
import { X, Sparkles, Wand2, Check, AlertCircle } from 'lucide-react'

interface PresetConfig {
  name: string
  description: string
  moves: string
}

const PRESET_CONFIGS: PresetConfig[] = [
  {
    name: 'Sexy Move Loop',
    description: 'Classic 4-move trigger (optimal 4-move return)',
    moves: "R U R' U'",
  },
  {
    name: 'Sune Algorithm',
    description: 'Standard OLL algorithm',
    moves: "R U R' U R U2 R'",
  },
  {
    name: 'Checkerboard Pattern',
    description: '180° slice rotations forming alternating faces',
    moves: 'R2 L2 U2 D2 F2 B2',
  },
  {
    name: '2-Generator 6-Cycle',
    description: 'Subgroup ⟨R², U²⟩ closed loop',
    moves: 'R2 U2 R2 U2 R2 U2',
  },
  {
    name: 'Commutator [R, U]',
    description: 'Corner & edge 3-cycle generator',
    moves: "R U R' U' R' F R F'",
  },
  {
    name: 'Double Sexy Move',
    description: '8-move trigger',
    moves: "R U R' U' R U R' U'",
  },
]

export const ConfigurationModal: React.FC<{
  open: boolean
  onOpenChange: (open: boolean) => void
}> = ({ open, onOpenChange }) => {
  const [inputMoves, setInputMoves] = useState("R U R' U'")
  const [error, setError] = useState<string | null>(null)
  const applyCustomConfiguration = useCubeStore((s) => s.applyCustomConfiguration)

  const handleApply = (movesString: string) => {
    setError(null)
    const tokens = movesString
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean)

    if (tokens.length === 0) {
      setError('Please enter at least one move.')
      return
    }

    const validMovesSet = new Set([
      'U', "U'", 'U2',
      'D', "D'", 'D2',
      'R', "R'", 'R2',
      'L', "L'", 'L2',
      'F', "F'", 'F2',
      'B', "B'", 'B2',
    ])

    const invalid = tokens.filter((t) => !validMovesSet.has(t))
    if (invalid.length > 0) {
      setError(`Invalid move token(s): ${invalid.join(', ')}. Valid: U, D, R, L, F, B with optional ' or 2.`)
      return
    }

    applyCustomConfiguration(tokens as MoveName[])
    onOpenChange(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs animate-fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200">
                <Wand2 className="h-4 w-4" />
              </div>
              <div>
                <Dialog.Title className="text-base font-semibold text-slate-900">
                  Custom Cube Configuration
                </Dialog.Title>
                <Dialog.Description className="text-xs text-slate-500">
                  Enter a move sequence to configure the Rubik's cube and trace its solution graph.
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          {/* Move Sequence Input */}
          <div className="my-4">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Scramble Sequence (Singmaster Notation):
            </label>
            <div className="relative">
              <input
                type="text"
                value={inputMoves}
                onChange={(e) => {
                  setInputMoves(e.target.value)
                  setError(null)
                }}
                placeholder="e.g. R U R' U' F2"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-xs"
              />
            </div>
            {error ? (
              <p className="mt-1.5 flex items-center gap-1 text-xs text-rose-600">
                <AlertCircle className="h-3.5 w-3.5" /> {error}
              </p>
            ) : (
              <p className="mt-1.5 text-[11px] text-slate-400">
                Supports standard moves: <code className="font-mono text-slate-600">U, D, R, L, F, B</code> with <code className="font-mono text-slate-600">'</code> (counter-clockwise) or <code className="font-mono text-slate-600">2</code> (180°).
              </p>
            )}
          </div>

          {/* Quick Presets */}
          <div className="mb-5">
            <span className="block text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Or pick a famous pattern:
            </span>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_CONFIGS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => {
                    setInputMoves(preset.moves)
                    handleApply(preset.moves)
                  }}
                  className="flex flex-col text-left p-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-semibold text-slate-800 group-hover:text-indigo-600">
                      {preset.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1 rounded">
                      {preset.moves.split(' ').length}m
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                    {preset.description}
                  </span>
                  <span className="text-[10px] font-mono text-indigo-700/80 mt-1 truncate">
                    {preset.moves}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Dialog Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Dialog.Close className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
              Cancel
            </Dialog.Close>
            <button
              onClick={() => handleApply(inputMoves)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-lg shadow-sm shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Check className="h-3.5 w-3.5" /> Apply & Trace Solution
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
