import { shuffle } from '../utils'

// ── カード名リスト（buildFile解析結果） ──────────────────────────────
const STRATEGY_CARD_NAMES: string[] = [
  'Corsica and Sardinia Revolt', 'Sicilia Revolts', 'Numidia Revolts',
  'Celtiberia Revolts', 'Native Guide', "Marharbal's Cavalry",
  'Hostile Tribes', 'Hostile Tribes',
  'Philip V Of Macedon Allies with Carthage', 'Macedonian Reinforcements',
  'Balearic Slingers', 'African Reinforcements', 'Bruttium Recruits',
  'Ligurian Recruits', 'Iberian Recruits', 'Gallic Recruits',
  'Surprise Sortie', 'Traitor in Tarentum', 'Senate Dismisses Proconsul',
  'Spy in Enemy Camp', 'Mercenaries Desert', "Mutin's Numidians",
  'Numidian Ally', 'The beautiful Sophonisba seduces a Numidian king',
  'Capua Sides with Carthage', 'Syracuse allies with Carthage',
  'I have come into Italy', 'Hannibal Charms Italy',
  'Carthaginian Naval Victory', 'Carthaginian Siege Train',
  'Spanish Allies Desert', 'Numumidian Allies Desert',
  'Major Campaign', 'Major Campaign', 'Diplomacy', 'Diplomacy',
  'Minor Campaign', 'Minor Campaign', 'Minor Campaign', 'Minor Campaign',
  'Bad Weather', 'Elephant Fright',
  'Two Legions of Slaves Raised The Volones', 'Allied Auxiliaries',
  'Allied Auxiliaries', 'Allied Auxiliaries', 'Allied Auxiliaries',
  'Allied Auxiliaries', 'Opposing Fleet Breaks Siege', 'Adriatic Pirates',
  'Epidemic', 'Prestilence', 'Tribal Resistance', 'Treachery within City',
  'Messenger Intercepted', 'Grain Shortage', 'Hanno Counsels Carthage',
  'Cato Counsels Rome', 'Ally Deserts', 'Storms at Sea',
  'Force March', 'Force March', 'Force March', 'Truce',
]

