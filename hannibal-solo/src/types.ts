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
  slotId?: SlotId           // CDG Solo: どのスロットに配置されているか
}

export type ActivePlayer = 'Carthage' | 'Rome'

export interface SelectedCard {
  fromSide: 'Rome' | 'Carthage'
  index: number
  card: CardInHand
  slotId?: SlotId           // CDG Solo: 選択元スロット
  constraint?: 'free' | 'event_only'  // CDG Solo: e< 制約
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

// ── CDG Solo System 型定義 ─────────────────────────────────────────────

/** Card Display のスロット識別子（A=常時表向き, B=常時表向き, C/D/E=裏向き） */
export type SlotId = 'A' | 'B' | 'C' | 'D' | 'E'

/** Fate Die の6面 */
export type FateDieFace = 'C<!!' | 'e<' | 'ABC' | 'AB' | 'CDE' | 'DE'

/**
 * 各スロットの状態
 * - faceUp: 表向きかどうか（A/B は初期 true、C/D/E は初期 false）
 * - card: null = スロットが空（補充待ち）
 */
export interface CardSlot {
  slotId: SlotId
  card: CardInHand | null
  faceUp: boolean
}

/**
 * 陣営ごとのカードディスプレイ全体の状態
 * - slots: 常に5要素（A〜E 順）
 * - stock: スロット外の取り置きカード（Max Hand Size - 5 枚）
 *   山札から補充する前にここから取る
 */
export interface SideDisplay {
  slots: [CardSlot, CardSlot, CardSlot, CardSlot, CardSlot]
  cardsRemaining: number
  maxHandSize: number
  stock: CardInHand[]
}

/**
 * CDG Solo システム全体の状態（App.tsx で管理）
 * phase:
 *   'idle'      = ダイス未ロール（ターン開始前）
 *   'rolled'    = ダイスロール済み・カード未選択
 *   'selecting' = カード選択中（CardActionModal 表示前）
 *   'played'    = カードプレイ済み・補充完了
 */
export interface CDGSoloState {
  rome: SideDisplay
  carthage: SideDisplay
  fateDieResult: FateDieFace | null
  availableSlots: SlotId[]
  /** e< 結果時の制約: 全スロット対象だが Event のみ / 通常時は free */
  constraint: 'free' | 'event_only'
  phase: 'idle' | 'rolled' | 'selecting' | 'played'
}
