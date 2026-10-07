import React, { useEffect } from 'react'
import { useCubeStore } from '@/store/cubeStore'
import * as Slider from '@radix-ui/react-slider'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Gauge,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import confetti from 'canvas-confetti'

export const PlaybackBar: React.FC = () => {
  const solveResult = useCubeStore((s) => s.solveResult)
  const currentStepIndex = useCubeStore((s) => s.currentStepIndex)
  const isPlaying = useCubeStore((s) => s.isPlaying)
  const playbackSpeedMs = useCubeStore((s) => s.playbackSpeedMs)
  const setStep = useCubeStore((s) => s.setStep)
  const nextStep = useCubeStore((s) => s.nextStep)
  const prevStep = useCubeStore((s) => s.prevStep)
  const togglePlay = useCubeStore((s) => s.togglePlay)
  const setPlaybackSpeedMs = useCubeStore((s) => s.setPlaybackSpeedMs)

  const totalSteps = solveResult ? solveResult.path.length : 0
  const isAtGoal = currentStepIndex === totalSteps && totalSteps > 0

  // Auto-play timer effect
  useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(() => {
      const state = useCubeStore.getState()
      if (state.solveResult && state.currentStepIndex < state.solveResult.states.length - 1) {
        state.nextStep()
        if (state.currentStepIndex + 1 === state.solveResult.states.length - 1) {
          confetti({
            particleCount: 70,
            spread: 60,
            origin: { y: 0.6 },
          })
        }
      } else {
        useCubeStore.setState({ isPlaying: false })
      }
    }, playbackSpeedMs)

    return () => clearInterval(interval)
  }, [isPlaying, playbackSpeedMs])

  if (!solveResult || totalSteps === 0) {
    return null
  }

  const currentMove =
    currentStepIndex > 0 ? solveResult.path[currentStepIndex - 1] : null
  const upcomingMove =
    currentStepIndex < totalSteps ? solveResult.path[currentStepIndex] : null

  return (
    <div className="flex flex-col gap-2.5 px-5 py-3 bg-white border-t border-slate-200/90 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left: Playback Controls */}
        <div className="flex items-center gap-2">
          {/* Restart */}
          <button
            onClick={() => setStep(0)}
            disabled={currentStepIndex === 0}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
            title="Jump to Initial Scrambled State"
          >
            <SkipBack className="h-4 w-4" />
          </button>

          {/* Prev */}
          <button
            onClick={prevStep}
            disabled={currentStepIndex === 0}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
            title="Previous Step"
          >
            <span className="text-xs font-bold font-mono">◀</span>
          </button>

          {/* Play/Pause Button */}
          <button
            onClick={togglePlay}
            className={`flex items-center gap-1.5 h-8 px-4 rounded-lg font-medium text-xs text-white shadow-xs transition-all cursor-pointer ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20 active:scale-95'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="h-3.5 w-3.5 fill-current" /> Pause
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                {isAtGoal ? 'Replay' : 'Play Path'}
              </>
            )}
          </button>

          {/* Next */}
          <button
            onClick={nextStep}
            disabled={currentStepIndex >= totalSteps}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
            title="Next Step"
          >
            <span className="text-xs font-bold font-mono">▶</span>
          </button>

          {/* Jump to Goal */}
          <button
            onClick={() => {
              setStep(totalSteps)
              confetti({ particleCount: 50, spread: 50 })
            }}
            disabled={currentStepIndex >= totalSteps}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
            title="Jump to Solved Goal"
          >
            <SkipForward className="h-4 w-4" />
          </button>
        </div>

        {/* Center: Step scrubber & move status */}
        <div className="flex flex-1 max-w-md items-center gap-3">
          <div className="flex flex-col flex-1">
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="font-semibold text-slate-800">
                {currentStepIndex === 0 ? (
                  <span className="text-amber-700 font-bold">Step 0: Initial State</span>
                ) : isAtGoal ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Solved Target!
                  </span>
                ) : (
                  <span>
                    Step <strong className="font-mono">{currentStepIndex}</strong> of <strong className="font-mono">{totalSteps}</strong>
                    {currentMove && (
                      <span className="ml-1.5 text-indigo-600 font-mono font-bold">
                        (Applied: {currentMove})
                      </span>
                    )}
                  </span>
                )}
              </span>

              {upcomingMove && !isAtGoal && (
                <span className="text-[11px] font-mono text-slate-400">
                  Next: <strong className="text-indigo-600">{upcomingMove}</strong>
                </span>
              )}
            </div>

            {/* Slider Scrubber */}
            <Slider.Root
              className="relative flex h-5 w-full touch-none select-none items-center cursor-pointer"
              value={[currentStepIndex]}
              onValueChange={([val]) => setStep(val)}
              min={0}
              max={totalSteps}
              step={1}
            >
              <Slider.Track className="relative h-2 grow rounded-full bg-slate-200">
                <Slider.Range className="absolute h-full rounded-full bg-indigo-600" />
              </Slider.Track>
              <Slider.Thumb
                className="block h-4 w-4 rounded-full border-2 border-indigo-600 bg-white shadow-xs transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                aria-label="Solution Step Progress"
              />
            </Slider.Root>
          </div>
        </div>

        {/* Right: Path stats & speed control */}
        <div className="flex items-center gap-4 text-xs">
          {/* Metrics */}
          <div className="hidden lg:flex items-center gap-2 text-slate-500 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-lg">
            <span className="font-medium text-slate-700">
              Path: <strong className="font-mono text-indigo-700">{totalSteps}</strong> moves
            </span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
              <Clock className="h-3 w-3" /> {solveResult.durationMs.toFixed(1)}ms
            </span>
            {solveResult.isOptimal && (
              <>
                <span className="text-slate-300">|</span>
                <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">
                  Optimal
                </span>
              </>
            )}
          </div>

          {/* Speed Control */}
          <div className="flex items-center gap-1.5">
            <Gauge className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={playbackSpeedMs}
              onChange={(e) => setPlaybackSpeedMs(Number(e.target.value))}
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-mono text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
            >
              <option value={1400}>0.7x (1.4s)</option>
              <option value={800}>1.0x (0.8s)</option>
              <option value={450}>1.8x (0.45s)</option>
              <option value={200}>3.5x (0.2s)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
