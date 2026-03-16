import type { CardInHand, CardSlot, SideDisplay, FateDieFace, SlotId, CDGSoloState } from '../types'
import { shuffle } from '../utils'

// ── 定数 ──────────────────────────────────────────────────────────────

/** Fate Die 各面 → 対象スロット のマッピング */
export const FATE_SLOTS: Record<FateDieFace, SlotId[]> = {
  'C<!!' : ['A', 'B'],              // Hannibal では AB フォールバック
  'e<'   : ['A', 'B', 'C', 'D', 'E'], // 全スロット対象だが Event 限定制約あり
  'ABC'  : ['A', 'B', 'C'],
  'AB'   : ['A', 'B'],
  'CDE'  : ['C', 'D', 'E'],
  'DE'   : ['D', 'E'],
}

/** ダイスの全6面（均等確率） */
const FATE_FACES: FateDieFace[] = ['C<!!', 'e<', 'ABC', 'AB', 'CDE', 'DE']

/** スロット順序（A が index 0） */
const SLOT_ORDER: SlotId[] = ['A', 'B', 'C', 'D', 'E']

// ── ダイス ────────────────────────────────────────────────────────────

/** Fate Die を1回振る（均等 1/6） */
export function rollFateDie(): FateDieFace {
  return FATE_FACES[Math.floor(Math.random() * FATE_FACES.length)]
}

// ── セットアップ ──────────────────────────────────────────────────────

/**
 * 陣営の初期カードディスプレイを構築する。
 * @param dealt  5枚のカード（スロット A〜E に配置）
 * @param stock  残りの取り置きカード（Max Hand Size - 5 枚）
 * @param maxHandSize そのターンの最大手札数
 */
export function initSideDisplay(
  dealt: CardInHand[],
  stock: CardInHand[],
  maxHandSize: number,
): SideDisplay {
  const slots = SLOT_ORDER.map((slotId, i): CardSlot => ({
    slotId,
    card: dealt[i]
      ? { ...dealt[i], slotId, isRevealed: slotId === 'A' || slotId === 'B' }
      : null,
    // A・B スロットは初期から表向き
    faceUp: slotId === 'A' || slotId === 'B',
  })) as [CardSlot, CardSlot, CardSlot, CardSlot, CardSlot]

  return { slots, cardsRemaining: maxHandSize, maxHandSize, stock }
}

// ── スロット操作 ──────────────────────────────────────────────────────

/**
 * 空きスロットにカードを裏向きで補充する。
 * 呼び出し元がカードを渡す（ストック or 山札から引いたもの）。
 */
export function refillSlot(
  display: SideDisplay,
  slotId: SlotId,
  newCard: CardInHand,
): SideDisplay {
  const slots = display.slots.map(s =>
    s.slotId === slotId
      ? { ...s, card: { ...newCard, slotId, isRevealed: false }, faceUp: false }
      : s,
  ) as [CardSlot, CardSlot, CardSlot, CardSlot, CardSlot]
  return { ...display, slots }
}

/**
 * Fate Die ロール後に対象スロットを表向きにする。
 * 既に表向きのスロットはそのまま。
 */
export function flipSlotsForDisplay(
  display: SideDisplay,
  targetSlots: SlotId[],
): SideDisplay {
  const slots = display.slots.map(s => {
    if (!targetSlots.includes(s.slotId)) return s
    // カードあり → 表向きにして isRevealed も true に
    return {
      ...s,
      faceUp: true,
      card: s.card ? { ...s.card, isRevealed: true } : null,
    }
  }) as [CardSlot, CardSlot, CardSlot, CardSlot, CardSlot]
  return { ...display, slots }
}

/**
 * 指定スロットからカードを取り出し（スロットを空にする）。
 * ※ 補充は呼び出し元が refillSlot で行う。
 */
export function removeCardFromSlot(
  display: SideDisplay,
  slotId: SlotId,
): SideDisplay {
  const slots = display.slots.map(s =>
    s.slotId === slotId ? { ...s, card: null, faceUp: false } : s,
  ) as [CardSlot, CardSlot, CardSlot, CardSlot, CardSlot]
  return { ...display, slots }
}

/**
 * ストックから指定インデックスのカードを取り除く（プレイヤーが直接ストックカードをプレイした場合）。
 * cardsRemaining も -1 する。
 */
export function removeStockCard(
  display: SideDisplay,
  stockIndex: number,
): SideDisplay {
  const stock = display.stock.filter((_, i) => i !== stockIndex)
  return { ...display, stock, cardsRemaining: display.cardsRemaining - 1 }
}

// ── カード選択ロジック ────────────────────────────────────────────────

/**
 * Fate Die 結果に応じて選択可能なカードを返す。
 * - 表向きかつ card が存在するスロットのみ対象
 * - e< の場合は最低 OPS 値カードのみ（同値複数は全て返す）
 *
 * @returns 各要素は { slot, constraint }
 *   constraint: 'free' = OPS/Event 自由選択
 *               'event_only' = Event としてのみ使用可
 */
