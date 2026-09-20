import React from 'react'
import { FACE_COLORS, type FaceName } from '@/engine/cube'

interface CubeNetProps {
  state: string // 54 chars
  size?: number // size of each facelet in px (e.g. 4 or 5)
  className?: string
}

const FACE_RANGES: Record<FaceName, { start: number; end: number }> = {
  U: { start: 0, end: 9 },
  R: { start: 9, end: 18 },
  F: { start: 18, end: 27 },
  D: { start: 27, end: 36 },
  L: { start: 36, end: 45 },
  B: { start: 45, end: 54 },
}

export const CubeNet: React.FC<CubeNetProps> = ({ state, size = 4, className = '' }) => {
  const getFaceColors = (face: FaceName): string[] => {
    const { start, end } = FACE_RANGES[face]
    const slice = state.slice(start, end)
    return slice.split('').map((char) => FACE_COLORS[char as FaceName] || '#18181b')
  }

  const renderFace = (face: FaceName) => {
    const colors = getFaceColors(face)
    return (
      <div
        className="grid grid-cols-3 gap-[1px] bg-slate-400/50 p-[1px] rounded-[2px]"
        style={{ width: size * 3 + 4, height: size * 3 + 4 }}
      >
        {colors.map((c, i) => (
          <div
            key={i}
            className="rounded-[1px]"
            style={{
              backgroundColor: c,
              width: size,
              height: size,
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div className={`inline-grid grid-cols-4 gap-1 items-center justify-center ${className}`}>
      {/* Row 1: empty, U, empty, empty */}
      <div />
      {renderFace('U')}
      <div />
      <div />

      {/* Row 2: L, F, R, B */}
      {renderFace('L')}
      {renderFace('F')}
      {renderFace('R')}
      {renderFace('B')}

      {/* Row 3: empty, D, empty, empty */}
      <div />
      {renderFace('D')}
      <div />
      <div />
    </div>
  )
}
