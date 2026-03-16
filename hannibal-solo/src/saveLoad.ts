import type { BoardPiece, CardInHand, LogEntry, RemovedCard, GamePhase } from './types'

export const SAVE_KEY = 'hannibal-solo-v1'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyCard = any

export interface SaveData {
  playerSide:   'Rome' | 'Carthage'
  pieces:       BoardPiece[]
  currentTurn:  number
  currentPhase: GamePhase
  consul:       string
  proconsul:    string
  gameLog:      LogEntry[]
  stratDeck:    AnyCard[]
  stratDiscard: AnyCard[]
  stratRemoved: RemovedCard[]
  romeHand:     CardInHand[]
  carthageHand: CardInHand[]
  cardsDealt:   boolean
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
}
