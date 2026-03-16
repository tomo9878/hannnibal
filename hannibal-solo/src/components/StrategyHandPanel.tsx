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

  const activeSideDisplay = activePlayer === 'Rome' ? cdgSolo.rome : cdgSolo.carthage

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

      {/* Fate Die パネル（アクティブサイドのみ） */}
      <FateDiePanel
        activeSide={activePlayer}
        cardsRemaining={activeSideDisplay.cardsRemaining}
        result={cdgSolo.fateDieResult}
        constraint={cdgSolo.constraint}
        onRoll={onFateRoll}
        disabled={cdgSolo.phase === 'rolled' || activeSideDisplay.cardsRemaining <= 0}
      />

      {/* Carthage Card Display */}
      <CDGCardDisplay
        side="Carthage"
        display={cdgSolo.carthage}
        isActive={isActionPhase && activePlayer === 'Carthage'}
        isPlayerSide={playerSide === 'Carthage'}
        fateDieFace={activePlayer === 'Carthage' ? cdgSolo.fateDieResult : null}
        constraint={activePlayer === 'Carthage' ? cdgSolo.constraint : 'free'}
        onSelectCard={onSelectCard}
        setPreview={setPreview}
      />

      {/* Rome Card Display */}
      <CDGCardDisplay
        side="Rome"
        display={cdgSolo.rome}
        isActive={isActionPhase && activePlayer === 'Rome'}
        isPlayerSide={playerSide === 'Rome'}
        fateDieFace={activePlayer === 'Rome' ? cdgSolo.fateDieResult : null}
        constraint={activePlayer === 'Rome' ? cdgSolo.constraint : 'free'}
        onSelectCard={onSelectCard}
        setPreview={setPreview}
      />
    </div>
  )
}
