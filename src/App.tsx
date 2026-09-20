import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, RoundedBox, ContactShadows } from '@react-three/drei'
import * as Slider from '@radix-ui/react-slider'
import * as Tabs from '@radix-ui/react-tabs'
import { ReactFlow, Background, Controls } from '@xyflow/react'
import { Box, Share2, Play, RotateCcw, CheckCircle2 } from 'lucide-react'

// Initial test nodes with light-theme styling
const initialNodes = [
  {
    id: '1',
    position: { x: 80, y: 40 },
    data: {
      label: (
        <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-left shadow-xs">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-700">Root Node</div>
          <div className="font-medium text-slate-800 text-xs mt-0.5">Scrambled State</div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">h(n) = 3 moves</div>
        </div>
      ),
    },
    style: { background: 'transparent', border: 'none', padding: 0 },
  },
  {
    id: '2',
    position: { x: 80, y: 150 },
    data: {
      label: (
        <div className="rounded-lg border border-indigo-200 bg-indigo-50/80 px-3 py-2 text-left shadow-xs">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-indigo-700">Step 1</div>
          <div className="font-medium text-slate-800 text-xs mt-0.5">Applied: R U R'</div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">h(n) = 1 move</div>
        </div>
      ),
    },
    style: { background: 'transparent', border: 'none', padding: 0 },
  },
  {
    id: '3',
    position: { x: 80, y: 260 },
    data: {
      label: (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-left shadow-xs">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">Goal State</div>
          <div className="font-medium text-slate-800 text-xs mt-0.5">Solved.</div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">h(n) = 0 (Target)</div>
        </div>
      ),
    },
    style: { background: 'transparent', border: 'none', padding: 0 },
  },
]

const initialEdges = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    animated: true,
    style: { stroke: '#6366f1', strokeWidth: 2 },
    label: 'R U',
    labelStyle: { fill: '#475569', fontSize: 11, fontWeight: 500 },
  },
  {
    id: 'e2-3',
    source: '2',
    target: '3',
    animated: true,
    style: { stroke: '#10b981', strokeWidth: 2 },
    label: "R'",
    labelStyle: { fill: '#475569', fontSize: 11, fontWeight: 500 },
  },
]

// Standard Rubik's Cube Face Colors
const FACE_COLORS = {
  right: '#dc2626', // Red (R)
  left: '#ea580c',  // Orange (L)
  top: '#ffffff',   // White (U)
  bottom: '#facc15',// Yellow (D)
  front: '#16a34a', // Green (F)
  back: '#2563eb',  // Blue (B)
  core: '#18181b',  // Black core plastic
}

