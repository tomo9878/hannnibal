import type { GamePhase } from '../types'
import { PHASE_LABELS, GAME_PHASES } from '../data/gameConstants'

const PHASE_COLORS: Record<GamePhase, string> = {
  Strategy:  '#10b981',
  Action:    '#3b82f6',
  Attrition: '#f59e0b',
  PC:        '#8b5cf6',
  Consular:  '#ef4444',
}

export function GameEngineBar({
  currentTurn,
  currentPhase,
  cardsDealt,
  stratDeckSize,
  consul,
  proconsul,
  playerSide,
  onNextPhase,
  onDealCards,
  onElection,
  onNewGame,
}: {
  currentTurn: number
  currentPhase: GamePhase
  cardsDealt: boolean
  stratDeckSize: number
  consul: string
  proconsul: string
  playerSide: 'Rome' | 'Carthage'
  onNextPhase: () => void
  onDealCards: () => void
  onElection: () => void
  onNewGame: () => void
}) {
  const color = PHASE_COLORS[currentPhase]

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '8px 16px',
      background: 'rgba(15, 23, 42, 0.95)',
      borderBottom: `2px solid ${color}`,
      flexShrink: 0,
      flexWrap: 'wrap',
    }}>
      {/* Turn indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Turn</span>
        <span style={{ fontSize: 22, fontWeight: 900, color: '#f0e6b0', lineHeight: 1 }}>{currentTurn}</span>
        <span style={{ fontSize: 11, color: '#64748b' }}>/9</span>
      </div>

      <span style={{ color: '#334155', fontSize: 18 }}>|</span>

      {/* Phase indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          fontSize: 13, fontWeight: 800, color,
          background: `${color}22`,
          border: `1px solid ${color}66`,
          borderRadius: 6, padding: '2px 10px',
          letterSpacing: 0.5,
        }}>
          {PHASE_LABELS[currentPhase]}
        </span>
      </div>

      {/* Phase progress dots */}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {GAME_PHASES.map(ph => (
          <div key={ph} title={PHASE_LABELS[ph]} style={{
            width: ph === currentPhase ? 10 : 6,
            height: ph === currentPhase ? 10 : 6,
            borderRadius: '50%',
            background: ph === currentPhase ? color : GAME_PHASES.indexOf(ph) < GAME_PHASES.indexOf(currentPhase) ? '#475569' : '#1e293b',
            border: `1px solid ${ph === currentPhase ? color : '#334155'}`,
            transition: 'all 0.2s',
          }} />
        ))}
      </div>

      <span style={{ color: '#334155', fontSize: 18 }}>|</span>

      {/* Consul display */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 11, color: '#94a3b8' }}>
        <span style={{ color: '#f87171', fontWeight: 700 }}>Consul:</span>
        <span style={{ color: '#f0e6b0' }}>{consul}</span>
        <span style={{ color: '#475569' }}>|</span>
        <span style={{ color: '#f87171', fontWeight: 700 }}>Proconsul:</span>
        <span style={{ color: '#f0e6b0' }}>{proconsul}</span>
      </div>

      <span style={{ color: '#334155', fontSize: 18 }}>|</span>

      {/* Deck info */}
      <span style={{ fontSize: 11, color: '#64748b' }}>
        山札: <strong style={{ color: '#94a3b8' }}>{stratDeckSize}</strong>枚
      </span>

      {/* Player side badge */}
      <div style={{
        marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
        background: playerSide === 'Rome' ? 'rgba(248,113,113,0.12)' : 'rgba(96,165,250,0.12)',
        border: `1px solid ${playerSide === 'Rome' ? 'rgba(248,113,113,0.4)' : 'rgba(96,165,250,0.4)'}`,
        borderRadius: 6, padding: '3px 10px',
      }}>
        <span style={{ fontSize: 10, color: playerSide === 'Rome' ? '#f87171' : '#60a5fa', fontWeight: 700 }}>
          YOU: {playerSide}
        </span>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {currentPhase === 'Strategy' && !cardsDealt && (
          <button
            onClick={onDealCards}
            style={{
              background: '#059669', border: 'none', color: 'white',
              fontWeight: 700, fontSize: 12, padding: '6px 14px',
              borderRadius: 6, cursor: 'pointer',
            }}
          >
            🂠 Deal Cards
          </button>
        )}
        {currentPhase === 'Strategy' && cardsDealt && (
          <span style={{ fontSize: 11, color: '#059669', fontWeight: 700, alignSelf: 'center' }}>
            配布済み
          </span>
        )}
        {currentPhase === 'Consular' && (
          <button
            onClick={onElection}
            style={{
              background: '#dc2626', border: 'none', color: 'white',
              fontWeight: 700, fontSize: 12, padding: '6px 14px',
              borderRadius: 6, cursor: 'pointer',
            }}
          >
            🏛 Execute Election
          </button>
        )}
        <button
          onClick={onNextPhase}
          style={{
            background: color, border: 'none', color: 'white',
            fontWeight: 700, fontSize: 12, padding: '6px 14px',
            borderRadius: 6, cursor: 'pointer',
          }}
        >
          {currentPhase === 'Consular' ? 'Next Turn →' : 'Next Phase →'}
        </button>
        <button
          onClick={onNewGame}
          title="セーブデータを削除して最初から"
          style={{
            background: 'none', border: '1px solid #334155', color: '#475569',
            fontWeight: 600, fontSize: 11, padding: '6px 10px',
            borderRadius: 6, cursor: 'pointer',
          }}
        >
          ↺ New Game
        </button>
      </div>
    </div>
  )
}
