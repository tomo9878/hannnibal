import type { ActivePlayer, CDGSoloState, SelectedCard, SetPreviewFn } from '../types'
import { FateDiePanel }    from './FateDiePanel'
import { CDGCardDisplay }  from './CDGCardDisplay'

export function StrategyHandPanel({
  cdgSolo,
  activePlayer,
  isActionPhase,
  playerSide,
  onFateRoll,
  onSelectCard,
  setPreview,
}: {
  cdgSolo: CDGSoloState | null
  activePlayer: ActivePlayer
  isActionPhase: boolean
  playerSide: 'Rome' | 'Carthage'
  onFateRoll: () => void
  onSelectCard: (sel: SelectedCard) => void
  setPreview: SetPreviewFn
}) {
  if (!cdgSolo) return null
  if (!isActionPhase) return null

  const isPlayerTurn = activePlayer === playerSide
  const aiSide: 'Rome' | 'Carthage' = playerSide === 'Rome' ? 'Carthage' : 'Rome'
  const activeSideDisplay = activePlayer === 'Rome' ? cdgSolo.rome : cdgSolo.carthage

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

      {/* Fate Die パネル: AI のターンのみ表示 */}
      {!isPlayerTurn && (
        <FateDiePanel
          activeSide={activePlayer}
          cardsRemaining={activeSideDisplay.cardsRemaining}
          result={cdgSolo.fateDieResult}
          constraint={cdgSolo.constraint}
          onRoll={onFateRoll}
          disabled={cdgSolo.phase === 'rolled' || activeSideDisplay.cardsRemaining <= 0}
        />
      )}

      {/* プレイヤーターン: 自由選択ガイド */}
      {isPlayerTurn && (
        <div style={{
          padding: '6px 12px', borderRadius: 6, textAlign: 'center',
          fontWeight: 700, fontSize: 12,
          background: playerSide === 'Carthage' ? 'rgba(96,165,250,0.12)' : 'rgba(248,113,113,0.12)',
          border: `1px solid ${playerSide === 'Carthage' ? '#60a5fa55' : '#f8717155'}`,
          color: playerSide === 'Carthage' ? '#60a5fa' : '#f87171',
        }}>
          {playerSide} のターン — カードを自由に選択してください
        </div>
      )}

      {/* プレイヤーの Card Display（自由選択モード） */}
      <CDGCardDisplay
        side={playerSide}
        display={cdgSolo[playerSide === 'Rome' ? 'rome' : 'carthage']}
        isActive={isPlayerTurn}
        isPlayerSide={true}
        freeSelect={true}
        fateDieFace={null}
        constraint="free"
        onSelectCard={onSelectCard}
        setPreview={setPreview}
      />

      {/* AI の Card Display（Fate Die 制約モード） */}
      <CDGCardDisplay
        side={aiSide}
        display={cdgSolo[aiSide === 'Rome' ? 'rome' : 'carthage']}
        isActive={!isPlayerTurn}
        isPlayerSide={false}
        freeSelect={false}
        fateDieFace={!isPlayerTurn ? cdgSolo.fateDieResult : null}
        constraint={!isPlayerTurn ? cdgSolo.constraint : 'free'}
        onSelectCard={onSelectCard}
        setPreview={setPreview}
      />
    </div>
  )
}
