import hannibalData from '../hannibal_data.json'
import type { BoardPiece, City } from '../types'

export const SNAP_THRESHOLD = 30
export const PIECE_SIZE     = 36
export const PC_SIZE        = 38

export const ELITE_GENERALS = new Set(['Hannibal', 'Scipio Africanus'])

export const GENERAL_STATS: Record<string, { side: 'Rome' | 'Carthage'; strategy: number; combat: number; command: number }> = {
  'Hannibal':         { side: 'Carthage', strategy: 1, combat: 4, command: 10 },
  'Hasdrubal':        { side: 'Carthage', strategy: 2, combat: 2, command:  5 },
  'Hanno':            { side: 'Carthage', strategy: 3, combat: 1, command:  8 },
  'Mago':             { side: 'Carthage', strategy: 2, combat: 2, command:  4 },
  'H. Gisbo':         { side: 'Carthage', strategy: 3, combat: 2, command:  6 },
  'P. Scipio':        { side: 'Rome',     strategy: 2, combat: 2, command:  5 },
  'T. Longus':        { side: 'Rome',     strategy: 3, combat: 2, command:  5 },
  'Fabius':           { side: 'Rome',     strategy: 2, combat: 2, command: 10 },
  'Marcellus':        { side: 'Rome',     strategy: 2, combat: 3, command:  5 },
  'G. Nero':          { side: 'Rome',     strategy: 2, combat: 2, command:  5 },
  'A. Paulus':        { side: 'Rome',     strategy: 2, combat: 2, command:  5 },
  'Flaminius':        { side: 'Rome',     strategy: 3, combat: 2, command:  5 },
  'Varro':            { side: 'Rome',     strategy: 3, combat: 1, command:  5 },
  'Scipio Africanus': { side: 'Rome',     strategy: 1, combat: 4, command: 10 },
}

const ROME_PC_PROVINCES     = new Set(['Latium', 'Etruria', 'Samnium', 'Apulia', 'Campania', 'Lucania'])
const CARTHAGE_PC_PROVINCES = new Set(['Baetica', 'Carthage', 'Carthaginia', 'Orospeda'])

function buildScenario1(): BoardPiece[] {
  const allCities = hannibalData.cities as City[]
  const find = (name: string) => {
    const c = allCities.find(city => city.name === name)
    if (!c) throw new Error(`City not found: ${name}`)
    return { x: c.x, y: c.y }
  }

  const nc  = find('Orospeda - New Carthage')
  const crt = find('Carthage - Carthage')
  const mas = find('Massilia - Massilia')
  const lil = find('Sicilia - Lilybaeum')

  const generals: BoardPiece[] = [
    { id: 'hannibal',  type: 'General', x: nc.x,  y: nc.y,  imagePath: '/images/tkn-gnrl-Hannibal.png',  label: 'Hannibal',  strength: 7 },
    { id: 'hasdrubal', type: 'General', x: nc.x,  y: nc.y,  imagePath: '/images/tkn-gnrl-Hasdrubal.png', label: 'Hasdrubal', strength: 3 },
    { id: 'hanno',     type: 'General', x: crt.x, y: crt.y, imagePath: '/images/tkn-gnrl-Hanno.png',     label: 'Hanno',     strength: 2 },
    { id: 'p-scipio',  type: 'General', x: mas.x, y: mas.y, imagePath: '/images/tkn-gnrl-P. Scipio.png', label: 'P. Scipio', strength: 4 },
    { id: 't-longus',  type: 'General', x: lil.x, y: lil.y, imagePath: '/images/tkn-gnrl-T. Longus.png', label: 'T. Longus', strength: 4 },
  ]

  const pcs: BoardPiece[] = []
  for (const city of allCities) {
    if (!city.name.includes(' - ')) continue
    const prov = city.name.split(' - ')[0]
    if (ROME_PC_PROVINCES.has(prov)) {
      pcs.push({ id: `pc-r-${city.name}`, type: 'PC', x: city.x, y: city.y, imagePath: '/images/tkn-PC-RomePC.png' })
    } else if (CARTHAGE_PC_PROVINCES.has(prov)) {
      pcs.push({ id: `pc-c-${city.name}`, type: 'PC', x: city.x, y: city.y, imagePath: '/images/tkn-PC-CarthPC.png' })
    }
  }

  return [...generals, ...pcs]
}

export const INITIAL_PIECES: BoardPiece[] = buildScenario1()
