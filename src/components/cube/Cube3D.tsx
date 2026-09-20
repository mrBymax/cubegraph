import React from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, RoundedBox, ContactShadows } from '@react-three/drei'
import { FACE_COLORS, type FaceName } from '@/engine/cube'

interface Cube3DProps {
  state: string
}

function getStickerColor(char: string): string {
  return FACE_COLORS[char as FaceName] || '#18181b'
}

const Cubelet: React.FC<{
  x: number
  y: number
  z: number
  state: string
}> = ({ x, y, z, state }) => {
  // Facelet index formulas
  const uIdx = y === 1 ? (z + 1) * 3 + (x + 1) : -1
  const dIdx = y === -1 ? 27 + (1 - z) * 3 + (x + 1) : -1
  const rIdx = x === 1 ? 9 + (1 - y) * 3 + (1 - z) : -1
  const lIdx = x === -1 ? 36 + (1 - y) * 3 + (z + 1) : -1
  const fIdx = z === 1 ? 18 + (1 - y) * 3 + (x + 1) : -1
  const bIdx = z === -1 ? 45 + (1 - y) * 3 + (1 - x) : -1

  const topColor = uIdx >= 0 ? getStickerColor(state[uIdx]) : undefined
  const bottomColor = dIdx >= 0 ? getStickerColor(state[dIdx]) : undefined
  const rightColor = rIdx >= 0 ? getStickerColor(state[rIdx]) : undefined
  const leftColor = lIdx >= 0 ? getStickerColor(state[lIdx]) : undefined
  const frontColor = fIdx >= 0 ? getStickerColor(state[fIdx]) : undefined
  const backColor = bIdx >= 0 ? getStickerColor(state[bIdx]) : undefined

  return (
    <group position={[x, y, z]}>
      {/* Black core body */}
      <RoundedBox args={[0.96, 0.96, 0.96]} radius={0.06} smoothness={4}>
        <meshStandardMaterial color="#18181b" roughness={0.35} metalness={0.1} />
      </RoundedBox>

      {/* Stickers on outer faces */}
      {rightColor && (
        <mesh position={[0.49, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[0.82, 0.82]} />
          <meshStandardMaterial color={rightColor} roughness={0.15} />
        </mesh>
      )}

      {leftColor && (
        <mesh position={[-0.49, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[0.82, 0.82]} />
          <meshStandardMaterial color={leftColor} roughness={0.15} />
        </mesh>
      )}

      {topColor && (
        <mesh position={[0, 0.49, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.82, 0.82]} />
          <meshStandardMaterial color={topColor} roughness={0.15} />
        </mesh>
      )}

      {bottomColor && (
        <mesh position={[0, -0.49, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.82, 0.82]} />
          <meshStandardMaterial color={bottomColor} roughness={0.15} />
        </mesh>
      )}

      {frontColor && (
        <mesh position={[0, 0, 0.49]}>
          <planeGeometry args={[0.82, 0.82]} />
          <meshStandardMaterial color={frontColor} roughness={0.15} />
        </mesh>
      )}

      {backColor && (
        <mesh position={[0, 0, -0.49]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[0.82, 0.82]} />
          <meshStandardMaterial color={backColor} roughness={0.15} />
        </mesh>
      )}
    </group>
  )
}

export const Cube3D: React.FC<Cube3DProps> = ({ state }) => {
  return (
    <Canvas camera={{ position: [5.2, 4.6, 6.2], fov: 42 }}>
      <color attach="background" args={['#f8fafc']} />
      <ambientLight intensity={1.6} />
      <directionalLight position={[12, 18, 10]} intensity={1.8} castShadow />
      <directionalLight position={[-12, -6, -10]} intensity={0.7} />
      <directionalLight position={[0, -10, 6]} intensity={0.3} />

      <group rotation={[0.32, 0.52, 0]}>
        {[-1, 0, 1].map((x) =>
          [-1, 0, 1].map((y) =>
            [-1, 0, 1].map((z) => (
              <Cubelet key={`${x}-${y}-${z}`} x={x} y={y} z={z} state={state} />
            ))
          )
        )}
      </group>

      <ContactShadows
        position={[0, -2.4, 0]}
        opacity={0.35}
        scale={10}
        blur={2}
        far={4}
      />
      <OrbitControls enablePan={false} minDistance={3.5} maxDistance={14} />
    </Canvas>
  )
}
