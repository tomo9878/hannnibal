// ── 共通型定義 ────────────────────────────────────────────────────────

export type GamePhase = 'Strategy' | 'Action' | 'Attrition' | 'PC' | 'Consular'

export interface LogEntry {
  id: number
  turn: number
  phase: GamePhase
  message: string
}

export type City = { name: string; x: number; y: number }

export interface CardInHand {
  name: string
  imagePath: string
  priority: string
  isRevealed: boolean
  ops: 1 | 2 | 3
  side: 'R' | 'C' | 'E'   // R=Rome only, C=Carthage only, E=Either
  counter: boolean          // Counter Event
  remove: boolean           // REMOVE IF PLAYED
  naval: boolean            // ship symbol (naval movement)
}

export type ActivePlayer = 'Carthage' | 'Rome'

export interface SelectedCard {
  fromSide: 'Rome' | 'Carthage'
  index: number
  card: CardInHand
}

export interface DiceResult {
  d1: number
  d2: number
  total: number
  verdict: string
}

export interface BattleRoundRecord {
  round: number
  atk: string
  def: string
  matched: boolean
  result: 'matched' | 'unmatched' | 'defeat'
}

export interface BoardPiece {
  id: string
  type: 'General' | 'CU' | 'PC'
  x: number
  y: number
  imagePath: string
  label?: string
  strength?: number
}

export type SelectionState =
  | { kind: 'general'; pieceId: string }
  | { kind: 'city';    cityName: string }
  | null

export interface DragState {
  pieceId: string
  offsetX: number
  offsetY: number
  currentX: number
  currentY: number
}

export type PreviewData =
  | { kind: 'card';   name: string; imagePath: string; isBack: boolean; priority: string }
  | { kind: 'piece';  piece: BoardPiece; stackedWith: BoardPiece[] }
  | { kind: 'city';   city: City; pieces: BoardPiece[] }
  | null

export type SetPreviewFn = (data: PreviewData) => void

export type RemovedCard = {
  name: string
  imagePath: string
  ops: 1 | 2 | 3
  side: 'R' | 'C' | 'E'
  counter: boolean
  remove: boolean
  naval: boolean
}
