import type { BoardPiece, City, SelectionState } from '../types'
import { GENERAL_STATS } from '../data/generals'

export function SelectionPanel({ selection, pieces, setPieces, cities, setSelection }: {
  selection: SelectionState
  pieces: BoardPiece[]
  setPieces: React.Dispatch<React.SetStateAction<BoardPiece[]>>
  cities: City[]
  setSelection: (sel: SelectionState) => void
}) {
  const adjustStrength = (pieceId: string, delta: number) => {
    setPieces(prev => prev.map(p =>
      p.id === pieceId ? { ...p, strength: Math.max(0, (p.strength ?? 0) + delta) } : p
    ))
  }

  const renderGeneral = (piece: BoardPiece) => {
    const stats = piece.label ? GENERAL_STATS[piece.label] : null
    const sideColor = stats?.side === 'Rome' ? '#f87171' : stats?.side === 'Carthage' ? '#60a5fa' : '#94a3b8'
    return (
      <div key={piece.id} className="space-y-3">
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <img src={piece.imagePath} alt={piece.label}
            style={{ width: 80, height: 80, objectFit: 'contain',
              filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.8))' }} />
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#f0e6b0', margin: '0 0 4px' }}>
              {piece.label ?? piece.type}
            </p>
            {stats && <p style={{ fontSize: 11, color: sideColor, fontWeight: 600, margin: 0 }}>{stats.side}</p>}
          </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '10px 12px' }}>
          <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 8px' }}>兵力 (CU)</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button
              onClick={() => adjustStrength(piece.id, -1)}
              style={{ width: 34, height: 34, borderRadius: 6, background: '#dc2626',
                border: 'none', color: 'white', fontSize: 22, fontWeight: 700,
                cursor: 'pointer', lineHeight: 1 }}
            >−</button>
            <span style={{ fontSize: 32, fontWeight: 900, color: '#fbbf24',
              minWidth: 44, textAlign: 'center' }}>
              {piece.strength ?? 0}
            </span>
            <button
              onClick={() => adjustStrength(piece.id, +1)}
              style={{ width: 34, height: 34, borderRadius: 6, background: '#16a34a',
                border: 'none', color: 'white', fontSize: 22, fontWeight: 700,
                cursor: 'pointer', lineHeight: 1 }}
            >＋</button>
          </div>
        </div>
        {stats && (
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '10px 16px' }}>
            <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 8px' }}>能力値</p>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 26, fontWeight: 900, color: '#fbbf24', margin: 0 }}>{stats.strategy}</p>
                <p style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>SR 戦略</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 26, fontWeight: 900, color: '#fbbf24', margin: 0 }}>{stats.combat}</p>
                <p style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>BR 戦闘</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 26, fontWeight: 900, color: '#60a5fa', margin: 0 }}>{stats.command}</p>
                <p style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>CC 指揮</p>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (!selection) {
    return (
      <div className="bg-slate-800 rounded p-4">
        <h2 className="text-yellow-400 font-bold text-sm tracking-wide uppercase mb-2">Selection Details</h2>
        <p className="text-slate-500 text-xs">将軍または都市をクリックして詳細を表示</p>
      </div>
    )
  }

  if (selection.kind === 'general') {
    const piece = pieces.find(p => p.id === selection.pieceId)
    if (!piece) return null
    return (
      <div className="bg-slate-800 rounded p-4">
        <h2 className="text-yellow-400 font-bold text-sm tracking-wide uppercase mb-3">Selection Details</h2>
        {renderGeneral(piece)}
      </div>
    )
  }

  if (selection.kind === 'city') {
    const city = cities.find(c => c.name === selection.cityName)
    if (!city) return null
    const generals = pieces.filter(p =>
      p.type === 'General' &&
      Math.round(p.x) === Math.round(city.x) &&
      Math.round(p.y) === Math.round(city.y)
    )
    const cityLabel = city.name.includes(' - ') ? city.name.split(' - ')[1] : city.name
    return (
      <div className="bg-slate-800 rounded p-4">
        <h2 className="text-yellow-400 font-bold text-sm tracking-wide uppercase mb-1">Selection Details</h2>
        <p className="text-slate-400 text-xs mb-3">{cityLabel}</p>
        {generals.length === 0 ? (
          <p className="text-slate-500 text-xs">この都市に将軍はいません</p>
        ) : (
          <div className="space-y-4">
            {generals.map((g, i) => (
              <div key={g.id}>
                <button
                  onClick={() => setSelection({ kind: 'general', pieceId: g.id })}
                  style={{ background: 'none', border: 'none', padding: 0, width: '100%', cursor: 'pointer', textAlign: 'left' }}
                >
                  {renderGeneral(g)}
                </button>
                {i < generals.length - 1 && (
                  <hr style={{ borderColor: 'rgba(200,160,50,0.2)', margin: '12px 0 0' }} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return null
}
