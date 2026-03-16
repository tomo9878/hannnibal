import type { GamePhase } from '../types'

export const GAME_PHASES: GamePhase[] = ['Strategy', 'Action', 'Attrition', 'PC', 'Consular']

export const PHASE_LABELS: Record<GamePhase, string> = {
  Strategy:  'Strategy Phase',
  Action:    'Action Rounds',
  Attrition: 'Attrition Phase',
  PC:        'PC Adjustment Phase',
  Consular:  'Consular Phase',
}

export const PHASE_RULES: Record<GamePhase, string> = {
  Strategy:
    '各陣営にカードを配布します（Turn 1: Rome 7枚 / Turn 2: Rome 8枚 / Turn 3+: Rome 9枚、Carthage 常に9枚）。「Deal Cards」を押すと配布されます。ローマのカードは裏向き（隠蔽）です。',
  Action:
    'Action Roundsです。交互にカードをプレイします。将軍を活性化するにはその将軍のSR以上のOpsカードが必要。Stuka Joe判定: 2〜7 → Ops（作戦値）、8〜12 → Event（イベント）としてプレイ。',
  Attrition:
    'Attrition Phaseです。山岳・沼地・難地形にいる部隊は消耗チェックを行います。各将軍につきd6を振り、5〜6が出たらCUを1つ失います（海峡越え・冬営地も追加チェック対象）。',
  PC:
    'PC調整Phaseです。Hannibalがいるイタリアの未占領都市にRome PCを1つ配置。Scipio Africanusがいる場合はHispaniaも対象。アフリカのRome占領都市はCarthage PCに戻します。\n⚠️【補給線チェック（手動）】各陣営の首都から、自陣営のPCまたは将軍を辿って到達できない孤立PCを盤面から取り除いてください（Rome: Latium-Rome起点 / Carthage: Carthage起点）。',
  Consular:
    'Consular Phaseです。「Execute Election」でローマの執政官2名をランダム選出し、Consul/Proconsulを任命。両名はRomeに自動配置されます。その後ゲームは次のターンへ進みます。',
}

export const PRIORITIES = ['A', 'B', 'C', 'D', 'E'] as const

export function getCardCounts(turn: number): { rome: number; carthage: number } {
  if (turn === 1) return { rome: 7, carthage: 9 }
  if (turn === 2) return { rome: 8, carthage: 9 }
  return { rome: 9, carthage: 9 }
}

export const ROME_GENERALS_LIST = [
  'P. Scipio', 'T. Longus', 'Fabius', 'Marcellus', 'G. Nero',
  'A. Paulus', 'Flaminius', 'Varro', 'Scipio Africanus',
]

export const ROME_CITY_POS = { x: 1748, y: 729 }
