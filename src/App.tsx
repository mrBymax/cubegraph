import { useState, useEffect } from 'react'
import { Cube3D } from './components/cube/Cube3D'
import { CayleyGraph } from './components/graph/CayleyGraph'
import { ControlsPanel } from './components/controls/ControlsPanel'
import { PlaybackBar } from './components/controls/PlaybackBar'
import { useCubeStore } from './store/cubeStore'
import * as Tabs from '@radix-ui/react-tabs'
import { Box, Network, Keyboard, Route } from 'lucide-react'
import type { MoveName } from './engine/cube'

export default function App() {
  const [activeTab, setActiveTab] = useState<'split' | 'cube' | 'graph'>('split')
  const currentState = useCubeStore((s) => s.currentState)
  const history = useCubeStore((s) => s.history)
  const solveResult = useCubeStore((s) => s.solveResult)
  const applyMove = useCubeStore((s) => s.applyMove)
  const togglePlay = useCubeStore((s) => s.togglePlay)
  const nextStep = useCubeStore((s) => s.nextStep)
  const prevStep = useCubeStore((s) => s.prevStep)
  const getActivePreset = useCubeStore((s) => s.getActivePreset)

  const activePreset = getActivePreset()

  // Keyboard shortcut listener for swift cube manipulation & playback
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      // Spacebar for play/pause
      if (e.code === 'Space') {
        e.preventDefault()
        togglePlay()
        return
      }

      // Left/Right arrow for stepping
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        nextStep()
        return
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        prevStep()
        return
      }

      // Face turn moves
      const key = e.key.toUpperCase()
      const isShift = e.shiftKey

      let move: MoveName | null = null
      if (['U', 'D', 'R', 'L', 'F', 'B'].includes(key)) {
        move = isShift ? (`${key}'` as MoveName) : (key as MoveName)
      }

      if (move && activePreset.generators.includes(move)) {
        e.preventDefault()
        applyMove(move)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activePreset.generators, applyMove, togglePlay, nextStep, prevStep])

  return (
    <div className="flex h-screen w-screen flex-col bg-slate-50 text-slate-900 antialiased select-none font-sans">
      {/* Top Navbar */}
      <header className="flex h-14 items-center justify-between border-b border-slate-200 px-5 bg-white/95 backdrop-blur-md shadow-2xs z-20">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200 shadow-2xs">
            <Network className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight text-slate-900 flex items-center gap-2">
              CubeGraph
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-mono font-medium flex items-center gap-1">
                <Route className="h-3 w-3" /> State & Path Visualizer
              </span>
            </h1>
          </div>
        </div>

        {/* View Switcher Tabs (Radix UI Tabs) */}
        <Tabs.Root
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as 'split' | 'cube' | 'graph')}
          className="flex"
        >
          <Tabs.List className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200/80">
            <Tabs.Trigger
              value="split"
              className="px-3 py-1 text-xs font-medium rounded-md transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Split View
            </Tabs.Trigger>
            <Tabs.Trigger
              value="cube"
              className="px-3 py-1 text-xs font-medium rounded-md transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              3D Cube
            </Tabs.Trigger>
            <Tabs.Trigger
              value="graph"
              className="px-3 py-1 text-xs font-medium rounded-md transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Graph View
            </Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>

        {/* Keyboard hints badge */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 bg-slate-100/80 border border-slate-200 px-2.5 py-1 rounded-md">
          <Keyboard className="h-3.5 w-3.5 text-slate-400" />
          <span>
            <kbd className="font-mono bg-white px-1 border border-slate-200 rounded text-slate-700">Space</kbd> Play
            {' • '}
            <kbd className="font-mono bg-white px-1 border border-slate-200 rounded text-slate-700">←</kbd>
            <kbd className="font-mono bg-white px-1 border border-slate-200 rounded text-slate-700 ml-0.5">→</kbd> Step
          </span>
        </div>
      </header>

      {/* Primary Action Controls */}
      <ControlsPanel />

      {/* Main Workspace Area */}
      <main className="flex flex-1 overflow-hidden relative">
        {/* Left Side: 3D Cube Canvas */}
        {(activeTab === 'split' || activeTab === 'cube') && (
          <div
            className={`relative border-r border-slate-200 bg-gradient-to-b from-slate-50 to-slate-100/70 ${
              activeTab === 'split' ? 'w-5/12 min-w-[340px]' : 'w-full'
            }`}
          >
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 rounded-lg bg-white/95 px-3 py-1.5 text-xs border border-slate-200 shadow-xs text-slate-600 font-medium pointer-events-none">
              <Box className="h-3.5 w-3.5 text-indigo-600" />
              <span>3D Cube (Drag to orbit, scroll to zoom)</span>
            </div>

            <Cube3D state={currentState} />
          </div>
        )}

        {/* Right Side: Graph Visualizer */}
        {(activeTab === 'split' || activeTab === 'graph') && (
          <div
            className={`relative bg-white ${
              activeTab === 'split' ? 'flex-1' : 'w-full'
            }`}
          >
            <CayleyGraph />
          </div>
        )}
      </main>

      {/* Solution Playback Bar */}
      <PlaybackBar />

      {/* Bottom Status Bar */}
      <footer className="flex h-9 items-center justify-between border-t border-slate-200 bg-white px-5 text-xs text-slate-500">
        <div className="flex items-center gap-2 truncate max-w-[60%]">
          <span className="font-medium text-slate-700">Moves applied:</span>
          {history.length === 0 ? (
            <span className="italic text-slate-400">None (solved origin)</span>
          ) : (
            <span className="font-mono text-indigo-600 truncate">
              {history.slice(-12).join(' ')}
              {history.length > 12 && ' ...'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          {solveResult && (
            <span className="text-emerald-700 font-medium font-mono">
              Solution: {solveResult.path.length} steps {solveResult.isOptimal ? '(Optimal)' : ''}
            </span>
          )}
          <span>•</span>
          <span>CubeGraph v0.2.0</span>
        </div>
      </footer>
    </div>
  )
}
