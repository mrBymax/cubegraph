import React from 'react'
import { useCubeStore } from '@/store/cubeStore'
import { GENERATOR_PRESETS, type MoveName, MOVE_COLORS } from '@/engine/cube'
import * as Slider from '@radix-ui/react-slider'
import { RotateCcw, Undo2, Dices, Sparkles, SlidersHorizontal } from 'lucide-react'
import confetti from 'canvas-confetti'

export const ControlsPanel: React.FC = () => {
  const isSolvedState = useCubeStore((s) => s.isSolvedState)
  const history = useCubeStore((s) => s.history)
  const selectedPresetId = useCubeStore((s) => s.selectedPresetId)
  const depth = useCubeStore((s) => s.depth)
  const applyMove = useCubeStore((s) => s.applyMove)
  const setDepth = useCubeStore((s) => s.setDepth)
  const setPreset = useCubeStore((s) => s.setPreset)
  const scramble = useCubeStore((s) => s.scramble)
  const resetToSolved = useCubeStore((s) => s.resetToSolved)
  const undo = useCubeStore((s) => s.undo)
  const getActivePreset = useCubeStore((s) => s.getActivePreset)

  const activePreset = getActivePreset()

  const handleReset = () => {
    resetToSolved()
  }

  const handleScramble = () => {
    scramble(5)
  }

  const handleMoveClick = (m: MoveName) => {
    applyMove(m)
    // If just solved, fire confetti!
    setTimeout(() => {
      if (useCubeStore.getState().isSolvedState) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        })
      }
    }, 50)
  }

  return (
    <div className="flex flex-col gap-3 p-4 bg-white border-b border-slate-200">
      {/* Top Row: Subgroup Preset Selector & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Preset Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <SlidersHorizontal className="h-3 w-3" /> Subgroup:
          </span>
          <div className="flex rounded-lg bg-slate-100 p-1 border border-slate-200/80">
            {GENERATOR_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => setPreset(preset.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                  selectedPresetId === preset.id
                    ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title={preset.description}
              >
                {preset.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Global actions: Scramble, Undo, Reset */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleScramble}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-white hover:bg-slate-50 active:scale-95 transition-all text-slate-700 rounded-md border border-slate-200 shadow-2xs cursor-pointer"
            title="Apply 5 random moves from active subgroup"
          >
            <Dices className="h-3.5 w-3.5 text-indigo-600" />
            Scramble
          </button>

          <button
            onClick={undo}
            disabled={history.length === 0}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all text-slate-700 rounded-md border border-slate-200 shadow-2xs cursor-pointer"
            title="Undo last move"
          >
            <Undo2 className="h-3.5 w-3.5 text-slate-500" />
            Undo
          </button>

          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-white hover:bg-slate-50 active:scale-95 transition-all text-slate-700 rounded-md border border-slate-200 shadow-2xs cursor-pointer"
            title="Reset cube to solved state"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
            Reset
          </button>
        </div>
      </div>

      {/* Second Row: Move Generator Buttons & Depth Slider */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
        {/* Active Move Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-slate-400 mr-1">Moves:</span>
          {activePreset.generators.map((move) => {
            const color = MOVE_COLORS[move] || '#4f46e5'
            return (
              <button
                key={move}
                onClick={() => handleMoveClick(move)}
                className="group relative flex items-center justify-center min-w-[36px] h-8 px-2.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs active:scale-95 transition-all text-xs font-mono font-bold cursor-pointer hover:border-indigo-300"
                style={{ color }}
              >
                {move}
              </button>
            )
          })}
        </div>

        {/* Neighborhood Depth Slider */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-500">
            Graph Depth: <strong className="text-slate-800 font-mono">{depth}</strong> {depth === 1 ? 'hop' : 'hops'}
          </span>
          <Slider.Root
            className="relative flex h-5 w-24 touch-none select-none items-center"
            value={[depth]}
            onValueChange={([val]) => setDepth(val)}
            min={1}
            max={3}
            step={1}
          >
            <Slider.Track className="relative h-1.5 grow rounded-full bg-slate-200">
              <Slider.Range className="absolute h-full rounded-full bg-indigo-600" />
            </Slider.Track>
            <Slider.Thumb
              className="block h-4 w-4 rounded-full border-2 border-indigo-600 bg-white shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-grab active:cursor-grabbing"
              aria-label="Graph Depth"
            />
          </Slider.Root>
        </div>
      </div>

      {/* Solved celebration banner */}
      {isSolvedState && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs text-emerald-800 font-medium animate-fade-in">
          <Sparkles className="h-4 w-4 text-emerald-600" />
          <span>The Rubik's cube is currently in its <strong>Solved State</strong> (Group Identity e)!</span>
        </div>
      )}
    </div>
  )
}
