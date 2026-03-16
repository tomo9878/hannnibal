import { useState } from 'react'
import type { RemovedCard } from '../types'
import { SIDE_LABEL, SIDE_COLOR } from '../data/cards'

function RemovedCardTile({ card }: { card: RemovedCard }) {
  const [imgError, setImgError] = useState(false)
  const sideColor = SIDE_COLOR[card.side]
  return (
    <div style={{
      width: 40, height: 62, borderRadius: 4, overflow: 'hidden',
      border: `1px solid ${sideColor}55`,
      position: 'relative', flexShrink: 0,
      filter: 'grayscale(0.3) brightness(0.7)',
    }}>
      {!imgError
        ? <img src={card.imagePath} alt={card.name} onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <div style={{ width: '100%', height: '100%', background: '#1e293b',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 2 }}>
            <span style={{ fontSize: 6, color: '#94a3b8', textAlign: 'center', lineHeight: 1.2 }}>{card.name}</span>
          </div>
      }
      {/* OPs バッジ */}
      <div style={{
        position: 'absolute', top: 0, right: 0,
        background: 'rgba(0,0,0,0.8)', color: '#94a3b8',
        fontSize: 8, fontWeight: 900, padding: '1px 3px', lineHeight: '12px',
      }}>
        {card.ops}
      </div>
      {/* 除外マーク */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.35)',
      }}>
        <span style={{ fontSize: 14, opacity: 0.8 }}>🚫</span>
      </div>
    </div>
  )
}

export function RemovedCardsPanel({ cards }: { cards: RemovedCard[] }) {
  const [open, setOpen] = useState(false)
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  if (cards.length === 0) return null

  return (
    <div style={{
      background: 'rgba(15,23,42,0.7)',
      border: '1px solid rgba(220,38,38,0.4)',
      borderRadius: 8, overflow: 'hidden',
    }}>
      {/* ヘッダー（クリックで開閉） */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: '8px 12px', background: 'none', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#f87171',
            textTransform: 'uppercase', letterSpacing: 1 }}>
            Removed from Play
          </span>
          <span style={{
            background: '#7f1d1d', color: '#fca5a5', fontSize: 10, fontWeight: 800,
            borderRadius: 10, padding: '0 6px', lineHeight: '18px',
          }}>
            {cards.length}
          </span>
        </div>
        <span style={{ fontSize: 10, color: '#64748b' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{ borderTop: '1px solid rgba(220,38,38,0.2)', padding: '8px 12px 10px' }}>
          <p style={{ fontSize: 9, color: '#64748b', margin: '0 0 8px', lineHeight: 1.5 }}>
            これらのカードはゲームから永久に除外されています（捨て札に戻りません）
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {cards.map((card, i) => {
              const sideColor = SIDE_COLOR[card.side]
              const isHovered = hoveredIdx === i
              return (
                <div
                  key={i}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  style={{ position: 'relative', cursor: 'default' }}
                >
                  <RemovedCardTile card={card} />
                  {/* ホバーツールチップ */}
                  {isHovered && (
                    <div style={{
                      position: 'absolute', bottom: '110%', left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'rgba(10,15,25,0.97)',
                      border: `1px solid ${sideColor}66`,
                      borderRadius: 6, padding: '6px 10px',
                      minWidth: 160, maxWidth: 220,
                      zIndex: 100, pointerEvents: 'none',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.8)',
                    }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: '#f0e6b0', margin: '0 0 4px', lineHeight: 1.3 }}>
                        {card.name}
                      </p>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 9, color: '#93c5fd', background: '#1e3a5f',
                          padding: '1px 5px', borderRadius: 3 }}>OPs {card.ops}</span>
                        <span style={{ fontSize: 9, color: sideColor, background: `${sideColor}22`,
                          padding: '1px 5px', borderRadius: 3 }}>{SIDE_LABEL[card.side]}</span>
                        {card.counter && (
                          <span style={{ fontSize: 9, color: '#fbbf24', background: '#78350f',
                            padding: '1px 5px', borderRadius: 3 }}>Counter</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
