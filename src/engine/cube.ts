// Mathematical model and permutation engine for the Rubik's Cube (3x3x3)

export type FaceName = 'U' | 'R' | 'F' | 'D' | 'L' | 'B'
export type StickerColor = 'white' | 'red' | 'green' | 'yellow' | 'orange' | 'blue'

export type QuarterMove =
  | 'U' | "U'" | 'D' | "D'"
  | 'R' | "R'" | 'L' | "L'"
  | 'F' | "F'" | 'B' | "B'"

export type HalfMove = 'U2' | 'D2' | 'R2' | 'L2' | 'F2' | 'B2'
export type MoveName = QuarterMove | HalfMove

export interface FaceletCoord {
  face: FaceName
  index: number // 0..53
  pos: [number, number, number] // x, y, z in {-1, 0, 1}
  normal: [number, number, number] // dx, dy, dz in {-1, 0, 1}
}

export const FACE_COLORS: Record<FaceName, string> = {
  U: '#ffffff', // White
  R: '#dc2626', // Red
  F: '#16a34a', // Green
  D: '#facc15', // Yellow
  L: '#ea580c', // Orange
  B: '#2563eb', // Blue
}

export const MOVE_COLORS: Record<string, string> = {
  U: '#9333ea', // Purple
  "U'": '#a855f7',
  U2: '#7e22ce',
  R: '#dc2626', // Red
  "R'": '#ef4444',
  R2: '#b91c1c',
  F: '#16a34a', // Green
  "F'": '#22c55e',
  F2: '#15803d',
  D: '#eab308', // Yellow
  "D'": '#facc15',
  D2: '#ca8a04',
  L: '#ea580c', // Orange
  "L'": '#f97316',
  L2: '#c2410c',
  B: '#2563eb', // Blue
  "B'": '#3b82f6',
  B2: '#1d4ed8',
}

// Generate the 54 facelet coordinates in standard Singmaster ordering:
// U (0..8), R (9..17), F (18..26), D (27..35), L (36..44), B (45..53)
export function generateFacelets(): FaceletCoord[] {
  const facelets: FaceletCoord[] = []

  // U: y = 1, normal = [0, 1, 0]
  let idx = 0
  for (const z of [-1, 0, 1]) {
    for (const x of [-1, 0, 1]) {
      facelets.push({ face: 'U', index: idx++, pos: [x, 1, z], normal: [0, 1, 0] })
    }
  }

  // R: x = 1, normal = [1, 0, 0]
  idx = 9
  for (const y of [1, 0, -1]) {
    for (const z of [1, 0, -1]) {
      facelets.push({ face: 'R', index: idx++, pos: [1, y, z], normal: [1, 0, 0] })
    }
  }

  // F: z = 1, normal = [0, 0, 1]
  idx = 18
  for (const y of [1, 0, -1]) {
    for (const x of [-1, 0, 1]) {
      facelets.push({ face: 'F', index: idx++, pos: [x, y, 1], normal: [0, 0, 1] })
    }
  }

  // D: y = -1, normal = [0, -1, 0]
  idx = 27
  for (const z of [1, 0, -1]) {
    for (const x of [-1, 0, 1]) {
      facelets.push({ face: 'D', index: idx++, pos: [x, -1, z], normal: [0, -1, 0] })
    }
  }

  // L: x = -1, normal = [-1, 0, 0]
  idx = 36
  for (const y of [1, 0, -1]) {
    for (const z of [-1, 0, 1]) {
      facelets.push({ face: 'L', index: idx++, pos: [-1, y, z], normal: [-1, 0, 0] })
    }
  }

  // B: z = -1, normal = [0, 0, -1]
  idx = 45
  for (const y of [1, 0, -1]) {
    for (const x of [1, 0, -1]) {
      facelets.push({ face: 'B', index: idx++, pos: [x, y, -1], normal: [0, 0, -1] })
    }
  }

  return facelets
}

export const FACELETS = generateFacelets()

function rotateCoord(
  [x, y, z]: [number, number, number],
  axis: 'X' | 'Y' | 'Z',
  dir: 1 | -1
): [number, number, number] {
  if (axis === 'X') {
    return [x, dir === 1 ? z : -z, dir === 1 ? -y : y]
  } else if (axis === 'Y') {
    return [dir === 1 ? -z : z, y, dir === 1 ? x : -x]
  } else {
    return [dir === 1 ? y : -y, dir === 1 ? -x : x, z]
  }
}

function computePermutation(
  axis: 'X' | 'Y' | 'Z',
  layer: number,
  dir: 1 | -1
): number[] {
  const perm: number[] = new Array(54).fill(0)
  for (let i = 0; i < 54; i++) {
    const f = FACELETS[i]
    const axisCoord = axis === 'X' ? f.pos[0] : axis === 'Y' ? f.pos[1] : f.pos[2]
    if (axisCoord === layer) {
      const newPos = rotateCoord(f.pos, axis, dir)
      const newNorm = rotateCoord(f.normal, axis, dir)
      const targetIdx = FACELETS.findIndex(
        (t) =>
          t.pos[0] === newPos[0] &&
          t.pos[1] === newPos[1] &&
          t.pos[2] === newPos[2] &&
          t.normal[0] === newNorm[0] &&
          t.normal[1] === newNorm[1] &&
          t.normal[2] === newNorm[2]
      )
      if (targetIdx === -1) {
        throw new Error(`Permutation mapping failed for facelet ${i}`)
      }
      perm[targetIdx] = i
    } else {
      perm[i] = i
    }
  }
  return perm
}