export function getAvailableCards(
  display: SideDisplay,
  face: FateDieFace,
): Array<{ slot: CardSlot; constraint: 'free' | 'event_only' }> {
  const targetSlots = FATE_SLOTS[face]
  const candidates = display.slots.filter(
    s => targetSlots.includes(s.slotId) && s.faceUp && s.card !== null,
  )

  if (face !== 'e<') {
    return candidates.map(slot => ({ slot, constraint: 'free' }))
  }

  // e< : 最低 OPS 値のカードのみ Event 限定で選択可
  const minOps = Math.min(...candidates.map(s => s.card!.ops))
  return candidates
    .filter(s => s.card!.ops === minOps)
    .map(slot => ({ slot, constraint: 'event_only' as const }))
}

/**
 * 表向きカードの最低 OPS 値を返す（e< 制約の表示用）。
 * 表向きカードがない場合は Infinity を返す。
 */
export function getLowestOpsValue(display: SideDisplay): number {
  const faceUpOps = display.slots
    .filter(s => s.faceUp && s.card)
    .map(s => s.card!.ops)
  return faceUpOps.length > 0 ? Math.min(...faceUpOps) : Infinity
}

// ── ストック管理 ──────────────────────────────────────────────────────

/**
 * ストックから1枚取り出す。
 * ストックが空の場合は null を返す（山札から引く必要あり）。
 */
export function popFromStock(
  display: SideDisplay,
): { card: CardInHand; updatedDisplay: SideDisplay } | null {
  if (display.stock.length === 0) return null
  const [card, ...rest] = display.stock
  return { card, updatedDisplay: { ...display, stock: rest } }
}

// ── CDGSoloState 全体操作 ────────────────────────────────────────────

/**
 * Fate Die ロール後の state を生成する。
 * 対象スロットを表向きにし、phase を 'rolled' に更新。
 */
export function applyFateDieRoll(
  state: CDGSoloState,
  face: FateDieFace,
  activeSide: 'Rome' | 'Carthage',
): CDGSoloState {
  const targetSlots = FATE_SLOTS[face]
  const sideKey = activeSide === 'Rome' ? 'rome' : 'carthage'
  const updated = flipSlotsForDisplay(state[sideKey], targetSlots)

  return {
    ...state,
    [sideKey]: updated,
    fateDieResult: face,
    availableSlots: targetSlots,
    constraint: face === 'e<' ? 'event_only' : 'free',
    phase: 'rolled',
  }
}

/**
 * カードプレイ後の state を生成する。
 * - 指定スロットを空にする
 * - ストックがあればストックから補充、なければ呼び出し元から渡された newCard を使用
 * - cardsRemaining を -1
 * - phase を 'played' にリセット
 */
export function applyCardPlayed(
  state: CDGSoloState,
  activeSide: 'Rome' | 'Carthage',
  slotId: SlotId,
  newCard: CardInHand,             // ストック or 山札から引いたカード
): CDGSoloState {
  const sideKey = activeSide === 'Rome' ? 'rome' : 'carthage'
  let sideDisplay = state[sideKey]

  // スロットを空にする
  sideDisplay = removeCardFromSlot(sideDisplay, slotId)

  // 裏向きで補充
  sideDisplay = refillSlot(sideDisplay, slotId, newCard)

  // Cards Remaining -1
  sideDisplay = { ...sideDisplay, cardsRemaining: sideDisplay.cardsRemaining - 1 }

  return {
    ...state,
    [sideKey]: sideDisplay,
    fateDieResult: null,
    availableSlots: [],
    constraint: 'free',
    phase: 'idle',
  }
}

// ── シングルデッキ配布 ────────────────────────────────────────────────

/**
 * シングルデッキから Rome・Carthage 両陣営の初期ディスプレイを構築する。
 *
 * 配布順: A-Rome, A-Carth, B-Rome, B-Carth, C-Rome, C-Carth, D-Rome, D-Carth, E-Rome, E-Carth
 * 残り (romeMax-5) 枚 → Rome ストック
 * 残り (carthMax-5) 枚 → Carthage ストック
 *
 * @returns { rome, carthage, remainingDeck }
 */
export function dealInitialHands(
  deck: CardInHand[],
  romeMax: number,
  carthMax: number,
): { rome: SideDisplay; carthage: SideDisplay; remainingDeck: CardInHand[] } {
  const shuffled = shuffle([...deck])

  // 5枚ずつ交互に抜き出す
  const romeSlot: CardInHand[] = []
  const carthSlot: CardInHand[] = []
  for (let i = 0; i < 5; i++) {
    romeSlot.push(shuffled[i * 2])
    carthSlot.push(shuffled[i * 2 + 1])
  }
  let cursor = 10

  // ストック
  const romeStock  = shuffled.slice(cursor, cursor + (romeMax - 5))
  cursor += romeMax - 5
  const carthStock = shuffled.slice(cursor, cursor + (carthMax - 5))
  cursor += carthMax - 5

  const remainingDeck = shuffled.slice(cursor)

  return {
    rome:    initSideDisplay(romeSlot,  romeStock,  romeMax),
    carthage: initSideDisplay(carthSlot, carthStock, carthMax),
    remainingDeck,
  }
}
