import type { VictoryScore } from '../data/provinces'

interface Props {
  winner: 'Rome' | 'Carthage'
  reason: string
  score: VictoryScore
  onClose: () => void
}

export function VictoryModal({ winner, reason, score, onClose }: Props) {
  const isRome   = winner === 'Rome'
  const mainColor = isRome ? '#f87171' : '#60a5fa'
  const bgGlow    = isRome ? 'rgba(248,113,113,0.08)' : 'rgba(96,165,250,0.08)'

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(0,0,0,0.88)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: `linear-gradient(135deg, rgba(10,15,25,0.99) 0%, ${bgGlow} 100%)`,
        border: `2px solid ${mainColor}`,
        borderRadius: 14, padding: '32px 40px', maxWidth: 480, width: '90%',
        boxShadow: `0 0 60px ${mainColor}44, 0 8px 48px rgba(0,0,0,0.9)`,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>
          {isRome ? '🦅' : '🐘'}
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: mainColor, margin: '0 0 8px', letterSpacing: 1 }}>
          {winner} Victory!
        </h1>
        <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 20px', lineHeight: 1.6 }}>
          {reason}
        </p>

        {/* Score summary */}
        <div style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(200,160,50,0.2)',
          borderRadius: 8, padding: '12px 16px', marginBottom: 20,
          display: 'flex', justifyContent: 'space-around',
        }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#f87171' }}>{score.rome}</div>
            <div style={{ fontSize: 10, color: '#64748b' }}>Rome</div>
          </div>
          <div style={{ fontSize: 20, color: '#475569', alignSelf: 'center' }}>vs</div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#60a5fa' }}>{score.carthage}</div>
            <div style={{ fontSize: 10, color: '#64748b' }}>Carthage</div>
          </div>
        </div>

        {/* Province breakdown */}
        <div style={{ textAlign: 'left', marginBottom: 20, maxHeight: 180, overflowY: 'auto' }}>
          {score.provinces.filter(p => p.controller).map(p => (
            <div key={p.province} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
              fontSize: 10,
            }}>
              <span style={{ color: '#cbd5e1' }}>{p.province}</span>
              <span style={{
                color: p.controller === 'Rome' ? '#f87171' : '#60a5fa',
                fontWeight: 700,
              }}>{p.controller}</span>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          style={{
            background: mainColor, border: 'none', color: '#000',
            fontWeight: 800, fontSize: 13, padding: '10px 28px',
            borderRadius: 8, cursor: 'pointer', letterSpacing: 0.5,
          }}
        >
          閉じる
        </button>
      </div>
    </div>
  )
}
