import type { CardInHand, ActivePlayer, SelectedCard, SetPreviewFn } from '../types'
import { CardTile } from './CardTile'

export function StrategyHandPanel({
  romeHand, carthageHand,
  activePlayer, isActionPhase,
  onRevealRome, onSelectCard, setPreview,
}: {
  romeHand: CardInHand[]
  carthageHand: CardInHand[]
  activePlayer: ActivePlayer
  isActionPhase: boolean
  onRevealRome: (idx: number) => void
  onSelectCard: (sel: SelectedCard) => void
  setPreview: SetPreviewFn
}) {
  if (romeHand.length === 0 && carthageHand.length === 0) return null

  const romeActive     = isActionPhase && activePlayer === 'Rome'
  const carthageActive = isActionPhase && activePlayer === 'Carthage'

  const handleCardClick = (fromSide: 'Rome' | 'Carthage', index: number, card: CardInHand) => {
    if (!isActionPhase) return
    if (fromSide === 'Rome' && activePlayer !== 'Rome') return
    if (fromSide === 'Carthage' && activePlayer !== 'Carthage') return
    onSelectCard({ fromSide, index, card })
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Action Phase ターン表示 */}
      {isActionPhase && (
        <div style={{
          padding: '6px 12px', borderRadius: 6, textAlign: 'center', fontWeight: 700, fontSize: 12,
          background: activePlayer === 'Carthage' ? 'rgba(96,165,250,0.15)' : 'rgba(239,68,68,0.15)',
          border: `1px solid ${activePlayer === 'Carthage' ? '#60a5fa' : '#ef4444'}55`,
          color: activePlayer === 'Carthage' ? '#60a5fa' : '#f87171',
        }}>
          {activePlayer} のターン — カードを選択して使用方法を決定してください
        </div>
      )}

      {/* Rome Hand (face-down) */}
      {romeHand.length > 0 && (
        <div style={{
          background: 'rgba(15,23,42,0.7)',
          border: romeActive ? '1px solid rgba(96,165,250,0.6)' : '1px solid rgba(51,65,85,0.6)',
          borderRadius: 8, padding: 12,
          opacity: isActionPhase && activePlayer === 'Carthage' ? 0.5 : 1,
          transition: 'opacity 0.2s',
        }}>
          <h3 style={{ color: '#60a5fa', fontWeight: 700, fontSize: 11,
            textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Rome Hand ({romeHand.length}枚)
            {!romeActive && <span style={{ color: '#475569', fontWeight: 400, marginLeft: 8, textTransform: 'none', letterSpacing: 0 }}>— クリックで公開</span>}
            {romeActive && <span style={{ color: '#93c5fd', fontWeight: 400, marginLeft: 8, textTransform: 'none', letterSpacing: 0 }}>— カードをクリックして使用</span>}
          </h3>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {romeHand.map((card, i) => (
              <div
                key={i}
                onClick={() => card.isRevealed && romeActive
                  ? handleCardClick('Rome', i, card)
                  : !card.isRevealed && onRevealRome(i)
                }
                style={{ cursor: isActionPhase && activePlayer === 'Rome' && card.isRevealed ? 'pointer' : undefined }}
              >
                <CardTile
                  card={card}
                  onReveal={() => onRevealRome(i)}
                  onPreview={setPreview}
                  onPreviewEnd={() => setPreview(null)}
                  selectable={romeActive && card.isRevealed}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Carthage Hand (face-up) */}
      {carthageHand.length > 0 && (
        <div style={{
          background: 'rgba(15,23,42,0.7)',
          border: carthageActive ? '1px solid rgba(239,68,68,0.6)' : '1px solid rgba(51,65,85,0.6)',
          borderRadius: 8, padding: 12,
          opacity: isActionPhase && activePlayer === 'Rome' ? 0.5 : 1,
          transition: 'opacity 0.2s',
        }}>
          <h3 style={{ color: '#f87171', fontWeight: 700, fontSize: 11,
            textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Carthage Hand ({carthageHand.length}枚)
            {carthageActive && <span style={{ color: '#fca5a5', fontWeight: 400, marginLeft: 8, textTransform: 'none', letterSpacing: 0 }}>— カードをクリックして使用</span>}
          </h3>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {carthageHand.map((card, i) => (
              <div
                key={i}
                onClick={() => carthageActive ? handleCardClick('Carthage', i, card) : undefined}
                style={{ cursor: carthageActive ? 'pointer' : undefined }}
              >
                <CardTile
                  card={card}
                  onPreview={setPreview}
                  onPreviewEnd={() => setPreview(null)}
                  selectable={carthageActive}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
