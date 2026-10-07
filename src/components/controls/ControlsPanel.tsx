import React, { useState } from 'react'
import { useCubeStore } from '@/store/cubeStore'
import { GENERATOR_PRESETS, type MoveName, MOVE_COLORS } from '@/engine/cube'
import { ConfigurationModal } from './ConfigurationModal'
import {
  RotateCcw,
  Dices,
  Sparkles,
  SlidersHorizontal,
  Wand2,
  Route,
} from 'lucide-react'
import confetti from 'canvas-confetti'

export const ControlsPanel: React.FC = () => {
  const [configModalOpen, setConfigModalOpen] = useState(false)
  const [scrambleLength, setScrambleLength] = useState(5)

  const isSolvedState = useCubeStore((s) => s.isSolvedState)
  const selectedPresetId = useCubeStore((s) => s.selectedPresetId)
  const solveResult = useCubeStore((s) => s.solveResult)
  const applyMove = useCubeStore((s) => s.applyMove)
  const setPreset = useCubeStore((s) => s.setPreset)
  const scrambleAndSolve = useCubeStore((s) => s.scrambleAndSolve)
  const recomputeSolution = useCubeStore((s) => s.recomputeSolution)
  const resetToSolved = useCubeStore((s) => s.resetToSolved)
  const getActivePreset = useCubeStore((s) => s.getActivePreset)

  const activePreset = getActivePreset()

  const handleRandomize = () => {
    scrambleAndSolve(scrambleLength)
  }

  const handleMoveClick = (m: MoveName) => {
    applyMove(m)
    // If solved after manual move, fire confetti
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
    <>
      <div className="flex flex-col gap-2.5 p-3.5 bg-white border-b border-slate-200">
        {/* Top Row: Primary Actions (Randomize, Custom Config, Presets) */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Scramble & Randomize Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center rounded-lg bg-indigo-50 border border-indigo-200 p-0.5 shadow-2xs">
              <button
                onClick={handleRandomize}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all text-white rounded-md shadow-xs cursor-pointer"
                title="Randomize cube and compute path to solved"
              >
                <Dices className="h-4 w-4" />
                Randomize & Trace
              </button>

              {/* Length selector */}
              <div className="flex items-center px-2 gap-1 text-[11px] font-mono text-indigo-900">
                <span className="text-slate-400 font-sans">Moves:</span>
                {[3, 5, 7, 10].map((len) => (
                  <button
                    key={len}
                    onClick={() => {
                      setScrambleLength(len)
                      scrambleAndSolve(len)
                    }}
                    className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                      scrambleLength === len
                        ? 'bg-white font-bold text-indigo-700 shadow-2xs'
                        : 'text-indigo-600/70 hover:text-indigo-900'
                    }`}
                  >
                    {len}m
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Configuration button */}
            <button
              onClick={() => setConfigModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white hover:bg-slate-50 active:scale-95 transition-all text-slate-700 rounded-lg border border-slate-200 shadow-2xs cursor-pointer"
              title="Add a custom cube configuration or sequence"
            >
              <Wand2 className="h-3.5 w-3.5 text-indigo-600" />
              Custom Configuration...
            </button>

            {/* Recompute Path (if scrambled manually) */}
            {!isSolvedState && (!solveResult || solveResult.path.length === 0) && (
              <button
                onClick={recomputeSolution}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs cursor-pointer animate-pulse"
              >
                <Route className="h-3.5 w-3.5" />
                Find Path to Solved
              </button>
            )}
          </div>

          {/* Reset & Subgroup Preset Selector */}
          <div className="flex items-center gap-3">
            {/* Subgroups */}
            <div className="hidden md:flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <SlidersHorizontal className="h-3 w-3" /> Subgroup:
              </span>
              <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200/80">
                {GENERATOR_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setPreset(preset.id)}
                    className={`px-2 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
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

            <button
              onClick={resetToSolved}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-white hover:bg-slate-50 active:scale-95 transition-all text-slate-700 rounded-lg border border-slate-200 shadow-2xs cursor-pointer"
              title="Reset cube to solved origin"
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
              Reset
            </button>
          </div>
        </div>

        {/* Second Row: Move Generator Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-slate-400 mr-1">Twist Faces:</span>
            {activePreset.generators.map((move) => {
              const color = MOVE_COLORS[move] || '#4f46e5'
              return (
                <button
                  key={move}
                  onClick={() => handleMoveClick(move)}
                  className="group flex items-center justify-center min-w-[34px] h-7 px-2 rounded-md bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs active:scale-95 transition-all text-xs font-mono font-bold cursor-pointer hover:border-indigo-300"
                  style={{ color }}
                  title={`Apply move ${move}`}
                >
                  {move}
                </button>
              )
            })}
          </div>

          {/* Solved indicator */}
          {isSolvedState && (
            <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs text-emerald-800 font-medium">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              Cube Solved (Identity)
            </div>
          )}
        </div>
      </div>

      {/* Custom Configuration Modal */}
      <ConfigurationModal
        open={configModalOpen}
        onOpenChange={setConfigModalOpen}
      />
    </>
  )
}