// ── カードメタデータ（Section 8 準拠）────────────────────────────────
// side: 'R'=Rome only, 'C'=Carthage only, 'E'=Either player
// ops: Operation Number (1–3)
// counter: Counter Event（相手のターン中も使用可）
// remove: REMOVE IF PLAYED（使用後ゲームから廃棄）
// naval: 船マーク付き（海上移動に使用可）
const CARD_META: Array<{
  ops: 1 | 2 | 3
  side: 'R' | 'C' | 'E'
  counter: boolean
  remove: boolean
  naval: boolean
}> = [
  // 1  Corsica and Sardinia Revolt
  { ops: 2, side: 'R', counter: false, remove: false, naval: false },
  // 2  Sicilia Revolts
  { ops: 1, side: 'R', counter: false, remove: false, naval: false },
  // 3  Numidia Revolts
  { ops: 2, side: 'R', counter: false, remove: false, naval: false },
  // 4  Celtiberia Revolts
  { ops: 2, side: 'R', counter: false, remove: false, naval: false },
  // 5  Native Guide
  { ops: 1, side: 'E', counter: false, remove: false, naval: false },
  // 6  Marharbal's Cavalry
  { ops: 2, side: 'C', counter: false, remove: false, naval: false },
  // 7  Hostile Tribes
  { ops: 1, side: 'E', counter: true,  remove: false, naval: false },
  // 8  Hostile Tribes
  { ops: 1, side: 'E', counter: true,  remove: false, naval: false },
  // 9  Philip V Of Macedon Allies with Carthage
  { ops: 3, side: 'C', counter: false, remove: true,  naval: false },
  // 10 Macedonian Reinforcements
  { ops: 2, side: 'C', counter: false, remove: false, naval: false },
  // 11 Balearic Slingers
  { ops: 2, side: 'C', counter: false, remove: false, naval: false },
  // 12 African Reinforcements
  { ops: 3, side: 'C', counter: false, remove: false, naval: false },
  // 13 Bruttium Recruits
  { ops: 2, side: 'C', counter: false, remove: false, naval: false },
  // 14 Ligurian Recruits
  { ops: 2, side: 'C', counter: false, remove: false, naval: false },
  // 15 Iberian Recruits
  { ops: 2, side: 'C', counter: false, remove: false, naval: false },
  // 16 Gallic Recruits
  { ops: 3, side: 'C', counter: false, remove: false, naval: false },
  // 17 Surprise Sortie
  { ops: 2, side: 'E', counter: false, remove: false, naval: false },
  // 18 Traitor in Tarentum
  { ops: 2, side: 'C', counter: false, remove: true,  naval: false },
  // 19 Senate Dismisses Proconsul
  { ops: 2, side: 'R', counter: false, remove: false, naval: false },
  // 20 Spy in Enemy Camp
  { ops: 1, side: 'E', counter: true,  remove: false, naval: false },
  // 21 Mercenaries Desert
  { ops: 2, side: 'E', counter: false, remove: false, naval: false },
  // 22 Mutin's Numidians
  { ops: 1, side: 'R', counter: false, remove: false, naval: false },
  // 23 Numidian Ally
  { ops: 2, side: 'C', counter: false, remove: false, naval: false },
  // 24 The beautiful Sophonisba seduces a Numidian king
  { ops: 2, side: 'C', counter: false, remove: true,  naval: false },
  // 25 Capua Sides with Carthage
  { ops: 3, side: 'C', counter: false, remove: true,  naval: false },
  // 26 Syracuse allies with Carthage
  { ops: 2, side: 'C', counter: false, remove: true,  naval: false },
  // 27 I have come into Italy
  { ops: 3, side: 'C', counter: false, remove: true,  naval: false },
  // 28 Hannibal Charms Italy
  { ops: 2, side: 'C', counter: false, remove: false, naval: false },
  // 29 Carthaginian Naval Victory
  { ops: 2, side: 'C', counter: false, remove: true,  naval: false },
  // 30 Carthaginian Siege Train
  { ops: 3, side: 'C', counter: false, remove: false, naval: false },
  // 31 Spanish Allies Desert
  { ops: 2, side: 'R', counter: false, remove: false, naval: false },
  // 32 Numumidian Allies Desert
  { ops: 2, side: 'R', counter: false, remove: false, naval: false },
  // 33 Major Campaign
  { ops: 3, side: 'E', counter: false, remove: false, naval: true  },
  // 34 Major Campaign
  { ops: 3, side: 'E', counter: false, remove: false, naval: true  },
  // 35 Diplomacy
  { ops: 2, side: 'E', counter: false, remove: false, naval: false },
  // 36 Diplomacy
  { ops: 2, side: 'E', counter: false, remove: false, naval: false },
  // 37 Minor Campaign
  { ops: 2, side: 'E', counter: false, remove: false, naval: true  },
  // 38 Minor Campaign
  { ops: 2, side: 'E', counter: false, remove: false, naval: true  },
  // 39 Minor Campaign
  { ops: 2, side: 'E', counter: false, remove: false, naval: true  },
  // 40 Minor Campaign
  { ops: 2, side: 'E', counter: false, remove: false, naval: true  },
  // 41 Bad Weather
  { ops: 1, side: 'E', counter: true,  remove: false, naval: false },
  // 42 Elephant Fright
  { ops: 1, side: 'R', counter: true,  remove: false, naval: false },
  // 43 Two Legions of Slaves Raised The Volones
  { ops: 3, side: 'R', counter: false, remove: true,  naval: false },
  // 44 Allied Auxiliaries
  { ops: 2, side: 'E', counter: false, remove: false, naval: false },
  // 45 Allied Auxiliaries
  { ops: 2, side: 'E', counter: false, remove: false, naval: false },
  // 46 Allied Auxiliaries
  { ops: 2, side: 'E', counter: false, remove: false, naval: false },
  // 47 Allied Auxiliaries
  { ops: 2, side: 'E', counter: false, remove: false, naval: false },
  // 48 Allied Auxiliaries
  { ops: 2, side: 'E', counter: false, remove: false, naval: false },
  // 49 Opposing Fleet Breaks Siege
  { ops: 2, side: 'E', counter: false, remove: false, naval: false },
  // 50 Adriatic Pirates
  { ops: 1, side: 'C', counter: false, remove: false, naval: false },
  // 51 Epidemic
  { ops: 1, side: 'E', counter: false, remove: false, naval: false },
  // 52 Prestilence
  { ops: 1, side: 'E', counter: false, remove: false, naval: false },
  // 53 Tribal Resistance
  { ops: 2, side: 'R', counter: false, remove: false, naval: false },
  // 54 Treachery within City
  { ops: 2, side: 'E', counter: false, remove: false, naval: false },
  // 55 Messenger Intercepted
  { ops: 1, side: 'E', counter: true,  remove: false, naval: false },
  // 56 Grain Shortage
  { ops: 1, side: 'E', counter: false, remove: false, naval: false },
  // 57 Hanno Counsels Carthage
  { ops: 2, side: 'R', counter: false, remove: false, naval: false },
  // 58 Cato Counsels Rome
  { ops: 2, side: 'C', counter: false, remove: false, naval: false },
  // 59 Ally Deserts
  { ops: 2, side: 'E', counter: false, remove: false, naval: false },
  // 60 Storms at Sea
  { ops: 1, side: 'E', counter: true,  remove: false, naval: false },
  // 61 Force March
  { ops: 3, side: 'E', counter: false, remove: false, naval: true  },
  // 62 Force March
  { ops: 3, side: 'E', counter: false, remove: false, naval: true  },
  // 63 Force March
  { ops: 3, side: 'E', counter: false, remove: false, naval: true  },
  // 64 Truce
  { ops: 1, side: 'E', counter: false, remove: false, naval: false },
]