function invertPermutation(p: number[]): number[] {
  const inv = new Array(54)
  for (let i = 0; i < 54; i++) {
    inv[p[i]] = i
  }
  return inv
}

function composePermutations(p1: number[], p2: number[]): number[] {
  const res = new Array(54)
  for (let i = 0; i < 54; i++) {
    res[i] = p1[p2[i]]
  }
  return res
}

// Compute all 18 standard permutations
const permU = computePermutation('Y', 1, 1)
const permD = computePermutation('Y', -1, -1)
const permR = computePermutation('X', 1, 1)
const permL = computePermutation('X', -1, -1)
const permF = computePermutation('Z', 1, 1)
const permB = computePermutation('Z', -1, -1)

export const PERMUTATIONS: Record<MoveName, number[]> = {
  U: permU,
  "U'": invertPermutation(permU),
  U2: composePermutations(permU, permU),
  D: permD,
  "D'": invertPermutation(permD),
  D2: composePermutations(permD, permD),
  R: permR,
  "R'": invertPermutation(permR),
  R2: composePermutations(permR, permR),
  L: permL,
  "L'": invertPermutation(permL),
  L2: composePermutations(permL, permL),
  F: permF,
  "F'": invertPermutation(permF),
  F2: composePermutations(permF, permF),
  B: permB,
  "B'": invertPermutation(permB),
  B2: composePermutations(permB, permB),
}

export const INVERSE_MOVES: Record<MoveName, MoveName> = {
  U: "U'", "U'": 'U', U2: 'U2',
  D: "D'", "D'": 'D', D2: 'D2',
  R: "R'", "R'": 'R', R2: 'R2',
  L: "L'", "L'": 'L', L2: 'L2',
  F: "F'", "F'": 'F', F2: 'F2',
  B: "B'", "B'": 'B', B2: 'B2',
}

export const SOLVED_STATE =
  'U'.repeat(9) +
  'R'.repeat(9) +
  'F'.repeat(9) +
  'D'.repeat(9) +
  'L'.repeat(9) +
  'B'.repeat(9)

export function applyMove(state: string, move: MoveName): string {
  const perm = PERMUTATIONS[move]
  const chars = state.split('')
  const res = new Array(54)
  for (let i = 0; i < 54; i++) {
    res[i] = chars[perm[i]]
  }
  return res.join('')
}

export function applySequence(state: string, moves: MoveName[]): string {
  let cur = state
  for (const m of moves) {
    cur = applyMove(cur, m)
  }
  return cur
}

export function isSolved(state: string): boolean {
  return state === SOLVED_STATE
}

// Preset generator subgroups
export interface GeneratorPreset {
  id: string
  name: string
  description: string
  generators: MoveName[]
}

export const GENERATOR_PRESETS: GeneratorPreset[] = [
  {
    id: 'RU',
    name: '⟨R, U⟩ 2-Generator',
    description: 'The famous 2-generator subgroup. Branching factor 4 with beautiful grid and cycle symmetries.',
    generators: ['R', "R'", 'U', "U'"],
  },
  {
    id: 'R2U2',
    name: '⟨R², U²⟩ 180° Commutator',
    description: 'Small 6-state closed cycle. Perfect for visualizing a complete, finite Cayley graph.',
    generators: ['R2', 'U2'],
  },
  {
    id: 'RF',
    name: '⟨R, F⟩ 2-Generator',
    description: 'Interlocking Right and Front turns.',
    generators: ['R', "R'", 'F', "F'"],
  },
  {
    id: 'QTM_ALL',
    name: 'All Quarter Turns (QTM)',
    description: 'Full 12 quarter-turn generators {U, D, R, L, F, B} and their inverses.',
    generators: ['U', "U'", 'D', "D'", 'R', "R'", 'L', "L'", 'F', "F'", 'B', "B'"],
  },
  {
    id: 'HALF_TURNS',
    name: 'Half-Turn Subgroup (HTM)',
    description: 'Only 180° double turns {U², D², R², L², F², B²}.',
    generators: ['U2', 'D2', 'R2', 'L2', 'F2', 'B2'],
  },
]

export function generateScramble(length: number = 5, allowedGenerators?: MoveName[]): MoveName[] {
  const pool = allowedGenerators && allowedGenerators.length > 0
    ? allowedGenerators
    : (['U', "U'", 'D', "D'", 'R', "R'", 'L', "L'", 'F', "F'", 'B', "B'"] as MoveName[])

  const scramble: MoveName[] = []
  let lastAxis = ''

  const getAxis = (m: MoveName) => m[0]

  while (scramble.length < length) {
    const move = pool[Math.floor(Math.random() * pool.length)]
    if (pool.length > 2 && getAxis(move) === lastAxis) {
      continue
    }
    scramble.push(move)
    lastAxis = getAxis(move)
  }

  return scramble
}
