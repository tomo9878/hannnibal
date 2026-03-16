import type { BoardPiece, CardInHand, LogEntry, RemovedCard, GamePhase, CDGSoloState } from './types'

export const SAVE_KEY = 'hannibal-solo-v2'  // v1 → v2 で旧セーブと非互換にする

export interface SaveData {
  playerSide:   'Rome' | 'Carthage'
  pieces:       BoardPiece[]
  currentTurn:  number
  currentPhase: GamePhase
  consul:       string
  proconsul:    string
  gameLog:      LogEntry[]
  stratDeck:    CardInHand[]
  stratDiscard: RemovedCard[]
  stratRemoved: RemovedCard[]
  cdgSolo:      CDGSoloState | null   // romeHand / carthageHand / cardsDealt を置き換え
  activePlayer: 'Rome' | 'Carthage'
  savedAt:      string
}

export function loadSave(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    return raw ? (JSON.parse(raw) as SaveData) : null
  } catch {
    return null
  }
}

export function writeSave(data: SaveData): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data))
  } catch {
    // storage full etc.
  }
}

export function deleteSave(): void {
  localStorage.removeItem(SAVE_KEY)
  localStorage.removeItem('hannibal-solo-v1')  // 旧キーも削除
}
