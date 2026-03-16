import type { City, BoardPiece } from '../types'
import { SNAP_THRESHOLD } from './generals'
import { ROME_GENERALS_LIST } from './gameConstants'
import { GENERAL_STATS } from './generals'

// 都市間の隣接判定距離閾値（px）
// 286px: Gallia Cisalpinia - Mutina ↔ Liguria - W.Ligurians（Hannibalのルート）
// 277px: Sicilia - Lilybaeum ↔ Carthaginia（海上補給路）
// 295px: これらを包含しつつ遠距離（366px以上）を除外
const ADJACENCY_THRESHOLD = 295

const CARTHAGE_GENERALS = Object.entries(GENERAL_STATS)
  .filter(([, s]) => s.side === 'Carthage')
  .map(([name]) => name)

// ── 隣接グラフ構築（起動時に一度だけ計算） ─────────────────────────
export function buildAdjacencyGraph(cities: City[]): Map<string, City[]> {
  const graph = new Map<string, City[]>()
  for (const c of cities) graph.set(c.name, [])

  for (let i = 0; i < cities.length; i++) {
    for (let j = i + 1; j < cities.length; j++) {
      const a = cities[i], b = cities[j]
      const dist = Math.hypot(a.x - b.x, a.y - b.y)
      if (dist <= ADJACENCY_THRESHOLD) {
        graph.get(a.name)!.push(b)
        graph.get(b.name)!.push(a)
      }
    }
  }
  return graph
}

// ── PC / 将軍の位置チェック ─────────────────────────────────────────
function hasFriendlyPC(city: City, faction: 'Rome' | 'Carthage', pieces: BoardPiece[]): boolean {
  const img = faction === 'Rome' ? 'RomePC' : 'CarthPC'
  return pieces.some(p =>
    p.type === 'PC' && p.imagePath.includes(img) &&
    Math.abs(p.x - city.x) < SNAP_THRESHOLD &&
    Math.abs(p.y - city.y) < SNAP_THRESHOLD,
  )
}

function hasFriendlyGeneral(city: City, faction: 'Rome' | 'Carthage', pieces: BoardPiece[]): boolean {
  const list = faction === 'Rome' ? ROME_GENERALS_LIST : CARTHAGE_GENERALS
  return pieces.some(p =>
    p.type === 'General' && list.includes(p.label ?? '') &&
    Math.abs(p.x - city.x) < SNAP_THRESHOLD &&
    Math.abs(p.y - city.y) < SNAP_THRESHOLD,
  )
}

// ── BFS: 首都から到達可能な都市を列挙 ──────────────────────────────
function reachableFromCapital(
  faction: 'Rome' | 'Carthage',
  validCities: City[],
  pieces: BoardPiece[],
  graph: Map<string, City[]>,
): Set<string> {
  const capitalName = faction === 'Rome' ? 'Latium - Rome' : 'Carthage - Carthage'
  const capital = validCities.find(c => c.name === capitalName)
  if (!capital) return new Set()

  const visited = new Set<string>([capital.name])
  const queue: City[] = [capital]

  while (queue.length > 0) {
    const current = queue.shift()!
    for (const neighbor of (graph.get(current.name) ?? [])) {
      if (visited.has(neighbor.name)) continue
      // 隣接都市が「友軍PC」または「友軍将軍」を持つ場合のみ通過可能
      if (
        hasFriendlyPC(neighbor, faction, pieces) ||
        hasFriendlyGeneral(neighbor, faction, pieces)
      ) {
        visited.add(neighbor.name)
        queue.push(neighbor)
      }
    }
  }
  return visited
}

// ── 孤立PC検出 ──────────────────────────────────────────────────────
export interface IsolatedPC {
  pc: BoardPiece
  cityName: string
}

export interface SupplyCheckResult {
  rome: IsolatedPC[]
  carthage: IsolatedPC[]
}

export function runSupplyCheck(
  cities: City[],
  pieces: BoardPiece[],
  graph: Map<string, City[]>,
): SupplyCheckResult {
  const validCities = cities.filter(c => c.name.includes(' - '))

  const check = (faction: 'Rome' | 'Carthage'): IsolatedPC[] => {
    const img = faction === 'Rome' ? 'RomePC' : 'CarthPC'
    const reachable = reachableFromCapital(faction, validCities, pieces, graph)

    const isolated: IsolatedPC[] = []
    for (const p of pieces) {
      if (p.type !== 'PC' || !p.imagePath.includes(img)) continue
      const city = validCities.find(c =>
        Math.abs(c.x - p.x) < SNAP_THRESHOLD &&
        Math.abs(c.y - p.y) < SNAP_THRESHOLD,
      )
      if (!city) continue
      if (!reachable.has(city.name)) {
        isolated.push({ pc: p, cityName: city.name })
      }
    }
    return isolated
  }

  return { rome: check('Rome'), carthage: check('Carthage') }
}
