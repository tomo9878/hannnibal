import type { PreviewData } from '../types'
import { GENERAL_STATS } from '../data/generals'
import { PRIORITY_STYLE } from '../data/cards'

export function PreviewPanel({ data, cursor }: { data: PreviewData; cursor: { x: number; y: number } }) {
  if (!data) return null

  const W = 330
  const estimatedH = data.kind === 'card' ? 480 : data.kind === 'piece' ? 285 : 240
  const margin = 12
  let left = cursor.x + 20
  let top  = cursor.y - estimatedH / 2
  if (left + W > window.innerWidth - margin) left = cursor.x - W - 20
  top = Math.max(margin, Math.min(window.innerHeight - estimatedH - margin, top))

  const panelStyle: React.CSSProperties = {
    position: 'fixed', left, top, width: W, zIndex: 200,
    pointerEvents: 'none',
    background: 'rgba(10, 15, 25, 0.96)',
    border: '1px solid rgba(200,160,50,0.55)',
    borderRadius: 10,
    boxShadow: '0 6px 32px rgba(0,0,0,0.85), inset 0 0 24px rgba(200,160,50,0.04)',
    overflow: 'hidden',
  }

  if (data.kind === 'card') {
    const ps = data.priority ? PRIORITY_STYLE[data.priority] : null
    return (
      <div style={panelStyle}>
        <div style={{ position: 'relative' }}>
          <img src={data.imagePath} alt={data.name}
            style={{ width: '100%', display: 'block', borderRadius: '10px 10px 0 0' }} />
          {data.isBack && ps && (
            <div style={{
              position: 'absolute', top: 8, left: 8,
              fontSize: 28, fontWeight: 900, lineHeight: 1,
              color: ps.fg, backgroundColor: ps.bg,
              borderRadius: 6, padding: '2px 8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
            }}>{data.priority}</div>
          )}
        </div>
        <div style={{ padding: '8px 10px', borderTop: '1px solid rgba(200,160,50,0.2)' }}>
          <p style={{ fontSize: 11, color: '#c8a840', fontWeight: 700, margin: 0 }}>
            {data.isBack ? '（未公開）' : data.name}
          </p>
        </div>
      </div>
    )
  }

  if (data.kind === 'piece') {
    const { piece, stackedWith } = data
    const stats = piece.label ? GENERAL_STATS[piece.label] : null
    const sideColor = stats?.side === 'Rome' ? '#60a5fa' : stats?.side === 'Carthage' ? '#f87171' : '#a3a3a3'
    return (
      <div style={panelStyle}>
        <div style={{ display: 'flex', gap: 10, padding: 12 }}>
          <img src={piece.imagePath} alt={piece.label ?? piece.type}
            style={{ width: 72, height: 72, objectFit: 'contain', flexShrink: 0,
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))' }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#f0e6b0', margin: '0 0 4px' }}>
              {piece.label ?? piece.type}
            </p>
            {stats && (
              <>
                <p style={{ fontSize: 10, color: sideColor, margin: '0 0 6px', fontWeight: 600 }}>{stats.side}</p>
                <table style={{ fontSize: 11, borderCollapse: 'collapse', width: '100%' }}>
                  <tbody>
                    <tr>
                      <td style={{ color: '#94a3b8', paddingRight: 8 }}>SR 戦略</td>
                      <td style={{ color: '#fbbf24', fontWeight: 700 }}>{stats.strategy}</td>
                    </tr>
                    <tr>
                      <td style={{ color: '#94a3b8', paddingRight: 8 }}>BR 戦闘</td>
                      <td style={{ color: '#fbbf24', fontWeight: 700 }}>{stats.combat}</td>
                    </tr>
                    <tr>
                      <td style={{ color: '#94a3b8', paddingRight: 8 }}>CC 指揮</td>
                      <td style={{ color: '#60a5fa', fontWeight: 700 }}>{stats.command}</td>
                    </tr>
                  </tbody>
                </table>
              </>
            )}
            {!stats && <p style={{ fontSize: 10, color: '#64748b' }}>{piece.type}</p>}
          </div>
        </div>
        {stackedWith.length > 0 && (
          <div style={{ borderTop: '1px solid rgba(200,160,50,0.2)', padding: '6px 12px' }}>
            <p style={{ fontSize: 10, color: '#94a3b8', margin: '0 0 4px' }}>同スペースに共存:</p>
            {stackedWith.map(p => (
              <p key={p.id} style={{ fontSize: 10, color: '#c8a840', margin: 0 }}>
                • {p.label ?? p.type}
              </p>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (data.kind === 'city') {
    const romePC  = data.pieces.find(p => p.type === 'PC' && p.imagePath.includes('RomePC'))
    const carthPC = data.pieces.find(p => p.type === 'PC' && p.imagePath.includes('CarthPC'))
    const controlColor = romePC ? '#60a5fa' : carthPC ? '#f87171' : '#94a3b8'
    const controlLabel = romePC ? 'Rome'    : carthPC ? 'Carthage' : 'Neutral'
    const militaryPieces = data.pieces.filter(p => p.type !== 'PC')
    return (
      <div style={panelStyle}>
        <div style={{ padding: '10px 12px 6px', borderBottom: '1px solid rgba(200,160,50,0.2)' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#f0e6b0', margin: '0 0 4px' }}>{data.city.name}</p>
          <span style={{ fontSize: 10, fontWeight: 600, color: controlColor,
            background: 'rgba(255,255,255,0.07)', borderRadius: 4, padding: '1px 6px' }}>
            {controlLabel}
          </span>
        </div>
        <div style={{ padding: '8px 12px' }}>
          {militaryPieces.length === 0 ? (
            <p style={{ fontSize: 10, color: '#64748b', margin: 0 }}>ユニットなし</p>
          ) : (
            militaryPieces.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <img src={p.imagePath} alt={p.label ?? p.type}
                  style={{ width: 22, height: 22, objectFit: 'contain',
                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))' }} />
                <span style={{ fontSize: 10, color: '#c8a840' }}>{p.label ?? p.type}</span>
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  return null
}