function RubiksCubelet({ position }: { position: [number, number, number] }) {
  const [x, y, z] = position
  const rightColor = x === 1 ? FACE_COLORS.right : FACE_COLORS.core
  const leftColor = x === -1 ? FACE_COLORS.left : FACE_COLORS.core
  const topColor = y === 1 ? FACE_COLORS.top : FACE_COLORS.core
  const bottomColor = y === -1 ? FACE_COLORS.bottom : FACE_COLORS.core
  const frontColor = z === 1 ? FACE_COLORS.front : FACE_COLORS.core
  const backColor = z === -1 ? FACE_COLORS.back : FACE_COLORS.core

  return (
    <group position={position}>
      {/* Base black plastic cubelet */}
      <RoundedBox args={[0.96, 0.96, 0.96]} radius={0.06} smoothness={4}>
        <meshStandardMaterial color="#18181b" roughness={0.3} metalness={0.05} />
      </RoundedBox>

      {/* Colored sticker faces */}
      {x === 1 && (
        <mesh position={[0.49, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[0.82, 0.82]} />
          <meshStandardMaterial color={rightColor} roughness={0.15} />
        </mesh>
      )}
      {x === -1 && (
        <mesh position={[-0.49, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[0.82, 0.82]} />
          <meshStandardMaterial color={leftColor} roughness={0.15} />
        </mesh>
      )}
      {y === 1 && (
        <mesh position={[0, 0.49, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.82, 0.82]} />
          <meshStandardMaterial color={topColor} roughness={0.15} />
        </mesh>
      )}
      {y === -1 && (
        <mesh position={[0, -0.49, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.82, 0.82]} />
          <meshStandardMaterial color={bottomColor} roughness={0.15} />
        </mesh>
      )}
      {z === 1 && (
        <mesh position={[0, 0, 0.49]}>
          <planeGeometry args={[0.82, 0.82]} />
          <meshStandardMaterial color={frontColor} roughness={0.15} />
        </mesh>
      )}
      {z === -1 && (
        <mesh position={[0, 0, -0.49]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[0.82, 0.82]} />
          <meshStandardMaterial color={backColor} roughness={0.15} />
        </mesh>
      )}
    </group>
  )
}

function RubiksCube() {
  return (
    <group rotation={[0.3, 0.5, 0]}>
      {[-1, 0, 1].map((x) =>
        [-1, 0, 1].map((y) =>
          [-1, 0, 1].map((z) => (
            <RubiksCubelet key={`${x}-${y}-${z}`} position={[x, y, z]} />
          ))
        )
      )}
    </group>
  )
}

export default function App() {
  const [speed, setSpeed] = useState([50])
  const [activeTab, setActiveTab] = useState('split')

  return (
    <div className="flex h-screen w-screen flex-col bg-slate-50 text-slate-900 antialiased select-none">
      {/* Top Navbar */}
      <header className="flex h-14 items-center justify-between border-b border-slate-200/80 px-5 bg-white/90 backdrop-blur-md shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200 shadow-2xs">
            <Box className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight text-slate-900 flex items-center gap-2">
              CubeGraph
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-mono font-medium">
                v0.1.0-alpha
              </span>
            </h1>
          </div>
        </div>

        {/* View Switcher Tabs (Radix UI Tabs) */}
        <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="flex">
          <Tabs.List className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200/70">
            <Tabs.Trigger
              value="split"
              className="px-3 py-1 text-xs font-medium rounded-md transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs text-slate-500 hover:text-slate-800"
            >
              Split View
            </Tabs.Trigger>
            <Tabs.Trigger
              value="cube"
              className="px-3 py-1 text-xs font-medium rounded-md transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs text-slate-500 hover:text-slate-800"
            >
              3D Cube
            </Tabs.Trigger>
            <Tabs.Trigger
              value="graph"
              className="px-3 py-1 text-xs font-medium rounded-md transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs text-slate-500 hover:text-slate-800"
            >
              Graph Explorer
            </Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white hover:bg-slate-50 active:scale-95 transition-all text-slate-700 rounded-md border border-slate-200 shadow-2xs">
            <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
            Scramble
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all text-white rounded-md shadow-xs shadow-indigo-200">
            <Play className="h-3.5 w-3.5 fill-current" />
            Solve
          </button>
        </div>
      </header>

      {/* Main Workspace Area */}
      <main className="flex flex-1 overflow-hidden">
        {/* Left Side: 3D Cube Canvas */}
        {(activeTab === 'split' || activeTab === 'cube') && (
          <div className="relative flex-1 border-r border-slate-200 bg-gradient-to-b from-slate-50 to-slate-100/70">
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 rounded-lg bg-white/90 px-3 py-1.5 text-xs border border-slate-200/90 backdrop-blur-sm shadow-xs text-slate-600 font-medium">
              <Box className="h-3.5 w-3.5 text-indigo-600" />
              <span>3D Rubik's Space (Drag to rotate, scroll to zoom)</span>
            </div>

            <Canvas camera={{ position: [5, 4.5, 6], fov: 45 }}>
              <color attach="background" args={['#f8fafc']} />
              <ambientLight intensity={1.5} />
              <directionalLight position={[10, 15, 10]} intensity={1.8} castShadow />
              <directionalLight position={[-10, -5, -10]} intensity={0.6} />
              <directionalLight position={[0, -10, 5]} intensity={0.3} />

              <RubiksCube />

              <ContactShadows
                position={[0, -2.4, 0]}
                opacity={0.35}
                scale={10}
                blur={2}
                far={4}
              />
              <OrbitControls enablePan={false} minDistance={3} maxDistance={15} />
            </Canvas>
          </div>
        )}

        {/* Right Side: Graph Visualizer */}
        {(activeTab === 'split' || activeTab === 'graph') && (
          <div className="relative flex-1 bg-white">
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 rounded-lg bg-white/90 px-3 py-1.5 text-xs border border-slate-200 backdrop-blur-sm shadow-xs text-slate-600 font-medium">
              <Share2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Search State Graph</span>
            </div>

            <ReactFlow
              nodes={initialNodes}
              edges={initialEdges}
              fitView
              className="bg-white"
            >
              <Background color="#cbd5e1" gap={18} size={1} />
              <Controls className="bg-white! border-slate-200! shadow-xs! rounded-lg overflow-hidden" />
            </ReactFlow>
          </div>
        )}
      </main>

      {/* Bottom Status / Playback Bar */}
      <footer className="flex h-14 items-center justify-between border-t border-slate-200 bg-white/90 px-5 backdrop-blur-sm">
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5" /> Engine Ready
          </span>
          <span className="text-slate-300">|</span>
          <span>Theme: Light • Three.js + Radix UI + Tailwind CSS v4</span>
        </div>

        {/* Speed Slider using Radix UI Slider */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-medium">Step Speed:</span>
          <Slider.Root
            className="relative flex h-5 w-32 touch-none select-none items-center"
            value={speed}
            onValueChange={setSpeed}
            max={100}
            step={1}
          >
            <Slider.Track className="relative h-1.5 grow rounded-full bg-slate-200">
              <Slider.Range className="absolute h-full rounded-full bg-indigo-600" />
            </Slider.Track>
            <Slider.Thumb
              className="block h-4 w-4 rounded-full border-2 border-indigo-600 bg-white shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-grab active:cursor-grabbing"
              aria-label="Speed"
            />
          </Slider.Root>
          <span className="text-xs font-mono text-slate-600 w-8">{speed[0]}%</span>
        </div>
      </footer>
    </div>
  )
}
