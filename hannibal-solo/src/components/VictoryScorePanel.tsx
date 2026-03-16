import { useState } from 'react'
import type { VictoryScore } from '../data/provinces'

interface Props {
  score: VictoryScore
  currentTurn: number
}

export function VictoryScorePanel({ score, currentTurn }: Props) {
  const [open, setOpen] = useState(false)
  const { rome, carthage, provinces } = score
  const total = provinces.length

  const romeColor    = '#f87171'
  const carthColor   = '#60a5fa'
  const neutralColor = '#64748b'

  return (
    <div style={{
      background: 'rgba(10,15,25,0.9)',
      border: '1px solid rgba(200,160,50,0.4)',
      borderRadius: 8, overflow: 'hidden',
    }}>
      {/* Header — always visible */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <span style={{ fontSize: 10, fontWeight: 700, color: '#c8a840', textTransform: 'uppercase', letterSpacing: 1 }}>
          Province Score
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Rome score */}
          <span style={{ fontSize: 13, fontWeight: 900, color: romeColor }}>{rome}</span>
          <span style={{ fontSize: 10, color: '#475569' }}>:</span>
          {/* Carthage score */}
          <span style={{ fontSize: 13, fontWeight: 900, color: carthColor }}>{carthage}</span>
          <span style={{ fontSize: 9, color: neutralColor }}>/ {total}</span>
          <span style={{ fontSize: 10, color: '#475569' }}>{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {/* Summary bar */}
      <div style={{ padding: '0 12px 8px', display: 'flex', gap: 12, alignItems: 'center' }}>
        <span style={{ fontSize: 9, color: romeColor, fontWeight: 600 }}>Rome: {rome}</span>
        <div style={{
          flex: 1, height: 6, borderRadius: 3, background: '#1e293b', overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex', height: '100%',
          }}>
            <div style={{ width: `${(rome / total) * 100}%`, background: romeColor, transition: 'width 0.4s' }} />
            <div style={{ width: `${(carthage / total) * 100}%`, background: carthColor, transition: 'width 0.4s' }} />
          </div>
        </div>
        <span style={{ fontSize: 9, color: carthColor, fontWeight: 600 }}>Carth: {carthage}</span>
      </div>

      {/* Turn 9 note */}
      {currentTurn === 9 && (
        <div style={{ padding: '0 12px 6px' }}>
          <span style={{ fontSize: 8, color: '#f59e0b' }}>
            ※ T9終了時同数はカルタゴ（Hannibal）の勝利
          </span>
        </div>
      )}

      {/* Province detail list */}
      {open && (
        <div style={{ borderTop: '1px solid rgba(200,160,50,0.15)', maxHeight: 260, overflowY: 'auto' }}>
          {provinces.map(p => {
            const ctrl = p.controller
            const ctrlColor = ctrl === 'Rome' ? romeColor : ctrl === 'Carthage' ? carthColor : neutralColor
            const ctrlLabel = ctrl ?? '—'
            return (
              <div key={p.province} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '4px 12px',
                borderLeft: `3px solid ${ctrlColor}`,
                borderBottom: '1px solid rgba(255,255,255,0.03)',
                background: ctrl ? `${ctrlColor}0a` : 'transparent',
              }}>
                <span style={{ flex: 1, fontSize: 10, color: '#cbd5e1' }}>{p.province}</span>
                <span style={{ fontSize: 9, color: romeColor, minWidth: 14, textAlign: 'right' }}>{p.romeCount > 0 ? p.romeCount : ''}</span>
                <span style={{ fontSize: 8, color: '#475569' }}>/{p.total}</span>
                <span style={{ fontSize: 9, color: carthColor, minWidth: 14, textAlign: 'left' }}>{p.carthCount > 0 ? p.carthCount : ''}</span>
                <span style={{
                  fontSize: 8, fontWeight: 700, color: ctrlColor,
                  minWidth: 52, textAlign: 'right',
                }}>{ctrlLabel}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