export const STRATEGY_DECK = STRATEGY_CARD_NAMES.map((name, i) => ({
  name,
  imagePath: `/images/cards-strg-${String(i + 1).padStart(2, '0')} ${name}.png`,
  ...(CARD_META[i] ?? { ops: 1 as const, side: 'E' as const, counter: false, remove: false, naval: false }),
}))

// ── バトルカードデッキ定義 ────────────────────────────────────────────
export const BATTLE_CARD_TYPES = [
  { name: 'Frontal Assault',    count: 12, imagePath: '/images/cards-btl-Frontal Assault.png' },
  { name: 'Flank Left',         count: 9,  imagePath: '/images/cards-btl-Flank Left.png' },
  { name: 'Flank Right',        count: 9,  imagePath: '/images/cards-btl-Flank Right.png' },
  { name: 'Probe',              count: 8,  imagePath: '/images/cards-btl-Probe.png' },
  { name: 'Double Envelopment', count: 6,  imagePath: '/images/cards-btl-Double Envelopment.png' },
  { name: 'Reserve',            count: 4,  imagePath: '/images/cards-btl-Reserve.png' },
] as const

// FULL_BATTLE_DECK kept for reference
const _FULL_BATTLE_DECK = BATTLE_CARD_TYPES.flatMap(({ name, count, imagePath }) =>
  Array.from({ length: count }, () => ({ name, imagePath }))
)
void _FULL_BATTLE_DECK

// ── カード表示定数 ────────────────────────────────────────────────────
export const PRIORITY_STYLE: Record<string, { bg: string; fg: string }> = {
  A: { bg: '#dc2626', fg: '#fff' },
  B: { bg: '#ea580c', fg: '#fff' },
  C: { bg: '#ca8a04', fg: '#000' },
  D: { bg: '#16a34a', fg: '#fff' },
  E: { bg: '#475569', fg: '#fff' },
}

export const SIDE_LABEL: Record<'R' | 'C' | 'E', string> = {
  R: 'Rome Only',
  C: 'Carthage Only',
  E: 'Either Player',
}

export const SIDE_COLOR: Record<'R' | 'C' | 'E', string> = {
  R: '#60a5fa',
  C: '#f87171',
  E: '#a78bfa',
}

export function makeShuffledDeck() {
  return shuffle([...STRATEGY_DECK])
}
