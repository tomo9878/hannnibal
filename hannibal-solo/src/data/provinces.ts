import type { City, BoardPiece } from '../types'
import { SNAP_THRESHOLD } from './generals'

// ── Province support ──────────────────────────────────────────────────
export interface ProvinceScore {
  province: string
  total: number          // cities in province
  romeCount: number      // cities with Rome PC
  carthCount: number     // cities with Carthage PC
  controller: 'Rome' | 'Carthage' | null
}

export interface VictoryScore {
  rome: number
  carthage: number
  provinces: ProvinceScore[]
}

// Capitals: enemy PC here = instant game end
export const ROME_CAPITAL    = 'Latium - Rome'
export const CARTHAGE_CAPITAL = 'Carthage - Carthage'

// PC helper
function pcSide(piece: BoardPiece): 'Rome' | 'Carthage' | null {
  if (piece.type !== 'PC') return null
  if (piece.imagePath.includes('RomePC'))  return 'Rome'
  if (piece.imagePath.includes('CarthPC')) return 'Carthage'
  return null
}

function isNearCity(piece: BoardPiece, city: City): boolean {
  return Math.abs(piece.x - city.x) < SNAP_THRESHOLD &&
         Math.abs(piece.y - city.y) < SNAP_THRESHOLD
}

export function calculateVictoryScore(cities: City[], pieces: BoardPiece[]): VictoryScore {
  // Only real cities have "Province - City" format
  const validCities = cities.filter(c => c.name.includes(' - '))

  // Group by province
  const byProvince: Record<string, City[]> = {}
  for (const city of validCities) {
    const province = city.name.split(' - ')[0]
    byProvince[province] ??= []
    byProvince[province].push(city)
  }

  const provinces: ProvinceScore[] = []
  let rome = 0, carthage = 0

  for (const [province, pcities] of Object.entries(byProvince).sort()) {
    let romeCount = 0, carthCount = 0
    for (const city of pcities) {
      const pc = pieces.find(p => pcSide(p) !== null && isNearCity(p, city))
      if (!pc) continue
      if (pcSide(pc) === 'Rome')     romeCount++
      else if (pcSide(pc) === 'Carthage') carthCount++
    }

    const majority = Math.floor(pcities.length / 2) + 1
    let controller: 'Rome' | 'Carthage' | null = null
    if (romeCount >= majority)  controller = 'Rome'
    else if (carthCount >= majority) controller = 'Carthage'

    provinces.push({ province, total: pcities.length, romeCount, carthCount, controller })
    if (controller === 'Rome')     rome++
    else if (controller === 'Carthage') carthage++
  }

  return { rome, carthage, provinces }
}

// Capital fall detection: returns winning side if a capital has fallen
export function checkCapitalFall(cities: City[], pieces: BoardPiece[]): 'Rome' | 'Carthage' | null {
  const romeCapital    = cities.find(c => c.name === ROME_CAPITAL)
  const carthCapital   = cities.find(c => c.name === CARTHAGE_CAPITAL)

  if (romeCapital) {
    const pc = pieces.find(p => pcSide(p) === 'Carthage' && isNearCity(p, romeCapital))
    if (pc) return 'Carthage'
  }
  if (carthCapital) {
    const pc = pieces.find(p => pcSide(p) === 'Rome' && isNearCity(p, carthCapital))
    if (pc) return 'Rome'
  }
  return null
}
